/**
 * Appointment Recovery Agent
 *
 * Handles appointment cancellations and no-shows:
 * - Automated rescheduling offers
 * - Smart follow-up timing
 * - Waitlist management
 * - Slot filling optimization
 */

import { supabase } from '../supabase-client'
import { CreditSystem } from '../credit-system'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../error-tracking'
import AuditLogger, { AuditEventType } from '../audit-logger'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentInsight,
  AgentAction,
  AgentAlert,
  AgentEvent,
} from './types'
import { mayaPrime } from './maya-prime'

// Agent configuration
const APPOINTMENT_RECOVERY_CONFIG: AgentConfig = {
  id: 'appointment-recovery',
  name: 'Appointment Recovery Agent',
  description: 'Recovers cancelled appointments and fills empty slots',
  cluster: 'operations',
  enabled: true,
  triggers: [
    { event: AgentEvent.APPOINTMENT_CANCELLED },
    { event: AgentEvent.APPOINTMENT_NOSHOW },
  ],
}

// Recovery timing windows
const RECOVERY_TIMING = {
  noShowFollowUpDelay: 2 * 60 * 60 * 1000, // 2 hours
  cancellationFollowUpDelay: 1 * 60 * 60 * 1000, // 1 hour
  sameDayUrgent: 4 * 60 * 60 * 1000, // 4 hours
  nextDayUrgent: 24 * 60 * 60 * 1000, // 24 hours
}

export class AppointmentRecoveryAgent {
  private static instance: AppointmentRecoveryAgent
  private errorTracker = ErrorTracker.getInstance()
  private config: AgentConfig

  private constructor() {
    this.config = APPOINTMENT_RECOVERY_CONFIG
    mayaPrime.registerAgent(this.config)
  }

  static getInstance(): AppointmentRecoveryAgent {
    if (!AppointmentRecoveryAgent.instance) {
      AppointmentRecoveryAgent.instance = new AppointmentRecoveryAgent()
    }
    return AppointmentRecoveryAgent.instance
  }

