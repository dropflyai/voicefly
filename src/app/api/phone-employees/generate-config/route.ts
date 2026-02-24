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
  AppointmentSchedulerConfig,
  CustomerServiceConfig,
  AfterHoursEmergencyConfig,
  RestaurantHostConfig,
  SurveyCallerConfig,
  LeadQualifierConfig,
  AppointmentReminderConfig,
  CollectionsConfig,
} from '@/lib/phone-employees/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type JobType = 'receptionist' | 'order-taker' | 'personal-assistant' | 'appointment-scheduler' | 'customer-service' | 'after-hours-emergency' | 'restaurant-host' | 'survey-caller' | 'lead-qualifier' | 'appointment-reminder' | 'collections'

interface GenerateConfigRequest {
  businessId: string
  jobType: JobType
  businessDescription: string
  employeeName?: string
  extractedData?: any
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
// HELPERS
// ============================================

function buildExtractedDataSection(extractedData: any): string {
  if (!extractedData) return ''
  const lines: string[] = ['## Pre-Extracted Structured Data (use this as primary source — it is more reliable than the description alone)']
  if (extractedData.businessDescription) {
    lines.push(`- Business description: ${extractedData.businessDescription}`)
  }
  if (extractedData.hours) {
    lines.push(`- Hours: ${JSON.stringify(extractedData.hours)}`)
  }
  if (extractedData.services?.length) {
    lines.push(`- Services: ${extractedData.services.map((s: any) => (typeof s === 'string' ? s : s.name || JSON.stringify(s))).join(', ')}`)
  }
  if (extractedData.faqs?.length) {
    lines.push(`- FAQs (${extractedData.faqs.length}): ${JSON.stringify(extractedData.faqs)}`)
  }
  if (extractedData.appointmentTypes?.length) {
    lines.push(`- Appointment types: ${JSON.stringify(extractedData.appointmentTypes)}`)
  }
  if (extractedData.menu?.categories?.length) {
    lines.push(`- Menu: ${JSON.stringify(extractedData.menu)}`)
  }
  if (extractedData.supportedProducts?.length) {
    lines.push(`- Supported products: ${JSON.stringify(extractedData.supportedProducts)}`)
  }
  if (extractedData.phone) lines.push(`- Phone: ${extractedData.phone}`)
  if (extractedData.address) lines.push(`- Address: ${extractedData.address}`)
  return lines.join('\n')
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildReceptionistPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
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
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

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

function buildOrderTakerPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
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
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

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

function buildPersonalAssistantPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
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
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

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

function buildAppointmentSchedulerPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating an appointment scheduler phone employee configuration. Generate a complete, realistic configuration based on the business description.

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
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate appointment types and booking rules appropriate for this business. Infer service types, durations, and pricing from the business type and description.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "appointment-scheduler",
    "greeting": "A warm greeting mentioning the business name and offering to schedule an appointment. 1-2 sentences.",
    "businessDescription": "A 2-3 sentence description of the business suitable for the AI scheduler to reference.",
    "appointmentTypes": [
      {
        "name": "Service or appointment type name",
        "duration": 60,
        "description": "Brief description of what this appointment covers",
        "price": 150
      }
    ],
    "bookingRules": {
      "minNoticeHours": 2,
      "maxAdvanceDays": 30,
      "bufferMinutes": 15,
      "sameDayBooking": false
    },
    "staffMembers": [
      {
        "name": "Staff member name",
        "specialties": ["specialty 1", "specialty 2"]
      }
    ],
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
    "afterHoursMessage": "A friendly message about scheduling, mentioning to call back during business hours or visit the website"
  },
  "suggestions": [
    "A tip about appointment type optimization",
    "A tip about booking rules for this business type",
    "A tip about reducing no-shows"
  ]
}

