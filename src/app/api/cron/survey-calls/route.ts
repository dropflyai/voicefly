import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/survey-calls
 *
 * Called by n8n every 30 minutes. Business-hours check happens here
 * per-business in their local timezone — no IF node needed in n8n.
 *
 * For each business with an active survey-caller employee:
 *   1. Check if within business hours (local TZ)
 *   2. Find appointments completed 2–4h ago, not yet surveyed
 *   3. Fire an outbound VAPI survey call for each
 *
 * Configurable window via query params: ?minHoursAgo=2&maxHoursAgo=4
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const minHoursAgo = Number(url.searchParams.get('minHoursAgo') || '2')
  const maxHoursAgo = Number(url.searchParams.get('maxHoursAgo') || '4')

  // Get all active survey-caller employees with a phone provisioned
  const { data: employees, error } = await supabase
    .from('phone_employees')
    .select('id, business_id, name, vapi_assistant_id, vapi_phone_id, schedule, job_config')
    .eq('job_type', 'survey-caller')
    .eq('is_active', true)
    .not('vapi_assistant_id', 'is', null)
    .not('vapi_phone_id', 'is', null)

  if (error) {
    console.error('[survey-calls] DB error fetching employees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!employees?.length) {
    return NextResponse.json({ fired: 0, skipped: 0, message: 'No active survey-caller employees with phones' })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - maxHoursAgo * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() - minHoursAgo * 60 * 60 * 1000).toISOString()

  let totalFired = 0
  let totalSkipped = 0
  let totalFailed = 0
  const businessResults: Record<string, any> = {}

  for (const employee of employees) {
    const timezone = employee.schedule?.timezone || 'America/New_York'

    // Check business hours in local timezone
    if (!isWithinBusinessHours(employee.schedule, timezone)) {
      totalSkipped++
      businessResults[employee.business_id] = { status: 'outside_hours', timezone }
      continue
    }

    // Find recently completed appointments not yet surveyed for this business
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, customer_name, customer_phone, appointment_date, start_time, updated_at')
      .eq('business_id', employee.business_id)
      .eq('status', 'completed')
      .gte('updated_at', windowStart)
      .lte('updated_at', windowEnd)
      .is('survey_sent_at', null)
      .not('customer_phone', 'is', null)

    if (!appointments?.length) {
      businessResults[employee.business_id] = { status: 'no_appointments', window: `${minHoursAgo}-${maxHoursAgo}h ago` }
      continue
    }

    const fired: string[] = []
    const failed: string[] = []

    for (const appt of appointments) {
      try {
        await fireSurveyCall(appt, employee)
        await supabase
          .from('appointments')
          .update({ survey_sent_at: new Date().toISOString() })
          .eq('id', appt.id)
        fired.push(appt.id)
        totalFired++
      } catch (err) {
        console.error(`[survey-calls] Failed for appt ${appt.id}:`, err)
        failed.push(appt.id)
        totalFailed++
      }
    }

    businessResults[employee.business_id] = { status: 'processed', fired: fired.length, failed: failed.length, timezone }
  }

  console.log(`[survey-calls] Done: ${totalFired} fired, ${totalFailed} failed, ${totalSkipped} businesses outside hours`)
  return NextResponse.json({ fired: totalFired, failed: totalFailed, skipped: totalSkipped, businesses: businessResults })
}

// ─── Timezone Helpers ─────────────────────────────────────────────────────────

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

function getLocalDayOfWeek(timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(new Date()).toLowerCase()
}

function isWithinBusinessHours(schedule: any, timezone: string): boolean {
  const hour = getLocalHour(timezone)
  const day = getLocalDayOfWeek(timezone)

  const businessHours = schedule?.businessHours
  if (!businessHours) {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    return weekdays.includes(day) && hour >= 10 && hour < 18
  }

  const todayHours = businessHours[day]
  if (!todayHours) return false

  const [startHour] = todayHours.start.split(':').map(Number)
  const [endHour] = todayHours.end.split(':').map(Number)

  return hour >= startHour && hour < endHour
}

// ─── VAPI Call ────────────────────────────────────────────────────────────────

async function fireSurveyCall(
  appt: { id: string; customer_name: string | null; customer_phone: string; appointment_date: string; start_time: string },
  employee: { vapi_assistant_id: string; vapi_phone_id: string; name: string; business_id: string; job_config: any }
): Promise<void> {
  const surveyName = employee.job_config?.surveyName || 'Customer Satisfaction Survey'
  const firstName = appt.customer_name?.split(' ')[0]

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Survey - ${appt.customer_name || appt.customer_phone}`,
      assistantId: employee.vapi_assistant_id,
      phoneNumberId: employee.vapi_phone_id,
      customer: {
        number: appt.customer_phone,
        name: appt.customer_name || undefined,
      },
      assistantOverrides: {
        firstMessage: `Hi${firstName ? ` ${firstName}` : ''}, this is ${employee.name} calling. We hope your visit today went well! Do you have about 2 minutes for a quick ${surveyName}?`,
      },
      metadata: {
        appointmentId: appt.id,
        businessId: employee.business_id,
        callType: 'survey',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`VAPI error ${response.status}: ${err.message || response.statusText}`)
  }

  const call = await response.json()
  console.log(`[survey-calls] Call fired for appt ${appt.id} → VAPI call ${call.id}`)
}
