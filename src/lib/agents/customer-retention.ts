/**
 * Customer Retention Agent
 *
 * Identifies at-risk customers and triggers retention strategies:
 * - Churn prediction based on engagement patterns
 * - Proactive outreach for declining customers
 * - Win-back campaigns for lapsed customers
 * - Satisfaction monitoring and intervention
 */

import { supabase } from '../supabase-client'
// Credit system removed — features are included
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
const CUSTOMER_RETENTION_CONFIG: AgentConfig = {
  id: 'customer-retention',
  name: 'Customer Retention Agent',
  description: 'Identifies churn risk and triggers retention campaigns',
  cluster: 'customer',
  enabled: true,
  schedule: {
    type: 'daily',
    value: '0 7 * * *', // 7 AM daily
    timezone: 'America/New_York',
  },
  triggers: [
    { event: AgentEvent.CHURN_RISK },
    { event: AgentEvent.CUSTOMER_FEEDBACK },
    { event: AgentEvent.APPOINTMENT_NOSHOW },
    { event: AgentEvent.APPOINTMENT_CANCELLED },
  ],
}

// Risk thresholds
const RISK_THRESHOLDS = {
  high: 70,
  medium: 40,
  low: 20,
}

// Engagement windows (days)
const ENGAGEMENT_WINDOWS = {
  active: 30,
  atRisk: 60,
  lapsed: 90,
  churned: 180,
}

export class CustomerRetentionAgent {
  private static instance: CustomerRetentionAgent
  private errorTracker = ErrorTracker.getInstance()
  private config: AgentConfig

  private constructor() {
    this.config = CUSTOMER_RETENTION_CONFIG
    mayaPrime.registerAgent(this.config)
  }

  static getInstance(): CustomerRetentionAgent {
    if (!CustomerRetentionAgent.instance) {
      CustomerRetentionAgent.instance = new CustomerRetentionAgent()
    }
    return CustomerRetentionAgent.instance
  }

