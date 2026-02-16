/**
 * Revenue Intelligence Agent
 *
 * Monitors and optimizes business revenue:
 * - Revenue trend analysis
 * - Pricing optimization recommendations
 * - Service mix optimization
 * - Seasonal pattern detection
 * - Revenue forecasting
 */

import { supabase } from '../supabase-client'
import { CreditSystem } from '../credit-system'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../error-tracking'
import AuditLogger, { AuditEventType } from '../audit-logger'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentInsight,
  AgentAction,
  AgentAlert,
  AgentCreditCost,
  AgentEvent,
} from './types'
import { mayaPrime } from './maya-prime'

// Agent configuration
const REVENUE_INTELLIGENCE_CONFIG: AgentConfig = {
  id: 'revenue-intelligence',
  name: 'Revenue Intelligence Agent',
  description: 'Analyzes revenue patterns and provides optimization recommendations',
  cluster: 'revenue',
  enabled: true,
  schedule: {
    type: 'daily',
    value: '0 6 * * *', // 6 AM daily
    timezone: 'America/New_York',
  },
  triggers: [
    { event: AgentEvent.PAYMENT_RECEIVED },
    { event: AgentEvent.DAILY_SUMMARY },
  ],
}

// Analysis windows
const ANALYSIS_WINDOWS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
}

export class RevenueIntelligenceAgent {
  private static instance: RevenueIntelligenceAgent
  private errorTracker = ErrorTracker.getInstance()
  private config: AgentConfig

  private constructor() {
    this.config = REVENUE_INTELLIGENCE_CONFIG
    mayaPrime.registerAgent(this.config)
  }

  static getInstance(): RevenueIntelligenceAgent {
    if (!RevenueIntelligenceAgent.instance) {
      RevenueIntelligenceAgent.instance = new RevenueIntelligenceAgent()
    }
    return RevenueIntelligenceAgent.instance
  }

