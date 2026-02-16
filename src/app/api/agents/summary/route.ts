import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { mayaPrime } from '@/lib/agents/maya-prime'

/**
 * GET /api/agents/summary
 * Returns daily business summary from Maya Prime
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get stored summary
    const { data: summary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (summary) {
      return NextResponse.json({
        summary: {
          date: summary.date,
          metrics: summary.metrics,
          highlights: summary.highlights,
          concerns: summary.concerns,
          opportunities: summary.opportunities,
          recommendedActions: summary.recommended_actions,
          agentExecutions: summary.agent_executions,
        },
      })
    }

    // No stored summary, return real-time data
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Get today's calls
    const { data: calls } = await supabase
      .from('voice_ai_calls')
      .select('id, outcome, duration')
      .eq('business_id', businessId)
      .gte('created_at', today)

    // Get today's appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, total_amount, status')
      .eq('business_id', businessId)
      .gte('created_at', today)

    // Get today's leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('business_id', businessId)
      .gte('created_at', today)

    // Get today's agent executions
    const { data: executions } = await supabase
      .from('agent_executions')
      .select('id, status, insights_count, actions_count')
      .eq('business_id', businessId)
      .gte('created_at', today)

    const totalCalls = calls?.length || 0
    const appointmentsBooked = appointments?.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length || 0
    const totalRevenue = appointments?.filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0
    const leadsGenerated = leads?.length || 0
    const conversionRate = totalCalls > 0 ? (appointmentsBooked / totalCalls) * 100 : 0

    const agentStats = {
      total: executions?.length || 0,
      successful: executions?.filter((e) => e.status === 'completed').length || 0,
      failed: executions?.filter((e) => e.status === 'failed').length || 0,
      insights: executions?.reduce((sum, e) => sum + (e.insights_count || 0), 0) || 0,
      actions: executions?.reduce((sum, e) => sum + (e.actions_count || 0), 0) || 0,
    }

    // Generate highlights and concerns
    const highlights: string[] = []
    const concerns: string[] = []

    if (totalCalls > 0) {
      highlights.push(`Handled ${totalCalls} customer calls`)
    }
    if (appointmentsBooked > 0) {
      highlights.push(`Booked ${appointmentsBooked} appointments`)
    }
    if (totalRevenue > 0) {
      highlights.push(`Generated $${totalRevenue.toLocaleString()} in revenue`)
    }
    if (agentStats.insights > 0) {
      highlights.push(`AI agents generated ${agentStats.insights} insights`)
    }

    if (totalCalls === 0 && now.getHours() >= 12) {
      concerns.push('No calls received today - check voice agent status')
    }
    if (conversionRate < 20 && totalCalls >= 5) {
      concerns.push(`Low conversion rate (${conversionRate.toFixed(1)}%)`)
    }
    if (agentStats.failed > agentStats.successful) {
      concerns.push('Agent failure rate is high - review logs')
    }

    return NextResponse.json({
      summary: {
        date: today,
        metrics: {
          totalCalls,
          totalRevenue,
          appointmentsBooked,
          leadsGenerated,
          conversionRate: Math.round(conversionRate * 100) / 100,
          customerSatisfaction: 0, // Would need sentiment data
        },
        highlights,
        concerns,
        opportunities: [],
        recommendedActions: [],
        agentExecutions: agentStats,
      },
      isRealtime: true,
    })
  } catch (error) {
    console.error('Error getting summary:', error)
    return NextResponse.json(
      { error: 'Failed to get summary' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/summary
 * Generate a new daily summary
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

    const summary = await agentRegistry.generateDailySummary(businessId)

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary - insufficient credits or data' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
