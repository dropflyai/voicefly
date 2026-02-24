/**
 * Calendly Service
 *
 * Handles scheduling operations using the Calendly API v2.
 * Businesses connect their Calendly account via Personal Access Token,
 * then we can read event types, availability, and scheduled events.
 *
 * No npm package needed - uses direct API calls.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CALENDLY_API_BASE = 'https://api.calendly.com'

async function calendlyFetch(
  path: string,
  accessToken: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${CALENDLY_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

export class CalendlyService {
  /**
   * Test connection with a Calendly Personal Access Token.
   * Calls GET /users/me to verify the token and retrieve user info.
   */
  static async testConnection(accessToken: string): Promise<{
    success: boolean
    error?: string
    userUri?: string
    userName?: string
    email?: string
  }> {
    try {
      const response = await calendlyFetch('/users/me', accessToken)

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid access token. Please check your Calendly Personal Access Token.' }
        }
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.message || `Calendly API error (${response.status})` }
      }

      const data = await response.json()
      const user = data.resource

      return {
        success: true,
        userUri: user.uri,
        userName: user.name,
        email: user.email,
      }
    } catch (error: any) {
      console.error('Calendly testConnection error:', error)
      return { success: false, error: error.message || 'Failed to connect to Calendly' }
    }
  }

  /**
   * Get event types (scheduling page types) for a Calendly user.
   * Calls GET /event_types?user={userUri}
   */
  static async getEventTypes(accessToken: string, userUri: string): Promise<{
    success: boolean
    eventTypes?: Array<{ uri: string; name: string; duration: number; slug: string }>
    error?: string
  }> {
    try {
      const params = new URLSearchParams({ user: userUri, active: 'true' })
      const response = await calendlyFetch(`/event_types?${params}`, accessToken)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.message || `Failed to fetch event types (${response.status})` }
      }

      const data = await response.json()
      const eventTypes = (data.collection || []).map((et: any) => ({
        uri: et.uri,
        name: et.name,
        duration: et.duration,
        slug: et.slug,
      }))

      return { success: true, eventTypes }
    } catch (error: any) {
      console.error('Calendly getEventTypes error:', error)
      return { success: false, error: error.message || 'Failed to fetch event types' }
    }
  }

  /**
   * Get available time slots for an event type on a given date.
   * Calls GET /event_type_available_times with the event type URI and date range.
   */
  static async getAvailableSlots(accessToken: string, eventTypeUri: string, date: string): Promise<{
    success: boolean
    slots?: Array<{ start: string; end: string; status: string }>
    error?: string
  }> {
    try {
      // Build date range: start of day to start of next day (UTC)
      const startTime = `${date}T00:00:00.000000Z`
      const nextDay = new Date(date)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)
      const endTime = `${nextDay.toISOString().split('T')[0]}T00:00:00.000000Z`

      const params = new URLSearchParams({
        event_type: eventTypeUri,
        start_time: startTime,
        end_time: endTime,
      })
      const response = await calendlyFetch(`/event_type_available_times?${params}`, accessToken)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.message || `Failed to fetch available slots (${response.status})` }
      }

      const data = await response.json()
      const slots = (data.collection || []).map((slot: any) => ({
        start: slot.start_time,
        end: slot.end_time || '',
        status: slot.status,
      }))

      return { success: true, slots }
    } catch (error: any) {
      console.error('Calendly getAvailableSlots error:', error)
      return { success: false, error: error.message || 'Failed to fetch available slots' }
    }
  }

  /**
   * List upcoming scheduled events for a Calendly user.
   * Calls GET /scheduled_events with filters for active events.
   */
  static async listUpcomingEvents(
    accessToken: string,
    userUri: string,
    maxResults: number = 10,
    fromDate?: string
  ): Promise<{
    success: boolean
    events?: Array<{ uri: string; name: string; start_time: string; end_time: string; status: string }>
    error?: string
  }> {
    try {
      const minStartTime = fromDate
        ? new Date(`${fromDate}T00:00:00`).toISOString()
        : new Date().toISOString()

      const params = new URLSearchParams({
        user: userUri,
        min_start_time: minStartTime,
        count: maxResults.toString(),
        status: 'active',
      })
      const response = await calendlyFetch(`/scheduled_events?${params}`, accessToken)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.message || `Failed to fetch scheduled events (${response.status})` }
      }

      const data = await response.json()
      const events = (data.collection || []).map((event: any) => ({
        uri: event.uri,
        name: event.name,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
      }))

      return { success: true, events }
    } catch (error: any) {
      console.error('Calendly listUpcomingEvents error:', error)
      return { success: false, error: error.message || 'Failed to list upcoming events' }
    }
  }

  /**
   * Get business Calendly config from the businesses.settings JSONB column.
   * Reads: calendar_provider, calendly_access_token, calendly_user_uri, calendly_event_type_uri
   */
  static async getBusinessCalendlyConfig(businessId: string): Promise<{
    provider: string | null
    accessToken: string | null
    userUri: string | null
    eventTypeUri: string | null
    schedulingUrl: string | null
  }> {
    // Check business_integrations first (new integration layer)
    const { data: integration } = await supabase
      .from('business_integrations')
      .select('credentials, config, status')
      .eq('business_id', businessId)
      .eq('platform', 'calendly')
      .eq('status', 'connected')
      .single()

    if (integration?.credentials?.accessToken) {
      return {
        provider: 'calendly',
        accessToken: integration.credentials.accessToken,
        userUri: integration.config?.userUri || null,
        eventTypeUri: integration.config?.eventTypeUri || null,
        schedulingUrl: integration.config?.schedulingUrl || null,
      }
    }

    // Fall back to legacy businesses.settings
    const { data } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    return {
      provider: data?.settings?.calendar_provider || null,
      accessToken: data?.settings?.calendly_access_token || null,
      userUri: data?.settings?.calendly_user_uri || null,
      eventTypeUri: data?.settings?.calendly_event_type_uri || null,
      schedulingUrl: null,
    }
  }
}