  /**
   * Run comprehensive revenue analysis
   */
  async analyzeRevenue(businessId: string): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Check credits
      const hasCredits = await CreditSystem.hasCredits(businessId, AgentCreditCost.DEEP_ANALYSIS)
      if (!hasCredits) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Insufficient credits for revenue analysis',
        }
      }

      // Gather data
      const revenueData = await this.gatherRevenueData(businessId)

      // Perform analyses
      const trendAnalysis = this.analyzeTrends(revenueData)
      const serviceAnalysis = this.analyzeServiceMix(revenueData)
      const seasonalAnalysis = this.analyzeSeasonality(revenueData)
      const forecast = this.generateForecast(revenueData)

      // Compile insights
      const insights: AgentInsight[] = [
        ...trendAnalysis.insights,
        ...serviceAnalysis.insights,
        ...seasonalAnalysis.insights,
        ...forecast.insights,
      ]

      // Determine actions
      const actions: AgentAction[] = [
        ...trendAnalysis.actions,
        ...serviceAnalysis.actions,
      ]

      // Check for alerts
      const alerts: AgentAlert[] = [
        ...trendAnalysis.alerts,
        ...serviceAnalysis.alerts,
      ]

      // Create summary
      const summary: RevenueSummary = {
        totalRevenue: revenueData.monthly.total,
        averageTicket: revenueData.monthly.averageTicket,
        transactionCount: revenueData.monthly.count,
        topService: serviceAnalysis.topService,
        growthRate: trendAnalysis.monthlyGrowthRate,
        forecast30Day: forecast.next30Days,
        healthScore: this.calculateRevenueHealth(revenueData, trendAnalysis),
      }

      // Deduct credits
      await CreditSystem.deductCredits(
        businessId,
        AgentCreditCost.DEEP_ANALYSIS,
        'revenue_analysis',
        { analysisDate: new Date().toISOString() }
      )

      // Store analysis
      await this.storeAnalysis(businessId, summary, insights)

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'revenue_analysis_completed',
          summary: {
            totalRevenue: summary.totalRevenue,
            growthRate: summary.growthRate,
            healthScore: summary.healthScore,
          },
        },
        severity: 'low',
      })

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: summary,
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Revenue analysis failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId }
      )

      return {
        success: false,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Real-time revenue tracking (on payment received)
   */
  async trackPayment(
    businessId: string,
    paymentData: PaymentData
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      const insights: AgentInsight[] = []
      const alerts: AgentAlert[] = []

      // Get today's running total
      const todayTotal = await this.getTodayRevenue(businessId)
      const todayTarget = await this.getDailyTarget(businessId)

      // Check if this payment hits a milestone
      const newTotal = todayTotal + paymentData.amount
      const percentOfTarget = (newTotal / todayTarget) * 100

      if (percentOfTarget >= 100 && (todayTotal / todayTarget) * 100 < 100) {
        insights.push({
          type: 'opportunity',
          title: 'Daily Target Achieved',
          description: `Reached ${percentOfTarget.toFixed(0)}% of daily revenue target ($${newTotal.toFixed(2)})`,
          confidence: 1,
          impact: 'high',
          data: { todayTotal: newTotal, target: todayTarget },
        })
      }

      // Check for unusually large payment
      const avgTicket = await this.getAverageTicket(businessId)
      if (paymentData.amount > avgTicket * 2) {
        insights.push({
          type: 'trend',
          title: 'High-Value Transaction',
          description: `Payment of $${paymentData.amount.toFixed(2)} is ${(paymentData.amount / avgTicket).toFixed(1)}x average`,
          confidence: 1,
          impact: 'medium',
          data: { amount: paymentData.amount, average: avgTicket },
        })
      }

      // Track service revenue
      if (paymentData.service) {
        await this.trackServiceRevenue(businessId, paymentData.service, paymentData.amount)
      }

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: {
          amount: paymentData.amount,
          todayTotal: newTotal,
          percentOfTarget,
        },
        insights,
        alerts,
      }
    } catch (error) {
      return {
        success: false,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Gather comprehensive revenue data
   */
  private async gatherRevenueData(businessId: string): Promise<RevenueData> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Current month data
    const { data: currentMonth } = await supabase
      .from('appointments')
      .select('total_amount, service, date, created_at')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    // Previous month data
    const { data: previousMonth } = await supabase
      .from('appointments')
      .select('total_amount, service, date')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0])

    // 90-day data for trends
    const { data: quarterData } = await supabase
      .from('appointments')
      .select('total_amount, service, date')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])

    const monthlyTotal = currentMonth?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0
    const monthlyCount = currentMonth?.length || 0
    const previousTotal = previousMonth?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0

    // Calculate service breakdown
    const serviceBreakdown: Record<string, { revenue: number; count: number }> = {}
    for (const appt of currentMonth || []) {
      const service = appt.service || 'Other'
      if (!serviceBreakdown[service]) {
        serviceBreakdown[service] = { revenue: 0, count: 0 }
      }
      serviceBreakdown[service].revenue += appt.total_amount || 0
      serviceBreakdown[service].count++
    }

    // Daily breakdown for trend analysis
    const dailyRevenue: Record<string, number> = {}
    for (const appt of quarterData || []) {
      const date = appt.date
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (appt.total_amount || 0)
    }

    return {
      monthly: {
        total: monthlyTotal,
        count: monthlyCount,
        averageTicket: monthlyCount > 0 ? monthlyTotal / monthlyCount : 0,
      },
      previous: {
        total: previousTotal,
        count: previousMonth?.length || 0,
      },
      serviceBreakdown,
      dailyRevenue,
      rawData: quarterData || [],
    }
  }

  /**
   * Analyze revenue trends
   */
  private analyzeTrends(data: RevenueData): {
    monthlyGrowthRate: number
    insights: AgentInsight[]
    actions: AgentAction[]
    alerts: AgentAlert[]
  } {
    const insights: AgentInsight[] = []
    const actions: AgentAction[] = []
    const alerts: AgentAlert[] = []

    // Calculate month-over-month growth
    const previousTotal = data.previous.total || 1 // Avoid division by zero
    const growthRate = ((data.monthly.total - previousTotal) / previousTotal) * 100

    // Growth insight
    if (growthRate > 10) {
      insights.push({
        type: 'trend',
        title: 'Strong Revenue Growth',
        description: `Revenue up ${growthRate.toFixed(1)}% month-over-month`,
        confidence: 0.9,
        impact: 'high',
        suggestedActions: ['Analyze what drove growth', 'Double down on successful strategies'],
      })
    } else if (growthRate < -10) {
      insights.push({
        type: 'risk',
        title: 'Revenue Decline',
        description: `Revenue down ${Math.abs(growthRate).toFixed(1)}% month-over-month`,
        confidence: 0.9,
        impact: 'high',
        suggestedActions: ['Review pricing strategy', 'Increase marketing', 'Check customer retention'],
      })

      alerts.push({
        severity: 'warning',
        title: 'Revenue Decline Detected',
        message: `Revenue has dropped ${Math.abs(growthRate).toFixed(1)}% compared to last month`,
        category: 'revenue',
        timestamp: new Date(),
        metadata: { growthRate, currentRevenue: data.monthly.total },
      })

      actions.push({
        type: 'trigger_campaign',
        target: 'marketing',
        payload: {
          campaign: 'reactivation',
          reason: 'revenue_decline',
          urgency: 'high',
        },
        priority: 'high',
      })
    }

    // Calculate daily trend
    const dailyValues = Object.values(data.dailyRevenue)
    if (dailyValues.length >= 14) {
      const firstWeekAvg = dailyValues.slice(0, 7).reduce((a, b) => a + b, 0) / 7
      const lastWeekAvg = dailyValues.slice(-7).reduce((a, b) => a + b, 0) / 7
      const weeklyTrend = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100

      if (Math.abs(weeklyTrend) > 15) {
        insights.push({
          type: 'trend',
          title: weeklyTrend > 0 ? 'Accelerating Growth' : 'Declining Trend',
          description: `Weekly average ${weeklyTrend > 0 ? 'up' : 'down'} ${Math.abs(weeklyTrend).toFixed(1)}%`,
          confidence: 0.75,
          impact: 'medium',
        })
      }
    }

    return { monthlyGrowthRate: growthRate, insights, actions, alerts }
  }

  /**
   * Analyze service mix
   */
  private analyzeServiceMix(data: RevenueData): {
    topService: string
    insights: AgentInsight[]
    actions: AgentAction[]
    alerts: AgentAlert[]
  } {
    const insights: AgentInsight[] = []
    const actions: AgentAction[] = []
    const alerts: AgentAlert[] = []

    const services = Object.entries(data.serviceBreakdown)
      .sort((a, b) => b[1].revenue - a[1].revenue)

    const topService = services.length > 0 ? services[0][0] : 'N/A'

    // Service concentration risk
    if (services.length > 0) {
      const topServiceShare = (services[0][1].revenue / data.monthly.total) * 100

      if (topServiceShare > 60) {
        insights.push({
          type: 'risk',
          title: 'Revenue Concentration',
          description: `${topService} accounts for ${topServiceShare.toFixed(0)}% of revenue`,
          confidence: 0.85,
          impact: 'medium',
          suggestedActions: ['Promote other services', 'Cross-sell opportunities'],
        })
      }

      // Identify underperforming services
      const avgRevenue = data.monthly.total / services.length
      const underperformers = services.filter(([_, stats]) => stats.revenue < avgRevenue * 0.3)

      if (underperformers.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'Underperforming Services',
          description: `${underperformers.map(([s]) => s).join(', ')} have low revenue share`,
          confidence: 0.7,
          impact: 'medium',
          suggestedActions: ['Consider promotions', 'Review pricing', 'Evaluate service viability'],
        })
      }

      // Identify growth opportunities
      const highVolumeServices = services.filter(([_, stats]) =>
        stats.count > data.monthly.count * 0.3 && stats.revenue / stats.count < data.monthly.averageTicket
      )

      if (highVolumeServices.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'Upsell Opportunity',
          description: `${highVolumeServices[0][0]} has high volume but low ticket - upsell potential`,
          confidence: 0.75,
          impact: 'high',
          suggestedActions: ['Train staff on upselling', 'Create service bundles'],
        })
      }
    }

    return { topService, insights, actions, alerts }
  }

  /**
   * Analyze seasonality patterns
   */
  private analyzeSeasonality(data: RevenueData): {
    insights: AgentInsight[]
  } {
    const insights: AgentInsight[] = []

    // Day of week analysis
    const dayRevenue: Record<number, number[]> = {}
    for (const appt of data.rawData) {
      const dayOfWeek = new Date(appt.date).getDay()
      if (!dayRevenue[dayOfWeek]) dayRevenue[dayOfWeek] = []
      dayRevenue[dayOfWeek].push(appt.total_amount || 0)
    }

    const dayAverages: Record<number, number> = {}
    for (const [day, revenues] of Object.entries(dayRevenue)) {
      dayAverages[Number(day)] = revenues.reduce((a, b) => a + b, 0) / revenues.length
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const bestDay = Object.entries(dayAverages).reduce((max, [day, avg]) =>
      avg > (dayAverages[Number(max[0])] || 0) ? [day, avg] : max
    , ['0', 0])
    const worstDay = Object.entries(dayAverages).reduce((min, [day, avg]) =>
      avg < (dayAverages[Number(min[0])] || Infinity) ? [day, avg] : min
    , ['0', Infinity])

    if (Object.keys(dayAverages).length >= 5) {
      insights.push({
        type: 'trend',
        title: 'Best Performing Day',
        description: `${dayNames[Number(bestDay[0])]} generates highest daily revenue ($${Number(bestDay[1]).toFixed(0)} avg)`,
        confidence: 0.8,
        impact: 'medium',
        data: { day: dayNames[Number(bestDay[0])], average: bestDay[1] },
      })

      const avgDaily = Object.values(dayAverages).reduce((a, b) => a + b, 0) / Object.keys(dayAverages).length
      if (Number(worstDay[1]) < avgDaily * 0.5) {
        insights.push({
          type: 'opportunity',
          title: 'Low-Performing Day',
          description: `${dayNames[Number(worstDay[0])]} significantly underperforms - consider promotions`,
          confidence: 0.75,
          impact: 'medium',
          suggestedActions: [`Run ${dayNames[Number(worstDay[0])]} specials`, 'Reduce staffing or hours'],
        })
      }
    }

    return { insights }
  }

  /**
   * Generate revenue forecast
   */
  private generateForecast(data: RevenueData): {
    next30Days: number
    insights: AgentInsight[]
  } {
    const insights: AgentInsight[] = []

    // Simple moving average forecast
    const dailyValues = Object.values(data.dailyRevenue)
    if (dailyValues.length < 7) {
      return { next30Days: data.monthly.total, insights }
    }

    // Use last 14 days average for projection
    const recentAvg = dailyValues.slice(-14).reduce((a, b) => a + b, 0) / 14
    const forecast = recentAvg * 30

    // Compare to historical
    const deviation = ((forecast - data.monthly.total) / data.monthly.total) * 100

    if (Math.abs(deviation) > 15) {
      insights.push({
        type: deviation > 0 ? 'opportunity' : 'risk',
        title: `30-Day Forecast: ${deviation > 0 ? 'Up' : 'Down'} ${Math.abs(deviation).toFixed(0)}%`,
        description: `Projected revenue: $${forecast.toFixed(0)} based on recent trends`,
        confidence: 0.65,
        impact: 'high',
        data: { forecast, currentMonthly: data.monthly.total },
      })
    }

    return { next30Days: forecast, insights }
  }

  /**
   * Calculate overall revenue health score
   */
  private calculateRevenueHealth(data: RevenueData, trends: any): number {
    let score = 50 // Start at neutral

    // Growth rate impact
    if (trends.monthlyGrowthRate > 10) score += 20
    else if (trends.monthlyGrowthRate > 0) score += 10
    else if (trends.monthlyGrowthRate > -10) score -= 10
    else score -= 20

    // Volume impact
    if (data.monthly.count > 50) score += 15
    else if (data.monthly.count > 20) score += 5
    else score -= 10

    // Average ticket impact
    if (data.monthly.averageTicket > 100) score += 10
    else if (data.monthly.averageTicket < 50) score -= 10

    // Service diversity
    const serviceCount = Object.keys(data.serviceBreakdown).length
    if (serviceCount >= 5) score += 5
    else if (serviceCount <= 2) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get today's revenue
   */
  private async getTodayRevenue(businessId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('date', today)
      .eq('status', 'completed')

    return data?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0
  }

  /**
   * Get daily revenue target
   */
  private async getDailyTarget(businessId: string): Promise<number> {
    // Would pull from business settings or calculate from historical
    // For now, use a default
    return 1000
  }

  /**
   * Get average ticket amount
   */
  private async getAverageTicket(businessId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('appointments')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)

    if (!data || data.length === 0) return 100
    return data.reduce((sum, a) => sum + (a.total_amount || 0), 0) / data.length
  }

  /**
   * Track service revenue
   */
  private async trackServiceRevenue(
    businessId: string,
    service: string,
    amount: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('service_revenue_daily').upsert({
      business_id: businessId,
      service,
      date: today,
      revenue: amount,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'business_id,service,date',
    })
  }

  /**
   * Store analysis in database
   */
  private async storeAnalysis(
    businessId: string,
    summary: RevenueSummary,
    insights: AgentInsight[]
  ): Promise<void> {
    try {
      await supabase.from('revenue_analyses').insert({
        business_id: businessId,
        total_revenue: summary.totalRevenue,
        average_ticket: summary.averageTicket,
        transaction_count: summary.transactionCount,
        top_service: summary.topService,
        growth_rate: summary.growthRate,
        forecast_30day: summary.forecast30Day,
        health_score: summary.healthScore,
        insights: insights,
        analyzed_at: new Date().toISOString(),
      })
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `revenue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }
}

// Revenue data interfaces
interface RevenueData {
  monthly: {
    total: number
    count: number
    averageTicket: number
  }
  previous: {
    total: number
    count: number
  }
  serviceBreakdown: Record<string, { revenue: number; count: number }>
  dailyRevenue: Record<string, number>
  rawData: any[]
}

interface RevenueSummary {
  totalRevenue: number
  averageTicket: number
  transactionCount: number
  topService: string
  growthRate: number
  forecast30Day: number
  healthScore: number
}

interface PaymentData {
  amount: number
  service?: string
  customerId?: string
  appointmentId?: string
}

// Export singleton
export const revenueIntelligenceAgent = RevenueIntelligenceAgent.getInstance()
export default RevenueIntelligenceAgent
