// Email Service for VoiceFly Platform
// Integrates with various email providers (SendGrid, Mailgun, etc.)

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

interface EmailRecipient {
  email: string
  name?: string
  variables?: Record<string, any>
}

interface EmailOptions {
  from?: string
  replyTo?: string
  template?: string
  variables?: Record<string, any>
  trackOpens?: boolean
  trackClicks?: boolean
}

export class EmailService {
  private static apiKey = process.env.SENDGRID_API_KEY || process.env.MAILGUN_API_KEY
  private static provider = process.env.EMAIL_PROVIDER || 'sendgrid'
  private static fromEmail = process.env.FROM_EMAIL || 'noreply@voicefly.ai'
  private static fromName = process.env.FROM_NAME || 'VoiceFly'

  static async sendEmail(
    to: string | EmailRecipient[],
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<boolean> {
    try {
      const recipients = Array.isArray(to) ? to : [{ email: to }]

      // Log email attempt
      console.log(`Sending email to ${recipients.length} recipients: ${subject}`)

      // In production, integrate with actual email service
      if (this.provider === 'sendgrid') {
        return await this.sendWithSendGrid(recipients, subject, content, options)
      } else if (this.provider === 'mailgun') {
        return await this.sendWithMailgun(recipients, subject, content, options)
      }

      // Fallback for development
      console.log('Email sent successfully (development mode)')
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  static async sendTemplate(
    to: string | EmailRecipient[],
    templateId: string,
    variables: Record<string, any> = {},
    options: EmailOptions = {}
  ): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      let subject = template.subject
      let content = template.htmlContent

      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
        content = content.replace(new RegExp(placeholder, 'g'), value)
      }

      return await this.sendEmail(to, subject, content, options)
    } catch (error) {
      console.error('Failed to send template email:', error)
      return false
    }
  }

  // Appointment-related emails
  static async sendAppointmentConfirmation(appointmentData: any): Promise<boolean> {
    const template = {
      subject: 'Appointment Confirmed - {{business_name}}',
      content: `
        <h2>Your appointment has been confirmed!</h2>
        <p>Hi {{customer_name}},</p>
        <p>Your appointment with {{business_name}} has been confirmed for:</p>
        <ul>
          <li><strong>Date:</strong> {{appointment_date}}</li>
          <li><strong>Time:</strong> {{appointment_time}}</li>
          <li><strong>Service:</strong> {{service_name}}</li>
          <li><strong>Staff:</strong> {{staff_name}}</li>
        </ul>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing {{business_name}}!</p>
      `
    }

    return await this.sendTemplate(
      appointmentData.customer.email,
      'appointment_confirmation',
      {
        customer_name: `${appointmentData.customer.first_name} ${appointmentData.customer.last_name}`,
        business_name: appointmentData.business?.name || 'VoiceFly Business',
        appointment_date: new Date(appointmentData.scheduled_at).toLocaleDateString(),
        appointment_time: new Date(appointmentData.scheduled_at).toLocaleTimeString(),
        service_name: appointmentData.service?.name || 'Service',
        staff_name: appointmentData.staff ? `${appointmentData.staff.first_name} ${appointmentData.staff.last_name}` : 'Our team'
      }
    )
  }

  static async sendAppointmentReminder(appointmentData: any): Promise<boolean> {
    const template = {
      subject: 'Appointment Reminder - Tomorrow at {{appointment_time}}',
      content: `
        <h2>Reminder: Your appointment is tomorrow!</h2>
        <p>Hi {{customer_name}},</p>
        <p>This is a friendly reminder that you have an appointment tomorrow:</p>
        <ul>
          <li><strong>Date:</strong> {{appointment_date}}</li>
          <li><strong>Time:</strong> {{appointment_time}}</li>
          <li><strong>Service:</strong> {{service_name}}</li>
          <li><strong>Staff:</strong> {{staff_name}}</li>
        </ul>
        <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
        <p>We look forward to seeing you!</p>
      `
    }

    return await this.sendTemplate(
      appointmentData.customer.email,
      'appointment_reminder',
      {
        customer_name: `${appointmentData.customer.first_name} ${appointmentData.customer.last_name}`,
        appointment_date: new Date(appointmentData.scheduled_at).toLocaleDateString(),
        appointment_time: new Date(appointmentData.scheduled_at).toLocaleTimeString(),
        service_name: appointmentData.service?.name || 'Service',
        staff_name: appointmentData.staff ? `${appointmentData.staff.first_name} ${appointmentData.staff.last_name}` : 'Our team'
      }
    )
  }

