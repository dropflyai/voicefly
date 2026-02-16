import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { leadQualificationAgent } from '@/lib/agents/lead-qualification'

/**
 * GET /api/agents/leads/qualified
 * Returns leads sorted by qualification score
 */
export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const businessId = authResult.user.businessId
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') // hot, warm, cold, disqualified
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeUnqualified = searchParams.get('includeUnqualified') === 'true'

    let query = supabase
      .from('leads')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        company,
        source,
        status,
        qualification_score,
        qualification_tier,
        qualification_factors,
        recommended_action,
        estimated_value,
        qualified_at,
        created_at,
        updated_at
      `)
      .eq('business_id', businessId)
      .order('qualification_score', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (tier) {
      query = query.eq('qualification_tier', tier)
    }

    if (!includeUnqualified) {
      query = query.not('qualification_score', 'is', null)
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching qualified leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Calculate tier distribution
    const tierCounts = {
      hot: leads?.filter((l) => l.qualification_tier === 'hot').length || 0,
      warm: leads?.filter((l) => l.qualification_tier === 'warm').length || 0,
      cold: leads?.filter((l) => l.qualification_tier === 'cold').length || 0,
      disqualified: leads?.filter((l) => l.qualification_tier === 'disqualified').length || 0,
      unqualified: leads?.filter((l) => !l.qualification_tier).length || 0,
    }

    // Calculate total estimated pipeline value
    const pipelineValue = leads?.reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0

    // Get average score
    const qualifiedLeads = leads?.filter((l) => l.qualification_score !== null) || []
    const avgScore = qualifiedLeads.length > 0
      ? Math.round(qualifiedLeads.reduce((sum, l) => sum + l.qualification_score, 0) / qualifiedLeads.length)
      : 0

    return NextResponse.json({
      leads: leads || [],
      summary: {
        total: leads?.length || 0,
        tierCounts,
        pipelineValue,
        averageScore: avgScore,
      },
    })
  } catch (error) {
    console.error('Error getting qualified leads:', error)
    return NextResponse.json(
      { error: 'Failed to get qualified leads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/leads/qualified
 * Trigger batch lead qualification
 */
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const businessId = authResult.user.businessId
    const body = await request.json()
    const { leadId, unqualifiedOnly = true, limit = 50 } = body

    let result

    if (leadId) {
      // Qualify single lead
      result = await leadQualificationAgent.qualifyLead(leadId, businessId)
    } else {
      // Batch qualify
      result = await leadQualificationAgent.batchQualify(businessId, {
        unqualifiedOnly,
        limit,
      })
    }

    return NextResponse.json({
      success: result.success,
      executionId: result.executionId,
      output: result.output,
      insights: result.insights || [],
      error: result.error,
    })
  } catch (error) {
    console.error('Error qualifying leads:', error)
    return NextResponse.json(
      { error: 'Failed to qualify leads' },
      { status: 500 }
    )
  }
}
