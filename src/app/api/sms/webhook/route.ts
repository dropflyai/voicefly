import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SMSService } from '@/lib/sms-service'
import { SMSTemplates } from '@/lib/sms-templates'
import { logAuditEvent } from '@/lib/audit-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Twilio SMS Webhook Handler
 * Receives incoming SMS messages from customers
 * Handles keywords: CANCEL, RESCHEDULE, STOP, HELP, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract Twilio webhook parameters
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = (formData.get('Body') as string || '').trim().toLowerCase()
    const messageSid = formData.get('MessageSid') as string

    console.log('Incoming SMS:', { from, to, body, messageSid })

    // Save incoming message to database
    await saveIncomingMessage({
      from,
      to,
      body,
      messageSid,
      receivedAt: new Date().toISOString()
    })

    // Log audit event
    await logAuditEvent({
      eventType: 'sms_received',
      userId: 'system',
      resourceType: 'sms',
      resourceId: messageSid,
      metadata: { from, to, body }
    })

    // Handle keyword-based auto-responses
    const autoResponse = await handleKeywordResponse(from, to, body)

    if (autoResponse) {
      // Send TwiML response
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${autoResponse}</Message>
</Response>`,
        {
          headers: {
            'Content-Type': 'text/xml'
          }
        }
      )
    }

    // No auto-response, just acknowledge receipt
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`,
      {
        headers: {
          'Content-Type': 'text/xml'
        }
      }
    )
  } catch (error: any) {
    console.error('SMS webhook error:', error)

    // Return empty TwiML to avoid Twilio retries
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`,
      {
        headers: {
          'Content-Type': 'text/xml'
        },
        status: 200 // Always return 200 to Twilio
      }
    )
  }
}

/**
 * Handle keyword-based responses
 */
async function handleKeywordResponse(from: string, to: string, body: string): Promise<string | null> {
  // STOP - Opt-out from promotional messages
  if (body === 'stop' || body === 'unsubscribe' || body === 'end') {
    await handleOptOut(from)
    return SMSTemplates.autoResponses.stop
  }

  // CANCEL - Customer wants to cancel appointment
  if (body.includes('cancel')) {
    await notifyStaffOfCancellation(from)
    return SMSTemplates.autoResponses.cancel
  }

  // RESCHEDULE - Customer wants to reschedule
  if (body.includes('reschedule') || body.includes('change')) {
    await notifyStaffOfReschedule(from)
    return SMSTemplates.autoResponses.reschedule
  }

  // CONFIRM - Customer confirming appointment
  if (body === 'confirm' || body === 'yes' || body === 'ok') {
    await confirmAppointment(from)
    return SMSTemplates.autoResponses.confirm
  }

  // HELP - Customer needs assistance
  if (body === 'help' || body === '?') {
    return SMSTemplates.autoResponses.help
  }

  // HOURS - Customer asking about hours
  if (body.includes('hours') || body.includes('open') || body.includes('close')) {
    return SMSTemplates.autoResponses.hours
  }

  // PRICING - Customer asking about pricing
  if (body.includes('price') || body.includes('cost') || body.includes('how much')) {
    return SMSTemplates.autoResponses.pricing
  }

  // LOCATION - Customer asking about location
  if (body.includes('location') || body.includes('address') || body.includes('where')) {
    return SMSTemplates.autoResponses.location
  }

  // SERVICES - Customer asking about services
  if (body.includes('service') || body.includes('what do you')) {
    return SMSTemplates.autoResponses.services
  }

  // Default response for unrecognized messages
  return SMSTemplates.autoResponses.default
}

/**
 * Save incoming SMS to database
 */
async function saveIncomingMessage(data: any) {
  try {
    const { error } = await supabase
      .from('incoming_sms')
      .insert({
        from_number: data.from,
        to_number: data.to,
        message_body: data.body,
        twilio_sid: data.messageSid,
        received_at: data.receivedAt,
        status: 'received'
      })

    if (error) {
      console.error('Error saving incoming SMS:', error)
    }
  } catch (error) {
    console.error('Database error:', error)
  }
}

/**
 * Handle opt-out (STOP keyword)
 */
async function handleOptOut(phoneNumber: string) {
  try {
    // Mark customer as opted out in database
    const { error } = await supabase
      .from('sms_opt_outs')
      .insert({
        phone_number: phoneNumber,
        opted_out_at: new Date().toISOString(),
        reason: 'user_request'
      })

    if (error) {
      console.error('Error recording opt-out:', error)
    }

    console.log(`Customer opted out: ${phoneNumber}`)
  } catch (error) {
    console.error('Opt-out error:', error)
  }
}

/**
 * Notify staff when customer wants to cancel
 */
async function notifyStaffOfCancellation(phoneNumber: string) {
  try {
    // Find upcoming appointment for this customer
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, business:businesses(*), customer:customers(*)')
      .eq('customer.phone', phoneNumber)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .order('appointment_date', { ascending: true })
      .limit(1)

    if (appointments && appointments.length > 0) {
      const appointment = appointments[0]

      // Update appointment status to pending_cancellation
      await supabase
        .from('appointments')
        .update({
          status: 'pending_cancellation',
          cancellation_requested_at: new Date().toISOString(),
          cancellation_method: 'sms'
        })
        .eq('id', appointment.id)

      console.log(`Cancellation requested for appointment ${appointment.id}`)
    }
  } catch (error) {
    console.error('Cancellation notification error:', error)
  }
}

/**
 * Notify staff when customer wants to reschedule
 */
async function notifyStaffOfReschedule(phoneNumber: string) {
  try {
    // Find upcoming appointment for this customer
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer.phone', phoneNumber)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .order('appointment_date', { ascending: true })
      .limit(1)

    if (appointments && appointments.length > 0) {
      const appointment = appointments[0]

      // Update appointment to pending_reschedule
      await supabase
        .from('appointments')
        .update({
          status: 'pending_reschedule',
          reschedule_requested_at: new Date().toISOString(),
          reschedule_method: 'sms'
        })
        .eq('id', appointment.id)

      console.log(`Reschedule requested for appointment ${appointment.id}`)
    }
  } catch (error) {
    console.error('Reschedule notification error:', error)
  }
}

/**
 * Confirm appointment when customer replies YES/CONFIRM
 */
async function confirmAppointment(phoneNumber: string) {
  try {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer.phone', phoneNumber)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'pending')
      .order('appointment_date', { ascending: true })
      .limit(1)

    if (appointments && appointments.length > 0) {
      const appointment = appointments[0]

      await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmation_method: 'sms'
        })
        .eq('id', appointment.id)

      console.log(`Appointment ${appointment.id} confirmed via SMS`)
    }
  } catch (error) {
    console.error('Confirmation error:', error)
  }
}
