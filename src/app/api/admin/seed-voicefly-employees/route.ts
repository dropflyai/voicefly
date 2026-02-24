/**
 * Admin Route — Seed VoiceFly Internal Employees
 *
 * POST /api/admin/seed-voicefly-employees
 * Authorization: Bearer {CRON_SECRET}
 *
 * Idempotent: skips employees that already exist by name.
 * Creates three employees for VoiceFly's own business account:
 *   1. Alex   — Inbound Sales Rep (lead-qualifier, inbound, data_source → lookup-account)
 *   2. Sam    — Onboarding Specialist (lead-qualifier, outbound)
 *   3. Taylor — Trial Converter (lead-qualifier, outbound)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EmployeeProvisioningService } from '@/lib/phone-employees/employee-provisioning'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CRON_SECRET = process.env.CRON_SECRET
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET
const VOICEFLY_BUSINESS_ID = process.env.VOICEFLY_BUSINESS_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://voicefly.app'

const EMPLOYEE_NAMES = {
  inbound: 'VoiceFly Inbound Sales',
  onboarding: 'VoiceFly Onboarding',
  trial: 'VoiceFly Trial Converter',
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization') || ''
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VOICEFLY_BUSINESS_ID) {
    return NextResponse.json({ error: 'VOICEFLY_BUSINESS_ID env var not set' }, { status: 500 })
  }

  // Check which employees already exist
  const { data: existing } = await supabase
    .from('phone_employees')
    .select('id, name')
    .eq('business_id', VOICEFLY_BUSINESS_ID)
    .in('name', Object.values(EMPLOYEE_NAMES))

  const existingNames = new Set((existing ?? []).map(e => e.name))
  const results: Record<string, { status: string; id?: string }> = {}

  for (const [key, name] of Object.entries(EMPLOYEE_NAMES)) {
    if (existingNames.has(name)) {
      const found = existing?.find(e => e.name === name)
      results[key] = { status: 'already_exists', id: found?.id }
    }
  }

  if (Object.keys(results).length === 3) {
    return NextResponse.json({ status: 'already_exists', employees: results })
  }

  const provisioning = EmployeeProvisioningService.getInstance()

  // ── 1. Alex — Inbound Sales Rep ───────────────────────────────────────────

  if (!existingNames.has(EMPLOYEE_NAMES.inbound)) {
    try {
      const alex = await provisioning.createEmployee({
        businessId: VOICEFLY_BUSINESS_ID,
        jobType: 'lead-qualifier',
        name: EMPLOYEE_NAMES.inbound,
        config: {
          type: 'lead-qualifier',
          greeting: "Thanks for calling VoiceFly! I'm Alex. What brings you in today — are you looking to add AI phone employees to your business?",
          businessDescription: 'VoiceFly — a platform that lets any business deploy AI phone employees in minutes. We handle inbound calls, book appointments, qualify leads, and more.',
          qualifyingQuestions: [
            {
              id: 'use_case',
              question: "What kind of calls is your business getting that you'd want an AI employee to handle?",
              field: 'use_case',
              required: true,
            },
            {
              id: 'volume',
              question: 'Roughly how many calls a day are we talking?',
              field: 'volume',
              required: false,
            },
            {
              id: 'timeline',
              question: 'Are you looking to get something live soon, or still in the research phase?',
              field: 'timeline',
              required: true,
            },
          ],
          hotLeadCriteria: [
            'Ready to start within 30 days',
            'Has a clear use case for AI phone employees',
            'Is the decision maker',
          ],
          hotLeadAction: 'book',
          warmLeadResponse:
            "This sounds like a great fit! Let me make sure someone from our team reaches out with some resources and next steps.",
          coldLeadResponse:
            "Totally understand — feel free to check out voicefly.ai when the timing is better. Happy to help whenever you're ready.",
        },
        voice: { provider: '11labs', voiceId: 'rachel', speed: 1.0, stability: 0.8 },
        personality: { tone: 'friendly', enthusiasm: 'medium', formality: 'semi-formal' },
        provisionPhone: true,
        phoneMode: 'vapi-only',
      })

      // Set data_source so lookupCaller fires at call start
      await supabase
        .from('phone_employees')
        .update({
          data_source: {
            type: 'custom-webhook',
            webhookUrl: `${APP_URL}/api/internal/lookup-account`,
            webhookSecret: INTERNAL_API_SECRET ?? '',
            fields: ['hasAccount', 'businessName', 'planType', 'isOnTrial'],
          },
        })
        .eq('id', alex.id)

      // Re-provision VAPI assistant to inject lookupCaller function
      await provisioning.updateEmployeeAssistant(alex.id as string, VOICEFLY_BUSINESS_ID)

      results.inbound = { status: 'created', id: alex.id as string }
    } catch (err) {
      console.error('[seed-voicefly-employees] Failed to create Alex:', err)
      results.inbound = { status: 'error' }
    }
  }

  // ── 2. Sam — Onboarding Specialist ─────────────────────────────────────────

  if (!existingNames.has(EMPLOYEE_NAMES.onboarding)) {
    try {
      const sam = await provisioning.createEmployee({
        businessId: VOICEFLY_BUSINESS_ID,
        jobType: 'lead-qualifier',
        name: EMPLOYEE_NAMES.onboarding,
        config: {
          type: 'lead-qualifier',
          greeting:
            "Hi, this is Sam from VoiceFly! I'm following up to help you get your first AI phone employee live. Is now a good time?",
          businessDescription:
            "VoiceFly — you're an onboarding specialist calling a new customer to help them finish their account setup and get their first employee deployed.",
          qualifyingQuestions: [
            {
              id: 'blocker',
              question:
                "Have you had a chance to log in and start setting things up, or are you still waiting to get started?",
              field: 'blocker',
              required: true,
            },
            {
              id: 'help_needed',
              question: "Is there anything specific you'd like me to walk you through?",
              field: 'help_needed',
              required: false,
            },
          ],
          hotLeadCriteria: [
            'Ready to finish setup right now',
            'Has a specific question or blocker they need help with',
          ],
          hotLeadAction: 'callback',
          warmLeadResponse:
            "No problem — I'll make a note and our team will follow up with some resources. Is email the best way to reach you?",
          coldLeadResponse:
            "Totally fine — just know support is one message away at help.voicefly.ai whenever you get stuck.",
        },
        voice: { provider: '11labs', voiceId: 'josh', speed: 1.0, stability: 0.8 },
        personality: { tone: 'warm', enthusiasm: 'medium', formality: 'casual' },
        provisionPhone: true,
        phoneMode: 'vapi-only',
      })

      results.onboarding = { status: 'created', id: sam.id as string }
    } catch (err) {
      console.error('[seed-voicefly-employees] Failed to create Sam:', err)
      results.onboarding = { status: 'error' }
    }
  }

  // ── 3. Taylor — Trial Converter ─────────────────────────────────────────────

  if (!existingNames.has(EMPLOYEE_NAMES.trial)) {
    try {
      const taylor = await provisioning.createEmployee({
        businessId: VOICEFLY_BUSINESS_ID,
        jobType: 'lead-qualifier',
        name: EMPLOYEE_NAMES.trial,
        config: {
          type: 'lead-qualifier',
          greeting:
            "Hi, this is Taylor calling from VoiceFly! I'm reaching out because your trial is wrapping up soon and I wanted to make sure you've had a chance to experience everything. Is now an okay time to chat?",
          businessDescription:
            "VoiceFly — you're a trial conversion specialist calling a customer whose trial is expiring in 3 days or less. Your goal is to understand the value they've seen and guide them to the right paid plan.",
          qualifyingQuestions: [
            {
              id: 'experience',
              question:
                "Have you had a chance to use your AI employee during the trial — did it get any real calls?",
              field: 'experience',
              required: true,
            },
            {
              id: 'value',
              question: "If you had to describe the main value you got from it, what would you say?",
              field: 'value',
              required: false,
            },
            {
              id: 'plan_fit',
              question: "Do you have a sense of which plan might make sense for your volume going forward?",
              field: 'plan_fit',
              required: false,
            },
          ],
          hotLeadCriteria: [
            'Used the product actively during trial',
            'Mentions specific value received (calls handled, leads captured)',
            'Asking about pricing or ready to upgrade',
          ],
          hotLeadAction: 'book',
          warmLeadResponse:
            "That makes sense — let me make sure someone follows up with the right plan recommendation for your usage. Would that be helpful?",
          coldLeadResponse:
            "No problem at all — if things change or you want to revisit it, voicefly.ai is always there. Appreciate you giving it a shot!",
        },
        voice: { provider: '11labs', voiceId: 'adam', speed: 1.0, stability: 0.8 },
        personality: { tone: 'professional', enthusiasm: 'medium', formality: 'semi-formal' },
        provisionPhone: true,
        phoneMode: 'vapi-only',
      })

      results.trial = { status: 'created', id: taylor.id as string }
    } catch (err) {
      console.error('[seed-voicefly-employees] Failed to create Taylor:', err)
      results.trial = { status: 'error' }
    }
  }

  const allOk = Object.values(results).every(r => r.status === 'created' || r.status === 'already_exists')
  return NextResponse.json(
    { status: allOk ? 'ok' : 'partial', employees: results },
    { status: allOk ? 200 : 207 }
  )
}
