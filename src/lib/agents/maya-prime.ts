/**
 * Maya Prime - Business Operations Orchestrator
 *
 * The central AI brain that coordinates all specialized agents,
 * monitors business health, and drives autonomous operations.
 */

import { supabase } from '../supabase-client'
import { CreditSystem, CreditCost } from '../credit-system'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../error-tracking'
import AuditLogger, { AuditEventType } from '../audit-logger'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentInsight,
  AgentAlert,
  AgentAction,
  AgentPriority,
  BusinessHealthMetrics,
  DailySummary,
  HealthDimension,
  OrchestratorState,
  AgentEvent,
  AgentCreditCost,
} from './types'

// Configuration
const MAYA_PRIME_CONFIG = {
  healthCheckIntervalMs: 5 * 60 * 1000, // 5 minutes
  dailySummaryHour: 6, // 6 AM local time
  maxConcurrentAgents: 5,
  alertThresholds: {
    revenueDecline: 20, // percent
    customerChurn: 10, // percent
    systemErrors: 5, // per hour
    lowCredits: 100, // credits remaining
  },
}

export class MayaPrime {
  private static instance: MayaPrime
  private errorTracker = ErrorTracker.getInstance()
  private state: OrchestratorState
  private registeredAgents: Map<string, AgentConfig> = new Map()
  private taskQueue: AgentAction[] = []
  private isProcessing = false

  private constructor() {
    this.state = {
      isRunning: false,
      lastHeartbeat: new Date(),
      activeAgents: [],
      queuedTasks: 0,
      health: this.initializeHealth(),
    }
  }

  static getInstance(): MayaPrime {
    if (!MayaPrime.instance) {
      MayaPrime.instance = new MayaPrime()
    }
    return MayaPrime.instance
  }

