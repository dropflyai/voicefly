import { SendGridService, EmailTemplateData } from './sendgrid-service'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface EmailCampaign {
  id: string
  business_id: string
  name: string
  subject: string
  content: string
  template_type?: string
  target_segment: 'all' | 'new_customers' | 'returning_customers' | 'loyal_customers' | 'inactive_customers'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_at?: string
  sent_at?: string
  recipients_count?: number
  sent_count?: number
  opened_count?: number
  clicked_count?: number
  bounced_count?: number
  created_at: string
  updated_at: string
}

export interface CustomerSegment {
  segment: string
  count: number
  description: string
}

export class EmailMarketingService {
  /**
   * Send welcome email to new customer
   */
  static async sendWelcomeEmail(
    customerEmail: string,
    businessId: string,
    customerId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get business and customer information
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single()

      let customerName = ''
      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', customerId)
          .single()
        
        if (customer) {
          customerName = `${customer.first_name} ${customer.last_name}`.trim()
        }
      }

      const templateData: EmailTemplateData = {
        businessName: business?.name || 'Your Nail Salon',
        customerName,
        websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://yoursalon.com'
      }

      const result = await SendGridService.sendWelcomeEmail(customerEmail, templateData)
      
      if (result.success) {
        console.log('✅ Welcome email sent:', customerEmail)
        return { success: true }
      } else {
        console.error('❌ Welcome email failed:', result.error)
        return { success: false, error: result.error }
      }

    } catch (error: any) {
      console.error('❌ Error sending welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create email campaign
   */
  static async createCampaign(businessId: string, campaignData: {
    name: string
    subject: string
    content: string
    template_type?: string
    target_segment: EmailCampaign['target_segment']
    scheduled_at?: string
  }): Promise<EmailCampaign | null> {
    try {
      console.log('📧 Creating email campaign:', campaignData.name)

      // Calculate recipients count for the segment
      const recipientsCount = await this.getSegmentCount(businessId, campaignData.target_segment)

      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .insert({
          business_id: businessId,
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          template_type: campaignData.template_type || 'custom',
          target_segment: campaignData.target_segment,
          status: campaignData.scheduled_at ? 'scheduled' : 'draft',
          scheduled_at: campaignData.scheduled_at,
          recipients_count: recipientsCount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating campaign:', error)
        return null
      }

      console.log('✅ Campaign created:', campaign.id)
      return campaign

    } catch (error) {
      console.error('❌ Error creating campaign:', error)
      return null
    }
  }

  /**
   * Send email campaign
   */
  static async sendCampaign(campaignId: string): Promise<{ 
    success: boolean; 
    sent: number; 
    failed: number; 
    errors: string[] 
  }> {
    try {
      console.log('🚀 Starting campaign send:', campaignId)

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        return {
          success: false,
          sent: 0,
          failed: 0,
          errors: ['Campaign not found']
        }
      }

      // Update campaign status to sending
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sending',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      // Get recipients based on target segment
      const recipients = await this.getCampaignRecipients(campaign.business_id, campaign.target_segment)

      if (recipients.length === 0) {
        await supabase
          .from('email_campaigns')
          .update({
            status: 'sent',
            sent_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId)

        return {
          success: true,
          sent: 0,
          failed: 0,
          errors: ['No recipients found for this segment']
        }
      }

      // Send emails
      const results = await SendGridService.sendEmailCampaign(
        recipients,
        campaign.subject,
        campaign.content,
        campaignId
      )

      // Update campaign with results
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: results.sent,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      console.log(`✅ Campaign sent: ${results.sent} successful, ${results.failed} failed`)

      return {
        success: true,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }

    } catch (error: any) {
      console.error('❌ Error sending campaign:', error)

      // Update campaign status to failed
      await supabase
        .from('email_campaigns')
        .update({
          status: 'draft', // Reset to draft so it can be resent
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [error.message]
      }
    }
  }

  /**
   * Get customer segments for email targeting
   */
  static async getCustomerSegments(businessId: string): Promise<CustomerSegment[]> {
    try {
      const segments: CustomerSegment[] = []

      // All customers with email
      const { count: allCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')

      segments.push({
        segment: 'all',
        count: allCount || 0,
        description: 'All customers with email addresses'
      })

      // New customers (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: newCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')
        .gte('created_at', thirtyDaysAgo.toISOString())

      segments.push({
        segment: 'new_customers',
        count: newCount || 0,
        description: 'Customers who joined in the last 30 days'
      })

      // Returning customers (more than 1 visit)
      const { count: returningCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')
        .gt('total_visits', 1)

      segments.push({
        segment: 'returning_customers',
        count: returningCount || 0,
        description: 'Customers with more than one visit'
      })

      // Loyal customers (5+ visits)
      const { count: loyalCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')
        .gte('total_visits', 5)

      segments.push({
        segment: 'loyal_customers',
        count: loyalCount || 0,
        description: 'Customers with 5 or more visits'
      })

      // Inactive customers (no visit in last 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { count: inactiveCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')
        .or(`last_visit_date.is.null,last_visit_date.lt.${ninetyDaysAgo.toISOString()}`)

      segments.push({
        segment: 'inactive_customers',
        count: inactiveCount || 0,
        description: 'Customers with no visits in the last 90 days'
      })

      return segments

    } catch (error) {
      console.error('❌ Error getting customer segments:', error)
      return []
    }
  }

  /**
   * Get recipients for a campaign based on segment
   */
  private static async getCampaignRecipients(
    businessId: string, 
    segment: EmailCampaign['target_segment']
  ): Promise<{ email: string; customerData?: EmailTemplateData }[]> {
    try {
      let query = supabase
        .from('customers')
        .select('email, first_name, last_name, total_visits, last_visit_date, created_at')
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')

      // Apply segment filters
      switch (segment) {
        case 'new_customers':
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          query = query.gte('created_at', thirtyDaysAgo.toISOString())
          break

        case 'returning_customers':
          query = query.gt('total_visits', 1)
          break

        case 'loyal_customers':
          query = query.gte('total_visits', 5)
          break

        case 'inactive_customers':
          const ninetyDaysAgo = new Date()
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
          query = query.or(`last_visit_date.is.null,last_visit_date.lt.${ninetyDaysAgo.toISOString()}`)
          break

        case 'all':
        default:
          // No additional filtering
          break
      }

      const { data: customers, error } = await query.limit(1000) // Limit to prevent overwhelming

      if (error) {
        console.error('❌ Error fetching campaign recipients:', error)
        return []
      }

      // Get business name for personalization
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single()

      const businessName = business?.name || 'Your Nail Salon'

      return customers?.map(customer => ({
        email: customer.email,
        customerData: {
          customerName: `${customer.first_name} ${customer.last_name}`.trim(),
          businessName,
          websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://yoursalon.com'
        }
      })) || []

    } catch (error) {
      console.error('❌ Error getting campaign recipients:', error)
      return []
    }
  }

  /**
   * Get count of customers in a segment
   */
  private static async getSegmentCount(
    businessId: string, 
    segment: EmailCampaign['target_segment']
  ): Promise<number> {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('email', 'is', null)
        .neq('email', '')

      // Apply segment filters
      switch (segment) {
        case 'new_customers':
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          query = query.gte('created_at', thirtyDaysAgo.toISOString())
          break

        case 'returning_customers':
          query = query.gt('total_visits', 1)
          break

        case 'loyal_customers':
          query = query.gte('total_visits', 5)
          break

        case 'inactive_customers':
          const ninetyDaysAgo = new Date()
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
          query = query.or(`last_visit_date.is.null,last_visit_date.lt.${ninetyDaysAgo.toISOString()}`)
          break

        case 'all':
        default:
          // No additional filtering
          break
      }

      const { count, error } = await query

      if (error) {
        console.error('❌ Error counting segment:', error)
        return 0
      }

      return count || 0

    } catch (error) {
      console.error('❌ Error counting segment:', error)
      return 0
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(businessId: string, days: number = 30): Promise<{
    total_campaigns: number
    total_sent: number
    avg_open_rate: number
    avg_click_rate: number
    recent_campaigns: EmailCampaign[]
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error || !campaigns) {
        return {
          total_campaigns: 0,
          total_sent: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          recent_campaigns: []
        }
      }

      const totalCampaigns = campaigns.length
      const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0)
      const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0)

      const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
      const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0

      return {
        total_campaigns: totalCampaigns,
        total_sent: totalSent,
        avg_open_rate: Math.round(avgOpenRate * 100) / 100,
        avg_click_rate: Math.round(avgClickRate * 100) / 100,
        recent_campaigns: campaigns.slice(0, 10)
      }

    } catch (error) {
      console.error('❌ Error getting campaign analytics:', error)
      return {
        total_campaigns: 0,
        total_sent: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        recent_campaigns: []
      }
    }
  }

  /**
   * Send appointment-related emails automatically
   */
  static async sendAppointmentConfirmationEmail(appointmentId: string): Promise<boolean> {
    try {
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(email, first_name, last_name),
          service:services(name, base_price),
          business:businesses(name),
          location:locations(name, address)
        `)
        .eq('id', appointmentId)
        .single()

      if (!appointment || !appointment.customer?.email) {
        console.error('❌ Appointment or customer email not found')
        return false
      }

      const templateData: EmailTemplateData = {
        customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`.trim(),
        businessName: appointment.business?.name || 'Your Nail Salon',
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: appointment.start_time,
        serviceName: appointment.service?.name,
        servicePrice: appointment.service?.base_price?.toString(),
        location: appointment.location?.name || 'Main Location',
        confirmationCode: appointmentId.substring(0, 8).toUpperCase(),
        websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://yoursalon.com'
      }

      const result = await SendGridService.sendAppointmentConfirmation(
        appointment.customer.email,
        templateData
      )

      return result.success
    } catch (error) {
      console.error('❌ Error sending appointment confirmation email:', error)
      return false
    }
  }

  /**
   * Test email marketing setup
   */
  static async testSetup(): Promise<{ success: boolean; error?: string }> {
    return await SendGridService.testConnection()
  }
}