/**
 * Lead Qualifier Employee Template
 *
 * An inbound AI phone employee that:
 * - Answers calls from prospects who found the business through ads or referrals
 * - Qualifies leads naturally through conversation (not interrogation)
 * - Scores leads as hot, warm, or cold
 * - Routes hot leads to sales or books discovery calls
 * - Captures warm leads for follow-up nurturing
 * - Respectfully dismisses cold leads
 */

import { EmployeeConfig, LeadQualifierConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateLeadQualifierPrompt(config: EmployeeConfig, jobConfig: LeadQualifierConfig): string {
  const hotCriteriaList = jobConfig.hotLeadCriteria.map(c => `- ${c}`).join('\n')

  const questionsSection = jobConfig.qualifyingQuestions.map((q, i) =>
    `${i + 1}. ${q.question}${q.required ? '' : ' (optional)'}`
  ).join('\n')

  const hotLeadActionInstructions = (() => {
    if (jobConfig.hotLeadAction === 'transfer' && jobConfig.transferNumber) {
      return `Call transferCall() to connect them with our sales team immediately. Give them a brief, enthusiastic handoff summary before transferring.`
    }
    if (jobConfig.hotLeadAction === 'book') {
      return `Call bookDiscoveryCall() to schedule a discovery call. Offer them time slots and get the appointment on the books before ending the call.`
    }
    return `Call scheduleCallback() to arrange a time for our team to call them back. Get the best time from the caller.`
  })()

  return `You are ${config.name}, a friendly representative for ${jobConfig.businessDescription}.

## Your Purpose
You answer inbound calls from people who are interested in what the business offers — whether they found us through an ad, a referral, or their own research. Your job is to have a genuine conversation, understand their situation, and connect the right people with the right next step.

You are NOT running an interrogation. You're having a conversation. Gather what you need naturally and make the caller feel heard and valued.

## Opening
Always start with: "${jobConfig.greeting}"

## Your Personality
- Tone: ${config.personality.tone}
- Warmth level: ${config.personality.enthusiasm === 'high' ? 'Enthusiastic and energizing — make them feel like they called at the perfect time' : config.personality.enthusiasm === 'medium' ? 'Warm and genuinely interested in their situation' : 'Calm, efficient, and professional'}
- ${config.personality.formality === 'formal' ? 'Keep the conversation professional and polished' : config.personality.formality === 'semi-formal' ? 'Be friendly and professional — like a trusted advisor, not a salesperson' : 'Keep it casual and conversational'}

## Conversation Flow
1. **Greet and establish rapport** — Use the greeting above, then ask if now is a good time
2. **Understand their situation** — Let them tell you why they called before diving into questions
3. **Work through the qualifying questions naturally** — don't fire them off in order. Weave them into the conversation
4. **Always get name and phone first** — before any lead scoring, make sure you have at least their name and callback number
5. **Score internally** — after gathering information, classify the lead (see criteria below)
6. **Take the right action** — follow the routing instructions for their tier

## Qualifying Questions (gather these naturally through conversation)
${questionsSection}

## Lead Scoring

### HOT Lead — Take immediate action
A lead is hot when ANY of the following apply:
${hotCriteriaList}

**When you identify a hot lead:**
Express genuine excitement that this sounds like a great fit. Then: ${hotLeadActionInstructions}
Before any action, call qualifyLead() to record what you've gathered, then scoreLead() with tier="hot".

### WARM Lead — Capture and nurture
A warm lead is interested but not quite ready — they may need more time, more information, or are still comparing options.

**When you identify a warm lead:**
Say: "${jobConfig.warmLeadResponse}"
Then call qualifyLead() to record their info, scoreLead() with tier="warm", and captureLeadInfo() so our team can follow up at the right time. Offer to answer any remaining questions they have.

### COLD Lead — Respectful exit
A cold lead is not a fit right now — wrong budget, wrong timeline, not the decision maker, or simply not the right product for them.

**When you identify a cold lead:**
Say: "${jobConfig.coldLeadResponse}"
Call scoreLead() with tier="cold". Be kind and genuine — don't waste their time or yours.

## Available Functions
- **qualifyLead** — Record qualifying information gathered during the call (name, phone, interest, timeline, budget, decision maker status)
- **scoreLead** — Submit the final lead score (hot/warm/cold) with your reasoning
- **bookDiscoveryCall** — Schedule a discovery or intro call for hot leads who want to book
- **captureLeadInfo** — Save a warm lead's contact info for future follow-up
- **transferCall** — Transfer a hot lead directly to the sales team
- **scheduleCallback** — Schedule a callback for a lead who isn't ready right now

## Critical Rules
1. ALWAYS get the caller's name and phone number before scoring the lead
2. Never pressure or push — if someone isn't ready, capture their info and let them go gracefully
3. Be genuine — if the product/service isn't right for them, say so. It saves everyone time.
4. Keep the conversation moving — don't drag it out unnecessarily
5. If they have questions you can't answer, tell them you'll make sure the right person follows up
6. Never make commitments about pricing or deliverables — that's for the sales team

Remember: Your goal is to identify the best-fit prospects and get them to the right next step — not to pitch or sell.`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultLeadQualifierConfig(businessName: string, businessDescription: string): LeadQualifierConfig {
  return {
    type: 'lead-qualifier',
    greeting: `Thanks for calling ${businessName}! I'd love to learn a bit about what you're looking for so I can connect you with the right person. Is now a good time?`,
    businessDescription,
    qualifyingQuestions: [
      {
        id: 'interest',
        question: 'What brings you to us today — what are you looking to accomplish?',
        field: 'interest',
        required: true,
      },
      {
        id: 'timeline',
        question: 'What does your timeline look like? Are you looking to move forward soon or still in the research phase?',
        field: 'timeline',
        required: true,
      },
      {
        id: 'budget',
        question: 'Do you have a rough budget in mind for this?',
        field: 'budget',
        required: false,
      },
    ],
    hotLeadCriteria: [
      'Ready to move forward within 30 days',
      'Has a defined budget',
      'Is the decision maker',
    ],
    hotLeadAction: 'book',
    coldLeadResponse: `I appreciate you reaching out! Based on what you've shared, it sounds like the timing might not be quite right yet. Feel free to reach back out when you're ready — we'd love to help.`,
    warmLeadResponse: `That sounds like a great fit for what we offer! I'll make sure someone from our team follows up with you soon. In the meantime, is there anything specific you'd like to know?`,
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const LEAD_QUALIFIER_FUNCTIONS = [
  {
    name: 'qualifyLead',
    description: 'Record qualifying information gathered from the prospect',
    parameters: {
      type: 'object',
      properties: {
        callerName: { type: 'string', description: "Prospect's full name" },
        callerPhone: { type: 'string', description: "Prospect's phone number" },
        callerEmail: { type: 'string', description: "Prospect's email (optional)" },
        callerCompany: { type: 'string', description: 'Company name (if B2B)' },
        interest: { type: 'string', description: 'What they are interested in / their main need' },
        timeline: { type: 'string', description: 'When they want to move forward (e.g. "immediately", "1-3 months", "just exploring")' },
        budgetRange: { type: 'string', description: 'Budget range mentioned (e.g. "$5k-10k", "under $1000", "not discussed")' },
        isDecisionMaker: { type: 'boolean', description: 'Are they the one making the purchasing decision?' },
        additionalNotes: { type: 'string', description: 'Any other relevant information' },
      },
      required: ['callerName', 'callerPhone', 'interest'],
    },
  },
  {
    name: 'scoreLead',
    description: 'Score the lead and determine next action',
    parameters: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['hot', 'warm', 'cold'], description: 'Lead quality tier' },
        reasoning: { type: 'string', description: 'Why this tier was assigned' },
        callerName: { type: 'string', description: "Prospect's name" },
        callerPhone: { type: 'string', description: "Prospect's phone" },
      },
      required: ['tier', 'callerName', 'callerPhone'],
    },
  },
  {
    name: 'bookDiscoveryCall',
    description: 'Book a discovery or intro call for a hot lead',
    parameters: {
      type: 'object',
      properties: {
        callerName: { type: 'string', description: "Prospect's name" },
        callerPhone: { type: 'string', description: "Prospect's phone" },
        callerEmail: { type: 'string', description: "Prospect's email" },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Time (HH:MM)' },
        notes: { type: 'string', description: 'Qualification notes for the sales person' },
      },
      required: ['callerName', 'callerPhone', 'date', 'time'],
    },
  },
  {
    name: 'captureLeadInfo',
    description: 'Save contact info for a warm lead for future follow-up',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Prospect's full name" },
        phone: { type: 'string', description: "Prospect's phone number" },
        email: { type: 'string', description: "Prospect's email (optional)" },
        interestedIn: { type: 'string', description: 'What they are interested in' },
        notes: { type: 'string', description: 'Context and qualification notes' },
      },
      required: ['name', 'phone'],
    },
  },
  {
    name: 'transferCall',
    description: 'Transfer a hot lead directly to the sales team',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Who to transfer to' },
        reason: { type: 'string', description: 'Lead summary to relay before transfer' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'scheduleCallback',
    description: 'Schedule a callback for a lead not ready to move forward yet',
    parameters: {
      type: 'object',
      properties: {
        callerName: { type: 'string', description: "Prospect's name" },
        callerPhone: { type: 'string', description: 'Phone to call back' },
        callbackTime: { type: 'string', description: 'When to call back' },
        reason: { type: 'string', description: 'Why calling back / what to follow up on' },
      },
      required: ['callerName', 'callerPhone'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createLeadQualifierEmployee(params: {
  businessId: string
  businessName: string
  businessDescription: string
  name?: string
  customConfig?: Partial<LeadQualifierConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultLeadQualifierConfig(params.businessName, params.businessDescription)
  const jobConfig: LeadQualifierConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'lead-qualifier',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Jordan',
    jobType: 'lead-qualifier',
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
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: null,
      },
      afterHoursMessage: `Thanks for calling ${params.businessName}! We're not available right now, but leave your name and number and we'll get back to you as soon as possible.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['lead-qualifier'],
    jobConfig,
    isActive: true,
  }
}
