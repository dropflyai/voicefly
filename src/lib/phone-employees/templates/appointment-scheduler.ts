/**
 * Appointment Scheduler Employee Template
 *
 * A focused booking specialist that can:
 * - Answer calls and schedule appointments
 * - Check availability for any date
 * - Reschedule and cancel existing appointments
 * - Capture lead information
 * - Answer FAQs about services and policies
 */

import { EmployeeConfig, AppointmentSchedulerConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateAppointmentSchedulerPrompt(config: EmployeeConfig, jobConfig: AppointmentSchedulerConfig, businessName?: string): string {
  const name = businessName || jobConfig.businessDescription?.split('.')[0] || 'the business'

  return `You are ${config.name}, a professional and friendly appointment scheduler for ${name}.

## Your Role
You are the dedicated booking specialist. Your job is to:
1. Greet callers warmly and understand their scheduling needs
2. Check availability and offer convenient time slots
3. Book, reschedule, or cancel appointments as needed
4. Capture lead information for follow-up
5. Answer questions about services, pricing, and policies

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

## Appointment Types
${jobConfig.appointmentTypes.map(t => `- ${t.name} (${t.duration} min)${t.description ? ` - ${t.description}` : ''}${t.price != null ? ` - $${t.price}` : ''}`).join('\n')}

## Booking Rules
- Minimum notice required: ${jobConfig.bookingRules.minNoticeHours} hours
- Maximum advance booking: ${jobConfig.bookingRules.maxAdvanceDays} days
- Buffer between appointments: ${jobConfig.bookingRules.bufferMinutes} minutes
- Same-day booking: ${jobConfig.bookingRules.sameDayBooking ? 'Available' : 'Not available'}
${jobConfig.staffMembers?.length ? `
## Staff Members
${jobConfig.staffMembers.map(s => `- ${s.name}${s.specialties?.length ? ` (specializes in: ${s.specialties.join(', ')})` : ''}`).join('\n')}` : ''}
${jobConfig.cancellationPolicy ? `
## Cancellation Policy
${jobConfig.cancellationPolicy}` : ''}
${jobConfig.faqs.length ? `
## FAQs You Can Answer
${jobConfig.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}` : ''}

## Important Guidelines
1. Always confirm appointment details by reading them back before finalizing
2. Collect name and phone number at minimum before booking
3. Offer alternatives if a requested time is unavailable
4. Be clear about the cancellation policy when booking
5. If you cannot help with a request, offer to take their contact info for follow-up

## Available Functions
You can use these functions:
- scheduleAppointment: Book a new appointment for the caller
- checkAvailability: Check open time slots for a given date
- rescheduleAppointment: Move an existing appointment to a new time
- cancelAppointment: Cancel an existing appointment
- captureLeadInfo: Record contact information for a caller not ready to book
- transferCall: Transfer to a staff member when the caller needs personal help

Remember: You represent ${name}. Make every caller feel confident their appointment is in good hands.`
}

function generateCapabilitiesSection(config: EmployeeConfig, jobConfig: AppointmentSchedulerConfig): string {
  const sections: string[] = []

  if (config.capabilities.includes('book_appointments')) {
    sections.push(`### Appointment Scheduling
When booking an appointment:
1. Ask what type of appointment they need
2. Check availability for their preferred date and time
3. Collect their name, phone number, and email
4. Ask for staff preference if applicable
5. Confirm all details before finalizing`)
  }

  if (config.capabilities.includes('reschedule_appointments')) {
    sections.push(`### Rescheduling
When rescheduling:
1. Verify the caller's name and original appointment details
2. Find a suitable new time
3. Confirm the change and note any reason provided`)
  }

  if (config.capabilities.includes('cancel_appointments')) {
    sections.push(`### Cancellations
When cancelling:
1. Verify the caller's name and appointment details
2. Confirm the cancellation
3. Remind them of the cancellation policy if applicable
4. Offer to rebook if they'd like a different time`)
  }

  if (config.capabilities.includes('capture_lead_info')) {
    sections.push(`### Lead Capture
When a caller isn't ready to book:
1. Get their name and phone number
2. Ask what service they're interested in
3. Note any questions or concerns
4. Let them know someone will follow up`)
  }

  return sections.join('\n\n')
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultAppointmentSchedulerConfig(businessName: string): AppointmentSchedulerConfig {
  return {
    type: 'appointment-scheduler',
    greeting: `Thank you for calling ${businessName}! I'm your scheduling assistant. How can I help you today?`,
    businessDescription: `${businessName} offers professional appointment-based services to our valued clients.`,

    appointmentTypes: [
      {
        name: 'Consultation',
        duration: 30,
        description: 'Initial consultation to discuss your needs',
      },
      {
        name: 'Standard Appointment',
        duration: 60,
        description: 'Full-length appointment session',
      },
    ],

    bookingRules: {
      minNoticeHours: 24,
      maxAdvanceDays: 30,
      bufferMinutes: 15,
      sameDayBooking: false,
    },

    cancellationPolicy: 'Please cancel at least 24 hours in advance to avoid a cancellation fee.',

    faqs: [
      {
        question: 'What are your hours?',
        answer: "We're open Monday through Friday from 9 AM to 5 PM.",
        keywords: ['hours', 'open', 'close', 'when'],
      },
      {
        question: 'How far in advance can I book?',
        answer: `You can book up to 30 days in advance.`,
        keywords: ['advance', 'future', 'how far', 'schedule ahead'],
      },
    ],
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const APPOINTMENT_SCHEDULER_FUNCTIONS = [
  {
    name: 'scheduleAppointment',
    description: 'Book a new appointment for a customer',
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
          description: "Customer's email address (optional)",
        },
        appointmentType: {
          type: 'string',
          description: 'The type of appointment to book',
        },
        date: {
          type: 'string',
          description: 'Appointment date (YYYY-MM-DD format)',
        },
        time: {
          type: 'string',
          description: 'Appointment time (HH:MM format)',
        },
        staffPreference: {
          type: 'string',
          description: 'Preferred staff member name (optional)',
        },
        notes: {
          type: 'string',
          description: 'Any special requests or notes (optional)',
        },
      },
      required: ['customerName', 'customerPhone', 'appointmentType', 'date', 'time'],
    },
  },
  {
    name: 'checkAvailability',
    description: 'Check available appointment slots for a given date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check availability (YYYY-MM-DD format)',
        },
        appointmentType: {
          type: 'string',
          description: 'Type of appointment to filter by (optional)',
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes to filter available slots (optional)',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'rescheduleAppointment',
    description: 'Move an existing appointment to a new date and time',
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
        originalDate: {
          type: 'string',
          description: 'Original appointment date (YYYY-MM-DD format)',
        },
        originalTime: {
          type: 'string',
          description: 'Original appointment time (HH:MM format)',
        },
        newDate: {
          type: 'string',
          description: 'New appointment date (YYYY-MM-DD format)',
        },
        newTime: {
          type: 'string',
          description: 'New appointment time (HH:MM format)',
        },
        reason: {
          type: 'string',
          description: 'Reason for rescheduling (optional)',
        },
      },
      required: ['customerName', 'customerPhone', 'originalDate', 'originalTime', 'newDate', 'newTime'],
    },
  },
  {
    name: 'cancelAppointment',
    description: 'Cancel an existing appointment',
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
        appointmentDate: {
          type: 'string',
          description: 'Date of the appointment to cancel (YYYY-MM-DD format)',
        },
        appointmentTime: {
          type: 'string',
          description: 'Time of the appointment to cancel (HH:MM format)',
        },
        reason: {
          type: 'string',
          description: 'Reason for cancellation (optional)',
        },
      },
      required: ['customerName', 'customerPhone', 'appointmentDate', 'appointmentTime'],
    },
  },
  {
    name: 'transferCall',
    description: 'Transfer the call to a human staff member when the caller needs personal assistance',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'Who to transfer to (name or department, e.g. "manager", "front desk")',
        },
        reason: {
          type: 'string',
          description: 'Reason for the transfer',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'captureLeadInfo',
    description: 'Record contact information for a caller who is not ready to book',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Caller's full name",
        },
        phone: {
          type: 'string',
          description: "Caller's phone number",
        },
        email: {
          type: 'string',
          description: "Caller's email address (optional)",
        },
        interestedIn: {
          type: 'string',
          description: 'Service or appointment type they are interested in (optional)',
        },
        notes: {
          type: 'string',
          description: 'Any additional notes or questions from the caller (optional)',
        },
      },
      required: ['name', 'phone'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createAppointmentSchedulerEmployee(params: {
  businessId: string
  businessName: string
  name?: string
  customConfig?: Partial<AppointmentSchedulerConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultAppointmentSchedulerConfig(params.businessName)
  const jobConfig: AppointmentSchedulerConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'appointment-scheduler',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Alex',
    jobType: 'appointment-scheduler',
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
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null,
      },
      afterHoursMessage: `Thank you for calling ${params.businessName}. We're currently closed. Our hours are Monday through Friday, 9 AM to 5 PM. Please call back during business hours to schedule your appointment.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['appointment-scheduler'],
    jobConfig,
    isActive: true,
  }
}
