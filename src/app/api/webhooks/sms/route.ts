/**
 * Inbound SMS Webhook (Twilio)
 *
 * Receives inbound SMS messages for phone employees that use the
 * 'twilio-vapi' provisioning mode (Twilio-owned number). Twilio
 * POSTs to this URL when an SMS arrives on the employee's number.
 *
 * Saves the message to phone_messages and optionally triggers an
 * automated reply via the employee's configured job type.
 *
 * POST /api/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Parse Twilio's form-encoded body
  const formData = await request.formData()

  const from = formData.get('From') as string        // caller's phone number
  const to = formData.get('To') as string            // our employee's number
  const body = formData.get('Body') as string        // SMS message text
  const messageSid = formData.get('MessageSid') as string

  // Validate Twilio signature
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (authToken && !authToken.startsWith('placeholder')) {
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms`
    const params: Record<string, string> = {}
    formData.forEach((value, key) => { params[key] = value as string })

    const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
    if (!isValid) {
      console.warn('[SMS Webhook] Invalid Twilio signature')
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  if (!from || !to || !body) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Find the employee associated with this Twilio number
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('id, business_id, name, job_type, job_config')
    .eq('phone_number', to)
    .eq('phone_provider', 'twilio-vapi')
    .eq('is_active', true)
    .single()

  if (!employee) {
    console.warn(`[SMS Webhook] No employee found for number ${to}`)
    // Return empty TwiML so Twilio doesn't retry
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Save the inbound SMS to phone_messages
  const { error: saveError } = await supabase.from('phone_messages').insert({
    business_id: employee.business_id,
    employee_id: employee.id,
    caller_phone: from,
    reason: 'Inbound SMS',
    full_message: body,
    created_at: new Date().toISOString(),
  })

  if (saveError) {
    console.error('[SMS Webhook] Failed to save message:', saveError)
  }

  console.log(`[SMS Webhook] Received SMS for employee ${employee.id} from ${from}: "${body.substring(0, 80)}"`)

  // Build an auto-reply using TwiML
  // For now: acknowledge receipt. Future: route to AI for a smart reply.
  const replyText = buildAutoReply(employee.name, employee.job_config)

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(replyText)}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function buildAutoReply(employeeName: string, jobConfig: any): string {
  if (jobConfig?.smsAutoReply) {
    return jobConfig.smsAutoReply
  }
  return `Hi! You've reached ${employeeName}. We received your message and will get back to you shortly.`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
