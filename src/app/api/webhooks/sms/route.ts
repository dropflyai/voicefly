/**
 * Inbound SMS Webhook (Twilio)
 *
 * Receives inbound SMS messages for phone employees that use the
 * 'twilio-vapi' provisioning mode (Twilio-owned number). Twilio
 * POSTs to this URL when an SMS arrives on the employee's number.
 *
 * Returns empty TwiML immediately, then processes the message
 * asynchronously: generates an AI response and sends it via
 * Twilio REST API.
 *
 * POST /api/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { generateSmsResponse } from '@/lib/sms/ai-responder'
import { sendSms } from '@/lib/sms/twilio-client'
// Credit system removed — SMS is an included feature

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'cancel', 'quit', 'end']
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const from = formData.get('From') as string
  const to = formData.get('To') as string
  const body = formData.get('Body') as string
  const messageSid = formData.get('MessageSid') as string

  // Validate Twilio signature — always required
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('[SMS Webhook] TWILIO_AUTH_TOKEN not configured')
    return new NextResponse('Service Unavailable', { status: 503 })
  }
  const twilioSignature = request.headers.get('x-twilio-signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms`
  const params: Record<string, string> = {}
  formData.forEach((value, key) => { params[key] = value as string })

  const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
  if (!isValid) {
    console.warn('[SMS Webhook] Invalid Twilio signature')
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!from || !to || !body) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Find the employee associated with this Twilio number
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('id, business_id, name, job_type, job_config, schedule')
    .eq('phone_number', to)
    .eq('phone_provider', 'twilio-vapi')
    .eq('is_active', true)
    .single()

  if (!employee) {
    console.warn(`[SMS Webhook] No employee found for number ${to}`)
    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  console.log(`[SMS Webhook] Received SMS for employee ${employee.id} from ${from}: "${body.substring(0, 80)}"`)

  // Save inbound to phone_messages (backward compat with dashboard)
  supabase.from('phone_messages').insert({
    business_id: employee.business_id,
    employee_id: employee.id,
    caller_phone: from,
    reason: 'Inbound SMS',
    full_message: body,
    created_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.error('[SMS Webhook] phone_messages save error:', error)
  })

  // Save inbound to communication_logs (for conversation threading)
  supabase.from('communication_logs').insert({
    business_id: employee.business_id,
    employee_id: employee.id,
    type: 'sms',
    direction: 'inbound',
    to_phone: to,
    from_phone: from,
    customer_phone: from,
    content: body,
    status: 'received',
    metadata: { twilioSid: messageSid },
  }).then(({ error }) => {
    if (error) console.error('[SMS Webhook] communication_logs save error:', error)
  })

  // Return empty TwiML immediately — reply sent asynchronously
  // Fire async processing (non-blocking)
  processInboundSms(employee, from, to, body).catch(err => {
    console.error('[SMS Webhook] Async processing error:', err)
  })

  return new NextResponse(EMPTY_TWIML, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ============================================
// ASYNC PROCESSING
// ============================================

async function processInboundSms(
  employee: any,
  customerPhone: string,
  employeePhone: string,
  message: string
) {
  // Check opt-out keywords
  if (OPT_OUT_KEYWORDS.includes(message.trim().toLowerCase())) {
    console.log(`[SMS Webhook] Opt-out keyword from ${customerPhone}, skipping AI reply`)
    return
  }

  // Rate limit: max 5 inbound SMS from same number in 60 seconds
  const { count } = await supabase
    .from('communication_logs')
    .select('id', { count: 'exact', head: true })
    .eq('customer_phone', customerPhone)
    .eq('direction', 'inbound')
    .eq('type', 'sms')
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())

  if (count && count > 5) {
    console.warn(`[SMS Webhook] Rate limit hit for ${customerPhone} (${count} in 60s)`)
    return
  }

  // Trial tier gating: AI SMS conversations are a paid-only feature
  const { data: business } = await supabase
    .from('businesses')
    .select('subscription_tier, subscription_status')
    .eq('id', employee.business_id)
    .single()

  const isTrial = !business || business.subscription_status === 'trial' || business.subscription_tier === 'trial'
  if (isTrial) {
    console.log(`[SMS Webhook] Trial business ${employee.business_id}, sending static reply`)
    const fallback = employee.job_config?.smsAutoReply ||
      `Hi! You've reached ${employee.name}. We received your message and will get back to you shortly.`
    await sendAndLog(fallback, employee, customerPhone, employeePhone)
    return
  }

  // SMS is an included feature — no minute check needed

  // Generate AI response
  const reply = await generateSmsResponse({
    employee,
    customerPhone,
    inboundMessage: message,
  })

  if (!reply) {
    console.error('[SMS Webhook] Empty AI response')
    return
  }

  // Send reply and log
  await sendAndLog(reply, employee, customerPhone, employeePhone)

  // SMS is an included feature — no deduction
}

async function sendAndLog(
  reply: string,
  employee: any,
  customerPhone: string,
  employeePhone: string
) {
  const result = await sendSms({
    to: customerPhone,
    from: employeePhone,
    body: reply,
  })

  if (!result.success) {
    console.error(`[SMS Webhook] Failed to send reply to ${customerPhone}:`, result.error)
    return
  }

  console.log(`[SMS Webhook] Sent AI reply to ${customerPhone}: "${reply.substring(0, 80)}"`)

  // Log outbound reply to communication_logs
  await supabase.from('communication_logs').insert({
    business_id: employee.business_id,
    employee_id: employee.id,
    type: 'sms',
    direction: 'outbound',
    to_phone: customerPhone,
    from_phone: employeePhone,
    customer_phone: customerPhone,
    content: reply,
    status: 'sent',
    metadata: { trigger: 'ai_auto_reply', twilioSid: result.sid },
  })
}
