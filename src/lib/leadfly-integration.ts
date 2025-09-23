// LeadFly Integration Service for VoiceFly
// Captures leads from AudienceLab, Apollo, and other lead generation tools

import { createServerClient } from './supabase'
import { EmailService } from './email-service'
import { SMSService } from './sms-service'

interface LeadSource {
  name: string
  platform: 'audiencelab' | 'apollo' | 'linkedin' | 'cold-email' | 'website' | 'manual'
  campaign_id?: string
  campaign_name?: string
}

interface LeadData {
  // Basic Info
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  title?: string

  // Lead Intelligence
  industry?: string
  company_size?: string
  revenue_range?: string
  technology_stack?: string[]
  pain_points?: string[]

  // Lead Scoring
  intent_signals?: string[]
  engagement_score?: number
  fit_score?: number
  timing_score?: number

  // Source Information
  source: LeadSource
  lead_magnet?: string
  referral_source?: string

  // Custom Fields
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
}

export class LeadFlyIntegration {
  private static getSupabase() {
    return createServerClient()
  }
  private static dropflyBusinessId = process.env.DEFAULT_BUSINESS_ID || 'c9b1b506-57b7-44c0-b873-48165a3f0b9c'

  // ==============================================
  // MAIN LEAD CAPTURE METHODS
  // ==============================================

  static async captureLeadFromAudienceLab(audienceLabData: any): Promise<string | null> {
    const leadData: LeadData = {
      first_name: audienceLabData.firstName || audienceLabData.first_name,
      last_name: audienceLabData.lastName || audienceLabData.last_name,
      email: audienceLabData.email,
      phone: audienceLabData.phone,
      company: audienceLabData.company || audienceLabData.companyName,
      title: audienceLabData.jobTitle || audienceLabData.title,
      industry: audienceLabData.industry,
      company_size: audienceLabData.companySize,
      technology_stack: audienceLabData.techStack,
      source: {
        name: 'AudienceLab',
        platform: 'audiencelab',
        campaign_id: audienceLabData.campaignId,
        campaign_name: audienceLabData.campaignName
      },
      lead_magnet: audienceLabData.leadMagnet,
      intent_signals: audienceLabData.intentSignals,
      engagement_score: audienceLabData.engagementScore,
      tags: ['audiencelab', 'inbound']
    }

    return await this.processLead(leadData)
  }

  static async captureLeadFromApollo(apolloData: any): Promise<string | null> {
    const leadData: LeadData = {
      first_name: apolloData.first_name,
      last_name: apolloData.last_name,
      email: apolloData.email,
      phone: apolloData.phone,
      company: apolloData.organization?.name,
      title: apolloData.title,
      industry: apolloData.organization?.industry,
      company_size: apolloData.organization?.num_employees,
      revenue_range: apolloData.organization?.estimated_num_employees,
      source: {
        name: 'Apollo',
        platform: 'apollo',
        campaign_id: apolloData.sequence_id,
        campaign_name: apolloData.sequence_name
      },
      intent_signals: apolloData.intent_signals,
      engagement_score: apolloData.contact_score,
      tags: ['apollo', 'outbound', 'cold-outreach']
    }

    return await this.processLead(leadData)
  }

  static async captureLeadFromLinkedIn(linkedinData: any): Promise<string | null> {
    const leadData: LeadData = {
      first_name: linkedinData.firstName,
      last_name: linkedinData.lastName,
      email: linkedinData.emailAddress,
      company: linkedinData.company,
      title: linkedinData.headline,
      industry: linkedinData.industry,
      source: {
        name: 'LinkedIn',
        platform: 'linkedin',
        campaign_id: linkedinData.campaignId,
        campaign_name: linkedinData.campaignName
      },
      intent_signals: ['linkedin-engagement'],
      tags: ['linkedin', 'social-selling']
    }

    return await this.processLead(leadData)
  }

  static async captureWebsiteLead(formData: any): Promise<string | null> {
    const leadData: LeadData = {
      first_name: formData.firstName || formData.first_name,
      last_name: formData.lastName || formData.last_name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      industry: formData.industry,
      pain_points: formData.painPoints,
      source: {
        name: 'Website Contact Form',
        platform: 'website',
        campaign_name: formData.source || 'organic'
      },
      lead_magnet: formData.leadMagnet,
      notes: formData.message || formData.inquiry,
      tags: ['website', 'inbound', 'high-intent']
    }

    return await this.processLead(leadData)
  }

