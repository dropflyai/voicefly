import { EmailService } from './email-service'
import { createClient } from '@supabase/supabase-js'

interface BrandingConfig {
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class BrandedEmailService extends EmailService {
  
  static async getBranding(businessId: string): Promise<BrandingConfig> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('branding')
        .eq('id', businessId)
        .single()

      if (error) throw error

      return {
        primary_color: '#8b5cf6',
        secondary_color: '#ec4899',
        accent_color: '#f59e0b',
        font_family: 'Inter',
        ...data?.branding
      }
    } catch (error) {
      console.error('Error loading branding:', error)
      return {
        primary_color: '#8b5cf6',
        secondary_color: '#ec4899',
        accent_color: '#f59e0b',
        font_family: 'Inter'
      }
    }
  }

  static async sendBrandedAppointmentConfirmation(appointment: any, businessId?: string) {
    const branding = await this.getBranding(businessId || appointment.business_id)
    
    const customerName = appointment.customer?.first_name || 'there'
    const businessName = appointment.business?.name || 'your salon'
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
    const startTime = appointment.start_time || 'your scheduled time'
    const serviceName = appointment.service?.name || 'your service'
    const servicePrice = appointment.service?.base_price || 0

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Appointment Confirmation</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${branding.font_family.replace(' ', '+')}:wght@400;600;700&display=swap');
          </style>
        </head>
        <body style="font-family: '${branding.font_family}', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${businessName}" style="height: 60px; margin-bottom: 20px; max-width: 200px;">` : ''}
            <h1 style="margin: 0; font-size: 28px; font-family: '${branding.font_family}', Arial, sans-serif;">Appointment Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking at ${businessName} is all set</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: ${branding.primary_color}; margin-top: 0; font-family: '${branding.font_family}', Arial, sans-serif;">Hello ${customerName}!</h2>
              <p>We're excited to see you! Your appointment has been confirmed with the following details:</p>
              
              <div style="background: #f0f2f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${branding.primary_color};">
                <table style="width: 100%; border-collapse: collapse; font-family: '${branding.font_family}', Arial, sans-serif;">
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
                    <td style="padding: 8px 0; color: ${branding.accent_color}; font-weight: 600;">$${servicePrice}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin-top: 25px;">Need to make changes? You can manage your appointment in our customer portal.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: ${branding.primary_color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: '${branding.font_family}', Arial, sans-serif; display: inline-block; transition: all 0.2s;">
                  Manage Appointment
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Thank you for choosing ${businessName}!</p>
              <p style="margin-top: 15px;">
                <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Contact Us</a>
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

  static async sendBrandedCancellationEmail(appointment: any, reason?: string, businessId?: string) {
    const branding = await this.getBranding(businessId || appointment.business_id)
    
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
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${branding.font_family.replace(' ', '+')}:wght@400;600;700&display=swap');
          </style>
        </head>
        <body style="font-family: '${branding.font_family}', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${branding.secondary_color} 0%, #f87171 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${businessName}" style="height: 60px; margin-bottom: 20px; max-width: 200px; filter: brightness(0) invert(1);">` : ''}
            <h1 style="margin: 0; font-size: 28px; font-family: '${branding.font_family}', Arial, sans-serif;">Appointment Cancelled</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We're sorry to see this appointment cancelled</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: ${branding.primary_color}; margin-top: 0; font-family: '${branding.font_family}', Arial, sans-serif;">Hello ${customerName},</h2>
              <p>Your appointment has been cancelled. Here are the details:</p>
              
              <div style="background: rgba(248, 113, 113, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #f87171; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${startTime}</p>
                <p style="margin: 5px 0;"><strong>💅 Service:</strong> ${serviceName}</p>
                ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p>We apologize for any inconvenience. We'd love to reschedule you for another time!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: ${branding.primary_color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: '${branding.font_family}', Arial, sans-serif; display: inline-block;">
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

  static async sendBrandedWelcomeEmail(customer: any, business: any, businessId?: string) {
    const branding = await this.getBranding(businessId || business.id)
    
    const customerName = customer.first_name || 'there'
    const businessName = business.name || 'your salon'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to ${businessName}!</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${branding.font_family.replace(' ', '+')}:wght@400;600;700&display=swap');
          </style>
        </head>
        <body style="font-family: '${branding.font_family}', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${businessName}" style="height: 60px; margin-bottom: 20px; max-width: 200px;">` : ''}
            <h1 style="margin: 0; font-size: 28px; font-family: '${branding.font_family}', Arial, sans-serif;">Welcome to ${businessName}!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We're excited to have you as a customer</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: ${branding.primary_color}; margin-top: 0; font-family: '${branding.font_family}', Arial, sans-serif;">Hello ${customerName}!</h2>
              <p>Thank you for choosing ${businessName}! We're thrilled to welcome you to our salon family.</p>
              
              <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${branding.accent_color};">
                <h3 style="color: ${branding.primary_color}; margin-top: 0; font-family: '${branding.font_family}', Arial, sans-serif;">What's next?</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li style="margin: 8px 0;">Browse our services and book your next appointment</li>
                  <li style="margin: 8px 0;">Earn loyalty points with every visit</li>
                  <li style="margin: 8px 0;">Get exclusive member offers and updates</li>
                  <li style="margin: 8px 0;">Manage your appointments in our customer portal</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vapi-nail-salon-agent-git-main-dropflyai.vercel.app/customer/portal" 
                   style="background: ${branding.primary_color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: '${branding.font_family}', Arial, sans-serif; display: inline-block;">
                  Visit Customer Portal
                </a>
              </div>
              
              <p style="margin-top: 25px;">Questions? Just reply to this email or give us a call. We're here to help!</p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px;">
              <p>Welcome to the ${businessName} family!</p>
              <p style="margin-top: 15px;">
                <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Contact Us</a>
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

  static async sendBrandedMarketingCampaign(recipients: string[], subject: string, content: string, businessName: string, businessId: string) {
    const branding = await this.getBranding(businessId)
    
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
              <style>
                @import url('https://fonts.googleapis.com/css2?family=${branding.font_family.replace(' ', '+')}:wght@400;600;700&display=swap');
              </style>
            </head>
            <body style="font-family: '${branding.font_family}', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${businessName}" style="height: 50px; margin-bottom: 15px; max-width: 200px;">` : ''}
                <h1 style="margin: 0; font-size: 24px; font-family: '${branding.font_family}', Arial, sans-serif;">${businessName}</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${branding.accent_color};">
                  ${content}
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                  <p>
                    <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Unsubscribe</a> |
                    <a href="#" style="color: ${branding.primary_color}; text-decoration: none;">Update Preferences</a>
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
}