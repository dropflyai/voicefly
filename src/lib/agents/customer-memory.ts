/**
 * Customer Memory Agent
 *
 * Looks up caller history at the start of every inbound call and injects
 * a context brief into the VAPI assistant's system prompt so the phone
 * employee knows who they're talking to.
 *
 * Uses Anthropic Messages API (Haiku) for fast, cheap context generation.
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const VAPI_API_KEY = process.env.VAPI_API_KEY

interface CustomerContext {
  brief: string
  isReturning: boolean
  totalCalls: number
  lastCallDate?: string
  recentOrders: number
  upcomingAppointments: number
}

export class CustomerMemoryAgent {
  private static instance: CustomerMemoryAgent
  private anthropic: Anthropic | null = null

  private constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
  }

  static getInstance(): CustomerMemoryAgent {
    if (!CustomerMemoryAgent.instance) {
      CustomerMemoryAgent.instance = new CustomerMemoryAgent()
    }
    return CustomerMemoryAgent.instance
  }

  /**
   * Look up customer history and inject context into the active VAPI call.
   * Designed to run fast (< 2s) at the start of every inbound call.
   */
  async injectCustomerContext(
    callId: string,
    businessId: string,
    callerPhone: string,
    employeeName: string
  ): Promise<CustomerContext | null> {
    try {
      // Run all queries in parallel for speed
      const [callHistory, orders, appointments, messages] = await Promise.all([
        this.getCallHistory(businessId, callerPhone),
        this.getOrderHistory(businessId, callerPhone),
        this.getAppointments(businessId, callerPhone),
        this.getRecentMessages(businessId, callerPhone),
      ])

      const totalCalls = callHistory.length
      const isReturning = totalCalls > 0

      // If no history at all, skip injection
      if (!isReturning && orders.length === 0 && appointments.length === 0) {
        return {
          brief: '',
          isReturning: false,
          totalCalls: 0,
          recentOrders: 0,
          upcomingAppointments: 0,
        }
      }

      // Generate context brief
      const brief = await this.generateBrief({
        callerPhone,
        employeeName,
        callHistory,
        orders,
        appointments,
        messages,
      })

      // Inject into VAPI call
      if (brief && callId) {
        await this.patchVAPICall(callId, brief)
      }

      return {
        brief,
        isReturning,
        totalCalls,
        lastCallDate: callHistory[0]?.created_at,
        recentOrders: orders.length,
        upcomingAppointments: appointments.filter(a => a.status !== 'cancelled').length,
      }
    } catch (err) {
      console.error('[CustomerMemory] Error:', err)
      return null
    }
  }

  // ============================================
  // DATA QUERIES
  // ============================================

  private async getCallHistory(businessId: string, phone: string) {
    const { data } = await supabase
      .from('employee_calls')
      .select('call_id, status, duration, summary, customer_phone, created_at')
      .eq('business_id', businessId)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(5)

    return data || []
  }

  private async getOrderHistory(businessId: string, phone: string) {
    const { data } = await supabase
      .from('phone_orders')
      .select('id, status, total, items, created_at')
      .eq('business_id', businessId)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(5)

    return data || []
  }

  private async getAppointments(businessId: string, phone: string) {
    const { data } = await supabase
      .from('appointments')
      .select('id, service_name, appointment_date, appointment_time, status, created_at')
      .eq('business_id', businessId)
      .eq('customer_phone', phone)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .limit(3)

    return data || []
  }

  private async getRecentMessages(businessId: string, phone: string) {
    const { data } = await supabase
      .from('phone_messages')
      .select('message, caller_name, urgency, created_at')
      .eq('business_id', businessId)
      .eq('caller_phone', phone)
      .order('created_at', { ascending: false })
      .limit(3)

    return data || []
  }

  // ============================================
  // BRIEF GENERATION
  // ============================================

  private async generateBrief(data: {
    callerPhone: string
    employeeName: string
    callHistory: any[]
    orders: any[]
    appointments: any[]
    messages: any[]
  }): Promise<string> {
    // If Anthropic is not configured, use a simple template fallback
    if (!this.anthropic) {
      return this.generateTemplateBrief(data)
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are generating a brief caller context note for a phone employee named ${data.employeeName}. Based on this customer data, write 2-3 short sentences the employee should know BEFORE speaking. Be concise and actionable. Use the customer's name if known.

Customer phone: ${data.callerPhone}

Past calls (${data.callHistory.length} total):
${data.callHistory.slice(0, 3).map(c => `- ${c.created_at?.split('T')[0]}: ${c.summary || 'No summary'} (${c.duration || 0}s)`).join('\n') || 'None'}

Recent orders (${data.orders.length} total):
${data.orders.slice(0, 3).map(o => `- ${o.created_at?.split('T')[0]}: $${o.total || 0} - ${o.status}`).join('\n') || 'None'}

Upcoming appointments:
${data.appointments.map(a => `- ${a.appointment_date} at ${a.appointment_time}: ${a.service_name || 'Service'} (${a.status})`).join('\n') || 'None'}

Recent messages:
${data.messages.slice(0, 2).map(m => `- From ${m.caller_name || 'Unknown'}: "${m.message}" (${m.urgency} urgency)`).join('\n') || 'None'}

Write ONLY the brief (2-3 sentences). No labels, no formatting.`,
        }],
      })

      const text = response.content[0]
      if (text.type === 'text') {
        return text.text.trim()
      }
      return this.generateTemplateBrief(data)
    } catch (err) {
      console.error('[CustomerMemory] Anthropic API error, using template fallback:', err)
      return this.generateTemplateBrief(data)
    }
  }

  /**
   * Fallback brief when Anthropic API is not available
   */
  private generateTemplateBrief(data: {
    callerPhone: string
    callHistory: any[]
    orders: any[]
    appointments: any[]
    messages: any[]
  }): string {
    const parts: string[] = []
    const name = data.messages[0]?.caller_name || data.callHistory[0]?.customer_name

    if (data.callHistory.length > 0) {
      parts.push(`Returning caller${name ? ` (${name})` : ''} with ${data.callHistory.length} previous call${data.callHistory.length > 1 ? 's' : ''}.`)
    }

    if (data.orders.length > 0) {
      const recent = data.orders[0]
      parts.push(`Last order: $${recent.total || 0} (${recent.status}) on ${recent.created_at?.split('T')[0]}.`)
    }

    if (data.appointments.length > 0) {
      const next = data.appointments[0]
      parts.push(`Upcoming: ${next.service_name || 'Appointment'} on ${next.appointment_date} at ${next.appointment_time}.`)
    }

    return parts.join(' ')
  }

  // ============================================
  // PUBLIC BRIEF (for SMS AI responses)
  // ============================================

  /**
   * Get a customer context brief without injecting into VAPI.
   * Used by the SMS AI responder to build system prompt context.
   */
  async getCustomerBrief(
    businessId: string,
    callerPhone: string,
    employeeName: string
  ): Promise<string> {
    try {
      const [callHistory, orders, appointments, messages] = await Promise.all([
        this.getCallHistory(businessId, callerPhone),
        this.getOrderHistory(businessId, callerPhone),
        this.getAppointments(businessId, callerPhone),
        this.getRecentMessages(businessId, callerPhone),
      ])

      if (callHistory.length === 0 && orders.length === 0 && appointments.length === 0) {
        return ''
      }

      return this.generateBrief({
        callerPhone,
        employeeName,
        callHistory,
        orders,
        appointments,
        messages,
      })
    } catch (err) {
      console.error('[CustomerMemory] getCustomerBrief error:', err)
      return ''
    }
  }

  // ============================================
  // VAPI INJECTION
  // ============================================

  /**
   * Patch the VAPI call to inject customer context into the system prompt
   */
  private async patchVAPICall(callId: string, brief: string): Promise<void> {
    if (!VAPI_API_KEY) {
      console.warn('[CustomerMemory] VAPI_API_KEY not configured, skipping injection')
      return
    }

    try {
      const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantOverrides: {
            model: {
              messages: [{
                role: 'system',
                content: `\n\n--- CALLER CONTEXT (from customer memory) ---\n${brief}\n--- END CALLER CONTEXT ---\n\nUse this context naturally in your conversation. If the customer is returning, acknowledge them warmly. Reference their history when relevant but don't recite it.`,
              }],
            },
          },
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('[CustomerMemory] VAPI patch failed:', err)
      }
    } catch (err) {
      console.error('[CustomerMemory] VAPI patch error:', err)
    }
  }
}

// Export singleton
export const customerMemoryAgent = CustomerMemoryAgent.getInstance()
