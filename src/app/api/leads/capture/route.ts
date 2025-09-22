import { NextRequest, NextResponse } from 'next/server'
import { LeadFlyIntegration } from '@/lib/leadfly-integration'

// Universal lead capture endpoint
// Handles leads from AudienceLab, Apollo, LinkedIn, website forms, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const source = request.headers.get('x-lead-source') || body.source || 'unknown'

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

// Handle GET requests for testing
export async function GET(request: NextRequest) {
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