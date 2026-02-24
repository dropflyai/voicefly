/**
 * Google Reviews SMS Manager
 *
 * Handles sending Google Review request SMS messages to customers
 * after successful interactions (orders, appointments, calls).
 *
 * Config is stored in businesses.settings.google_reviews (JSONB).
 * Review requests are tracked in the google_review_requests table.
 */

import { createClient } from '@supabase/supabase-js'
import { actionExecutor } from './phone-employees/action-executor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// TYPES
// ============================================

export interface GoogleReviewsConfig {
  enabled: boolean
  placeId?: string
  googleMapsUrl?: string
  messageTemplate?: string
  delayMinutes?: number
  applyToInteractions?: ('orders' | 'appointments' | 'all_calls')[]
}

const DEFAULT_MESSAGE_TEMPLATE =
  'Thanks for choosing {business_name}! We\'d love your feedback: {review_link} Reply STOP to opt out'

const DEFAULT_DELAY_MINUTES = 30

// 90 days in milliseconds - don't re-send within this window
const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000

// ============================================
// GOOGLE REVIEWS MANAGER
// ============================================

export class GoogleReviewsManager {
  /**
   * Get google_reviews config from businesses.settings
   */
  static async getConfig(businessId: string): Promise<GoogleReviewsConfig | null> {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    if (error || !business?.settings?.google_reviews) {
      return null
    }

    return business.settings.google_reviews as GoogleReviewsConfig
  }

  /**
   * Build the Google Maps review link from placeId or direct URL
   */
  static buildReviewLink(config: GoogleReviewsConfig): string {
    if (config.placeId) {
      return `https://search.google.com/local/writereview?placeid=${config.placeId}`
    }

    if (config.googleMapsUrl) {
      return config.googleMapsUrl
    }

    return ''
  }

  /**
   * Check if we should send a review request for this customer/interaction.
   *
   * Returns false if:
   * - Google reviews is not enabled
   * - The interaction type is not in the applyToInteractions list
   * - The customer has opted out
   * - A review request was already sent to this phone within 90 days
   */
  static async shouldSendReview(
    businessId: string,
    customerPhone: string,
    interactionType: string
  ): Promise<boolean> {
    const config = await this.getConfig(businessId)

    if (!config || !config.enabled) {
      return false
    }

    // Must have a review link configured
    const reviewLink = this.buildReviewLink(config)
    if (!reviewLink) {
      return false
    }

    // Check if this interaction type is enabled
    const applyTo = config.applyToInteractions || ['orders', 'appointments']
    const typeMap: Record<string, string> = {
      order: 'orders',
      appointment: 'appointments',
      call: 'all_calls',
    }
    const mappedType = typeMap[interactionType] || interactionType
    if (!applyTo.includes(mappedType as any)) {
      return false
    }

    // Check for opt-out or recent send within 90 days
    const cutoffDate = new Date(Date.now() - COOLDOWN_MS).toISOString()

    const { data: recentRequests } = await supabase
      .from('google_review_requests')
      .select('id, opted_out, request_sent_at')
      .eq('business_id', businessId)
      .eq('customer_phone', customerPhone)
      .gte('request_sent_at', cutoffDate)
      .order('request_sent_at', { ascending: false })
      .limit(1)

    if (recentRequests && recentRequests.length > 0) {
      // Already sent within cooldown period, or customer opted out
      return false
    }

    // Also check if they have ever opted out (regardless of date)
    const { data: optedOut } = await supabase
      .from('google_review_requests')
      .select('id')
      .eq('business_id', businessId)
      .eq('customer_phone', customerPhone)
      .eq('opted_out', true)
      .limit(1)

    if (optedOut && optedOut.length > 0) {
      return false
    }

    return true
  }

  /**
   * Schedule a review request using the scheduled_tasks table.
   * The task scheduler will pick it up after the configured delay.
   */
  static async scheduleReviewRequest(params: {
    businessId: string
    employeeId: string
    customerPhone: string
    customerName?: string
    callId?: string
    orderId?: string
    interactionType: 'order' | 'appointment' | 'call'
  }): Promise<void> {
    const config = await this.getConfig(params.businessId)
    if (!config || !config.enabled) {
      console.log('[GoogleReviews] Not enabled for business', params.businessId)
      return
    }

    // Check if we should send
    const shouldSend = await this.shouldSendReview(
      params.businessId,
      params.customerPhone,
      params.interactionType
    )

    if (!shouldSend) {
      console.log('[GoogleReviews] Skipping review request', {
        businessId: params.businessId,
        phone: params.customerPhone,
        reason: 'shouldSendReview returned false',
      })
      return
    }

    const delayMinutes = config.delayMinutes ?? DEFAULT_DELAY_MINUTES
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000)

