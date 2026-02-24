/**
 * Quality Coaching API
 *
 * GET /api/coaching?businessId=...
 *   Returns call quality scores, coaching tips, and trends.
 *
 * Query params:
 *   - businessId (required)
 *   - period: "7d" | "30d" | "90d" (default: "30d")
 *   - employeeId: filter by specific employee
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    const period = request.nextUrl.searchParams.get('period') || '30d'
    const employeeId = request.nextUrl.searchParams.get('employeeId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date range
    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()

    // Build base query for calls with analysis data
    let callsQuery = supabase
      .from('employee_calls')
      .select('id, call_id, employee_id, duration, summary, status, customer_phone, created_at, metadata')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })

    if (employeeId) {
      callsQuery = callsQuery.eq('employee_id', employeeId)
    }

    const { data: calls, error } = await callsQuery.limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also get analysis data from voice_ai_calls if available
    let analysisQuery = supabase
      .from('voice_ai_calls')
      .select('id, analysis, lead_quality, outcome, analyzed_at')
      .eq('business_id', businessId)
      .gte('created_at', sinceDate)
      .not('analysis', 'is', null)

    const { data: analyses } = await analysisQuery.limit(200)

    // Build coaching report
    const totalCalls = calls?.length || 0
    const analysisMap = new Map((analyses || []).map(a => [a.id, a]))

    // Aggregate metrics
    let totalDuration = 0
    let sentimentScores: number[] = []
    let outcomes: Record<string, number> = {}
    let leadQualities: Record<string, number> = { hot: 0, warm: 0, cold: 0 }
    let coachingTips: Record<string, number> = {} // tip -> frequency
    let followUpsNeeded = 0

    for (const call of (calls || [])) {
      totalDuration += call.duration || 0

      // Check for analysis on this call
      const analysis = analysisMap.get(call.call_id)
      if (analysis?.analysis) {
        const a = analysis.analysis
        if (a.sentiment?.score !== undefined) {
          sentimentScores.push(a.sentiment.score)
        }
        if (a.outcome) {
          outcomes[a.outcome] = (outcomes[a.outcome] || 0) + 1
        }
        if (a.leadQuality) {
          leadQualities[a.leadQuality] = (leadQualities[a.leadQuality] || 0) + 1
        }
        if (a.coachingOpportunities) {
          for (const tip of a.coachingOpportunities) {
            coachingTips[tip] = (coachingTips[tip] || 0) + 1
          }
        }
        if (a.followUpRequired) {
          followUpsNeeded++
        }
      }
    }

    // Calculate scores
    const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0

    const conversionRate = totalCalls > 0
      ? Math.round(((outcomes['appointment_booked'] || 0) / totalCalls) * 100)
      : 0

    // Quality score (0-100)
    const qualityScore = Math.min(100, Math.round(
      (avgSentiment + 1) * 25 +          // Sentiment: 0-50
      Math.min(conversionRate, 50) +       // Conversion: 0-50
      (avgDuration > 60 ? 10 : 0) -       // Engaged calls bonus
      (followUpsNeeded / Math.max(totalCalls, 1)) * 20 // Penalty for too many follow-ups
    ))

    // Top coaching tips sorted by frequency
    const topCoachingTips = Object.entries(coachingTips)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tip, count]) => ({ tip, occurrences: count }))

    // Weekly trend (last 4 weeks)
    const weeklyTrend = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
      const weekCalls = (calls || []).filter(c => {
        const d = new Date(c.created_at)
        return d >= weekStart && d < weekEnd
      })
      weeklyTrend.push({
        week: `Week ${4 - i}`,
        startDate: weekStart.toISOString().split('T')[0],
        calls: weekCalls.length,
        avgDuration: weekCalls.length > 0
          ? Math.round(weekCalls.reduce((s, c) => s + (c.duration || 0), 0) / weekCalls.length)
          : 0,
      })
    }

    // Get per-employee breakdown if not filtering
    let employeeBreakdown: any[] = []
    if (!employeeId) {
      const employeeMap = new Map<string, { calls: number; totalDuration: number }>()
      for (const call of (calls || [])) {
        const eid = call.employee_id
        const existing = employeeMap.get(eid) || { calls: 0, totalDuration: 0 }
        existing.calls++
        existing.totalDuration += call.duration || 0
        employeeMap.set(eid, existing)
      }

      // Get employee names
      const employeeIds = Array.from(employeeMap.keys())
      if (employeeIds.length > 0) {
        const { data: employees } = await supabase
          .from('phone_employees')
          .select('id, name, job_type')
          .in('id', employeeIds)

        employeeBreakdown = (employees || []).map(emp => {
          const stats = employeeMap.get(emp.id) || { calls: 0, totalDuration: 0 }
          return {
            id: emp.id,
            name: emp.name,
            jobType: emp.job_type,
            totalCalls: stats.calls,
            avgDuration: stats.calls > 0 ? Math.round(stats.totalDuration / stats.calls) : 0,
          }
        })
      }
    }

    return NextResponse.json({
      period,
      qualityScore,
      metrics: {
        totalCalls,
        avgDuration,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        conversionRate,
        followUpsNeeded,
      },
      outcomes,
      leadQualities,
      coachingTips: topCoachingTips,
      weeklyTrend,
      employeeBreakdown,
    })
  } catch (err: any) {
    console.error('[Coaching API] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
