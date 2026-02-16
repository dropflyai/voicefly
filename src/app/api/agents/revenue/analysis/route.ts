import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { revenueIntelligenceAgent } from '@/lib/agents/revenue-intelligence'

/**
 * GET /api/agents/revenue/analysis
 * Returns revenue intelligence data
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

    // Get latest analysis
    const { data: latestAnalysis } = await supabase
      .from('revenue_analyses')
      .select('*')
      .eq('business_id', businessId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    // Get daily revenue for the past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, total_amount, service')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date')

    // Aggregate by date
    const dailyRevenue: Record<string, number> = {}
    const serviceRevenue: Record<string, number> = {}

    for (const appt of appointments || []) {
      const date = appt.date
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (appt.total_amount || 0)

      const service = appt.service || 'Other'
      serviceRevenue[service] = (serviceRevenue[service] || 0) + (appt.total_amount || 0)
    }

    // Format for charts
    const revenueByDay = Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const revenueByService = Object.entries(serviceRevenue)
      .map(([service, amount]) => ({ service, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Calculate totals
    const totalRevenue = Object.values(dailyRevenue).reduce((sum, v) => sum + v, 0)
    const totalTransactions = appointments?.length || 0
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    // Calculate week over week change
    const now = new Date()
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    let thisWeekRevenue = 0
    let lastWeekRevenue = 0

    for (const [date, amount] of Object.entries(dailyRevenue)) {
      const d = new Date(date)
      if (d >= thisWeekStart) {
        thisWeekRevenue += amount
      } else if (d >= lastWeekStart && d < thisWeekStart) {
        lastWeekRevenue += amount
      }
    }

    const weekOverWeekChange = lastWeekRevenue > 0
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalTransactions,
        averageTicket: Math.round(averageTicket * 100) / 100,
        weekOverWeekChange: Math.round(weekOverWeekChange * 10) / 10,
        healthScore: latestAnalysis?.health_score || 0,
        forecast30Day: latestAnalysis?.forecast_30day || 0,
        growthRate: latestAnalysis?.growth_rate || 0,
      },
      revenueByDay,
      revenueByService,
      topService: revenueByService[0]?.service || 'N/A',
      insights: latestAnalysis?.insights || [],
      lastAnalyzed: latestAnalysis?.analyzed_at,
    })
  } catch (error) {
    console.error('Error getting revenue analysis:', error)
    return NextResponse.json(
      { error: 'Failed to get revenue analysis' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/revenue/analysis
 * Trigger revenue analysis
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

    const result = await revenueIntelligenceAgent.analyzeRevenue(businessId)

    return NextResponse.json({
      success: result.success,
      executionId: result.executionId,
      output: result.output,
      insights: result.insights || [],
      error: result.error,
    })
  } catch (error) {
    console.error('Error running revenue analysis:', error)
    return NextResponse.json(
      { error: 'Failed to run revenue analysis' },
      { status: 500 }
    )
  }
}
