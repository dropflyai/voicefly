/**
 * After-Hours Emergency Employee Template
 *
 * An AI phone agent that handles after-hours emergency calls:
 * - Triage incoming calls by urgency level
 * - Notify on-call contacts via SMS for true emergencies
 * - Take high-priority messages for urgent-but-not-critical situations
 * - Politely redirect non-emergency callers to business hours
 */

import { EmployeeConfig, AfterHoursEmergencyConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateAfterHoursEmergencyPrompt(config: EmployeeConfig, jobConfig: AfterHoursEmergencyConfig, businessName?: string): string {
  const onCallList = jobConfig.onCallContacts.length > 0
    ? jobConfig.onCallContacts.map((c, i) => `  ${i + 1}. ${c.name}${c.role ? ` (${c.role})` : ''}`).join('\n')
    : '  No on-call contacts configured — notify business owner.'

  const name = businessName || 'this business'
  return `You are ${config.name}, the after-hours emergency line for ${name}.

## Your Purpose
This is NOT a general receptionist line. This line exists for one reason: to handle emergencies outside business hours. Every second matters — do not waste time on pleasantries. Get to the point, triage quickly, and take the right action.

## Greeting
Always start with: "${jobConfig.greeting}"

## Triage Hierarchy — Follow This Exactly

### Level 1: TRUE EMERGENCY (fire, flood, injury, immediate danger)
1. Immediately call triageEmergency with urgencyLevel "critical"
2. Call notifyOnCall to alert the first on-call contact
3. Keep the caller on the line and calm them
4. If no response within 2 minutes, call escalateToBackup

### Level 2: URGENT (something broken, needs same-day attention, time-sensitive)
1. Call triageEmergency with urgencyLevel "urgent"
2. Call takeEmergencyMessage to record the details
3. Tell them someone will follow up as soon as possible — tonight or first thing tomorrow

### Level 3: NON-EMERGENCY (general question, can wait until business hours)
1. Do NOT call any emergency functions
2. Say: "${jobConfig.nonEmergencyResponse}"
3. Offer to take a regular message

## Emergency Keywords (trigger Level 1)
${jobConfig.emergencyKeywords.map(k => `- ${k}`).join('\n')}

## Urgent Keywords (trigger Level 2)
${jobConfig.urgentKeywords.map(k => `- ${k}`).join('\n')}

${generateBusinessTypeSection(jobConfig.businessType)}

## On-Call Contacts
${onCallList}

## Available Functions
- triageEmergency: Classify the call and urgency level — call this first for any emergency or urgent situation
- notifyOnCall: Send SMS to on-call contact — use for Level 1 emergencies immediately
- takeEmergencyMessage: Record a high-urgency message with callback info
- escalateToBackup: Try the next on-call person when primary is unreachable

${jobConfig.emergencyInstructions ? `## Special Instructions\n${jobConfig.emergencyInstructions}\n` : ''}
## Tone & Behavior
- Be calm, clear, and efficient — this is an emergency line
- Do NOT make small talk or use filler phrases like "I'd be happy to help"
- Ask direct questions: "What is the emergency?" "What is your location?" "Are you safe?"
- Confirm every critical detail before ending the call
- Always get a callback number if you don't already have one`
}

// ============================================
// BUSINESS-TYPE TRIAGE RULES
// ============================================

export function generateBusinessTypeSection(businessType: AfterHoursEmergencyConfig['businessType']): string {
  const sections: Record<AfterHoursEmergencyConfig['businessType'], string> = {
    'property-management': `## Property Management — Emergency Classification
CRITICAL (Level 1): flooding or burst pipe, gas smell, fire, break-in or active intruder, no heat when below freezing, structural collapse
URGENT (Level 2): lockout (tenant locked out), no hot water, elevator stuck with person inside, significant roof leak, major appliance failure
NON-EMERGENCY: general maintenance requests, noise complaints, lease questions — all wait until business hours`,

    'medical': `## Medical Practice — Emergency Classification
CRITICAL (Level 1): chest pain or pressure, difficulty breathing, uncontrolled bleeding, unconscious or unresponsive, allergic reaction or anaphylaxis, stroke symptoms (face drooping, arm weakness, speech difficulty)
URGENT (Level 2): high fever in infant, wound that may need stitches, severe pain, prescription running out (same day needed), concerning lab result
NON-EMERGENCY: appointment scheduling, prescription refills with lead time, billing questions, general medical questions — all wait until business hours
ALWAYS: If caller describes a life-threatening emergency, instruct them to call 911 immediately`,

    'hvac-contractor': `## HVAC Contractor — Emergency Classification
CRITICAL (Level 1): gas smell or suspected gas leak, electrical sparks or burning smell from HVAC unit, flooding from unit or condensate line, no heat when outside temperature is below 32F
URGENT (Level 2): no heat in near-freezing conditions, no AC in extreme heat (especially for elderly or infants), system completely non-functional
NON-EMERGENCY: routine maintenance, general service inquiries, equipment questions — all wait until business hours
ALWAYS: For gas leaks, instruct caller to leave the building and call the gas company and 911`,

    'legal': `## Legal Practice — Emergency Classification
CRITICAL (Level 1): court deadline today or tomorrow, client is being arrested right now, restraining order violation in progress, imminent deportation or detention, client safety at risk
URGENT (Level 2): just received legal paperwork with a short deadline (within 48 hours), bail hearing scheduled, client needs advice before a police interview
NON-EMERGENCY: general legal questions, new client inquiries, document review — all wait until business hours
ALWAYS: Remind callers that this line is not for general legal advice — it is for existing clients with urgent matters`,

    'general': `## General Business — Emergency Classification
CRITICAL (Level 1): fire on or near business premises, flood or water damage actively occurring, break-in or theft in progress, injury to a person on-site
URGENT (Level 2): significant property damage, security breach, equipment failure causing safety risk, situation requiring same-night response
NON-EMERGENCY: general questions, orders, appointments, complaints — all wait until business hours`,
  }

  return sections[businessType] || sections['general']
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultAfterHoursEmergencyConfig(businessName: string): AfterHoursEmergencyConfig {
  return {
    type: 'after-hours-emergency',
    greeting: `You've reached the after-hours emergency line for ${businessName}. I'm here to help with urgent matters.`,
    businessType: 'general',
    emergencyKeywords: ['fire', 'flood', 'gas leak', 'break-in', 'injury', 'emergency', 'help', 'burst pipe', 'no heat', 'locked out'],
    urgentKeywords: ['urgent', 'asap', 'need help', 'problem', 'broken', 'not working', 'immediately'],
    onCallContacts: [],
    nonEmergencyResponse: `I understand you're calling after hours. This line is for emergencies only. For non-urgent matters, please call back during business hours or leave a message and we'll get back to you first thing.`,
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const AFTER_HOURS_EMERGENCY_FUNCTIONS = [
  {
    name: 'triageEmergency',
    description: 'Classify the incoming call by type and urgency level. Call this as soon as the nature of the call is understood.',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: "Caller's name",
        },
        callerPhone: {
          type: 'string',
          description: "Caller's phone number",
        },
        emergencyType: {
          type: 'string',
          description: 'Brief description of the emergency type (e.g. "burst pipe", "no heat", "break-in")',
        },
        urgencyLevel: {
          type: 'string',
          enum: ['critical', 'emergency', 'urgent', 'non-urgent'],
          description: 'Urgency classification: critical/emergency = immediate danger, urgent = same-night attention needed, non-urgent = can wait',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the situation as described by the caller',
        },
        location: {
          type: 'string',
          description: 'Address or location of the emergency (if applicable)',
        },
      },
      required: ['urgencyLevel', 'description'],
    },
  },
  {
    name: 'notifyOnCall',
    description: 'Send an SMS notification to the designated on-call contact. Use for Level 1 critical emergencies.',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: "Caller's name",
        },
        callerPhone: {
          type: 'string',
          description: "Caller's phone number",
        },
        emergencyDescription: {
          type: 'string',
          description: 'Clear, concise description of the emergency to include in the SMS',
        },
        contactIndex: {
          type: 'number',
          description: 'Index of the on-call contact to notify (0 = first/primary, 1 = second, etc.)',
        },
      },
      required: ['emergencyDescription'],
    },
  },
  {
    name: 'takeEmergencyMessage',
    description: 'Record a high-urgency message for urgent situations that do not require immediate on-call notification.',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: "Caller's name",
        },
        callerPhone: {
          type: 'string',
          description: "Caller's phone number — required for callback",
        },
        message: {
          type: 'string',
          description: 'Full message describing the situation, urgency, and what the caller needs',
        },
        location: {
          type: 'string',
          description: 'Address or location (if relevant)',
        },
      },
      required: ['callerPhone', 'message'],
    },
  },
  {
    name: 'escalateToBackup',
    description: 'Try the next on-call contact when the primary is unreachable. Use after notifyOnCall has been attempted.',
    parameters: {
      type: 'object',
      properties: {
        failedContactIndex: {
          type: 'number',
          description: 'Index of the contact that did not respond (0 = primary, 1 = secondary, etc.)',
        },
        emergencyDescription: {
          type: 'string',
          description: 'Description of the emergency to include in escalation SMS',
        },
        callerPhone: {
          type: 'string',
          description: "Caller's phone number",
        },
      },
      required: ['emergencyDescription'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createAfterHoursEmergencyEmployee(params: {
  businessId: string
  businessName: string
  name?: string
  customConfig?: Partial<AfterHoursEmergencyConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultAfterHoursEmergencyConfig(params.businessName)
  const jobConfig: AfterHoursEmergencyConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'after-hours-emergency',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Alex',
    jobType: 'after-hours-emergency',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ',
      speed: 1.05,
      stability: 0.75,
    },

    personality: params.personality || {
      tone: 'professional',
      enthusiasm: 'low',
      formality: 'semi-formal',
    },

    schedule: {
      timezone: 'America/Los_Angeles',
      businessHours: {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      },
      afterHoursMessage: `You've reached the after-hours emergency line for ${params.businessName}.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['after-hours-emergency'],
    jobConfig,
    isActive: true,
  }
}
