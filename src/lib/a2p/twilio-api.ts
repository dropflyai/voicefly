/**
 * Twilio A2P 10DLC REST API wrapper
 *
 * Each tenant needs their own brand + campaign registered under our ISV account.
 * This module wraps the multi-step Twilio API dance:
 *
 *   1. Create Customer Profile (business identity bundle)
 *   2. Attach End User (legal business info)
 *   3. Submit Customer Profile for review
 *   4. Register A2P Brand (tied to customer profile)
 *   5. Create Messaging Service (per tenant)
 *   6. Register Campaign (tied to brand + messaging service)
 *
 * We use the raw REST API via fetch (same pattern as lib/sms/twilio-client.ts).
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!

const TRUSTHUB_BASE = 'https://trusthub.twilio.com/v1'
const MESSAGING_BASE = 'https://messaging.twilio.com/v1'

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
}

async function twilioRequest(
  url: string,
  options: { method?: 'GET' | 'POST' | 'DELETE'; body?: Record<string, any> } = {}
): Promise<any> {
  const { method = 'GET', body } = options

  const init: RequestInit = {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }

  if (body) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, String(v))
      } else {
        params.append(key, String(value))
      }
    }
    init.body = params.toString()
  }

  const res = await fetch(url, init)
  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const err: any = new Error(
      (data && typeof data === 'object' && data.message) || `Twilio ${res.status}`
    )
    err.status = res.status
    err.code = data?.code
    err.body = data
    throw err
  }

  return data
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BusinessLegalInfo {
  legal_name: string
  ein: string // 9-digit, no dashes
  business_type: 'Sole Proprietorship' | 'Partnership' | 'Corporation' | 'Co-operative' | 'Limited Liability Corporation' | 'Non-profit Corporation'
  business_registration_identifier: 'EIN' // hardcoded for US
  industry: string // e.g., "TECHNOLOGY", "HEALTHCARE", "RETAIL"
  website: string
  regions_of_operation: string[] // ['USA_AND_CANADA']
  address_street: string
  address_city: string
  address_state: string // 2-letter
  address_zip: string
  address_country: string // 'US'
  phone: string // E.164
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string // E.164
  contact_title: string
  contact_job_position: string
}

export interface CustomerProfileResult {
  sid: string
  status: string
}

export interface BrandRegistrationResult {
  sid: string
  status: 'PENDING' | 'APPROVED' | 'FAILED' | 'IN_REVIEW'
  brand_score?: number
  failure_reason?: string
}

export interface CampaignRegistrationResult {
  sid: string
  status: 'IN_PROGRESS' | 'VERIFIED' | 'FAILED'
  errors?: any[]
}

// ─── Customer Profile Bundle ───────────────────────────────────────────────

/**
 * Step 1: Create an empty Customer Profile bundle for the tenant.
 * Returns the customer profile SID (starts with BU).
 */
export async function createCustomerProfile(params: {
  friendlyName: string
  email: string
  policySid?: string // use Twilio's secondary customer profile policy
}): Promise<CustomerProfileResult> {
  const POLICY_SID = params.policySid || 'RNdfbf3fae0e1107f8aded0e7cead80bf5' // "Secondary Customer Profile Policy"

  const result = await twilioRequest(`${TRUSTHUB_BASE}/CustomerProfiles`, {
    method: 'POST',
    body: {
      FriendlyName: params.friendlyName,
      Email: params.email,
      PolicySid: POLICY_SID,
    },
  })

  return { sid: result.sid, status: result.status }
}

/**
 * Step 2: Attach business legal information to the customer profile.
 * Creates an End User of type `customer_profile_business_information` and
 * assigns it to the customer profile.
 */
export async function attachBusinessInfoToProfile(
  customerProfileSid: string,
  info: BusinessLegalInfo
): Promise<{ endUserSid: string }> {
  // Create the end-user with business info
  const endUser = await twilioRequest(`${TRUSTHUB_BASE}/EndUsers`, {
    method: 'POST',
    body: {
      FriendlyName: `${info.legal_name} - business info`,
      Type: 'customer_profile_business_information',
      Attributes: JSON.stringify({
        business_name: info.legal_name,
        business_registration_identifier: info.business_registration_identifier,
        business_registration_number: info.ein,
        business_type: info.business_type,
        business_industry: info.industry,
        business_regions_of_operation: info.regions_of_operation,
        website_url: info.website,
      }),
    },
  })

  // Assign to the customer profile
  await twilioRequest(
    `${TRUSTHUB_BASE}/CustomerProfiles/${customerProfileSid}/EntityAssignments`,
    {
      method: 'POST',
      body: { ObjectSid: endUser.sid },
    }
  )

  return { endUserSid: endUser.sid }
}

