import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'

// Apollo webhook endpoint
// Receives leads from Apollo.io platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🚀 Apollo webhook received:', body)

    // Verify Apollo webhook authenticity
    const signature = request.headers.get('x-apollo-signature')
    if (!verifyApolloSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Handle different Apollo event types
    switch (body.event_type) {
      case 'contact_replied':
      case 'contact_opened_email':
      case 'contact_clicked_link':
        // High-intent signals from Apollo
        body.intent_signals = [body.event_type]
        body.engagement_score = 75
        break

      case 'contact_bounced':
      case 'contact_unsubscribed':
        // Negative signals - don't process
        return NextResponse.json({
          success: true,
          message: 'Negative signal received, lead not processed'
        })

      case 'contact_sequence_finished':
        // Sequence completed - mark for different handling
        body.intent_signals = ['sequence_completed']
        body.engagement_score = 40
        break

      default:
        // Default processing
        body.engagement_score = 50
    }

    // Process the Apollo lead
    const leadId = await LeadFlyIntegration.captureLeadFromApollo(body)

    if (!leadId) {
      return NextResponse.json(
        { error: 'Failed to process Apollo lead' },
        { status: 500 }
      )
    }

    console.log('✅ Apollo lead processed:', leadId)

    return NextResponse.json({
      success: true,
      leadId: leadId,
      event_type: body.event_type,
      message: 'Apollo lead captured successfully'
    })

  } catch (error) {
    console.error('Apollo webhook error:', error)
    return NextResponse.json(
      { error: 'Apollo webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyApolloSignature(body: any, signature: string | null): boolean {
  const webhookSecret = process.env.APOLLO_WEBHOOK_SECRET

  // SECURITY: Always verify signatures, even in development
  if (!webhookSecret || !signature) {
    console.error('Apollo webhook secret or signature missing')
    return false
  }

  try {
    const crypto = require('crypto')

    // Compute HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Apollo signature verification error:', error)
    return false
  }
}