  /**
   * Analyze a single customer for churn risk
   */
  async analyzeCustomer(
    customerId: string,
    businessId: string
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Get customer data
      const customer = await this.getCustomerData(customerId, businessId)
      if (!customer) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Customer not found',
        }
      }

      // Calculate churn risk
      const riskAnalysis = this.calculateChurnRisk(customer)

      // Generate insights
      const insights = this.generateInsights(riskAnalysis, customer)

      // Determine retention actions
      const actions = this.determineActions(riskAnalysis, customer)

      // Check for alerts
      const alerts = this.checkForAlerts(riskAnalysis, customer)

      // Store analysis
      await this.storeAnalysis(customer.id, businessId, riskAnalysis)

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: riskAnalysis,
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Customer analysis failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId, customerId }
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
   * Run daily churn analysis for all customers
   */
  async runDailyAnalysis(businessId: string): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Check credits
      const hasCredits = true /* minutes system: included feature */
      if (!hasCredits) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Insufficient credits for daily analysis',
        }
      }

      // Get all customers with recent activity
      const customers = await this.getActiveCustomers(businessId)

      const results: ChurnRiskAnalysis[] = []
      const highRiskCustomers: CustomerData[] = []
      let analyzed = 0

      for (const customer of customers) {
        const riskAnalysis = this.calculateChurnRisk(customer)
        results.push(riskAnalysis)
        analyzed++

        if (riskAnalysis.riskLevel === 'high') {
          highRiskCustomers.push(customer)
        }
      }

      // Calculate summary metrics
      const summary = {
        totalCustomers: customers.length,
        analyzed,
        highRisk: results.filter((r) => r.riskLevel === 'high').length,
        mediumRisk: results.filter((r) => r.riskLevel === 'medium').length,
        lowRisk: results.filter((r) => r.riskLevel === 'low').length,
        averageRiskScore: results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.riskScore, 0) / results.length)
          : 0,
      }

      // Generate insights
      const insights: AgentInsight[] = []

      if (summary.highRisk > 0) {
        insights.push({
          type: 'risk',
          title: 'High Churn Risk Detected',
          description: `${summary.highRisk} customers are at high risk of churning`,
          confidence: 0.85,
          impact: 'high',
          suggestedActions: ['Review high-risk customers', 'Initiate retention campaigns'],
          data: { count: summary.highRisk },
        })
      }

      // Trend analysis
      if (summary.averageRiskScore > 50) {
        insights.push({
          type: 'trend',
          title: 'Elevated Churn Risk',
          description: `Average risk score is ${summary.averageRiskScore}/100 - above healthy threshold`,
          confidence: 0.75,
          impact: 'medium',
          suggestedActions: ['Review customer experience', 'Increase engagement touchpoints'],
        })
      }

      // Generate actions for high-risk customers
      const actions: AgentAction[] = highRiskCustomers.slice(0, 10).map((customer) => ({
        type: 'retention_outreach',
        target: 'customer',
        payload: {
          customerId: customer.id,
          customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          riskLevel: 'high',
          suggestedApproach: this.getSuggestedApproach(customer),
        },
        priority: 'high' as const,
        scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      }))

      // Deduct credits
      // Included feature — no deduction: // await deductCredits(
        businessId,
        AgentCreditCost.DEEP_ANALYSIS,
        'daily_retention_analysis',
        { customersAnalyzed: analyzed }
      )

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'daily_retention_analysis',
          summary,
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
        alerts: summary.highRisk > 5
          ? [{
              severity: 'warning' as const,
              title: 'Multiple High-Risk Customers',
              message: `${summary.highRisk} customers at high churn risk - immediate attention needed`,
              category: 'retention',
              timestamp: new Date(),
            }]
          : [],
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
   * Handle specific customer events (no-show, cancellation, negative feedback)
   */
  async handleCustomerEvent(
    businessId: string,
    event: AgentEvent,
    data: any
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      let customerId: string | null = null
      let eventType = 'unknown'

      switch (event) {
        case AgentEvent.APPOINTMENT_NOSHOW:
          customerId = data.customerId
          eventType = 'no_show'
          break
        case AgentEvent.APPOINTMENT_CANCELLED:
          customerId = data.customerId
          eventType = 'cancellation'
          break
        case AgentEvent.CUSTOMER_FEEDBACK:
          customerId = data.customerId
          eventType = data.sentiment === 'negative' ? 'negative_feedback' : 'feedback'
          break
      }

      if (!customerId) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'No customer ID in event data',
        }
      }

      // Get customer data
      const customer = await this.getCustomerData(customerId, businessId)
      if (!customer) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Customer not found',
        }
      }

      // Calculate risk with event context
      const riskAnalysis = this.calculateChurnRisk(customer, eventType)

      // Generate event-specific insights and actions
      const insights: AgentInsight[] = []
      const actions: AgentAction[] = []
      const alerts: AgentAlert[] = []

      switch (eventType) {
        case 'no_show':
          insights.push({
            type: 'risk',
            title: 'No-Show Event',
            description: `${customer.first_name || 'Customer'} missed their appointment`,
            confidence: 0.9,
            impact: riskAnalysis.riskLevel === 'high' ? 'high' : 'medium',
            suggestedActions: ['Send follow-up message', 'Offer to reschedule'],
          })

          actions.push({
            type: 'send_message',
            target: 'customer',
            payload: {
              customerId: customer.id,
              template: 'noshow_followup',
              channel: customer.phone ? 'sms' : 'email',
            },
            priority: 'high',
            scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          })
          break

        case 'cancellation':
          if (customer.cancellationCount && customer.cancellationCount > 2) {
            alerts.push({
              severity: 'warning',
              title: 'Repeated Cancellations',
              message: `${customer.first_name || 'Customer'} has cancelled ${customer.cancellationCount} times`,
              category: 'retention',
              timestamp: new Date(),
              metadata: { customerId: customer.id },
            })
          }

          actions.push({
            type: 'send_message',
            target: 'customer',
            payload: {
              customerId: customer.id,
              template: 'cancellation_followup',
              channel: 'email',
            },
            priority: 'medium',
          })
          break

        case 'negative_feedback':
          alerts.push({
            severity: 'critical',
            title: 'Negative Feedback Received',
            message: `${customer.first_name || 'Customer'} submitted negative feedback`,
            category: 'customer_experience',
            timestamp: new Date(),
            metadata: { customerId: customer.id, feedback: data.feedback },
          })

          actions.push({
            type: 'escalate',
            target: 'manager',
            payload: {
              reason: 'Negative customer feedback',
              customerId: customer.id,
              feedback: data.feedback,
            },
            priority: 'critical',
          })
          break
      }

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: { eventType, riskAnalysis },
        insights,
        actions,
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
   * Get customer data with history
   */
  private async getCustomerData(customerId: string, businessId: string): Promise<CustomerData | null> {
    try {
      // Try to find in leads table
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', customerId)
        .eq('business_id', businessId)
        .single()

      if (lead) {
        return await this.enrichCustomerData(lead, businessId)
      }

      // Try appointments table for customer info
      const { data: appointment } = await supabase
        .from('appointments')
        .select('customer_name, customer_phone, customer_email')
        .eq('business_id', businessId)
        .or(`id.eq.${customerId}`)
        .single()

      if (appointment) {
        return await this.enrichCustomerData({
          id: customerId,
          business_id: businessId,
          phone: appointment.customer_phone,
          email: appointment.customer_email,
        }, businessId)
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Enrich customer data with interaction history
   */
  private async enrichCustomerData(customer: any, businessId: string): Promise<CustomerData> {
    // Get appointment history
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, status, date, created_at')
      .eq('business_id', businessId)
      .or(`customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get call history
    const { data: calls } = await supabase
      .from('voice_ai_calls')
      .select('id, duration, outcome, sentiment_score, created_at')
      .eq('business_id', businessId)
      .eq('customer_phone', customer.phone)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate metrics
    const completedAppointments = appointments?.filter((a) => a.status === 'completed').length || 0
    const noShows = appointments?.filter((a) => a.status === 'no_show').length || 0
    const cancellations = appointments?.filter((a) => a.status === 'cancelled').length || 0

    // Find last interaction
    const lastAppointment = appointments?.[0]
    const lastCall = calls?.[0]
    let lastInteractionDate: Date | null = null

    if (lastAppointment) {
      lastInteractionDate = new Date(lastAppointment.created_at)
    }
    if (lastCall && (!lastInteractionDate || new Date(lastCall.created_at) > lastInteractionDate)) {
      lastInteractionDate = new Date(lastCall.created_at)
    }

    return {
      ...customer,
      appointments: appointments || [],
      calls: calls || [],
      completedAppointments,
      noShowCount: noShows,
      cancellationCount: cancellations,
      lastInteractionDate,
      daysSinceLastInteraction: lastInteractionDate
        ? Math.floor((Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }
  }

  /**
   * Get active customers for analysis
   */
  private async getActiveCustomers(businessId: string): Promise<CustomerData[]> {
    // Get customers with activity in the past 6 months
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .gte('updated_at', sixMonthsAgo)
      .limit(500)

    const customers: CustomerData[] = []
    for (const lead of leads || []) {
      const enriched = await this.enrichCustomerData(lead, businessId)
      customers.push(enriched)
    }

    return customers
  }

  /**
   * Calculate churn risk score
   */
  private calculateChurnRisk(customer: CustomerData, eventContext?: string): ChurnRiskAnalysis {
    const factors: RiskFactor[] = []
    let totalRisk = 0

    // Factor 1: Recency (40% weight)
    const recencyRisk = this.calculateRecencyRisk(customer)
    factors.push({
      name: 'Recency',
      weight: 0.4,
      score: recencyRisk.score,
      reason: recencyRisk.reason,
    })
    totalRisk += recencyRisk.score * 0.4

    // Factor 2: Engagement Pattern (25% weight)
    const engagementRisk = this.calculateEngagementRisk(customer)
    factors.push({
      name: 'Engagement',
      weight: 0.25,
      score: engagementRisk.score,
      reason: engagementRisk.reason,
    })
    totalRisk += engagementRisk.score * 0.25

    // Factor 3: Behavior Issues (20% weight)
    const behaviorRisk = this.calculateBehaviorRisk(customer)
    factors.push({
      name: 'Behavior',
      weight: 0.2,
      score: behaviorRisk.score,
      reason: behaviorRisk.reason,
    })
    totalRisk += behaviorRisk.score * 0.2

    // Factor 4: Sentiment (15% weight)
    const sentimentRisk = this.calculateSentimentRisk(customer)
    factors.push({
      name: 'Sentiment',
      weight: 0.15,
      score: sentimentRisk.score,
      reason: sentimentRisk.reason,
    })
    totalRisk += sentimentRisk.score * 0.15

    // Adjust for event context
    if (eventContext) {
      const eventAdjustment = this.getEventRiskAdjustment(eventContext)
      totalRisk = Math.min(100, totalRisk + eventAdjustment)
    }

    const riskScore = Math.round(totalRisk)

    // Determine risk level
    let riskLevel: 'high' | 'medium' | 'low'
    if (riskScore >= RISK_THRESHOLDS.high) {
      riskLevel = 'high'
    } else if (riskScore >= RISK_THRESHOLDS.medium) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // Determine retention priority
    const retentionPriority = this.calculateRetentionPriority(customer, riskLevel)

    // Get primary risk reason
    const primaryRiskFactor = factors.reduce((max, f) =>
      f.score * f.weight > max.score * max.weight ? f : max
    )

    return {
      customerId: customer.id,
      riskScore,
      riskLevel,
      factors,
      primaryRiskReason: primaryRiskFactor.reason,
      retentionPriority,
      suggestedStrategy: this.getSuggestedStrategy(riskLevel, factors),
    }
  }

  /**
   * Calculate recency-based risk
   */
  private calculateRecencyRisk(customer: CustomerData): { score: number; reason: string } {
    const days = customer.daysSinceLastInteraction

    if (days === null) {
      return { score: 80, reason: 'No interaction history' }
    }

    if (days <= ENGAGEMENT_WINDOWS.active) {
      return { score: 10, reason: 'Recently active' }
    }
    if (days <= ENGAGEMENT_WINDOWS.atRisk) {
      return { score: 40, reason: 'Declining engagement' }
    }
    if (days <= ENGAGEMENT_WINDOWS.lapsed) {
      return { score: 70, reason: 'Lapsed customer' }
    }
    return { score: 95, reason: 'Churned/Inactive' }
  }

  /**
   * Calculate engagement pattern risk
   */
  private calculateEngagementRisk(customer: CustomerData): { score: number; reason: string } {
    const completed = customer.completedAppointments || 0

    if (completed === 0) {
      return { score: 70, reason: 'No completed appointments' }
    }
    if (completed === 1) {
      return { score: 50, reason: 'Single visit only' }
    }
    if (completed <= 3) {
      return { score: 30, reason: 'Low frequency' }
    }
    return { score: 10, reason: 'Regular customer' }
  }

  /**
   * Calculate behavior-based risk
   */
  private calculateBehaviorRisk(customer: CustomerData): { score: number; reason: string } {
    const noShows = customer.noShowCount || 0
    const cancellations = customer.cancellationCount || 0
    const total = customer.appointments?.length || 1

    const issueRate = (noShows + cancellations) / total

    if (noShows >= 2) {
      return { score: 90, reason: 'Multiple no-shows' }
    }
    if (issueRate > 0.5) {
      return { score: 70, reason: 'High cancellation rate' }
    }
    if (issueRate > 0.25) {
      return { score: 40, reason: 'Some behavior issues' }
    }
    return { score: 10, reason: 'Good behavior' }
  }

  /**
   * Calculate sentiment-based risk
   */
  private calculateSentimentRisk(customer: CustomerData): { score: number; reason: string } {
    const calls = customer.calls || []
    if (calls.length === 0) {
      return { score: 30, reason: 'No call data' }
    }

    const avgSentiment = calls.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / calls.length

    if (avgSentiment < -0.3) {
      return { score: 85, reason: 'Negative sentiment in calls' }
    }
    if (avgSentiment < 0) {
      return { score: 50, reason: 'Mixed sentiment' }
    }
    return { score: 15, reason: 'Positive sentiment' }
  }

  /**
   * Get risk adjustment for specific events
   */
  private getEventRiskAdjustment(eventType: string): number {
    const adjustments: Record<string, number> = {
      no_show: 20,
      cancellation: 10,
      negative_feedback: 30,
      complaint: 25,
    }
    return adjustments[eventType] || 0
  }

  /**
   * Calculate retention priority (value x risk)
   */
  private calculateRetentionPriority(
    customer: CustomerData,
    riskLevel: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    const completedValue = (customer.completedAppointments || 0) * 100 // Estimate value
    const isHighValue = completedValue > 300

    if (riskLevel === 'high' && isHighValue) return 'critical'
    if (riskLevel === 'high' || isHighValue) return 'high'
    if (riskLevel === 'medium') return 'medium'
    return 'low'
  }

  /**
   * Get suggested retention strategy
   */
  private getSuggestedStrategy(riskLevel: string, factors: RiskFactor[]): string {
    const primaryFactor = factors.reduce((max, f) =>
      f.score * f.weight > max.score * max.weight ? f : max
    )

    switch (primaryFactor.name) {
      case 'Recency':
        return 'Re-engagement campaign with special offer'
      case 'Engagement':
        return 'Loyalty program or package offer'
      case 'Behavior':
        return 'Personal outreach to address concerns'
      case 'Sentiment':
        return 'Manager follow-up to resolve issues'
      default:
        return riskLevel === 'high'
          ? 'Immediate personal contact'
          : 'Standard nurture sequence'
    }
  }

  /**
   * Get suggested approach for high-risk customer
   */
  private getSuggestedApproach(customer: CustomerData): string {
    if (customer.noShowCount && customer.noShowCount > 1) {
      return 'Address scheduling flexibility - offer different times or reminders'
    }
    if (customer.daysSinceLastInteraction && customer.daysSinceLastInteraction > 60) {
      return 'Win-back offer with significant incentive'
    }
    return 'Personal check-in call from manager'
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(analysis: ChurnRiskAnalysis, customer: CustomerData): AgentInsight[] {
    const insights: AgentInsight[] = []

    if (analysis.riskLevel === 'high') {
      insights.push({
        type: 'risk',
        title: 'High Churn Risk',
        description: `${customer.first_name || 'Customer'} at high risk: ${analysis.primaryRiskReason}`,
        confidence: 0.85,
        impact: 'high',
        suggestedActions: [analysis.suggestedStrategy],
        data: { riskScore: analysis.riskScore },
      })
    }

    // Declining trend
    if (customer.daysSinceLastInteraction && customer.daysSinceLastInteraction > 45) {
      insights.push({
        type: 'trend',
        title: 'Declining Engagement',
        description: `${customer.daysSinceLastInteraction} days since last interaction`,
        confidence: 0.9,
        impact: 'medium',
        suggestedActions: ['Send re-engagement message', 'Offer appointment incentive'],
      })
    }

    return insights
  }

  /**
   * Determine retention actions
   */
  private determineActions(analysis: ChurnRiskAnalysis, customer: CustomerData): AgentAction[] {
    const actions: AgentAction[] = []

    switch (analysis.retentionPriority) {
      case 'critical':
        actions.push({
          type: 'escalate',
          target: 'manager',
          payload: {
            reason: 'Critical retention priority',
            customerId: customer.id,
            riskScore: analysis.riskScore,
          },
          priority: 'critical',
        })
        break

      case 'high':
        actions.push({
          type: 'schedule_call',
          target: 'customer',
          payload: {
            customerId: customer.id,
            purpose: 'retention_outreach',
            script: analysis.suggestedStrategy,
          },
          priority: 'high',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        })
        break

      case 'medium':
        actions.push({
          type: 'add_to_campaign',
          target: 'customer',
          payload: {
            customerId: customer.id,
            campaign: 'reactivation_sequence',
          },
          priority: 'medium',
        })
        break
    }

    return actions
  }

  /**
   * Check for alerts
   */
  private checkForAlerts(analysis: ChurnRiskAnalysis, customer: CustomerData): AgentAlert[] {
    const alerts: AgentAlert[] = []

    if (analysis.retentionPriority === 'critical') {
      alerts.push({
        severity: 'critical',
        title: 'Critical Churn Risk',
        message: `High-value customer ${customer.first_name || 'ID:' + customer.id} at critical churn risk`,
        category: 'retention',
        timestamp: new Date(),
        metadata: {
          customerId: customer.id,
          riskScore: analysis.riskScore,
        },
      })
    }

    return alerts
  }

  /**
   * Store analysis in database
   */
  private async storeAnalysis(
    customerId: string,
    businessId: string,
    analysis: ChurnRiskAnalysis
  ): Promise<void> {
    try {
      await supabase.from('customer_retention_scores').upsert({
        customer_id: customerId,
        business_id: businessId,
        risk_score: analysis.riskScore,
        risk_level: analysis.riskLevel,
        factors: analysis.factors,
        primary_reason: analysis.primaryRiskReason,
        retention_priority: analysis.retentionPriority,
        suggested_strategy: analysis.suggestedStrategy,
        analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id,business_id',
      })
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `retention_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }
}

// Customer data interface
interface CustomerData {
  id: string
  business_id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  appointments?: Array<{
    id: string
    status: string
    date?: string
    created_at: string
  }>
  calls?: Array<{
    id: string
    duration: number
    outcome: string
    sentiment_score?: number
    created_at: string
  }>
  completedAppointments?: number
  noShowCount?: number
  cancellationCount?: number
  lastInteractionDate?: Date | null
  daysSinceLastInteraction?: number | null
}

// Churn risk analysis interface
interface ChurnRiskAnalysis {
  customerId: string
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  factors: RiskFactor[]
  primaryRiskReason: string
  retentionPriority: 'critical' | 'high' | 'medium' | 'low'
  suggestedStrategy: string
}

interface RiskFactor {
  name: string
  weight: number
  score: number
  reason: string
}

// Export singleton
export const customerRetentionAgent = CustomerRetentionAgent.getInstance()
export default CustomerRetentionAgent
