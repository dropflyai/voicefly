import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { customerRetentionAgent } from '@/lib/agents/customer-retention'

/**
 * GET /api/agents/customers/at-risk
 * Returns customers at risk of churning
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
    const riskLevel = searchParams.get('riskLevel') // high, medium, low
    const priority = searchParams.get('priority') // critical, high, medium, low
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get customers with retention scores
    let query = supabase
      .from('customer_retention_scores')
      .select(`
        customer_id,
        risk_score,
        risk_level,
        factors,
        primary_reason,
        retention_priority,
        suggested_strategy,
        analyzed_at
      `)
      .eq('business_id', businessId)
      .order('risk_score', { ascending: false })
      .limit(limit)

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }

    if (priority) {
      query = query.eq('retention_priority', priority)
    }

    const { data: retentionData, error: retentionError } = await query

    if (retentionError) {
      console.error('Error fetching retention data:', retentionError)
    }

    // Enrich with customer details from leads table
    const customerIds = retentionData?.map((r) => r.customer_id) || []

    let customers: any[] = []
    if (customerIds.length > 0) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, company')
        .in('id', customerIds)

      // Merge data
      customers = (retentionData || []).map((retention) => {
        const customer = leadData?.find((l) => l.id === retention.customer_id)
        return {
          id: retention.customer_id,
          firstName: customer?.first_name,
          lastName: customer?.last_name,
          email: customer?.email,
          phone: customer?.phone,
          company: customer?.company,
          riskScore: retention.risk_score,
          riskLevel: retention.risk_level,
          factors: retention.factors,
          primaryReason: retention.primary_reason,
          retentionPriority: retention.retention_priority,
          suggestedStrategy: retention.suggested_strategy,
          analyzedAt: retention.analyzed_at,
        }
      })
    }

    // Calculate summary
    const summary = {
      total: customers.length,
      critical: customers.filter((c) => c.retentionPriority === 'critical').length,
      highRisk: customers.filter((c) => c.riskLevel === 'high').length,
      mediumRisk: customers.filter((c) => c.riskLevel === 'medium').length,
      lowRisk: customers.filter((c) => c.riskLevel === 'low').length,
      averageRiskScore: customers.length > 0
        ? Math.round(customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length)
        : 0,
    }

    // Get top concerns (most common primary reasons)
    const reasonCounts: Record<string, number> = {}
    for (const customer of customers) {
      if (customer.primaryReason) {
        reasonCounts[customer.primaryReason] = (reasonCounts[customer.primaryReason] || 0) + 1
      }
    }
    const topConcerns = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))

    return NextResponse.json({
      customers,
      summary,
      topConcerns,
    })
  } catch (error) {
    console.error('Error getting at-risk customers:', error)
    return NextResponse.json(
      { error: 'Failed to get at-risk customers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/customers/at-risk
 * Trigger retention analysis
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
    const { customerId } = body

    let result

    if (customerId) {
      // Analyze single customer
      result = await customerRetentionAgent.analyzeCustomer(customerId, businessId)
    } else {
      // Run daily analysis for all customers
      result = await customerRetentionAgent.runDailyAnalysis(businessId)
    }

    return NextResponse.json({
      success: result.success,
      executionId: result.executionId,
      output: result.output,
      insights: result.insights || [],
      actions: result.actions || [],
      alerts: result.alerts || [],
      error: result.error,
    })
  } catch (error) {
    console.error('Error running retention analysis:', error)
    return NextResponse.json(
      { error: 'Failed to run retention analysis' },
      { status: 500 }
    )
  }
}
