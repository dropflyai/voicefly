/**
 * Google Calendar Service
 *
 * Handles calendar operations using a Google Service Account.
 * Businesses share their calendar with the service account email,
 * then we can read/write events on their behalf.
 */

import { google, calendar_v3 } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

function getCalendarClient(): calendar_v3.Calendar | null {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    return null
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return google.calendar({ version: 'v3', auth })
}

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: string // ISO datetime
  end: string   // ISO datetime
  location?: string
  attendees?: { email: string; name?: string }[]
}

export interface TimeSlot {
  start: string
  end: string
}

export class GoogleCalendarService {
  /**
   * Get the service account email (for sharing instructions)
   */
  static getServiceAccountEmail(): string | null {
    return SERVICE_ACCOUNT_EMAIL || null
  }

  /**
   * Check if a calendar is accessible by the service account
   */
  static async testConnection(calendarId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const calendar = getCalendarClient()
      if (!calendar) {
        return { success: false, error: 'Google Calendar not configured. Service account credentials missing.' }
      }

      await calendar.calendarList.get({ calendarId })
      return { success: true }
    } catch (error: any) {
      if (error.code === 404) {
        return { success: false, error: 'Calendar not found. Make sure you shared it with the service account email.' }
      }
      return { success: false, error: error.message || 'Failed to connect to calendar' }
    }
  }

  /**
   * Get available time slots for a given date by checking free/busy
   */
  static async getAvailableSlots(
    calendarId: string,
    date: string, // YYYY-MM-DD
    slotDurationMinutes: number = 30,
    businessHours?: { start: string; end: string } // HH:MM format
  ): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
    try {
      const calendar = getCalendarClient()
      if (!calendar) {
        return { success: false, error: 'Google Calendar not configured' }
      }

      const startOfDay = `${date}T${businessHours?.start || '09:00'}:00`
      const endOfDay = `${date}T${businessHours?.end || '17:00'}:00`

      // Get free/busy info
      const freeBusy = await calendar.freebusy.query({
        requestBody: {
          timeMin: new Date(startOfDay).toISOString(),
          timeMax: new Date(endOfDay).toISOString(),
          items: [{ id: calendarId }],
        },
      })

      const busySlots = freeBusy.data.calendars?.[calendarId]?.busy || []

      // Generate all possible slots within business hours
      const allSlots: TimeSlot[] = []
      const [startH, startM] = (businessHours?.start || '09:00').split(':').map(Number)
      const [endH, endM] = (businessHours?.end || '17:00').split(':').map(Number)
      let current = startH * 60 + startM
      const endMinutes = endH * 60 + endM - slotDurationMinutes

      while (current <= endMinutes) {
        const slotStart = new Date(`${date}T00:00:00`)
        slotStart.setHours(Math.floor(current / 60), current % 60, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000)

        allSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        })
        current += slotDurationMinutes
      }

      // Filter out busy slots
      const availableSlots = allSlots.filter(slot => {
        const slotStart = new Date(slot.start).getTime()
        const slotEnd = new Date(slot.end).getTime()

        return !busySlots.some(busy => {
          const busyStart = new Date(busy.start!).getTime()
          const busyEnd = new Date(busy.end!).getTime()
          return slotStart < busyEnd && slotEnd > busyStart
        })
      })

      return { success: true, slots: availableSlots }
    } catch (error: any) {
      console.error('Google Calendar getAvailableSlots error:', error)
      return { success: false, error: error.message || 'Failed to check availability' }
    }
  }

  /**
   * Create a calendar event (book an appointment)
   */
  static async createEvent(
    calendarId: string,
    event: CalendarEvent
  ): Promise<{ success: boolean; eventId?: string; eventLink?: string; error?: string }> {
    try {
      const calendar = getCalendarClient()
      if (!calendar) {
        return { success: false, error: 'Google Calendar not configured' }
      }

      const result = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
          attendees: event.attendees?.map(a => ({
            email: a.email,
            displayName: a.name,
          })),
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
            ],
          },
        },
      })

      return {
        success: true,
        eventId: result.data.id!,
        eventLink: result.data.htmlLink!,
      }
    } catch (error: any) {
      console.error('Google Calendar createEvent error:', error)
      return { success: false, error: error.message || 'Failed to create event' }
    }
  }

  /**
   * List upcoming events from a calendar
   */
  static async listUpcomingEvents(
    calendarId: string,
    maxResults: number = 10,
    fromDate?: string // YYYY-MM-DD, defaults to today
  ): Promise<{ success: boolean; events?: CalendarEvent[]; error?: string }> {
    try {
      const calendar = getCalendarClient()
      if (!calendar) {
        return { success: false, error: 'Google Calendar not configured' }
      }

      const timeMin = fromDate
        ? new Date(`${fromDate}T00:00:00`).toISOString()
        : new Date().toISOString()

      const result = await calendar.events.list({
        calendarId,
        timeMin,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events: CalendarEvent[] = (result.data.items || []).map(item => ({
        id: item.id!,
        summary: item.summary || 'No title',
        description: item.description || undefined,
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        location: item.location || undefined,
      }))

      return { success: true, events }
    } catch (error: any) {
      console.error('Google Calendar listUpcomingEvents error:', error)
      return { success: false, error: error.message || 'Failed to list events' }
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(
    calendarId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const calendar = getCalendarClient()
      if (!calendar) {
        return { success: false, error: 'Google Calendar not configured' }
      }

      await calendar.events.delete({ calendarId, eventId })
      return { success: true }
    } catch (error: any) {
      console.error('Google Calendar deleteEvent error:', error)
      return { success: false, error: error.message || 'Failed to delete event' }
    }
  }

  /**
   * Get business calendar config from Supabase
   */
  static async getBusinessCalendarConfig(businessId: string): Promise<{
    calendarId: string | null
    provider: string | null
  }> {
    const { data } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    return {
      calendarId: data?.settings?.google_calendar_id || null,
      provider: data?.settings?.calendar_provider || null,
    }
  }
}
