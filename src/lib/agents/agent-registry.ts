/**
 * Agent Registry
 *
 * Centralized registry for managing all AI agents in the VoiceFly system.
 * Provides agent discovery, lifecycle management, and unified access.
 */

import { supabase } from '../supabase-client'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../error-tracking'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentCluster,
  AgentEvent,
  AgentStatus,
} from './types'
import { MayaPrime, mayaPrime } from './maya-prime'
import { CallIntelligenceAgent, callIntelligenceAgent, VAPICallData } from './call-intelligence'
import { LeadQualificationAgent, leadQualificationAgent } from './lead-qualification'
import { CustomerRetentionAgent, customerRetentionAgent } from './customer-retention'
import { AppointmentRecoveryAgent, appointmentRecoveryAgent } from './appointment-recovery'
import { RevenueIntelligenceAgent, revenueIntelligenceAgent } from './revenue-intelligence'
import { customerMemoryAgent } from './customer-memory'
import { routingAgent } from './routing-agent'
import { setupAgent } from './setup-agent'
import { BillingAgent } from '../billing-agent'
import { chatAgent } from './chat-agent'

// Agent execution interface
interface AgentExecutor {
  execute(context: AgentContext, data?: any): Promise<AgentResult>
}

// Registered agent entry
interface RegisteredAgent {
  config: AgentConfig
  executor?: AgentExecutor
  instance: any
  status: AgentStatus
  lastExecution?: Date
  executionCount: number
  errorCount: number
}

export class AgentRegistry {
  private static instance: AgentRegistry
  private errorTracker = ErrorTracker.getInstance()
  private agents: Map<string, RegisteredAgent> = new Map()
  private eventSubscriptions: Map<AgentEvent, string[]> = new Map()
  private isInitialized = false

