/**
 * Google Calendar Settings API
 *
 * GET  /api/settings/google-calendar?businessId=xxx
 *   Returns current calendar connection status
 *
 * POST /api/settings/google-calendar
 *   Saves/updates Google Calendar configuration
 *   Body: { businessId, calendarId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { GoogleCalendarService } from '@/lib/google-calendar-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await GoogleCalendarService.getBusinessCalendarConfig(businessId)
    const serviceAccountEmail = GoogleCalendarService.getServiceAccountEmail()

    return NextResponse.json({
      connected: !!config.calendarId,
      calendarId: config.calendarId,
      provider: config.provider,
      serviceAccountEmail,
      configured: !!serviceAccountEmail,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, calendarId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If calendarId provided, test the connection
    if (calendarId) {
      const testResult = await GoogleCalendarService.testConnection(calendarId)
      if (!testResult.success) {
        return NextResponse.json({
          success: false,
          error: testResult.error,
        }, { status: 400 })
      }
    }

    // Get existing settings
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    const currentSettings = business?.settings || {}

    // Update settings with calendar config
    const { error } = await supabase
      .from('businesses')
      .update({
        settings: {
          ...currentSettings,
          google_calendar_id: calendarId || null,
          calendar_provider: calendarId ? 'google' : null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (error) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connected: !!calendarId,
      message: calendarId
        ? 'Google Calendar connected successfully'
        : 'Google Calendar disconnected',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
