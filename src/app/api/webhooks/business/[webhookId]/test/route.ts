/**
 * Webhook Test API
 *
 * POST /api/webhooks/business/[webhookId]/test - Send a test webhook delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { webhookService } from '@/lib/webhooks/webhook-service'
import { WebhookEventType } from '@/lib/webhooks/types'

const VALID_EVENT_TYPES: WebhookEventType[] = [
  'order_placed',
  'order_confirmed',
  'appointment_booked',
  'appointment_cancelled',
  'call_completed',
  'contact_captured',
  'payment_processed',
  'message_taken',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const body = await request.json()
    const { businessId, eventType } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!eventType) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 })
    }

    if (!VALID_EVENT_TYPES.includes(eventType as WebhookEventType)) {
      return NextResponse.json({
        error: `Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}`,
      }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Verify the webhook exists and belongs to the business
    const webhook = await webhookService.getWebhook(webhookId)
    if (!webhook || webhook.business_id !== businessId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const delivery = await webhookService.testWebhook(webhookId, eventType as WebhookEventType)

    return NextResponse.json({
      success: delivery.status === 'success',
      delivery,
      message: delivery.status === 'success'
        ? 'Test webhook delivered successfully'
        : `Test webhook failed: ${delivery.error_message}`,
    })
  } catch (error: any) {
    console.error('[API] Failed to test webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
