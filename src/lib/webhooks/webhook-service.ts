/**
 * Webhook Service
 *
 * Handles webhook registration, delivery, and retry logic for the
 * Zapier/Make integration system. Uses HMAC-SHA256 for payload signing.
 */

import crypto from 'crypto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  WebhookEventType,
  BusinessWebhook,
  WebhookDelivery,
  WebhookPayload,
  CreateWebhookConfig,
  UpdateWebhookConfig,
} from './types'

// Retry delays in milliseconds: 5 min, 15 min, 1 hour
const RETRY_DELAYS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]

const DELIVERY_TIMEOUT = 10_000 // 10 seconds

class WebhookService {
  private static instance: WebhookService
  private supabase: SupabaseClient

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  // --------------------------------------------------
  // Event Firing
  // --------------------------------------------------

  /**
   * Fire a webhook event for a business.
   * Finds all active webhooks subscribed to this event and delivers to each.
   */
  async fireEvent(
    businessId: string,
    eventType: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      // Find active webhooks for this business that listen for this event type
      const { data: webhooks, error } = await this.supabase
        .from('business_webhooks')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .contains('enabled_events', [eventType])

      if (error) {
        console.error('[WebhookService] Error fetching webhooks:', error)
        return
      }

      if (!webhooks || webhooks.length === 0) {
        return
      }

      const eventId = crypto.randomUUID()
      const payload: WebhookPayload = {
        event: `${eventType}`,
        eventType,
        businessId,
        timestamp: new Date().toISOString(),
        data,
      }

      // Deliver to each webhook in parallel
      const deliveryPromises = webhooks.map((webhook: BusinessWebhook) =>
        this.deliverWebhook(webhook, payload, eventId)
      )

      await Promise.allSettled(deliveryPromises)
    } catch (err) {
      console.error('[WebhookService] fireEvent error:', err)
    }
  }

  // --------------------------------------------------
  // Delivery
  // --------------------------------------------------

  /**
   * Deliver a webhook payload to a single endpoint.
   * Signs the payload with HMAC-SHA256 and logs the delivery.
   */
  async deliverWebhook(
    webhook: BusinessWebhook,
    payload: WebhookPayload,
    eventId: string,
    attemptNumber: number = 1
  ): Promise<void> {
    const payloadString = JSON.stringify(payload)
    const signature = this.signPayload(payloadString, webhook.secret_key)

    // Create delivery record
    const { data: delivery, error: insertError } = await this.supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        business_id: webhook.business_id,
        event_type: payload.eventType,
        event_id: eventId,
        payload,
        status: 'pending',
        attempt_number: attemptNumber,
        max_attempts: 4,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[WebhookService] Failed to create delivery record:', insertError)
      return
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.eventType,
          'X-Webhook-Id': eventId,
          'User-Agent': 'VoiceFly-Webhooks/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const responseBody = await response.text().catch(() => '')

      if (response.ok) {
        // Success
        await this.supabase
          .from('webhook_deliveries')
          .update({
            status: 'success',
            http_status: response.status,
            response_body: responseBody.substring(0, 2000),
            sent_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        // Update last_triggered_at on the webhook
        await this.supabase
          .from('business_webhooks')
          .update({ last_triggered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', webhook.id)
      } else {
        // HTTP error - schedule retry if attempts remain
        await this.handleFailure(
          delivery.id,
          attemptNumber,
          response.status,
          responseBody.substring(0, 2000),
          `HTTP ${response.status}: ${response.statusText}`
        )
      }
    } catch (err: any) {
      // Network error or timeout
      const errorMessage = err.name === 'AbortError'
        ? 'Request timed out after 10s'
        : err.message || 'Network error'

      await this.handleFailure(
        delivery.id,
        attemptNumber,
        null,
        null,
        errorMessage
      )
    }
  }

  /**
   * Handle a failed delivery attempt. Schedules retry or marks as permanently failed.
   */
  private async handleFailure(
    deliveryId: string,
    attemptNumber: number,
    httpStatus: number | null,
    responseBody: string | null,
    errorMessage: string
  ): Promise<void> {
    const maxAttempts = 4 // 1 initial + 3 retries
    const retryIndex = attemptNumber - 1 // 0-indexed into RETRY_DELAYS

    if (attemptNumber < maxAttempts && retryIndex < RETRY_DELAYS.length) {
      const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[retryIndex])

      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          http_status: httpStatus,
          response_body: responseBody,
          error_message: errorMessage,
          sent_at: new Date().toISOString(),
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', deliveryId)
    } else {
      // Permanently failed
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          http_status: httpStatus,
          response_body: responseBody,
          error_message: errorMessage,
          sent_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
    }
  }

  // --------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------

  /**
   * Create a new webhook for a business.
   * Auto-generates a secure secret key for HMAC signing.
   */
  async createWebhook(
    businessId: string,
    config: CreateWebhookConfig
  ): Promise<BusinessWebhook> {
    const secretKey = `whsec_${crypto.randomBytes(32).toString('hex')}`

    const { data, error } = await this.supabase
      .from('business_webhooks')
      .insert({
        business_id: businessId,
        url: config.url,
        name: config.name,
        description: config.description || null,
        enabled_events: config.enabledEvents,
        secret_key: secretKey,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create webhook: ${error.message}`)
    }

    return data as BusinessWebhook
  }

  /**
   * Update an existing webhook.
   */
  async updateWebhook(
    webhookId: string,
    updates: UpdateWebhookConfig
  ): Promise<BusinessWebhook> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.url !== undefined) updateData.url = updates.url
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.enabledEvents !== undefined) updateData.enabled_events = updates.enabledEvents
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data, error } = await this.supabase
      .from('business_webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update webhook: ${error.message}`)
    }

    return data as BusinessWebhook
  }

  /**
   * Delete a webhook and its delivery history.
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('business_webhooks')
      .delete()
      .eq('id', webhookId)

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`)
    }

    return true
  }

  /**
   * Get all webhooks for a business.
   */
  async getWebhooksForBusiness(businessId: string): Promise<BusinessWebhook[]> {
    const { data, error } = await this.supabase
      .from('business_webhooks')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch webhooks: ${error.message}`)
    }

    return (data || []) as BusinessWebhook[]
  }

  /**
   * Get a single webhook by ID.
   */
  async getWebhook(webhookId: string): Promise<BusinessWebhook | null> {
    const { data, error } = await this.supabase
      .from('business_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch webhook: ${error.message}`)
    }

    return data as BusinessWebhook
  }

  // --------------------------------------------------
  // Testing
  // --------------------------------------------------

  /**
   * Send a test payload to a webhook endpoint.
   */
  async testWebhook(
    webhookId: string,
    eventType: WebhookEventType
  ): Promise<WebhookDelivery> {
    const webhook = await this.getWebhook(webhookId)
    if (!webhook) {
      throw new Error('Webhook not found')
    }

    const eventId = `test_${crypto.randomUUID()}`
    const payload: WebhookPayload = {
      event: `test.${eventType}`,
      eventType,
      businessId: webhook.business_id,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery from VoiceFly.',
        eventType,
      },
    }

    const payloadString = JSON.stringify(payload)
    const signature = this.signPayload(payloadString, webhook.secret_key)

    // Create delivery record
    const { data: delivery, error: insertError } = await this.supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        business_id: webhook.business_id,
        event_type: eventType,
        event_id: eventId,
        payload,
        status: 'pending',
        attempt_number: 1,
        max_attempts: 1, // No retries for test deliveries
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create test delivery: ${insertError.message}`)
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-Id': eventId,
          'User-Agent': 'VoiceFly-Webhooks/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const responseBody = await response.text().catch(() => '')

      const updateData = {
        status: response.ok ? 'success' : 'failed',
        http_status: response.status,
        response_body: responseBody.substring(0, 2000),
        sent_at: new Date().toISOString(),
        error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      }

      const { data: updated } = await this.supabase
        .from('webhook_deliveries')
        .update(updateData)
        .eq('id', delivery.id)
        .select()
        .single()

      return (updated || { ...delivery, ...updateData }) as WebhookDelivery
    } catch (err: any) {
      const errorMessage = err.name === 'AbortError'
        ? 'Request timed out after 10s'
        : err.message || 'Network error'

      const updateData = {
        status: 'failed' as const,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      }

      const { data: updated } = await this.supabase
        .from('webhook_deliveries')
        .update(updateData)
        .eq('id', delivery.id)
        .select()
        .single()

      return (updated || { ...delivery, ...updateData }) as WebhookDelivery
    }
  }

  // --------------------------------------------------
  // Delivery History
  // --------------------------------------------------

  /**
   * Get delivery history for a specific webhook.
   */
  async getDeliveryHistory(
    webhookId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    // Get total count
    const { count, error: countError } = await this.supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('webhook_id', webhookId)

    if (countError) {
      throw new Error(`Failed to count deliveries: ${countError.message}`)
    }

    // Get paginated results
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch deliveries: ${error.message}`)
    }

    return {
      deliveries: (data || []) as WebhookDelivery[],
      total: count || 0,
    }
  }

  // --------------------------------------------------
  // Retry Processing
  // --------------------------------------------------

  /**
   * Process pending retries in batches.
   * Should be called periodically (e.g., by a cron job or edge function).
   */
  async processRetries(batchSize: number = 20): Promise<number> {
    const now = new Date().toISOString()

    // Find deliveries due for retry
    const { data: pendingRetries, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*, business_webhooks(*)')
      .eq('status', 'retrying')
      .lte('next_retry_at', now)
      .order('next_retry_at', { ascending: true })
      .limit(batchSize)

    if (error) {
      console.error('[WebhookService] Error fetching retries:', error)
      return 0
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      return 0
    }

    let processedCount = 0

    for (const delivery of pendingRetries) {
      const webhook = delivery.business_webhooks as unknown as BusinessWebhook
      if (!webhook || !webhook.is_active) {
        // Webhook deleted or deactivated - mark as failed
        await this.supabase
          .from('webhook_deliveries')
          .update({ status: 'failed', error_message: 'Webhook no longer active' })
          .eq('id', delivery.id)
        processedCount++
        continue
      }

      const nextAttempt = delivery.attempt_number + 1
      const payload = delivery.payload as WebhookPayload
      const payloadString = JSON.stringify(payload)
      const signature = this.signPayload(payloadString, webhook.secret_key)

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT)

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': payload.eventType,
            'X-Webhook-Id': delivery.event_id,
            'X-Webhook-Retry': nextAttempt.toString(),
            'User-Agent': 'VoiceFly-Webhooks/1.0',
          },
          body: payloadString,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        const responseBody = await response.text().catch(() => '')

        if (response.ok) {
          await this.supabase
            .from('webhook_deliveries')
            .update({
              status: 'success',
              http_status: response.status,
              response_body: responseBody.substring(0, 2000),
              attempt_number: nextAttempt,
              sent_at: new Date().toISOString(),
              next_retry_at: null,
              error_message: null,
            })
            .eq('id', delivery.id)

          await this.supabase
            .from('business_webhooks')
            .update({ last_triggered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', webhook.id)
        } else {
          await this.handleRetryFailure(
            delivery.id,
            nextAttempt,
            response.status,
            responseBody.substring(0, 2000),
            `HTTP ${response.status}: ${response.statusText}`
          )
        }
      } catch (err: any) {
        const errorMessage = err.name === 'AbortError'
          ? 'Request timed out after 10s'
          : err.message || 'Network error'

        await this.handleRetryFailure(
          delivery.id,
          nextAttempt,
          null,
          null,
          errorMessage
        )
      }

      processedCount++
    }

    return processedCount
  }

  /**
   * Handle failure during a retry attempt.
   */
  private async handleRetryFailure(
    deliveryId: string,
    attemptNumber: number,
    httpStatus: number | null,
    responseBody: string | null,
    errorMessage: string
  ): Promise<void> {
    const maxAttempts = 4
    const retryIndex = attemptNumber - 1

    if (attemptNumber < maxAttempts && retryIndex < RETRY_DELAYS.length) {
      const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[retryIndex])

      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          http_status: httpStatus,
          response_body: responseBody,
          error_message: errorMessage,
          attempt_number: attemptNumber,
          sent_at: new Date().toISOString(),
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', deliveryId)
    } else {
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          http_status: httpStatus,
          response_body: responseBody,
          error_message: errorMessage,
          attempt_number: attemptNumber,
          sent_at: new Date().toISOString(),
          next_retry_at: null,
        })
        .eq('id', deliveryId)
    }
  }

  // --------------------------------------------------
  // Signing
  // --------------------------------------------------

  /**
   * Sign a payload using HMAC-SHA256.
   */
  private signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }
}

export const webhookService = WebhookService.getInstance()
