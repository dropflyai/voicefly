/**
 * Tenant A2P 10DLC Registration Service
 *
 * Orchestrates the multi-step Twilio registration flow and tracks
 * state in `tenant_a2p_registrations`. Callers only need to:
 *
 *   - startRegistration(businessId, info)    // kicks off customer profile
 *   - checkAndAdvance(businessId)            // polls and advances state
 *   - retryRegistration(registrationId, info)
 *
 * The flow:
 *   draft
 *     → submitCustomerProfile()
 *   customer_profile_pending
 *     → (Twilio approves)
 *   customer_profile_approved
 *     → registerBrand()
 *   brand_pending
 *     → (Twilio approves, 1-2 days)
 *   brand_approved
 *     → createMessagingService() + registerCampaign()
 *   campaign_pending
 *     → (Twilio approves, 2-3 weeks)
 *   campaign_approved
 *     → mark active, enable SMS on businesses row
 *   active
 */

import { createClient } from '@supabase/supabase-js'
import * as twilioApi from './twilio-api'
import type { BusinessLegalInfo } from './twilio-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.voiceflyai.com'

export type RegistrationStatus =
  | 'draft'
  | 'customer_profile_pending'
  | 'customer_profile_approved'
  | 'customer_profile_rejected'
  | 'brand_pending'
  | 'brand_approved'
  | 'brand_rejected'
  | 'campaign_pending'
  | 'campaign_approved'
  | 'campaign_rejected'
  | 'active'

export interface Registration {
  id: string
  business_id: string
  status: RegistrationStatus
  twilio_customer_profile_sid: string | null
  twilio_brand_sid: string | null
  twilio_messaging_service_sid: string | null
  twilio_campaign_sid: string | null
  twilio_phone_number: string | null
  business_legal_info: BusinessLegalInfo
  failure_reason: string | null
  failure_code: string | null
  failure_field: string | null
  created_at: string
  submitted_at: string | null
  brand_approved_at: string | null
  campaign_approved_at: string | null
  updated_at: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getActiveRegistration(businessId: string): Promise<Registration | null> {
  const { data } = await supabase
    .from('tenant_a2p_registrations')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Registration | null) || null
}

