// Defensive import to avoid build-time errors
let twilio: any = null;
let client: any = null;

try {
  // Only import Twilio if needed (not at build time)
  if (typeof window === 'undefined' && process.env.TWILIO_ACCOUNT_SID) {
    twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    client = accountSid && authToken ? twilio(accountSid, authToken) : null;
  }
} catch (error) {
  console.log('Twilio not available:', error.message);
}

const fromNumber = process.env.TWILIO_PHONE_NUMBER

export class SMSService {
  static async sendSMS(to: string, message: string) {
    if (!client || !fromNumber) {
      console.log('Twilio not configured, SMS not sent:', { to, message })
      return { success: false, error: 'Twilio not configured' }
    }

    try {
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to
      })
      console.log('SMS sent successfully:', result.sid)
      return { success: true, sid: result.sid }
    } catch (error) {
      console.error('SMS failed:', error)
      return { success: false, error: error.message }
    }
  }

  static async sendCancellationNotice(appointment: any) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    
    const message = `Hi ${customerName}, your appointment at ${businessName} on ${appointmentDate} at ${startTime} has been cancelled. We apologize for any inconvenience. Please call us to reschedule!`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  static async sendRescheduleNotice(appointment: any, oldDateTime?: { date: string, time: string }) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const newDate = new Date(appointment.appointment_date).toLocaleDateString()
    const newTime = appointment.start_time || 'your new time'
    
    let message = `Hi ${customerName}, your appointment at ${businessName} has been rescheduled to ${newDate} at ${newTime}.`
    
    if (oldDateTime) {
      message = `Hi ${customerName}, your appointment at ${businessName} on ${oldDateTime.date} at ${oldDateTime.time} has been rescheduled to ${newDate} at ${newTime}.`
    }
    
    message += ` Thank you for your understanding!`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  static async sendReminder(appointment: any) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    
    const message = `Reminder: Hi ${customerName}! You have an appointment at ${businessName} tomorrow (${appointmentDate}) at ${startTime} for ${serviceName}. See you soon! Reply CANCEL to cancel.`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  static async sendAppointmentConfirmation(appointment: any) {
    // This is handled by n8n post-booking, but keeping for completeness
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    
    const message = `Hi ${customerName}! Your appointment at ${businessName} is confirmed for ${appointmentDate} at ${startTime} for ${serviceName}. We look forward to seeing you!`
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  static async sendStatusUpdate(appointment: any, status: string) {
    const businessName = appointment.business?.name || 'your salon'
    const customerName = appointment.customer?.first_name || 'there'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    
    let message = ''
    
    switch (status) {
      case 'confirmed':
        message = `Hi ${customerName}! Your appointment at ${businessName} on ${appointmentDate} at ${startTime} is now confirmed. See you then!`
        break
      case 'completed':
        message = `Thank you ${customerName}! Your appointment at ${businessName} is complete. We hope you love your new look! Please rate your experience.`
        break
      case 'no-show':
        message = `Hi ${customerName}, you missed your appointment at ${businessName} today. Please call us to reschedule. We hope everything is okay!`
        break
      default:
        message = `Hi ${customerName}, your appointment status at ${businessName} has been updated. Please call if you have questions.`
    }
    
    return this.sendSMS(appointment.customer?.phone, message)
  }

  static formatPhoneNumber(phone: string): string {
    // Ensure phone is in E.164 format (+1XXXXXXXXXX)
    if (!phone) return ''
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // If it's a 10-digit US number, add +1
    if (digits.length === 10) {
      return `+1${digits}`
    }
    
    // If it's 11 digits starting with 1, add +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone
    }
    
    // Default case
    return `+1${digits}`
  }
}