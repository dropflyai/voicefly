/**
 * Calendly Settings API
 *
 * GET  /api/settings/calendly?businessId=xxx
 *   Returns current Calendly connection status and event types
 *
 * POST /api/settings/calendly
 *   Connect, update, or disconnect Calendly integration
 *   Body: { businessId, accessToken?, eventTypeUri?, disconnect? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { CalendlyService } from '@/lib/calendly-service'

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

    const config = await CalendlyService.getBusinessCalendlyConfig(businessId)
    const connected = config.provider === 'calendly' && !!config.accessToken

    // If connected, fetch event types so the UI can show them
    let eventTypes: Array<{ uri: string; name: string; duration: number; slug: string }> = []
    if (connected && config.accessToken && config.userUri) {
      const eventTypesResult = await CalendlyService.getEventTypes(config.accessToken, config.userUri)
      if (eventTypesResult.success && eventTypesResult.eventTypes) {
        eventTypes = eventTypesResult.eventTypes
      }
    }

    return NextResponse.json({
      connected,
      provider: config.provider,
      userUri: config.userUri,
      eventTypeUri: config.eventTypeUri,
      eventTypes,
    })
  } catch (error: any) {
    console.error('GET /api/settings/calendly error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, accessToken, eventTypeUri, disconnect } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing settings
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    const currentSettings = business?.settings || {}

    // Handle disconnect
    if (disconnect) {
      const { error } = await supabase
        .from('businesses')
        .update({
          settings: {
            ...currentSettings,
            calendar_provider: null,
            calendly_access_token: null,
            calendly_user_uri: null,
            calendly_event_type_uri: null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to disconnect Calendly:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Calendly disconnected',
      })
    }

    // Handle new connection (accessToken provided)
    if (accessToken) {
      const testResult = await CalendlyService.testConnection(accessToken)
      if (!testResult.success) {
        return NextResponse.json({
          success: false,
          error: testResult.error,
        }, { status: 400 })
      }

      // Clear any existing Google Calendar config since only one calendar provider at a time
      const updatedSettings: Record<string, any> = {
        ...currentSettings,
        calendar_provider: 'calendly',
        calendly_access_token: accessToken,
        calendly_user_uri: testResult.userUri,
        calendly_event_type_uri: eventTypeUri || currentSettings.calendly_event_type_uri || null,
        // Clear Google Calendar fields
        google_calendar_id: null,
      }

      const { error } = await supabase
        .from('businesses')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to save Calendly connection:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
      }

      // Fetch event types to return to the UI
      let eventTypes: Array<{ uri: string; name: string; duration: number; slug: string }> = []
      if (testResult.userUri) {
        const eventTypesResult = await CalendlyService.getEventTypes(accessToken, testResult.userUri)
        if (eventTypesResult.success && eventTypesResult.eventTypes) {
          eventTypes = eventTypesResult.eventTypes
        }
      }

      return NextResponse.json({
        success: true,
        connected: true,
        message: 'Calendly connected successfully',
        userName: testResult.userName,
        email: testResult.email,
        userUri: testResult.userUri,
        eventTypes,
      })
    }

    // Handle event type URI update only (already connected)
    if (eventTypeUri !== undefined) {
      const { error } = await supabase
        .from('businesses')
        .update({
          settings: {
            ...currentSettings,
            calendly_event_type_uri: eventTypeUri || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to update Calendly event type:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Calendly event type updated',
        eventTypeUri,
      })
    }

    return NextResponse.json({ error: 'No action specified. Provide accessToken, eventTypeUri, or disconnect: true' }, { status: 400 })
  } catch (error: any) {
    console.error('POST /api/settings/calendly error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
