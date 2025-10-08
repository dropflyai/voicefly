/**
 * Campaign Automation Service
 * Automatically creates and manages email + voice campaigns for leads
 *
 * Flow:
 * 1. Leads come in → segmented (cold/warm/hot)
 * 2. Cold leads → Email nurture campaign (3-5 touches)
 * 3. Warm/Hot leads → Voice campaign (AI calls)
 * 4. Track engagement → Move cold→warm based on opens/clicks
 * 5. Book appointments via Maya AI
 */

import { getDeepSeekAI } from './deepseek-ai'
import { EnrichedLead } from './apollo-service'
import { supabase } from './supabase-client'

export interface EmailCampaign {
  id?: string
  business_id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'

  // Email sequence (3-5 touches)
  emails: EmailTouch[]

  // Target leads
  target_leads: string[] // lead IDs
  target_segment: 'cold' | 'warm' | 'hot'

  // Performance
  sent_count: number
  opened_count: number
  clicked_count: number
  replied_count: number

  // Metadata
  created_at?: string
  scheduled_start?: string
}

export interface EmailTouch {
  subject: string
  body: string
  delay_days: number // Days after previous email (0 for first)
  cta: string // Call to action
}

export interface VoiceCampaign {
  id?: string
  business_id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'

  // Voice script powered by Maya AI
  greeting: string
  pitch: string
  objection_handling: Record<string, string>
  closing: string

  // Target leads
  target_leads: string[] // lead IDs
  target_segment: 'warm' | 'hot'

  // Performance
  calls_made: number
  calls_connected: number
  appointments_booked: number

  // Metadata
  created_at?: string
  scheduled_start?: string
}

