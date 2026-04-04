/**
 * Lead Qualification Agent
 *
 * Automatically scores and qualifies leads based on multiple signals:
 * - Call interactions and sentiment
 * - Website/form engagement
 * - Email responsiveness
 * - Service interest and urgency
 * - Demographic and firmographic data
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
  LeadQualification,
  QualificationFactor,
  AgentCreditCost,
  AgentEvent,
} from './types'
import { mayaPrime } from './maya-prime'

// Agent configuration
const LEAD_QUALIFICATION_CONFIG: AgentConfig = {
  id: 'lead-qualification',
  name: 'Lead Qualification Agent',
  description: 'Scores and qualifies leads based on engagement and intent signals',
  cluster: 'revenue',
  enabled: true,
  triggers: [
    { event: AgentEvent.LEAD_CREATED },
    { event: AgentEvent.LEAD_UPDATED },
    { event: AgentEvent.CALL_ENDED },
  ],
}

// Qualification weights
const QUALIFICATION_WEIGHTS = {
  engagement: 0.25,
  intent: 0.30,
  urgency: 0.20,
  fit: 0.15,
  behavior: 0.10,
}

// Scoring thresholds
const SCORE_THRESHOLDS = {
  hot: 75,
  warm: 50,
  cold: 25,
}

export class LeadQualificationAgent {
  private static instance: LeadQualificationAgent
  private errorTracker = ErrorTracker.getInstance()
  private config: AgentConfig

  private constructor() {
    this.config = LEAD_QUALIFICATION_CONFIG
    mayaPrime.registerAgent(this.config)
  }

  static getInstance(): LeadQualificationAgent {
    if (!LeadQualificationAgent.instance) {
      LeadQualificationAgent.instance = new LeadQualificationAgent()
    }
    return LeadQualificationAgent.instance
  }

  /**
   * Qualify a lead
   */
  async qualifyLead(
    leadId: string,
    businessId: string,
    context?: AgentContext
  ): Promise<AgentResult> {
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
          error: 'Insufficient credits for lead qualification',
        }
      }

      // Get lead data
      const lead = await this.getLeadData(leadId, businessId)
      if (!lead) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Lead not found',
        }
      }

      // Perform qualification
      const qualification = await this.performQualification(lead, businessId)

      // Generate insights
      const insights = this.generateInsights(qualification, lead)

      // Determine actions
      const actions = this.determineActions(qualification, lead)

      // Check for alerts
      const alerts = this.checkForAlerts(qualification, lead)

      // Store qualification
      await this.storeQualification(qualification)

      // Deduct credits
      // Included feature — no deduction: // await deductCredits(
        businessId,
        AgentCreditCost.LEAD_QUALIFICATION,
        'lead_qualification',
        { leadId }
      )

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'lead_qualified',
          leadId,
          score: qualification.score,
          tier: qualification.tier,
        },
        severity: 'low',
      })

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: qualification,
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Lead qualification failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId, leadId }
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
   * Batch qualify multiple leads
   */
  async batchQualify(
    businessId: string,
    options?: { unqualifiedOnly?: boolean; limit?: number }
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Get leads to qualify
      let query = supabase
        .from('leads')
        .select('id')
        .eq('business_id', businessId)

      if (options?.unqualifiedOnly) {
        query = query.is('qualification_score', null)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data: leads, error } = await query

      if (error || !leads) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Failed to fetch leads',
        }
      }

      // Qualify each lead
      const results: LeadQualification[] = []
      let qualified = 0
      let failed = 0

      for (const lead of leads) {
        const result = await this.qualifyLead(lead.id, businessId)
        if (result.success && result.output) {
          results.push(result.output)
          qualified++
        } else {
          failed++
        }
      }

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: {
          total: leads.length,
          qualified,
          failed,
          results,
        },
        insights: [
          {
            type: 'trend',
            title: 'Batch Qualification Complete',
            description: `Qualified ${qualified} of ${leads.length} leads`,
            confidence: 1,
            impact: 'medium',
          },
        ],
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
   * Get lead data with all related information
   */
  private async getLeadData(leadId: string, businessId: string): Promise<LeadData | null> {
    try {
      // Get lead
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('business_id', businessId)
        .single()

      if (error || !lead) return null

      // Get call history
      const { data: calls } = await supabase
        .from('voice_ai_calls')
        .select('id, duration, outcome, sentiment_score, created_at')
        .eq('business_id', businessId)
        .eq('customer_phone', lead.phone)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get appointment history
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status, created_at')
        .eq('business_id', businessId)
        .or(`customer_phone.eq.${lead.phone},customer_email.eq.${lead.email}`)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get email engagement (if tracked)
      const { data: emailEngagement } = await supabase
        .from('email_events')
        .select('event_type, created_at')
        .eq('business_id', businessId)
        .eq('recipient_email', lead.email)
        .order('created_at', { ascending: false })
        .limit(20)

      return {
        ...lead,
        calls: calls || [],
        appointments: appointments || [],
        emailEngagement: emailEngagement || [],
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Perform lead qualification
   */
  private async performQualification(
    lead: LeadData,
    businessId: string
  ): Promise<LeadQualification> {
    const factors: QualificationFactor[] = []

    // 1. Engagement Score
    const engagementScore = this.calculateEngagementScore(lead)
    factors.push({
      name: 'Engagement',
      weight: QUALIFICATION_WEIGHTS.engagement,
      score: engagementScore.score,
      notes: engagementScore.notes,
    })

    // 2. Intent Score
    const intentScore = this.calculateIntentScore(lead)
    factors.push({
      name: 'Intent',
      weight: QUALIFICATION_WEIGHTS.intent,
      score: intentScore.score,
      notes: intentScore.notes,
    })

    // 3. Urgency Score
    const urgencyScore = this.calculateUrgencyScore(lead)
    factors.push({
      name: 'Urgency',
      weight: QUALIFICATION_WEIGHTS.urgency,
      score: urgencyScore.score,
      notes: urgencyScore.notes,
    })

    // 4. Fit Score
    const fitScore = this.calculateFitScore(lead, businessId)
    factors.push({
      name: 'Fit',
      weight: QUALIFICATION_WEIGHTS.fit,
      score: fitScore.score,
      notes: fitScore.notes,
    })

    // 5. Behavior Score
    const behaviorScore = this.calculateBehaviorScore(lead)
    factors.push({
      name: 'Behavior',
      weight: QUALIFICATION_WEIGHTS.behavior,
      score: behaviorScore.score,
      notes: behaviorScore.notes,
    })

    // Calculate weighted total
    const totalScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    )

    // Determine tier
    let tier: 'hot' | 'warm' | 'cold' | 'disqualified'
    if (totalScore >= SCORE_THRESHOLDS.hot) {
      tier = 'hot'
    } else if (totalScore >= SCORE_THRESHOLDS.warm) {
      tier = 'warm'
    } else if (totalScore >= SCORE_THRESHOLDS.cold) {
      tier = 'cold'
    } else {
      tier = 'disqualified'
    }

    // Determine recommended action
    const recommendedAction = this.getRecommendedAction(tier, factors)

    // Determine urgency
    const urgency = this.getUrgency(tier, urgencyScore.score)

    // Estimate value
    const estimatedValue = this.estimateValue(lead, tier)

    return {
      leadId: lead.id,
      businessId: lead.business_id,
      score: totalScore,
      tier,
      factors,
      recommendedAction,
      urgency,
      estimatedValue,
    }
  }

  /**
   * Calculate engagement score based on interactions
   */
  private calculateEngagementScore(lead: LeadData): { score: number; notes: string } {
    let score = 30 // Base score

    // Call engagement
    const callCount = lead.calls?.length || 0
    if (callCount > 0) score += 20
    if (callCount > 2) score += 15

    // Positive call outcomes
    const positiveOutcomes = lead.calls?.filter(
      (c) => c.outcome === 'appointment_booked' || c.outcome === 'qualified'
    ).length || 0
    score += positiveOutcomes * 15

    // Average call duration (longer = more engaged)
    const avgDuration = lead.calls?.reduce((sum, c) => sum + (c.duration || 0), 0) / Math.max(1, callCount)
    if (avgDuration > 180) score += 10
    if (avgDuration > 300) score += 10

    // Email engagement
    const emailOpens = lead.emailEngagement?.filter((e) => e.event_type === 'open').length || 0
    const emailClicks = lead.emailEngagement?.filter((e) => e.event_type === 'click').length || 0
    score += emailOpens * 2
    score += emailClicks * 5

    // Appointment history
    if (lead.appointments?.length > 0) score += 15

    // Recency bonus
    const lastInteraction = this.getLastInteractionDate(lead)
    if (lastInteraction) {
      const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 1) score += 15
      else if (daysSince < 7) score += 10
      else if (daysSince < 30) score += 5
    }

    const notes = `${callCount} calls, ${emailOpens} email opens, ${lead.appointments?.length || 0} appointments`
    return { score: Math.min(100, score), notes }
  }

  /**
   * Calculate intent score based on signals
   */
  private calculateIntentScore(lead: LeadData): { score: number; notes: string } {
    let score = 20 // Base score
    const signals: string[] = []

    // Source-based intent
    if (lead.source === 'voice_ai') {
      score += 25
      signals.push('called business')
    }
    if (lead.source === 'website_form') {
      score += 20
      signals.push('submitted form')
    }
    if (lead.source === 'referral') {
      score += 30
      signals.push('referral')
    }

    // Notes/comments indicating intent
    const notes = (lead.notes || '').toLowerCase()
    if (notes.includes('appointment') || notes.includes('schedule')) {
      score += 20
      signals.push('wants appointment')
    }
    if (notes.includes('price') || notes.includes('cost') || notes.includes('quote')) {
      score += 15
      signals.push('price inquiry')
    }
    if (notes.includes('urgent') || notes.includes('asap') || notes.includes('emergency')) {
      score += 25
      signals.push('urgent need')
    }

    // Call outcomes indicating intent
    const interestedCalls = lead.calls?.filter(
      (c) => c.outcome === 'qualified' || c.outcome === 'callback_requested'
    ).length || 0
    score += interestedCalls * 15

    return { score: Math.min(100, score), notes: signals.join(', ') || 'No strong signals' }
  }

  /**
   * Calculate urgency score
   */
  private calculateUrgencyScore(lead: LeadData): { score: number; notes: string } {
    let score = 30 // Base score
    const urgencySignals: string[] = []

    // Check notes for urgency keywords
    const notes = (lead.notes || '').toLowerCase()
    const urgencyKeywords = ['urgent', 'asap', 'today', 'immediately', 'emergency', 'pain', 'broken']
    for (const keyword of urgencyKeywords) {
      if (notes.includes(keyword)) {
        score += 20
        urgencySignals.push(keyword)
      }
    }

    // Recent activity indicates urgency
    const lastInteraction = this.getLastInteractionDate(lead)
    if (lastInteraction) {
      const hoursSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 1) {
        score += 25
        urgencySignals.push('just contacted')
      } else if (hoursSince < 24) {
        score += 15
        urgencySignals.push('contacted today')
      }
    }

    // Multiple calls in short time = urgency
    const recentCalls = lead.calls?.filter((c) => {
      const callDate = new Date(c.created_at)
      return Date.now() - callDate.getTime() < 24 * 60 * 60 * 1000
    }).length || 0
    if (recentCalls > 1) {
      score += 20
      urgencySignals.push('multiple calls')
    }

    return {
      score: Math.min(100, score),
      notes: urgencySignals.length > 0 ? urgencySignals.join(', ') : 'Standard timeline',
    }
  }

  /**
   * Calculate fit score (how well lead matches ideal customer)
   */
  private calculateFitScore(lead: LeadData, businessId: string): { score: number; notes: string } {
    let score = 50 // Assume moderate fit by default
    const fitFactors: string[] = []

    // Has complete contact info
    if (lead.email && lead.phone) {
      score += 15
      fitFactors.push('complete contact')
    }

    // Has company/business info (B2B indicator)
    if (lead.company) {
      score += 10
      fitFactors.push('business lead')
    }

    // Location match (if tracked)
    // Would compare lead.location with business service area

    // Previous customer
    if (lead.appointments && lead.appointments.some((a) => a.status === 'completed')) {
      score += 20
      fitFactors.push('previous customer')
    }

    return {
      score: Math.min(100, score),
      notes: fitFactors.length > 0 ? fitFactors.join(', ') : 'Unknown fit',
    }
  }

  /**
   * Calculate behavior score
   */
  private calculateBehaviorScore(lead: LeadData): { score: number; notes: string } {
    let score = 50 // Neutral start
    const behaviors: string[] = []

    // Positive behaviors
    const completedAppointments = lead.appointments?.filter((a) => a.status === 'completed').length || 0
    score += completedAppointments * 15
    if (completedAppointments > 0) behaviors.push(`${completedAppointments} completed`)

    // Negative behaviors
    const noShows = lead.appointments?.filter((a) => a.status === 'no_show').length || 0
    score -= noShows * 20
    if (noShows > 0) behaviors.push(`${noShows} no-shows`)

    const cancelled = lead.appointments?.filter((a) => a.status === 'cancelled').length || 0
    score -= cancelled * 10
    if (cancelled > 0) behaviors.push(`${cancelled} cancelled`)

    // Negative call sentiment
    const negativeCalls = lead.calls?.filter((c) => c.sentiment_score && c.sentiment_score < -0.3).length || 0
    score -= negativeCalls * 15
    if (negativeCalls > 0) behaviors.push('negative calls')

    return {
      score: Math.max(0, Math.min(100, score)),
      notes: behaviors.length > 0 ? behaviors.join(', ') : 'No behavior data',
    }
  }

  /**
   * Get last interaction date
   */
  private getLastInteractionDate(lead: LeadData): Date | null {
    const dates: Date[] = []

    if (lead.calls && lead.calls.length > 0) {
      dates.push(new Date(lead.calls[0].created_at))
    }
    if (lead.appointments && lead.appointments.length > 0) {
      dates.push(new Date(lead.appointments[0].created_at))
    }
    if (lead.emailEngagement && lead.emailEngagement.length > 0) {
      dates.push(new Date(lead.emailEngagement[0].created_at))
    }
    if (lead.updated_at) {
      dates.push(new Date(lead.updated_at))
    }

    if (dates.length === 0) return null
    return new Date(Math.max(...dates.map((d) => d.getTime())))
  }

  /**
   * Get recommended action based on qualification
   */
  private getRecommendedAction(tier: string, factors: QualificationFactor[]): string {
    switch (tier) {
      case 'hot':
        return 'Immediate personal outreach - high probability of conversion'
      case 'warm':
        const lowFactors = factors.filter((f) => f.score < 50)
        if (lowFactors.length > 0) {
          return `Nurture with focus on: ${lowFactors.map((f) => f.name).join(', ')}`
        }
        return 'Schedule follow-up call within 24-48 hours'
      case 'cold':
        return 'Add to nurture campaign - automated follow-ups'
      default:
        return 'Review manually - may not be a fit'
    }
  }

  /**
   * Get urgency level
   */
  private getUrgency(
    tier: string,
    urgencyScore: number
  ): 'immediate' | 'within_24h' | 'within_week' | 'nurture' {
    if (tier === 'hot' && urgencyScore > 70) return 'immediate'
    if (tier === 'hot') return 'within_24h'
    if (tier === 'warm') return 'within_week'
    return 'nurture'
  }

  /**
   * Estimate potential value
   */
  private estimateValue(lead: LeadData, tier: string): number {
    // Base value by tier
    const baseValues = {
      hot: 500,
      warm: 250,
      cold: 100,
      disqualified: 0,
    }

    let value = baseValues[tier as keyof typeof baseValues] || 0

    // Adjust based on previous purchases
    const completedAppointments = lead.appointments?.filter((a) => a.status === 'completed').length || 0
    value += completedAppointments * 150

    return value
  }

  /**
   * Generate insights from qualification
   */
  private generateInsights(qualification: LeadQualification, lead: LeadData): AgentInsight[] {
    const insights: AgentInsight[] = []

    // Hot lead insight
    if (qualification.tier === 'hot') {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Lead',
        description: `Lead ${lead.first_name || 'Unknown'} scored ${qualification.score}/100 - ready for conversion`,
        confidence: qualification.score / 100,
        impact: 'high',
        suggestedActions: [qualification.recommendedAction],
        data: { leadId: lead.id, score: qualification.score },
      })
    }

    // Declining engagement
    const engagementFactor = qualification.factors.find((f) => f.name === 'Engagement')
    if (engagementFactor && engagementFactor.score < 30) {
      insights.push({
        type: 'risk',
        title: 'Low Engagement',
        description: 'Lead has minimal engagement - may need re-engagement campaign',
        confidence: 0.7,
        impact: 'medium',
        suggestedActions: ['Send re-engagement email', 'Offer incentive'],
      })
    }

    // High intent but no conversion
    const intentFactor = qualification.factors.find((f) => f.name === 'Intent')
    if (intentFactor && intentFactor.score > 70 && qualification.tier !== 'hot') {
      insights.push({
        type: 'opportunity',
        title: 'Intent Without Conversion',
        description: 'Lead shows high intent but has barriers to conversion',
        confidence: 0.75,
        impact: 'high',
        suggestedActions: ['Address objections', 'Offer consultation', 'Review pricing'],
      })
    }

    return insights
  }

  /**
   * Determine actions based on qualification
   */
  private determineActions(qualification: LeadQualification, lead: LeadData): AgentAction[] {
    const actions: AgentAction[] = []

    switch (qualification.urgency) {
      case 'immediate':
        actions.push({
          type: 'notify_team',
          target: 'sales',
          payload: {
            leadId: lead.id,
            message: `Hot lead requires immediate attention: ${lead.first_name} ${lead.last_name || ''}`,
            score: qualification.score,
          },
          priority: 'critical',
        })
        break

      case 'within_24h':
        actions.push({
          type: 'schedule_follow_up',
          target: 'lead',
          payload: {
            leadId: lead.id,
            type: 'call',
            reason: qualification.recommendedAction,
          },
          priority: 'high',
          scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        })
        break

      case 'within_week':
        actions.push({
          type: 'add_to_campaign',
          target: 'lead',
          payload: {
            leadId: lead.id,
            campaign: 'warm_lead_nurture',
          },
          priority: 'medium',
        })
        break

      case 'nurture':
        actions.push({
          type: 'add_to_campaign',
          target: 'lead',
          payload: {
            leadId: lead.id,
            campaign: 'cold_lead_nurture',
          },
          priority: 'low',
        })
        break
    }

    return actions
  }

  /**
   * Check for alerts
   */
  private checkForAlerts(qualification: LeadQualification, lead: LeadData): AgentAlert[] {
    const alerts: AgentAlert[] = []

    // High-value lead alert
    if (qualification.tier === 'hot' && qualification.estimatedValue && qualification.estimatedValue > 400) {
      alerts.push({
        severity: 'info',
        title: 'High-Value Lead Identified',
        message: `${lead.first_name || 'Lead'} has estimated value of $${qualification.estimatedValue}`,
        category: 'opportunity',
        timestamp: new Date(),
        metadata: { leadId: lead.id, value: qualification.estimatedValue },
      })
    }

    // Behavior issues
    const behaviorFactor = qualification.factors.find((f) => f.name === 'Behavior')
    if (behaviorFactor && behaviorFactor.score < 30) {
      alerts.push({
        severity: 'warning',
        title: 'Lead Behavior Concerns',
        message: `Lead has concerning behavior patterns: ${behaviorFactor.notes}`,
        category: 'risk',
        timestamp: new Date(),
        metadata: { leadId: lead.id },
      })
    }

    return alerts
  }

  /**
   * Store qualification in database
   */
  private async storeQualification(qualification: LeadQualification): Promise<void> {
    try {
      await supabase
        .from('leads')
        .update({
          qualification_score: qualification.score,
          qualification_tier: qualification.tier,
          qualification_factors: qualification.factors,
          recommended_action: qualification.recommendedAction,
          estimated_value: qualification.estimatedValue,
          qualified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', qualification.leadId)
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Failed to store qualification'),
        ErrorCategory.DATABASE,
        ErrorSeverity.LOW,
        { leadId: qualification.leadId }
      )
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `lead_qual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }
}

// Lead data interface
interface LeadData {
  id: string
  business_id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  source?: string
  notes?: string
  status?: string
  created_at: string
  updated_at?: string
  calls?: Array<{
    id: string
    duration: number
    outcome: string
    sentiment_score?: number
    created_at: string
  }>
  appointments?: Array<{
    id: string
    status: string
    created_at: string
  }>
  emailEngagement?: Array<{
    event_type: string
    created_at: string
  }>
}

// Export singleton
export const leadQualificationAgent = LeadQualificationAgent.getInstance()
export default LeadQualificationAgent
