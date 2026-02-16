/**
 * Receptionist Employee Template
 *
 * A professional front-desk phone employee that can:
 * - Answer calls and greet customers
 * - Take messages for team members
 * - Schedule appointments
 * - Answer FAQs
 * - Transfer to appropriate staff
 */

import { EmployeeConfig, ReceptionistConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateReceptionistPrompt(config: EmployeeConfig, jobConfig: ReceptionistConfig): string {
  const businessName = jobConfig.businessDescription?.split('.')[0] || 'the business'

  return `You are ${config.name}, a professional and friendly receptionist for ${businessName}.

## Your Role
You are the first point of contact for callers. Your job is to:
1. Greet callers warmly and professionally
2. Understand why they're calling
3. Help them with their needs (appointments, information, messages)
4. Transfer to the right person when needed
5. Take detailed messages when someone is unavailable

## Business Information
${jobConfig.businessDescription}

## Your Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'enthusiastic and upbeat' : config.personality.enthusiasm === 'medium' ? 'warm and helpful' : 'calm and professional'}
- ${config.personality.formality === 'formal' ? 'Use formal language and titles' : config.personality.formality === 'semi-formal' ? 'Be professional but friendly' : 'Be casual and approachable'}

## Greeting
Always start with: "${jobConfig.greeting}"

## Capabilities
${generateCapabilitiesSection(config, jobConfig)}

## Message Taking Guidelines
When taking a message:
${jobConfig.messagePrompt}

Always collect:
${jobConfig.messageFields.map(f => `- ${formatFieldName(f)}`).join('\n')}

## FAQs You Can Answer
${jobConfig.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

## Transfer Rules
${generateTransferRules(jobConfig)}

## Important Guidelines
1. Never make up information - if you don't know, offer to take a message or transfer
2. Always confirm important details by repeating them back
3. Be patient with callers who are confused or frustrated
4. Keep a professional demeanor at all times
5. If someone seems upset, acknowledge their feelings and offer to help

## Available Functions
You can use these functions:
- scheduleAppointment: Book an appointment for the caller
- checkAvailability: Check available appointment slots
- takeMessage: Record a message for someone
- transferCall: Transfer to another person
- getBusinessInfo: Get business information to share

Remember: You represent ${businessName}. Every interaction should leave the caller feeling valued and heard.`
}

function generateCapabilitiesSection(config: EmployeeConfig, jobConfig: ReceptionistConfig): string {
  const sections: string[] = []

  if (config.capabilities.includes('book_appointments') && jobConfig.services?.length) {
    sections.push(`### Appointment Scheduling
You can book appointments for these services:
${jobConfig.services.map(s => `- ${s.name} (${s.duration} minutes)${s.description ? ` - ${s.description}` : ''}`).join('\n')}

When booking:
1. Ask what service they need
2. Check availability for their preferred date/time
3. Collect their name and phone number
4. Confirm all details before booking`)
  }

  if (config.capabilities.includes('take_messages')) {
    sections.push(`### Message Taking
When someone isn't available:
1. Offer to take a message
2. Get caller's name and phone number
3. Ask about the reason for calling
4. Ask if it's urgent
5. Confirm you'll pass along the message`)
  }

  if (config.capabilities.includes('answer_faqs')) {
    sections.push(`### Information Requests
You can answer common questions about:
- Business hours and location
- Services offered and pricing
- Policies and procedures`)
  }

  return sections.join('\n\n')
}

function generateTransferRules(jobConfig: ReceptionistConfig): string {
  if (!jobConfig.transferRules?.length) {
    return 'If someone asks to speak with a specific person or department, offer to take a message or transfer the call.'
  }

  return jobConfig.transferRules.map(rule => {
    const destination = rule.destination === 'specific_person' && rule.personName
      ? rule.personName
      : rule.destination
    return `- For ${rule.keywords.join(', ')}: Transfer to ${destination}`
  }).join('\n')
}

function formatFieldName(field: string): string {
  const names: Record<string, string> = {
    name: "Caller's full name",
    phone: 'Phone number to call back',
    email: 'Email address (optional)',
    company: 'Company name (if business call)',
    reason: 'Reason for calling',
    urgency: 'How urgent is this? (normal/urgent)',
  }
  return names[field] || field
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultReceptionistConfig(businessName: string): ReceptionistConfig {
  return {
    type: 'receptionist',
    greeting: `Thank you for calling ${businessName}! This is your virtual receptionist. How may I help you today?`,
    businessDescription: `${businessName} is committed to providing excellent service to our customers.`,

    transferRules: [
      {
        keywords: ['sales', 'pricing', 'buy', 'purchase'],
        destination: 'sales',
      },
      {
        keywords: ['problem', 'issue', 'complaint', 'support', 'help'],
        destination: 'support',
      },
      {
        keywords: ['manager', 'supervisor', 'owner'],
        destination: 'manager',
      },
    ],

    messagePrompt: "I'd be happy to take a message for them. Can I get your name and the best number to reach you?",

    messageFields: ['name', 'phone', 'reason', 'urgency'],

    faqs: [
      {
        question: "What are your hours?",
        answer: "We're open Monday through Friday from 9 AM to 5 PM.",
        keywords: ['hours', 'open', 'close', 'when'],
      },
      {
        question: "Where are you located?",
        answer: "Our address is available on our website. Would you like me to text it to you?",
        keywords: ['location', 'address', 'where', 'directions'],
      },
    ],

    services: [],
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const RECEPTIONIST_FUNCTIONS = [
  {
    name: 'scheduleAppointment',
    description: 'Book an appointment for a customer',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: "Customer's full name",
        },
        customerPhone: {
          type: 'string',
          description: "Customer's phone number",
        },
        customerEmail: {
          type: 'string',
          description: "Customer's email (optional)",
        },
        service: {
          type: 'string',
          description: 'The service they want to book',
        },
        date: {
          type: 'string',
          description: 'Preferred date (YYYY-MM-DD format)',
        },
        time: {
          type: 'string',
          description: 'Preferred time (HH:MM format)',
        },
        notes: {
          type: 'string',
          description: 'Any special requests or notes',
        },
      },
      required: ['customerName', 'customerPhone', 'service', 'date', 'time'],
    },
  },
  {
    name: 'checkAvailability',
    description: 'Check available appointment slots',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check availability (YYYY-MM-DD)',
        },
        service: {
          type: 'string',
          description: 'Service type (optional, to filter by duration)',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'takeMessage',
    description: 'Record a message for someone who is unavailable',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: "Caller's name",
        },
        callerPhone: {
          type: 'string',
          description: 'Phone number to call back',
        },
        callerEmail: {
          type: 'string',
          description: 'Email address (optional)',
        },
        forPerson: {
          type: 'string',
          description: 'Who the message is for',
        },
        message: {
          type: 'string',
          description: 'The message content',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'How urgent is this message',
        },
        callbackRequested: {
          type: 'boolean',
          description: 'Does the caller want a callback',
        },
      },
      required: ['callerName', 'callerPhone', 'message'],
    },
  },
  {
    name: 'transferCall',
    description: 'Transfer the call to another person or department',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Who to transfer to (name or department)',
        },
        reason: {
          type: 'string',
          description: 'Reason for transfer',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'getBusinessInfo',
    description: 'Get business information to share with caller',
    parameters: {
      type: 'object',
      properties: {
        infoType: {
          type: 'string',
          enum: ['hours', 'location', 'services', 'contact', 'general'],
          description: 'What type of information is needed',
        },
      },
      required: ['infoType'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createReceptionistEmployee(params: {
  businessId: string
  businessName: string
  name?: string
  customConfig?: Partial<ReceptionistConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultReceptionistConfig(params.businessName)
  const jobConfig: ReceptionistConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'receptionist',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Maya',
    jobType: 'receptionist',
    complexity: 'simple',

    voice: params.voice || {
      provider: 'elevenlabs',
      voiceId: 'sarah',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'professional',
      enthusiasm: 'medium',
      formality: 'semi-formal',
    },

    schedule: {
      timezone: 'America/Los_Angeles',
      businessHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null,
      },
      afterHoursMessage: `Thank you for calling ${params.businessName}. We're currently closed. Our hours are Monday through Friday, 9 AM to 5 PM. Please leave a message and we'll call you back on the next business day.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['receptionist'],
    jobConfig,
    isActive: true,
  }
}
