/**
 * Google Calendar Connect
 *
 * POST /api/integrations/google-calendar/connect
 * Body: { businessId, calendarId }
 *
 * Tests access to the calendar via the service account, then stores the
 * calendarId in businesses.settings so the provisioning service can inject
 * live calendar context into VAPI assistant system prompts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { GoogleCalendarService } from '@/lib/google-calendar-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, calendarId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!calendarId || typeof calendarId !== 'string' || !calendarId.trim()) {
      return NextResponse.json({ error: 'Calendar ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Test the connection via the service account
    const test = await GoogleCalendarService.testConnection(calendarId.trim())
    if (!test.success) {
      return NextResponse.json(
        { error: test.error || 'Could not access calendar. Make sure you shared it with the service account.' },
        { status: 400 }
      )
    }

    // Get current settings and merge
    const { data: biz } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    const updatedSettings = {
      ...(biz?.settings || {}),
      google_calendar_id: calendarId.trim(),
      calendar_provider: 'google',
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({ settings: updatedSettings })
      .eq('id', businessId)

    if (updateError) {
      console.error('[GoogleCalendar Connect] Failed to save settings:', updateError)
      return NextResponse.json({ error: 'Failed to save calendar connection' }, { status: 500 })
    }

    // Also record in business_integrations for unified integration listing
    await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'google-calendar',
          status: 'connected',
          credentials: {},
          config: { calendarId: calendarId.trim() },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    console.log(`[GoogleCalendar Connect] Connected calendar for business ${businessId}: ${calendarId}`)

    return NextResponse.json({ success: true, calendarId: calendarId.trim() })
  } catch (error: any) {
    console.error('[GoogleCalendar Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
