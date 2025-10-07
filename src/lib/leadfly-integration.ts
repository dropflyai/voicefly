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

export default {
  captureLead,
  enrichLead,
  getLead,
  updateLeadStatus,
};