## Rules
- Generate 3-6 appointment types appropriate for the business type
- Durations should be realistic (e.g., haircut = 30-60 min, medical consult = 30 min, massage = 60-90 min)
- Prices should be realistic for the location and business type. Set to 0 if the business is service-based with variable pricing
- bufferMinutes should be 10-15 for most businesses, 0 for high-volume operations
- sameDayBooking should be true for informal businesses, false for medical/legal
- staffMembers is optional — only include if the description mentions multiple staff or specialties
- All content should sound natural when spoken aloud (this is for a phone AI)`
}

function buildCustomerServicePrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating a customer service phone employee configuration. Generate a complete, realistic configuration based on the business description.

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
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate realistic support policies, common issues, and FAQs appropriate for this business.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "customer-service",
    "greeting": "A helpful greeting mentioning the business name and offering support. 1-2 sentences.",
    "businessDescription": "A 2-3 sentence description of the business and what it sells or offers.",
    "supportedProducts": ["Product or service category 1", "Product or service category 2"],
    "commonIssues": [
      {
        "issue": "A common customer complaint or issue",
        "resolution": "How the agent should resolve this issue"
      }
    ],
    "returnPolicy": "A clear, friendly statement of the return/refund policy (or null if not applicable)",
    "warrantyPolicy": "A clear warranty policy statement (or null if not applicable)",
    "escalationTriggers": ["angry", "supervisor", "lawsuit", "refund refused", "safety issue"],
    "resolutionAuthority": {
      "canRefund": true,
      "maxRefundAmount": 100,
      "canOfferDiscount": true,
      "canScheduleCallback": true
    },
    "faqs": [
      {
        "question": "A common support question",
        "answer": "A helpful, accurate answer",
        "keywords": ["keyword1", "keyword2"]
      }
    ],
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
    "afterHoursMessage": "A friendly after-hours message directing customers to email or the website"
  },
  "suggestions": [
    "A tip about handling common complaints for this business type",
    "A tip about escalation policy",
    "A tip about reducing customer effort"
  ]
}

## Rules
- Generate 3-6 supported product/service categories
- Generate 4-8 common issues with realistic resolutions
- returnPolicy and warrantyPolicy should be null if not applicable to the business type (e.g., a service business may not have a return policy)
- escalationTriggers should include industry-specific phrases that indicate an upset or risky customer
- maxRefundAmount should be realistic ($0 for non-refundable businesses, $50-$500 for retail)
- Generate 4-8 FAQs that support agents would commonly field
- All content should sound natural when spoken aloud (this is for a phone AI)`
}

function buildAfterHoursEmergencyPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating an after-hours emergency line phone employee configuration. Generate a realistic configuration for handling after-hours urgent calls.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.address ? `- Address: ${business.address}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Determine the appropriate business type and generate emergency keywords and response scripts.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "after-hours-emergency",
    "greeting": "A calm, professional greeting acknowledging this is the after-hours emergency line. 1-2 sentences.",
    "businessType": "general",
    "emergencyKeywords": ["fire", "flood", "gas leak", "burst pipe", "no heat", "break-in", "injury"],
    "urgentKeywords": ["not working", "broken", "stuck", "locked out", "power out", "leak"],
    "onCallContacts": [
      {
        "name": "On-call contact name",
        "phone": "+15550000000",
        "role": "On-Call Manager"
      }
    ],
    "nonEmergencyResponse": "A polite message explaining this line is for emergencies only, and directing the caller to call back during business hours or leave a message.",
    "emergencyInstructions": "Any special instructions for the AI to follow during emergencies, such as always staying on the line until on-call responds.",
    "businessHours": {
      "monday": { "start": "09:00", "end": "17:00" },
      "tuesday": { "start": "09:00", "end": "17:00" },
      "wednesday": { "start": "09:00", "end": "17:00" },
      "thursday": { "start": "09:00", "end": "17:00" },
      "friday": { "start": "09:00", "end": "17:00" },
      "saturday": null,
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}"
  },
  "suggestions": [
    "A tip about setting up on-call rotations",
    "A tip about emergency escalation for this business type",
    "A tip about what qualifies as a true emergency vs urgent"
  ]
}

## Rules
- businessType must be exactly one of: "property-management", "medical", "hvac-contractor", "legal", "general"
  - Infer from the business description (apartment complexes → property-management, clinics → medical, plumbers/electricians → hvac-contractor, law firms → legal, everything else → general)
- emergencyKeywords should be 5-10 specific terms that indicate a life/property safety situation
- urgentKeywords should be 4-8 terms indicating something needs fixing but isn't immediately dangerous
- onCallContacts should have a placeholder contact — the user will update the phone number
- nonEmergencyResponse should be sympathetic but firm
- businessHours represents the NORMAL hours (when this line is NOT active)
- All content should sound calm and professional when spoken aloud`
}

function buildRestaurantHostPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating a restaurant host phone employee configuration for handling reservations and waitlist management.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.address ? `- Address: ${business.address}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate reservation settings, slot configurations, and policies appropriate for this restaurant or dining establishment.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "restaurant-host",
    "restaurantName": "${business.name}",
    "greeting": "A warm, welcoming greeting for a restaurant host. Mention the restaurant name. 1-2 sentences.",
    "tableCapacity": 80,
    "partyMaxSize": 8,
    "reservationSlots": [
      {
        "day": "tuesday",
        "openTime": "17:00",
        "closeTime": "21:30",
        "slotIntervalMinutes": 30
      },
      {
        "day": "wednesday",
        "openTime": "17:00",
        "closeTime": "21:30",
        "slotIntervalMinutes": 30
      },
      {
        "day": "thursday",
        "openTime": "17:00",
        "closeTime": "21:30",
        "slotIntervalMinutes": 30
      },
      {
        "day": "friday",
        "openTime": "17:00",
        "closeTime": "22:00",
        "slotIntervalMinutes": 30
      },
      {
        "day": "saturday",
        "openTime": "16:00",
        "closeTime": "22:00",
        "slotIntervalMinutes": 30
      },
      {
        "day": "sunday",
        "openTime": "11:00",
        "closeTime": "20:00",
        "slotIntervalMinutes": 30
      }
    ],
    "waitlistEnabled": true,
    "specialOccasionsEnabled": true,
    "depositRequired": null,
    "transferNumber": null,
    "businessHours": {
      "monday": null,
      "tuesday": { "start": "17:00", "end": "22:00" },
      "wednesday": { "start": "17:00", "end": "22:00" },
      "thursday": { "start": "17:00", "end": "22:00" },
      "friday": { "start": "17:00", "end": "23:00" },
      "saturday": { "start": "16:00", "end": "23:00" },
      "sunday": { "start": "11:00", "end": "21:00" }
    },
    "timezone": "${business.timezone || 'America/New_York'}",
    "afterHoursMessage": "A warm message saying the restaurant is currently closed and inviting them to call back during hours or visit the website to book online."
  },
  "suggestions": [
    "A tip about managing peak reservation times",
    "A tip about reducing no-shows with deposits",
    "A tip about waitlist management"
  ]
}

## Rules
- tableCapacity should reflect a reasonable restaurant size (small = 30-50, medium = 60-100, large = 100+)
- partyMaxSize: 6-8 is typical; large event spaces can go higher
- reservationSlots: match days/times to the business description. Restaurants often close Monday or Tuesday
- slotIntervalMinutes: 30 is standard; fine dining may use 60
- depositRequired: set to null unless the description mentions deposits; if included, partySize >= 6 and amount $25-$50 is typical
- waitlistEnabled: true for busy restaurants, false for low-volume
- specialOccasionsEnabled: true for most sit-down restaurants
- All content should sound warm and welcoming when spoken aloud`
}

function buildSurveyCallerPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating a survey caller phone employee configuration. This AI makes outbound calls to gather customer feedback.

