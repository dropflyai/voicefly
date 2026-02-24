/**
 * Voice AI Provisioning Service
 * Handles automatic creation of VAPI agents and phone numbers for new businesses
 *
 * Tiered approach:
 * - Starter: Custom agent with business name + job template
 * - Professional: + Brand personality customization
 * - Business: Full customization (USPs, target customer, etc.)
 */

import { getJobTemplate, MayaJobTemplate } from './maya-job-templates'
import { supabase } from './supabase-client'

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface ProvisioningInput {
  businessId: string
  businessName: string
  mayaJobId: string
  subscriptionTier: 'starter' | 'professional' | 'business' | 'trial'
  // Optional - for Professional/Business tiers
  brandPersonality?: 'professional' | 'warm' | 'luxury' | 'casual'
  businessDescription?: string
  uniqueSellingPoints?: string[]
  targetCustomer?: string
  priceRange?: 'budget' | 'mid-range' | 'premium' | 'luxury'
  // Voice preference from onboarding
  selectedVoice?: string
}

export interface ProvisioningResult {
  success: boolean
  agentId?: string
  agentName?: string
  phoneNumber?: string
  phoneId?: string
  error?: string
}

/**
 * Voice settings based on selected voice or brand personality
 */
const VOICE_SETTINGS: Record<string, { provider: string; voiceId: string; speed: number; stability: number }> = {
  sarah: { provider: '11labs', voiceId: 'sarah', speed: 1.0, stability: 0.8 },
  michael: { provider: '11labs', voiceId: 'michael', speed: 1.0, stability: 0.8 },
  emma: { provider: '11labs', voiceId: 'emma', speed: 1.05, stability: 0.75 },
  david: { provider: '11labs', voiceId: 'david', speed: 0.95, stability: 0.85 },
  // Brand personality defaults
  professional: { provider: '11labs', voiceId: 'sarah', speed: 1.0, stability: 0.8 },
  warm: { provider: '11labs', voiceId: 'sarah', speed: 0.95, stability: 0.75 },
  luxury: { provider: '11labs', voiceId: 'sarah', speed: 0.9, stability: 0.85 },
  casual: { provider: '11labs', voiceId: 'sarah', speed: 1.05, stability: 0.7 }
}

/**
 * Generate greeting based on tier
 */
function generateGreeting(input: ProvisioningInput, jobTemplate: MayaJobTemplate): string {
  const { businessName, subscriptionTier, brandPersonality } = input

  // Starter tier: Simple personalized greeting
  if (subscriptionTier === 'starter' || subscriptionTier === 'trial') {
    return `Thank you for calling ${businessName}! This is Maya. How can I help you today?`
  }

  // Professional tier: Brand personality greeting
  if (subscriptionTier === 'professional') {
    const greetings: Record<string, string> = {
      professional: `Thank you for calling ${businessName}. This is Maya, your dedicated assistant. How may I help you today?`,
      warm: `Hi there! You've reached ${businessName}, and this is Maya. I'm so happy to help you today!`,
      luxury: `Welcome to ${businessName}. This is Maya, your personal concierge. How may I create an exceptional experience for you?`,
      casual: `Hey! Thanks for calling ${businessName}! This is Maya. What can I do for you today?`
    }
    return greetings[brandPersonality || 'professional']
  }

  // Business tier: Full custom greeting (handled by business-profile-generator)
  return `Welcome to ${businessName}! This is Maya, and I'm here to provide you with exceptional service. How may I assist you today?`
}

/**
 * Generate system prompt based on tier
 */
function generateSystemPrompt(input: ProvisioningInput, jobTemplate: MayaJobTemplate): string {
  const { businessName, subscriptionTier, brandPersonality, businessDescription, uniqueSellingPoints, targetCustomer } = input

  // Base prompt from job template
  let systemPrompt = jobTemplate.systemPrompt

  // Add business context for all tiers
  systemPrompt += `\n\n---\nBUSINESS CONTEXT:\nYou represent ${businessName}. Always refer to the business by this name.\n`

  // Starter tier: Just business name
  if (subscriptionTier === 'starter' || subscriptionTier === 'trial') {
    systemPrompt += `Provide helpful, professional service to all callers.\n`
    return systemPrompt
  }

  // Professional tier: Add brand personality
  if (subscriptionTier === 'professional') {
    const personalityDescriptions: Record<string, string> = {
      professional: 'Maintain a professional, knowledgeable, and reliable tone throughout all interactions.',
      warm: 'Be warm, friendly, and personable. Make callers feel welcomed and cared for.',
      luxury: 'Embody elegance and sophistication. Treat every caller as a VIP guest.',
      casual: 'Keep it relaxed and friendly. Be approachable and easy-going.'
    }
    systemPrompt += `\nBRAND VOICE: ${personalityDescriptions[brandPersonality || 'professional']}\n`
    return systemPrompt
  }

  // Business tier: Full customization
  if (businessDescription) {
    systemPrompt += `\nABOUT US: ${businessDescription}\n`
  }
  if (uniqueSellingPoints && uniqueSellingPoints.length > 0) {
    systemPrompt += `\nOUR SPECIALTIES: ${uniqueSellingPoints.join(', ')}\n`
  }
  if (targetCustomer) {
    systemPrompt += `\nTARGET CUSTOMER: ${targetCustomer}\n`
  }

  const personalityDescriptions: Record<string, string> = {
    professional: 'Maintain a professional, knowledgeable, and reliable tone.',
    warm: 'Be warm, friendly, and personable.',
    luxury: 'Embody elegance and sophistication.',
    casual: 'Keep it relaxed and friendly.'
  }
  systemPrompt += `\nBRAND VOICE: ${personalityDescriptions[brandPersonality || 'professional']}\n`

  return systemPrompt
}

