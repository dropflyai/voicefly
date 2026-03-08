/**
 * Personal Assistant Employee Template
 *
 * A smart assistant that manages schedules and communications:
 * - Schedule and manage appointments
 * - Take messages with priority handling
 * - Send reminders and confirmations
 * - Handle rescheduling requests
 */

import { EmployeeConfig, PersonalAssistantConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generatePersonalAssistantPrompt(config: EmployeeConfig, jobConfig: PersonalAssistantConfig): string {
  return `You are ${config.name}, the personal assistant for ${jobConfig.ownerName}.

## Your Role
You manage ${jobConfig.ownerName}'s schedule and communications. Your responsibilities:
1. Schedule appointments and meetings
2. Take messages and prioritize them
3. Handle rescheduling and cancellation requests
4. Provide information about availability
5. Screen calls appropriately

## Greeting
Always start with: "${jobConfig.greeting}"

## Your Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'proactive and energetic' : config.personality.enthusiasm === 'medium' ? 'helpful and attentive' : 'calm and efficient'}
- ${config.personality.formality === 'formal' ? 'Maintain professional boundaries' : config.personality.formality === 'semi-formal' ? 'Be professional but personable' : 'Be friendly and approachable'}

## Scheduling Rules
${generateSchedulingRules(jobConfig)}

## Priority Handling
${generatePriorityRules(jobConfig)}

## Message Taking
When ${jobConfig.ownerName} is unavailable:
1. Politely explain they're not available
2. Determine if it's urgent
3. For urgent matters from VIP contacts, offer to interrupt
4. For normal messages, take detailed notes
5. Always get callback information

## VIP Contacts
These callers should receive priority treatment:
${jobConfig.messagePriorities.vipContacts.length > 0
  ? jobConfig.messagePriorities.vipContacts.map(c => `- ${c}`).join('\n')
  : '- No VIP contacts configured yet'}

## Auto-Responses
${jobConfig.autoResponses.map(ar => `- When caller mentions "${ar.trigger}": ${ar.response}`).join('\n')}

## Available Functions
- screenCall: Screen a caller — capture who they are and why they're calling
- lookupContact: Check if a caller is a known contact, VIP, or repeat caller
- scheduleAppointment: Book time on the calendar
- checkAvailability: See open slots
- rescheduleAppointment: Move an existing appointment
- cancelAppointment: Cancel an appointment
- takeMessage: Record a message with priority
- transferCall: Connect the caller directly to the owner
- getCalendarInfo: Get upcoming appointments and schedule
- createTask: Create a follow-up task or note for the owner
- sendReminder: Schedule a reminder to be sent

${generateRoleSection(jobConfig.ownerRole)}
## Important Guidelines
1. Protect ${jobConfig.ownerName}'s time - don't let anyone just "pop in"
2. For unknown callers wanting meetings, get context first
3. Double-book prevention is critical - always check availability
4. Confirm all appointment details before finalizing
5. For cancellations, always offer to reschedule

Remember: You're the gatekeeper. Be helpful but also protective of ${jobConfig.ownerName}'s schedule.`
}

function generateRoleSection(ownerRole?: string): string {
  const sections: Record<string, string> = {
    medical: `## Medical Practice Context
- Use HIPAA-aware language — never repeat diagnoses or clinical details back
- For prescription refills or medication questions: take a message, never advise
- Triage urgency: "chest pain", "can't breathe", "bleeding" = interrupt immediately
- Route to on-call line if after-hours emergency
- Always confirm callback number before ending the call`,

    legal: `## Legal Practice Context
- Never discuss case details, strategy, or case status — always take a message
- For opposing counsel: note their name, firm, case reference, and urgency level
- New client inquiries: capture name and general matter type only — never case details
- Confidentiality is paramount — do not confirm or deny representation
- Court deadlines or filing urgency = highest priority message`,

    'real-estate': `## Real Estate Context
- Capture property address for showing requests before anything else
- Buyer callers: ask if pre-approved, timeline, price range — log as lead
- Seller callers: ask property address, reason for selling, timeline — log as lead
- Other agents: get name, brokerage, and property or client they're calling about
- Offer or counteroffer situations = always interrupt the owner immediately`,

    executive: `## Executive Assistant Context
- Default to screening unknown callers aggressively — get full context before any commitment
- Investors, board members, and named VIPs = connect immediately if available
- Media or press inquiries: take message, do not confirm schedules or comment on anything
- Vendor or sales pitches: take their info, decline to schedule without owner approval
- Protect calendar at all times — never book without checking availability first`,

    consultant: `## Consulting / Coaching Context
- Prospective clients: qualify with "What challenge are you looking to solve?" before scheduling
- Discovery calls go on the calendar after basic qualification — budget, timeline, urgency
- Existing clients get priority — schedule immediately and take detailed messages
- Capture company name, role, and specific challenge for all new inquiries
- Referrals: ask who referred them and note it prominently`,

    financial: `## Financial Advisor Context
- Never discuss account balances, holdings, or performance to unverified callers
- Verify client identity before any account discussion
- Prospective clients: capture net worth range, investment goals, current advisor situation
- Regulatory or compliance calls: highest priority, interrupt immediately
- Always confirm callback number and best time before ending the call`,
  }

  if (!ownerRole || ownerRole === 'general' || !sections[ownerRole]) return ''
  return '\n' + sections[ownerRole] + '\n'
}

function generateSchedulingRules(config: PersonalAssistantConfig): string {
  const rules: string[] = []

  rules.push(`- Minimum notice required: ${config.schedulingRules.minNotice} minutes`)
  rules.push(`- Can book up to ${config.schedulingRules.maxAdvance} days in advance`)
  rules.push(`- Leave ${config.schedulingRules.bufferBetween} minutes between appointments`)

  if (config.schedulingRules.preferredTimes?.length) {
    rules.push(`- Preferred times: ${config.schedulingRules.preferredTimes.join(', ')}`)
  }

  return rules.join('\n')
}

function generatePriorityRules(config: PersonalAssistantConfig): string {
  const highPriority = config.messagePriorities.highPriorityKeywords

  return `High priority keywords: ${highPriority.join(', ')}

When someone uses these words:
1. Acknowledge the urgency
2. Offer to interrupt ${config.ownerName} if truly urgent
3. If they decline, assure prompt callback
4. Mark the message as high priority`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultPersonalAssistantConfig(ownerName: string): PersonalAssistantConfig {
  return {
    type: 'personal-assistant',
    ownerName,
    greeting: `Hello! This is ${ownerName}'s assistant. How can I help you today?`,

    schedulingRules: {
      minNotice: 60,        // 1 hour minimum
      maxAdvance: 30,       // 30 days out
      bufferBetween: 15,    // 15 min between meetings
      preferredTimes: ['morning', 'early afternoon'],
    },

    messagePriorities: {
      highPriorityKeywords: ['urgent', 'emergency', 'asap', 'critical', 'important', 'time-sensitive'],
      vipContacts: [],
    },

    autoResponses: [
      {
        trigger: 'running late',
        response: "Thank you for letting us know. I'll inform them right away.",
      },
      {
        trigger: 'need to cancel',
        response: "I understand. Would you like to reschedule for another time?",
      },
    ],
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const PERSONAL_ASSISTANT_FUNCTIONS = [
  {
    name: 'scheduleAppointment',
    description: 'Book a new appointment or meeting',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: 'Name of the person requesting the meeting',
        },
        callerPhone: {
          type: 'string',
          description: 'Phone number',
        },
        callerEmail: {
          type: 'string',
          description: 'Email address',
        },
        purpose: {
          type: 'string',
          description: 'Purpose/topic of the meeting',
        },
        date: {
          type: 'string',
          description: 'Requested date (YYYY-MM-DD)',
        },
        time: {
          type: 'string',
          description: 'Requested time (HH:MM)',
        },
        duration: {
          type: 'number',
          description: 'Meeting duration in minutes',
        },
        notes: {
          type: 'string',
          description: 'Additional notes',
        },
      },
      required: ['callerName', 'callerPhone', 'purpose', 'date', 'time'],
    },
  },
  {
    name: 'checkAvailability',
    description: 'Check calendar availability',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check (YYYY-MM-DD)',
        },
        duration: {
          type: 'number',
          description: 'Duration needed in minutes',
        },
        timePreference: {
          type: 'string',
          enum: ['morning', 'afternoon', 'any'],
          description: 'Time of day preference',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'rescheduleAppointment',
    description: 'Move an existing appointment to a new time',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: 'Name on the existing appointment',
        },
        originalDate: {
          type: 'string',
          description: 'Original appointment date',
        },
        originalTime: {
          type: 'string',
          description: 'Original appointment time',
        },
        newDate: {
          type: 'string',
          description: 'New requested date',
        },
        newTime: {
          type: 'string',
          description: 'New requested time',
        },
        reason: {
          type: 'string',
          description: 'Reason for rescheduling',
        },
      },
      required: ['callerName', 'newDate', 'newTime'],
    },
  },
  {
    name: 'cancelAppointment',
    description: 'Cancel an existing appointment',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: 'Name on the appointment',
        },
        appointmentDate: {
          type: 'string',
          description: 'Date of appointment to cancel',
        },
        appointmentTime: {
          type: 'string',
          description: 'Time of appointment to cancel',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation',
        },
        reschedule: {
          type: 'boolean',
          description: 'Does the caller want to reschedule',
        },
      },
      required: ['callerName'],
    },
  },
  {
    name: 'takeMessage',
    description: 'Record a message with priority',
    parameters: {
      type: 'object',
      properties: {
        callerName: {
          type: 'string',
          description: "Caller's name",
        },
        callerPhone: {
          type: 'string',
          description: 'Callback number',
        },
        callerCompany: {
          type: 'string',
          description: 'Company (if business call)',
        },
        message: {
          type: 'string',
          description: 'The message',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Message priority',
        },
        callbackRequested: {
          type: 'boolean',
          description: 'Caller wants a callback',
        },
        preferredCallbackTime: {
          type: 'string',
          description: 'When they want to be called back',
        },
      },
      required: ['callerName', 'callerPhone', 'message', 'priority'],
    },
  },
  {
    name: 'screenCall',
    description: 'Screen a caller to capture their identity, purpose, and urgency before deciding how to handle them',
    parameters: {
      type: 'object',
      properties: {
        callerName: { type: 'string', description: "Caller's full name" },
        callerPhone: { type: 'string', description: "Caller's phone number" },
        callerCompany: { type: 'string', description: "Caller's company or organization (if applicable)" },
        purpose: { type: 'string', description: 'Why they are calling' },
        urgency: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], description: 'How urgent this call is' },
        requestType: { type: 'string', enum: ['meeting', 'information', 'callback', 'emergency', 'sales', 'personal', 'other'], description: 'Category of the call' },
      },
      required: ['callerName', 'purpose'],
    },
  },
  {
    name: 'lookupContact',
    description: 'Look up a caller in the contact database to check if they are a known contact, VIP, or repeat caller',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: "Caller's phone number to look up" },
        name: { type: 'string', description: "Caller's name for additional matching" },
      },
      required: ['phone'],
    },
  },
  {
    name: 'createTask',
    description: 'Create a follow-up task or note for the owner to act on after the call',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Brief task title' },
        notes: { type: 'string', description: 'Detailed notes about what needs to be done' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format (optional)' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], description: 'Task priority' },
        relatedCallerName: { type: 'string', description: 'Name of the caller this task is about' },
        relatedCallerPhone: { type: 'string', description: 'Phone of the caller this task is about' },
      },
      required: ['title'],
    },
  },
  {
    name: 'transferCall',
    description: 'Transfer the call directly to the owner or a specific person',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Who to transfer to (e.g. owner name, "owner", "manager")',
        },
        reason: {
          type: 'string',
          description: 'Why this call needs to be transferred',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'getCalendarInfo',
    description: "Get the owner's upcoming appointments and schedule",
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check (YYYY-MM-DD, defaults to today)',
        },
      },
      required: [],
    },
  },
  {
    name: 'sendReminder',
    description: 'Schedule a reminder to be sent',
    parameters: {
      type: 'object',
      properties: {
        recipientPhone: {
          type: 'string',
          description: 'Phone number to send reminder to',
        },
        reminderTime: {
          type: 'string',
          description: 'When to send the reminder',
        },
        message: {
          type: 'string',
          description: 'Reminder message',
        },
      },
      required: ['recipientPhone', 'reminderTime', 'message'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createPersonalAssistantEmployee(params: {
  businessId: string
  ownerName: string
  ownerRole?: PersonalAssistantConfig['ownerRole']
  name?: string
  customConfig?: Partial<PersonalAssistantConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultPersonalAssistantConfig(params.ownerName)
  const jobConfig: PersonalAssistantConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'personal-assistant',
    ownerRole: params.ownerRole || params.customConfig?.ownerRole || 'general',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Maya',
    jobType: 'personal-assistant',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ',
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
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '12:00' },
        sunday: null,
      },
      afterHoursMessage: `${params.ownerName} is not available at the moment. Please leave a message with your name and number, and we'll get back to you as soon as possible.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['personal-assistant'],
    jobConfig,
    isActive: true,
  }
}
