/**
 * Automation Rules Engine
 *
 * Evaluates user-defined IF/THEN rules when events fire.
 * Replaces Zapier for 80% of use cases with zero external dependencies.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// TYPES
// ============================================

export interface AutomationRule {
  id: string
  businessId: string
  name: string
  description?: string
  triggerEvent: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  isActive: boolean
  isTemplate: boolean
  templateId?: string
  executionCount: number
  lastExecutedAt?: string
  createdAt: string
  updatedAt: string
}

export interface RuleCondition {
  field: string        // dot-notation path into event data, e.g. "order.total"
  operator: ConditionOperator
  value: any           // the comparison value
}

export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'exists' | 'not_exists'
  | 'in' | 'not_in'

export interface RuleAction {
  type: string         // send_sms, send_email, send_webhook, sync_crm, sync_pos, escalate
  config: Record<string, any>
}

export interface RuleExecutionLog {
  ruleId: string
  ruleName: string
  triggerEvent: string
  conditionsMet: boolean
  actionsExecuted: number
  actionsFailed: number
  eventData: Record<string, any>
  error?: string
  executedAt: string
}

// Supported trigger events
export const TRIGGER_EVENTS = [
  { id: 'call_completed', label: 'Call Completed', category: 'calls' },
  { id: 'call_missed', label: 'Call Missed / Short Call', category: 'calls' },
  { id: 'order_confirmed', label: 'Order Confirmed', category: 'orders' },
  { id: 'appointment_booked', label: 'Appointment Booked', category: 'appointments' },
  { id: 'appointment_cancelled', label: 'Appointment Cancelled', category: 'appointments' },
  { id: 'message_received', label: 'Message Taken', category: 'messages' },
  { id: 'payment_processed', label: 'Payment Processed', category: 'payments' },
  { id: 'new_customer', label: 'New Customer Detected', category: 'customers' },
] as const

// Available condition fields per event
export const EVENT_FIELDS: Record<string, { field: string; label: string; type: 'number' | 'string' | 'boolean' }[]> = {
  call_completed: [
    { field: 'duration', label: 'Call Duration (seconds)', type: 'number' },
    { field: 'summary', label: 'Call Summary', type: 'string' },
    { field: 'callerPhone', label: 'Caller Phone', type: 'string' },
    { field: 'employeeName', label: 'Employee Name', type: 'string' },
  ],
  call_missed: [
    { field: 'duration', label: 'Call Duration (seconds)', type: 'number' },
    { field: 'callerPhone', label: 'Caller Phone', type: 'string' },
  ],
  order_confirmed: [
    { field: 'total', label: 'Order Total ($)', type: 'number' },
    { field: 'itemCount', label: 'Number of Items', type: 'number' },
    { field: 'paymentMethod', label: 'Payment Method', type: 'string' },
    { field: 'customerPhone', label: 'Customer Phone', type: 'string' },
  ],
  appointment_booked: [
    { field: 'customerName', label: 'Customer Name', type: 'string' },
    { field: 'customerPhone', label: 'Customer Phone', type: 'string' },
    { field: 'service', label: 'Service', type: 'string' },
    { field: 'date', label: 'Appointment Date', type: 'string' },
  ],
  appointment_cancelled: [
    { field: 'customerName', label: 'Customer Name', type: 'string' },
    { field: 'reason', label: 'Cancellation Reason', type: 'string' },
  ],
  message_received: [
    { field: 'callerName', label: 'Caller Name', type: 'string' },
    { field: 'callerPhone', label: 'Caller Phone', type: 'string' },
    { field: 'message', label: 'Message Content', type: 'string' },
    { field: 'urgency', label: 'Urgency', type: 'string' },
  ],
  payment_processed: [
    { field: 'amount', label: 'Amount ($)', type: 'number' },
    { field: 'status', label: 'Payment Status', type: 'string' },
  ],
  new_customer: [
    { field: 'phone', label: 'Customer Phone', type: 'string' },
    { field: 'name', label: 'Customer Name', type: 'string' },
    { field: 'source', label: 'Source', type: 'string' },
  ],
}

// Available action types
export const ACTION_TYPES = [
  { id: 'send_sms', label: 'Send SMS', icon: 'chat' },
  { id: 'send_email', label: 'Send Email', icon: 'envelope' },
  { id: 'send_webhook', label: 'Fire Webhook', icon: 'globe' },
  { id: 'sync_hubspot', label: 'Sync to HubSpot', icon: 'link' },
  { id: 'sync_square', label: 'Push to Square POS', icon: 'shopping-cart' },
  { id: 'escalate', label: 'Escalate to Owner', icon: 'exclamation' },
] as const

// ============================================
// AUTOMATION ENGINE
// ============================================

export class AutomationEngine {
  private static instance: AutomationEngine

  private constructor() {}

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  /**
   * Evaluate all active rules for a given event.
   * Called from the webhook handler after each event fires.
   */
  async evaluateRules(
    businessId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<RuleExecutionLog[]> {
    const logs: RuleExecutionLog[] = []

    try {
      // Fetch active rules for this event type
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('business_id', businessId)
        .eq('trigger_event', eventType)
        .eq('is_active', true)

      if (error || !rules || rules.length === 0) {
        return logs
      }

      // Evaluate each rule
      for (const ruleRow of rules) {
        const rule = this.mapRowToRule(ruleRow)
        const log = await this.evaluateRule(rule, eventData)
        logs.push(log)
      }

      return logs
    } catch (err) {
      console.error('[AutomationEngine] evaluateRules error:', err)
      return logs
    }
  }

  /**
   * Evaluate a single rule against event data
   */
  private async evaluateRule(
    rule: AutomationRule,
    eventData: Record<string, any>
  ): Promise<RuleExecutionLog> {
    const log: RuleExecutionLog = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: rule.triggerEvent,
      conditionsMet: false,
      actionsExecuted: 0,
      actionsFailed: 0,
      eventData,
      executedAt: new Date().toISOString(),
    }

    try {
      // Check all conditions (AND logic)
      const conditionsMet = this.evaluateConditions(rule.conditions, eventData)
      log.conditionsMet = conditionsMet

      if (!conditionsMet) {
        await this.logExecution(rule.businessId, log)
        return log
      }

      // Execute all actions
      for (const action of rule.actions) {
        try {
          await this.executeAction(action, eventData, rule.businessId)
          log.actionsExecuted++
        } catch (err) {
          log.actionsFailed++
          console.error(`[AutomationEngine] Action failed for rule ${rule.name}:`, err)
        }
      }

      // Update rule execution stats
      await supabase
        .from('automation_rules')
        .update({
          execution_count: (rule.executionCount || 0) + 1,
          last_executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rule.id)

      await this.logExecution(rule.businessId, log)
      return log
    } catch (err: any) {
      log.error = err.message
      await this.logExecution(rule.businessId, log)
      return log
    }
  }

  // ============================================
  // CONDITION EVALUATION
  // ============================================

  /**
   * Evaluate all conditions (AND logic - all must pass)
   */
  evaluateConditions(conditions: RuleCondition[], data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true

    return conditions.every(condition => this.evaluateCondition(condition, data))
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, data: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(data, condition.field)
    const compareValue = condition.value

    switch (condition.operator) {
      case 'eq':
        return String(fieldValue).toLowerCase() === String(compareValue).toLowerCase()
      case 'neq':
        return String(fieldValue).toLowerCase() !== String(compareValue).toLowerCase()
      case 'gt':
        return Number(fieldValue) > Number(compareValue)
      case 'gte':
        return Number(fieldValue) >= Number(compareValue)
      case 'lt':
        return Number(fieldValue) < Number(compareValue)
      case 'lte':
        return Number(fieldValue) <= Number(compareValue)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null || fieldValue === ''
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue)
      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue)
      default:
        return false
    }
  }

  /**
   * Get a nested value from an object using dot notation
   * e.g., getNestedValue({ order: { total: 50 } }, "order.total") => 50
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // ============================================
  // ACTION EXECUTION
  // ============================================

  /**
   * Execute a single action, resolving templates in the config
   */
  private async executeAction(
    action: RuleAction,
    eventData: Record<string, any>,
    businessId: string
  ): Promise<void> {
    // Resolve template variables in action config
    const resolvedConfig = this.resolveTemplates(action.config, eventData)

    switch (action.type) {
      case 'send_sms':
        await this.executeSendSMS(resolvedConfig, businessId, eventData)
        break
      case 'send_email':
        await this.executeSendEmail(resolvedConfig, businessId, eventData)
        break
      case 'send_webhook':
        await this.executeSendWebhook(resolvedConfig, businessId, eventData)
        break
      case 'sync_hubspot':
        await this.executeSyncHubSpot(resolvedConfig, businessId, eventData)
        break
      case 'sync_square':
        await this.executeSyncSquare(resolvedConfig, businessId, eventData)
        break
      case 'escalate':
        await this.executeEscalate(resolvedConfig, businessId, eventData)
        break
      default:
        console.warn(`[AutomationEngine] Unknown action type: ${action.type}`)
    }
  }

  /**
   * Resolve {{variable}} templates in action config
   */
  resolveTemplates(config: Record<string, any>, data: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        resolved[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
          const val = this.getNestedValue(data, path.trim())
          return val !== undefined ? String(val) : `{{${path.trim()}}}`
        })
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveTemplates(value, data)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  // --- Action executors ---

  private async executeSendSMS(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    const to = config.to === 'owner' ? await this.getOwnerPhone(businessId) :
               config.to === 'customer' ? (eventData.customerPhone || eventData.callerPhone) :
               config.to

    if (!to) return

    await supabase.from('action_requests').insert({
      business_id: businessId,
      employee_id: 'automation-engine',
      action_type: 'send_sms',
      target: { phone: to },
      content: { message: config.message || '' },
      status: 'pending',
      triggered_by: 'agent',
      created_at: new Date().toISOString(),
    })
  }

  private async executeSendEmail(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    const to = config.to === 'owner' ? await this.getOwnerEmail(businessId) :
               config.to === 'customer' ? eventData.customerEmail :
               config.to

    if (!to) return

    await supabase.from('action_requests').insert({
      business_id: businessId,
      employee_id: 'automation-engine',
      action_type: 'send_email',
      target: { email: to },
      content: {
        message: config.message || '',
        subject: config.subject || 'VoiceFly Notification',
      },
      status: 'pending',
      triggered_by: 'agent',
      created_at: new Date().toISOString(),
    })
  }

  private async executeSendWebhook(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    if (!config.url) return

    await supabase.from('action_requests').insert({
      business_id: businessId,
      employee_id: 'automation-engine',
      action_type: 'send_webhook',
      target: { webhookUrl: config.url },
      content: {
        message: JSON.stringify(eventData),
        data: { headers: config.headers, method: config.method || 'POST' },
      },
      status: 'pending',
      triggered_by: 'agent',
      created_at: new Date().toISOString(),
    })
  }

  private async executeSyncHubSpot(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    // Queue HubSpot sync as an action request
    await supabase.from('action_requests').insert({
      business_id: businessId,
      employee_id: 'automation-engine',
      action_type: 'update_crm',
      target: {},
      content: {
        message: 'HubSpot sync from automation rule',
        data: {
          provider: 'hubspot',
          syncType: config.syncType || 'contact',
          ...eventData,
        },
      },
      status: 'pending',
      triggered_by: 'agent',
      created_at: new Date().toISOString(),
    })
  }

  private async executeSyncSquare(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    await supabase.from('action_requests').insert({
      business_id: businessId,
      employee_id: 'automation-engine',
      action_type: 'update_crm',
      target: {},
      content: {
        message: 'Square POS sync from automation rule',
        data: {
          provider: 'square',
          ...eventData,
        },
      },
      status: 'pending',
      triggered_by: 'agent',
      created_at: new Date().toISOString(),
    })
  }

  private async executeEscalate(config: Record<string, any>, businessId: string, eventData: Record<string, any>) {
    // Escalate = SMS + email to owner
    const ownerPhone = await this.getOwnerPhone(businessId)
    const ownerEmail = await this.getOwnerEmail(businessId)

    const message = config.message || `Escalation: ${JSON.stringify(eventData).slice(0, 200)}`

    if (ownerPhone) {
      await supabase.from('action_requests').insert({
        business_id: businessId,
        employee_id: 'automation-engine',
        action_type: 'send_sms',
        target: { phone: ownerPhone },
        content: { message },
        status: 'pending',
        triggered_by: 'agent',
        created_at: new Date().toISOString(),
      })
    }

    if (ownerEmail) {
      await supabase.from('action_requests').insert({
        business_id: businessId,
        employee_id: 'automation-engine',
        action_type: 'send_email',
        target: { email: ownerEmail },
        content: {
          message,
          subject: config.subject || 'VoiceFly: Escalation Alert',
        },
        status: 'pending',
        triggered_by: 'agent',
        created_at: new Date().toISOString(),
      })
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getOwnerPhone(businessId: string): Promise<string | null> {
    const { data } = await supabase
      .from('businesses')
      .select('phone_number')
      .eq('id', businessId)
      .single()
    return data?.phone_number || null
  }

  private async getOwnerEmail(businessId: string): Promise<string | null> {
    const { data } = await supabase
      .from('business_users')
      .select('user_id')
      .eq('business_id', businessId)
      .eq('role', 'owner')
      .single()

    if (!data?.user_id) return null

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', data.user_id)
      .single()

    return user?.email || null
  }

  private async logExecution(businessId: string, log: RuleExecutionLog): Promise<void> {
    try {
      await supabase.from('automation_rule_logs').insert({
        business_id: businessId,
        rule_id: log.ruleId,
        rule_name: log.ruleName,
        trigger_event: log.triggerEvent,
        conditions_met: log.conditionsMet,
        actions_executed: log.actionsExecuted,
        actions_failed: log.actionsFailed,
        event_data: log.eventData,
        error: log.error,
        executed_at: log.executedAt,
      })
    } catch (err) {
      // Don't fail the rule because of a logging error
    }
  }

  private mapRowToRule(row: any): AutomationRule {
    return {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      triggerEvent: row.trigger_event,
      conditions: row.conditions || [],
      actions: row.actions || [],
      isActive: row.is_active,
      isTemplate: row.is_template || false,
      templateId: row.template_id,
      executionCount: row.execution_count || 0,
      lastExecutedAt: row.last_executed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

// Export singleton
export const automationEngine = AutomationEngine.getInstance()
