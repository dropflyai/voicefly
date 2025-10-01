/**
 * Agent Provisioning Service
 * Handles creation of job-specific and custom VAPI agents
 */

import { getJobTemplate } from './maya-job-templates'
import { generateBusinessProfile, BusinessTierInfo, CustomBusinessProfile } from './business-profile-generator'

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-60875.up.railway.app'

// Pre-built job-specific agents (shared across customers)
const JOB_SPECIFIC_AGENTS: Record<string, string> = {
  'nail-salon-receptionist': '8ab7e000-aea8-4141-a471-33133219a471', // Current shared agent
  'hair-salon-coordinator': '', // To be created
  'spa-wellness-assistant': '', // To be created
  'massage-therapy-scheduler': '', // To be created
  'beauty-salon-assistant': '', // To be created
  'barbershop-coordinator': '', // To be created
  'medical-scheduler': '', // To be created
  'dental-coordinator': '', // To be created
  'fitness-coordinator': '' // To be created
}

export interface AgentProvisioningResult {
  agentId: string
  agentType: 'shared-job-specific' | 'custom-business'
  agentName: string
  phoneNumber?: string
  phoneId?: string
}

/**
 * Create a custom VAPI agent for Business tier
 */
async function createCustomVapiAgent(
  businessProfile: CustomBusinessProfile,
  businessId: string,
  services: Array<{name: string, price: number, duration: number}>
): Promise<string> {
  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: businessProfile.agentName,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: businessProfile.customSystemPrompt
          }
        ]
      },
      voice: {
        provider: businessProfile.voiceSettings.provider,
        voiceId: businessProfile.voiceSettings.voiceId,
        speed: businessProfile.voiceSettings.speed,
        stability: businessProfile.voiceSettings.stability
      },
      firstMessage: businessProfile.customGreeting,
      serverUrl: `${WEBHOOK_BASE_URL}/webhook/vapi/${businessId}`,
      serverUrlSecret: businessId,
      metadata: {
        businessId: businessId,
        agentType: 'custom-business',
        brandPersonality: businessProfile.brandVoice,
        createdBy: 'maya-provisioning-system',
        version: '1.0'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create custom VAPI agent: ${error}`)
  }

  const agentData = await response.json()
  return agentData.id
}

/**
 * Create or get job-specific shared agent
 */
async function createJobSpecificSharedAgent(mayaJobId: string, businessId: string): Promise<string> {
  // Check if we already have a pre-built agent for this job
  const existingAgentId = JOB_SPECIFIC_AGENTS[mayaJobId]
  
  if (existingAgentId) {
    console.log(`✅ Using existing job-specific agent for ${mayaJobId}:`, existingAgentId)
    return existingAgentId
  }

  // Create new job-specific agent if not exists
  const jobTemplate = getJobTemplate(mayaJobId)
  if (!jobTemplate) {
    throw new Error(`Invalid Maya job ID: ${mayaJobId}`)
  }

  console.log(`🤖 Creating new job-specific shared agent for: ${mayaJobId}`)
  
  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: jobTemplate.name,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: jobTemplate.systemPrompt
          }
        ]
      },
      voice: {
        provider: jobTemplate.voiceSettings.provider,
        voiceId: jobTemplate.voiceSettings.voiceId,
        speed: jobTemplate.voiceSettings.speed,
        stability: jobTemplate.voiceSettings.stability
      },
      firstMessage: jobTemplate.defaultGreeting,
      serverUrl: `${WEBHOOK_BASE_URL}/webhook/vapi/shared-${mayaJobId}`,
      serverUrlSecret: `shared-${mayaJobId}`,
      metadata: {
        agentType: 'shared-job-specific',
        mayaJobId: mayaJobId,
        createdBy: 'maya-provisioning-system',
        version: '1.0',
        shared: true
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create job-specific agent: ${error}`)
  }

  const agentData = await response.json()
  const newAgentId = agentData.id
  
  // Cache the agent ID for future use
  JOB_SPECIFIC_AGENTS[mayaJobId] = newAgentId
  
  console.log(`✅ Created new job-specific shared agent for ${mayaJobId}:`, newAgentId)
  return newAgentId
}

