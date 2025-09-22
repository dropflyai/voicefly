import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'

// LinkedIn webhook endpoint
// Receives leads from LinkedIn Sales Navigator, LinkedIn Ads, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('💼 LinkedIn webhook received:', body)

    // Verify LinkedIn webhook authenticity
    const signature = request.headers.get('x-linkedin-signature')
    if (!verifyLinkedInSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Handle different LinkedIn event types
    switch (body.event_type) {
      case 'lead_form_submission':
        // Lead Ads form submission
        body.intent_signals = ['linkedin_lead_form']
        body.engagement_score = 85
        break

      case 'connection_request_accepted':
        // Sales Navigator connection
        body.intent_signals = ['linkedin_connection']
        body.engagement_score = 60
        break

      case 'inmail_replied':
        // InMail response
        body.intent_signals = ['linkedin_inmail_reply']
        body.engagement_score = 80
        break

      case 'profile_viewed':
        // Profile view
        body.intent_signals = ['linkedin_profile_view']
        body.engagement_score = 30
        break

      case 'company_page_followed':
        // Company page follow
        body.intent_signals = ['linkedin_company_follow']
        body.engagement_score = 45
        break

      default:
        body.engagement_score = 50
    }

    // Process the LinkedIn lead
    const leadId = await LeadFlyIntegration.captureLeadFromLinkedIn(body)

    if (!leadId) {
      return NextResponse.json(
        { error: 'Failed to process LinkedIn lead' },
        { status: 500 }
      )
    }

    console.log('✅ LinkedIn lead processed:', leadId)

    return NextResponse.json({
      success: true,
      leadId: leadId,
      event_type: body.event_type,
      message: 'LinkedIn lead captured successfully'
    })

  } catch (error) {
    console.error('LinkedIn webhook error:', error)
    return NextResponse.json(
      { error: 'LinkedIn webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyLinkedInSignature(body: any, signature: string | null): boolean {
  // Implement LinkedIn signature verification
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET
  if (!webhookSecret || !signature) {
    return false
  }

  // Add LinkedIn signature verification logic here
  return true // Placeholder
}