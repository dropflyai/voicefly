import { NextRequest, NextResponse } from 'next/server'
import { ResearchAPI } from '@/lib/research-api'
import { validateAuth, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { campaignCreateSchema, validate } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// Create marketing campaign
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Validate authentication
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = validate(campaignCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { businessId, name, type, status, target_audience, schedule, content, budget_cents, goals } = validation.data

    // Use provided business ID or fall back to user's primary
    const targetBusinessId = businessId || authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(targetBusinessId)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    // Map to ResearchAPI expected format
    const campaign = await ResearchAPI.createCampaign({
      business_id: targetBusinessId,
      name,
      campaign_type: type === 'multi' ? 'email' : type, // Default multi to email for now
      status: status || 'draft',
      target_segment: target_audience?.segment || 'all_customers',
      target_lead_status: target_audience?.lead_status,
      target_tags: target_audience?.tags,
      email_content: content?.body,
      subject_line: content?.subject,
      preview_text: content?.preview
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get campaigns
export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Validate authentication
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const business_id = request.nextUrl.searchParams.get('business_id') ||
                       request.nextUrl.searchParams.get('businessId') ||
                       authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(business_id)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    const campaign_type = request.nextUrl.searchParams.get('campaign_type') as 'email' | 'sms' | 'voice' | undefined
    const status = request.nextUrl.searchParams.get('status') || undefined
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

    const campaigns = await ResearchAPI.getCampaigns(business_id, {
      campaign_type,
      status,
      limit
    })

    return NextResponse.json({
      campaigns,
      count: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
