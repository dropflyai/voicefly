import { supabase } from './supabase'

// Types for research system
export interface ResearchHistoryRecord {
  id?: string
  business_id: string
  query: string
  mode: 'deep' | 'quick' | 'prospect' | 'competitor' | 'market'
  result_content?: string
  result_summary?: string
  sources_count?: number
  confidence_score?: number
  related_lead_id?: string
  related_customer_id?: string
  page_context?: string
  duration_ms?: number
  tokens_used?: number
  created_by_staff_id?: string
  created_at?: string
}

export interface ResearchTemplate {
  id?: string
  business_id: string
  name: string
  description?: string
  query_template: string
  mode: string
  use_count?: number
  last_used_at?: string
  is_shared?: boolean
  created_by_staff_id?: string
  created_at?: string
  updated_at?: string
}

export interface Lead {
  id?: string
  business_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_name?: string
  job_title?: string
  linkedin_url?: string
  website?: string
  industry?: string
  company_size?: string
  location?: string
  lead_source?: string
  lead_status?: string
  qualification_score?: number
  last_contacted_at?: string
  next_follow_up_at?: string
  demo_scheduled_at?: string
  estimated_deal_value?: number
  estimated_close_date?: string
  assigned_to_staff_id?: string
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface LeadNote {
  id?: string
  business_id: string
  lead_id: string
  note_type?: 'general' | 'research' | 'call' | 'email' | 'meeting'
  title?: string
  content: string
  research_query?: string
  research_mode?: string
  created_by_staff_id?: string
  created_at?: string
  updated_at?: string
}

export interface MarketingCampaign {
  id?: string
  business_id: string
  name: string
  campaign_type?: 'email' | 'sms' | 'voice'
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  subject_line?: string
  preview_text?: string
  email_content?: string
  source_research_id?: string
  research_insights?: any
  target_segment?: string
  target_lead_status?: string
  target_tags?: string[]
  scheduled_send_at?: string
  sent_at?: string
  recipients_count?: number
  opens_count?: number
  clicks_count?: number
  replies_count?: number
  conversions_count?: number
  created_by_staff_id?: string
  created_at?: string
  updated_at?: string
}

export interface VoiceCampaign {
  id?: string
  business_id: string
  name: string
  description?: string
  status?: 'draft' | 'active' | 'paused' | 'completed'
  vapi_assistant_id?: string
  vapi_phone_number_id?: string
  greeting_script?: string
  value_proposition?: string
  qualifying_questions?: any
  objection_handling?: any
  closing_script?: string
  source_research_id?: string
  competitor_insights?: any
  target_segment?: string
  target_lead_status?: string
  max_calls_per_day?: number
  total_calls?: number
  successful_connections?: number
  demos_booked?: number
  deals_closed?: number
  created_by_staff_id?: string
  created_at?: string
  updated_at?: string
}

export class ResearchAPI {
  /**
   * Save research query and results to history
   */
  static async saveResearch(data: ResearchHistoryRecord): Promise<ResearchHistoryRecord | null> {
    try {
      const { data: research, error } = await supabase
        .from('research_history')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving research:', error)
        return null
      }

      return research
    } catch (error) {
      console.error('saveResearch failed:', error)
      return null
    }
  }

  /**
   * Get research history for a business
   */
  static async getResearchHistory(
    businessId: string,
    filters?: {
      mode?: string
      limit?: number
      related_lead_id?: string
    }
  ): Promise<ResearchHistoryRecord[]> {
    try {
      let query = supabase
        .from('research_history')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (filters?.mode) {
        query = query.eq('mode', filters.mode)
      }

      if (filters?.related_lead_id) {
        query = query.eq('related_lead_id', filters.related_lead_id)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(50)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching research history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getResearchHistory failed:', error)
      return []
    }
  }

  /**
   * Save a research template
   */
  static async saveTemplate(template: ResearchTemplate): Promise<ResearchTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('research_templates')
        .insert({
          ...template,
          use_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('saveTemplate failed:', error)
      return null
    }
  }

  /**
   * Get research templates
   */
  static async getTemplates(businessId: string): Promise<ResearchTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('research_templates')
        .select('*')
        .eq('business_id', businessId)
        .order('use_count', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getTemplates failed:', error)
      return []
    }
  }

  /**
   * Increment template use count
   */
  static async incrementTemplateUse(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_template_use', {
        template_id: templateId
      })

      if (error) {
        console.error('Error incrementing template use:', error)
        // Fallback: manual update
        await supabase
          .from('research_templates')
          .update({
            use_count: supabase.raw('use_count + 1'),
            last_used_at: new Date().toISOString()
          })
          .eq('id', templateId)
      }

      return true
    } catch (error) {
      console.error('incrementTemplateUse failed:', error)
      return false
    }
  }

  /**
   * Add note to lead (research results)
   */
  static async addLeadNote(note: LeadNote): Promise<LeadNote | null> {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          ...note,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding lead note:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('addLeadNote failed:', error)
      return null
    }
  }

  /**
   * Get lead notes
   */
  static async getLeadNotes(leadId: string, limit = 20): Promise<LeadNote[]> {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching lead notes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getLeadNotes failed:', error)
      return []
    }
  }

  /**
   * Create marketing campaign from research
   */
  static async createCampaign(campaign: MarketingCampaign): Promise<MarketingCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...campaign,
          status: campaign.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating campaign:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('createCampaign failed:', error)
      return null
    }
  }

  /**
   * Create voice campaign from research
   */
  static async createVoiceCampaign(campaign: VoiceCampaign): Promise<VoiceCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('voice_campaigns')
        .insert({
          ...campaign,
          status: campaign.status || 'draft',
          total_calls: 0,
          successful_connections: 0,
          demos_booked: 0,
          deals_closed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating voice campaign:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('createVoiceCampaign failed:', error)
      return null
    }
  }

  /**
   * Get leads for a business
   */
  static async getLeads(
    businessId: string,
    filters?: {
      status?: string
      limit?: number
    }
  ): Promise<Lead[]> {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('lead_status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching leads:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getLeads failed:', error)
      return []
    }
  }

  /**
   * Get a single lead
   */
  static async getLead(leadId: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error('Error fetching lead:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('getLead failed:', error)
      return null
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(lead: Lead): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          lead_status: lead.lead_status || 'new',
          qualification_score: lead.qualification_score || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('createLead failed:', error)
      return null
    }
  }

  /**
   * Update a lead
   */
  static async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('Error updating lead:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('updateLead failed:', error)
      return null
    }
  }

  /**
   * Get campaigns for a business
   */
  static async getCampaigns(
    businessId: string,
    filters?: {
      campaign_type?: 'email' | 'sms' | 'voice'
      status?: string
      limit?: number
    }
  ): Promise<MarketingCampaign[]> {
    try {
      let query = supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (filters?.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching campaigns:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('getCampaigns failed:', error)
      return []
    }
  }
}
