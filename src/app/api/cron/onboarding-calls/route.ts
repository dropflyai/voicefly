import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET
const VOICEFLY_BUSINESS_ID = process.env.VOICEFLY_BUSINESS_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://voicefly.app'

/**
 * POST /api/cron/onboarding-calls
 *
 * Called daily by n8n. Finds new VoiceFly customers (trial accounts 1–6 days old)
 * with incomplete onboarding and fires outbound calls from Sam (VoiceFly Onboarding).
 *
 * Deduplication: skips businesses that already received a call from Sam in the last 24h.
 * Qualification: skips businesses that are >= 75% onboarded.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VOICEFLY_BUSINESS_ID) {
    return NextResponse.json({ error: 'VOICEFLY_BUSINESS_ID not configured' }, { status: 500 })
  }

  // Get Sam, the VoiceFly Onboarding employee
  const { data: employee, error: empError } = await supabase
    .from('phone_employees')
    .select('id, vapi_assistant_id, vapi_phone_id, name')
    .eq('business_id', VOICEFLY_BUSINESS_ID)
    .eq('name', 'VoiceFly Onboarding')
    .eq('is_active', true)
    .not('vapi_assistant_id', 'is', null)
    .not('vapi_phone_id', 'is', null)
    .single()

  if (empError || !employee) {
    console.error('[onboarding-calls] VoiceFly Onboarding employee not found:', empError)
    return NextResponse.json({ error: 'Onboarding employee not configured' }, { status: 500 })
  }

  // Find trial businesses created in the last 6 days with a contact phone
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, phone_number')
    .eq('subscription_status', 'trial')
    .gte('created_at', sixDaysAgo)
    .not('id', 'eq', VOICEFLY_BUSINESS_ID)   // don't call ourselves
    .not('phone_number', 'is', null)

  if (bizError) {
    console.error('[onboarding-calls] DB error fetching businesses:', bizError)
    return NextResponse.json({ error: bizError.message }, { status: 500 })
  }

  if (!businesses?.length) {
    return NextResponse.json({ fired: 0, skipped: 0, message: 'No new trial businesses to contact' })
  }

  let fired = 0
  let skipped = 0
  let failed = 0

  for (const business of businesses) {
    // Check if Sam already called this business in the last 24h
    const { count: recentCallCount } = await supabase
      .from('employee_calls')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('customer_phone', business.phone_number)
      .gte('created_at', oneDayAgo)

    if ((recentCallCount ?? 0) > 0) {
      skipped++
      continue
    }

    // Fetch onboarding progress
    let progress: {
      completionPercent: number
      daysActive: number
      phoneProvisioned: boolean
      employeesCreated: number
      firstCallMade: boolean
    }
    try {
      const res = await fetch(
        `${APP_URL}/api/internal/onboarding-progress?businessId=${business.id}`,
        { headers: { Authorization: `Bearer ${INTERNAL_API_SECRET}` } }
      )
      if (!res.ok) {
        console.warn(`[onboarding-calls] Could not fetch progress for ${business.id}`)
        skipped++
        continue
      }
      progress = await res.json()
    } catch {
      console.warn(`[onboarding-calls] Progress fetch failed for ${business.id}`)
      skipped++
      continue
    }

    // Skip businesses that are sufficiently onboarded
    if (progress.completionPercent >= 75) {
      skipped++
      continue
    }

    // Build a context-aware first message
    const firstName = business.name?.split(' ')[0]
    const nextStepHint = progress.employeesCreated === 0
      ? "It looks like you haven't created your first AI employee yet — that's the best place to start!"
      : !progress.phoneProvisioned
        ? "Your employee is almost ready — you just need to provision a phone number to go live!"
        : !progress.firstCallMade
          ? "You're almost there! Your employee is live — try giving the number a test call."
          : "You're making great progress — let me know if there's anything I can help with."

    const firstMessage = `Hi${firstName ? ` ${firstName}` : ''}, this is Sam calling from VoiceFly! I'm following up because you joined ${progress.daysActive} day${progress.daysActive === 1 ? '' : 's'} ago and I want to make sure you're getting the most out of your trial. ${nextStepHint} Do you have a couple of minutes?`

    try {
      const vapiCall = await fireOnboardingCall(business, employee, firstMessage)

      // Log the call
      await supabase.from('employee_calls').insert({
        call_id: vapiCall.id,
        business_id: VOICEFLY_BUSINESS_ID,
        employee_id: employee.id,
        customer_phone: business.phone_number,
        direction: 'outbound',
        status: 'initiated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      fired++
    } catch (err) {
      console.error(`[onboarding-calls] Failed to call business ${business.id}:`, err)
      failed++
    }
  }

  console.log(`[onboarding-calls] Done: ${fired} fired, ${failed} failed, ${skipped} skipped`)
  return NextResponse.json({ fired, failed, skipped })
}

async function fireOnboardingCall(
  business: { id: string; name: string; phone_number: string },
  employee: { vapi_assistant_id: string; vapi_phone_id: string; name: string },
  firstMessage: string
): Promise<{ id: string }> {
  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Onboarding - ${business.name}`,
      assistantId: employee.vapi_assistant_id,
      phoneNumberId: employee.vapi_phone_id,
      customer: {
        number: business.phone_number,
        name: business.name,
      },
      assistantOverrides: {
        firstMessage,
      },
      metadata: {
        targetBusinessId: business.id,
        callType: 'onboarding',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`VAPI error ${response.status}: ${JSON.stringify(err)}`)
  }

  return response.json()
}
