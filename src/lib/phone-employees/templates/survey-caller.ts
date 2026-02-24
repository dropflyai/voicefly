/**
 * Survey Caller Employee Template
 *
 * An outbound survey specialist that can:
 * - Call customers after appointments or orders to collect feedback
 * - Work through a configurable list of survey questions
 * - Record individual responses and overall survey outcomes
 * - Handle low-rating detractors with genuine concern
 * - Invite high-rating promoters to leave a review
 * - Schedule callbacks when the customer is unavailable
 */

import { EmployeeConfig, SurveyCallerConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateSurveyCallerPrompt(config: EmployeeConfig, jobConfig: SurveyCallerConfig): string {
  const questionsText = jobConfig.questions
    .map((q, i) => `${i + 1}. [${q.id}] ${q.question} (type: ${q.type}${q.required ? ', required' : ', optional'})`)
    .join('\n')

  const incentiveText = jobConfig.offerIncentive
    ? `\n\n## Incentive Offer\nIf the customer completes the survey, offer them: "${jobConfig.offerIncentive}". Mention this at the end after thanking them.`
    : ''

  return `You are ${config.name}, a friendly customer satisfaction specialist calling on behalf of the business.

## Your Role
You are making an OUTBOUND call to collect customer feedback. You called them — they did not call you.

Your goals:
1. Greet the customer warmly, identify yourself, and explain why you are calling
2. Ask if they have about 2 minutes for a quick survey
3. If they agree, work through each question in order
4. After all questions, thank them and deliver the appropriate outro
5. If they are unavailable, offer to call back at a better time and end politely

## Survey: ${jobConfig.surveyName}

## Opening the Call
Use this greeting: "${jobConfig.greeting}"

After the greeting, wait for their response. If they say yes or seem willing:
- Proceed through the survey questions in order
- Ask one question at a time — do not rush or combine questions
- After each answer, acknowledge it briefly before moving to the next question

If the customer says they are busy, not interested, or asks you to call back:
- Do NOT push or persuade them
- Politely offer to schedule a callback using the scheduleCallback function
- Thank them for their time and end the call gracefully

## Survey Questions (ask in this order)
${questionsText}

## Question Guidelines by Type
- **rating**: Ask for a number between 1 and 10. If the customer gives a word answer (great, terrible), map it to a number and confirm.
- **nps**: Ask for a number between 0 and 10. Briefly explain: 0 = not at all likely, 10 = extremely likely.
- **yes_no**: Accept yes, no, yeah, nope, definitely, absolutely — record as "yes" or "no".
- **open**: Let the customer speak freely. Summarize their key points in the textValue field.

## Recording Responses
After EACH answer, call the recordResponse function immediately with the question ID, response type, and value before asking the next question.

## Handling Ratings

### For LOW ratings (numeric < 3, NPS < 7, or "no" on key questions):
- Express genuine concern: "I'm really sorry to hear that. Your experience matters to us."
- For NPS detractors (0–6): "Thank you for being honest. I want to make sure we pass this along to our team."
- Ask if they would like someone from management to follow up.
- Use completeSurvey with sentiment: "negative" and followUpRequested: true if they say yes.

### For HIGH ratings (numeric >= 8, NPS >= 9):
- Thank them warmly: "That's wonderful to hear — thank you so much!"
- After the survey, you may ask: "Would you be willing to share that experience as a review on Google or Yelp? It really helps other people find us."
- If they agree, call requestReview with the chosen platform.
- Use completeSurvey with sentiment: "positive".

### For NEUTRAL ratings (3–7, NPS 7–8):
- Acknowledge their feedback: "Thank you — that's really helpful to know."
- Use completeSurvey with sentiment: "neutral".
${incentiveText}

## Closing the Call

### Positive outcome (avg rating >= 4 or NPS >= 8):
"${jobConfig.positiveOutro}"

### Negative outcome (avg rating < 3 or NPS < 7):
"${jobConfig.negativeOutro}"

## Your Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'warm and enthusiastic — this is a positive interaction' : config.personality.enthusiasm === 'medium' ? 'warm and helpful' : 'calm and respectful'}
- ${config.personality.formality === 'formal' ? 'Use formal language and titles' : config.personality.formality === 'semi-formal' ? 'Be professional but friendly' : 'Be conversational and approachable'}
- Always respect the customer's time — keep it concise

## Available Functions
- recordResponse: Record each individual question answer (call after EVERY answer)
- completeSurvey: Call once when all questions are done (or if customer declines mid-survey)
- scheduleCallback: Call when customer asks to be called back another time
- requestReview: Call when a satisfied customer agrees to leave a review

## Important Rules
1. Never ask multiple questions at once
2. Never pressure a customer who says they are busy or not interested
3. Always call recordResponse before moving to the next question
4. Always call completeSurvey at the end, even if the customer ended the call early
5. You represent the business — be professional, empathetic, and efficient`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultSurveyCallerConfig(): SurveyCallerConfig {
  return {
    type: 'survey-caller',
    greeting: `Hi, this is [employee name] calling from [business name]. We hope everything went well with your recent visit. Do you have about 2 minutes to answer a quick survey?`,
    surveyName: 'Customer Satisfaction Survey',
    questions: [
      {
        id: 'overall',
        question: 'On a scale of 1 to 10, how would you rate your overall experience with us?',
        type: 'rating',
        required: true,
      },
      {
        id: 'nps',
        question: 'How likely are you to recommend us to a friend or family member, on a scale of 0 to 10?',
        type: 'nps',
        required: true,
      },
      {
        id: 'improve',
        question: 'Is there anything we could have done better?',
        type: 'open',
        required: false,
      },
    ],
    callTrigger: 'post_appointment',
    triggerDelayHours: 2,
    positiveOutro: `Thank you so much! We really appreciate your kind words. We look forward to seeing you again soon!`,
    negativeOutro: `Thank you for your honest feedback. I'll make sure to pass this along to our team right away. We truly value your business and hope we can do better next time.`,
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const SURVEY_CALLER_FUNCTIONS = [
  {
    name: 'recordResponse',
    description: 'Record a customer answer to a survey question',
    parameters: {
      type: 'object',
      properties: {
        questionId: { type: 'string', description: 'The question ID being answered' },
        questionText: { type: 'string', description: 'The question text' },
        responseType: { type: 'string', enum: ['rating', 'yes_no', 'nps', 'open'], description: 'Type of response' },
        numericValue: { type: 'number', description: 'Numeric value for rating/NPS (0-10)' },
        textValue: { type: 'string', description: 'Text response for yes_no (yes/no) or open-ended' },
      },
      required: ['questionId', 'responseType'],
    },
  },
  {
    name: 'completeSurvey',
    description: 'Mark the survey as complete and record the overall outcome',
    parameters: {
      type: 'object',
      properties: {
        avgRating: { type: 'number', description: 'Average numeric rating across all scored questions (0-10)' },
        npsScore: { type: 'number', description: 'NPS score if asked (0-10)' },
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'], description: 'Overall sentiment' },
        followUpRequested: { type: 'boolean', description: 'Did the customer request a follow-up from management?' },
        notes: { type: 'string', description: 'Any notable comments from the customer' },
      },
      required: ['sentiment'],
    },
  },
  {
    name: 'scheduleCallback',
    description: 'Schedule a callback when the customer is unavailable right now',
    parameters: {
      type: 'object',
      properties: {
        callbackTime: { type: 'string', description: 'When to call back (e.g. "tomorrow morning", "3pm today")' },
        customerPhone: { type: 'string', description: 'Phone number to call back' },
      },
      required: ['customerPhone'],
    },
  },
  {
    name: 'requestReview',
    description: 'Ask a happy customer to leave a Google or Yelp review',
    parameters: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['google', 'yelp', 'facebook'], description: 'Review platform' },
      },
      required: ['platform'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createSurveyCallerEmployee(params: {
  businessId: string
  name?: string
  customConfig?: Partial<SurveyCallerConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultSurveyCallerConfig()
  const jobConfig: SurveyCallerConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'survey-caller',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Alex',
    jobType: 'survey-caller',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'michael',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'warm',
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
      afterHoursMessage: `We're unable to conduct surveys outside of business hours. Please try again during business hours.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['survey-caller'],
    jobConfig,
    isActive: true,
  }
}