  /**
   * Handle appointment cancellation
   */
  async handleCancellation(
    appointmentId: string,
    businessId: string,
    reason?: string
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Get appointment details
      const appointment = await this.getAppointmentData(appointmentId, businessId)
      if (!appointment) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Appointment not found',
        }
      }

      const insights: AgentInsight[] = []
      const actions: AgentAction[] = []
      const alerts: AgentAlert[] = []

      // 1. Try to fill the slot from waitlist
      const waitlistMatch = await this.findWaitlistMatch(
        businessId,
        appointment.date,
        appointment.time,
        appointment.service
      )

      if (waitlistMatch) {
        insights.push({
          type: 'opportunity',
          title: 'Waitlist Match Found',
          description: `${waitlistMatch.customer_name} is waiting for this slot`,
          confidence: 0.9,
          impact: 'high',
          suggestedActions: ['Contact waitlist customer'],
        })

        actions.push({
          type: 'contact_waitlist',
          target: 'customer',
          payload: {
            waitlistId: waitlistMatch.id,
            customerName: waitlistMatch.customer_name,
            customerPhone: waitlistMatch.customer_phone,
            originalAppointmentDate: appointment.date,
            originalAppointmentTime: appointment.time,
          },
          priority: 'critical',
          scheduledFor: new Date(), // Immediate
        })
      }

      // 2. Check if same-day slot - high urgency
      const appointmentDate = new Date(appointment.date + 'T' + appointment.time)
      const hoursUntilAppointment = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60)

      if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 24) {
        alerts.push({
          severity: 'warning',
          title: 'Same-Day Cancellation',
          message: `Appointment cancelled with ${hoursUntilAppointment.toFixed(1)} hours notice`,
          category: 'operations',
          timestamp: new Date(),
          metadata: { appointmentId, hoursNotice: hoursUntilAppointment },
        })

        // Try to find customers who wanted earlier slots
        const potentialFills = await this.findPotentialSlotFillers(
          businessId,
          appointment.date,
          appointment.service
        )

        if (potentialFills.length > 0) {
          actions.push({
            type: 'send_slot_offer',
            target: 'customers',
            payload: {
              customers: potentialFills.slice(0, 5),
              date: appointment.date,
              time: appointment.time,
              service: appointment.service,
              template: 'last_minute_availability',
            },
            priority: 'high',
          })
        }
      }

      // 3. Schedule follow-up with cancelling customer
      if (appointment.customer_phone || appointment.customer_email) {
        const followUpDelay = hoursUntilAppointment > 24
          ? RECOVERY_TIMING.cancellationFollowUpDelay
          : RECOVERY_TIMING.sameDayUrgent

        actions.push({
          type: 'send_message',
          target: 'customer',
          payload: {
            customerName: appointment.customer_name,
            customerPhone: appointment.customer_phone,
            customerEmail: appointment.customer_email,
            template: 'cancellation_reschedule',
            appointmentId,
            reason,
          },
          priority: 'medium',
          scheduledFor: new Date(Date.now() + followUpDelay),
        })
      }

      // 4. Analyze cancellation patterns
      const patternAnalysis = await this.analyzeCancellationPatterns(businessId)
      if (patternAnalysis.insight) {
        insights.push(patternAnalysis.insight)
      }

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'cancellation_processed',
          appointmentId,
          reason,
          waitlistMatchFound: !!waitlistMatch,
          actionsQueued: actions.length,
        },
        severity: 'low',
      })

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: {
          appointmentId,
          waitlistMatch: waitlistMatch?.id || null,
          recoveryActionsQueued: actions.length,
        },
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Cancellation recovery failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId, appointmentId }
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
   * Handle no-show
   */
  async handleNoShow(appointmentId: string, businessId: string): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Get appointment details
      const appointment = await this.getAppointmentData(appointmentId, businessId)
      if (!appointment) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Appointment not found',
        }
      }

      const insights: AgentInsight[] = []
      const actions: AgentAction[] = []
      const alerts: AgentAlert[] = []

      // 1. Check customer's no-show history
      const noShowHistory = await this.getCustomerNoShowHistory(
        businessId,
        appointment.customer_phone,
        appointment.customer_email
      )

      if (noShowHistory.count > 1) {
        alerts.push({
          severity: 'warning',
          title: 'Repeat No-Show',
          message: `Customer has ${noShowHistory.count} no-shows. Consider requiring deposit.`,
          category: 'operations',
          timestamp: new Date(),
          metadata: {
            appointmentId,
            customerPhone: appointment.customer_phone,
            noShowCount: noShowHistory.count,
          },
        })

        insights.push({
          type: 'risk',
          title: 'High No-Show Risk Customer',
          description: `This customer has missed ${noShowHistory.count} appointments`,
          confidence: 0.95,
          impact: 'medium',
          suggestedActions: [
            'Flag customer for deposit requirement',
            'Send reminder policy email',
          ],
        })

        // Flag customer
        actions.push({
          type: 'flag_customer',
          target: 'customer',
          payload: {
            customerPhone: appointment.customer_phone,
            customerEmail: appointment.customer_email,
            flag: 'requires_deposit',
            reason: `${noShowHistory.count} no-shows`,
          },
          priority: 'medium',
        })
      }

      // 2. Send no-show follow-up
      actions.push({
        type: 'send_message',
        target: 'customer',
        payload: {
          customerName: appointment.customer_name,
          customerPhone: appointment.customer_phone,
          customerEmail: appointment.customer_email,
          template: noShowHistory.count > 1 ? 'noshow_repeat' : 'noshow_first',
          appointmentId,
        },
        priority: 'high',
        scheduledFor: new Date(Date.now() + RECOVERY_TIMING.noShowFollowUpDelay),
      })

      // 3. Check if slot can still be used today
      const now = new Date()
      const appointmentTime = new Date(appointment.date + 'T' + appointment.time)
      const hoursRemaining = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

      // If appointment was supposed to start but they didn't show
      if (hoursRemaining < 0 && hoursRemaining > -2) {
        // Try to fill remaining time with walk-in or next waitlist
        const remainingSlots = await this.getRemainingDaySlots(businessId, appointment.date)
        if (remainingSlots.emptySlots > 2) {
          insights.push({
            type: 'opportunity',
            title: 'Same-Day Capacity Available',
            description: `${remainingSlots.emptySlots} slots still open today`,
            confidence: 0.8,
            impact: 'medium',
            suggestedActions: ['Promote same-day availability', 'Contact recent inquiries'],
          })
        }
      }

      // 4. Calculate revenue impact
      const estimatedRevenueLoss = appointment.total_amount || 100 // Default estimate
      insights.push({
        type: 'trend',
        title: 'Revenue Impact',
        description: `Estimated $${estimatedRevenueLoss} lost from no-show`,
        confidence: 0.7,
        impact: 'medium',
        data: { amount: estimatedRevenueLoss },
      })

      // Update appointment status
      await supabase
        .from('appointments')
        .update({
          status: 'no_show',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'noshow_processed',
          appointmentId,
          isRepeatNoShow: noShowHistory.count > 1,
          estimatedLoss: estimatedRevenueLoss,
        },
        severity: 'low',
      })

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: {
          appointmentId,
          noShowCount: noShowHistory.count,
          revenueLoss: estimatedRevenueLoss,
        },
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('No-show processing failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId, appointmentId }
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
   * Run daily slot optimization
   */
  async optimizeSlots(businessId: string, targetDate?: string): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()
    const date = targetDate || new Date().toISOString().split('T')[0]

    try {
      // Get today's schedule
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
        .eq('date', date)
        .in('status', ['scheduled', 'confirmed'])
        .order('time')

      // Get waitlist
      const { data: waitlist } = await supabase
        .from('appointment_waitlist')
        .select('*')
        .eq('business_id', businessId)
        .eq('preferred_date', date)
        .eq('status', 'waiting')

      const insights: AgentInsight[] = []
      const actions: AgentAction[] = []

      // Find gaps in schedule
      const gaps = this.findScheduleGaps(appointments || [])

      if (gaps.length > 0 && waitlist && waitlist.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'Slot Optimization Available',
          description: `${gaps.length} gaps found with ${waitlist.length} waiting customers`,
          confidence: 0.85,
          impact: 'high',
          suggestedActions: ['Match waitlist to available slots'],
        })

        // Try to match waitlist to gaps
        for (const gap of gaps) {
          const matches = waitlist.filter(
            (w) => !w.service || w.service === gap.suggestedService
          )

          if (matches.length > 0) {
            actions.push({
              type: 'offer_slot',
              target: 'waitlist',
              payload: {
                waitlistCustomers: matches.slice(0, 3).map((w) => ({
                  id: w.id,
                  name: w.customer_name,
                  phone: w.customer_phone,
                })),
                slot: {
                  date,
                  time: gap.time,
                  duration: gap.duration,
                },
              },
              priority: 'medium',
            })
          }
        }
      }

      // Check utilization
      const totalSlots = 9 // 9am-5pm hourly
      const bookedSlots = appointments?.length || 0
      const utilization = (bookedSlots / totalSlots) * 100

      insights.push({
        type: 'trend',
        title: 'Schedule Utilization',
        description: `${utilization.toFixed(0)}% booked for ${date}`,
        confidence: 1,
        impact: utilization < 50 ? 'high' : 'low',
        data: { utilization, bookedSlots, totalSlots },
      })

      if (utilization < 40) {
        actions.push({
          type: 'send_promotion',
          target: 'leads',
          payload: {
            campaign: 'last_minute_deals',
            date,
            discountPercent: 15,
          },
          priority: 'medium',
        })
      }

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: {
          date,
          gaps: gaps.length,
          waitlistSize: waitlist?.length || 0,
          utilization,
          optimizationsQueued: actions.length,
        },
        insights,
        actions,
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
   * Get appointment data
   */
  private async getAppointmentData(appointmentId: string, businessId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('business_id', businessId)
      .single()

    return error ? null : data
  }

  /**
   * Find matching waitlist entry
   */
  private async findWaitlistMatch(
    businessId: string,
    date: string,
    time: string,
    service?: string
  ): Promise<any | null> {
    let query = supabase
      .from('appointment_waitlist')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'waiting')
      .lte('preferred_date', date)

    if (service) {
      query = query.or(`service.eq.${service},service.is.null`)
    }

    const { data } = await query.order('created_at').limit(1)
    return data && data.length > 0 ? data[0] : null
  }

  /**
   * Find customers who might want an earlier slot
   */
  private async findPotentialSlotFillers(
    businessId: string,
    date: string,
    service?: string
  ): Promise<any[]> {
    // Find customers with later appointments who might want to move up
    const { data } = await supabase
      .from('appointments')
      .select('customer_name, customer_phone, customer_email, time')
      .eq('business_id', businessId)
      .eq('date', date)
      .in('status', ['scheduled', 'confirmed'])
      .order('time', { ascending: false })
      .limit(10)

    return data || []
  }

  /**
   * Analyze cancellation patterns
   */
  private async analyzeCancellationPatterns(
    businessId: string
  ): Promise<{ insight: AgentInsight | null }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: cancellations } = await supabase
      .from('appointments')
      .select('date, time, service')
      .eq('business_id', businessId)
      .eq('status', 'cancelled')
      .gte('created_at', thirtyDaysAgo)

    if (!cancellations || cancellations.length < 5) {
      return { insight: null }
    }

    // Analyze day of week patterns
    const dayCount: Record<number, number> = {}
    for (const appt of cancellations) {
      const day = new Date(appt.date).getDay()
      dayCount[day] = (dayCount[day] || 0) + 1
    }

    const maxDay = Object.entries(dayCount).reduce((max, [day, count]) =>
      count > (dayCount[Number(max)] || 0) ? day : max
    , '0')

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const problemDay = dayNames[Number(maxDay)]

    if (dayCount[Number(maxDay)] > cancellations.length * 0.3) {
      return {
        insight: {
          type: 'trend',
          title: 'Cancellation Pattern Detected',
          description: `${problemDay}s have higher cancellation rate (${dayCount[Number(maxDay)]} of ${cancellations.length})`,
          confidence: 0.75,
          impact: 'medium',
          suggestedActions: [
            `Send extra reminders for ${problemDay} appointments`,
            'Consider requiring deposits',
          ],
        },
      }
    }

    return { insight: null }
  }

  /**
   * Get customer no-show history
   */
  private async getCustomerNoShowHistory(
    businessId: string,
    phone?: string,
    email?: string
  ): Promise<{ count: number }> {
    if (!phone && !email) return { count: 0 }

    let query = supabase
      .from('appointments')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'no_show')

    if (phone && email) {
      query = query.or(`customer_phone.eq.${phone},customer_email.eq.${email}`)
    } else if (phone) {
      query = query.eq('customer_phone', phone)
    } else if (email) {
      query = query.eq('customer_email', email)
    }

    const { data } = await query
    return { count: data?.length || 0 }
  }

  /**
   * Get remaining day slots
   */
  private async getRemainingDaySlots(
    businessId: string,
    date: string
  ): Promise<{ emptySlots: number }> {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('time')
      .eq('business_id', businessId)
      .eq('date', date)
      .in('status', ['scheduled', 'confirmed'])

    const bookedTimes = appointments?.map((a) => a.time) || []
    const allSlots = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    const now = new Date()
    const currentHour = now.getHours()

    // Only count future slots
    const futureSlots = allSlots.filter((slot) => {
      const slotHour = parseInt(slot.split(':')[0])
      return slotHour > currentHour && !bookedTimes.includes(slot)
    })

    return { emptySlots: futureSlots.length }
  }

  /**
   * Find schedule gaps
   */
  private findScheduleGaps(appointments: any[]): ScheduleGap[] {
    const gaps: ScheduleGap[] = []
    const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17]
    const bookedHours = appointments.map((a) => parseInt(a.time.split(':')[0]))

    for (const hour of businessHours) {
      if (!bookedHours.includes(hour)) {
        gaps.push({
          time: `${hour}:00`,
          duration: 60,
          suggestedService: null,
        })
      }
    }

    return gaps
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `appt_recovery_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }
}

// Schedule gap interface
interface ScheduleGap {
  time: string
  duration: number
  suggestedService: string | null
}

// Export singleton
export const appointmentRecoveryAgent = AppointmentRecoveryAgent.getInstance()
export default AppointmentRecoveryAgent
