// Defensive import to avoid build-time errors
let Resend: any = null;
let resend: any = null;

try {
  // Only import Resend if needed (not at build time)
  if (typeof window === 'undefined' && process.env.RESEND_API_KEY) {
    Resend = require('resend').Resend;
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.log('Resend not available:', error.message);
}

export class EmailService {
  static async sendEmail(to: string, subject: string, html: string, from?: string) {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log('Resend not configured, email not sent:', { to, subject })
      return { success: false, error: 'Resend not configured' }
    }

    try {
      const fromAddress = from || process.env.EMAIL_FROM || 'Bella Nails <notifications@yourdomain.com>'
      
      const data = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html
      })
      
      console.log('Email sent successfully:', data.id)
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Email failed:', error)
      return { success: false, error: error.message }
    }
  }

  static async sendAppointmentConfirmation(appointment: any, branding?: any) {
    const customerName = appointment.customer?.first_name || 'there'
    const businessName = appointment.business?.name || 'your salon'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    const servicePrice = appointment.service?.base_price || 0

    // Use business branding colors or defaults
    const primaryColor = branding?.primary_color || '#8b5cf6'
    const secondaryColor = branding?.secondary_color || '#ec4899'
    const accentColor = branding?.accent_color || '#f59e0b'
    const logoUrl = branding?.logo_url
    const fontFamily = branding?.font_family || 'Inter, Arial, sans-serif'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Appointment Confirmation</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;600;700&display=swap');
          </style>
        </head>
        <body style="font-family: '${fontFamily}', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}" style="height: 60px; margin-bottom: 20px;">` : ''}
            <h1 style="margin: 0; font-size: 28px; font-family: '${fontFamily}', Arial, sans-serif;">Appointment Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking at ${businessName} is all set</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #667eea; margin-top: 0;">Hello ${customerName}!</h2>
              <p>We're excited to see you! Your appointment has been confirmed with the following details:</p>
              
              <div style="background: #f0f2f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>📅 Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${appointmentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>⏰ Time:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${startTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>💅 Service:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>💰 Price:</strong></td>
                    <td style="padding: 8px 0;">$${servicePrice}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin-top: 25px;">Need to make changes? You can manage your appointment in our customer portal.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Manage Appointment
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Thank you for choosing ${businessName}!</p>
              <p style="margin-top: 15px;">
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: #667eea; text-decoration: none;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(
      appointment.customer?.email,
      `Appointment Confirmed - ${businessName}`,
      html
    )
  }

  static async sendCancellationEmail(appointment: any, reason?: string) {
    const customerName = appointment.customer?.first_name || 'there'
    const businessName = appointment.business?.name || 'your salon'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Appointment Cancelled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Appointment Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We're sorry to see this appointment cancelled</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #f5576c; margin-top: 0;">Hello ${customerName},</h2>
              <p>Your appointment has been cancelled. Here are the details:</p>
              
              <div style="background: #fff3f3; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
                <p><strong>📅 Date:</strong> ${appointmentDate}</p>
                <p><strong>⏰ Time:</strong> ${startTime}</p>
                <p><strong>💅 Service:</strong> ${serviceName}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p>We apologize for any inconvenience. We'd love to reschedule you for another time!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Book New Appointment
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Thank you for understanding - ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(
      appointment.customer?.email,
      `Appointment Cancelled - ${businessName}`,
      html
    )
  }

  static async sendWelcomeEmail(customer: any, business: any) {
    const customerName = customer.first_name || 'there'
    const businessName = business.name || 'your salon'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to ${businessName}!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to ${businessName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We're excited to have you as a customer</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #667eea; margin-top: 0;">Hello ${customerName}!</h2>
              <p>Thank you for choosing ${businessName}! We're thrilled to welcome you to our salon family.</p>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">What's next?</h3>
                <ul style="padding-left: 20px;">
                  <li>Browse our services and book your next appointment</li>
                  <li>Earn loyalty points with every visit</li>
                  <li>Get exclusive member offers and updates</li>
                  <li>Manage your appointments in our customer portal</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Visit Customer Portal
                </a>
              </div>
              
              <p style="margin-top: 25px;">Questions? Just reply to this email or give us a call. We're here to help!</p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Welcome to the ${businessName} family!</p>
              <p style="margin-top: 15px;">
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: #667eea; text-decoration: none;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(
      customer.email,
      `Welcome to ${businessName}!`,
      html
    )
  }

  static async sendMarketingCampaign(recipients: string[], subject: string, content: string, businessName: string = 'your salon') {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { success: false, error: 'No recipients provided' }
    }

    const results = []

    for (const email of recipients) {
      try {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">${businessName}</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                  ${content}
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                  <p>
                    <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> |
                    <a href="#" style="color: #667eea; text-decoration: none;">Update Preferences</a>
                  </p>
                  <p style="margin-top: 15px;">${businessName}</p>
                </div>
              </div>
            </body>
          </html>
        `

        const result = await this.sendEmail(email, subject, html)
        results.push({ email, success: result.success, error: result.error })
      } catch (error) {
        results.push({ email, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return {
      success: successCount > 0,
      results,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount
      }
    }
  }

  static async sendLoyaltyPointsEarned(customer: any, points: number, totalPoints: number, business: any) {
    const customerName = customer.first_name || 'there'
    const businessName = business.name || 'your salon'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>You Earned Loyalty Points!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Points Earned!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your loyalty has been rewarded</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #f5576c; margin-top: 0;">Congratulations ${customerName}!</h2>
              <p>You just earned <strong style="color: #f5576c;">${points} loyalty points</strong> from your recent visit!</p>
              
              <div style="background: #fff8f8; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <div style="font-size: 32px; color: #f5576c; font-weight: bold; margin-bottom: 10px;">
                  ${totalPoints} Points
                </div>
                <div style="color: #666;">Total Balance</div>
              </div>
              
              <p>Keep collecting points to unlock amazing rewards!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Your Rewards
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Thank you for your loyalty - ${businessName}</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail(
      customer.email,
      `🎉 You earned ${points} loyalty points!`,
      html
    )
  }
}