  // ==============================================
  // CORE LEAD PROCESSING
  // ==============================================

  static async processLead(leadData: LeadData): Promise<string | null> {
    try {
      console.log('🎯 Processing lead from:', leadData.source.name)

      // 1. Calculate lead score
      const leadScore = this.calculateLeadScore(leadData)

      // 2. Determine lead priority and routing
      const priority = this.determinePriority(leadScore, leadData)

      // 3. Create or update lead in database
      const leadId = await this.createLead(leadData, leadScore, priority)

      if (!leadId) {
        throw new Error('Failed to create lead record')
      }

      // 4. Trigger appropriate workflows based on score and source
      await this.triggerLeadWorkflows(leadId, leadData, leadScore, priority)

      console.log('✅ Lead processed successfully:', leadId)
      return leadId

    } catch (error) {
      console.error('❌ Lead processing failed:', error)
      return null
    }
  }

  private static async createLead(
    leadData: LeadData,
    score: number,
    priority: 'hot' | 'warm' | 'cold'
  ): Promise<string | null> {
    const { data, error } = await this.getSupabase()
      .from('leads')
      .upsert({
        business_id: this.dropflyBusinessId,
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        title: leadData.title,
        industry: leadData.industry,
        company_size: leadData.company_size,
        revenue_range: leadData.revenue_range,
        technology_stack: leadData.technology_stack,
        pain_points: leadData.pain_points,
        source: leadData.source.name,
        source_platform: leadData.source.platform,
        campaign_id: leadData.source.campaign_id,
        campaign_name: leadData.source.campaign_name,
        lead_magnet: leadData.lead_magnet,
        referral_source: leadData.referral_source,
        intent_signals: leadData.intent_signals,
        engagement_score: leadData.engagement_score,
        fit_score: leadData.fit_score,
        timing_score: leadData.timing_score,
        lead_score: score,
        priority: priority,
        status: 'new',
        tags: leadData.tags,
        notes: leadData.notes,
        custom_fields: leadData.custom_fields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email,business_id'
      })
      .select('id')

    if (error) {
      console.error('Database error creating lead:', error)
      return null
    }

    return data?.[0]?.id || null
  }

  // ==============================================
  // LEAD SCORING & ROUTING
  // ==============================================

  private static calculateLeadScore(leadData: LeadData): number {
    let score = 0

    // Company size scoring (0-25 points)
    const companySize = leadData.company_size?.toLowerCase()
    if (companySize?.includes('enterprise') || companySize?.includes('1000+')) score += 25
    else if (companySize?.includes('medium') || companySize?.includes('100-1000')) score += 20
    else if (companySize?.includes('small') || companySize?.includes('10-100')) score += 15
    else if (companySize?.includes('startup') || companySize?.includes('1-10')) score += 10

    // Industry fit scoring (0-20 points)
    const highFitIndustries = ['technology', 'software', 'saas', 'marketing', 'sales', 'consulting']
    if (highFitIndustries.some(industry =>
      leadData.industry?.toLowerCase().includes(industry)
    )) score += 20

    // Title/role scoring (0-20 points)
    const decisionMakerTitles = ['ceo', 'cto', 'cmo', 'vp', 'director', 'head of', 'founder', 'owner']
    if (decisionMakerTitles.some(title =>
      leadData.title?.toLowerCase().includes(title)
    )) score += 20
    else if (leadData.title?.toLowerCase().includes('manager')) score += 15
    else if (leadData.title?.toLowerCase().includes('lead')) score += 10

    // Source quality scoring (0-15 points)
    switch (leadData.source.platform) {
      case 'website': score += 15; break  // Highest intent
      case 'linkedin': score += 12; break
      case 'audiencelab': score += 10; break
      case 'apollo': score += 8; break
      case 'cold-email': score += 5; break
    }

    // Intent signals scoring (0-10 points)
    if (leadData.intent_signals && leadData.intent_signals.length > 0) {
      score += Math.min(leadData.intent_signals.length * 2, 10)
    }

    // Pain points scoring (0-10 points)
    if (leadData.pain_points && leadData.pain_points.length > 0) {
      score += Math.min(leadData.pain_points.length * 3, 10)
    }

    return Math.min(score, 100) // Cap at 100
  }