  /**
   * Initialize the orchestrator for a business
   */
  async initialize(businessId: string): Promise<boolean> {
    try {
      // Verify business exists and has valid subscription
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, subscription_tier, monthly_credits')
        .eq('id', businessId)
        .single()

      if (error || !business) {
        this.errorTracker.trackError(
          'Failed to initialize Maya Prime - business not found',
          ErrorCategory.AGENT_PROVISIONING,
          ErrorSeverity.HIGH,
          { businessId }
        )
        return false
      }

      this.state.isRunning = true
      this.state.lastHeartbeat = new Date()

      // Log initialization
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'maya_prime_initialized',
          businessName: business.name,
          tier: business.subscription_tier,
        },
        severity: 'low',
      })

      return true
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Maya Prime initialization failed'),
        ErrorCategory.AGENT_PROVISIONING,
        ErrorSeverity.CRITICAL,
        { businessId }
      )
      return false
    }
  }

  /**
   * Process an event and trigger appropriate agents
   */
  async handleEvent(
    event: AgentEvent,
    businessId: string,
    data: any
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = []
    const context: AgentContext = {
      businessId,
      triggeredBy: 'event',
      triggerData: data,
      startTime: new Date(),
    }

    try {
      switch (event) {
        case AgentEvent.CALL_ENDED:
          // Trigger call intelligence analysis
          results.push(await this.triggerAgent('call-intelligence', context))
          break

        case AgentEvent.LEAD_CREATED:
          // Trigger lead qualification
          results.push(await this.triggerAgent('lead-qualification', context))
          break

        case AgentEvent.APPOINTMENT_NOSHOW:
          // Trigger follow-up and potential re-booking
          results.push(await this.triggerAgent('appointment-recovery', context))
          break

        case AgentEvent.CREDITS_LOW:
          // Generate alert for low credits
          await this.generateAlert({
            severity: 'warning',
            title: 'Credits Running Low',
            message: `Your account has ${data.creditsRemaining} credits remaining. Consider purchasing a credit pack.`,
            category: 'billing',
            timestamp: new Date(),
            metadata: { creditsRemaining: data.creditsRemaining },
          }, businessId)
          break

        case AgentEvent.CHURN_RISK:
          // Trigger customer retention agent
          results.push(await this.triggerAgent('customer-retention', context))
          break

        case AgentEvent.DAILY_SUMMARY:
          // Generate daily summary
          await this.generateDailySummary(businessId)
          break
      }

      return results
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Event handling failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.HIGH,
        { businessId, event, data }
      )
      return results
    }
  }

  /**
   * Trigger a specific agent
   */
  private async triggerAgent(agentId: string, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Check if agent exists and is enabled
      const agent = this.registeredAgents.get(agentId)
      if (!agent || !agent.enabled) {
        return {
          success: false,
          executionId,
          agentId,
          businessId: context.businessId,
          duration: Date.now() - startTime,
          error: 'Agent not found or disabled',
        }
      }

      // Add to active agents
      this.state.activeAgents.push(agentId)

      // Execute based on agent type (placeholder for actual agent execution)
      const result = await this.executeAgent(agent, context, executionId)

      // Remove from active agents
      this.state.activeAgents = this.state.activeAgents.filter((id) => id !== agentId)

      return result
    } catch (error) {
      this.state.activeAgents = this.state.activeAgents.filter((id) => id !== agentId)

      return {
        success: false,
        executionId,
        agentId,
        businessId: context.businessId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Execute an agent (to be extended with actual agent implementations)
   */
  private async executeAgent(
    agent: AgentConfig,
    context: AgentContext,
    executionId: string
  ): Promise<AgentResult> {
    const startTime = Date.now()

    // Log execution start
    await this.logExecution(executionId, agent.id, context.businessId, 'started')

    // Placeholder - actual agent logic will be implemented in separate files
    // and called via the agent registry

    const result: AgentResult = {
      success: true,
      executionId,
      agentId: agent.id,
      businessId: context.businessId,
      duration: Date.now() - startTime,
      insights: [],
      actions: [],
      alerts: [],
    }

    // Log execution completion
    await this.logExecution(executionId, agent.id, context.businessId, 'completed', result)

    return result
  }

  /**
   * Calculate business health score
   */
  async calculateBusinessHealth(businessId: string): Promise<BusinessHealthMetrics> {
    const health = this.initializeHealth()

    try {
      // Get recent data for analysis
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Revenue health
      const { data: revenueData } = await supabase
        .from('appointments')
        .select('total_amount, created_at')
        .eq('business_id', businessId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed')

      if (revenueData && revenueData.length > 0) {
        const totalRevenue = revenueData.reduce((sum, r) => sum + (r.total_amount || 0), 0)
        const avgDailyRevenue = totalRevenue / 30
        health.revenue.score = Math.min(100, Math.round(avgDailyRevenue / 10)) // Scale based on daily target
      }

      // Customer health (based on call outcomes and appointments)
      const { data: callData } = await supabase
        .from('voice_ai_calls')
        .select('outcome, sentiment_score, created_at')
        .eq('business_id', businessId)
        .gte('created_at', sevenDaysAgo.toISOString())

      if (callData && callData.length > 0) {
        const positiveOutcomes = callData.filter(
          (c) => c.outcome === 'appointment_booked' || c.outcome === 'callback_scheduled'
        ).length
        health.customer.score = Math.round((positiveOutcomes / callData.length) * 100)
      }

      // Operations health (based on system uptime and errors)
      health.operations.score = 85 // Default good score, would track actual errors

      // Compliance health (audit log analysis)
      health.compliance.score = 90 // Default good score

      // System health (credits, integrations)
      const balance = await CreditSystem.getBalance(businessId)
      if (balance) {
        health.system.score = balance.total_credits > MAYA_PRIME_CONFIG.alertThresholds.lowCredits ? 90 : 50
        if (balance.total_credits < MAYA_PRIME_CONFIG.alertThresholds.lowCredits) {
          health.system.topIssue = 'Low credit balance'
        }
      }

      // Calculate overall health (weighted average)
      health.overall = Math.round(
        health.revenue.score * 0.25 +
        health.customer.score * 0.25 +
        health.operations.score * 0.2 +
        health.compliance.score * 0.15 +
        health.system.score * 0.15
      )

      health.lastUpdated = new Date()
      this.state.health = health

      return health
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Health calculation failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId }
      )
      return health
    }
  }

  /**
   * Generate daily business summary
   */
  async generateDailySummary(businessId: string): Promise<DailySummary | null> {
    try {
      // Check credits
      const hasCredits = await CreditSystem.hasCredits(businessId, AgentCreditCost.DAILY_SUMMARY)
      if (!hasCredits) {
        await this.generateAlert({
          severity: 'warning',
          title: 'Daily Summary Skipped',
          message: 'Insufficient credits to generate daily summary.',
          category: 'system',
          timestamp: new Date(),
        }, businessId)
        return null
      }

      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Gather metrics
      const { data: calls } = await supabase
        .from('voice_ai_calls')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', now.toISOString())

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', now.toISOString())

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', now.toISOString())

      const totalCalls = calls?.length || 0
      const appointmentsBooked = appointments?.length || 0
      const totalRevenue = appointments?.reduce((sum, a) => sum + (a.total_amount || 0), 0) || 0
      const leadsGenerated = leads?.length || 0
      const conversionRate = totalCalls > 0 ? (appointmentsBooked / totalCalls) * 100 : 0

      const summary: DailySummary = {
        businessId,
        date: now,
        metrics: {
          totalCalls,
          totalRevenue,
          appointmentsBooked,
          leadsGenerated,
          conversionRate: Math.round(conversionRate * 100) / 100,
          customerSatisfaction: 85, // Would come from sentiment analysis
        },
        highlights: this.generateHighlights(totalCalls, appointmentsBooked, totalRevenue),
        concerns: this.generateConcerns(totalCalls, conversionRate),
        opportunities: [],
        recommendedActions: [],
        agentExecutions: {
          total: 0,
          successful: 0,
          failed: 0,
          insights: 0,
          actions: 0,
        },
      }

      // Deduct credits
      await CreditSystem.deductCredits(
        businessId,
        AgentCreditCost.DAILY_SUMMARY,
        'daily_summary',
        { date: now.toISOString() }
      )

      // Store summary
      await this.storeDailySummary(summary)

      this.state.dailySummary = summary
      return summary
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Daily summary generation failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId }
      )
      return null
    }
  }

  /**
   * Generate highlights based on metrics
   */
  private generateHighlights(calls: number, appointments: number, revenue: number): string[] {
    const highlights: string[] = []

    if (calls > 0) {
      highlights.push(`Handled ${calls} customer calls today`)
    }
    if (appointments > 0) {
      highlights.push(`Booked ${appointments} appointments`)
    }
    if (revenue > 0) {
      highlights.push(`Generated $${revenue.toLocaleString()} in revenue`)
    }

    return highlights
  }

  /**
   * Generate concerns based on metrics
   */
  private generateConcerns(calls: number, conversionRate: number): string[] {
    const concerns: string[] = []

    if (calls === 0) {
      concerns.push('No calls received today - check voice agent status')
    }
    if (conversionRate < 20) {
      concerns.push(`Low conversion rate (${conversionRate.toFixed(1)}%) - review call scripts`)
    }

    return concerns
  }

  /**
   * Generate and store an alert
   */
  async generateAlert(alert: AgentAlert, businessId: string): Promise<void> {
    try {
      await supabase.from('agent_alerts').insert({
        business_id: businessId,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        category: alert.category,
        metadata: alert.metadata,
        acknowledged: false,
        created_at: alert.timestamp.toISOString(),
      })
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Alert generation failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.LOW,
        { businessId, alert }
      )
    }
  }

  /**
   * Queue an action for execution
   */
  queueAction(action: AgentAction): void {
    this.taskQueue.push(action)
    this.state.queuedTasks = this.taskQueue.length

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * Process queued actions
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return

    this.isProcessing = true

    while (this.taskQueue.length > 0) {
      // Sort by priority
      this.taskQueue.sort((a, b) => {
        const priorityOrder: Record<AgentPriority, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      const action = this.taskQueue.shift()
      if (action) {
        await this.executeAction(action)
        this.state.queuedTasks = this.taskQueue.length
      }
    }

    this.isProcessing = false
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: AgentAction): Promise<void> {
    // Placeholder for action execution
    // Would route to appropriate service based on action.type
  }

  /**
   * Store daily summary in database
   */
  private async storeDailySummary(summary: DailySummary): Promise<void> {
    try {
      await supabase.from('daily_summaries').insert({
        business_id: summary.businessId,
        date: summary.date.toISOString(),
        metrics: summary.metrics,
        highlights: summary.highlights,
        concerns: summary.concerns,
        opportunities: summary.opportunities,
        recommended_actions: summary.recommendedActions,
        agent_executions: summary.agentExecutions,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Ignore storage errors - summary was still generated
    }
  }

  /**
   * Log agent execution
   */
  private async logExecution(
    executionId: string,
    agentId: string,
    businessId: string,
    status: string,
    result?: AgentResult
  ): Promise<void> {
    try {
      await supabase.from('agent_executions').insert({
        id: executionId,
        agent_id: agentId,
        business_id: businessId,
        status,
        result: result || null,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Ignore logging errors
    }
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(config: AgentConfig): void {
    this.registeredAgents.set(config.id, config)
  }

  /**
   * Get orchestrator state
   */
  getState(): OrchestratorState {
    return { ...this.state }
  }

  /**
   * Initialize health metrics with defaults
   */
  private initializeHealth(): BusinessHealthMetrics {
    const defaultDimension: HealthDimension = {
      score: 0,
      trend: 'stable',
      alerts: 0,
    }

    return {
      overall: 0,
      revenue: { ...defaultDimension },
      customer: { ...defaultDimension },
      operations: { ...defaultDimension },
      compliance: { ...defaultDimension },
      system: { ...defaultDimension },
      lastUpdated: new Date(),
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// Export singleton
export const mayaPrime = MayaPrime.getInstance()
export default MayaPrime
