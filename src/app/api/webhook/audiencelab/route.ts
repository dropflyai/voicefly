import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'

// AudienceLab webhook endpoint
// Receives leads from AudienceLab platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('🎯 AudienceLab webhook received:', body)

    // Verify webhook authenticity (add your AudienceLab webhook secret)
    const signature = request.headers.get('x-audiencelab-signature')
    if (!verifyAudienceLabSignature(body, signature)) {
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
    console.log('✅ AudienceLab lead processed:', leadId)

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

function verifyAudienceLabSignature(body: any, signature: string | null): boolean {
  // Implement AudienceLab signature verification
  // For development, we'll skip verification
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // In production, verify the webhook signature
  const webhookSecret = process.env.AUDIENCELAB_WEBHOOK_SECRET
  if (!webhookSecret || !signature) {
    return false
  }

  // Add actual signature verification logic here
  // Usually involves HMAC-SHA256 verification

  return true // Placeholder
}