export class CampaignAutomation {
  /**
   * Generate email campaign for cold leads
   */
  async generateEmailCampaign(
    businessId: string,
    leads: EnrichedLead[]
  ): Promise<EmailCampaign> {
    const deepseek = getDeepSeekAI()

    // Extract common pain points across all leads
    const allPainPoints = leads.flatMap(l => l.deepResearch.painPoints)
    const topPainPoints = this.getTopItems(allPainPoints, 3)

    // Get sample lead for context
    const sampleLead = leads[0]

    const campaignPrompt = `You are a B2B email marketing expert. Create a 5-email nurture sequence for cold leads.

LEAD CONTEXT:
- Industry: ${sampleLead.companyIndustry}
- Company Size: ${sampleLead.companySize} employees
- Job Titles: ${leads.map(l => l.jobTitle).slice(0, 3).join(', ')}
- Top Pain Points: ${topPainPoints.join(', ')}
- Our Solution: VoiceFly - AI voice automation for appointment booking

EMAIL SEQUENCE GOALS:
1. Email 1 (Day 0): Awareness - Identify with pain point, no pitch
2. Email 2 (Day 3): Education - Case study or stats
3. Email 3 (Day 7): Social proof - Customer testimonial
4. Email 4 (Day 14): Value - ROI calculator or tool
5. Email 5 (Day 21): Direct ask - Book demo call

REQUIREMENTS:
- Subject lines under 50 characters
- Body text 150-200 words each
- Conversational, not salesy
- Clear single CTA per email
- Personalization tokens: {firstName}, {companyName}

Return JSON:
{
  "campaignName": "descriptive name",
  "emails": [
    {
      "subject": "subject line",
      "body": "email body with {firstName} personalization",
      "delay_days": 0,
      "cta": "call to action"
    }
  ]
}`

    try {
      const result = await deepseek.complete(campaignPrompt, {
        temperature: 0.7,
        maxTokens: 3000
      })

      const parsed = JSON.parse(result)

      return {
        business_id: businessId,
        name: parsed.campaignName || `Email Campaign - ${new Date().toLocaleDateString()}`,
        status: 'draft',
        emails: parsed.emails || [],
        target_leads: leads.map(l => l.apolloId || ''),
        target_segment: 'cold',
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        replied_count: 0,
        created_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Email campaign generation error:', error)

      // Return default campaign on error
      return this.getDefaultEmailCampaign(businessId, leads)
    }
  }

  /**
   * Generate voice campaign for warm/hot leads
   */
  async generateVoiceCampaign(
    businessId: string,
    leads: EnrichedLead[]
  ): Promise<VoiceCampaign> {
    const deepseek = getDeepSeekAI()

    // Get sample lead for context
    const sampleLead = leads[0]

    const campaignPrompt = `You are a B2B sales expert. Create a voice call script for warm leads (already showed interest).

LEAD CONTEXT:
- Industry: ${sampleLead.companyIndustry}
- Company: ${sampleLead.companyName}
- Contact: ${sampleLead.jobTitle}
- Pain Points: ${sampleLead.deepResearch.painPoints.join(', ')}
- Buying Signals: ${sampleLead.deepResearch.buyingSignals.join(', ')}
- Estimated Deal Value: $${sampleLead.estimatedDealValue}

CALL GOAL: Book a 15-minute discovery call

Create a conversational script with:
1. GREETING (15 seconds) - Build rapport
2. PITCH (45 seconds) - Value proposition tied to their pain points
3. OBJECTION HANDLING - Responses to common objections
4. CLOSING (20 seconds) - Book the meeting

REQUIREMENTS:
- Conversational, not robotic
- Reference their specific situation
- Use {firstName}, {companyName} tokens
- Handle 5 common objections

Return JSON:
{
  "campaignName": "descriptive name",
  "greeting": "greeting script",
  "pitch": "value proposition pitch",
  "objections": {
    "too_busy": "response",
    "no_budget": "response",
    "not_decision_maker": "response",
    "already_have_solution": "response",
    "need_more_info": "response"
  },
  "closing": "closing script with calendar booking"
}`

    try {
      const result = await deepseek.complete(campaignPrompt, {
        temperature: 0.6,
        maxTokens: 2500
      })

      const parsed = JSON.parse(result)

      return {
        business_id: businessId,
        name: parsed.campaignName || `Voice Campaign - ${new Date().toLocaleDateString()}`,
        status: 'draft',
        greeting: parsed.greeting || '',
        pitch: parsed.pitch || '',
        objection_handling: parsed.objections || {},
        closing: parsed.closing || '',
        target_leads: leads.map(l => l.apolloId || ''),
        target_segment: (sampleLead.segment === 'cold' ? 'warm' : sampleLead.segment) as 'warm' | 'hot',
        calls_made: 0,
        calls_connected: 0,
        appointments_booked: 0,
        created_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Voice campaign generation error:', error)

      // Return default campaign on error
      return this.getDefaultVoiceCampaign(businessId, leads)
    }
  }

  /**
   * Auto-create campaigns for new leads
   * This is the main automation entry point
   */
  async autoCreateCampaigns(
    businessId: string,
    leads: EnrichedLead[]
  ): Promise<{
    emailCampaign?: EmailCampaign
    voiceCampaign?: VoiceCampaign
  }> {
    console.log(`🤖 Auto-creating campaigns for ${leads.length} leads...`)

    // Segment leads
    const coldLeads = leads.filter(l => l.segment === 'cold')
    const warmHotLeads = leads.filter(l => l.segment === 'warm' || l.segment === 'hot')

    const campaigns: {
      emailCampaign?: EmailCampaign
      voiceCampaign?: VoiceCampaign
    } = {}

    // Create email campaign for cold leads
    if (coldLeads.length > 0) {
      console.log(`📧 Creating email campaign for ${coldLeads.length} cold leads...`)
      const emailCampaign = await this.generateEmailCampaign(businessId, coldLeads)

      // Save to database
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          business_id: businessId,
          name: emailCampaign.name,
          campaign_type: 'email',
          status: 'draft',
          email_content: JSON.stringify(emailCampaign.emails),
          target_segment: 'cold',
          target_lead_status: 'new',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save email campaign:', error)
      } else {
        campaigns.emailCampaign = emailCampaign
        console.log('✅ Email campaign created:', data.id)
      }
    }

    // Create voice campaign for warm/hot leads
    if (warmHotLeads.length > 0) {
      console.log(`📞 Creating voice campaign for ${warmHotLeads.length} warm/hot leads...`)
      const voiceCampaign = await this.generateVoiceCampaign(businessId, warmHotLeads)

      // Save to database
      const { data, error } = await supabase
        .from('voice_campaigns')
        .insert({
          business_id: businessId,
          name: voiceCampaign.name,
          status: 'draft',
          greeting_script: voiceCampaign.greeting,
          value_proposition: voiceCampaign.pitch,
          objection_handling: voiceCampaign.objection_handling,
          closing_script: voiceCampaign.closing,
          target_segment: voiceCampaign.target_segment,
          target_lead_status: 'qualified',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save voice campaign:', error)
      } else {
        campaigns.voiceCampaign = voiceCampaign
        console.log('✅ Voice campaign created:', data.id)
      }
    }

    return campaigns
  }

  /**
   * Track email engagement and upgrade leads from cold→warm
   */
  async trackEmailEngagement(leadId: string, event: 'opened' | 'clicked' | 'replied'): Promise<void> {
    const scores = { opened: 10, clicked: 25, replied: 50 }
    const points = scores[event]

    // Get current lead
    const { data: lead } = await supabase
      .from('leads')
      .select('qualification_score, lead_status')
      .eq('id', leadId)
      .single()

    if (!lead) return

    const newScore = (lead.qualification_score || 0) + points

    // Upgrade to warm if score >= 50
    let newStatus = lead.lead_status
    if (newScore >= 50 && lead.lead_status === 'new') {
      newStatus = 'qualified'
      console.log(`🔥 Lead ${leadId} upgraded to WARM (score: ${newScore})`)

      // TODO: Trigger voice campaign for this lead
    }

    // Update lead
    await supabase
      .from('leads')
      .update({
        qualification_score: newScore,
        lead_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
  }

  /**
   * Get top N most common items from array
   */
  private getTopItems(items: string[], n: number): string[] {
    const counts = new Map<string, number>()
    items.forEach(item => counts.set(item, (counts.get(item) || 0) + 1))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([item]) => item)
  }

  /**
   * Default email campaign fallback
   */
  private getDefaultEmailCampaign(businessId: string, leads: EnrichedLead[]): EmailCampaign {
    return {
      business_id: businessId,
      name: `Email Nurture - ${new Date().toLocaleDateString()}`,
      status: 'draft',
      emails: [
        {
          subject: 'Quick question about {companyName}',
          body: `Hi {firstName},\n\nI noticed {companyName} is in the ${leads[0].companyIndustry} space. We work with similar companies to automate appointment booking with AI.\n\nCurious - how are you currently handling customer scheduling?\n\nBest,\nVoiceFly Team`,
          delay_days: 0,
          cta: 'Reply with your current process'
        },
        {
          subject: 'Case study: 40% more bookings',
          body: `Hi {firstName},\n\nOne of our clients in ${leads[0].companyIndustry} saw a 40% increase in appointments after automating their phone calls.\n\nTheir AI answers every call 24/7, books appointments, and sends confirmations automatically.\n\nWould 15 minutes next week work to show you how?\n\nBest,\nVoiceFly Team`,
          delay_days: 3,
          cta: 'Book a 15-min demo'
        },
        {
          subject: 'Last one, I promise',
          body: `Hi {firstName},\n\nI'll keep this quick - if better appointment booking isn't a priority right now, totally understand.\n\nBut if you're curious about AI voice automation (takes 5 min to set up), here's a demo link: [link]\n\nNo pressure!\n\nBest,\nVoiceFly Team`,
          delay_days: 7,
          cta: 'Watch 2-min demo video'
        }
      ],
      target_leads: leads.map(l => l.apolloId || ''),
      target_segment: 'cold',
      sent_count: 0,
      opened_count: 0,
      clicked_count: 0,
      replied_count: 0,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Default voice campaign fallback
   */
  private getDefaultVoiceCampaign(businessId: string, leads: EnrichedLead[]): VoiceCampaign {
    const sampleLead = leads[0]

    return {
      business_id: businessId,
      name: `Voice Outreach - ${new Date().toLocaleDateString()}`,
      status: 'draft',
      greeting: `Hi {firstName}, this is Maya from VoiceFly. How are you today?`,
      pitch: `The reason I'm calling is that we help ${sampleLead.companyIndustry} companies like ${sampleLead.companyName} automate appointment booking with AI voice technology. We've seen clients increase bookings by 40% while reducing staff workload. Would you be open to a quick 15-minute demo?`,
      objection_handling: {
        'too_busy': 'I totally understand. That\'s exactly why our solution works - it handles calls 24/7 so you don\'t have to. How about I send you a 2-minute video demo you can watch anytime?',
        'no_budget': 'Great question. Most clients see ROI in the first month from not missing calls. What if we showed you the numbers first, no commitment?',
        'not_decision_maker': 'No problem! Who should I speak with about improving your appointment booking process?',
        'already_have_solution': 'That\'s great you have something in place. What we hear from clients is that their old system missed after-hours calls. Does yours handle 24/7?',
        'need_more_info': 'Absolutely. I can send you a quick overview email. What\'s the best address?'
      },
      closing: `Perfect! I have next Tuesday at 2pm or Wednesday at 10am. Which works better for you?`,
      target_leads: leads.map(l => l.apolloId || ''),
      target_segment: sampleLead.segment,
      calls_made: 0,
      calls_connected: 0,
      appointments_booked: 0,
      created_at: new Date().toISOString()
    }
  }
}

/**
 * Singleton instance
 */
let campaignAutomationInstance: CampaignAutomation | null = null

export function getCampaignAutomation(): CampaignAutomation {
  if (!campaignAutomationInstance) {
    campaignAutomationInstance = new CampaignAutomation()
  }
  return campaignAutomationInstance
}
