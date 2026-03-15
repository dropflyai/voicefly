import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'
import crypto from 'crypto'

// AudienceLab webhook endpoint
// Receives leads from AudienceLab platform
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    console.log('AudienceLab webhook received:', body)

    // Verify webhook authenticity
    const signature = request.headers.get('x-webhook-signature')
    if (!verifyAudienceLabSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Process the AudienceLab lead
    const leadId = await LeadFlyIntegration.captureLeadFromAudienceLab(body)

    if (!leadId) {
      return NextResponse.json(
        { error: 'Failed to process AudienceLab lead' },
        { status: 500 }
      )
    }

    // Log successful processing
    console.log('AudienceLab lead processed:', leadId)

    return NextResponse.json({
      success: true,
      leadId: leadId,
      message: 'AudienceLab lead captured successfully'
    })

  } catch (error) {
    console.error('AudienceLab webhook error:', error)
    return NextResponse.json(
      { error: 'AudienceLab webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyAudienceLabSignature(rawBody: string, signature: string | null): boolean {
  // Fail closed: if secret is not configured, reject all requests
  const webhookSecret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('AUDIENCELAB_WEBHOOK_SECRET is not set — rejecting webhook')
    return false
  }

  if (!signature) {
    return false
  }

  // Compute HMAC-SHA256 of the raw body using the secret
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}