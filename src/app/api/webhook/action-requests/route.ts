import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Supabase database webhook payload structure
interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: ActionRequest | null
  old_record: ActionRequest | null
}

interface ActionRequest {
  id: string
  business_id: string
  action_type: string
  target: Record<string, any>
  content: Record<string, any>
  status: string
  triggered_by: string | null
  source_call_id: string | null
  created_at: string
  updated_at: string
}

/**
 * POST /api/webhook/action-requests
 *
 * Triggered by Supabase database webhook on INSERT into action_requests.
 * Processes pending actions — currently handles send_sms via Twilio.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization') || ''
  const secret = authHeader.replace('Bearer ', '')
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: SupabaseWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only process inserts on action_requests
  if (payload.type !== 'INSERT' || !payload.record) {
    return NextResponse.json({ received: true })
  }

  const record = payload.record

  // Skip anything already handled or not pending
  if (record.status !== 'pending') {
    return NextResponse.json({ received: true })
  }

  try {
    switch (record.action_type) {
      case 'send_sms':
        await handleSendSms(record)
        break
      default:
        // Other action types (manager_followup, reschedule_appointment) are
        // handled manually or by future integrations — just acknowledge
        console.log(`[action-requests] Unhandled action_type: ${record.action_type}`)
    }
  } catch (error) {
    console.error(`[action-requests] Error processing ${record.id}:`, error)
    await markFailed(record.id, String(error))
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

// ─── SMS Handler ──────────────────────────────────────────────────────────────

async function handleSendSms(record: ActionRequest): Promise<void> {
  // 1. Resolve recipient phone
  const toPhone = await resolveRecipientPhone(record)
  if (!toPhone) {
    console.warn(`[send_sms] No recipient phone for action ${record.id} — skipping`)
    await markFailed(record.id, 'No recipient phone number found')
    return
  }

  // 2. Resolve from number — business-specific Twilio number, fallback to env
  const fromPhone = await resolveFromPhone(record.business_id)

  // 3. Build message text
  const messageText = record.content?.message as string | undefined
  if (!messageText) {
    await markFailed(record.id, 'No message content')
    return
  }

  // 4. Send via Twilio REST API
  await sendTwilioSms(fromPhone, toPhone, messageText)

  // 5. Mark completed
  await supabase
    .from('action_requests')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', record.id)
}

/**
 * Resolve the recipient phone number.
 * Priority: target.phone → look up from employee_calls by source_call_id
 */
async function resolveRecipientPhone(record: ActionRequest): Promise<string | null> {
  if (record.target?.phone) {
    return record.target.phone as string
  }

  // No direct phone — try to look up the caller from the associated call
  const callId = record.source_call_id || record.target?.call_id
  if (!callId) return null

  const { data: call } = await supabase
    .from('employee_calls')
    .select('caller_phone')
    .eq('call_id', callId)
    .limit(1)
    .single()

  return call?.caller_phone || null
}

/**
 * Resolve the from (sender) phone number for a business.
 * Uses the business's assigned Twilio number from phone_numbers table.
 * Falls back to the platform default in TWILIO_PHONE_NUMBER env var.
 */
async function resolveFromPhone(businessId: string): Promise<string> {
  const { data } = await supabase
    .from('phone_numbers')
    .select('phone_number')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .single()

  return data?.phone_number || process.env.TWILIO_PHONE_NUMBER || ''
}

/**
 * Send an SMS via the Twilio REST API (no SDK — plain fetch).
 */
async function sendTwilioSms(from: string, to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!

  const params = new URLSearchParams({ From: from, To: to, Body: body })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: params.toString(),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Twilio error ${response.status}: ${error.message || response.statusText}`)
  }

  const result = await response.json()
  console.log(`[send_sms] Sent to ${to} from ${from} — SID: ${result.sid}`)
}

async function markFailed(id: string, _reason: string): Promise<void> {
  await supabase
    .from('action_requests')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', id)
}