  private static determinePriority(score: number, leadData: LeadData): 'hot' | 'warm' | 'cold' {
    // Hot leads (80+ score or specific criteria)
    if (score >= 80 ||
        leadData.source.platform === 'website' ||
        leadData.tags?.includes('high-intent') ||
        leadData.pain_points?.some(pain =>
          pain.toLowerCase().includes('urgent') ||
          pain.toLowerCase().includes('asap')
        )) {
      return 'hot'
    }

    // Warm leads (50-79 score)
    if (score >= 50) {
      return 'warm'
    }

    // Cold leads (below 50)
    return 'cold'
  }

  // ==============================================
  // LEAD WORKFLOW AUTOMATION
  // ==============================================

  private static async triggerLeadWorkflows(
    leadId: string,
    leadData: LeadData,
    score: number,
    priority: 'hot' | 'warm' | 'cold'
  ): Promise<void> {
    console.log(`🔄 Triggering ${priority} lead workflows for: ${leadData.email}`)

    // Always log the lead activity
    await this.logLeadActivity(leadId, 'lead_created', {
      source: leadData.source.name,
      score: score,
      priority: priority
    })

    switch (priority) {
      case 'hot':
        await this.hotLeadWorkflow(leadId, leadData)
        break
      case 'warm':
        await this.warmLeadWorkflow(leadId, leadData)
        break
      case 'cold':
        await this.coldLeadWorkflow(leadId, leadData)
        break
    }

    // Special workflows based on source
    if (leadData.source.platform === 'website') {
      await this.websiteLeadWorkflow(leadId, leadData)
    }
  }

  private static async hotLeadWorkflow(leadId: string, leadData: LeadData): Promise<void> {
    // 1. Immediate notification to sales team
    await this.notifySalesTeam(leadId, leadData, 'urgent')

    // 2. Send immediate welcome email with calendar link
    if (leadData.email) {
      await EmailService.sendTemplate(
        leadData.email,
        'hot_lead_welcome',
        {
          first_name: leadData.first_name,
          company: leadData.company || 'your company',
          calendar_link: 'https://calendly.com/dropfly/demo'
        }
      )
    }

    // 3. Schedule immediate follow-up call (if phone available)
    if (leadData.phone) {
      await this.scheduleVAPICall(leadId, leadData, 5) // 5 minutes delay
    }

    // 4. Add to high-priority sequence
    await this.addToEmailSequence(leadId, 'hot-lead-sequence')
  }

  private static async warmLeadWorkflow(leadId: string, leadData: LeadData): Promise<void> {
    // 1. Standard welcome email
    if (leadData.email) {
      await EmailService.sendTemplate(
        leadData.email,
        'warm_lead_welcome',
        {
          first_name: leadData.first_name,
          company: leadData.company || 'your company'
        }
      )
    }

    // 2. Schedule follow-up call for next business day
    if (leadData.phone) {
      await this.scheduleVAPICall(leadId, leadData, 24 * 60) // 24 hours delay
    }

    // 3. Add to nurture sequence
    await this.addToEmailSequence(leadId, 'warm-lead-nurture')

    // 4. Notify sales team (normal priority)
    await this.notifySalesTeam(leadId, leadData, 'normal')
  }

  private static async coldLeadWorkflow(leadId: string, leadData: LeadData): Promise<void> {
    // 1. Educational welcome email
    if (leadData.email) {
      await EmailService.sendTemplate(
        leadData.email,
        'cold_lead_education',
        {
          first_name: leadData.first_name,
          industry: leadData.industry || 'your industry'
        }
      )
    }

    // 2. Add to long-term nurture sequence
    await this.addToEmailSequence(leadId, 'cold-lead-nurture')

    // 3. Schedule qualification call for later
    if (leadData.phone) {
      await this.scheduleVAPICall(leadId, leadData, 7 * 24 * 60) // 7 days delay
    }
  }