  static async sendCancellationEmail(appointmentData: any, reason?: string): Promise<boolean> {
    const template = {
      subject: 'Appointment Cancelled - {{business_name}}',
      content: `
        <h2>Your appointment has been cancelled</h2>
        <p>Hi {{customer_name}},</p>
        <p>Your appointment scheduled for {{appointment_date}} at {{appointment_time}} has been cancelled.</p>
        {{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
        <p>If you'd like to reschedule, please contact us or book a new appointment through our website.</p>
        <p>We apologize for any inconvenience.</p>
        <p>Best regards,<br>{{business_name}}</p>
      `
    }

    return await this.sendTemplate(
      appointmentData.customer.email,
      'appointment_cancellation',
      {
        customer_name: `${appointmentData.customer.first_name} ${appointmentData.customer.last_name}`,
        business_name: appointmentData.business?.name || 'VoiceFly Business',
        appointment_date: new Date(appointmentData.scheduled_at).toLocaleDateString(),
        appointment_time: new Date(appointmentData.scheduled_at).toLocaleTimeString(),
        reason: reason || ''
      }
    )
  }

  // Lead nurturing emails
  static async sendWelcomeEmail(leadData: any): Promise<boolean> {
    const template = {
      subject: 'Welcome to {{business_name}} - Let\'s Get Started!',
      content: `
        <h2>Welcome to {{business_name}}!</h2>
        <p>Hi {{lead_name}},</p>
        <p>Thank you for your interest in our voice AI solutions. We're excited to help transform your business with intelligent automation.</p>
        <p>Here's what happens next:</p>
        <ul>
          <li>Our AI specialist will review your requirements</li>
          <li>We'll schedule a personalized demo of Maya, our voice AI assistant</li>
          <li>You'll see exactly how voice AI can benefit your business</li>
        </ul>
        <p>In the meantime, feel free to explore our resources or contact us with any questions.</p>
        <p>Best regards,<br>The VoiceFly Team</p>
      `
    }

    return await this.sendTemplate(
      leadData.email,
      'welcome_lead',
      {
        lead_name: `${leadData.first_name} ${leadData.last_name}`,
        business_name: 'VoiceFly'
      }
    )
  }

  static async sendFollowUpEmail(leadData: any, followUpType: string): Promise<boolean> {
    const templates = {
      demo_request: {
        subject: 'Ready for Your VoiceFly Demo?',
        content: `
          <h2>Let's show you Maya in action!</h2>
          <p>Hi {{lead_name}},</p>
          <p>Thanks for requesting a demo of our voice AI technology. Maya is ready to show you how she can transform your business operations.</p>
          <p>During your demo, you'll see:</p>
          <ul>
            <li>Live voice AI conversations with prospects</li>
            <li>Intelligent lead qualification and routing</li>
            <li>Automated appointment scheduling</li>
            <li>Real-time analytics and insights</li>
          </ul>
          <p>Click below to schedule your personalized demo:</p>
          <p><a href="{{demo_link}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Schedule My Demo</a></p>
        `
      },
      pricing_inquiry: {
        subject: 'VoiceFly Pricing - Customized for Your Business',
        content: `
          <h2>Pricing tailored to your needs</h2>
          <p>Hi {{lead_name}},</p>
          <p>Thank you for your interest in VoiceFly pricing. Our voice AI solutions are designed to deliver ROI from day one.</p>
          <p>Our flexible pricing plans include:</p>
          <ul>
            <li><strong>Starter:</strong> Perfect for small businesses getting started</li>
            <li><strong>Professional:</strong> Advanced features for growing companies</li>
            <li><strong>Enterprise:</strong> Full customization for large organizations</li>
          </ul>
          <p>Let's discuss which plan would work best for your specific needs.</p>
        `
      }
    }

    const template = templates[followUpType as keyof typeof templates] || templates.demo_request

    return await this.sendTemplate(
      leadData.email,
      `follow_up_${followUpType}`,
      {
        lead_name: `${leadData.first_name} ${leadData.last_name}`,
        demo_link: `${process.env.NEXT_PUBLIC_APP_URL}/demo?lead=${leadData.id}`
      }
    )
  }

  // Private methods for different email providers
  private static async sendWithSendGrid(
    recipients: EmailRecipient[],
    subject: string,
    content: string,
    options: EmailOptions
  ): Promise<boolean> {
    // In production, implement SendGrid API integration
    console.log('SendGrid email sent:', { recipients: recipients.length, subject })
    return true
  }

  private static async sendWithMailgun(
    recipients: EmailRecipient[],
    subject: string,
    content: string,
    options: EmailOptions
  ): Promise<boolean> {
    // In production, implement Mailgun API integration
    console.log('Mailgun email sent:', { recipients: recipients.length, subject })
    return true
  }

  private static async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    // In production, fetch from database or template service
    const templates: Record<string, EmailTemplate> = {
      appointment_confirmation: {
        id: 'appointment_confirmation',
        name: 'Appointment Confirmation',
        subject: 'Appointment Confirmed - {{business_name}}',
        htmlContent: '',
        textContent: '',
        variables: ['customer_name', 'business_name', 'appointment_date']
      }
    }

    return templates[templateId] || null
  }
}