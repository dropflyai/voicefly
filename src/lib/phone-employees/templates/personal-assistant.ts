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
- scheduleAppointment: Book time on the calendar
- checkAvailability: See open slots
- rescheduleAppointment: Move an existing appointment
- cancelAppointment: Cancel an appointment
- takeMessage: Record a message with priority
- sendReminder: Schedule a reminder to be sent
- getCalendarInfo: Get upcoming appointments

## Important Guidelines
1. Protect ${jobConfig.ownerName}'s time - don't let anyone just "pop in"
2. For unknown callers wanting meetings, get context first
3. Double-book prevention is critical - always check availability
4. Confirm all appointment details before finalizing
5. For cancellations, always offer to reschedule

Remember: You're the gatekeeper. Be helpful but also protective of ${jobConfig.ownerName}'s schedule.`
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
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Maya',
    jobType: 'personal-assistant',
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