  private constructor() {
    this.initializeDefaultAgents()
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry()
    }
    return AgentRegistry.instance
  }

  /**
   * Initialize default agents
   */
  private initializeDefaultAgents(): void {
    // Register Call Intelligence Agent
    this.registerAgent({
      config: callIntelligenceAgent.getConfig(),
      instance: callIntelligenceAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Lead Qualification Agent
    this.registerAgent({
      config: leadQualificationAgent.getConfig(),
      instance: leadQualificationAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Customer Retention Agent
    this.registerAgent({
      config: customerRetentionAgent.getConfig(),
      instance: customerRetentionAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Appointment Recovery Agent
    this.registerAgent({
      config: appointmentRecoveryAgent.getConfig(),
      instance: appointmentRecoveryAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Revenue Intelligence Agent
    this.registerAgent({
      config: revenueIntelligenceAgent.getConfig(),
      instance: revenueIntelligenceAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Customer Memory Agent
    this.registerAgent({
      config: {
        id: 'customer-memory',
        name: 'Customer Memory Agent',
        description: 'Injects caller history into live VAPI calls at call start',
        cluster: 'customer',
        enabled: true,
        triggers: [{ event: AgentEvent.CALL_STARTED }],
      },
      instance: customerMemoryAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Routing Agent
    this.registerAgent({
      config: {
        id: 'routing',
        name: 'Routing Agent',
        description: 'Routes inbound calls to the best phone employee',
        cluster: 'operations',
        enabled: true,
        triggers: [{ event: AgentEvent.CALL_STARTED }],
      },
      instance: routingAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Setup Agent
    this.registerAgent({
      config: {
        id: 'setup',
        name: 'Setup Agent',
        description: 'Conversational onboarding agent for configuring phone employees',
        cluster: 'system',
        enabled: true,
      },
      instance: setupAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Register Billing Agent (admin-side, static class — no customer events)
    this.registerAgent({
      config: {
        id: 'billing',
        name: 'Billing Agent',
        description: 'Handles credit alerts, fraud detection, dunning, and billing lifecycle',
        cluster: 'financial',
        enabled: true,
      },
      instance: null, // Static class — called directly in executeAgent
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })

    // Subscribe agents to events
    // Call Intelligence
    this.subscribeToEvent(AgentEvent.CALL_ENDED, 'call-intelligence')
    this.subscribeToEvent(AgentEvent.CALL_TRANSFERRED, 'call-intelligence')

    // Lead Qualification
    this.subscribeToEvent(AgentEvent.LEAD_CREATED, 'lead-qualification')
    this.subscribeToEvent(AgentEvent.LEAD_UPDATED, 'lead-qualification')

    // Customer Retention
    this.subscribeToEvent(AgentEvent.CHURN_RISK, 'customer-retention')
    this.subscribeToEvent(AgentEvent.CUSTOMER_FEEDBACK, 'customer-retention')
    this.subscribeToEvent(AgentEvent.APPOINTMENT_NOSHOW, 'customer-retention')
    this.subscribeToEvent(AgentEvent.APPOINTMENT_CANCELLED, 'customer-retention')

    // Appointment Recovery
    this.subscribeToEvent(AgentEvent.APPOINTMENT_CANCELLED, 'appointment-recovery')
    this.subscribeToEvent(AgentEvent.APPOINTMENT_NOSHOW, 'appointment-recovery')

    // Revenue Intelligence
    this.subscribeToEvent(AgentEvent.PAYMENT_RECEIVED, 'revenue-intelligence')
    this.subscribeToEvent(AgentEvent.DAILY_SUMMARY, 'revenue-intelligence')

    // Customer Memory + Routing — both fire at call start
    this.subscribeToEvent(AgentEvent.CALL_STARTED, 'customer-memory')
    this.subscribeToEvent(AgentEvent.CALL_STARTED, 'routing')

    // Chat Agent — fires when a widget chat session ends
    this.registerAgent({
      config: chatAgent.getConfig(),
      instance: chatAgent,
      status: 'idle',
      executionCount: 0,
      errorCount: 0,
    })
    this.subscribeToEvent(AgentEvent.CHAT_ENDED, 'chat')

    this.isInitialized = true
  }

  /**
   * Register an agent
   */
  registerAgent(agent: RegisteredAgent): void {
    this.agents.set(agent.config.id, agent)

    // Also register with Maya Prime
    mayaPrime.registerAgent(agent.config)
  }

  /**
   * Subscribe an agent to an event
   */
  subscribeToEvent(event: AgentEvent, agentId: string): void {
    const subscribers = this.eventSubscriptions.get(event) || []
    if (!subscribers.includes(agentId)) {
      subscribers.push(agentId)
      this.eventSubscriptions.set(event, subscribers)
    }
  }

  /**
   * Unsubscribe an agent from an event
   */
  unsubscribeFromEvent(event: AgentEvent, agentId: string): void {
    const subscribers = this.eventSubscriptions.get(event) || []
    this.eventSubscriptions.set(
      event,
      subscribers.filter((id) => id !== agentId)
    )
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId)
  }

  /**
   * Get all agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get agents by cluster
   */
  getAgentsByCluster(cluster: AgentCluster): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.config.cluster === cluster
    )
  }

  /**
   * Get enabled agents
   */
  getEnabledAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.config.enabled
    )
  }

  /**
   * Enable an agent
   */
  enableAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.config.enabled = true
      agent.status = 'idle'
      return true
    }
    return false
  }

  /**
   * Disable an agent
   */
  disableAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.config.enabled = false
      agent.status = 'idle'
      return true
    }
    return false
  }

  /**
   * Emit an event and trigger subscribed agents
   */
  async emitEvent(
    event: AgentEvent,
    businessId: string,
    data?: any
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = []
    const subscribers = this.eventSubscriptions.get(event) || []

    for (const agentId of subscribers) {
      const result = await this.executeAgent(agentId, businessId, event, data)
      if (result) {
        results.push(result)
      }
    }

    // Also notify Maya Prime
    const orchestratorResults = await mayaPrime.handleEvent(event, businessId, data)
    results.push(...orchestratorResults)

    return results
  }

  /**
   * Execute a specific agent
   */
  async executeAgent(
    agentId: string,
    businessId: string,
    triggeredBy: AgentEvent | 'manual',
    data?: any
  ): Promise<AgentResult | null> {
    const agent = this.agents.get(agentId)

    if (!agent) {
      this.errorTracker.trackError(
        `Agent not found: ${agentId}`,
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { agentId, businessId }
      )
      return null
    }

    if (!agent.config.enabled) {
      return null
    }

    const context: AgentContext = {
      businessId,
      triggeredBy: triggeredBy === 'manual' ? 'manual' : 'event',
      triggerData: data,
      startTime: new Date(),
    }

    try {
      agent.status = 'running'
      let result: AgentResult

      // Execute based on agent type
      switch (agentId) {
        case 'call-intelligence':
          if (data && data.callId) {
            result = await callIntelligenceAgent.analyzeCall(
              data.callId,
              businessId,
              data as VAPICallData
            )
          } else {
            result = {
              success: false,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: 0,
              error: 'Missing call data',
            }
          }
          break

        case 'lead-qualification':
          if (data && data.leadId) {
            result = await leadQualificationAgent.qualifyLead(
              data.leadId,
              businessId,
              context
            )
          } else {
            // Batch qualify if no specific lead
            result = await leadQualificationAgent.batchQualify(businessId, {
              unqualifiedOnly: true,
              limit: 50,
            })
          }
          break

        case 'customer-retention':
          if (triggeredBy === AgentEvent.APPOINTMENT_NOSHOW ||
              triggeredBy === AgentEvent.APPOINTMENT_CANCELLED ||
              triggeredBy === AgentEvent.CUSTOMER_FEEDBACK) {
            result = await customerRetentionAgent.handleCustomerEvent(
              businessId,
              triggeredBy,
              data
            )
          } else if (data && data.customerId) {
            result = await customerRetentionAgent.analyzeCustomer(
              data.customerId,
              businessId
            )
          } else {
            // Run daily analysis
            result = await customerRetentionAgent.runDailyAnalysis(businessId)
          }
          break

        case 'appointment-recovery':
          if (triggeredBy === AgentEvent.APPOINTMENT_CANCELLED && data?.appointmentId) {
            result = await appointmentRecoveryAgent.handleCancellation(
              data.appointmentId,
              businessId,
              data.reason
            )
          } else if (triggeredBy === AgentEvent.APPOINTMENT_NOSHOW && data?.appointmentId) {
            result = await appointmentRecoveryAgent.handleNoShow(
              data.appointmentId,
              businessId
            )
          } else {
            // Run slot optimization
            result = await appointmentRecoveryAgent.optimizeSlots(businessId)
          }
          break

        case 'revenue-intelligence':
          if (triggeredBy === AgentEvent.PAYMENT_RECEIVED && data) {
            result = await revenueIntelligenceAgent.trackPayment(businessId, data)
          } else {
            // Run full analysis
            result = await revenueIntelligenceAgent.analyzeRevenue(businessId)
          }
          break

        case 'customer-memory':
          if (data?.callId && data?.callerPhone) {
            const memResult = await customerMemoryAgent.injectCustomerContext(
              data.callId,
              businessId,
              data.callerPhone,
              data.employeeName || 'Assistant'
            )
            result = {
              success: memResult !== null,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: Date.now() - context.startTime.getTime(),
              output: memResult,
            }
          } else {
            result = {
              success: false,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: 0,
              error: 'Missing callId or callerPhone',
            }
          }
          break

        case 'routing':
          if (data?.callerPhone) {
            const routeResult = await routingAgent.routeCall(businessId, data.callerPhone, data.context)
            result = {
              success: routeResult !== null,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: Date.now() - context.startTime.getTime(),
              output: routeResult,
            }
          } else {
            result = {
              success: false,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: 0,
              error: 'Missing callerPhone',
            }
          }
          break

        case 'setup':
          if (data?.action === 'start') {
            const state = await setupAgent.startSession(businessId)
            result = {
              success: true,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: Date.now() - context.startTime.getTime(),
              output: state,
            }
          } else if (data?.sessionId && data?.message) {
            const state = await setupAgent.chat(data.sessionId, data.message)
            result = {
              success: true,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: Date.now() - context.startTime.getTime(),
              output: state,
            }
          } else {
            result = {
              success: false,
              executionId: this.generateExecutionId(),
              agentId,
              businessId,
              duration: 0,
              error: 'Invalid setup action — use { action: "start" } or { sessionId, message }',
            }
          }
          break

        case 'billing': {
          const [alertsResult, anomalyResult] = await Promise.all([
            BillingAgent.processBillingAlerts(),
            BillingAgent.detectAnomalies(),
          ])
          const hasAnomalies = anomalyResult.flagged > 0
          result = {
            success: true,
            executionId: this.generateExecutionId(),
            agentId,
            businessId,
            duration: Date.now() - context.startTime.getTime(),
            output: { alerts: alertsResult, anomalies: anomalyResult },
            insights: hasAnomalies ? [{
              type: 'anomaly' as const,
              title: `${anomalyResult.flagged} usage anomaly(s) detected`,
              description: `Potential fraud or unusual usage patterns flagged for ${anomalyResult.flagged} business(es).`,
              confidence: 0.9,
              impact: 'high' as const,
            }] : [],
            alerts: hasAnomalies ? [{
              severity: 'critical' as const,
              title: 'Usage Anomaly Detected',
              message: `${anomalyResult.flagged} business(es) showing abnormal credit consumption.`,
              category: 'billing',
              timestamp: new Date(),
            }] : [],
          }
          break
        }

        default:
          result = {
            success: false,
            executionId: this.generateExecutionId(),
            agentId,
            businessId,
            duration: 0,
            error: 'Agent executor not implemented',
          }
      }

      // Update agent stats
      agent.status = result.success ? 'completed' : 'failed'
      agent.lastExecution = new Date()
      agent.executionCount++
      if (!result.success) {
        agent.errorCount++
      }

      // Log execution
      await this.logExecution(agent.config.id, businessId, result)

      // Maya decides what chains next (only for top-level executions, not chained ones)
      if (result.success && !data?._chainedFrom) {
        const chains = await mayaPrime.decide(agentId, result, businessId)
        for (const chain of chains) {
          // Fire chained agents async — don't block the current result
          this.executeAgent(chain.targetAgentId, businessId, 'manual', {
            ...chain.data,
            _chainedFrom: agentId,
            _chainPriority: chain.priority,
          }).catch((err) =>
            console.error(`[AgentRegistry] Chain execution failed (${agentId} → ${chain.targetAgentId}):`, err)
          )
        }
      }

      return result
    } catch (error) {
      agent.status = 'failed'
      agent.errorCount++

      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Agent execution failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.HIGH,
        { agentId, businessId }
      )

      return {
        success: false,
        executionId: this.generateExecutionId(),
        agentId,
        businessId,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Process a VAPI webhook call
   * This is the main integration point with the existing VAPI webhook
   */
  async processVAPICall(
    businessId: string,
    callData: VAPICallData
  ): Promise<AgentResult | null> {
    // Emit CALL_ENDED event which will trigger the call intelligence agent
    const results = await this.emitEvent(AgentEvent.CALL_ENDED, businessId, callData)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Get agent status summary
   */
  getStatusSummary(): {
    total: number
    enabled: number
    running: number
    failed: number
    executionsToday: number
    errorRate: number
  } {
    const agents = Array.from(this.agents.values())
    const totalExecutions = agents.reduce((sum, a) => sum + a.executionCount, 0)
    const totalErrors = agents.reduce((sum, a) => sum + a.errorCount, 0)

    return {
      total: agents.length,
      enabled: agents.filter((a) => a.config.enabled).length,
      running: agents.filter((a) => a.status === 'running').length,
      failed: agents.filter((a) => a.status === 'failed').length,
      executionsToday: totalExecutions, // Would need time filtering
      errorRate: totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0,
    }
  }

  /**
   * Get agent health status
   */
  async getHealthStatus(businessId: string): Promise<{
    healthy: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    const agents = this.getAllAgents()

    // Check for disabled agents
    const disabledAgents = agents.filter((a) => !a.config.enabled)
    if (disabledAgents.length > 0) {
      issues.push(`${disabledAgents.length} agent(s) are disabled`)
      recommendations.push('Review and enable agents to maximize automation')
    }

    // Check for high error rates
    for (const agent of agents) {
      if (agent.executionCount > 10 && agent.errorCount / agent.executionCount > 0.2) {
        issues.push(`${agent.config.name} has high error rate (${Math.round((agent.errorCount / agent.executionCount) * 100)}%)`)
        recommendations.push(`Review ${agent.config.name} configuration and logs`)
      }
    }

    // Check Maya Prime status
    const orchestratorState = mayaPrime.getState()
    if (!orchestratorState.isRunning) {
      issues.push('Maya Prime orchestrator is not running')
      recommendations.push('Initialize Maya Prime for business operations monitoring')
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    }
  }

  /**
   * Log agent execution to database
   */
  private async logExecution(
    agentId: string,
    businessId: string,
    result: AgentResult
  ): Promise<void> {
    try {
      await supabase.from('agent_executions').insert({
        id: result.executionId,
        agent_id: agentId,
        business_id: businessId,
        status: result.success ? 'completed' : 'failed',
        duration_ms: result.duration,
        insights_count: result.insights?.length || 0,
        actions_count: result.actions?.length || 0,
        alerts_count: result.alerts?.length || 0,
        error: result.error || null,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Ignore logging errors
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Initialize agents for a business
   */
  async initializeForBusiness(businessId: string): Promise<boolean> {
    // Initialize Maya Prime
    const success = await mayaPrime.initialize(businessId)

    if (success) {
      // Calculate initial health
      await mayaPrime.calculateBusinessHealth(businessId)
    }

    return success
  }

  /**
   * Generate daily summary for a business
   */
  async generateDailySummary(businessId: string) {
    return mayaPrime.generateDailySummary(businessId)
  }
}

// Export singleton
export const agentRegistry = AgentRegistry.getInstance()
export default AgentRegistry