/**
 * Main function to provision agent based on plan tier
 */
export async function provisionMayaAgent(
  businessInfo: BusinessTierInfo,
  selectedPlan: 'starter' | 'professional' | 'business',
  businessId: string,
  services: Array<{name: string, price: number, duration: number}>
): Promise<AgentProvisioningResult> {
  
  console.log(`🤖 Provisioning Maya agent for ${selectedPlan} tier, job: ${businessInfo.mayaJobId}`)
  
  if (selectedPlan === 'business') {
    // Business tier gets custom agent
    console.log('🏢 Creating custom Business tier agent...')
    
    const businessProfile = generateBusinessProfile(businessInfo)
    const agentId = await createCustomVapiAgent(businessProfile, businessId, services)
    
    return {
      agentId,
      agentType: 'custom-business',
      agentName: businessProfile.agentName
    }
    
  } else {
    // Starter and Professional tiers get job-specific shared agents
    console.log(`👥 Using job-specific shared agent for ${selectedPlan} tier...`)
    
    const agentId = await createJobSpecificSharedAgent(businessInfo.mayaJobId!, businessId)
    const jobTemplate = getJobTemplate(businessInfo.mayaJobId!)
    
    return {
      agentId,
      agentType: 'shared-job-specific',
      agentName: jobTemplate?.name || `Maya - ${businessInfo.mayaJobId}`
    }
  }
}

/**
 * Link agent to phone number
 */
export async function linkAgentToPhone(agentId: string, phoneId: string): Promise<void> {
  const response = await fetch(`https://api.vapi.ai/phone-number/${phoneId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assistantId: agentId
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to link agent to phone: ${error}`)
  }

  console.log('✅ Agent linked to phone number successfully')
}

/**
 * Create phone number via VAPI
 */
export async function createVapiPhoneNumber(businessName: string): Promise<{id: string, number: string}> {
  const response = await fetch('https://api.vapi.ai/phone-number', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'vapi',
      name: `${businessName} Maya Line`,
      assistantId: null // Will be set later
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create phone number: ${error}`)
  }

  const phoneData = await response.json()
  return {
    id: phoneData.id,
    number: phoneData.number
  }
}

/**
 * Update existing agent with new business context (for shared agents)
 */
export async function updateSharedAgentContext(
  agentId: string, 
  businessName: string, 
  services: Array<{name: string, price: number, duration: number}>
): Promise<void> {
  // For shared agents, we inject business context via webhook
  // The agent remains the same, but gets business-specific info during calls
  console.log(`📝 Business context will be injected via webhook for shared agent: ${agentId}`)
  
  // Business context is handled in the webhook handler
  // This keeps shared agents efficient while providing personalization
}

/**
 * Get agent information
 */
export async function getAgentInfo(agentId: string): Promise<any> {
  const response = await fetch(`https://api.vapi.ai/assistant/${agentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get agent info: ${error}`)
  }

  return await response.json()
}

/**
 * Initialize job-specific shared agents (run once during system setup)
 */
export async function initializeJobSpecificAgents(): Promise<void> {
  console.log('🚀 Initializing job-specific shared agents...')
  
  const jobIds = [
    'hair-salon-coordinator',
    'spa-wellness-assistant', 
    'massage-therapy-scheduler',
    'beauty-salon-assistant',
    'barbershop-coordinator',
    'medical-scheduler',
    'dental-coordinator',
    'fitness-coordinator'
  ]

  for (const jobId of jobIds) {
    if (!JOB_SPECIFIC_AGENTS[jobId]) {
      try {
        console.log(`Creating shared agent for ${jobId}...`)
        const agentId = await createJobSpecificSharedAgent(jobId, 'shared-system')
        console.log(`✅ Created ${jobId} agent:`, agentId)
      } catch (error) {
        console.error(`❌ Failed to create ${jobId} agent:`, error)
      }
    }
  }
  
  console.log('✅ Job-specific shared agents initialization complete')
}