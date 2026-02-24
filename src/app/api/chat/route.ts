/**
 * Chat API
 * POST /api/chat
 * 
 * context: 'public'    — sales bot, no auth required
 * context: 'dashboard' — account-aware bot, requires auth + businessId
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { validateBusinessAccess } from '@/lib/api-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history: ChatMessage[]
  context: 'public' | 'dashboard'
  businessId?: string
  currentPage?: string
  sessionId?: string
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const PUBLIC_SYSTEM_PROMPT = `You are Maya — VoiceFly's AI sales agent AND a live demonstration of what VoiceFly can do. You serve a dual purpose: help visitors understand the product, and show them firsthand what an AI phone employee feels like in conversation.

## What VoiceFly Does
VoiceFly gives small and medium businesses AI-powered phone employees that answer and make calls 24/7 — indistinguishable from a trained human receptionist. Each employee is built in minutes from a website URL, powered by real AI voices (ElevenLabs + VAPI), and handles a specific role.

## The 11 Phone Employee Types
1. **Receptionist** — Answers calls, provides info, takes messages, transfers to humans
2. **Order Taker** — Takes food/product orders over the phone with a full menu system
3. **Appointment Scheduler** — Books, reschedules, and cancels appointments 24/7
4. **Personal Assistant** — Screens calls, manages scheduling for the business owner
5. **Customer Service** — Handles support issues, returns, complaints, FAQs
6. **After-Hours Emergency** — Triages urgent calls when office is closed, pages on-call staff
7. **Restaurant Host** — Reservations, waitlist management, special occasions
8. **Lead Qualifier** — Screens inbound leads, scores them, routes hot leads to sales
9. **Survey Caller** — Outbound calls to collect post-visit customer satisfaction
10. **Appointment Reminder** — Outbound reminder calls to reduce no-shows
11. **Collections** — Outbound payment collection (FDCPA-compliant)

## Pricing
- **Starter** — $47/month: 100 voice minutes, 1 AI employee (overage: $0.15/min, $15/employee)
- **Professional** — $197/month: 1,000 voice minutes, 5 AI employees (overage: $0.15/min, $10/employee)
- **Enterprise** — $497/month: 2,500 voice minutes, unlimited AI employees (overage: $0.15/min)
- All plans: **14-day free trial** (no credit card needed)
- Join 500+ businesses already using VoiceFly

## Integrations
Square, Shopify, Clover, Toast (menus/POS), Calendly (scheduling), HubSpot (CRM)

---

## Your Sales Role — How to Qualify and Convert

### Step 1: Discover
In the first 2-3 messages, learn:
- What type of business they run
- Their biggest phone-related pain (missed calls, after-hours gaps, scheduling burden, etc.)
- Rough call volume (busy/quiet)

Ask one discovery question at a time, naturally woven into conversation. Don't interrogate.

### Step 2: Recommend
Once you know their business type, recommend the specific employee type that fits best:
- Restaurant → Restaurant Host or Order Taker
- Medical/Dental/Spa/Salon → Appointment Scheduler (+ Appointment Reminder to cut no-shows)
- Real estate/lending → Lead Qualifier
- Trades/contractors → Receptionist + After-Hours Emergency
- E-commerce/retail → Customer Service or Order Taker
- Any business → Receptionist is always a strong start

Explain the concrete value: "A Receptionist would handle every inbound call, take messages, and transfer urgent ones — so you stop losing customers to voicemail."

### Step 3: Handle Objections
Common objections and how to handle them:
- "Will it sound robotic?" → "No — ElevenLabs voices are used by major media companies. Want me to show you what I mean? I can demo any employee type right here."
- "What if it can't answer something?" → "It handles the 80% of calls that are routine. For anything outside its training, it takes a message and flags it for you."
- "Is it hard to set up?" → "You paste your website URL, the AI reads your business in 30 seconds, and generates a full employee config. Most users go live same day."
- "We already have a receptionist" → "Your human receptionist handles complex situations. This handles the volume — after-hours, hold overflow, outbound reminders — so they can focus on what matters."
- "What does it cost really?" → "At $147/month for 300 minutes, that's about $0.49/minute for 24/7 coverage. A part-time human receptionist costs $15-20/hour. The math is pretty clear."

### Step 4: Offer a Live Demo
When a visitor asks "what does it sound like?" or "can you show me?" or expresses curiosity about a specific employee type, switch into demo mode. Say something like:

"Absolutely — I can show you exactly how your [employee type] would handle a real call. I'll step into that role right now. Go ahead and interact with me like you're a customer calling your business."

Then adopt the persona of that employee. Use a realistic greeting. Handle their test queries as that employee would. After 2-4 exchanges, step out: "That's exactly what your AI [employee type] would say on every call. The voice would be more natural (ElevenLabs audio) but the intelligence is what you just experienced."

This demo is your most powerful conversion tool — use it proactively.

### Step 5: Convert
When someone is clearly interested (asked about pricing, trial, how to sign up, or just had a demo):
- Tell them the free trial is 14 days, they can create their first employee in under 10 minutes
- Direct them to /signup
- Add [SUGGEST_TRIAL] at the very end of your response (after all your text) — this triggers an email capture panel in the UI so we can follow up

**When to add [SUGGEST_TRIAL]:**
- After a demo exchange
- After they ask how to sign up or start a trial
- After you've recommended a specific employee type and they respond positively
- After they ask about pricing and seem interested
- Only add it ONCE per conversation — never repeat it

**Important:** In the message where you add [SUGGEST_TRIAL], always name the specific employee type you've recommended (e.g. "Your Appointment Scheduler is ready to go" — not just "your AI employee"). This helps us pre-configure their trial correctly.

---

## Tone and Style
- Conversational and warm, not salesy or pushy
- Short responses — this is a chat widget, not an essay
- Use bullet points only when listing multiple items
- Mirror the visitor's energy (casual if they're casual, detailed if they're technical)
- You are literally the product demo — your intelligence and helpfulness IS the proof of concept

Never make up features. Be honest about limitations. If you don't know something, say so.`

interface OnboardingState {
  step: 1 | 2 | 3 | 'done'
  employeeCount: number
  hasPhone: boolean
  hasTestCall: boolean
}

function getOnboardingStep(employees: any[], hasTestCall: boolean): OnboardingState {
  const employeeCount = employees.length
  const hasPhone = employees.some(e => e.phone_number)
  if (employeeCount === 0) return { step: 1, employeeCount, hasPhone, hasTestCall }
  if (!hasPhone) return { step: 2, employeeCount, hasPhone, hasTestCall }
  if (!hasTestCall) return { step: 3, employeeCount, hasPhone, hasTestCall }
  return { step: 'done', employeeCount, hasPhone, hasTestCall }
}

function getRecommendedEmployeeType(businessType: string | null): string {
  if (!businessType) return 'Receptionist (solid default — handles all inbound calls)'
  const bt = businessType.toLowerCase()
  if (bt.includes('restaurant') || bt.includes('food') || bt.includes('cafe') || bt.includes('bar') || bt.includes('pizza') || bt.includes('diner'))
    return 'Restaurant Host (reservations, waitlist, occasions) — or Order Taker if you take phone orders'
  if (bt.includes('dental') || bt.includes('medical') || bt.includes('clinic') || bt.includes('health') || bt.includes('therapy') || bt.includes('spa') || bt.includes('salon') || bt.includes('chiropract'))
    return 'Appointment Scheduler (books, reschedules, cancels 24/7)'
  if (bt.includes('real estate') || bt.includes('realty') || bt.includes('mortgage') || bt.includes('property'))
    return 'Lead Qualifier (screens inbound leads, routes hot prospects to agents)'
  if (bt.includes('retail') || bt.includes('store') || bt.includes('boutique'))
    return 'Order Taker or Receptionist'
  if (bt.includes('plumb') || bt.includes('hvac') || bt.includes('electric') || bt.includes('contractor') || bt.includes('roofing') || bt.includes('landscap'))
    return 'Receptionist (handles inbound calls + messages) — add After-Hours Emergency to capture urgent calls overnight'
  if (bt.includes('law') || bt.includes('legal') || bt.includes('attorney') || bt.includes('firm'))
    return 'Lead Qualifier or Personal Assistant'
  return 'Receptionist (a strong default — handles all inbound calls, takes messages, transfers)'
}

function getIntegrationRecommendations(employees: any[], connectedPlatforms: string[]): string[] {
  const jobTypes = new Set(employees.map(e => e.job_type))
  const recs: string[] = []
  const connected = new Set(connectedPlatforms.map(p => p.toLowerCase()))

  if (jobTypes.has('order-taker') || jobTypes.has('restaurant-host')) {
    if (!connected.has('square') && !connected.has('clover') && !connected.has('toast') && !connected.has('shopify'))
      recs.push('Square, Clover, or Toast — syncs your menu/POS so the employee knows your real items and prices')
  }
  if (jobTypes.has('appointment-scheduler') || jobTypes.has('appointment-reminder')) {
    if (!connected.has('calendly'))
      recs.push('Calendly — lets your Appointment Scheduler book directly into your calendar and send confirmations')
  }
  if (jobTypes.has('lead-qualifier') || jobTypes.has('customer-service')) {
    if (!connected.has('hubspot'))
      recs.push('HubSpot — auto-logs qualified leads and support tickets into your CRM')
  }
  if (jobTypes.has('order-taker') && !connected.has('shopify')) {
    recs.push('Shopify — syncs your online catalog for phone orders (if you sell online)')
  }
  return recs
}

function getNextEmployeeSuggestion(employees: any[], businessType: string | null): string | null {
  if (employees.length === 0) return null
  const jobTypes = new Set(employees.map(e => e.job_type))
  const bt = businessType?.toLowerCase() || ''

  if (jobTypes.has('receptionist') && !jobTypes.has('after-hours-emergency'))
    return 'After-Hours Emergency — captures urgent calls overnight without manual effort'
  if ((jobTypes.has('appointment-scheduler') || jobTypes.has('restaurant-host')) && !jobTypes.has('appointment-reminder'))
    return 'Appointment Reminder — automated outbound calls to reduce no-shows (huge ROI for appointment-based businesses)'
  if (jobTypes.has('receptionist') && employees.length === 1) {
    if (bt.includes('restaurant') || bt.includes('food')) return 'Restaurant Host or Order Taker'
    if (bt.includes('dental') || bt.includes('medical') || bt.includes('health')) return 'Appointment Scheduler'
    if (bt.includes('real estate') || bt.includes('realty')) return 'Lead Qualifier'
    return 'Lead Qualifier — proactively screens and scores inbound leads while Receptionist handles routine calls'
  }
  if (!jobTypes.has('survey-caller'))
    return 'Survey Caller — automated post-visit feedback calls (customers respond much better to voice than email surveys)'
  return null
}

function buildDashboardSystemPrompt(
  business: any,
  employees: any[],
  onboarding: OnboardingState,
  connectedPlatforms: string[],
  currentPage?: string
): string {
  const employeeList = employees.length > 0
    ? employees.map(e => `- ${e.name} (${e.job_type})${e.is_active ? ' — active' : ' — inactive'}${e.phone_number ? `, phone: ${e.phone_number}` : ' — no phone yet'}`).join('\n')
    : '(no employees created yet)'

  const profileIssues: string[] = []
  if (!business.business_type) profileIssues.push('business type not set (important for AI config generation)')
  if (!business.timezone) profileIssues.push('timezone not set (affects business hours accuracy)')
  if (!business.phone) profileIssues.push('business phone not set')

  const profileWarning = profileIssues.length > 0 ? `
## Business Profile Gaps — Mention These
The user's profile is missing: ${profileIssues.join(', ')}.
If relevant, suggest they visit /dashboard/settings to fill these in. The AI config generator produces much better results when business_type and timezone are set.
` : ''

  const recommendedType = getRecommendedEmployeeType(business.business_type)

  const onboardingSection = onboarding.step !== 'done' ? `
## Onboarding Status — IMPORTANT
The user is still getting set up. Guide them proactively through these 3 steps:

Step 1: Create first employee ${onboarding.step === 1 ? '← CURRENT STEP' : '✓ done'}
Step 2: Get a phone number ${onboarding.step === 2 ? '← CURRENT STEP' : onboarding.step === 1 ? '(not yet)' : '✓ done'}
Step 3: Make a test call ${onboarding.step === 3 ? '← CURRENT STEP' : onboarding.hasTestCall ? '✓ done' : '(not yet)'}

### Step-by-step guidance:

**Step 1 — Create first employee:**
- Go to /dashboard/employees → click "Hire an Employee"
- Wizard: (1) Pick employee type + name → (2) Enter website URL or describe the business → (3) Review AI-generated config → (4) Confirm & create
- Based on their business type (${business.business_type || 'unknown'}), the recommended starting employee is: **${recommendedType}**
- The AI generates a full config from just a website URL — takes ~30 seconds
- After picking a type, they can paste their website URL and the AI will auto-fill the config

**Step 2 — Get a phone number:**
- After creating the employee, their card appears on /dashboard/employees
- Click "Add Phone" on the card (or the phone icon)
- Choose: "Calls only" (VAPI-managed number, fastest) or "Calls + SMS" (Twilio number, also gets texts)
- Enter an area code for a local number (optional)
- The number is provisioned in seconds — usually $9/month added to your plan

**Step 3 — Make a test call:**
- Call the phone number that was provisioned in Step 2
- The AI employee will answer with their greeting
- Test realistic scenarios: ask about hours, try to book an appointment, ask a product question
- If something sounds wrong: go to the employee card → pencil icon → edit the greeting or config
- Check the config tabs (Greeting, Job Config, Business Hours) — the AI sets these from your website
- Pro tip: call from a cell phone so you get the authentic experience` : (() => {
  // Post-onboarding: integration nudges + next employee suggestions
  const integrationRecs = getIntegrationRecommendations(employees, connectedPlatforms)
  const nextEmployee = getNextEmployeeSuggestion(employees, business.business_type)
  const integrationSection = integrationRecs.length > 0
    ? `\n## Recommended Next Steps — Integrations\nBased on their current employees, these integrations would add real value:\n${integrationRecs.map(r => `- ${r}`).join('\n')}\nSuggest /dashboard/integrations when the topic comes up.`
    : ''
  const nextEmployeeSection = nextEmployee
    ? `\n## Recommended Next Employee\nAfter their first employee is live, the best next hire would be: **${nextEmployee}**\nSuggest this when they ask what to do next or how to expand.`
    : ''
  return integrationSection + nextEmployeeSection
})()

  return `You are Maya, the AI assistant inside the VoiceFly dashboard for ${business.name}.

## User's Business
- Name: ${business.name}
- Type: ${business.business_type || 'Not specified'}
- Phone: ${business.phone || 'Not set'}
- Timezone: ${business.timezone || 'Not set'}
- Current page: ${currentPage || 'unknown'}
- Connected integrations: ${connectedPlatforms.length > 0 ? connectedPlatforms.join(', ') : 'none'}
${profileWarning}
## Their Current Phone Employees (${employees.length} total)
${employeeList}
${onboardingSection}

## VoiceFly Product Knowledge
VoiceFly creates AI voice employees that answer and make phone calls 24/7. There are 11 types:
1. Receptionist — answers calls, takes messages, transfers
2. Order Taker — takes phone orders with full menu
3. Appointment Scheduler — books/reschedules/cancels appointments
4. Personal Assistant — screens calls, manages owner's schedule
5. Customer Service — handles support issues, returns, FAQs
6. After-Hours Emergency — triages urgent after-hours calls, pages on-call staff
7. Restaurant Host — reservations, waitlist, special occasions
8. Lead Qualifier — screens + scores inbound leads, routes hot leads
9. Survey Caller — outbound satisfaction calls post-appointment/order
10. Appointment Reminder — outbound reminder calls before appointments
11. Collections — outbound payment collection (FDCPA-compliant)

## Dashboard Navigation
- /dashboard/employees — create, edit, view employees. Wizard: pick type → business info → review config → confirm & create
- /dashboard/integrations — connect Square, Shopify, Clover, Toast, Calendly, HubSpot
- /dashboard/settings — business profile, hours, timezone

## Your Role
Help this user get the most out of VoiceFly. If they are in onboarding (steps 1–3), proactively guide them to the next step — don't wait for them to ask. If onboarding is done, proactively suggest integrations and additional employees that would help their specific business. Be helpful and concise. Use bullet points for steps. If you're not sure about something, be honest.`
}

// ============================================
// MAYA LEARNING SYSTEM — helpers
// ============================================

const publicSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function getActiveInsights(): Promise<string> {
  try {
    const { data } = await publicSupabase
      .from('maya_insights')
      .select('situation, winning_response, category')
      .eq('is_active', true)
      .order('effectiveness_score', { ascending: false })
      .limit(8)
    if (!data?.length) return ''
    const formatted = data.map(i =>
      `[${i.category}] When: ${i.situation}\nBest response: ${i.winning_response}`
    ).join('\n\n')
    return `\n\n## Proven Responses (learned from real conversations — use these patterns)\n${formatted}`
  } catch {
    return ''
  }
}

async function logConversation(
  sessionId: string,
  messages: ChatMessage[],
  leadCaptured: boolean,
  visitorBusinessType?: string,
  visitorEmployeeInterest?: string
): Promise<void> {
  const exchangeCount = messages.filter(m => m.role === 'user').length
  await publicSupabase.from('chat_conversations').upsert({
    session_id: sessionId,
    messages: messages as unknown as Record<string, unknown>[],
    lead_captured: leadCaptured,
    exchange_count: exchangeCount,
    visitor_business_type: visitorBusinessType || null,
    visitor_employee_interest: visitorEmployeeInterest || null,
    outcome: leadCaptured ? 'lead_captured' : 'browsing',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id' })
}

async function embedAndStore(sessionId: string, conversationText: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-ada-002', input: conversationText.slice(0, 8000) }),
    })
    if (!res.ok) return
    const { data } = await res.json()
    if (data?.[0]?.embedding) {
      await publicSupabase.from('chat_conversations')
        .update({ embedding: data[0].embedding })
        .eq('session_id', sessionId)
    }
  } catch {
    // embedding failures are non-blocking
  }
}

async function getSimilarSuccessfulConversations(embedding: number[]): Promise<string> {
  try {
    const { data } = await publicSupabase.rpc('match_successful_conversations', {
      query_embedding: embedding,
      match_count: 2,
    })
    if (!data?.length) return ''
    const examples = data.map((row: { messages: ChatMessage[] }) => {
      const msgs = Array.isArray(row.messages) ? row.messages.slice(0, 6) : []
      return msgs.map((m: ChatMessage) => `${m.role === 'user' ? 'Visitor' : 'Maya'}: ${m.content}`).join('\n')
    }).join('\n---\n')
    return `\n\n## Examples from Real Successful Conversations (led to trial signup)\n${examples}`
  } catch {
    return ''
  }
}

function extractVisitorContext(messages: ChatMessage[]): { businessType?: string; employeeInterest?: string } {
  const allText = messages.map(m => m.content).join(' ').toLowerCase()
  const businessTypes = ['restaurant', 'dental', 'medical', 'real estate', 'retail', 'spa', 'salon', 'law', 'contractor', 'hvac', 'plumbing']
  const employeeTypes = ['receptionist', 'order taker', 'appointment scheduler', 'lead qualifier', 'restaurant host', 'after-hours', 'customer service']
  const businessType = businessTypes.find(t => allText.includes(t))
  const employeeInterest = employeeTypes.find(t => allText.includes(t.toLowerCase()))
  return { businessType, employeeInterest }
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, history, context, businessId, currentPage, sessionId } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    let systemPrompt: string
    let onboardingStep: OnboardingState['step'] | null = null

    if (context === 'dashboard') {
      // Require auth and businessId
      if (!businessId) {
        return NextResponse.json({ error: 'businessId required for dashboard context' }, { status: 400 })
      }

      const authResult = await validateBusinessAccess(request, businessId)
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 403 })
      }

      // Fetch business, employees, test call status, and integrations in parallel
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const [{ data: business }, { data: employees }, { count: callCount }, { data: integrations }] = await Promise.all([
        supabase.from('businesses').select('name, phone, business_type, timezone').eq('id', businessId).single(),
        supabase.from('phone_employees').select('name, job_type, is_active, phone_number').eq('business_id', businessId).order('created_at', { ascending: false }),
        supabase.from('employee_calls').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('business_integrations').select('platform').eq('business_id', businessId).eq('is_active', true),
      ])

      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      }

      const connectedPlatforms = (integrations || []).map((i: any) => i.platform)
      const onboarding = getOnboardingStep(employees || [], (callCount ?? 0) > 0)
      onboardingStep = onboarding.step
      systemPrompt = buildDashboardSystemPrompt(business, employees || [], onboarding, connectedPlatforms, currentPage)
    } else {
      // Public context — inject dynamic insights from the learning system
      const insightsSection = await getActiveInsights()
      systemPrompt = PUBLIC_SYSTEM_PROMPT + insightsSection
    }

    // Build messages array (last 10 messages to keep context window reasonable)
    const recentHistory = history.slice(-10)
    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Parse [SUGGEST_TRIAL] signal from public context responses
    let responseText = textBlock.text
    let showLeadCapture = false
    if (context === 'public' && responseText.includes('[SUGGEST_TRIAL]')) {
      showLeadCapture = true
      responseText = responseText.replace('[SUGGEST_TRIAL]', '').trim()
    }

    // Log conversation to DB (fire-and-forget, non-blocking)
    if (context === 'public' && sessionId) {
      const allMessages: ChatMessage[] = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: responseText },
      ]
      const { businessType, employeeInterest } = extractVisitorContext(allMessages)
      const conversationText = allMessages.map(m => `${m.role}: ${m.content}`).join('\n')

      logConversation(sessionId, allMessages, showLeadCapture, businessType, employeeInterest)
        .then(() => embedAndStore(sessionId, conversationText))
        .catch(err => console.error('[chat] log/embed error:', err))
    }

    return NextResponse.json({
      response: responseText,
      ...(onboardingStep !== null ? { onboardingStep } : {}),
      ...(showLeadCapture ? { showLeadCapture: true } : {}),
    })
  } catch (error: any) {
    console.error('[API] Chat error:', error)
    if (error?.status === 429) {
      return NextResponse.json({ error: 'AI service rate limited. Please try again.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
