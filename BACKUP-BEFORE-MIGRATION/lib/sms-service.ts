// SMS Service for VoiceFly Platform
// Integrates with Twilio, AWS SNS, and other SMS providers

interface SMSMessage {
  to: string
  message: string
  from?: string
  mediaUrls?: string[]
}

interface SMSOptions {
  scheduleTime?: Date
  trackDelivery?: boolean
  maxPrice?: number
}

interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
}

export class SMSService {
  private static accountSid = process.env.TWILIO_ACCOUNT_SID
  private static authToken = process.env.TWILIO_AUTH_TOKEN
  private static fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1-555-0100'
  private static provider = process.env.SMS_PROVIDER || 'twilio'

  static async sendSMS(
    to: string,
    message: string,
    options: SMSOptions = {}
  ): Promise<boolean> {
    try {
      // Validate phone number format
      const cleanPhone = this.formatPhoneNumber(to)
      if (!cleanPhone) {
        throw new Error(`Invalid phone number: ${to}`)
      }

      // Log SMS attempt
      console.log(`Sending SMS to ${cleanPhone}: ${message.substring(0, 50)}...`)

      // In production, integrate with actual SMS service
      if (this.provider === 'twilio') {
        return await this.sendWithTwilio(cleanPhone, message, options)
      } else if (this.provider === 'aws') {
        return await this.sendWithAWS(cleanPhone, message, options)
      }

      // Fallback for development
      console.log('SMS sent successfully (development mode)')
      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }

  static async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any> = {},
    options: SMSOptions = {}
  ): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) {
        throw new Error(`SMS template ${templateId} not found`)
      }

      let message = template.content

      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`
        message = message.replace(new RegExp(placeholder, 'g'), value)
      }

      return await this.sendSMS(to, message, options)
    } catch (error) {
      console.error('Failed to send template SMS:', error)
      return false
    }
  }

  // Appointment-related SMS
  static async sendAppointmentConfirmation(appointmentData: any): Promise<boolean> {
    const message = `Hi ${appointmentData.customer.first_name}! Your appointment with ${appointmentData.business?.name || 'us'} is confirmed for ${new Date(appointmentData.scheduled_at).toLocaleDateString()} at ${new Date(appointmentData.scheduled_at).toLocaleTimeString()}. Reply STOP to opt out.`

    return await this.sendSMS(appointmentData.customer.phone, message)
  }

  static async sendAppointmentReminder(appointmentData: any): Promise<boolean> {
    const appointmentTime = new Date(appointmentData.scheduled_at)
    const timeStr = appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const message = `Reminder: You have an appointment tomorrow at ${timeStr} with ${appointmentData.business?.name || 'us'}. Reply CONFIRM to confirm or CANCEL to cancel. Reply STOP to opt out.`

    return await this.sendSMS(appointmentData.customer.phone, message)
  }

  static async sendCancellationNotice(appointmentData: any, reason?: string): Promise<boolean> {
    const appointmentTime = new Date(appointmentData.scheduled_at)
    const dateStr = appointmentTime.toLocaleDateString()
    const timeStr = appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    let message = `Your appointment on ${dateStr} at ${timeStr} has been cancelled.`
    if (reason) {
      message += ` Reason: ${reason}.`
    }
    message += ` To reschedule, please contact us. Reply STOP to opt out.`

    return await this.sendSMS(appointmentData.customer.phone, message)
  }

  static async sendAppointmentRescheduled(appointmentData: any): Promise<boolean> {
    const newTime = new Date(appointmentData.scheduled_at)
    const dateStr = newTime.toLocaleDateString()
    const timeStr = newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const message = `Your appointment has been rescheduled to ${dateStr} at ${timeStr}. Please confirm by replying YES. Reply STOP to opt out.`

    return await this.sendSMS(appointmentData.customer.phone, message)
  }

  // Lead follow-up SMS
  static async sendLeadFollowUp(leadData: any, message: string): Promise<boolean> {
    const personalizedMessage = `Hi ${leadData.first_name}, ${message} Reply STOP to opt out.`
    return await this.sendSMS(leadData.phone, personalizedMessage)
  }

  static async sendDemoInvitation(leadData: any): Promise<boolean> {
    const message = `Hi ${leadData.first_name}! Ready to see Maya, our voice AI assistant, in action? Book your free demo at ${process.env.NEXT_PUBLIC_APP_URL}/demo?lead=${leadData.id}. Reply STOP to opt out.`
    return await this.sendSMS(leadData.phone, message)
  }

  // Campaign SMS
  static async sendCampaignMessage(recipientData: any, campaignMessage: string): Promise<boolean> {
    let message = campaignMessage

    // Replace common variables
    message = message.replace(/{{first_name}}/g, recipientData.first_name || '')
    message = message.replace(/{{last_name}}/g, recipientData.last_name || '')
    message = message.replace(/{{company}}/g, recipientData.company || '')

    // Ensure opt-out compliance
    if (!message.includes('STOP')) {
      message += ' Reply STOP to opt out.'
    }

    return await this.sendSMS(recipientData.phone, message)
  }

  // Payment and billing SMS
  static async sendPaymentReminder(customerData: any, amount: number, dueDate: Date): Promise<boolean> {
    const dueDateStr = dueDate.toLocaleDateString()
    const message = `Hi ${customerData.first_name}, your payment of $${(amount / 100).toFixed(2)} is due on ${dueDateStr}. Pay online at ${process.env.NEXT_PUBLIC_APP_URL}/pay. Reply STOP to opt out.`

    return await this.sendSMS(customerData.phone, message)
  }

  static async sendPaymentConfirmation(paymentData: any): Promise<boolean> {
    const amount = (paymentData.total_amount / 100).toFixed(2)
    const message = `Payment confirmed! $${amount} received. Thank you for your business! Reply STOP to opt out.`

    return await this.sendSMS(paymentData.customer.phone, message)
  }

  // Utility methods
  static formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')

    // Handle various phone number formats
    if (digits.length === 10) {
      return `+1${digits}` // US number without country code
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}` // US number with country code
    } else if (digits.length > 11) {
      return `+${digits}` // International number
    }

    return null // Invalid format
  }

  static async handleIncomingSMS(from: string, message: string): Promise<void> {
    try {
      const cleanPhone = this.formatPhoneNumber(from)
      if (!cleanPhone) return

      const lowerMessage = message.toLowerCase().trim()

      // Handle opt-out requests
      if (lowerMessage === 'stop' || lowerMessage === 'unsubscribe') {
        await this.handleOptOut(cleanPhone)
        return
      }

      // Handle appointment confirmations
      if (lowerMessage === 'confirm' || lowerMessage === 'yes') {
        await this.handleAppointmentConfirmation(cleanPhone)
        return
      }

      // Handle appointment cancellations
      if (lowerMessage === 'cancel' || lowerMessage === 'no') {
        await this.handleAppointmentCancellation(cleanPhone)
        return
      }

      // Log unhandled message
      console.log(`Unhandled SMS from ${cleanPhone}: ${message}`)
    } catch (error) {
      console.error('Error handling incoming SMS:', error)
    }
  }

  // Private methods for different SMS providers
  private static async sendWithTwilio(
    to: string,
    message: string,
    options: SMSOptions
  ): Promise<boolean> {
    // In production, implement Twilio API integration
    console.log('Twilio SMS sent:', { to, message: message.substring(0, 50) + '...' })
    return true
  }

  private static async sendWithAWS(
    to: string,
    message: string,
    options: SMSOptions
  ): Promise<boolean> {
    // In production, implement AWS SNS integration
    console.log('AWS SNS SMS sent:', { to, message: message.substring(0, 50) + '...' })
    return true
  }

  private static async getTemplate(templateId: string): Promise<SMSTemplate | null> {
    // In production, fetch from database
    const templates: Record<string, SMSTemplate> = {
      appointment_reminder: {
        id: 'appointment_reminder',
        name: 'Appointment Reminder',
        content: 'Hi {{customer_name}}! Reminder: You have an appointment tomorrow at {{time}}.',
        variables: ['customer_name', 'time']
      },
      payment_reminder: {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        content: 'Hi {{customer_name}}, your payment of ${{amount}} is due {{due_date}}.',
        variables: ['customer_name', 'amount', 'due_date']
      }
    }

    return templates[templateId] || null
  }

  private static async handleOptOut(phone: string): Promise<void> {
    // In production, update database to mark phone as opted out
    console.log(`Phone ${phone} opted out of SMS`)
  }

  private static async handleAppointmentConfirmation(phone: string): Promise<void> {
    // In production, find and confirm appointment for this phone number
    console.log(`Appointment confirmed for ${phone}`)
  }

  private static async handleAppointmentCancellation(phone: string): Promise<void> {
    // In production, find and cancel appointment for this phone number
    console.log(`Appointment cancelled for ${phone}`)
  }
}