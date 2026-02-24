/**
 * Webhook Deliveries API
 *
 * GET /api/webhooks/business/[webhookId]/deliveries?businessId=xxx&limit=50&offset=0
 *     - Get delivery history for a webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { webhookService } from '@/lib/webhooks/webhook-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
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

    const { deliveries, total } = await webhookService.getDeliveryHistory(
      webhookId,
      Math.min(limit, 100), // Cap at 100 per page
      Math.max(offset, 0)
    )

    return NextResponse.json({
      deliveries,
      total,
      limit: Math.min(limit, 100),
      offset: Math.max(offset, 0),
    })
  } catch (error: any) {
    console.error('[API] Failed to fetch webhook deliveries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
