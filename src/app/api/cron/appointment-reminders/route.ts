import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

/**
 * POST /api/cron/appointment-reminders
 *
 * Called by n8n every hour (no business-hours IF node — we handle that here
 * per-business in their local timezone).
 *
 * For each business with an active appointment-reminder employee:
 *   1. Check if it's currently within their business hours (local TZ)
 *   2. Calculate "tomorrow" in their local timezone
 *   3. Find unreminded appointments on that date
 *   4. Fire an outbound VAPI call for each
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization') || ''
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all active appointment-reminder employees that have a phone provisioned
  const { data: employees, error } = await supabase
    .from('phone_employees')
    .select('id, business_id, name, vapi_assistant_id, vapi_phone_id, schedule, job_config')
    .eq('job_type', 'appointment-reminder')
    .eq('is_active', true)
    .not('vapi_assistant_id', 'is', null)
    .not('vapi_phone_id', 'is', null)

  if (error) {
    console.error('[appointment-reminders] DB error fetching employees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!employees?.length) {
    return NextResponse.json({ fired: 0, skipped: 0, message: 'No active reminder employees with phones' })
  }

  let totalFired = 0
  let totalSkipped = 0
  let totalFailed = 0
  const businessResults: Record<string, any> = {}

  for (const employee of employees) {
    const timezone = employee.schedule?.timezone || 'America/New_York'

    // Check if within business hours for this employee's timezone
    if (!isWithinBusinessHours(employee.schedule, timezone)) {
      totalSkipped++
      businessResults[employee.business_id] = { status: 'outside_hours', timezone }
      continue
    }

    // Calculate "tomorrow" in this business's local timezone
    const tomorrowDate = getLocalTomorrow(timezone)

    // Find appointments tomorrow that haven't been reminded
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, customer_name, customer_phone, appointment_date, start_time')
      .eq('business_id', employee.business_id)
      .eq('appointment_date', tomorrowDate)
      .is('reminder_sent_at', null)
      .not('customer_phone', 'is', null)

    if (!appointments?.length) {
      businessResults[employee.business_id] = { status: 'no_appointments', date: tomorrowDate }
      continue
    }

    const fired: string[] = []
    const failed: string[] = []

    for (const appt of appointments) {
      try {
        await fireReminderCall(appt, employee)

        // Also send SMS reminder
        await sendReminderSMS(appt, employee.business_id).catch(err =>
          console.error(`[appointment-reminders] SMS failed for appt ${appt.id}:`, err)
        )

        await supabase
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', appt.id)
        fired.push(appt.id)
        totalFired++
      } catch (err) {
        console.error(`[appointment-reminders] Failed for appt ${appt.id}:`, err)
        failed.push(appt.id)
        totalFailed++
      }
    }

    businessResults[employee.business_id] = { status: 'processed', fired: fired.length, failed: failed.length, date: tomorrowDate, timezone }
  }

  console.log(`[appointment-reminders] Done: ${totalFired} fired, ${totalFailed} failed, ${totalSkipped} businesses outside hours`)
  return NextResponse.json({ fired: totalFired, failed: totalFailed, skipped: totalSkipped, businesses: businessResults })
}

// ─── Timezone Helpers ─────────────────────────────────────────────────────────

/**
 * Returns tomorrow's date (YYYY-MM-DD) in the given IANA timezone.
 */
function getLocalTomorrow(timezone: string): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow) // en-CA gives YYYY-MM-DD natively
}

/**
 * Returns the current hour (0-23) in the given IANA timezone.
 */
function getLocalHour(timezone: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  )
}

/**
 * Returns today's day of week ('monday', 'tuesday', etc.) in the given timezone.
 */
function getLocalDayOfWeek(timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(new Date()).toLowerCase()
}

/**
 * Check if the current local time falls within the employee's configured business hours.
 * Falls back to 9am–5pm Mon–Fri if no schedule is configured.
 */
function isWithinBusinessHours(schedule: any, timezone: string): boolean {
  const hour = getLocalHour(timezone)
  const day = getLocalDayOfWeek(timezone)

  const businessHours = schedule?.businessHours
  if (!businessHours) {
    // Default: Mon–Fri 9am–5pm
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    return weekdays.includes(day) && hour >= 9 && hour < 17
  }

  const todayHours = businessHours[day]
  if (!todayHours) return false // closed today

  const [startHour] = todayHours.start.split(':').map(Number)
  const [endHour] = todayHours.end.split(':').map(Number)

  return hour >= startHour && hour < endHour
}

// ─── VAPI Call ────────────────────────────────────────────────────────────────

async function fireReminderCall(
  appt: { id: string; customer_name: string | null; customer_phone: string; appointment_date: string; start_time: string },
  employee: { vapi_assistant_id: string; vapi_phone_id: string; name: string; business_id: string }
): Promise<void> {
  const [hour, minute] = appt.start_time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayTime = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
  const firstName = appt.customer_name?.split(' ')[0]

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Reminder - ${appt.customer_name || appt.customer_phone}`,
      assistantId: employee.vapi_assistant_id,
      phoneNumberId: employee.vapi_phone_id,
      customer: {
        number: appt.customer_phone,
        name: appt.customer_name || undefined,
      },
      assistantOverrides: {
        firstMessage: `Hi${firstName ? ` ${firstName}` : ''}, this is ${employee.name} calling with a friendly reminder about your appointment tomorrow at ${displayTime}. Do you have a moment?`,
      },
      metadata: {
        appointmentId: appt.id,
        businessId: employee.business_id,
        callType: 'appointment-reminder',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`VAPI error ${response.status}: ${err.message || response.statusText}`)
  }

  const call = await response.json()
  console.log(`[appointment-reminders] Call fired for appt ${appt.id} → VAPI call ${call.id}`)
}

// ─── SMS Reminder ─────────────────────────────────────────────────────────────

async function sendReminderSMS(
  appt: { id: string; customer_name: string | null; customer_phone: string; start_time: string },
  businessId: string
): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return // Twilio not configured — skip silently
  }

  const [hour, minute] = appt.start_time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayTime = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
  const firstName = appt.customer_name?.split(' ')[0]

  // Get business name for the message
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .single()

  const businessName = business?.name || 'us'
  const greeting = firstName ? `Hi ${firstName}, r` : 'R'
  const message = `${greeting}eminder: You have an appointment at ${businessName} tomorrow at ${displayTime}. Reply CONFIRM or call us to reschedule.`

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: appt.customer_phone,
        Body: message,
      }).toString(),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Twilio SMS error ${response.status}: ${(err as any).message || response.statusText}`)
  }

  const result = await response.json()
  console.log(`[appointment-reminders] SMS sent for appt ${appt.id} → SID: ${result.sid}`)
}
