/**
 * Appointment Reminder Employee Template
 *
 * An outbound appointment reminder specialist that can:
 * - Call customers 24h (or configured hours) before their appointment
 * - Ask them to confirm, reschedule, or cancel
 * - Leave concise voicemails when the customer doesn't answer
 * - Send confirmation SMS after a successful confirmation
 */

import { EmployeeConfig, AppointmentReminderConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateAppointmentReminderPrompt(config: EmployeeConfig, jobConfig: AppointmentReminderConfig): string {
  const confirmationSection = jobConfig.confirmationRequired
    ? `After delivering the reminder, ask: "Can I confirm you'll be able to make it?" Wait for their response.
- If they confirm: thank them warmly and use confirmAppointment with confirmed: true.
- If they say they cannot make it or are unsure: ${jobConfig.rescheduleEnabled ? 'offer to reschedule using requestReschedule.' : 'let them know someone will follow up and use confirmAppointment with confirmed: false.'}`
    : `You do not need to ask for confirmation — just remind them and wish them well. Use confirmAppointment with confirmed: true to record the successful reminder.`

  const rescheduleSection = jobConfig.rescheduleEnabled
    ? `## Rescheduling
If the customer cannot make their appointment, offer to reschedule:
"No problem at all! Would you like me to pass along a reschedule request to our team so someone can find a new time that works for you?"
If they agree, call requestReschedule with their name, phone, original date, original time, and the reason they gave.`
    : ''

  const cancellationPolicySection = jobConfig.cancellationPolicy
    ? `## Cancellation Policy
If they mention wanting to cancel, relay this policy: "${jobConfig.cancellationPolicy}"`
    : ''

  return `You are ${config.name}, a friendly appointment reminder specialist calling on behalf of the business.

## Your Role
You are making an OUTBOUND call to remind a customer about their upcoming appointment. You called them — they did not call you.

Your goals:
1. Greet the customer and identify yourself and the business
2. Deliver a friendly reminder about their appointment
3. ${jobConfig.confirmationRequired ? 'Ask them to confirm they can make it' : 'Wish them well and end the call'}
4. Handle any reschedule or cancellation requests gracefully
5. If they do not answer, leave a concise voicemail and call recordNoAnswer

## Opening the Call
Use this greeting: "${jobConfig.greeting}"

Keep the reminder brief and friendly. A good example:
"Hi [name], this is ${config.name} calling from [business name] with a quick reminder about your appointment tomorrow at [time]. We're looking forward to seeing you!"

## Confirmation
${confirmationSection}

${rescheduleSection}

${cancellationPolicySection}

## Voicemail
If the call goes to voicemail, leave a brief message:
"Hi, this is ${config.name} calling from [business name] with a friendly reminder about your appointment [date/time]. If you have any questions or need to reschedule, please give us a call back. Thank you and have a great day!"
After leaving (or skipping) a voicemail, call recordNoAnswer.

## Your Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'warm and enthusiastic' : config.personality.enthusiasm === 'medium' ? 'friendly and helpful' : 'calm and respectful'}
- ${config.personality.formality === 'formal' ? 'Use formal language and titles' : config.personality.formality === 'semi-formal' ? 'Be professional but friendly' : 'Be conversational and approachable'}
- Never be pushy — if they want to cancel, process it gracefully and wish them well
- Keep the call short — customers appreciate brevity

## Available Functions
- confirmAppointment: Record that you reached the customer and their response
- requestReschedule: Handle a request to reschedule the appointment
- recordNoAnswer: Record when the call went unanswered (with or without voicemail)

## Important Rules
1. You are calling THEM — always identify yourself immediately
2. Do NOT pressure customers who want to cancel or reschedule
3. Always call one of the functions before ending the call
4. If you are unsure whether a voicemail was reached or a live person, treat it as a live person until they indicate otherwise`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultAppointmentReminderConfig(): AppointmentReminderConfig {
  return {
    type: 'appointment-reminder',
    greeting: `Hi, this is [employee name] calling from [business name] with a friendly reminder about your upcoming appointment.`,
    reminderLeadTimeHours: 24,
    confirmationRequired: true,
    rescheduleEnabled: true,
    sendConfirmationSms: true,
    cancellationPolicy: 'Please let us know as soon as possible if you need to cancel or reschedule.',
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const APPOINTMENT_REMINDER_FUNCTIONS = [
  {
    name: 'confirmAppointment',
    description: 'Record that the customer confirmed their upcoming appointment',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        customerPhone: { type: 'string', description: "Customer's phone" },
        appointmentDate: { type: 'string', description: 'Appointment date (YYYY-MM-DD)' },
        appointmentTime: { type: 'string', description: 'Appointment time (HH:MM)' },
        confirmed: { type: 'boolean', description: 'Did they confirm?' },
      },
      required: ['customerName', 'customerPhone', 'confirmed'],
    },
  },
  {
    name: 'requestReschedule',
    description: 'Handle a reschedule request from the customer',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        customerPhone: { type: 'string', description: "Customer's phone" },
        originalDate: { type: 'string', description: 'Original appointment date' },
        originalTime: { type: 'string', description: 'Original appointment time' },
        reason: { type: 'string', description: "Reason they can't make it" },
      },
      required: ['customerName', 'customerPhone'],
    },
  },
  {
    name: 'recordNoAnswer',
    description: 'Record that the call went unanswered (no voicemail or voicemail left)',
    parameters: {
      type: 'object',
      properties: {
        customerPhone: { type: 'string', description: "Customer's phone" },
        voicemailLeft: { type: 'boolean', description: 'Was a voicemail left?' },
      },
      required: ['customerPhone'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createAppointmentReminderEmployee(params: {
  businessId: string
  name?: string
  customConfig?: Partial<AppointmentReminderConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultAppointmentReminderConfig()
  const jobConfig: AppointmentReminderConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'appointment-reminder',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Riley',
    jobType: 'appointment-reminder',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'friendly',
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
      afterHoursMessage: `We're unable to make reminder calls outside of business hours. Please contact us directly for any changes to your appointment.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['appointment-reminder'],
    jobConfig,
    isActive: true,
  }
}