  private static async websiteLeadWorkflow(leadId: string, leadData: LeadData): Promise<void> {
    // Special handling for website leads (highest intent)

    // 1. Immediate thank you SMS (if phone available)
    if (leadData.phone) {
      await SMSService.sendTemplate(
        leadData.phone,
        'website_lead_thanks',
        {
          first_name: leadData.first_name,
          demo_link: 'https://calendly.com/dropfly/demo'
        }
      )
    }

    // 2. Tag for special tracking
    await this.addLeadTags(leadId, ['website-lead', 'high-intent', 'immediate-follow-up'])
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  private static async scheduleVAPICall(
    leadId: string,
    leadData: LeadData,
    delayMinutes: number
  ): Promise<void> {
    // Schedule a VAPI call for lead qualification
    const callTime = new Date(Date.now() + delayMinutes * 60 * 1000)

    await this.getSupabase()
      .from('scheduled_calls')
      .insert({
        business_id: this.dropflyBusinessId,
        lead_id: leadId,
        phone_number: leadData.phone,
        call_type: 'lead_qualification',
        scheduled_for: callTime.toISOString(),
        status: 'scheduled',
        vapi_assistant_id: '8ab7e000-aea8-4141-a471-33133219a471',
        context: {
          lead_name: `${leadData.first_name} ${leadData.last_name}`,
          company: leadData.company,
          source: leadData.source.name,
          lead_score: await this.calculateLeadScore(leadData)
        }
      })

    console.log(`📞 VAPI call scheduled for ${leadData.phone} at ${callTime}`)
  }

  private static async notifySalesTeam(
    leadId: string,
    leadData: LeadData,
    urgency: 'urgent' | 'normal'
  ): Promise<void> {
    // Send notification to sales team
    const salesEmail = process.env.SALES_TEAM_EMAIL || 'sales@dropfly.ai'

    await EmailService.sendEmail(
      salesEmail,
      `${urgency === 'urgent' ? '🔥 HOT' : '📈'} New Lead: ${leadData.first_name} ${leadData.last_name}`,
      `
        <h2>${urgency === 'urgent' ? '🔥 Hot Lead Alert!' : '📈 New Lead'}</h2>
        <p><strong>Name:</strong> ${leadData.first_name} ${leadData.last_name}</p>
        <p><strong>Company:</strong> ${leadData.company || 'Not provided'}</p>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Phone:</strong> ${leadData.phone || 'Not provided'}</p>
        <p><strong>Source:</strong> ${leadData.source.name}</p>
        <p><strong>Score:</strong> ${await this.calculateLeadScore(leadData)}/100</p>

        ${urgency === 'urgent' ? '<p style="color: red;"><strong>⚡ Immediate follow-up recommended!</strong></p>' : ''}

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/leads/${leadId}">View Lead Details</a></p>
      `
    )
  }

  private static async addToEmailSequence(leadId: string, sequenceName: string): Promise<void> {
    // Add lead to automated email sequence
    await this.getSupabase()
      .from('email_sequences')
      .insert({
        business_id: this.dropflyBusinessId,
        lead_id: leadId,
        sequence_name: sequenceName,
        status: 'active',
        current_step: 1,
        started_at: new Date().toISOString()
      })

    console.log(`📧 Added lead to ${sequenceName} sequence`)
  }

  private static async addLeadTags(leadId: string, tags: string[]): Promise<void> {
    // Add tags to lead for better organization
    const { data: existingLead } = await this.getSupabase()
      .from('leads')
      .select('tags')
      .eq('id', leadId)
      .single()

    const currentTags = existingLead?.tags || []
    const newTags = [...new Set([...currentTags, ...tags])]

    await this.getSupabase()
      .from('leads')
      .update({ tags: newTags })
      .eq('id', leadId)
  }

  private static async logLeadActivity(
    leadId: string,
    activityType: string,
    data: any
  ): Promise<void> {
    await this.getSupabase()
      .from('lead_activities')
      .insert({
        business_id: this.dropflyBusinessId,
        lead_id: leadId,
        activity_type: activityType,
        activity_data: data,
        created_at: new Date().toISOString()
      })
  }

  // ==============================================
  // API ENDPOINTS FOR WEBHOOK INTEGRATIONS
  // ==============================================

  static async handleWebhook(source: string, payload: any): Promise<any> {
    console.log(`🪝 Webhook received from ${source}:`, payload)

    switch (source.toLowerCase()) {
      case 'audiencelab':
        return await this.captureLeadFromAudienceLab(payload)

      case 'apollo':
        return await this.captureLeadFromApollo(payload)

      case 'linkedin':
        return await this.captureLeadFromLinkedIn(payload)

      case 'website':
        return await this.captureWebsiteLead(payload)

      default:
        console.warn(`Unknown webhook source: ${source}`)
        return null
    }
  }
}