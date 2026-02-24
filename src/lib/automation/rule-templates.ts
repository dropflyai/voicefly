/**
 * Pre-built Automation Rule Templates
 *
 * Organized by business type. Users can enable these with one click
 * and customize the message text / threshold values.
 */

import { RuleCondition, RuleAction } from './automation-engine'

export interface RuleTemplate {
  id: string
  name: string
  description: string
  category: 'universal' | 'restaurant' | 'appointment' | 'integration'
  triggerEvent: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  icon: string // emoji for display
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  // ============================================
  // UNIVERSAL TEMPLATES
  // ============================================
  {
    id: 'notify-negative-call',
    name: 'Alert on Negative Calls',
    description: 'Send an SMS to the business owner when a call has a negative outcome or short duration suggesting a hangup.',
    category: 'universal',
    triggerEvent: 'call_completed',
    conditions: [
      { field: 'duration', operator: 'lt', value: 30 },
    ],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'owner',
          message: 'Short call alert ({{duration}}s) from {{callerPhone}}. Summary: {{summary}}',
        },
      },
    ],
    icon: 'warning',
  },
  {
    id: 'missed-call-alert',
    name: 'Missed Call Alert',
    description: 'Notify you immediately when a call is missed or lasts under 15 seconds.',
    category: 'universal',
    triggerEvent: 'call_completed',
    conditions: [
      { field: 'duration', operator: 'lt', value: 15 },
    ],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'owner',
          message: 'Missed/dropped call from {{callerPhone}}. Your employee could not connect. You may want to call them back.',
        },
      },
    ],
    icon: 'phone-missed',
  },
  {
    id: 'new-message-notification',
    name: 'New Message Notification',
    description: 'Get notified when your phone employee takes a message from a caller.',
    category: 'universal',
    triggerEvent: 'message_received',
    conditions: [],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'owner',
          message: 'New message from {{callerName}} ({{callerPhone}}): "{{message}}" - Urgency: {{urgency}}',
        },
      },
    ],
    icon: 'message',
  },
  {
    id: 'daily-escalation',
    name: 'Urgent Message Escalation',
    description: 'Immediately escalate urgent messages via SMS and email.',
    category: 'universal',
    triggerEvent: 'message_received',
    conditions: [
      { field: 'urgency', operator: 'eq', value: 'urgent' },
    ],
    actions: [
      {
        type: 'escalate',
        config: {
          message: 'URGENT message from {{callerName}} ({{callerPhone}}): "{{message}}"',
          subject: 'URGENT: Message from {{callerName}}',
        },
      },
    ],
    icon: 'alert',
  },

  // ============================================
  // RESTAURANT / ORDER TEMPLATES
  // ============================================
  {
    id: 'large-order-alert',
    name: 'Large Order Alert',
    description: 'Get notified when an order exceeds a certain amount.',
    category: 'restaurant',
    triggerEvent: 'order_confirmed',
    conditions: [
      { field: 'total', operator: 'gt', value: 50 },
    ],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'owner',
          message: 'Large order! ${{total}} from {{customerPhone}} ({{itemCount}} items). Payment: {{paymentMethod}}.',
        },
      },
    ],
    icon: 'dollar',
  },
  {
    id: 'order-confirmation-sms',
    name: 'Order Confirmation SMS',
    description: 'Send customers an SMS confirming their order details.',
    category: 'restaurant',
    triggerEvent: 'order_confirmed',
    conditions: [],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'customer',
          message: 'Your order has been confirmed! Total: ${{total}}. We are preparing it now. Thank you for your order!',
        },
      },
    ],
    icon: 'check',
  },
  {
    id: 'sync-orders-to-square',
    name: 'Sync Orders to Square POS',
    description: 'Automatically push confirmed phone orders to your Square POS system.',
    category: 'restaurant',
    triggerEvent: 'order_confirmed',
    conditions: [],
    actions: [
      {
        type: 'sync_square',
        config: { syncType: 'order' },
      },
    ],
    icon: 'sync',
  },

  // ============================================
  // APPOINTMENT TEMPLATES
  // ============================================
  {
    id: 'new-booking-notification',
    name: 'New Booking Notification',
    description: 'Get notified when a new appointment is booked.',
    category: 'appointment',
    triggerEvent: 'appointment_booked',
    conditions: [],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'owner',
          message: 'New booking: {{customerName}} for {{service}} on {{date}} at {{time}}.',
        },
      },
    ],
    icon: 'calendar',
  },
  {
    id: 'booking-confirmation-sms',
    name: 'Booking Confirmation SMS',
    description: 'Send the customer a confirmation SMS when their appointment is booked.',
    category: 'appointment',
    triggerEvent: 'appointment_booked',
    conditions: [],
    actions: [
      {
        type: 'send_sms',
        config: {
          to: 'customer',
          message: 'Your appointment for {{service}} is confirmed for {{date}} at {{time}}. We look forward to seeing you!',
        },
      },
    ],
    icon: 'check-calendar',
  },
  {
    id: 'cancellation-alert',
    name: 'Cancellation Alert',
    description: 'Notify the business owner when an appointment is cancelled.',
    category: 'appointment',
    triggerEvent: 'appointment_cancelled',
    conditions: [],
    actions: [
      {
        type: 'escalate',
        config: {
          message: 'Appointment cancelled: {{customerName}} cancelled their {{service}} appointment. Reason: {{reason}}',
          subject: 'Appointment Cancelled: {{customerName}}',
        },
      },
    ],
    icon: 'cancel',
  },

  // ============================================
  // INTEGRATION TEMPLATES
  // ============================================
  {
    id: 'sync-contacts-hubspot',
    name: 'Sync New Contacts to HubSpot',
    description: 'Automatically create or update HubSpot contacts when a new customer interacts with your business.',
    category: 'integration',
    triggerEvent: 'call_completed',
    conditions: [],
    actions: [
      {
        type: 'sync_hubspot',
        config: { syncType: 'contact' },
      },
    ],
    icon: 'hubspot',
  },
  {
    id: 'webhook-all-events',
    name: 'Fire Webhook on All Calls',
    description: 'Send call data to an external URL for custom processing.',
    category: 'integration',
    triggerEvent: 'call_completed',
    conditions: [],
    actions: [
      {
        type: 'send_webhook',
        config: {
          url: '',  // User must fill in
          method: 'POST',
        },
      },
    ],
    icon: 'webhook',
  },
]

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category?: string): RuleTemplate[] {
  if (!category) return RULE_TEMPLATES
  return RULE_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find(t => t.id === id)
}
