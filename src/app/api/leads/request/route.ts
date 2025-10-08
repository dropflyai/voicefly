import { NextRequest, NextResponse } from 'next/server'
import { getApolloService, LeadSearchCriteria } from '@/lib/apollo-service'
import { getCampaignAutomation } from '@/lib/campaign-automation'
import { supabase } from '@/lib/supabase-client'

/**
 * POST /api/leads/request
 *
 * Customer requests leads - we fetch, enrich, and auto-create campaigns
 *
 * Request body:
 * {
 *   businessId: string
 *   criteria: {
 *     industry: string[]
 *     location: { city, state, country }
 *     companySize: { min, max }
 *     jobTitles: string[]
 *     limit: number
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   leads: EnrichedLead[],
 *   campaigns: {
 *     email?: EmailCampaign,
 *     voice?: VoiceCampaign
 *   },
 *   summary: {
 *     total: number,
 *     cold: number,
 *     warm: number,
 *     hot: number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, criteria } = await request.json()

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      )
    }

    // Validate subscription tier and lead quota
    const quotaCheck = await checkLeadQuota(businessId, criteria.limit || 50)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Lead quota exceeded',
          message: quotaCheck.message,
          current: quotaCheck.current,
          limit: quotaCheck.limit,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    console.log(`🔍 Lead request from business ${businessId}:`, criteria)

    // Step 1: Search Apollo and enrich leads
    const apollo = getApolloService()
    const enrichedLeads = await apollo.searchAndEnrichLeads(criteria as LeadSearchCriteria)

    if (enrichedLeads.length === 0) {
      return NextResponse.json({
        success: true,
        leads: [],
        campaigns: {},
        summary: { total: 0, cold: 0, warm: 0, hot: 0 },
        message: 'No leads found matching criteria. Try broadening your search.'
      })
    }

    console.log(`✅ Found and enriched ${enrichedLeads.length} leads`)

    // Step 2: Save leads to database
    const savedLeads = await saveLeadsToDatabase(businessId, enrichedLeads)
    console.log(`💾 Saved ${savedLeads.length} leads to database`)

    // Step 3: Auto-create campaigns
    const automation = getCampaignAutomation()
    const campaigns = await automation.autoCreateCampaigns(businessId, enrichedLeads)

    console.log(`🤖 Auto-created campaigns:`, {
      email: !!campaigns.emailCampaign,
      voice: !!campaigns.voiceCampaign
    })

    // Step 4: Update lead quota usage
    await updateLeadQuota(businessId, enrichedLeads.length)

    // Step 5: Calculate summary
    const summary = {
      total: enrichedLeads.length,
      cold: enrichedLeads.filter(l => l.segment === 'cold').length,
      warm: enrichedLeads.filter(l => l.segment === 'warm').length,
      hot: enrichedLeads.filter(l => l.segment === 'hot').length
    }

    return NextResponse.json({
      success: true,
      leads: enrichedLeads,
      campaigns,
      summary,
      message: `Successfully delivered ${enrichedLeads.length} leads with auto-generated campaigns`
    })

  } catch (error) {
    console.error('Lead request error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process lead request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/request/quota?businessId=xxx
 *
 * Check current lead quota status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      )
    }

    // Get business subscription tier
    const { data: business, error } = await supabase
      .from('businesses')
      .select('subscription_tier, subscription_status, metadata')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get lead quotas by tier
    const quotas = {
      starter: 25,
      professional: 100,
      enterprise: 500
    }

    const tier = business.subscription_tier || 'starter'
    const monthlyQuota = quotas[tier as keyof typeof quotas] || 25

    // Get current month usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: usedThisMonth } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', startOfMonth.toISOString())

    const remaining = monthlyQuota - (usedThisMonth || 0)

    return NextResponse.json({
      success: true,
      tier,
      quota: {
        monthly: monthlyQuota,
        used: usedThisMonth || 0,
        remaining: Math.max(0, remaining)
      },
      renewsAt: getNextMonthStart().toISOString()
    })

  } catch (error) {
    console.error('Quota check error:', error)

    return NextResponse.json(
      { error: 'Failed to check quota' },
      { status: 500 }
    )
  }
}

/**
 * Check if business has quota for requested leads
 */
async function checkLeadQuota(businessId: string, requestedCount: number): Promise<{
  allowed: boolean
  current: number
  limit: number
  message?: string
}> {
  // Get business tier
  const { data: business } = await supabase
    .from('businesses')
    .select('subscription_tier')
    .eq('id', businessId)
    .single()

  const tier = business?.subscription_tier || 'starter'

  // Lead quotas by tier
  const quotas = {
    starter: 25,
    professional: 100,
    enterprise: 500
  }

  const monthlyQuota = quotas[tier as keyof typeof quotas] || 25

  // Get usage this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: used } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString())

  const remaining = monthlyQuota - (used || 0)

  if (requestedCount > remaining) {
    return {
      allowed: false,
      current: used || 0,
      limit: monthlyQuota,
      message: `Quota exceeded. You have ${remaining} leads remaining this month. Upgrade to get more.`
    }
  }

  return {
    allowed: true,
    current: used || 0,
    limit: monthlyQuota
  }
}

/**
 * Save enriched leads to database
 */
async function saveLeadsToDatabase(businessId: string, leads: any[]): Promise<any[]> {
  const savedLeads = []

  for (const lead of leads) {
    // Check for duplicates
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('business_id', businessId)
      .or(`email.eq.${lead.email},phone.eq.${lead.phone}`)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping duplicate lead: ${lead.email || lead.phone}`)
      continue
    }

    // Save new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        business_id: businessId,
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        email: lead.email,
        phone: lead.phone,
        company_name: lead.companyName,
        job_title: lead.jobTitle,
        linkedin_url: lead.linkedinUrl,
        website: lead.companyDomain,
        industry: lead.companyIndustry,
        company_size: lead.companySize,
        location: `${lead.city}, ${lead.state}`,
        lead_source: 'apollo',
        lead_status: lead.segment === 'hot' ? 'qualified' : 'new',
        qualification_score: lead.qualificationScore,
        estimated_deal_value: lead.estimatedDealValue,
        estimated_close_date: lead.estimatedCloseDate,
        notes: JSON.stringify(lead.deepResearch),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!error && data) {
      savedLeads.push(data)
    } else {
      console.error('Failed to save lead:', error)
    }
  }

  return savedLeads
}

/**
 * Update lead quota usage
 */
async function updateLeadQuota(businessId: string, count: number): Promise<void> {
  // Just log for now - quota is calculated on-demand from leads table
  console.log(`📊 Business ${businessId} used ${count} leads this request`)
}

/**
 * Get start of next month
 */
function getNextMonthStart(): Date {
  const next = new Date()
  next.setMonth(next.getMonth() + 1)
  next.setDate(1)
  next.setHours(0, 0, 0, 0)
  return next
}