/**
 * Attach an address to the customer profile. Twilio requires the business
 * address be registered as a separate resource, then assigned.
 */
export async function attachAddressToProfile(
  customerProfileSid: string,
  info: BusinessLegalInfo
): Promise<{ addressSid: string }> {
  // Create the address under the main account
  const addressRes = await twilioRequest(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Addresses.json`,
    {
      method: 'POST',
      body: {
        CustomerName: info.legal_name,
        Street: info.address_street,
        City: info.address_city,
        Region: info.address_state,
        PostalCode: info.address_zip,
        IsoCountry: info.address_country,
        FriendlyName: `${info.legal_name} - HQ`,
      },
    }
  )

  // Attach to the profile
  await twilioRequest(
    `${TRUSTHUB_BASE}/CustomerProfiles/${customerProfileSid}/EntityAssignments`,
    {
      method: 'POST',
      body: { ObjectSid: addressRes.sid },
    }
  )

  return { addressSid: addressRes.sid }
}

/**
 * Attach an authorized representative (contact person) to the profile.
 */
export async function attachRepresentativeToProfile(
  customerProfileSid: string,
  info: BusinessLegalInfo
): Promise<{ endUserSid: string }> {
  const endUser = await twilioRequest(`${TRUSTHUB_BASE}/EndUsers`, {
    method: 'POST',
    body: {
      FriendlyName: `${info.contact_first_name} ${info.contact_last_name}`,
      Type: 'authorized_representative_1',
      Attributes: JSON.stringify({
        first_name: info.contact_first_name,
        last_name: info.contact_last_name,
        email: info.contact_email,
        phone_number: info.contact_phone,
        business_title: info.contact_title,
        job_position: info.contact_job_position,
      }),
    },
  })

  await twilioRequest(
    `${TRUSTHUB_BASE}/CustomerProfiles/${customerProfileSid}/EntityAssignments`,
    {
      method: 'POST',
      body: { ObjectSid: endUser.sid },
    }
  )

  return { endUserSid: endUser.sid }
}

/**
 * Step 3: Submit the customer profile for Twilio's review.
 * Typically approved within 1-2 business days.
 */
export async function submitCustomerProfile(customerProfileSid: string): Promise<CustomerProfileResult> {
  const result = await twilioRequest(
    `${TRUSTHUB_BASE}/CustomerProfiles/${customerProfileSid}`,
    {
      method: 'POST',
      body: { Status: 'pending-review' },
    }
  )
  return { sid: result.sid, status: result.status }
}

export async function getCustomerProfile(customerProfileSid: string): Promise<CustomerProfileResult> {
  const result = await twilioRequest(`${TRUSTHUB_BASE}/CustomerProfiles/${customerProfileSid}`)
  return { sid: result.sid, status: result.status }
}

// ─── A2P Brand Registration ────────────────────────────────────────────────

/**
 * Step 4: Register the A2P Brand (tied to the approved customer profile).
 * Only possible after the customer profile is approved.
 */
export async function registerBrand(params: {
  customerProfileSid: string
  a2pProfileBundleSid: string
  brandType?: 'STANDARD' | 'SOLE_PROPRIETOR'
}): Promise<BrandRegistrationResult> {
  const result = await twilioRequest(`${MESSAGING_BASE}/a2p/BrandRegistrations`, {
    method: 'POST',
    body: {
      CustomerProfileBundleSid: params.customerProfileSid,
      A2PProfileBundleSid: params.a2pProfileBundleSid,
      BrandType: params.brandType || 'STANDARD',
      Mock: 'false',
    },
  })

  return {
    sid: result.sid,
    status: result.status,
    brand_score: result.brand_score,
    failure_reason: result.failure_reason,
  }
}

export async function getBrandRegistration(brandSid: string): Promise<BrandRegistrationResult> {
  const result = await twilioRequest(`${MESSAGING_BASE}/a2p/BrandRegistrations/${brandSid}`)
  return {
    sid: result.sid,
    status: result.status,
    brand_score: result.brand_score,
    failure_reason: result.failure_reason,
  }
}

// ─── Messaging Service ──────────────────────────────────────────────────────

/**
 * Create a tenant-specific messaging service. Each tenant's campaign is tied
 * to their own messaging service; this also lets us attach their Twilio phone
 * number to the service for automatic outbound routing.
 */
export async function createMessagingService(params: {
  friendlyName: string
  inboundRequestUrl: string
  fallbackUrl?: string
}): Promise<{ sid: string }> {
  const result = await twilioRequest(`${MESSAGING_BASE}/Services`, {
    method: 'POST',
    body: {
      FriendlyName: params.friendlyName,
      InboundRequestUrl: params.inboundRequestUrl,
      FallbackUrl: params.fallbackUrl,
      UseInboundWebhookOnNumber: 'false',
    },
  })
  return { sid: result.sid }
}

/**
 * Attach a Twilio phone number to a messaging service.
 */
export async function attachPhoneNumberToService(
  messagingServiceSid: string,
  phoneNumberSid: string
): Promise<void> {
  await twilioRequest(
    `${MESSAGING_BASE}/Services/${messagingServiceSid}/PhoneNumbers`,
    {
      method: 'POST',
      body: { PhoneNumberSid: phoneNumberSid },
    }
  )
}

// ─── Campaign Registration ─────────────────────────────────────────────────

export interface CampaignRegistrationInput {
  brandSid: string
  messagingServiceSid: string
  description: string
  messageFlow: string
  messageSamples: string[]
  usAppToPersonUsecase: 'LOW_VOLUME' | 'ACCOUNT_NOTIFICATION' | 'CUSTOMER_CARE' | 'MARKETING' | 'MIXED'
  hasEmbeddedLinks: boolean
  hasEmbeddedPhone: boolean
  optInKeywords?: string[]
  optInMessage?: string
  optOutKeywords?: string[]
  optOutMessage?: string
  helpKeywords?: string[]
  helpMessage?: string
}

export async function registerCampaign(
  input: CampaignRegistrationInput
): Promise<CampaignRegistrationResult> {
  const body: Record<string, any> = {
    BrandRegistrationSid: input.brandSid,
    Description: input.description,
    MessageFlow: input.messageFlow,
    MessageSamples: input.messageSamples,
    UsAppToPersonUsecase: input.usAppToPersonUsecase,
    HasEmbeddedLinks: String(input.hasEmbeddedLinks),
    HasEmbeddedPhone: String(input.hasEmbeddedPhone),
  }

  if (input.optInKeywords?.length) body.OptInKeywords = input.optInKeywords
  if (input.optInMessage) body.OptInMessage = input.optInMessage
  if (input.optOutKeywords?.length) body.OptOutKeywords = input.optOutKeywords
  if (input.optOutMessage) body.OptOutMessage = input.optOutMessage
  if (input.helpKeywords?.length) body.HelpKeywords = input.helpKeywords
  if (input.helpMessage) body.HelpMessage = input.helpMessage

  const result = await twilioRequest(
    `${MESSAGING_BASE}/Services/${input.messagingServiceSid}/Compliance/Usa2p`,
    { method: 'POST', body }
  )

  return {
    sid: result.sid,
    status: result.campaign_status,
    errors: result.errors,
  }
}

export async function getCampaignRegistration(
  messagingServiceSid: string,
  campaignSid: string
): Promise<CampaignRegistrationResult> {
  const result = await twilioRequest(
    `${MESSAGING_BASE}/Services/${messagingServiceSid}/Compliance/Usa2p/${campaignSid}`
  )
  return {
    sid: result.sid,
    status: result.campaign_status,
    errors: result.errors,
  }
}

export async function listCampaignsForService(
  messagingServiceSid: string
): Promise<CampaignRegistrationResult[]> {
  const result = await twilioRequest(
    `${MESSAGING_BASE}/Services/${messagingServiceSid}/Compliance/Usa2p`
  )
  return (result.compliance || []).map((c: any) => ({
    sid: c.sid,
    status: c.campaign_status,
    errors: c.errors,
  }))
}

export async function deleteCampaign(
  messagingServiceSid: string,
  campaignSid: string
): Promise<void> {
  await twilioRequest(
    `${MESSAGING_BASE}/Services/${messagingServiceSid}/Compliance/Usa2p/${campaignSid}`,
    { method: 'DELETE' }
  )
}
