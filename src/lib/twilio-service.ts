import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface SMSResult {
  success: boolean
  messageId?: string
  status?: string
  error?: string
}

export interface SMSTemplateData {
  customerName?: string
  businessName?: string
  appointmentDate?: string
  appointmentTime?: string
  serviceName?: string
  servicePrice?: string
  location?: string
  confirmationCode?: string
  cancelUrl?: string
  rescheduleUrl?: string
}

export class TwilioService {
  /**
   * Send a basic SMS message
   */
  static async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        return {
          success: false,
          error: 'Twilio not configured. Missing required environment variables.'
        }
      }

      console.log('📱 Sending SMS:', { to, messagePreview: message.substring(0, 50) + '...' })

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      })

      console.log('✅ SMS sent successfully:', result.sid)

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      }
    } catch (error: any) {
      console.error('❌ SMS sending error:', error)
      return {
        success: false,
        error: error.message || 'SMS sending failed'
      }
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  static async sendAppointmentConfirmation(
    customerPhone: string,
    templateData: SMSTemplateData
  ): Promise<SMSResult> {
    const message = `✨ Appointment Confirmed!

${templateData.businessName}
📅 ${templateData.appointmentDate} at ${templateData.appointmentTime}
💅 ${templateData.serviceName}${templateData.servicePrice ? ' - $' + templateData.servicePrice : ''}
📍 ${templateData.location || 'Main Location'}

Confirmation: ${templateData.confirmationCode}

Reply CANCEL to cancel or call us with questions.

Thank you for choosing ${templateData.businessName}! 💖`

    const result = await this.sendSMS(customerPhone, message)

    // Log SMS in database
    if (result.success) {
      await this.logSMS(customerPhone, 'confirmation', message, result.messageId!)
    }

    return result
  }

  /**
   * Send appointment reminder SMS
   */
  static async sendAppointmentReminder(
    customerPhone: string,
    templateData: SMSTemplateData,
    hoursBeforeAppointment: number = 24
  ): Promise<SMSResult> {
    const reminderTime = hoursBeforeAppointment === 24 ? 'tomorrow' : `in ${hoursBeforeAppointment} hours`
    
    const message = `⏰ Reminder: Your appointment at ${templateData.businessName} is ${reminderTime} at ${templateData.appointmentTime}.

💅 Service: ${templateData.serviceName}
📍 ${templateData.location || 'Main Location'}

We're excited to see you! ✨

Reply RESCHEDULE if you need to change your appointment.`

    const result = await this.sendSMS(customerPhone, message)

    // Log SMS in database
    if (result.success) {
      await this.logSMS(customerPhone, 'reminder', message, result.messageId!)
    }

    return result
  }

  /**
   * Send appointment cancellation confirmation
   */
  static async sendCancellationConfirmation(
    customerPhone: string,
    templateData: SMSTemplateData
  ): Promise<SMSResult> {
    const message = `❌ Appointment Cancelled

Your appointment at ${templateData.businessName} on ${templateData.appointmentDate} at ${templateData.appointmentTime} has been cancelled.

We're sorry to see you go! Book again anytime at ${process.env.NEXT_PUBLIC_APP_URL || 'our website'}.

Thank you! 💖`

    const result = await this.sendSMS(customerPhone, message)

    // Log SMS in database
    if (result.success) {
      await this.logSMS(customerPhone, 'cancellation', message, result.messageId!)
    }

    return result
  }

  /**
   * Send booking available notification
   */
  static async sendBookingAvailableNotification(
    customerPhone: string,
    templateData: SMSTemplateData
  ): Promise<SMSResult> {
    const message = `🎉 Great news! We have an opening for you:

${templateData.businessName}
📅 ${templateData.appointmentDate} at ${templateData.appointmentTime}
💅 ${templateData.serviceName}

Book now: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}/book

This spot won't last long! ⏰`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'availability', message, result.messageId!)
    }

    return result
  }

  /**
   * Send payment receipt SMS
   */
  static async sendPaymentReceipt(
    customerPhone: string,
    templateData: SMSTemplateData & { amount: string; paymentMethod: string }
  ): Promise<SMSResult> {
    const message = `🧾 Payment Receipt

${templateData.businessName}
💰 Amount: $${templateData.amount}
💳 Payment: ${templateData.paymentMethod}
🗓️ Service: ${templateData.serviceName} on ${templateData.appointmentDate}

Thank you for your payment! Your appointment is confirmed. 💖`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'receipt', message, result.messageId!)
    }

    return result
  }

  /**
   * Send promotional SMS
   */
  static async sendPromotionalMessage(
    customerPhone: string,
    templateData: SMSTemplateData & { promoCode?: string; discount?: string; expiryDate?: string }
  ): Promise<SMSResult> {
    const message = `🎁 Special Offer Just For You!

${templateData.discount ? templateData.discount + ' OFF' : 'Special Discount'} your next appointment at ${templateData.businessName}!

${templateData.promoCode ? `Code: ${templateData.promoCode}` : ''}
${templateData.expiryDate ? `Valid until: ${templateData.expiryDate}` : ''}

Book now: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}/book

Terms apply. One-time use. 💅✨

Reply STOP to opt out of promotions.`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'promotional', message, result.messageId!)
    }

    return result
  }

  /**
   * Send appointment rescheduled notification
   */
  static async sendRescheduleConfirmation(
    customerPhone: string,
    templateData: SMSTemplateData & { oldDate?: string; oldTime?: string }
  ): Promise<SMSResult> {
    const message = `🔄 Appointment Rescheduled

Your appointment has been moved:

FROM: ${templateData.oldDate} at ${templateData.oldTime}
TO: ${templateData.appointmentDate} at ${templateData.appointmentTime}

💅 Service: ${templateData.serviceName}
📍 ${templateData.location || 'Main Location'}

See you then! ✨`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'reschedule', message, result.messageId!)
    }

    return result
  }

  /**
   * Send welcome message for new customers
   */
  static async sendWelcomeMessage(
    customerPhone: string,
    templateData: SMSTemplateData
  ): Promise<SMSResult> {
    const message = `👋 Welcome to ${templateData.businessName}!

Thank you for choosing us for your beauty needs. We're excited to pamper you!

💅 Book anytime: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}/book
📞 Questions? Just reply to this message
🎁 First-time customer? Ask about our welcome discount!

Welcome to the family! 💖`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'welcome', message, result.messageId!)
    }

    return result
  }

  /**
   * Send loyalty points notification
   */
  static async sendLoyaltyPointsUpdate(
    customerPhone: string,
    templateData: SMSTemplateData & { pointsEarned?: number; totalPoints?: number; nextReward?: string }
  ): Promise<SMSResult> {
    const message = `🎯 Loyalty Points Update!

You earned ${templateData.pointsEarned} points from your recent visit to ${templateData.businessName}!

💎 Total Points: ${templateData.totalPoints}
🎁 Next Reward: ${templateData.nextReward || 'Coming soon!'}

Keep visiting to earn more rewards! 💖`

    const result = await this.sendSMS(customerPhone, message)

    if (result.success) {
      await this.logSMS(customerPhone, 'loyalty', message, result.messageId!)
    }

    return result
  }

  /**
   * Handle incoming SMS (webhook handler)
   */
  static async handleIncomingSMS(from: string, body: string): Promise<{ success: boolean; response?: string; action?: string }> {
    try {
      console.log('📱 Incoming SMS:', { from, body })

      const normalizedBody = body.toLowerCase().trim()

      // Handle common responses
      if (normalizedBody.includes('cancel')) {
        return {
          success: true,
          response: 'We understand you need to cancel. Please call us to confirm your cancellation and avoid any fees.',
          action: 'cancel_request'
        }
      }

      if (normalizedBody.includes('reschedule')) {
        return {
          success: true,
          response: 'We\'d be happy to reschedule! Please call us or visit our website to choose a new time.',
          action: 'reschedule_request'
        }
      }

      if (normalizedBody.includes('confirm')) {
        return {
          success: true,
          response: 'Perfect! Your appointment is confirmed. We look forward to seeing you!',
          action: 'confirmation'
        }
      }

      if (normalizedBody.includes('stop') || normalizedBody.includes('unsubscribe')) {
        return {
          success: true,
          response: 'You have been unsubscribed from promotional messages. You will still receive appointment confirmations.',
          action: 'unsubscribe'
        }
      }

      // Default response for unrecognized messages
      return {
        success: true,
        response: 'Thanks for your message! For immediate assistance, please call us. We\'ll get back to you soon!',
        action: 'general_inquiry'
      }

    } catch (error: any) {
      console.error('❌ Error handling incoming SMS:', error)
      return {
        success: false
      }
    }
  }

  /**
   * Log SMS messages to database for tracking
   */
  private static async logSMS(
    to: string, 
    type: string, 
    message: string, 
    messageId: string,
    businessId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('sms_logs')
        .insert({
          business_id: businessId,
          recipient_phone: to,
          message_type: type,
          message_content: message,
          twilio_message_id: messageId,
          sent_at: new Date().toISOString(),
          status: 'sent'
        })

      console.log('📝 SMS logged in database:', { type, to, messageId })
    } catch (error) {
      console.error('❌ Error logging SMS:', error)
      // Don't fail the SMS sending if logging fails
    }
  }

  /**
   * Get SMS statistics for a business
   */
  static async getSMSStats(businessId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('sms_logs')
        .select('message_type, sent_at, status')
        .eq('business_id', businessId)
        .gte('sent_at', startDate.toISOString())

      if (error) {
        console.error('❌ Error fetching SMS stats:', error)
        return null
      }

      // Calculate statistics
      const stats = {
        total_sent: data.length,
        by_type: {} as Record<string, number>,
        by_day: {} as Record<string, number>,
        success_rate: 0
      }

      data.forEach(log => {
        // Count by type
        stats.by_type[log.message_type] = (stats.by_type[log.message_type] || 0) + 1
        
        // Count by day
        const day = new Date(log.sent_at).toISOString().split('T')[0]
        stats.by_day[day] = (stats.by_day[day] || 0) + 1
      })

      stats.success_rate = data.filter(log => log.status === 'sent').length / data.length * 100

      return stats
    } catch (error) {
      console.error('❌ Error calculating SMS stats:', error)
      return null
    }
  }

  /**
   * Test Twilio connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string; phoneNumber?: string }> {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return {
          success: false,
          error: 'Twilio credentials not configured'
        }
      }

      // Try to fetch account information
      const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID || '').fetch()
      
      return {
        success: true,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Twilio connection failed'
      }
    }
  }
}