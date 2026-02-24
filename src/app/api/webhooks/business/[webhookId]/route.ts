/**
 * Individual Webhook API
 *
 * GET    /api/webhooks/business/[webhookId]?businessId=xxx - Get webhook details
 * PATCH  /api/webhooks/business/[webhookId]               - Update webhook
 * DELETE /api/webhooks/business/[webhookId]?businessId=xxx - Delete webhook
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const webhook = await webhookService.getWebhook(webhookId)

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Verify the webhook belongs to the business
    if (webhook.business_id !== businessId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch (error: any) {
    console.error('[API] Failed to fetch webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const body = await request.json()
    const { businessId, url, name, description, enabledEvents, isActive } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Verify the webhook exists and belongs to the business
    const existing = await webhookService.getWebhook(webhookId)
    if (!existing || existing.business_id !== businessId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
      }
    }

    // Validate event types if provided
    if (enabledEvents) {
      if (!Array.isArray(enabledEvents) || enabledEvents.length === 0) {
        return NextResponse.json({ error: 'At least one enabled event is required' }, { status: 400 })
      }

      const invalidEvents = enabledEvents.filter(
        (e: string) => !VALID_EVENT_TYPES.includes(e as WebhookEventType)
      )
      if (invalidEvents.length > 0) {
        return NextResponse.json({
          error: `Invalid event types: ${invalidEvents.join(', ')}`,
        }, { status: 400 })
      }
    }

    const webhook = await webhookService.updateWebhook(webhookId, {
      url,
      name,
      description,
      enabledEvents: enabledEvents as WebhookEventType[] | undefined,
      isActive,
    })

    return NextResponse.json({
      success: true,
      webhook,
      message: 'Webhook updated successfully',
    })
  } catch (error: any) {
    console.error('[API] Failed to update webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Verify the webhook exists and belongs to the business
    const existing = await webhookService.getWebhook(webhookId)
    if (!existing || existing.business_id !== businessId) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await webhookService.deleteWebhook(webhookId)

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    })
  } catch (error: any) {
    console.error('[API] Failed to delete webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
