// LeadFly Integration - Lead capture and enrichment
import { supabase } from './supabase-client';

export interface LeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  source?: string;
  businessId?: string;
}

export interface EnrichmentData {
  companyRevenue?: string;
  companyEmployees?: string;
  companyIndustry?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
}

/**
 * Capture a new lead
 */
export async function captureLead(leadData: LeadData) {
  try {
    // First, check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', leadData.phone)
      .single();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
        })
        .select('id')
        .single();

      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }

    // Create lead record
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        business_id: leadData.businessId,
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        company_name: leadData.companyName,
        job_title: leadData.jobTitle,
        lead_source: leadData.source || 'website',
        lead_status: 'new',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    return { success: true, leadId: lead.id, customerId };
  } catch (error) {
    console.error('Error capturing lead:', error);
    return { success: false, error };
  }
}

/**
 * Enrich lead with additional data from Apollo or other sources
 */
export async function enrichLead(leadId: string, enrichmentData: EnrichmentData) {
  try {
    const { data, error } = await supabase
      .from('lead_enrichment')
      .upsert({
        lead_id: leadId,
        company_revenue: enrichmentData.companyRevenue,
        company_employees: enrichmentData.companyEmployees,
        contact_linkedin: enrichmentData.linkedinUrl,
        contact_twitter: enrichmentData.twitterHandle,
        enrichment_source: 'apollo',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error enriching lead:', error);
    return { success: false, error };
  }
}

/**
 * Get lead by ID
 */
export async function getLead(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_enrichment (*)
      `)
      .eq('id', leadId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error getting lead:', error);
    return { success: false, error };
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(leadId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ lead_status: status })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating lead status:', error);
    return { success: false, error };
  }
}

/**
 * LeadFlyIntegration class - handles webhook integrations from various sources
 */
export class LeadFlyIntegration {
  /**
   * Handle incoming webhook from various lead sources
   */
  static async handleWebhook(source: string, body: any): Promise<string | null> {
    try {
      const leadData: LeadData = {
        firstName: body.firstName || body.first_name || '',
        lastName: body.lastName || body.last_name || '',
        email: body.email,
        phone: body.phone,
        companyName: body.company || body.companyName || body.company_name,
        jobTitle: body.title || body.jobTitle || body.job_title,
        source: source,
        businessId: body.businessId || body.business_id,
      };

      const result = await captureLead(leadData);
      return result.success ? result.leadId : null;
    } catch (error) {
      console.error('LeadFlyIntegration.handleWebhook error:', error);
      return null;
    }
  }

  /**
   * Capture lead from Apollo.io webhook
   */
  static async captureLeadFromApollo(body: any): Promise<string | null> {
    try {
      const leadData: LeadData = {
        firstName: body.person?.first_name || body.first_name || '',
        lastName: body.person?.last_name || body.last_name || '',
        email: body.person?.email || body.email,
        phone: body.person?.phone_numbers?.[0]?.sanitized_number || body.phone,
        companyName: body.person?.organization?.name || body.company,
        jobTitle: body.person?.title || body.title,
        source: 'apollo',
        businessId: body.businessId || body.business_id,
      };

      const result = await captureLead(leadData);

      // If we have enrichment data from Apollo, add it
      if (result.success && result.leadId && body.person?.organization) {
        await enrichLead(result.leadId, {
          companyRevenue: body.person.organization.estimated_annual_revenue,
          companyEmployees: body.person.organization.estimated_num_employees?.toString(),
          companyIndustry: body.person.organization.industry,
          linkedinUrl: body.person.linkedin_url,
          twitterHandle: body.person.twitter_url,
        });
      }

      return result.success ? result.leadId : null;
    } catch (error) {
      console.error('LeadFlyIntegration.captureLeadFromApollo error:', error);
      return null;
    }
  }

  /**
   * Capture lead from AudienceLab webhook
   */
  static async captureLeadFromAudienceLab(body: any): Promise<string | null> {
    return this.handleWebhook('audiencelab', body);
  }

  /**
   * Capture lead from LinkedIn webhook
   */
  static async captureLeadFromLinkedIn(body: any): Promise<string | null> {
    return this.handleWebhook('linkedin', body);
  }
}

export default {
  captureLead,
  enrichLead,
  getLead,
  updateLeadStatus,
  LeadFlyIntegration,
};
