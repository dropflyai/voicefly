import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

/**
 * POST /api/sms/send
 * Authenticated endpoint for sending SMS from the dashboard.
 * Body: { businessId, to, message, employeeId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, to, message, employeeId } = body

    if (!businessId || !to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId, to, message' },
        { status: 400 }
      )
    }

    // Validate auth
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    // Validate Twilio config
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 503 }
      )
    }

    // Resolve from number: use business's AI phone number if available, else platform default
    let fromNumber = TWILIO_PHONE_NUMBER
    const { data: business } = await supabase
      .from('businesses')
      .select('ai_phone_number')
      .eq('id', businessId)
      .single()

    if (business?.ai_phone_number) {
      fromNumber = business.ai_phone_number
    }

    // Send via Twilio REST API
    const authHeader = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const params = new URLSearchParams({
      To: to,
      From: fromNumber!,
      Body: message,
    })

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error(`[SMS Send] Twilio error (${resp.status}):`, errBody)
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 502 }
      )
    }

    const result = await resp.json()

    // Log to communication_logs
    await supabase.from('communication_logs').insert({
      business_id: businessId,
      employee_id: employeeId || null,
      type: 'sms',
      direction: 'outbound',
      to_phone: to,
      from_phone: fromNumber,
      customer_phone: to,
      content: message,
      status: 'sent',
      metadata: { trigger: 'manual', twilioSid: result.sid },
    })

    // Deduct SMS credit
    const { default: CreditSystem, CreditCost } = await import('@/lib/credit-system')
    CreditSystem.deductCredits(businessId, CreditCost.SMS_OUTBOUND, 'sms_outbound', {
      to,
      twilioSid: result.sid,
    }).catch(err => console.error('[SMS Send] Credit deduction error:', err))

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
    })
  } catch (error) {
    console.error('[SMS Send] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
