import { NextRequest, NextResponse } from 'next/server'
import { ResearchAPI } from '@/lib/research-api'

export const dynamic = 'force-dynamic'

// Create marketing campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      business_id,
      name,
      campaign_type,
      subject_line,
      preview_text,
      email_content,
      source_research_id,
      research_insights,
      target_segment,
      target_lead_status,
      target_tags
    } = body

    if (!business_id || !name) {
      return NextResponse.json(
        { error: 'business_id and name are required' },
        { status: 400 }
      )
    }

    const campaign = await ResearchAPI.createCampaign({
      business_id,
      name,
      campaign_type: campaign_type || 'email',
      status: 'draft',
      subject_line,
      preview_text,
      email_content,
      source_research_id,
      research_insights,
      target_segment: target_segment || 'all_customers',
      target_lead_status,
      target_tags
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
    const business_id = request.nextUrl.searchParams.get('business_id')
    const campaign_type = request.nextUrl.searchParams.get('campaign_type') as 'email' | 'sms' | 'voice' | undefined
    const status = request.nextUrl.searchParams.get('status') || undefined
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

    if (!business_id) {
      return NextResponse.json(
        { error: 'business_id is required' },
        { status: 400 }
      )
    }

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