async function updateRegistration(id: string, updates: Partial<Registration>): Promise<Registration> {
  const { data, error } = await supabase
    .from('tenant_a2p_registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Registration
}

function buildCampaignMessageFlow(info: BusinessLegalInfo): string {
  return `Customers call ${info.legal_name} at our AI-answered business phone line. During the call, our AI assistant asks for the customer's mobile number and verbally confirms consent to send SMS (e.g., "Would you like me to text you a confirmation?"). Consent, phone number, and timestamp are logged. Only after explicit verbal opt-in does the system send transactional SMS (appointment confirmations, reminders, order updates). Customers may also initiate contact by texting the business number first — the act of texting is treated as express consent to receive replies. All messages include STOP to opt out and HELP for assistance. Program managed by VoiceFly (${APP_URL}/sms-terms).`
}

function buildCampaignSamples(info: BusinessLegalInfo): string[] {
  return [
    `Hi! Your appointment at ${info.legal_name} is confirmed for Thursday at 2:00 PM. Reply C to confirm, R to reschedule, STOP to opt out.`,
    `Reminder: You have an appointment at ${info.legal_name} tomorrow at 2:00 PM. Reply STOP to opt out, HELP for help.`,
  ]
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Step 1: Kick off registration by creating a Customer Profile and attaching
 * the business info + address + representative, then submitting for review.
 */
export async function startRegistration(
  businessId: string,
  info: BusinessLegalInfo
): Promise<Registration> {
  // Reject if already in progress or active
  const existing = await getActiveRegistration(businessId)
  if (existing && existing.status !== 'draft' && existing.status !== 'customer_profile_rejected'
      && existing.status !== 'brand_rejected' && existing.status !== 'campaign_rejected') {
    throw new Error(`Registration already in progress (status: ${existing.status})`)
  }

  // Create (or reuse) the row
  let registration: Registration
  if (existing) {
    registration = await updateRegistration(existing.id, {
      status: 'draft',
      business_legal_info: info,
      failure_reason: null,
      failure_code: null,
      failure_field: null,
    })
  } else {
    const { data, error } = await supabase
      .from('tenant_a2p_registrations')
      .insert({
        business_id: businessId,
        status: 'draft',
        business_legal_info: info,
      })
      .select()
      .single()
    if (error) throw error
    registration = data as Registration
  }

  // 1. Create customer profile bundle
  const profile = await twilioApi.createCustomerProfile({
    friendlyName: `${info.legal_name} - ${businessId.slice(0, 8)}`,
    email: info.contact_email,
  })

  // 2. Attach business info, address, representative
  await twilioApi.attachBusinessInfoToProfile(profile.sid, info)
  await twilioApi.attachAddressToProfile(profile.sid, info)
  await twilioApi.attachRepresentativeToProfile(profile.sid, info)

  // 3. Submit for review
  await twilioApi.submitCustomerProfile(profile.sid)

  return updateRegistration(registration.id, {
    status: 'customer_profile_pending',
    twilio_customer_profile_sid: profile.sid,
    submitted_at: new Date().toISOString(),
  })
}

/**
 * Poll Twilio for the current status and advance the state machine.
 * Call this from a cron, a webhook handler, or a "Check status" button.
 */
export async function checkAndAdvance(businessId: string): Promise<Registration> {
  const reg = await getActiveRegistration(businessId)
  if (!reg) throw new Error('No registration found')

  switch (reg.status) {
    case 'customer_profile_pending':
      return advanceCustomerProfile(reg)

    case 'customer_profile_approved':
      return advanceToBrand(reg)

    case 'brand_pending':
      return advanceBrand(reg)

    case 'brand_approved':
      return advanceToCampaign(reg)

    case 'campaign_pending':
      return advanceCampaign(reg)

    default:
      return reg
  }
}

async function advanceCustomerProfile(reg: Registration): Promise<Registration> {
  if (!reg.twilio_customer_profile_sid) return reg
  const profile = await twilioApi.getCustomerProfile(reg.twilio_customer_profile_sid)

  if (profile.status === 'twilio-approved') {
    return updateRegistration(reg.id, { status: 'customer_profile_approved' })
  }
  if (profile.status === 'twilio-rejected') {
    return updateRegistration(reg.id, {
      status: 'customer_profile_rejected',
      failure_reason: 'Customer profile rejected by Twilio review',
    })
  }
  return reg
}

async function advanceToBrand(reg: Registration): Promise<Registration> {
  if (!reg.twilio_customer_profile_sid) return reg

  const brand = await twilioApi.registerBrand({
    customerProfileSid: reg.twilio_customer_profile_sid,
    a2pProfileBundleSid: reg.twilio_customer_profile_sid, // same profile serves both
    brandType: 'STANDARD',
  })

  return updateRegistration(reg.id, {
    status: 'brand_pending',
    twilio_brand_sid: brand.sid,
  })
}

async function advanceBrand(reg: Registration): Promise<Registration> {
  if (!reg.twilio_brand_sid) return reg
  const brand = await twilioApi.getBrandRegistration(reg.twilio_brand_sid)

  if (brand.status === 'APPROVED') {
    return updateRegistration(reg.id, {
      status: 'brand_approved',
      brand_approved_at: new Date().toISOString(),
    })
  }
  if (brand.status === 'FAILED') {
    return updateRegistration(reg.id, {
      status: 'brand_rejected',
      failure_reason: brand.failure_reason || 'Brand registration failed',
    })
  }
  return reg
}

async function advanceToCampaign(reg: Registration): Promise<Registration> {
  if (!reg.twilio_brand_sid) return reg
  const info = reg.business_legal_info

  // Create tenant-specific messaging service
  const service = await twilioApi.createMessagingService({
    friendlyName: `${info.legal_name} - SMS`,
    inboundRequestUrl: `${APP_URL}/api/webhooks/sms`,
  })

  // Register the campaign
  const campaign = await twilioApi.registerCampaign({
    brandSid: reg.twilio_brand_sid,
    messagingServiceSid: service.sid,
    description: `${info.legal_name} sends transactional SMS to customers who called our AI phone assistant. Customers verbally consent during the call before any SMS is sent. Program powered by VoiceFly.`,
    messageFlow: buildCampaignMessageFlow(info),
    messageSamples: buildCampaignSamples(info),
    usAppToPersonUsecase: 'LOW_VOLUME',
    hasEmbeddedLinks: false,
    hasEmbeddedPhone: true,
    optInKeywords: ['START', 'UNSTOP'],
    optInMessage: `${info.legal_name}: You are now opted in. Reply HELP for help, STOP to opt out. Msg & data rates may apply.`,
    optOutKeywords: ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'END', 'QUIT', 'CANCEL', 'OPTOUT', 'REVOKE'],
    optOutMessage: `You have been unsubscribed from ${info.legal_name}. Reply START to resubscribe.`,
    helpKeywords: ['HELP', 'INFO'],
    helpMessage: `${info.legal_name} appointments. Reply STOP to opt out. Powered by VoiceFly. See ${APP_URL}/sms-terms`,
  })

  return updateRegistration(reg.id, {
    status: 'campaign_pending',
    twilio_messaging_service_sid: service.sid,
    twilio_campaign_sid: campaign.sid,
  })
}

async function advanceCampaign(reg: Registration): Promise<Registration> {
  if (!reg.twilio_messaging_service_sid || !reg.twilio_campaign_sid) return reg
  const campaign = await twilioApi.getCampaignRegistration(
    reg.twilio_messaging_service_sid,
    reg.twilio_campaign_sid
  )

  if (campaign.status === 'VERIFIED') {
    // Flip the SMS feature flag on the business
    await supabase
      .from('businesses')
      .update({ sms_enabled: true, updated_at: new Date().toISOString() })
      .eq('id', reg.business_id)

    return updateRegistration(reg.id, {
      status: 'active',
      campaign_approved_at: new Date().toISOString(),
    })
  }

  if (campaign.status === 'FAILED') {
    return updateRegistration(reg.id, {
      status: 'campaign_rejected',
      failure_reason: campaign.errors?.[0]?.description || 'Campaign rejected',
      failure_code: campaign.errors?.[0]?.error_code,
      failure_field: campaign.errors?.[0]?.fields?.[0],
    })
  }

  return reg
}

/**
 * Check whether SMS is enabled for a business.
 * Returns false unless the campaign is fully approved AND sms_enabled=true.
 */
export async function isSmsEnabled(businessId: string): Promise<boolean> {
  const { data } = await supabase
    .from('businesses')
    .select('sms_enabled')
    .eq('id', businessId)
    .maybeSingle()
  return !!data?.sms_enabled
}

export async function getRegistrationForBusiness(businessId: string): Promise<Registration | null> {
  return getActiveRegistration(businessId)
}
