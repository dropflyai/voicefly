/**
 * Task Scheduler Agent
 *
 * Handles scheduled tasks like:
 * - Callbacks ("Call me back at 3pm")
 * - Appointment reminders
 * - Follow-up messages
 * - Recurring tasks
 */

import { createClient } from '@supabase/supabase-js'
import { ScheduledTask } from './types'
import { actionExecutor } from './action-executor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// TASK SCHEDULER CLASS
// ============================================

export class TaskScheduler {
  private static instance: TaskScheduler
  private isRunning = false
  private pollInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): TaskScheduler {
    if (!TaskScheduler.instance) {
      TaskScheduler.instance = new TaskScheduler()
    }
    return TaskScheduler.instance
  }

  // ============================================
  // TASK CREATION
  // ============================================

  /**
   * Schedule a callback
   */
  async scheduleCallback(params: {
    businessId: string
    employeeId: string
    targetPhone: string
    targetName?: string
    scheduledFor: Date
    timezone?: string
    message?: string
    priority?: 'low' | 'normal' | 'high' | 'critical'
    metadata?: Record<string, any>
  }): Promise<ScheduledTask> {
    const task = await this.createTask({
      businessId: params.businessId,
      employeeId: params.employeeId,
      taskType: 'callback',
      targetPhone: params.targetPhone,
      targetName: params.targetName,
      scheduledFor: params.scheduledFor,
      timezone: params.timezone || 'America/Los_Angeles',
      message: params.message,
      priority: params.priority || 'normal',
      maxAttempts: 3,
      metadata: params.metadata,
    })

    console.log(`[TaskScheduler] Callback scheduled for ${params.scheduledFor}`, {
      taskId: task.id,
      targetPhone: params.targetPhone,
    })

    return task
  }

  /**
   * Schedule an appointment reminder
   */
  async scheduleReminder(params: {
    businessId: string
    employeeId: string
    appointmentId: string
    targetPhone?: string
    targetEmail?: string
    targetName?: string
    appointmentDate: Date
    reminderType: '24h' | '1h' | '15min'
    message?: string
  }): Promise<ScheduledTask> {
    // Calculate reminder time
    const reminderOffsets = {
      '24h': 24 * 60 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '15min': 15 * 60 * 1000,
    }

    const scheduledFor = new Date(
      params.appointmentDate.getTime() - reminderOffsets[params.reminderType]
    )

    // Don't schedule if reminder time is in the past
    if (scheduledFor <= new Date()) {
      console.log('[TaskScheduler] Skipping reminder - time already passed')
      throw new Error('Reminder time has already passed')
    }

    const defaultMessages = {
      '24h': `Hi ${params.targetName || 'there'}! This is a friendly reminder about your appointment tomorrow. Reply CONFIRM to confirm or RESCHEDULE if you need to change.`,
      '1h': `Hi ${params.targetName || 'there'}! Your appointment is in 1 hour. We look forward to seeing you!`,
      '15min': `Hi ${params.targetName || 'there'}! Your appointment starts in 15 minutes. See you soon!`,
    }

    const task = await this.createTask({
      businessId: params.businessId,
      employeeId: params.employeeId,
      taskType: 'send_reminder',
      targetPhone: params.targetPhone,
      targetEmail: params.targetEmail,
      targetName: params.targetName,
      scheduledFor,
      message: params.message || defaultMessages[params.reminderType],
      priority: params.reminderType === '15min' ? 'high' : 'normal',
      maxAttempts: 1,
      metadata: {
        appointmentId: params.appointmentId,
        reminderType: params.reminderType,
      },
    })

    console.log(`[TaskScheduler] Reminder scheduled for ${scheduledFor}`, {
      taskId: task.id,
      reminderType: params.reminderType,
    })

    return task
  }

  /**
   * Schedule a follow-up message
   */
  async scheduleFollowUp(params: {
    businessId: string
    employeeId: string
    targetPhone?: string
    targetEmail?: string
    targetName?: string
    delayMinutes: number
    message: string
    channel?: 'sms' | 'email' | 'call'
    metadata?: Record<string, any>
  }): Promise<ScheduledTask> {
    const scheduledFor = new Date(Date.now() + params.delayMinutes * 60 * 1000)

    const task = await this.createTask({
      businessId: params.businessId,
      employeeId: params.employeeId,
      taskType: 'follow_up',
      targetPhone: params.targetPhone,
      targetEmail: params.targetEmail,
      targetName: params.targetName,
      scheduledFor,
      message: params.message,
      priority: 'normal',
      maxAttempts: 2,
      metadata: {
        ...params.metadata,
        channel: params.channel || 'sms',
      },
    })

    console.log(`[TaskScheduler] Follow-up scheduled for ${scheduledFor}`, {
      taskId: task.id,
      delayMinutes: params.delayMinutes,
    })

    return task
  }

  /**
   * Schedule order/booking confirmation
   */
  async scheduleConfirmation(params: {
    businessId: string
    employeeId: string
    targetPhone?: string
    targetEmail?: string
    targetName?: string
    confirmationType: 'order' | 'appointment' | 'booking'
    referenceId: string
    message: string
    delaySeconds?: number
  }): Promise<ScheduledTask> {
    const scheduledFor = new Date(Date.now() + (params.delaySeconds || 5) * 1000)

    const task = await this.createTask({
      businessId: params.businessId,
      employeeId: params.employeeId,
      taskType: 'send_confirmation',
      targetPhone: params.targetPhone,
      targetEmail: params.targetEmail,
      targetName: params.targetName,
      scheduledFor,
      message: params.message,
      priority: 'high',
      maxAttempts: 2,
      metadata: {
        confirmationType: params.confirmationType,
        referenceId: params.referenceId,
      },
    })

    return task
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  private async createTask(params: {
    businessId: string
    employeeId: string
    taskType: ScheduledTask['taskType']
    targetPhone?: string
    targetEmail?: string
    targetName?: string
    scheduledFor: Date
    timezone?: string
    message?: string
    priority: ScheduledTask['priority']
    maxAttempts: number
    metadata?: Record<string, any>
  }): Promise<ScheduledTask> {
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        business_id: params.businessId,
        employee_id: params.employeeId,
        task_type: params.taskType,
        target_phone: params.targetPhone,
        target_email: params.targetEmail,
        target_name: params.targetName,
        scheduled_for: params.scheduledFor.toISOString(),
        timezone: params.timezone || 'America/Los_Angeles',
        message: params.message,
        priority: params.priority,
        status: 'pending',
        attempts: 0,
        max_attempts: params.maxAttempts,
        metadata: params.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[TaskScheduler] Failed to create task:', error)
      throw error
    }

    return this.mapToScheduledTask(data)
  }

  /**
   * Cancel a scheduled task
   */
  async cancelTask(taskId: string, businessId: string): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('business_id', businessId)
      .eq('status', 'pending')

    if (error) {
      console.error('[TaskScheduler] Failed to cancel task:', error)
      return false
    }

    console.log(`[TaskScheduler] Task cancelled: ${taskId}`)
    return true
  }

  /**
   * Get pending tasks for a business
   */
  async getPendingTasks(businessId: string, limit = 50): Promise<ScheduledTask[]> {
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[TaskScheduler] Failed to fetch tasks:', error)
      return []
    }

    return data.map(this.mapToScheduledTask)
  }

  // ============================================
  // TASK PROCESSING
  // ============================================

  /**
   * Process due tasks
   * Should be called by a cron job every minute
   */
  async processDueTasks(): Promise<{
    processed: number
    succeeded: number
    failed: number
  }> {
    const now = new Date()

    // Get tasks that are due and still pending
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(20)

    if (error || !tasks) {
      console.error('[TaskScheduler] Failed to fetch due tasks:', error)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    let succeeded = 0
    let failed = 0

    for (const task of tasks) {
      try {
        await this.executeTask(this.mapToScheduledTask(task))
        succeeded++
      } catch (err) {
        console.error(`[TaskScheduler] Task failed: ${task.id}`, err)
        failed++
      }
    }

    return {
      processed: tasks.length,
      succeeded,
      failed,
    }
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    console.log(`[TaskScheduler] Executing task: ${task.taskType}`, {
      taskId: task.id,
      targetPhone: task.targetPhone,
    })

    // Mark as in progress
    await supabase
      .from('scheduled_tasks')
      .update({
        status: 'in_progress',
        last_attempt_at: new Date().toISOString(),
        attempts: task.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)

    try {
      let result: any

      switch (task.taskType) {
        case 'callback':
          result = await this.executeCallback(task)
          break

        case 'send_reminder':
          result = await this.executeSendMessage(task)
          break

        case 'send_confirmation':
          result = await this.executeSendMessage(task)
          break

        case 'follow_up':
          result = await this.executeFollowUp(task)
          break

        case 'check_in':
          result = await this.executeSendMessage(task)
          break

        default:
          throw new Error(`Unknown task type: ${task.taskType}`)
      }

      // Mark as completed
      await supabase
        .from('scheduled_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      console.log(`[TaskScheduler] Task completed: ${task.id}`)

    } catch (error: any) {
      console.error(`[TaskScheduler] Task execution failed: ${task.id}`, error)

      // Check if we should retry
      if (task.attempts + 1 < task.maxAttempts) {
        // Retry with exponential backoff (5min, 15min, 45min)
        const retryDelay = Math.pow(3, task.attempts) * 5 * 60 * 1000

        await supabase
          .from('scheduled_tasks')
          .update({
            status: 'pending',
            scheduled_for: new Date(Date.now() + retryDelay).toISOString(),
            failure_reason: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        console.log(`[TaskScheduler] Task will retry in ${retryDelay / 60000} minutes`)
      } else {
        // Max attempts reached, mark as failed
        await supabase
          .from('scheduled_tasks')
          .update({
            status: 'failed',
            failure_reason: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id)

        console.log(`[TaskScheduler] Task failed permanently: ${task.id}`)
      }
    }
  }

  private async executeCallback(task: ScheduledTask): Promise<any> {
    if (!task.targetPhone) {
      throw new Error('No phone number for callback')
    }

    // Make outbound call
    return actionExecutor.execute({
      id: `task-${task.id}`,
      businessId: task.businessId,
      employeeId: task.employeeId,
      actionType: 'make_call',
      target: { phone: task.targetPhone },
      content: {
        message: task.message,
        data: {
          customerName: task.targetName,
          purpose: 'scheduled_callback',
          taskId: task.id,
          ...task.metadata,
        },
      },
      status: 'pending',
      triggeredBy: 'schedule',
      createdAt: new Date(),
    })
  }

  private async executeSendMessage(task: ScheduledTask): Promise<any> {
    const channel = task.metadata?.channel || (task.targetPhone ? 'sms' : 'email')

    if (channel === 'sms' && task.targetPhone) {
      return actionExecutor.execute({
        id: `task-${task.id}`,
        businessId: task.businessId,
        employeeId: task.employeeId,
        actionType: 'send_sms',
        target: { phone: task.targetPhone },
        content: { message: task.message },
        status: 'pending',
        triggeredBy: 'schedule',
        createdAt: new Date(),
      })
    }

    if (channel === 'email' && task.targetEmail) {
      return actionExecutor.execute({
        id: `task-${task.id}`,
        businessId: task.businessId,
        employeeId: task.employeeId,
        actionType: 'send_email',
        target: { email: task.targetEmail },
        content: {
          subject: task.metadata?.subject || 'Reminder',
          message: task.message,
        },
        status: 'pending',
        triggeredBy: 'schedule',
        createdAt: new Date(),
      })
    }

    throw new Error('No valid contact method for message')
  }

  private async executeFollowUp(task: ScheduledTask): Promise<any> {
    const channel = task.metadata?.channel || 'sms'

    if (channel === 'call' && task.targetPhone) {
      return this.executeCallback(task)
    }

    return this.executeSendMessage(task)
  }

  // ============================================
  // BACKGROUND PROCESSING
  // ============================================

  /**
   * Start background task processing
   * Call this once when the app starts
   */
  start(intervalMs = 60000): void {
    if (this.isRunning) {
      console.log('[TaskScheduler] Already running')
      return
    }

    console.log(`[TaskScheduler] Starting with ${intervalMs}ms interval`)
    this.isRunning = true

    // Process immediately
    this.processDueTasks()

    // Then process on interval
    this.pollInterval = setInterval(async () => {
      try {
        const result = await this.processDueTasks()
        if (result.processed > 0) {
          console.log(`[TaskScheduler] Processed ${result.processed} tasks: ${result.succeeded} succeeded, ${result.failed} failed`)
        }
      } catch (error) {
        console.error('[TaskScheduler] Processing error:', error)
      }
    }, intervalMs)
  }

  /**
   * Stop background processing
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isRunning = false
    console.log('[TaskScheduler] Stopped')
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToScheduledTask(data: any): ScheduledTask {
    return {
      id: data.id,
      businessId: data.business_id,
      employeeId: data.employee_id,
      taskType: data.task_type,
      targetPhone: data.target_phone,
      targetEmail: data.target_email,
      targetName: data.target_name,
      scheduledFor: new Date(data.scheduled_for),
      timezone: data.timezone,
      message: data.message,
      templateId: data.template_id,
      metadata: data.metadata,
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      lastAttemptAt: data.last_attempt_at ? new Date(data.last_attempt_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      failureReason: data.failure_reason,
      priority: data.priority,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const taskScheduler = TaskScheduler.getInstance()