## Business Data
- Name: ${business.name}
${business.email ? `- Email: ${business.email}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate a 3-5 question survey appropriate for this business type, with a natural outro for positive and negative responses.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "survey-caller",
    "greeting": "A friendly intro explaining this is a brief satisfaction survey from the business name. 1-2 sentences.",
    "surveyName": "Customer Satisfaction Survey",
    "questions": [
      {
        "id": "q1",
        "question": "On a scale of 1 to 10, how would you rate your overall experience with us?",
        "type": "rating",
        "required": true
      },
      {
        "id": "q2",
        "question": "How likely are you to recommend us to a friend or family member?",
        "type": "nps",
        "required": true
      },
      {
        "id": "q3",
        "question": "Is there anything we could have done better to improve your experience?",
        "type": "open",
        "required": false
      }
    ],
    "callTrigger": "post_appointment",
    "triggerDelayHours": 2,
    "offerIncentive": null,
    "positiveOutro": "A warm thank-you for positive feedback, mentioning the business name and inviting them back.",
    "negativeOutro": "An empathetic response acknowledging the issue and promising to improve, with a follow-up offer if appropriate.",
    "businessHours": {
      "monday": { "start": "09:00", "end": "18:00" },
      "tuesday": { "start": "09:00", "end": "18:00" },
      "wednesday": { "start": "09:00", "end": "18:00" },
      "thursday": { "start": "09:00", "end": "18:00" },
      "friday": { "start": "09:00", "end": "18:00" },
      "saturday": null,
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}"
  },
  "suggestions": [
    "A tip about survey question order and flow",
    "A tip about the best time to call based on this business type",
    "A tip about using negative feedback constructively"
  ]
}

## Rules
- Generate 3-5 questions that make sense for the business type
- question types must be one of: "rating", "yes_no", "nps", "open"
- callTrigger must be one of: "post_appointment", "post_order", "manual"
  - Use "post_appointment" for service businesses, "post_order" for retail/food, "manual" for B2B
- triggerDelayHours: 2 is a good default (enough time for the experience to settle but still fresh)
- offerIncentive: null unless the business description mentions loyalty programs; if so, suggest a discount
- All question text should sound natural when spoken aloud
- positiveOutro and negativeOutro should be 1-2 sentences and feel genuine`
}

function buildLeadQualifierPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating a lead qualifier phone employee configuration. This AI screens inbound leads to identify hot prospects.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate qualifying questions and scoring criteria appropriate for this business and its sales process.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "lead-qualifier",
    "greeting": "A professional, enthusiastic greeting mentioning the business name and offering to learn about the caller's needs. 1-2 sentences.",
    "businessDescription": "A 2-3 sentence description of the business and its key offerings.",
    "qualifyingQuestions": [
      {
        "id": "q1",
        "question": "What brings you to reach out to us today?",
        "field": "interest",
        "required": true
      },
      {
        "id": "q2",
        "question": "When are you hoping to get started?",
        "field": "timeline",
        "required": true
      },
      {
        "id": "q3",
        "question": "Do you have a budget in mind for this project?",
        "field": "budget",
        "required": false
      }
    ],
    "hotLeadCriteria": [
      "Timeline is within 30 days",
      "Has a defined budget",
      "Is the decision maker"
    ],
    "hotLeadAction": "callback",
    "transferNumber": null,
    "warmLeadResponse": "A friendly response acknowledging their interest and setting expectations for a follow-up call from the sales team.",
    "coldLeadResponse": "A polite response thanking them for their interest, mentioning what might make them a better fit in the future.",
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
    "afterHoursMessage": "A professional message saying the team is unavailable but inviting them to leave their contact info."
  },
  "suggestions": [
    "A tip about qualifying question order for this business type",
    "A tip about defining hot lead criteria more precisely",
    "A tip about response scripts for warm leads"
  ]
}

## Rules
- Generate 3-5 qualifying questions appropriate for the business type
- field must be one of: "interest", "timeline", "budget", "authority", "custom"
- hotLeadCriteria should be 3-5 specific, measurable criteria
- hotLeadAction must be one of: "transfer", "book", "callback" — use "callback" as default, "transfer" for high-volume sales operations
- transferNumber: null (user will fill in)
- warmLeadResponse and coldLeadResponse should be 2-3 sentences, warm but honest
- All question text should sound natural in a phone conversation`
}

function buildAppointmentReminderPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating an appointment reminder phone employee configuration. This AI makes outbound calls to remind customers of upcoming appointments.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate reminder settings and a cancellation policy appropriate for this business type.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "appointment-reminder",
    "greeting": "A friendly reminder call intro mentioning the business name and that you're calling about an upcoming appointment. 1-2 sentences.",
    "reminderLeadTimeHours": 24,
    "confirmationRequired": true,
    "rescheduleEnabled": true,
    "sendConfirmationSms": true,
    "cancellationPolicy": "A brief, clear cancellation policy (e.g., 'Cancellations within 24 hours may incur a fee.'). Set to null if the business has no cancellation policy.",
    "businessHours": {
      "monday": { "start": "09:00", "end": "17:00" },
      "tuesday": { "start": "09:00", "end": "17:00" },
      "wednesday": { "start": "09:00", "end": "17:00" },
      "thursday": { "start": "09:00", "end": "17:00" },
      "friday": { "start": "09:00", "end": "17:00" },
      "saturday": null,
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}"
  },
  "suggestions": [
    "A tip about reminder timing for this business type",
    "A tip about reducing no-shows with confirmation calls",
    "A tip about making rescheduling easy"
  ]
}

## Rules
- reminderLeadTimeHours: 24 is standard; medical/dental may prefer 48; hair salons may use 2-4
- confirmationRequired: true for businesses with costly no-shows (medical, legal, beauty); false for low-stakes
- rescheduleEnabled: true for most businesses unless rescheduling is impractical
- sendConfirmationSms: true is a good default
- cancellationPolicy: include a realistic policy if the business type commonly has them (medical, legal, beauty, fitness); null for casual businesses
- greeting should be warm but professional, not alarming
- All content should sound natural when spoken aloud in a phone call`
}