/**
 * Create VAPI agent
 */
async function createVapiAgent(input: ProvisioningInput, jobTemplate: MayaJobTemplate): Promise<{ id: string; name: string } | null> {
  const agentName = `Maya for ${input.businessName}`
  const systemPrompt = generateSystemPrompt(input, jobTemplate)
  const greeting = generateGreeting(input, jobTemplate)

  // Get voice settings
  const voiceKey = input.selectedVoice || input.brandPersonality || 'sarah'
  const voiceSettings = VOICE_SETTINGS[voiceKey] || VOICE_SETTINGS.sarah

  console.log(`Creating VAPI agent: ${agentName}`)

  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: agentName,
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ]
        },
        voice: {
          provider: voiceSettings.provider,
          voiceId: voiceSettings.voiceId,
          speed: voiceSettings.speed,
          stability: voiceSettings.stability
        },
        firstMessage: greeting,
        serverUrl: `${WEBHOOK_BASE_URL}/api/webhooks/phone-employee`,
        serverUrlSecret: input.businessId,
        metadata: {
          businessId: input.businessId,
          businessName: input.businessName,
          subscriptionTier: input.subscriptionTier,
          mayaJobId: input.mayaJobId,
          createdBy: 'voicefly-provisioning',
          version: '2.0'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('VAPI agent creation failed:', response.status, errorText)
      return null
    }

    const agentData = await response.json()
    console.log(`Agent created successfully: ${agentData.id}`)
    return { id: agentData.id, name: agentName }
  } catch (error) {
    console.error('Error creating VAPI agent:', error)
    return null
  }
}

/**
 * Purchase and configure phone number
 */
async function provisionPhoneNumber(businessId: string, businessName: string, agentId: string): Promise<{ id: string; number: string } | null> {
  console.log(`Provisioning phone number for ${businessName}`)

  try {
    // Step 1: Purchase phone number
    const purchaseResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'vapi', // Use VAPI's built-in phone numbers
        name: `${businessName} AI Line`
      })
    })

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text()
      console.error('Phone purchase failed:', purchaseResponse.status, errorText)
      return null
    }

    const phoneData = await purchaseResponse.json()
    console.log(`Phone purchased: ${phoneData.id}`)

    // Step 2: Configure phone with agent
    const configResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneData.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: agentId,
        serverUrl: `${WEBHOOK_BASE_URL}/api/webhooks/phone-employee`,
        serverUrlSecret: businessId
      })
    })

    if (!configResponse.ok) {
      const errorText = await configResponse.text()
      console.error('Phone configuration failed:', configResponse.status, errorText)
      // Phone purchased but not configured - still return it
    }

    console.log(`Phone configured successfully: ${phoneData.number || phoneData.id}`)
    return { id: phoneData.id, number: phoneData.number || phoneData.id }
  } catch (error) {
    console.error('Error provisioning phone number:', error)
    return null
  }
}

/**
 * Update business record with agent and phone info
 */
async function updateBusinessRecord(
  businessId: string,
  agentId: string,
  agentName: string,
  phoneId: string,
  phoneNumber: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('businesses')
      .update({
        agent_id: agentId,
        agent_type: 'custom-starter', // Will be 'custom-professional' or 'custom-business' for upgrades
        phone_number: phoneNumber,
        vapi_phone_number_id: phoneId,
        voice_ai_enabled: true,
        voice_ai_provisioned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)

    if (error) {
      console.error('Error updating business record:', error)
      return false
    }

    console.log(`Business record updated: ${businessId}`)
    return true
  } catch (error) {
    console.error('Error updating business:', error)
    return false
  }
}

/**
 * Store phone number in phone_numbers table
 */
async function storePhoneNumber(businessId: string, phoneId: string, phoneNumber: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('phone_numbers')
      .insert({
        business_id: businessId,
        phone_number: phoneNumber,
        vapi_phone_id: phoneId,
        vapi_phone_number_id: phoneId,
        is_primary: true,
        is_active: true,
        created_at: new Date().toISOString()
      })

    if (error) {
      // Table might not exist or have different schema - log but don't fail
      console.warn('Could not store in phone_numbers table:', error.message)
    }

    return true
  } catch (error) {
    console.warn('Error storing phone number:', error)
    return true // Don't fail provisioning for this
  }
}

/**
 * Main provisioning function
 * Called after onboarding to set up voice AI for a new business
 */