    // Create a scheduled task for the review SMS
    const { error } = await supabase
      .from('scheduled_tasks')
      .insert({
        business_id: params.businessId,
        employee_id: params.employeeId,
        task_type: 'send_review_request',
        target_phone: params.customerPhone,
        target_name: params.customerName || null,
        scheduled_for: scheduledFor.toISOString(),
        timezone: 'UTC',
        message: null,  // Message will be built at send time
        metadata: {
          callId: params.callId,
          orderId: params.orderId,
          interactionType: params.interactionType,
        },
        status: 'pending',
        priority: 'low',
        max_attempts: 2,
        attempts: 0,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[GoogleReviews] Failed to schedule review request:', error)
    } else {
      console.log('[GoogleReviews] Review request scheduled', {
        businessId: params.businessId,
        phone: params.customerPhone,
        scheduledFor: scheduledFor.toISOString(),
        delayMinutes,
      })
    }
  }

  /**
   * Send the review SMS immediately.
   * Called by the task scheduler or directly for zero-delay scenarios.
   *
   * 1. Gets the business google_reviews config
   * 2. Builds the review link
   * 3. Builds the message from template
   * 4. Uses actionExecutor to send SMS via Twilio
   * 5. Records to google_review_requests table
   */
  static async sendReviewSMS(params: {
    businessId: string
    employeeId: string
    customerPhone: string
    customerName?: string
    callId?: string
    orderId?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get config
      const config = await this.getConfig(params.businessId)
      if (!config || !config.enabled) {
        return { success: false, error: 'Google reviews not enabled' }
      }

      // 2. Build review link
      const reviewLink = this.buildReviewLink(config)
      if (!reviewLink) {
        return { success: false, error: 'No review link configured' }
      }

      // 3. Get business name for the message
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', params.businessId)
        .single()

      const businessName = business?.name || 'our business'

      // 4. Build message from template
      const template = config.messageTemplate || DEFAULT_MESSAGE_TEMPLATE
      const message = template
        .replace('{business_name}', businessName)
        .replace('{review_link}', reviewLink)
        .replace('{customer_name}', params.customerName || 'there')

      // 5. Send SMS via action executor
      const smsResult = await actionExecutor.sendSMS({
        id: `review-${Date.now()}`,
        businessId: params.businessId,
        employeeId: params.employeeId,
        actionType: 'send_sms',
        target: { phone: params.customerPhone },
        content: { message },
        status: 'pending',
        triggeredBy: 'agent',
        createdAt: new Date(),
      })

      // 6. Record to google_review_requests
      const { error: insertError } = await supabase
        .from('google_review_requests')
        .insert({
          business_id: params.businessId,
          employee_id: params.employeeId,
          customer_phone: params.customerPhone,
          customer_name: params.customerName || null,
          call_id: params.callId || null,
          order_id: params.orderId || null,
          review_url: reviewLink,
          message_sent: message,
          status: 'sent',
          opted_out: false,
          request_sent_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('[GoogleReviews] Failed to record review request:', insertError)
        // Don't fail the whole operation - the SMS was already sent
      }

      console.log('[GoogleReviews] Review SMS sent', {
        businessId: params.businessId,
        phone: params.customerPhone,
        messageSid: smsResult?.messageSid,
      })

      return { success: true }
    } catch (error: any) {
      console.error('[GoogleReviews] Failed to send review SMS:', error)

      // Record the failed attempt
      await supabase
        .from('google_review_requests')
        .insert({
          business_id: params.businessId,
          employee_id: params.employeeId,
          customer_phone: params.customerPhone,
          customer_name: params.customerName || null,
          call_id: params.callId || null,
          order_id: params.orderId || null,
          review_url: null,
          message_sent: null,
          status: 'failed',
          opted_out: false,
          request_sent_at: new Date().toISOString(),
        })

      return { success: false, error: error.message }
    }
  }

  /**
   * Get stats for the dashboard
   */
  static async getStats(
    businessId: string,
    days: number = 30
  ): Promise<{
    totalSent: number
    optedOut: number
  }> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Total sent in period
    const { count: totalSent } = await supabase
      .from('google_review_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'sent')
      .gte('request_sent_at', cutoffDate)

    // Total opted out (all time)
    const { count: optedOut } = await supabase
      .from('google_review_requests')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('opted_out', true)

    return {
      totalSent: totalSent || 0,
      optedOut: optedOut || 0,
    }
  }
}
