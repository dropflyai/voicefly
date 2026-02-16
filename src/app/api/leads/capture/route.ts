import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'
import crypto from 'crypto'

/**
 * Verify webhook signature for lead capture endpoints
 * Supports multiple signature formats from different providers
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  source: string
): boolean {
  // Get the appropriate secret based on source
  const secrets: Record<string, string | undefined> = {
    apollo: process.env.APOLLO_WEBHOOK_SECRET,
    audiencelab: process.env.AUDIENCELAB_WEBHOOK_SECRET,
    linkedin: process.env.LINKEDIN_WEBHOOK_SECRET,
    website: process.env.WEBSITE_FORM_SECRET
  }

  const secret = secrets[source.toLowerCase()]

  // If no secret configured for this source, skip verification in development
  if (!secret || secret.startsWith('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`No webhook secret configured for source: ${source}`)
      return false
    }
    console.warn(`⚠️ Skipping signature verification for ${source} (development mode)`)
    return true
  }

  if (!signature) {
    console.error('No signature provided in webhook request')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')

    // Use timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Universal lead capture endpoint
// Handles leads from AudienceLab, Apollo, LinkedIn, website forms, etc.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const source = request.headers.get('x-lead-source') || 'unknown'
    const signature = request.headers.get('x-webhook-signature') ||
                      request.headers.get('x-signature') ||
                      request.headers.get('x-hub-signature-256')

    // Verify webhook signature (SECURITY CRITICAL)
    // Skip for 'website' source which uses internal forms, or 'unknown' in dev
    if (source !== 'website' && source !== 'unknown') {
      if (!verifyWebhookSignature(rawBody, signature, source)) {
        console.error(`Webhook signature verification failed for source: ${source}`)
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
      console.log(`✅ Webhook signature verified for source: ${source}`)
    }

    const body = JSON.parse(rawBody)

    console.log(`📥 Lead capture request from ${source}:`, body)

    // Process the lead based on source
    const leadId = await LeadFlyIntegration.handleWebhook(source, body)

    if (!leadId) {
      return NextResponse.json(
        { error: 'Failed to process lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      leadId: leadId,
      message: 'Lead captured successfully'
    })

  } catch (error) {
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Lead capture failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for testing (DEVELOPMENT ONLY)
export async function GET(request: NextRequest) {
  // Only allow in development mode - SECURITY
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  const url = new URL(request.url)
  const source = url.searchParams.get('source') || 'test'

  // Test lead data
  const testLead = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Test Company Inc',
    title: 'CEO',
    industry: 'Technology',
    companySize: 'medium',
    source: source
  }

  const leadId = await LeadFlyIntegration.handleWebhook(source, testLead)

  return NextResponse.json({
    success: true,
    leadId: leadId,
    message: `Test lead captured from ${source}`,
    testData: testLead
  })
}