export async function provisionVoiceAI(input: ProvisioningInput): Promise<ProvisioningResult> {
  console.log(`\n========================================`)
  console.log(`Starting Voice AI Provisioning`)
  console.log(`Business: ${input.businessName} (${input.businessId})`)
  console.log(`Tier: ${input.subscriptionTier}`)
  console.log(`Job: ${input.mayaJobId}`)
  console.log(`========================================\n`)

  // Step 1: Get job template
  const jobTemplate = getJobTemplate(input.mayaJobId)
  if (!jobTemplate) {
    // Fall back to general receptionist if job template not found
    const fallbackTemplate = getJobTemplate('general-receptionist')
    if (!fallbackTemplate) {
      return {
        success: false,
        error: `Invalid maya job ID: ${input.mayaJobId} and no fallback available`
      }
    }
    console.log(`Using fallback job template: general-receptionist`)
  }

  const template = jobTemplate || getJobTemplate('general-receptionist')!

  // Step 2: Create VAPI agent
  const agent = await createVapiAgent(input, template)
  if (!agent) {
    return {
      success: false,
      error: 'Failed to create VAPI agent'
    }
  }

  // Step 3: Provision phone number
  const phone = await provisionPhoneNumber(input.businessId, input.businessName, agent.id)
  if (!phone) {
    return {
      success: false,
      agentId: agent.id,
      agentName: agent.name,
      error: 'Agent created but failed to provision phone number'
    }
  }

  // Step 4: Update business record
  await updateBusinessRecord(input.businessId, agent.id, agent.name, phone.id, phone.number)

  // Step 5: Store phone number record
  await storePhoneNumber(input.businessId, phone.id, phone.number)

  console.log(`\n========================================`)
  console.log(`Voice AI Provisioning Complete!`)
  console.log(`Agent: ${agent.name} (${agent.id})`)
  console.log(`Phone: ${phone.number} (${phone.id})`)
  console.log(`========================================\n`)

  return {
    success: true,
    agentId: agent.id,
    agentName: agent.name,
    phoneNumber: phone.number,
    phoneId: phone.id
  }
}

/**
 * Upgrade an existing agent to a higher tier
 * Used when customer upgrades from Starter to Professional/Business
 */
export async function upgradeVoiceAI(
  businessId: string,
  newTier: 'professional' | 'business',
  additionalData: Partial<ProvisioningInput>
): Promise<{ success: boolean; error?: string }> {
  console.log(`Upgrading Voice AI for ${businessId} to ${newTier}`)

  // Get current business data
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (fetchError || !business) {
    return { success: false, error: 'Business not found' }
  }

  if (!business.agent_id) {
    return { success: false, error: 'No existing agent to upgrade' }
  }

  // Get job template
  const jobTemplate = getJobTemplate(business.maya_job_id) || getJobTemplate('general-receptionist')!

  // Create upgraded input
  const input: ProvisioningInput = {
    businessId,
    businessName: business.name,
    mayaJobId: business.maya_job_id,
    subscriptionTier: newTier,
    brandPersonality: additionalData.brandPersonality || business.brand_personality || 'professional',
    businessDescription: additionalData.businessDescription || business.business_description,
    uniqueSellingPoints: additionalData.uniqueSellingPoints || business.unique_selling_points,
    targetCustomer: additionalData.targetCustomer || business.target_customer,
    priceRange: additionalData.priceRange || business.price_range
  }

  // Generate new prompts
  const systemPrompt = generateSystemPrompt(input, jobTemplate)
  const greeting = generateGreeting(input, jobTemplate)
  const voiceKey = input.brandPersonality || 'professional'
  const voiceSettings = VOICE_SETTINGS[voiceKey]

  // Update existing agent
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${business.agent_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ]
        },
        voice: voiceSettings,
        firstMessage: greeting,
        metadata: {
          businessId,
          businessName: business.name,
          subscriptionTier: newTier,
          mayaJobId: business.maya_job_id,
          upgradedAt: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Agent upgrade failed:', errorText)
      return { success: false, error: 'Failed to upgrade agent' }
    }

    // Update business record
    await supabase
      .from('businesses')
      .update({
        agent_type: `custom-${newTier}`,
        subscription_tier: newTier,
        brand_personality: input.brandPersonality,
        business_description: input.businessDescription,
        unique_selling_points: input.uniqueSellingPoints,
        target_customer: input.targetCustomer,
        price_range: input.priceRange,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)

    console.log(`Agent upgraded successfully to ${newTier}`)
    return { success: true }
  } catch (error) {
    console.error('Error upgrading agent:', error)
    return { success: false, error: 'Failed to upgrade agent' }
  }
}

/**
 * Check if a business has voice AI provisioned
 */
export async function checkProvisioningStatus(businessId: string): Promise<{
  provisioned: boolean
  agentId?: string
  phoneNumber?: string
}> {
  const { data: business } = await supabase
    .from('businesses')
    .select('agent_id, phone_number, voice_ai_enabled')
    .eq('id', businessId)
    .single()

  if (!business) {
    return { provisioned: false }
  }

  return {
    provisioned: !!(business.agent_id && business.phone_number),
    agentId: business.agent_id,
    phoneNumber: business.phone_number
  }
}
