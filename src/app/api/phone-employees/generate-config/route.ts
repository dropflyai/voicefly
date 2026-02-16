/**
 * Generate Phone Employee Config API
 *
 * POST /api/phone-employees/generate-config
 *
 * Uses Claude to generate a phone employee configuration
 * from a free-text business description.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { validateBusinessAccess } from '@/lib/api-auth'
import type {
  ReceptionistConfig,
  PersonalAssistantConfig,
  OrderTakerConfig,
} from '@/lib/phone-employees/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type JobType = 'receptionist' | 'order-taker' | 'personal-assistant'

interface GenerateConfigRequest {
  businessId: string
  jobType: JobType
  businessDescription: string
  employeeName?: string
}

interface BusinessData {
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  timezone?: string
  business_type?: string
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildReceptionistPrompt(businessDescription: string, business: BusinessData, employeeName?: string): string {
  return `You are generating a phone receptionist configuration for a business. Based on the business description and data provided, generate a complete, realistic configuration.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.address ? `- Address: ${business.address}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}

## Instructions
Generate a JSON object with the following structure. Be creative and thorough based on what the business likely needs. Infer services, FAQs, and transfer rules from the business type and description.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "receptionist",
    "greeting": "A warm, professional phone greeting that mentions the business name. 1-2 sentences max.",
    "businessDescription": "A polished 2-3 sentence description of the business suitable for an AI receptionist to reference.",
    "services": [
      {
        "name": "Service Name",
        "duration": 30,
        "description": "Brief description of the service"
      }
    ],
    "faqs": [
      {
        "question": "A common question callers might ask",
        "answer": "A helpful, accurate answer",
        "keywords": ["keyword1", "keyword2"]
      }
    ],
    "transferRules": [
      {
        "keywords": ["sales", "pricing"],
        "destination": "sales"
      },
      {
        "keywords": ["problem", "issue", "complaint"],
        "destination": "support"
      },
      {
        "keywords": ["manager", "owner"],
        "destination": "manager"
      }
    ],
    "messagePrompt": "A natural prompt the receptionist uses when offering to take a message",
    "messageFields": ["name", "phone", "email", "reason", "urgency"],
    "businessHours": {
      "monday": { "start": "09:00", "end": "17:00" },
      "tuesday": { "start": "09:00", "end": "17:00" },
      "wednesday": { "start": "09:00", "end": "17:00" },
      "thursday": { "start": "09:00", "end": "17:00" },
      "friday": { "start": "09:00", "end": "17:00" },
      "saturday": null,
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}",
    "afterHoursMessage": "A friendly after-hours message mentioning the business name and hours"
  },
  "greeting": "The same greeting from config.greeting above",
  "suggestions": [
    "A specific, actionable tip for improving this receptionist configuration",
    "Another tip based on the business type",
    "A third tip about features they could enable"
  ]
}

## Rules
- Generate 3-8 services based on the business type
- Generate 4-8 FAQs that callers would commonly ask
- Generate 2-4 transfer rules with realistic keywords
- Set business hours appropriate for the business type (e.g., restaurants have longer hours)
- The greeting should be warm but concise (callers don't want a long intro)
- FAQs should have 2-5 keywords each
- The "destination" for transferRules must be one of: "manager", "sales", "support", "specific_person"
- The "messageFields" array items must be from: "name", "phone", "email", "company", "reason", "urgency"
- Suggestions should be specific and actionable, not generic
- All content should sound natural when spoken aloud (this is for a phone AI)`
}

function buildOrderTakerPrompt(businessDescription: string, business: BusinessData, employeeName?: string): string {
  return `You are generating a phone order-taker configuration for a business. Based on the business description and data provided, generate a complete, realistic configuration with menu items and order settings.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.address ? `- Address: ${business.address}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}

## Instructions
Generate a JSON object with a realistic menu, upsell rules, and order settings. Infer menu items and categories from the business type and description.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "order-taker",
    "greeting": "A friendly greeting that mentions the business name and asks if they're calling to place an order. 1-2 sentences.",
    "menu": {
      "categories": [
        {
          "name": "Category Name",
          "items": [
            {
              "name": "Item Name",
              "price": 12.99,
              "description": "Brief appetizing description",
              "modifiers": [
                {
                  "name": "Size",
                  "options": [
                    { "name": "Small", "price": 0 },
                    { "name": "Large", "price": 2.00 }
                  ],
                  "required": true
                }
              ],
              "allergens": ["Gluten", "Dairy"]
            }
          ]
        }
      ]
    },
    "upsellRules": [
      {
        "trigger": "item or category name",
        "suggestion": "A natural upsell suggestion spoken conversationally",
        "item": "Upsell Item Name",
        "price": 3.99
      }
    ],
    "orderSettings": {
      "minimumOrder": 10,
      "deliveryFee": 5.00,
      "deliveryRadius": 5,
      "pickupOnly": false,
      "estimatedTime": {
        "pickup": 20,
        "delivery": 45
      }
    },
    "acceptedPayments": ["card", "cash"],
    "tipOptions": [15, 18, 20, 25],
    "businessHours": {
      "monday": { "start": "10:00", "end": "22:00" },
      "tuesday": { "start": "10:00", "end": "22:00" },
      "wednesday": { "start": "10:00", "end": "22:00" },
      "thursday": { "start": "10:00", "end": "22:00" },
      "friday": { "start": "10:00", "end": "23:00" },
      "saturday": { "start": "10:00", "end": "23:00" },
      "sunday": { "start": "11:00", "end": "21:00" }
    },
    "timezone": "${business.timezone || 'America/New_York'}",
    "afterHoursMessage": "A friendly message saying the kitchen is closed, mentioning hours"
  },
  "greeting": "The same greeting from config.greeting above",
  "suggestions": [
    "A specific tip for improving the order-taker configuration",
    "A tip about menu optimization",
    "A tip about upselling strategy"
  ]
}

## Rules
- Generate 3-6 menu categories with 2-5 items each
- Prices should be realistic for the business type and location
- Include modifiers for items that commonly have options (sizes, toppings, sides)
- Include allergen info for food items where relevant
- Generate 2-4 upsell rules that feel natural and conversational
- Set delivery/pickup times appropriate for the business
- Only include "online" in acceptedPayments if the description mentions online ordering
- The "acceptedPayments" items must be from: "cash", "card", "online"
- Business hours should be realistic for a food/retail business
- Suggestions should be specific and actionable
- All content should sound natural when spoken aloud (this is for a phone AI)
- Modifiers are optional -- only include them where it makes sense`
}

function buildPersonalAssistantPrompt(businessDescription: string, business: BusinessData, employeeName?: string): string {
  return `You are generating a personal assistant phone employee configuration. Based on the business description and data provided, generate a complete, realistic configuration.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.address ? `- Address: ${business.address}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}

## Instructions
Generate a JSON object for a personal assistant that manages scheduling and communications. Infer the owner's needs from the business type and description.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "personal-assistant",
    "ownerName": "The business owner's name (infer from description or use the business name)",
    "greeting": "A professional greeting identifying whose assistant this is. 1-2 sentences.",
    "schedulingRules": {
      "minNotice": 60,
      "maxAdvance": 30,
      "bufferBetween": 15,
      "preferredTimes": ["morning", "early afternoon"]
    },
    "messagePriorities": {
      "highPriorityKeywords": ["urgent", "emergency", "asap", "critical", "time-sensitive", "important"],
      "vipContacts": []
    },
    "autoResponses": [
      {
        "trigger": "a phrase or keyword callers might say",
        "response": "An appropriate auto-response"
      }
    ],
    "businessHours": {
      "monday": { "start": "08:00", "end": "18:00" },
      "tuesday": { "start": "08:00", "end": "18:00" },
      "wednesday": { "start": "08:00", "end": "18:00" },
      "thursday": { "start": "08:00", "end": "18:00" },
      "friday": { "start": "08:00", "end": "18:00" },
      "saturday": { "start": "09:00", "end": "12:00" },
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}",
    "afterHoursMessage": "A professional after-hours message with the owner's name"
  },
  "greeting": "The same greeting from config.greeting above",
  "suggestions": [
    "A specific tip for improving the personal assistant configuration",
    "A tip about scheduling optimization",
    "A tip about message prioritization"
  ]
}

## Rules
- The "minNotice" is in minutes (e.g., 60 = 1 hour minimum notice for appointments)
- The "maxAdvance" is in days (e.g., 30 = can book up to 30 days ahead)
- The "bufferBetween" is in minutes between appointments
- "preferredTimes" should be from: "morning", "late morning", "early afternoon", "afternoon", "evening"
- Generate 3-6 auto-responses for common caller phrases
- High priority keywords should include industry-specific urgent terms
- VIP contacts array should be empty (the owner will fill this in)
- Business hours should reflect the owner's availability, not necessarily the business hours
- Set scheduling rules appropriate for the business type (e.g., doctors need more buffer time)
- Suggestions should be specific and actionable
- All content should sound natural when spoken aloud (this is for a phone AI)`
}

// ============================================
// RESPONSE VALIDATORS
// ============================================

function validateReceptionistConfig(config: any): config is ReceptionistConfig & {
  businessHours: Record<string, { start: string; end: string } | null>
  timezone: string
  afterHoursMessage: string
} {
  return (
    config?.type === 'receptionist' &&
    typeof config.greeting === 'string' &&
    typeof config.businessDescription === 'string' &&
    Array.isArray(config.faqs) &&
    Array.isArray(config.transferRules) &&
    Array.isArray(config.messageFields)
  )
}

function validateOrderTakerConfig(config: any): config is OrderTakerConfig & {
  businessHours: Record<string, { start: string; end: string } | null>
  timezone: string
  afterHoursMessage: string
} {
  return (
    config?.type === 'order-taker' &&
    typeof config.greeting === 'string' &&
    config.menu?.categories &&
    Array.isArray(config.menu.categories) &&
    Array.isArray(config.upsellRules) &&
    config.orderSettings &&
    Array.isArray(config.acceptedPayments)
  )
}

function validatePersonalAssistantConfig(config: any): config is PersonalAssistantConfig & {
  businessHours: Record<string, { start: string; end: string } | null>
  timezone: string
  afterHoursMessage: string
} {
  return (
    config?.type === 'personal-assistant' &&
    typeof config.greeting === 'string' &&
    typeof config.ownerName === 'string' &&
    config.schedulingRules &&
    config.messagePriorities &&
    Array.isArray(config.autoResponses)
  )
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateConfigRequest = await request.json()
    const { businessId, jobType, businessDescription, employeeName } = body

    // Validate required fields
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!jobType) {
      return NextResponse.json({ error: 'Job type required' }, { status: 400 })
    }

    const validJobTypes: JobType[] = ['receptionist', 'order-taker', 'personal-assistant']
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json({
        error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`,
      }, { status: 400 })
    }

    if (!businessDescription || businessDescription.trim().length < 10) {
      return NextResponse.json({
        error: 'Business description is required and must be at least 10 characters',
      }, { status: 400 })
    }

    // Validate auth
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Fetch business data from Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name, phone, email, address, city, state, timezone, business_type')
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Build prompt based on job type
    let prompt: string
    switch (jobType) {
      case 'receptionist':
        prompt = buildReceptionistPrompt(businessDescription, business, employeeName)
        break
      case 'order-taker':
        prompt = buildOrderTakerPrompt(businessDescription, business, employeeName)
        break
      case 'personal-assistant':
        prompt = buildPersonalAssistantPrompt(businessDescription, business, employeeName)
        break
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content from response
    const textBlock = message.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({
        error: 'Failed to generate configuration - no text response from AI',
      }, { status: 500 })
    }

    // Parse the JSON response
    let parsed: { config: any; greeting: string; suggestions: string[] }
    try {
      // Strip any markdown code fences if present
      let jsonText = textBlock.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[API] Failed to parse Claude response:', textBlock.text)
      return NextResponse.json({
        error: 'Failed to parse AI-generated configuration. Please try again.',
      }, { status: 500 })
    }

    // Validate the config structure based on job type
    const { config, greeting, suggestions } = parsed

    let isValid = false
    switch (jobType) {
      case 'receptionist':
        isValid = validateReceptionistConfig(config)
        break
      case 'order-taker':
        isValid = validateOrderTakerConfig(config)
        break
      case 'personal-assistant':
        isValid = validatePersonalAssistantConfig(config)
        break
    }

    if (!isValid) {
      console.error('[API] Invalid config structure from Claude:', JSON.stringify(config, null, 2))
      return NextResponse.json({
        error: 'AI generated an invalid configuration structure. Please try again.',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config,
      greeting: greeting || config.greeting,
      suggestions: Array.isArray(suggestions) ? suggestions : [],
    })
  } catch (error: any) {
    console.error('[API] Generate config error:', error)

    // Handle Anthropic API errors specifically
    if (error?.status === 429) {
      return NextResponse.json({
        error: 'AI service rate limited. Please try again in a moment.',
      }, { status: 429 })
    }

    if (error?.status === 401) {
      return NextResponse.json({
        error: 'AI service authentication error. Please contact support.',
      }, { status: 500 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to generate configuration',
    }, { status: 500 })
  }
}
