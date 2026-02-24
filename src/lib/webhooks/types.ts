/**
 * Webhook System Types
 *
 * Type definitions for the Zapier/Make webhook integration system.
 */

export type WebhookEventType =
  | 'order_placed'
  | 'order_confirmed'
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'call_completed'
  | 'contact_captured'
  | 'payment_processed'
  | 'message_taken'

export interface BusinessWebhook {
  id: string
  business_id: string
  url: string
  name: string
  description: string | null
  enabled_events: WebhookEventType[]
  secret_key: string
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  business_id: string
  event_type: WebhookEventType
  event_id: string
  payload: WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retrying'
  http_status: number | null
  response_body: string | null
  attempt_number: number
  max_attempts: number
  error_message: string | null
  sent_at: string | null
  next_retry_at: string | null
  created_at: string
}

export interface WebhookPayload {
  event: string
  eventType: WebhookEventType
  businessId: string
  timestamp: string
  data: Record<string, unknown>
}

export interface CreateWebhookConfig {
  url: string
  name: string
  description?: string
  enabledEvents: WebhookEventType[]
}

export interface UpdateWebhookConfig {
  url?: string
  name?: string
  description?: string
  enabledEvents?: WebhookEventType[]
  isActive?: boolean
}
