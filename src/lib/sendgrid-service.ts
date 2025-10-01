import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailTemplateData {
  customerName?: string
  businessName?: string
  appointmentDate?: string
  appointmentTime?: string
  serviceName?: string
  servicePrice?: string
  location?: string
  confirmationCode?: string
  amount?: string
  paymentMethod?: string
  promoCode?: string
  discount?: string
  expiryDate?: string
  cancelUrl?: string
  rescheduleUrl?: string
  reviewUrl?: string
  websiteUrl?: string
}

export interface EmailAttachment {
  content: string // Base64 encoded content
  filename: string
  type: string // MIME type
  disposition?: 'attachment' | 'inline'
  contentId?: string // For inline images
}

export class SendGridService {
  /**
   * Send a basic email
   */
  static async sendEmail(
    to: string,
    subject: string,
    content: string,
    isHtml: boolean = true,
    attachments?: EmailAttachment[]
  ): Promise<EmailResult> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          error: 'SendGrid not configured. Missing SENDGRID_API_KEY.'
        }
      }

      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yoursalon.com'
      const fromName = process.env.SENDGRID_FROM_NAME || 'Your Nail Salon'

      console.log('📧 Sending email:', { to, subject, fromEmail })

      const msg: any = {
        to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject,
        [isHtml ? 'html' : 'text']: content
      }

      if (attachments && attachments.length > 0) {
        msg.attachments = attachments
      }

      const response = await sgMail.send(msg)
      
      console.log('✅ Email sent successfully:', response[0].headers['x-message-id'])

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      }
    } catch (error: any) {
      console.error('❌ Email sending error:', error)
      
      let errorMessage = 'Email sending failed'
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Send appointment confirmation email
   */
  static async sendAppointmentConfirmation(
    customerEmail: string,
    templateData: EmailTemplateData
  ): Promise<EmailResult> {
    const subject = `✨ Appointment Confirmed - ${templateData.businessName}`
    
    const htmlContent = this.generateAppointmentConfirmationHTML(templateData)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'appointment_confirmation', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send appointment reminder email
   */
  static async sendAppointmentReminder(
    customerEmail: string,
    templateData: EmailTemplateData,
    hoursBeforeAppointment: number = 24
  ): Promise<EmailResult> {
    const reminderTime = hoursBeforeAppointment === 24 ? 'Tomorrow' : `In ${hoursBeforeAppointment} hours`
    const subject = `⏰ ${reminderTime}: Your appointment at ${templateData.businessName}`
    
    const htmlContent = this.generateAppointmentReminderHTML(templateData, hoursBeforeAppointment)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'appointment_reminder', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send welcome email for new customers
   */
  static async sendWelcomeEmail(
    customerEmail: string,
    templateData: EmailTemplateData
  ): Promise<EmailResult> {
    const subject = `👋 Welcome to ${templateData.businessName}!`
    
    const htmlContent = this.generateWelcomeEmailHTML(templateData)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'welcome', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send payment receipt email
   */
  static async sendPaymentReceipt(
    customerEmail: string,
    templateData: EmailTemplateData & { amount: string; paymentMethod: string }
  ): Promise<EmailResult> {
    const subject = `🧾 Payment Receipt - ${templateData.businessName}`
    
    const htmlContent = this.generatePaymentReceiptHTML(templateData)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'payment_receipt', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send promotional email
   */
  static async sendPromotionalEmail(
    customerEmail: string,
    templateData: EmailTemplateData & { campaignName?: string }
  ): Promise<EmailResult> {
    const subject = `🎁 Special Offer: ${templateData.discount || 'Save'} at ${templateData.businessName}`
    
    const htmlContent = this.generatePromotionalEmailHTML(templateData)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'promotional', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send review request email
   */
  static async sendReviewRequest(
    customerEmail: string,
    templateData: EmailTemplateData
  ): Promise<EmailResult> {
    const subject = `⭐ How was your experience at ${templateData.businessName}?`
    
    const htmlContent = this.generateReviewRequestHTML(templateData)
    const result = await this.sendEmail(customerEmail, subject, htmlContent, true)

    if (result.success) {
      await this.logEmail(customerEmail, 'review_request', subject, result.messageId!)
    }

    return result
  }

  /**
   * Send email campaign to multiple recipients
   */
  static async sendEmailCampaign(
    recipients: { email: string; customerData?: EmailTemplateData }[],
    subject: string,
    htmlContent: string,
    campaignId?: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    console.log(`📧 Starting email campaign to ${recipients.length} recipients`)

    for (const recipient of recipients) {
      try {
        // Personalize content if customer data provided
        let personalizedContent = htmlContent
        let personalizedSubject = subject

        if (recipient.customerData) {
          personalizedContent = this.personalizeContent(htmlContent, recipient.customerData)
          personalizedSubject = this.personalizeContent(subject, recipient.customerData)
        }

        const result = await this.sendEmail(recipient.email, personalizedSubject, personalizedContent, true)
        
        if (result.success) {
          results.sent++
          
          // Log campaign email
          await this.logEmail(
            recipient.email, 
            'campaign', 
            personalizedSubject, 
            result.messageId!, 
            campaignId
          )
        } else {
          results.failed++
          results.errors.push(`${recipient.email}: ${result.error}`)
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        results.failed++
        results.errors.push(`${recipient.email}: ${error.message}`)
      }
    }

    console.log(`📊 Campaign complete: ${results.sent} sent, ${results.failed} failed`)
    return results
  }

  /**
   * Generate HTML templates
   */
  private static generateAppointmentConfirmationHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #ff6b9d, #ff8e9b); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .appointment-card { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ff6b9d; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .emoji { font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">✨</div>
            <h1>Appointment Confirmed!</h1>
            <p>We're excited to pamper you!</p>
        </div>
        
        <div class="content">
            <h2>Hello ${data.customerName || 'Beautiful'}!</h2>
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div class="appointment-card">
                <h3>📅 Appointment Details</h3>
                <p><strong>Date:</strong> ${data.appointmentDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                <p><strong>Service:</strong> ${data.serviceName}</p>
                ${data.servicePrice ? `<p><strong>Price:</strong> $${data.servicePrice}</p>` : ''}
                <p><strong>Location:</strong> ${data.location || 'Main Location'}</p>
                <p><strong>Confirmation Code:</strong> #${data.confirmationCode}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${data.rescheduleUrl ? `<a href="${data.rescheduleUrl}" class="button">Reschedule</a>` : ''}
                ${data.cancelUrl ? `<a href="${data.cancelUrl}" class="button" style="background-color: #dc3545;">Cancel</a>` : ''}
            </div>

            <p>We can't wait to see you! If you have any questions, just reply to this email.</p>
            
            <p>Best regards,<br>
            The ${data.businessName} team 💅</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
            <p>${data.websiteUrl ? `<a href="${data.websiteUrl}">Visit our website</a>` : ''}</p>
        </div>
    </div>
</body>
</html>`
  }

  private static generateWelcomeEmailHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome!</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #ff6b9d, #ff8e9b); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .welcome-card { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ff6b9d; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .emoji { font-size: 36px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">👋</div>
            <h1>Welcome to ${data.businessName}!</h1>
            <p>Your journey to beautiful nails starts here</p>
        </div>
        
        <div class="content">
            <h2>Hello ${data.customerName || 'Beautiful'}!</h2>
            <p>Welcome to the ${data.businessName} family! We're thrilled you've chosen us for your nail care needs.</p>
            
            <div class="welcome-card">
                <div class="emoji">🎁</div>
                <h3>New Customer Special</h3>
                <p>Enjoy <strong>15% OFF</strong> your first service!</p>
                <p><small>Mention code: <strong>WELCOME15</strong></small></p>
            </div>

            <h3>What you can expect from us:</h3>
            <ul>
                <li>💅 Expert nail care and stunning designs</li>
                <li>🏆 Premium products and equipment</li>
                <li>😊 Friendly, professional service</li>
                <li>📱 Easy online booking 24/7</li>
                <li>🎯 Loyalty rewards program</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.websiteUrl || '#'}" class="button">Book Your First Appointment</a>
            </div>

            <p>Have questions? We're here to help! Simply reply to this email or give us a call.</p>
            
            <p>Looking forward to pampering you soon!</p>
            
            <p>With love,<br>
            The ${data.businessName} team 💖</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
            <p>${data.websiteUrl ? `<a href="${data.websiteUrl}">Visit our website</a>` : ''} | Follow us on social media!</p>
        </div>
    </div>
</body>
</html>`
  }

  private static generateAppointmentReminderHTML(data: EmailTemplateData, hours: number): string {
    const reminderText = hours === 24 ? 'tomorrow' : `in ${hours} hours`
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .reminder-card { background-color: #e8f5e8; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Appointment Reminder</h1>
            <p>Don't forget - your appointment is ${reminderText}!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.customerName || 'there'}!</h2>
            <p>Just a friendly reminder about your upcoming appointment:</p>
            
            <div class="reminder-card">
                <h3>Your Appointment</h3>
                <p><strong>📅 When:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
                <p><strong>💅 Service:</strong> ${data.serviceName}</p>
                <p><strong>📍 Where:</strong> ${data.location || 'Main Location'}</p>
                <p><strong>🏪 Business:</strong> ${data.businessName}</p>
            </div>

            <p><strong>What to bring:</strong></p>
            <ul>
                <li>Your confirmation code: #${data.confirmationCode}</li>
                <li>Any inspiration photos for nail designs</li>
                <li>Just yourself and get ready to be pampered!</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                ${data.rescheduleUrl ? `<a href="${data.rescheduleUrl}" class="button" style="background-color: #ffc107; color: #212529;">Reschedule</a>` : ''}
                ${data.cancelUrl ? `<a href="${data.cancelUrl}" class="button" style="background-color: #dc3545;">Cancel</a>` : ''}
            </div>

            <p>Running late? No worries! Just give us a call and we'll do our best to accommodate you.</p>
            
            <p>See you soon!</p>
            <p>The ${data.businessName} team ✨</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  }

  private static generatePaymentReceiptHTML(data: EmailTemplateData & { amount: string; paymentMethod: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #6f42c1, #8e44ad); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .receipt-card { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .total { font-size: 24px; font-weight: bold; color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧾 Payment Receipt</h1>
            <p>Thank you for your payment!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.customerName || 'there'}!</h2>
            <p>Your payment has been processed successfully. Here are the details:</p>
            
            <div class="receipt-card">
                <h3>Payment Details</h3>
                <p><strong>Amount Paid:</strong> <span class="total">$${data.amount}</span></p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p><strong>Service:</strong> ${data.serviceName}</p>
                <p><strong>Appointment:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
                <p><strong>Location:</strong> ${data.location || 'Main Location'}</p>
                <p><strong>Receipt Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Your appointment is now confirmed and we're looking forward to seeing you!</p>
            
            <p>Questions about your payment? Just reply to this email and we'll help you right away.</p>
            
            <p>Thank you for choosing ${data.businessName}!</p>
            <p>The ${data.businessName} team 💖</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
            <p>This is an automated receipt. Please keep for your records.</p>
        </div>
    </div>
</body>
</html>`
  }

  private static generatePromotionalEmailHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Offer</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #fd7e14, #ff6b35); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .offer-card { background: linear-gradient(135deg, #fff3cd, #ffeaa7); border-radius: 15px; padding: 30px; margin: 20px 0; text-align: center; border: 3px dashed #fd7e14; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 15px 30px; background-color: #fd7e14; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .discount { font-size: 36px; font-weight: bold; color: #fd7e14; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎁 Special Offer Just For You!</h1>
            <p>Don't miss out on this amazing deal</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.customerName || 'Beautiful'}!</h2>
            <p>We have something special just for you...</p>
            
            <div class="offer-card">
                <div class="discount">${data.discount || '20% OFF'}</div>
                <h3>Your Next Service</h3>
                ${data.promoCode ? `<p><strong>Use Code:</strong> ${data.promoCode}</p>` : ''}
                ${data.expiryDate ? `<p><strong>Valid Until:</strong> ${data.expiryDate}</p>` : ''}
                
                <div style="margin-top: 20px;">
                    <a href="${data.websiteUrl || '#'}" class="button">Book Now & Save!</a>
                </div>
            </div>

            <h3>Why choose ${data.businessName}?</h3>
            <ul>
                <li>💅 Expert nail technicians</li>
                <li>✨ Latest trends and techniques</li>
                <li>🏆 Premium products only</li>
                <li>😊 Relaxing, clean environment</li>
            </ul>

            <p><strong>Hurry!</strong> This offer won't last long. Book your appointment today and treat yourself to the pampering you deserve.</p>
            
            <p>Can't wait to see you soon!</p>
            <p>The ${data.businessName} team 💅✨</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
            <p>Offer valid for new bookings only. Cannot be combined with other offers.</p>
            <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`
  }

  private static generateReviewRequestHTML(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How was your experience?</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #17a2b8, #20c997); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .review-card { background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #17a2b8; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .stars { font-size: 30px; color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⭐ How was your experience?</h1>
            <p>We'd love to hear from you!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.customerName || 'there'}!</h2>
            <p>Thank you for visiting ${data.businessName}! We hope you absolutely love your nails.</p>
            
            <div class="review-card">
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <h3>Leave us a review!</h3>
                <p>Your feedback helps us improve and lets other clients know what to expect.</p>
                
                ${data.reviewUrl ? `<a href="${data.reviewUrl}" class="button">Write a Review</a>` : ''}
            </div>

            <h3>Share your beautiful nails!</h3>
            <ul>
                <li>📸 Take a photo of your gorgeous nails</li>
                <li>📱 Tag us on Instagram/Facebook</li>
                <li>💖 Show off your nail art to friends</li>
            </ul>

            <p>As a thank you for your review, enjoy <strong>10% OFF</strong> your next appointment!</p>

            <div style="text-align: center; margin: 20px 0;">
                <a href="${data.websiteUrl || '#'}" class="button">Book Next Appointment</a>
            </div>
            
            <p>Thank you for being an amazing client!</p>
            <p>The ${data.businessName} team 💅💖</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * Personalize email content with customer data
   */
  private static personalizeContent(content: string, data: EmailTemplateData): string {
    let personalized = content
    
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        const placeholder = `{{${key}}}`
        personalized = personalized.replace(new RegExp(placeholder, 'g'), value.toString())
      }
    })
    
    return personalized
  }

  /**
   * Log email to database
   */
  private static async logEmail(
    to: string,
    type: string,
    subject: string,
    messageId: string,
    campaignId?: string,
    businessId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert({
          business_id: businessId,
          campaign_id: campaignId,
          recipient_email: to,
          email_type: type,
          subject: subject,
          sendgrid_message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

      console.log('📝 Email logged in database:', { type, to, messageId })
    } catch (error) {
      console.error('❌ Error logging email:', error)
    }
  }

  /**
   * Test SendGrid connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          error: 'SendGrid API key not configured'
        }
      }

      // Test with a simple email validation call
      const testResult = await this.sendEmail(
        'test@example.com',
        'Test Email',
        'This is a test email to validate SendGrid configuration.',
        true
      )

      // If it fails due to invalid recipient, that's actually good - it means SendGrid is configured
      if (testResult.error && testResult.error.includes('invalid')) {
        return { success: true }
      }

      return testResult
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'SendGrid connection failed'
      }
    }
  }
}