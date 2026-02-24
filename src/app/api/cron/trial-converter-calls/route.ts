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
 * POST /api/cron/trial-converter-calls
 *
 * Called daily by n8n. Finds VoiceFly trial customers whose trial expires
 * within the next 3 days and fires outbound conversion calls from Taylor.
 *
 * Deduplication: skips businesses already called by Taylor in the last 48h.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VOICEFLY_BUSINESS_ID) {
    return NextResponse.json({ error: 'VOICEFLY_BUSINESS_ID not configured' }, { status: 500 })
  }

  // Get Taylor, the VoiceFly Trial Converter employee
  const { data: employee, error: empError } = await supabase
    .from('phone_employees')
    .select('id, vapi_assistant_id, vapi_phone_id, name')
    .eq('business_id', VOICEFLY_BUSINESS_ID)
    .eq('name', 'VoiceFly Trial Converter')
    .eq('is_active', true)
    .not('vapi_assistant_id', 'is', null)
    .not('vapi_phone_id', 'is', null)
    .single()

  if (empError || !employee) {
    console.error('[trial-converter-calls] VoiceFly Trial Converter employee not found:', empError)
    return NextResponse.json({ error: 'Trial Converter employee not configured' }, { status: 500 })
  }

  // Find trial businesses expiring within the next 3 days with a contact phone
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, phone_number, trial_ends_at')
    .eq('subscription_status', 'trial')
    .lte('trial_ends_at', threeDaysFromNow)
    .gte('trial_ends_at', now.toISOString())   // trial not yet expired
    .not('id', 'eq', VOICEFLY_BUSINESS_ID)
    .not('phone_number', 'is', null)

  if (bizError) {
    console.error('[trial-converter-calls] DB error fetching businesses:', bizError)
    return NextResponse.json({ error: bizError.message }, { status: 500 })
  }

  if (!businesses?.length) {
    return NextResponse.json({ fired: 0, skipped: 0, message: 'No expiring trial businesses to contact' })
  }

  let fired = 0
  let skipped = 0
  let failed = 0

  for (const business of businesses) {
    // Check if Taylor already called this business in the last 48h
    const { count: recentCallCount } = await supabase
      .from('employee_calls')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('customer_phone', business.phone_number)
      .gte('created_at', twoDaysAgo)

    if ((recentCallCount ?? 0) > 0) {
      skipped++
      continue
    }

    // Fetch trial status from internal API
    let trialStatus: {
      daysRemaining: number | null
      callsMade: number
      employeesActive: number
      planOptions: string[]
    }
    try {
      const res = await fetch(
        `${APP_URL}/api/internal/trial-status?businessId=${business.id}`,
        { headers: { Authorization: `Bearer ${INTERNAL_API_SECRET}` } }
      )
      if (!res.ok) {
        console.warn(`[trial-converter-calls] Could not fetch trial status for ${business.id}`)
        skipped++
        continue
      }
      trialStatus = await res.json()
    } catch {
      console.warn(`[trial-converter-calls] Trial status fetch failed for ${business.id}`)
      skipped++
      continue
    }

    const daysLeft = trialStatus.daysRemaining ?? 0
    const firstName = business.name?.split(' ')[0]

    // Build a context-aware first message
    const usageSummary = trialStatus.callsMade > 0
      ? `I see you've already had ${trialStatus.callsMade} call${trialStatus.callsMade === 1 ? '' : 's'} handled by your AI employee — that's great!`
      : "I know you've had your trial running and I wanted to make sure you got a chance to see it in action."

    const urgency = daysLeft === 0
      ? "Your trial actually ends today"
      : daysLeft === 1
        ? "Your trial ends tomorrow"
        : `Your trial ends in ${daysLeft} days`

    const firstMessage = `Hi${firstName ? ` ${firstName}` : ''}, this is Taylor calling from VoiceFly. ${urgency} and I wanted to reach out personally before that happens. ${usageSummary} Do you have just a couple of minutes?`

    try {
      const vapiCall = await fireTrialConverterCall(business, employee, firstMessage)

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
      console.error(`[trial-converter-calls] Failed to call business ${business.id}:`, err)
      failed++
    }
  }

  console.log(`[trial-converter-calls] Done: ${fired} fired, ${failed} failed, ${skipped} skipped`)
  return NextResponse.json({ fired, failed, skipped })
}

async function fireTrialConverterCall(
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
      name: `Trial Conversion - ${business.name}`,
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
        callType: 'trial-converter',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`VAPI error ${response.status}: ${JSON.stringify(err)}`)
  }

  return response.json()
}
