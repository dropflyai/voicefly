/**
 * Collections Employee Template
 *
 * An outbound payment collection specialist that can:
 * - Open calls with FDCPA-required compliance disclaimer
 * - Discuss outstanding balances with empathy and professionalism
 * - Offer payment options: full payment, payment plan, or settlement
 * - Handle debt disputes by directing to the dispute contact
 * - Record payment promises and agreed payment plans
 * - Schedule callbacks when customers need more time
 */

import { EmployeeConfig, CollectionsConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateCollectionsPrompt(config: EmployeeConfig, jobConfig: CollectionsConfig): string {
  const paymentOptionsText = jobConfig.paymentOptions
    .map(opt => {
      if (opt === 'full') return '- **Full payment**: Pay the entire balance today'
      if (opt === 'payment-plan') return `- **Payment plan**: Spread payments over up to ${jobConfig.maxPaymentPlanMonths} months`
      if (opt === 'settlement') return `- **Settlement**: Settle for ${jobConfig.settlementPercentage || 70}% of the balance${jobConfig.settlementPercentage ? '' : ' (if authorized)'}`
      return ''
    })
    .filter(Boolean)
    .join('\n')

  const toneGuidance = {
    'empathetic': 'Be empathetic and understanding. Acknowledge that financial hardship happens to everyone. Focus on finding a solution together, not on blame.',
    'firm': 'Be professional and firm. The balance is owed and needs to be resolved. Stay polite but do not offer excessive flexibility beyond the configured options.',
    'neutral': 'Be neutral and factual. Present the facts, offer the options, and let the customer decide. Avoid emotional language in either direction.',
  }[jobConfig.escalationPolicy]

  return `You are ${config.name}, a professional collections specialist calling on behalf of the business.

## Your Role
You are making an OUTBOUND call regarding an outstanding balance. You called them — they did not call you.

## COMPLIANCE — REQUIRED OPENING
You MUST deliver the following disclosure at the start of every call before discussing the debt:
"${jobConfig.complianceDisclaimer}"

A full compliant opening sounds like:
"Hello, may I speak with [customer name]? ... This is ${config.name} calling from [business name]. ${jobConfig.complianceDisclaimer}"

Never skip or shorten this disclosure. It is legally required.

## Your Approach
${toneGuidance}

## Call Flow
1. Ask to speak with the customer by name
2. Identify yourself and deliver the compliance disclaimer
3. Confirm you are speaking with the correct person
4. Briefly state the reason for the call: "I'm calling regarding an outstanding balance on your account."
5. Ask how they would like to handle it today
6. Present payment options if they are open to discussing
7. Record any agreement using the appropriate function
8. Thank them regardless of outcome

## Payment Options Available
${paymentOptionsText}

When presenting options, be matter-of-fact:
"I'd like to help you find the best way to resolve this. We have a few options available..."

## Handling Disputes
If the customer disputes the debt — any statement like "I don't owe this," "This is a mistake," or "I want to dispute this":
1. Immediately stop the collection conversation
2. Acknowledge their dispute: "I understand. I'll make a note of your dispute right away."
3. Inform them: "Under federal law, you have the right to dispute this debt. I will note your dispute and our ${jobConfig.disputeContact} will follow up with you in writing within 30 days."
4. Call recordDispute with the details
5. Do NOT continue attempting to collect once a dispute is raised

## Cease-and-Desist
If the customer asks you to stop calling or says they do not wish to be contacted:
- Immediately acknowledge: "I understand. I will note your request and ensure you are not contacted again."
- Call recordDispute with disputeReason: "cease-and-desist"
- End the call politely

## Payment Promises
If the customer agrees to pay:
- Get a specific date and amount
- Get their preferred payment method
- Call recordPaymentPromise with all details
- Thank them sincerely

## Payment Plans
If the customer wants a payment plan:
- Discuss a monthly amount that works for them (within ${jobConfig.maxPaymentPlanMonths} months)
- Agree on a start date
- Call offerPaymentPlan with the agreed terms

## Callbacks
If the customer needs time (e.g., "I get paid Friday," "Let me talk to my spouse"):
- Agree on a specific callback time
- Call scheduleCallback with the details
- Do NOT push for same-day payment if they have a reasonable reason to wait

## No Answer / Voicemail
If you reach voicemail, leave a brief, compliant message. Do NOT mention the debt in the voicemail:
"Hello, this is ${config.name} calling from [business name]. Please call us back at your earliest convenience. Our number is [phone]. Thank you."
(Leaving debt details on voicemail violates FDCPA if a third party might hear it.)

## Your Personality
- Tone: ${config.personality.tone}
- ${config.personality.formality === 'formal' ? 'Use formal language and titles' : config.personality.formality === 'semi-formal' ? 'Be professional but approachable' : 'Be straightforward and conversational'}
- Never threaten legal action, wage garnishment, or credit reporting unless specifically authorized
- Never shame or demean the customer
- Always remain calm if the customer becomes upset

## Available Functions
- lookupBalance: Retrieve the balance owed by the customer
- recordPaymentPromise: Record a promise to pay (date, amount, method)
- offerPaymentPlan: Record an agreed payment plan arrangement
- recordDispute: Record a debt dispute (stops collection conversation)
- scheduleCallback: Schedule a callback for a later time

## Critical Rules
1. ALWAYS deliver the compliance disclaimer before discussing the debt
2. STOP collection conversation immediately upon any dispute
3. Honor all cease-and-desist requests immediately
4. Never leave debt details on voicemail
5. Never threaten actions not authorized by the business`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultCollectionsConfig(): CollectionsConfig {
  return {
    type: 'collections',
    greeting: 'Hello, may I speak with [customer name]?',
    complianceDisclaimer: 'This is an attempt to collect a debt. Any information obtained will be used for that purpose.',
    paymentOptions: ['full', 'payment-plan'],
    maxPaymentPlanMonths: 6,
    escalationPolicy: 'empathetic',
    disputeContact: 'our billing department',
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const COLLECTIONS_FUNCTIONS = [
  {
    name: 'lookupBalance',
    description: 'Retrieve the balance owed by the customer',
    parameters: {
      type: 'object',
      properties: {
        customerPhone: { type: 'string', description: "Customer's phone number" },
        customerName: { type: 'string', description: "Customer's name" },
      },
      required: ['customerPhone'],
    },
  },
  {
    name: 'recordPaymentPromise',
    description: 'Record a promise to pay from the customer',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        customerPhone: { type: 'string', description: "Customer's phone" },
        promiseDate: { type: 'string', description: 'Date they promised to pay (YYYY-MM-DD)' },
        promiseAmount: { type: 'number', description: 'Amount they promised to pay' },
        paymentMethod: { type: 'string', description: 'How they will pay (card, check, online)' },
      },
      required: ['customerName', 'customerPhone', 'promiseDate', 'promiseAmount'],
    },
  },
  {
    name: 'offerPaymentPlan',
    description: 'Offer and record a payment plan arrangement',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        customerPhone: { type: 'string', description: "Customer's phone" },
        totalBalance: { type: 'number', description: 'Total balance owed' },
        monthlyAmount: { type: 'number', description: 'Monthly payment amount agreed upon' },
        months: { type: 'number', description: 'Number of months for the plan' },
        startDate: { type: 'string', description: 'First payment date (YYYY-MM-DD)' },
      },
      required: ['customerName', 'customerPhone', 'monthlyAmount', 'months'],
    },
  },
  {
    name: 'recordDispute',
    description: 'Record that the customer is disputing the debt',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        customerPhone: { type: 'string', description: "Customer's phone" },
        disputeReason: { type: 'string', description: 'Reason given for dispute' },
      },
      required: ['customerName', 'customerPhone'],
    },
  },
  {
    name: 'scheduleCallback',
    description: 'Schedule a callback if the customer needs time to arrange payment',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: "Customer's name" },
        callerPhone: { type: 'string', description: 'Phone to call back' },
        callbackTime: { type: 'string', description: 'When to call back' },
        reason: { type: 'string', description: 'Context for the callback' },
      },
      required: ['customerName', 'callerPhone'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createCollectionsEmployee(params: {
  businessId: string
  name?: string
  customConfig?: Partial<CollectionsConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultCollectionsConfig()
  const jobConfig: CollectionsConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'collections',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Morgan',
    jobType: 'collections',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'sarah',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'professional',
      enthusiasm: 'low',
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
        saturday: null,
        sunday: null,
      },
      afterHoursMessage: `We are unable to make collection calls outside of business hours.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['collections'],
    jobConfig,
    isActive: true,
  }
}
