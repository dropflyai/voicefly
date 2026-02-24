/**
 * Routing & Escalation Agent
 *
 * Determines which phone employee should handle an inbound call based on:
 * - Caller's history (returning customer? what did they call about?)
 * - Business's employee roster (which employees are available?)
 * - Time of day (some employees may have limited hours)
 * - Call context (if available from IVR or caller ID)
 *
 * Uses Anthropic Haiku for fast classification (< 1s).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface RoutingDecision {
  employeeId: string
  employeeName: string
  confidence: number      // 0-1
  reason: string
  fallbackEmployeeId?: string
}

export interface EmployeeInfo {
  id: string
  name: string
  jobType: string
  status: string
  capabilities: string[]
  businessHours?: string
}

export class RoutingAgent {
  private static instance: RoutingAgent
  private anthropic: Anthropic | null = null

  private constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
  }

  static getInstance(): RoutingAgent {
    if (!RoutingAgent.instance) {
      RoutingAgent.instance = new RoutingAgent()
    }
    return RoutingAgent.instance
  }

  /**
   * Route an inbound call to the best employee.
   * Returns null if there's only one active employee (no routing needed).
   */
  async routeCall(
    businessId: string,
    callerPhone: string,
    context?: { utterance?: string; ivr_selection?: string }
  ): Promise<RoutingDecision | null> {
    try {
      // Get active employees for this business
      const { data: employees } = await supabase
        .from('phone_employees')
        .select('id, name, job_type, status, capabilities, business_hours')
        .eq('business_id', businessId)
        .eq('status', 'active')

      // If 0 or 1 employees, no routing needed
      if (!employees || employees.length <= 1) {
        return null
      }

      const employeeInfos: EmployeeInfo[] = employees.map(e => ({
        id: e.id,
        name: e.name,
        jobType: e.job_type,
        status: e.status,
        capabilities: e.capabilities || [],
        businessHours: e.business_hours,
      }))

      // Get caller history (fast query)
      const { data: recentCalls } = await supabase
        .from('employee_calls')
        .select('employee_id, summary, created_at')
        .eq('business_id', businessId)
        .eq('customer_phone', callerPhone)
        .order('created_at', { ascending: false })
        .limit(3)

      // Get any pending orders for this caller
      const { data: pendingOrders } = await supabase
        .from('phone_orders')
        .select('id, status')
        .eq('business_id', businessId)
        .eq('customer_phone', callerPhone)
        .in('status', ['in_progress', 'confirmed', 'preparing'])
        .limit(1)

      // Try AI routing first, fall back to rule-based
      if (this.anthropic && employeeInfos.length > 2) {
        return this.aiRoute(employeeInfos, recentCalls || [], pendingOrders || [], callerPhone, context)
      }

      return this.ruleBasedRoute(employeeInfos, recentCalls || [], pendingOrders || [], context)
    } catch (err) {
      console.error('[RoutingAgent] Error:', err)
      return null
    }
  }

  /**
   * AI-powered routing using Haiku for fast classification
   */
  private async aiRoute(
    employees: EmployeeInfo[],
    recentCalls: any[],
    pendingOrders: any[],
    callerPhone: string,
    context?: { utterance?: string; ivr_selection?: string }
  ): Promise<RoutingDecision> {
    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Route this inbound call to the best employee. Return ONLY JSON.

EMPLOYEES:
${employees.map(e => `- ${e.id}: ${e.name} (${e.jobType}) - capabilities: ${e.capabilities.join(', ') || 'general'}`).join('\n')}

CALLER CONTEXT:
- Phone: ${callerPhone}
- Recent calls: ${recentCalls.length > 0 ? recentCalls.map(c => `${c.summary || 'no summary'} (employee: ${c.employee_id})`).join('; ') : 'New caller'}
- Pending orders: ${pendingOrders.length > 0 ? 'Yes' : 'No'}
${context?.utterance ? `- Said: "${context.utterance}"` : ''}
${context?.ivr_selection ? `- IVR selection: ${context.ivr_selection}` : ''}

RULES:
- If caller has pending order, route to order_taker
- If caller previously spoke with a specific employee, prefer that employee
- If new caller, route based on likely intent from business type
- If unclear, route to receptionist

Return: {"employeeId": "id", "confidence": 0.0-1.0, "reason": "brief reason"}`,
        }],
      })

      const text = response.content[0]
      if (text.type === 'text') {
        const jsonMatch = text.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          const employee = employees.find(e => e.id === result.employeeId) || employees[0]
          const fallback = employees.find(e => e.id !== employee.id)

          return {
            employeeId: employee.id,
            employeeName: employee.name,
            confidence: result.confidence || 0.7,
            reason: result.reason || 'AI routing',
            fallbackEmployeeId: fallback?.id,
          }
        }
      }
    } catch (err) {
      console.error('[RoutingAgent] AI routing failed, using rules:', err)
    }

    // Fallback to rules
    return this.ruleBasedRoute(employees, recentCalls, pendingOrders, context)
  }

  /**
   * Rule-based routing (fast, no API call)
   */
  private ruleBasedRoute(
    employees: EmployeeInfo[],
    recentCalls: any[],
    pendingOrders: any[],
    context?: { utterance?: string; ivr_selection?: string }
  ): RoutingDecision {
    // Rule 1: If pending order exists, route to order_taker
    if (pendingOrders.length > 0) {
      const orderTaker = employees.find(e => e.jobType === 'order_taker')
      if (orderTaker) {
        return {
          employeeId: orderTaker.id,
          employeeName: orderTaker.name,
          confidence: 0.9,
          reason: 'Caller has a pending order',
          fallbackEmployeeId: employees.find(e => e.id !== orderTaker.id)?.id,
        }
      }
    }

    // Rule 2: If returning caller, route to previous employee
    if (recentCalls.length > 0) {
      const lastEmployeeId = recentCalls[0].employee_id
      const lastEmployee = employees.find(e => e.id === lastEmployeeId)
      if (lastEmployee) {
        return {
          employeeId: lastEmployee.id,
          employeeName: lastEmployee.name,
          confidence: 0.8,
          reason: 'Returning caller routed to previous employee',
          fallbackEmployeeId: employees.find(e => e.id !== lastEmployee.id)?.id,
        }
      }
    }

    // Rule 3: IVR selection
    if (context?.ivr_selection) {
      const selection = context.ivr_selection.toLowerCase()
      if (selection.includes('order') || selection.includes('food')) {
        const orderTaker = employees.find(e => e.jobType === 'order_taker')
        if (orderTaker) {
          return {
            employeeId: orderTaker.id,
            employeeName: orderTaker.name,
            confidence: 0.85,
            reason: 'IVR selection: ordering',
            fallbackEmployeeId: employees.find(e => e.id !== orderTaker.id)?.id,
          }
        }
      }
      if (selection.includes('appointment') || selection.includes('book') || selection.includes('schedule')) {
        const receptionist = employees.find(e => e.jobType === 'receptionist')
        if (receptionist) {
          return {
            employeeId: receptionist.id,
            employeeName: receptionist.name,
            confidence: 0.85,
            reason: 'IVR selection: appointment',
            fallbackEmployeeId: employees.find(e => e.id !== receptionist.id)?.id,
          }
        }
      }
    }

    // Rule 4: Default to receptionist, then first available
    const receptionist = employees.find(e => e.jobType === 'receptionist')
    const defaultEmployee = receptionist || employees[0]

    return {
      employeeId: defaultEmployee.id,
      employeeName: defaultEmployee.name,
      confidence: 0.6,
      reason: 'Default routing to receptionist',
      fallbackEmployeeId: employees.find(e => e.id !== defaultEmployee.id)?.id,
    }
  }

  /**
   * Handle mid-call escalation - when current employee can't handle the request
   */
  async escalate(
    businessId: string,
    currentEmployeeId: string,
    reason: string,
    callerPhone: string
  ): Promise<RoutingDecision | null> {
    try {
      const { data: employees } = await supabase
        .from('phone_employees')
        .select('id, name, job_type, status, capabilities')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .neq('id', currentEmployeeId)

      if (!employees || employees.length === 0) {
        return null // No other employees to escalate to
      }

      const employeeInfos: EmployeeInfo[] = employees.map(e => ({
        id: e.id,
        name: e.name,
        jobType: e.job_type,
        status: e.status,
        capabilities: e.capabilities || [],
      }))

      // Simple escalation logic based on reason
      const reasonLower = reason.toLowerCase()

      if (reasonLower.includes('order') || reasonLower.includes('menu') || reasonLower.includes('food')) {
        const orderTaker = employeeInfos.find(e => e.jobType === 'order_taker')
        if (orderTaker) {
          return {
            employeeId: orderTaker.id,
            employeeName: orderTaker.name,
            confidence: 0.85,
            reason: `Escalated: ${reason}`,
          }
        }
      }

      if (reasonLower.includes('appointment') || reasonLower.includes('schedule') || reasonLower.includes('book')) {
        const receptionist = employeeInfos.find(e => e.jobType === 'receptionist')
        if (receptionist) {
          return {
            employeeId: receptionist.id,
            employeeName: receptionist.name,
            confidence: 0.85,
            reason: `Escalated: ${reason}`,
          }
        }
      }

      // Default: route to first available different employee
      return {
        employeeId: employeeInfos[0].id,
        employeeName: employeeInfos[0].name,
        confidence: 0.5,
        reason: `Escalated from current employee: ${reason}`,
      }
    } catch (err) {
      console.error('[RoutingAgent] Escalation error:', err)
      return null
    }
  }
}

// Export singleton
export const routingAgent = RoutingAgent.getInstance()
