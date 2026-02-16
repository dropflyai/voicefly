/**
 * Message Taking System
 *
 * Handles taking, storing, and managing messages from callers
 * when the intended recipient is unavailable.
 */

import { createClient } from '@supabase/supabase-js'
import { PhoneMessage } from './types'
import { actionExecutor } from './action-executor'
import { taskScheduler } from './task-scheduler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// MESSAGE SYSTEM CLASS
// ============================================

export class MessageSystem {
  private static instance: MessageSystem

  private constructor() {}

  static getInstance(): MessageSystem {
    if (!MessageSystem.instance) {
      MessageSystem.instance = new MessageSystem()
    }
    return MessageSystem.instance
  }

  // ============================================
  // MESSAGE CREATION
  // ============================================

  /**
   * Take a new message from a caller
   */
  async takeMessage(params: {
    businessId: string
    employeeId: string
    callerName?: string
    callerPhone: string
    callerEmail?: string
    callerCompany?: string
    forPerson?: string
    department?: string
    reason: string
    fullMessage: string
    urgency?: PhoneMessage['urgency']
    callbackRequested?: boolean
    callbackTime?: Date
    callId?: string
    transcriptExcerpt?: string
  }): Promise<PhoneMessage> {
    const { data, error } = await supabase
      .from('phone_messages')
      .insert({
        business_id: params.businessId,
        employee_id: params.employeeId,
        caller_name: params.callerName,
        caller_phone: params.callerPhone,
        caller_email: params.callerEmail,
        caller_company: params.callerCompany,
        for_person: params.forPerson,
        department: params.department,
        reason: params.reason,
        full_message: params.fullMessage,
        urgency: params.urgency || 'normal',
        status: 'new',
        callback_requested: params.callbackRequested || false,
        callback_time: params.callbackTime?.toISOString(),
        call_id: params.callId,
        transcript_excerpt: params.transcriptExcerpt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[MessageSystem] Failed to create message:', error)
      throw error
    }

    const message = this.mapToPhoneMessage(data)

    // Handle notifications based on urgency
    await this.handleMessageNotifications(message)

    // Schedule callback if requested
    if (params.callbackRequested && params.callbackTime) {
      await taskScheduler.scheduleCallback({
        businessId: params.businessId,
        employeeId: params.employeeId,
        targetPhone: params.callerPhone,
        targetName: params.callerName,
        scheduledFor: params.callbackTime,
        message: `Callback requested regarding: ${params.reason}`,
        priority: params.urgency === 'urgent' ? 'critical' : params.urgency === 'high' ? 'high' : 'normal',
        metadata: { messageId: message.id },
      })
    }

    console.log(`[MessageSystem] Message created: ${message.id}`, {
      urgency: message.urgency,
      callbackRequested: message.callbackRequested,
    })

    return message
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Get messages for a business
   */
  async getMessages(params: {
    businessId: string
    status?: PhoneMessage['status']
    forPerson?: string
    urgency?: PhoneMessage['urgency']
    limit?: number
    offset?: number
  }): Promise<PhoneMessage[]> {
    let query = supabase
      .from('phone_messages')
      .select('*')
      .eq('business_id', params.businessId)
      .order('created_at', { ascending: false })

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.forPerson) {
      query = query.eq('for_person', params.forPerson)
    }
    if (params.urgency) {
      query = query.eq('urgency', params.urgency)
    }
    if (params.limit) {
      query = query.limit(params.limit)
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('[MessageSystem] Failed to fetch messages:', error)
      return []
    }

    return data.map(this.mapToPhoneMessage)
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(businessId: string, forPerson?: string): Promise<number> {
    let query = supabase
      .from('phone_messages')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'new')

    if (forPerson) {
      query = query.eq('for_person', forPerson)
    }

    const { count, error } = await query

    if (error) {
      console.error('[MessageSystem] Failed to get unread count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, businessId: string): Promise<boolean> {
    const { error } = await supabase
      .from('phone_messages')
      .update({
        status: 'read',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('business_id', businessId)

    if (error) {
      console.error('[MessageSystem] Failed to mark as read:', error)
      return false
    }

    return true
  }

  /**
   * Update message status
   */
  async updateStatus(
    messageId: string,
    businessId: string,
    status: PhoneMessage['status']
  ): Promise<boolean> {
    const { error } = await supabase
      .from('phone_messages')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('business_id', businessId)

    if (error) {
      console.error('[MessageSystem] Failed to update status:', error)
      return false
    }

    return true
  }

  /**
   * Mark callback as completed
   */
  async markCallbackCompleted(messageId: string, businessId: string): Promise<boolean> {
    const { error } = await supabase
      .from('phone_messages')
      .update({
        callback_completed: true,
        status: 'resolved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('business_id', businessId)

    if (error) {
      console.error('[MessageSystem] Failed to mark callback completed:', error)
      return false
    }

    return true
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  private async handleMessageNotifications(message: PhoneMessage): Promise<void> {
    // Get business settings
    const { data: business } = await supabase
      .from('businesses')
      .select('phone, email, settings, name')
      .eq('id', message.businessId)
      .single()

    if (!business) return

    const settings = business.settings || {}
    const notifyEmail = settings.message_notify_email || business.email
    const notifyPhone = settings.message_notify_phone || business.phone

    // For urgent messages, send immediate notification
    if (message.urgency === 'urgent' || message.urgency === 'high') {
      // SMS notification
      if (notifyPhone) {
        await actionExecutor.execute({
          id: `msg-notify-${message.id}`,
          businessId: message.businessId,
          employeeId: message.employeeId,
          actionType: 'send_sms',
          target: { phone: notifyPhone },
          content: {
            message: `[${message.urgency.toUpperCase()}] New message from ${message.callerName || message.callerPhone}: ${message.reason.substring(0, 100)}${message.reason.length > 100 ? '...' : ''}`,
          },
          status: 'pending',
          triggeredBy: 'agent',
          createdAt: new Date(),
        })
      }

      // Email notification for urgent
      if (notifyEmail && message.urgency === 'urgent') {
        await actionExecutor.execute({
          id: `msg-email-${message.id}`,
          businessId: message.businessId,
          employeeId: message.employeeId,
          actionType: 'send_email',
          target: { email: notifyEmail },
          content: {
            subject: `[URGENT] Message from ${message.callerName || message.callerPhone}`,
            message: this.formatEmailMessage(message, business.name),
          },
          status: 'pending',
          triggeredBy: 'agent',
          createdAt: new Date(),
        })
      }
    }
  }

  private formatEmailMessage(message: PhoneMessage, businessName: string): string {
    return `
New ${message.urgency === 'urgent' ? 'URGENT ' : ''}message received at ${businessName}:

From: ${message.callerName || 'Unknown'}
Phone: ${message.callerPhone}
${message.callerEmail ? `Email: ${message.callerEmail}` : ''}
${message.callerCompany ? `Company: ${message.callerCompany}` : ''}
${message.forPerson ? `For: ${message.forPerson}` : ''}

Reason: ${message.reason}

Message:
${message.fullMessage}

${message.callbackRequested ? `** CALLBACK REQUESTED ${message.callbackTime ? `at ${message.callbackTime}` : ''} **` : ''}

Received: ${message.createdAt.toLocaleString()}
`.trim()
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToPhoneMessage(data: any): PhoneMessage {
    return {
      id: data.id,
      businessId: data.business_id,
      employeeId: data.employee_id,
      callerName: data.caller_name,
      callerPhone: data.caller_phone,
      callerEmail: data.caller_email,
      callerCompany: data.caller_company,
      reason: data.reason,
      fullMessage: data.full_message,
      urgency: data.urgency,
      forPerson: data.for_person,
      department: data.department,
      status: data.status,
      callbackRequested: data.callback_requested,
      callbackTime: data.callback_time ? new Date(data.callback_time) : undefined,
      callbackCompleted: data.callback_completed,
      callId: data.call_id,
      transcriptExcerpt: data.transcript_excerpt,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const messageSystem = MessageSystem.getInstance()
