/**
 * Action Executor Agent
 *
 * The bridge between AI insights and real-world actions.
 * Handles: SMS, Email, Outbound Calls, Webhooks, CRM updates
 */

import { createClient } from '@supabase/supabase-js'
import { ActionRequest } from './types'
// Credit system removed — feature is included

// ============================================
// CONFIGURATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Twilio config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

// SendGrid config
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@voicefly.app'

// VAPI config
const VAPI_API_KEY = process.env.VAPI_API_KEY

// ============================================
// ACTION EXECUTOR CLASS
// ============================================

export class ActionExecutor {
  private static instance: ActionExecutor

  private constructor() {}

  static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor()
    }
    return ActionExecutor.instance
  }

  // ============================================
  // MAIN EXECUTION METHOD
  // ============================================

  async execute(action: ActionRequest): Promise<{
    success: boolean
    result?: any
    error?: string
  }> {
    console.log(`[ActionExecutor] Executing action: ${action.actionType}`, {
      actionId: action.id,
      businessId: action.businessId,
    })

    try {
      // Update status to in_progress
      await this.updateActionStatus(action.id, 'in_progress')

      let result: any

      switch (action.actionType) {
        case 'send_sms':
          result = await this.sendSMS(action)
          break

        case 'send_email':
          result = await this.sendEmail(action)
          break

        case 'make_call':
          result = await this.makeOutboundCall(action)
          break

        case 'schedule_callback':
          result = await this.scheduleCallback(action)
          break

        case 'create_appointment':
          result = await this.createAppointment(action)
          break

        case 'update_crm':
          result = await this.updateCRM(action)
          break

        case 'send_webhook':
          result = await this.sendWebhook(action)
          break

        case 'escalate':
          result = await this.escalateToHuman(action)
          break

        default:
          throw new Error(`Unknown action type: ${action.actionType}`)
      }

      // Update status to completed
      await this.updateActionStatus(action.id, 'completed', {
        success: true,
        response: result,
      })

      console.log(`[ActionExecutor] Action completed: ${action.actionType}`)
      return { success: true, result }

    } catch (error: any) {
      console.error(`[ActionExecutor] Action failed: ${action.actionType}`, error)

      // Update status to failed
      await this.updateActionStatus(action.id, 'failed', {
        success: false,
        error: error.message,
      })

      return { success: false, error: error.message }
    }
  }

  // ============================================
  // SMS SENDING
  // ============================================

  async sendSMS(action: ActionRequest): Promise<any> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio not configured')
    }

    const toPhone = action.target.phone
    if (!toPhone) {
      throw new Error('No phone number provided')
    }

    const message = action.content.message
    if (!message) {
      throw new Error('No message content provided')
    }

    // Get business phone number or use default
    const fromPhone = await this.getBusinessPhoneNumber(action.businessId) || TWILIO_PHONE_NUMBER

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toPhone,
        From: fromPhone!,
        Body: message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Twilio error: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()

    // Log the SMS
    await this.logCommunication(action.businessId, {
      type: 'sms',
      direction: 'outbound',
      toPhone,
      fromPhone: fromPhone!,
      content: message,
      externalId: result.sid,
      status: 'sent',
    })

    return {
      messageSid: result.sid,
      status: result.status,
      to: result.to,
    }
  }

  // ============================================
  // EMAIL SENDING
  // ============================================

  async sendEmail(action: ActionRequest): Promise<any> {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid not configured')
    }

    const toEmail = action.target.email
    if (!toEmail) {
      throw new Error('No email address provided')
    }

    const subject = action.content.subject || 'Message from ' + (await this.getBusinessName(action.businessId))
    const message = action.content.message
    if (!message) {
      throw new Error('No message content provided')
    }

    // Get business email or use default
    const fromEmail = await this.getBusinessEmail(action.businessId) || SENDGRID_FROM_EMAIL

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail },
        subject: subject,
        content: [
          { type: 'text/plain', value: message },
          { type: 'text/html', value: message.replace(/\n/g, '<br>') },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SendGrid error: ${errorText || response.statusText}`)
    }

    // Log the email
    await this.logCommunication(action.businessId, {
      type: 'email',
      direction: 'outbound',
      toEmail,
      fromEmail,
      subject,
      content: message,
      status: 'sent',
    })

    return {
      status: 'sent',
      to: toEmail,
    }
  }

  // ============================================
  // OUTBOUND CALLING
  // ============================================

  async makeOutboundCall(action: ActionRequest): Promise<any> {
    if (!VAPI_API_KEY) {
      throw new Error('VAPI not configured')
    }

    const toPhone = action.target.phone
    if (!toPhone) {
      throw new Error('No phone number provided')
    }

    // Check credits before making outbound call (minimum 2 minutes)
    const minCredits = CreditCost.VOICE_CALL_OUTBOUND * 2
    const hasCredits = true /* minutes system: included feature */
    if (!hasCredits) {
      throw new Error('Insufficient credits for outbound call')
    }

    // Get business's VAPI assistant
    const { data: business } = await supabase
      .from('businesses')
      .select('agent_id, name, phone_number')
      .eq('id', action.businessId)
      .single()

    if (!business?.agent_id) {
      throw new Error('Business has no voice agent configured')
    }

    // Prepare call message
    const firstMessage = action.content.message ||
      `Hi, this is a call from ${business.name}. How can I help you today?`

    // Make outbound call via VAPI
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: business.agent_id,
        customer: {
          number: toPhone,
          name: action.content.data?.customerName || 'Customer',
        },
        assistantOverrides: {
          firstMessage,
          metadata: {
            businessId: action.businessId,
            actionId: action.id,
            callType: 'outbound',
            purpose: action.content.data?.purpose || 'follow-up',
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`VAPI error: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()

    // Create voice call record
    await supabase.from('voice_ai_calls').insert({
      business_id: action.businessId,
      vapi_call_id: result.id,
      customer_phone: toPhone,
      call_type: 'outbound',
      status: 'initiating',
      created_at: new Date().toISOString(),
    })

    return {
      callId: result.id,
      status: result.status,
      to: toPhone,
    }
  }

  // ============================================
  // CALLBACK SCHEDULING
  // ============================================

  async scheduleCallback(action: ActionRequest): Promise<any> {
    const scheduledFor = action.executeAt || action.content.data?.scheduledTime
    if (!scheduledFor) {
      throw new Error('No callback time specified')
    }

    const toPhone = action.target.phone
    if (!toPhone) {
      throw new Error('No phone number provided')
    }

    // Create scheduled task
    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        business_id: action.businessId,
        employee_id: action.employeeId,
        task_type: 'callback',
        target_phone: toPhone,
        target_name: action.content.data?.customerName,
        scheduled_for: new Date(scheduledFor).toISOString(),
        timezone: action.content.data?.timezone || 'America/Los_Angeles',
        message: action.content.message,
        metadata: action.content.data,
        status: 'pending',
        priority: action.content.data?.priority || 'normal',
        max_attempts: 3,
        attempts: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      taskId: task.id,
      scheduledFor: task.scheduled_for,
      status: 'scheduled',
    }
  }

  // ============================================
  // APPOINTMENT CREATION
  // ============================================

  async createAppointment(action: ActionRequest): Promise<any> {
    const data = action.content.data
    if (!data) {
      throw new Error('No appointment data provided')
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id: action.businessId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone || action.target.phone,
        customer_email: data.customerEmail || action.target.email,
        service_id: data.serviceId,
        staff_id: data.staffId,
        appointment_date: data.date,
        start_time: data.time,
        end_time: data.endTime,
        status: 'confirmed',
        source: 'phone_employee',
        notes: data.notes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Send confirmation SMS if phone available
    if (data.customerPhone || action.target.phone) {
      await this.execute({
        ...action,
        id: `${action.id}-confirm`,
        actionType: 'send_sms',
        target: { phone: data.customerPhone || action.target.phone },
        content: {
          message: `Your appointment has been confirmed for ${data.date} at ${data.time}. We look forward to seeing you!`,
        },
      })
    }

    return {
      appointmentId: appointment.id,
      date: appointment.appointment_date,
      time: appointment.start_time,
      status: 'confirmed',
    }
  }

  // ============================================
  // CRM UPDATES
  // ============================================

  async updateCRM(action: ActionRequest): Promise<any> {
    const data = action.content.data
    if (!data) {
      throw new Error('No CRM update data provided')
    }

    // Determine entity type
    const entityType = data.entityType || 'customer'

    switch (entityType) {
      case 'customer':
        return this.updateCustomer(action.businessId, data)

      case 'lead':
        return this.updateLead(action.businessId, data)

      case 'appointment':
        return this.updateAppointment(action.businessId, data)

      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  private async updateCustomer(businessId: string, data: any) {
    const { data: customer, error } = await supabase
      .from('customers')
      .upsert({
        business_id: businessId,
        phone: data.phone,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,phone',
      })
      .select()
      .single()

    if (error) throw error
    return { customerId: customer.id, updated: true }
  }

  private async updateLead(businessId: string, data: any) {
    const { data: lead, error } = await supabase
      .from('leads')
      .upsert({
        business_id: businessId,
        phone: data.phone,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        company: data.company,
        status: data.status || 'new',
        source: data.source || 'phone_employee',
        notes: data.notes,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,email',
      })
      .select()
      .single()

    if (error) throw error
    return { leadId: lead.id, updated: true }
  }

  private async updateAppointment(businessId: string, data: any) {
    if (!data.appointmentId) {
      throw new Error('Appointment ID required')
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        status: data.status,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.appointmentId)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) throw error
    return { appointmentId: appointment.id, updated: true }
  }

  // ============================================
  // WEBHOOK SENDING
  // ============================================

  async sendWebhook(action: ActionRequest): Promise<any> {
    const webhookUrl = action.target.webhookUrl
    if (!webhookUrl) {
      throw new Error('No webhook URL provided')
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VoiceFly-Business': action.businessId,
        'X-VoiceFly-Employee': action.employeeId,
      },
      body: JSON.stringify({
        event: action.content.data?.event || 'action_executed',
        businessId: action.businessId,
        employeeId: action.employeeId,
        timestamp: new Date().toISOString(),
        data: action.content.data,
      }),
    })

    return {
      status: response.status,
      ok: response.ok,
    }
  }

  // ============================================
  // HUMAN ESCALATION
  // ============================================

  async escalateToHuman(action: ActionRequest): Promise<any> {
    const data = action.content.data || {}

    // Create escalation record
    const { data: escalation, error } = await supabase
      .from('escalations')
      .insert({
        business_id: action.businessId,
        employee_id: action.employeeId,
        call_id: action.sourceCallId,
        customer_phone: action.target.phone,
        customer_name: data.customerName,
        reason: data.reason || 'Customer requested human assistance',
        urgency: data.urgency || 'normal',
        status: 'pending',
        notes: action.content.message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // If escalations table doesn't exist, just log it
      console.warn('[ActionExecutor] Escalations table may not exist, logging instead')
    }

    // Notify manager via SMS if configured
    const { data: business } = await supabase
      .from('businesses')
      .select('phone, settings')
      .eq('id', action.businessId)
      .single()

    const managerPhone = business?.settings?.manager_phone || business?.phone

    if (managerPhone) {
      await this.sendSMS({
        ...action,
        id: `${action.id}-notify`,
        target: { phone: managerPhone },
        content: {
          message: `[ESCALATION] Customer ${data.customerName || action.target.phone} needs assistance. Reason: ${data.reason || 'Requested human'}.`,
        },
      })
    }

    return {
      escalationId: escalation?.id,
      status: 'escalated',
      notified: !!managerPhone,
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async updateActionStatus(
    actionId: string,
    status: ActionRequest['status'],
    result?: { success: boolean; response?: any; error?: string }
  ) {
    await supabase
      .from('action_requests')
      .update({
        status,
        result,
        executed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)
  }

  private async getBusinessPhoneNumber(businessId: string): Promise<string | null> {
    const { data } = await supabase
      .from('businesses')
      .select('ai_phone_number, phone')
      .eq('id', businessId)
      .single()

    return data?.ai_phone_number || data?.phone || null
  }

  private async getBusinessEmail(businessId: string): Promise<string | null> {
    const { data } = await supabase
      .from('businesses')
      .select('email')
      .eq('id', businessId)
      .single()

    return data?.email || null
  }

  private async getBusinessName(businessId: string): Promise<string> {
    const { data } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    return data?.name || 'Your Business'
  }

  private async logCommunication(businessId: string, log: {
    type: 'sms' | 'email' | 'call'
    direction: 'inbound' | 'outbound'
    toPhone?: string
    fromPhone?: string
    toEmail?: string
    fromEmail?: string
    subject?: string
    content: string
    externalId?: string
    status: string
  }) {
    await supabase.from('communication_logs').insert({
      business_id: businessId,
      type: log.type,
      direction: log.direction,
      to_phone: log.toPhone,
      from_phone: log.fromPhone,
      to_email: log.toEmail,
      from_email: log.fromEmail,
      subject: log.subject,
      content: log.content,
      external_id: log.externalId,
      status: log.status,
      created_at: new Date().toISOString(),
    })
  }

  // ============================================
  // QUEUE PROCESSOR
  // ============================================

  /**
   * Process pending actions from the queue
   * Should be called by a cron job or background worker
   */
  async processQueue(limit = 10): Promise<{
    processed: number
    succeeded: number
    failed: number
  }> {
    // Get pending actions
    const { data: actions, error } = await supabase
      .from('action_requests')
      .select('*')
      .eq('status', 'pending')
      .or(`execute_at.is.null,execute_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error || !actions) {
      console.error('[ActionExecutor] Failed to fetch queue:', error)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    let succeeded = 0
    let failed = 0

    for (const action of actions) {
      const result = await this.execute(action as ActionRequest)
      if (result.success) {
        succeeded++
      } else {
        failed++
      }
    }

    return {
      processed: actions.length,
      succeeded,
      failed,
    }
  }
}

// Export singleton
export const actionExecutor = ActionExecutor.getInstance()
