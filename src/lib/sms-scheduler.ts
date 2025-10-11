import { createClient } from '@supabase/supabase-js'
import { SMSService } from './sms-service'
import { SMSTemplates, SMSTemplateData } from './sms-templates'
import { TCPACompliance } from './tcpa-compliance'
import { deductCredits, hasEnoughCredits } from './credit-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * SMS Scheduler - Automated SMS sending for appointments
 *
 * Features:
 * - 24-hour appointment reminders
 * - 2-hour appointment reminders
 * - Birthday messages
 * - Service reminders (30 days since last visit)
 * - No-show follow-ups
 */

export class SMSScheduler {

  /**
   * Send 24-hour appointment reminders
   * Run this function via cron job every hour
   */
  static async send24HourReminders(): Promise<void> {
    console.log('Running 24-hour reminder job...')

    try {
      // Get appointments happening in 24 hours
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStart = new Date(tomorrow)
      tomorrowStart.setHours(0, 0, 0, 0)
      const tomorrowEnd = new Date(tomorrow)
      tomorrowEnd.setHours(23, 59, 59, 999)

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(*),
          business:businesses(*),
          service:services(*)
        `)
        .gte('appointment_date', tomorrowStart.toISOString())
        .lte('appointment_date', tomorrowEnd.toISOString())
        .in('status', ['confirmed', 'pending'])
        .is('reminder_24h_sent', false)

      if (error) {
        console.error('Error fetching appointments:', error)
        return
      }

      console.log(`Found ${appointments?.length || 0} appointments needing 24h reminders`)

      for (const appointment of appointments || []) {
        await this.sendReminder(appointment, '24h')
      }
    } catch (error) {
      console.error('24-hour reminder job error:', error)
    }
  }

  /**
   * Send 2-hour appointment reminders
   * Run this function via cron job every 30 minutes
   */
  static async send2HourReminders(): Promise<void> {
    console.log('Running 2-hour reminder job...')

    try {
      // Get appointments happening in 2 hours
      const twoHoursFromNow = new Date()
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)
      const windowStart = new Date(twoHoursFromNow)
      windowStart.setMinutes(0, 0, 0)
      const windowEnd = new Date(twoHoursFromNow)
      windowEnd.setMinutes(59, 59, 999)

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(*),
          business:businesses(*),
          service:services(*)
        `)
        .gte('appointment_date', windowStart.toISOString())
        .lte('appointment_date', windowEnd.toISOString())
        .in('status', ['confirmed'])
        .is('reminder_2h_sent', false)

      if (error) {
        console.error('Error fetching appointments:', error)
        return
      }

      console.log(`Found ${appointments?.length || 0} appointments needing 2h reminders`)

      for (const appointment of appointments || []) {
        await this.sendReminder(appointment, '2h')
      }
    } catch (error) {
      console.error('2-hour reminder job error:', error)
    }
  }

  /**
   * Send individual appointment reminder
   */
  private static async sendReminder(appointment: any, type: '24h' | '2h'): Promise<void> {
    try {
      const businessId = appointment.business_id
      const phoneNumber = appointment.customer?.phone

      if (!phoneNumber) {
        console.log(`No phone number for appointment ${appointment.id}`)
        return
      }

      // Check TCPA compliance
      const complianceCheck = await TCPACompliance.canSendSMS(
        phoneNumber,
        businessId,
        appointment.business?.timezone || 'America/New_York',
        'transactional'
      )

      if (!complianceCheck.allowed) {
        console.log(`Cannot send reminder to ${phoneNumber}: ${complianceCheck.reason}`)
        await TCPACompliance.logComplianceCheck(phoneNumber, businessId, false, complianceCheck.reason)
        return
      }

      // Check credit balance
      const hasCredits = await hasEnoughCredits(businessId, 'sms', 1)
      if (!hasCredits) {
        console.log(`Insufficient SMS credits for business ${businessId}`)
        return
      }

      // Prepare template data
      const templateData: SMSTemplateData = {
        customerName: appointment.customer?.first_name || appointment.customer?.name,
        businessName: appointment.business?.name,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString(),
        appointmentTime: appointment.start_time,
        serviceName: appointment.service?.name,
        location: appointment.business?.address
      }

      // Get appropriate template
      const message = type === '24h'
        ? SMSTemplates.appointmentReminder24h(templateData)
        : SMSTemplates.appointmentReminder2h(templateData)

      // Send SMS
      const result = await SMSService.sendSMS(phoneNumber, message)

      if (result.success) {
        // Deduct credit
        await deductCredits(businessId, 'sms', 1)

        // Mark reminder as sent
        const updateField = type === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent'
        await supabase
          .from('appointments')
          .update({
            [updateField]: true,
            [`${updateField}_at`]: new Date().toISOString()
          })
          .eq('id', appointment.id)

        console.log(`${type} reminder sent for appointment ${appointment.id}`)
      } else {
        console.error(`Failed to send ${type} reminder:`, result.error)
      }
    } catch (error) {
      console.error('Reminder sending error:', error)
    }
  }

  /**
   * Send birthday messages
   * Run this function via cron job once per day at 9 AM
   */
  static async sendBirthdayMessages(): Promise<void> {
    console.log('Running birthday message job...')

    try {
      // Get customers with birthdays today
      const today = new Date()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*, business:businesses(*)')
        .like('date_of_birth', `%-${month}-${day}`)
        .is('birthday_message_sent_this_year', false)

      if (error) {
        console.error('Error fetching birthday customers:', error)
        return
      }

      console.log(`Found ${customers?.length || 0} customers with birthdays today`)

      for (const customer of customers || []) {
        const businessId = customer.business_id
        const phoneNumber = customer.phone

        if (!phoneNumber) continue

        // Check compliance
        const complianceCheck = await TCPACompliance.canSendSMS(
          phoneNumber,
          businessId,
          customer.business?.timezone || 'America/New_York',
          'promotional'
        )

        if (!complianceCheck.allowed) {
          console.log(`Cannot send birthday SMS to ${phoneNumber}: ${complianceCheck.reason}`)
          continue
        }

        // Check credits
        const hasCredits = await hasEnoughCredits(businessId, 'sms', 1)
        if (!hasCredits) continue

        const templateData: SMSTemplateData = {
          customerName: customer.first_name || customer.name,
          businessName: customer.business?.name,
          discount: '20% OFF'
        }

        const message = SMSTemplates.birthdaySpecial(templateData)
        const result = await SMSService.sendSMS(phoneNumber, message)

        if (result.success) {
          await deductCredits(businessId, 'sms', 1)

          // Mark as sent this year
          await supabase
            .from('customers')
            .update({ birthday_message_sent_this_year: true })
            .eq('id', customer.id)

          console.log(`Birthday message sent to customer ${customer.id}`)
        }
      }
    } catch (error) {
      console.error('Birthday message job error:', error)
    }
  }

  /**
   * Send service reminder to customers who haven't visited in 30+ days
   * Run this function via cron job once per week
   */
  static async sendServiceReminders(): Promise<void> {
    console.log('Running service reminder job...')

    try {
      // Get customers with last visit 30-40 days ago (send once)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const fortyDaysAgo = new Date()
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40)

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*, business:businesses(*), appointments(appointment_date)')
        .gte('last_appointment_date', fortyDaysAgo.toISOString())
        .lte('last_appointment_date', thirtyDaysAgo.toISOString())
        .is('service_reminder_sent', false)

      if (error) {
        console.error('Error fetching customers for service reminders:', error)
        return
      }

      console.log(`Found ${customers?.length || 0} customers needing service reminders`)

      for (const customer of customers || []) {
        const businessId = customer.business_id
        const phoneNumber = customer.phone

        if (!phoneNumber) continue

        // Check compliance
        const complianceCheck = await TCPACompliance.canSendSMS(
          phoneNumber,
          businessId,
          customer.business?.timezone || 'America/New_York',
          'promotional'
        )

        if (!complianceCheck.allowed) continue

        // Check credits
        const hasCredits = await hasEnoughCredits(businessId, 'sms', 1)
        if (!hasCredits) continue

        const templateData: SMSTemplateData = {
          customerName: customer.first_name || customer.name,
          businessName: customer.business?.name,
          discount: '15% OFF'
        }

        const message = SMSTemplates.serviceReminder(templateData)
        const result = await SMSService.sendSMS(phoneNumber, message)

        if (result.success) {
          await deductCredits(businessId, 'sms', 1)

          await supabase
            .from('customers')
            .update({ service_reminder_sent: true })
            .eq('id', customer.id)

          console.log(`Service reminder sent to customer ${customer.id}`)
        }
      }
    } catch (error) {
      console.error('Service reminder job error:', error)
    }
  }

  /**
   * Send no-show follow-ups
   * Run this function via cron job once per day at 6 PM
   */
  static async sendNoShowFollowUps(): Promise<void> {
    console.log('Running no-show follow-up job...')

    try {
      // Get appointments marked as no-show today
      const today = new Date().toISOString().split('T')[0]

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(*),
          business:businesses(*)
        `)
        .eq('appointment_date', today)
        .eq('status', 'no-show')
        .is('no_show_followup_sent', false)

      if (error) {
        console.error('Error fetching no-show appointments:', error)
        return
      }

      console.log(`Found ${appointments?.length || 0} no-shows needing follow-up`)

      for (const appointment of appointments || []) {
        const businessId = appointment.business_id
        const phoneNumber = appointment.customer?.phone

        if (!phoneNumber) continue

        // Check compliance
        const complianceCheck = await TCPACompliance.canSendSMS(
          phoneNumber,
          businessId,
          appointment.business?.timezone || 'America/New_York',
          'transactional'
        )

        if (!complianceCheck.allowed) continue

        // Check credits
        const hasCredits = await hasEnoughCredits(businessId, 'sms', 1)
        if (!hasCredits) continue

        const templateData: SMSTemplateData = {
          customerName: appointment.customer?.first_name || appointment.customer?.name,
          businessName: appointment.business?.name,
          appointmentTime: appointment.start_time
        }

        const message = SMSTemplates.noShowFollowUp(templateData)
        const result = await SMSService.sendSMS(phoneNumber, message)

        if (result.success) {
          await deductCredits(businessId, 'sms', 1)

          await supabase
            .from('appointments')
            .update({
              no_show_followup_sent: true,
              no_show_followup_sent_at: new Date().toISOString()
            })
            .eq('id', appointment.id)

          console.log(`No-show follow-up sent for appointment ${appointment.id}`)
        }
      }
    } catch (error) {
      console.error('No-show follow-up job error:', error)
    }
  }
}