function buildCollectionsPrompt(businessDescription: string, business: BusinessData, employeeName?: string, extractedData?: any): string {
  return `You are generating a collections phone employee configuration. This AI makes outbound calls to collect outstanding payments, in full FDCPA compliance.

## Business Data
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.state ? `- State: ${business.state}` : ''}
${business.timezone ? `- Timezone: ${business.timezone}` : '- Timezone: America/New_York'}
${business.business_type ? `- Business Type: ${business.business_type}` : ''}

## Business Description from Owner
${businessDescription}
${extractedData ? `\n${buildExtractedDataSection(extractedData)}` : ''}

## Instructions
Generate a legally compliant collections configuration with appropriate payment options and tone for this business type.

${employeeName ? `The employee's name is "${employeeName}".` : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):

{
  "config": {
    "type": "collections",
    "greeting": "A professional, non-threatening greeting identifying the caller and the purpose of the call. 1-2 sentences.",
    "complianceDisclaimer": "This is an attempt to collect a debt. Any information obtained will be used for that purpose. This call is from ${business.name}.",
    "paymentOptions": ["full", "payment-plan"],
    "maxPaymentPlanMonths": 6,
    "settlementPercentage": null,
    "escalationPolicy": "empathetic",
    "disputeContact": "${business.email || business.phone || 'Please contact us to dispute this balance.'}",
    "businessHours": {
      "monday": { "start": "08:00", "end": "17:00" },
      "tuesday": { "start": "08:00", "end": "17:00" },
      "wednesday": { "start": "08:00", "end": "17:00" },
      "thursday": { "start": "08:00", "end": "17:00" },
      "friday": { "start": "08:00", "end": "17:00" },
      "saturday": null,
      "sunday": null
    },
    "timezone": "${business.timezone || 'America/New_York'}"
  },
  "suggestions": [
    "A tip about FDCPA compliance best practices",
    "A tip about payment plan structure for this business type",
    "A tip about dispute handling"
  ]
}

## Rules
- complianceDisclaimer must include the FDCPA-required language: "This is an attempt to collect a debt. Any information obtained will be used for that purpose."
- paymentOptions: include "full" always; "payment-plan" for most; "settlement" only if the business type commonly settles (debt collection agencies, medical billing)
- maxPaymentPlanMonths: 3-6 for most businesses, up to 12 for large balances
- settlementPercentage: null unless the business type typically settles; if included, 60-80 is typical
- escalationPolicy must be one of: "empathetic", "neutral", "firm" — default to "empathetic" for consumer businesses, "neutral" for B2B
- disputeContact should be the business email, phone, or a department name
- Collections calls are restricted by FDCPA to 8am-9pm local time — reflect this in businessHours
- All content must be professional and legally appropriate`
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

function validateAppointmentSchedulerConfig(config: any): boolean {
  return (
    config?.type === 'appointment-scheduler' &&
    typeof config.greeting === 'string' &&
    Array.isArray(config.appointmentTypes) &&
    config.bookingRules &&
    typeof config.bookingRules.minNoticeHours === 'number'
  )
}

function validateCustomerServiceConfig(config: any): boolean {
  return (
    config?.type === 'customer-service' &&
    typeof config.greeting === 'string' &&
    Array.isArray(config.supportedProducts) &&
    Array.isArray(config.commonIssues) &&
    Array.isArray(config.escalationTriggers) &&
    config.resolutionAuthority
  )
}

function validateAfterHoursEmergencyConfig(config: any): boolean {
  return (
    config?.type === 'after-hours-emergency' &&
    typeof config.greeting === 'string' &&
    typeof config.businessType === 'string' &&
    Array.isArray(config.emergencyKeywords) &&
    Array.isArray(config.onCallContacts) &&
    typeof config.nonEmergencyResponse === 'string'
  )
}

function validateRestaurantHostConfig(config: any): boolean {
  return (
    config?.type === 'restaurant-host' &&
    typeof config.greeting === 'string' &&
    typeof config.tableCapacity === 'number' &&
    Array.isArray(config.reservationSlots)
  )
}

function validateSurveyCallerConfig(config: any): boolean {
  return (
    config?.type === 'survey-caller' &&
    typeof config.greeting === 'string' &&
    Array.isArray(config.questions) &&
    typeof config.callTrigger === 'string'
  )
}

function validateLeadQualifierConfig(config: any): boolean {
  return (
    config?.type === 'lead-qualifier' &&
    typeof config.greeting === 'string' &&
    Array.isArray(config.qualifyingQuestions) &&
    typeof config.hotLeadAction === 'string'
  )
}

function validateAppointmentReminderConfig(config: any): boolean {
  return (
    config?.type === 'appointment-reminder' &&
    typeof config.greeting === 'string' &&
    typeof config.reminderLeadTimeHours === 'number'
  )
}

function validateCollectionsConfig(config: any): boolean {
  return (
    config?.type === 'collections' &&
    typeof config.greeting === 'string' &&
    typeof config.complianceDisclaimer === 'string' &&
    Array.isArray(config.paymentOptions)
  )
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateConfigRequest = await request.json()
    const { businessId, jobType, businessDescription, employeeName, extractedData } = body

    // Validate required fields
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!jobType) {
      return NextResponse.json({ error: 'Job type required' }, { status: 400 })
    }

    const validJobTypes: JobType[] = ['receptionist', 'order-taker', 'personal-assistant', 'appointment-scheduler', 'customer-service', 'after-hours-emergency', 'restaurant-host', 'survey-caller', 'lead-qualifier', 'appointment-reminder', 'collections']
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json({
        error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`,
      }, { status: 400 })
    }

    // When extractedData is present the description may be pre-filled or empty — allow it
    if (!extractedData && (!businessDescription || businessDescription.trim().length < 10)) {
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
    const descriptionText = businessDescription || ''
    let prompt: string
    switch (jobType) {
      case 'receptionist':
        prompt = buildReceptionistPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'order-taker':
        prompt = buildOrderTakerPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'personal-assistant':
        prompt = buildPersonalAssistantPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'appointment-scheduler':
        prompt = buildAppointmentSchedulerPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'customer-service':
        prompt = buildCustomerServicePrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'after-hours-emergency':
        prompt = buildAfterHoursEmergencyPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'restaurant-host':
        prompt = buildRestaurantHostPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'survey-caller':
        prompt = buildSurveyCallerPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'lead-qualifier':
        prompt = buildLeadQualifierPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'appointment-reminder':
        prompt = buildAppointmentReminderPrompt(descriptionText, business, employeeName, extractedData)
        break
      case 'collections':
        prompt = buildCollectionsPrompt(descriptionText, business, employeeName, extractedData)
        break
      default:
        prompt = buildReceptionistPrompt(descriptionText, business, employeeName, extractedData)
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
      case 'appointment-scheduler':
        isValid = validateAppointmentSchedulerConfig(config)
        break
      case 'customer-service':
        isValid = validateCustomerServiceConfig(config)
        break
      case 'after-hours-emergency':
        isValid = validateAfterHoursEmergencyConfig(config)
        break
      case 'restaurant-host':
        isValid = validateRestaurantHostConfig(config)
        break
      case 'survey-caller':
        isValid = validateSurveyCallerConfig(config)
        break
      case 'lead-qualifier':
        isValid = validateLeadQualifierConfig(config)
        break
      case 'appointment-reminder':
        isValid = validateAppointmentReminderConfig(config)
        break
      case 'collections':
        isValid = validateCollectionsConfig(config)
        break
      default:
        isValid = false
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
