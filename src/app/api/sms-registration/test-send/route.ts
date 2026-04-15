/**
 * POST /api/sms-registration/test-send
 *
 * Sends a one-time test SMS from the tenant's A2P-registered number to
 * a destination of their choice. Only works once sms_enabled=true on
 * the business; otherwise returns a clear error. Counts against the
 * monthly SMS quota like any other send.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { sendSmsForBusiness } from '@/lib/a2p/sms-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, toPhone } = body as { businessId: string; toPhone: string }

    if (!businessId || !toPhone) {
      return NextResponse.json({ error: 'businessId and toPhone required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Pick the business's primary Twilio number (first active employee with one)
    const { data: emp } = await supabase
      .from('phone_employees')
      .select('phone_number, name')
      .eq('business_id', businessId)
      .eq('phone_provider', 'twilio-vapi')
      .eq('is_active', true)
      .not('phone_number', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!emp?.phone_number) {
      return NextResponse.json(
        { error: 'No Twilio-owned number available. Create a phone employee with a Twilio number first.' },
        { status: 400 }
      )
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .maybeSingle()

    const businessName = biz?.name || 'your business'
    const body2 = `Test from ${businessName} — your AI's SMS is working. This is a one-time test. Reply STOP to opt out.`

    const result = await sendSmsForBusiness({
      businessId,
      to: toPhone,
      from: emp.phone_number,
      body: body2,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Send failed',
          blocked: result.blocked,
          segmentsUsed: result.segmentsUsed,
          segmentsLimit: result.segmentsLimit,
        },
        { status: result.blocked === 'sms_not_enabled' ? 409 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      from: emp.phone_number,
      to: toPhone,
      sid: result.sid,
      segmentsUsed: result.segmentsUsed,
      segmentsLimit: result.segmentsLimit,
    })
  } catch (err: any) {
    console.error('[sms-registration/test-send]', err)
    return NextResponse.json({ error: err.message || 'Failed to send test SMS' }, { status: 500 })
  }
}
