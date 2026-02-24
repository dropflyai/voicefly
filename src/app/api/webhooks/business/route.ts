/**
 * Business Webhooks API
 *
 * GET    /api/webhooks/business?businessId=xxx - List webhooks for a business
 * POST   /api/webhooks/business               - Create a new webhook
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const webhooks = await webhookService.getWebhooksForBusiness(businessId)

    return NextResponse.json({
      webhooks,
      count: webhooks.length,
    })
  } catch (error: any) {
    console.error('[API] Failed to fetch webhooks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, url, name, description, enabledEvents } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!url) {
      return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Webhook name required' }, { status: 400 })
    }

    if (!enabledEvents || !Array.isArray(enabledEvents) || enabledEvents.length === 0) {
      return NextResponse.json({ error: 'At least one enabled event is required' }, { status: 400 })
    }

    // Validate event types
    const invalidEvents = enabledEvents.filter(
      (e: string) => !VALID_EVENT_TYPES.includes(e as WebhookEventType)
    )
    if (invalidEvents.length > 0) {
      return NextResponse.json({
        error: `Invalid event types: ${invalidEvents.join(', ')}. Valid types: ${VALID_EVENT_TYPES.join(', ')}`,
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const webhook = await webhookService.createWebhook(businessId, {
      url,
      name,
      description,
      enabledEvents: enabledEvents as WebhookEventType[],
    })

    return NextResponse.json({
      success: true,
      webhook,
      message: `Webhook "${name}" created successfully`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Failed to create webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
