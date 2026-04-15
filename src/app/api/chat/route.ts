/**
 * Chat API — Streaming with Vercel AI SDK
 * POST /api/chat
 *
 * context: 'public'    — sales bot, no auth required
 * context: 'dashboard' — account-aware bot, requires auth + businessId
 * context: 'support'   — troubleshooting agent with ticket escalation
 */

import { streamText, tool, UIMessage, convertToModelMessages, stepCountIs, embed } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { z } from 'zod'

/**
 * All model access is routed through the Vercel AI Gateway.
 * Auth: AI_GATEWAY_API_KEY env var locally, OIDC on Vercel deployments.
 * Model strings use provider/model format, e.g. 'anthropic/claude-haiku-4.5'.
 *
 * Benefits over direct provider SDKs:
 *   - Single API key (no ANTHROPIC_API_KEY + OPENAI_API_KEY separately)
 *   - Automatic failover if a provider is down
 *   - Unified cost + usage visibility in Vercel dashboard
 *   - Model-agnostic code — swap providers with one string change
 */
const MAYA_CHAT_MODEL = 'anthropic/claude-haiku-4.5'
const MAYA_EMBED_MODEL = 'openai/text-embedding-3-small'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ============================================
// SYSTEM PROMPTS (unchanged from original)
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
- **Starter** — $49/month: 60 voice minutes, 100 SMS segments, 1 AI employee, 1 phone number (overage: $0.25/min, $0.04/SMS)
- **Growth** — $129/month: 250 voice minutes, 400 SMS segments, 3 AI employees, 3 phone numbers (overage: $0.20/min, $0.04/SMS) — MOST POPULAR
- **Pro** — $249/month: 750 voice minutes, 1000 SMS segments, 5 AI employees, 5 phone numbers (overage: $0.18/min, $0.03/SMS)
- All plans: **14-day free trial** (no credit card needed). Keep your existing number — just forward calls.
- Annual billing saves 20%: Starter $39/mo, Growth $103/mo, Pro $199/mo
- Founding customer pricing: Starter $25/mo (50% off for life), Growth $65/mo (50% off), Pro $125/mo (50% off)

## How SMS works (important — different timeline than voice)
- Voice answers calls day 1. SMS requires US carrier registration (A2P 10DLC) before any reply texts or reminders can go out.
- We handle the A2P registration programmatically on behalf of each business — the tenant fills a short form (legal name, EIN, address, authorized rep) on /dashboard/settings/sms, and we submit everything to Twilio and the carriers.
- **Timeline**: customer profile verification 1-2 business days → brand registration a few days → campaign approval 2-3 weeks. Total: typically 2-3 weeks from submission to active SMS.
- Registration cost (~$15/month per tenant to Twilio/TCR) is included in every plan — we eat it. No extra fees to the business.
- Until SMS activates, AI handles calls voice-only. Once approved, SMS fires automatically for appointment confirmations and reminders.

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
- "Is it hard to set up?" → "You paste your website URL, the AI reads your business in 30 seconds, then you forward your existing phone number. Live in 2 minutes — your customers won't notice any change."
- "We already have a receptionist" → "Your human receptionist handles complex situations. This handles the volume — after-hours, hold overflow, outbound reminders — so they can focus on what matters."
- "What does it cost really?" → "At $49/month for 60 minutes on Starter, that's less than $1/minute for 24/7 coverage. Most businesses pick Growth at $129/mo for 250 minutes. A part-time human receptionist costs $15-20/hour. The math is pretty clear."

### Step 4: Offer a Live Demo
When a visitor asks "what does it sound like?", "can I try it?", "show me", or expresses curiosity about hearing the AI, direct them to the live voice demo page. Say something like:

"You can talk to one right now — no signup needed. [Try the live voice demo →](https://www.voiceflyai.com/demo) Pick your industry and have a real conversation with an AI employee."

Map their business type to the right demo tab:
- Dental/medical/spa/salon → dental or salon tab
- Restaurant/food → restaurant tab
- Auto/trades/service → auto tab
- Legal/professional → law tab
- Anything else → suggest dental or restaurant as the most relatable

If they want a quick text preview first (before clicking the link), you can briefly step into the employee role for 1-2 exchanges — then prompt them to try the real voice version at the link above.

The voice demo is your most powerful conversion tool — surface it early and proactively.

### Step 5: Convert
When someone is clearly interested (asked about pricing, trial, how to sign up, or just had a demo):
- Tell them to forward their calls to AI — free for 14 days, live in 2 minutes, their number stays the same
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

// ============================================
// HELPERS (unchanged)
// ============================================

const publicSupabase = createClient(supabaseUrl, supabaseServiceKey)

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
    return 'Appointment Reminder — automated outbound calls to reduce no-shows'
  if (jobTypes.has('receptionist') && employees.length === 1) {
    if (bt.includes('restaurant') || bt.includes('food')) return 'Restaurant Host or Order Taker'
    if (bt.includes('dental') || bt.includes('medical') || bt.includes('health')) return 'Appointment Scheduler'
    if (bt.includes('real estate') || bt.includes('realty')) return 'Lead Qualifier'
    return 'Lead Qualifier — proactively screens and scores inbound leads'
  }
  if (!jobTypes.has('survey-caller'))
    return 'Survey Caller — automated post-visit feedback calls'
  return null
}

function summarizeEmployeeConfig(e: any): string {
  try {
    const parts = [`- **${e.name}** (${e.job_type})${e.is_active ? ' — active' : ' — inactive'}${e.phone_number ? `, phone: ${e.phone_number}` : ' — no phone yet'}`]
    const config = typeof e.job_config === 'object' && e.job_config ? e.job_config : {}
    const greeting = config.greeting || config.firstMessage
    if (greeting && typeof greeting === 'string') parts.push(`  Greeting: "${greeting.slice(0, 150)}${greeting.length > 150 ? '...' : ''}"`)
    if (config.businessHours) parts.push('  Has business hours configured')
    if (config.specialInstructions) parts.push(`  Special instructions: "${String(config.specialInstructions).slice(0, 100)}"`)
    if (e.voice?.voiceId) parts.push(`  Voice: ${e.voice.voiceId}`)
    return parts.join('\n')
  } catch {
    return `- ${e.name || 'Unknown'} (${e.job_type || 'unknown'})`
  }
}

function formatRecentCalls(calls: any[], employees: any[]): string {
  if (!calls?.length) return '(no calls yet)'
  try {
    const empMap = new Map(employees.filter(e => e.id).map(e => [e.id, e.name]))
    return calls.map(c => {
      const date = c.started_at ? new Date(c.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?'
      const time = c.started_at ? new Date(c.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
      const dur = c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : 'n/a'
      const emp = c.employee_id ? empMap.get(c.employee_id) || '' : ''
      const summary = c.summary ? ` — "${String(c.summary).slice(0, 120)}"` : ''
      return `- ${date} ${time} | ${c.direction || 'inbound'} ${c.customer_phone || 'unknown'} | ${dur}${emp ? ` | ${emp}` : ''}${summary}`
    }).join('\n')
  } catch {
    return '(error loading calls)'
  }
}

function formatRecentMessages(messages: any[]): string {
  if (!messages?.length) return '(no messages yet)'
  try {
    return messages.map(m => {
      const date = m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?'
      const caller = m.caller_name || m.caller_phone || 'unknown'
      const urgencyTag = m.urgency && m.urgency !== 'normal' ? ` [${m.urgency}]` : ''
      const statusTag = m.status ? ` (${m.status})` : ''
      return `- ${date} from ${caller}${urgencyTag}${statusTag}: "${String(m.reason || m.full_message || '').slice(0, 120)}"`
    }).join('\n')
  } catch {
    return '(error loading messages)'
  }
}

function formatBusinessHours(hours: any[]): string {
  if (!hours?.length) return '(not configured)'
  try {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const sorted = [...hours].sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week))
    return sorted.map(h => {
      const day = (h.day_of_week || '').charAt(0).toUpperCase() + (h.day_of_week || '').slice(1)
      return h.is_open ? `- ${day}: ${h.open_time} – ${h.close_time}` : `- ${day}: Closed`
    }).join('\n')
  } catch {
    return '(error loading hours)'
  }
}

function buildDashboardSystemPrompt(
  business: any, employees: any[], onboarding: OnboardingState,
  connectedPlatforms: string[], currentPage?: string,
  stats?: { messages: number; orders: number; recentCalls?: any[]; recentMessages?: any[]; businessHours?: any[] }
): string {
  const employeeList = employees.length > 0
    ? employees.map(e => summarizeEmployeeConfig(e)).join('\n')
    : '(no employees created yet)'

  const profileIssues: string[] = []
  if (!business.business_type) profileIssues.push('business type not set')
  if (!business.timezone) profileIssues.push('timezone not set')
  if (!business.phone) profileIssues.push('business phone not set')

  const profileWarning = profileIssues.length > 0 ? `
## Business Profile Gaps — Mention These
The user's profile is missing: ${profileIssues.join(', ')}.
Suggest they visit /dashboard/settings to fill these in.
` : ''

  const recommendedType = getRecommendedEmployeeType(business.business_type)

  const onboardingSection = onboarding.step !== 'done' ? `
## Onboarding Status — IMPORTANT
Guide them proactively through these 3 steps:

Step 1: Create first employee ${onboarding.step === 1 ? '← CURRENT STEP' : '✓ done'}
Step 2: Forward your calls ${onboarding.step === 2 ? '← CURRENT STEP' : onboarding.step === 1 ? '(not yet)' : '✓ done'}
Step 3: Make a test call ${onboarding.step === 3 ? '← CURRENT STEP' : onboarding.hasTestCall ? '✓ done' : '(not yet)'}

**Step 1 — Create first employee:**
- Go to /dashboard/employees → click "Hire an Employee"
- Recommended for ${business.business_type || 'their business'}: **${recommendedType}**
- AI generates config from website URL in ~30 seconds

**Step 2 — Forward your calls:**
- Click "Add Phone" on the employee card
- Once AI line is ready, forward their existing business phone:
  - **Most carriers:** Dial *72 followed by the AI number
  - **Verizon:** Dial *72, then the number when prompted
  - **Google Voice / VoIP:** Settings > Calls > Call Forwarding
- Forwarding is instant. Their number stays the same. Undo anytime with *73.

**Step 3 — Make a test call:**
- Call their own business number or the AI line directly
- Test realistic scenarios: hours, booking, product questions
- Pro tip: call from a cell phone for the authentic experience` : (() => {
    const integrationRecs = getIntegrationRecommendations(employees, connectedPlatforms)
    const nextEmployee = getNextEmployeeSuggestion(employees, business.business_type)
    const integrationSection = integrationRecs.length > 0
      ? `\n## Recommended Integrations\n${integrationRecs.map(r => `- ${r}`).join('\n')}\nSuggest /dashboard/integrations when relevant.`
      : ''
    const nextEmployeeSection = nextEmployee
      ? `\n## Recommended Next Employee\n**${nextEmployee}**\nSuggest when they ask what to do next.`
      : ''
    return integrationSection + nextEmployeeSection
  })()

  return `You are Maya, the AI assistant inside the VoiceFly dashboard for ${business.name}.

## User's Business
- Name: ${business.name}
- Type: ${business.business_type || 'Not specified'}
- Phone: ${business.phone || 'Not set'}
- Timezone: ${business.timezone || 'Not set'}
- Plan: ${business.subscription_tier || 'trial'} (${business.subscription_status || 'trial'})
- Credits: ${business.monthly_credits != null ? `${(business.monthly_credits + (business.purchased_credits || 0)) - (business.credits_used_this_month || 0)} remaining of ${business.monthly_credits + (business.purchased_credits || 0)} (${business.credits_used_this_month || 0} used)` : 'N/A'}
- Messages: ${stats?.messages ?? 0} total
- Orders: ${stats?.orders ?? 0} total
- Current page: ${currentPage || 'unknown'}
- Connected integrations: ${connectedPlatforms.length > 0 ? connectedPlatforms.join(', ') : 'none'}
${profileWarning}
## Their Current Phone Employees (${employees.length} total)
${employeeList}

## Recent Call Activity
${formatRecentCalls(stats?.recentCalls || [], employees)}

## Recent Messages
${formatRecentMessages(stats?.recentMessages || [])}

## Business Hours
${formatBusinessHours(stats?.businessHours || [])}
${business.business_context ? `
## Business Knowledge
${business.business_context.hours_summary ? `- Hours: ${business.business_context.hours_summary}` : ''}
${business.business_context.address_display ? `- Address: ${business.business_context.address_display}` : ''}
${business.business_context.parking_info ? `- Parking: ${business.business_context.parking_info}` : ''}
${business.business_context.payment_methods ? `- Payment: ${business.business_context.payment_methods}` : ''}
${business.business_context.policies ? `- Policies: ${business.business_context.policies}` : ''}
${business.business_context.special_notes ? `- Notes: ${business.business_context.special_notes}` : ''}
`.trim() : ''}
${onboardingSection}

## SMS Feature State
- SMS is included in every plan (Starter 100 / Growth 400 / Pro 1000 segments per month).
- SMS enabled on this account: ${business.sms_enabled ? 'YES — active' : 'NO — requires A2P 10DLC registration first'}
${business.sms_enabled ? `- Usage this month: ${business.sms_segments_used ?? 0}/${business.sms_segments_limit ?? 0} segments` : ''}
- To enable SMS, the tenant fills a short form at /dashboard/settings/sms with their legal business name, EIN, business address, and an authorized representative. We submit that to Twilio and US carriers automatically. Typical approval: 2-3 weeks total (customer profile 1-2 days → brand registration few days → campaign 2-3 weeks).
- Registration fee (~$15/month) is included — no cost to the tenant.
- If they ask about SMS, reminders, confirmations, or "can my AI text customers?":
  - If sms_enabled is NO → direct them to /dashboard/settings/sms using the navigate_user tool. Explain the 2-3 week timeline and what info is required.
  - If sms_enabled is YES → they're good, usage is visible on the main dashboard card.
- Never claim SMS is active when sms_enabled is NO. Never attempt to send test SMS on their behalf until approved.

## Your Capabilities
You can take REAL actions using tools. When a user asks you to do something — DO IT, don't just give instructions.

**Rules:**
- Always confirm before destructive actions (delete employee)
- After each action, tell the user what you did and suggest the next step
- If someone describes their business naturally ("we're open 9 to 5"), save that info immediately
- For SMS-related requests, check the sms_enabled state before responding
- Be helpful and concise. Use bullet points for steps.`
}

function buildSupportSystemPrompt(business: any, employees: any[], connectedPlatforms: string[], recentCalls: any[]): string {
  const employeeList = employees.length > 0
    ? employees.map(e => `- ${e.name} (${e.job_type})${e.is_active ? ' — active' : ' — inactive'}${e.phone_number ? `, phone: ${e.phone_number}` : ''}`).join('\n')
    : '(no employees)'

  return `You are the VoiceFly Support Agent for ${business.name}. Help users troubleshoot issues and get the most out of VoiceFly.

## User's Account
- Business: ${business.name}, Plan: ${business.subscription_tier || 'starter'} (${business.subscription_status || 'trial'})
- Employees: ${employees.length}, Integrations: ${connectedPlatforms.length > 0 ? connectedPlatforms.join(', ') : 'none'}
- SMS enabled: ${business.sms_enabled ? 'YES' : 'NO (A2P registration required)'}

## Their Phone Employees
${employeeList}

## Key Knowledge
- Each employee gets a behind-the-scenes AI line. Users forward their existing number to it (*72 to forward, *73 to undo).
- Pricing: Starter $49/mo (60 min, 100 SMS), Growth $129/mo (250 min, 400 SMS), Pro $249/mo (750 min, 1000 SMS)
- SMS requires per-tenant A2P 10DLC registration — tenant visits /dashboard/settings/sms, submits legal business info + EIN + authorized rep, we auto-submit to Twilio. Approval takes 2-3 weeks. Registration fee is included in plan.
- Common SMS troubleshooting:
  - "Why isn't SMS working?" → Check sms_enabled. If NO, registration isn't complete; direct them to /dashboard/settings/sms.
  - "How long does SMS take to activate?" → 2-3 weeks after they submit the intake form.
  - "Do I pay extra for SMS registration?" → No, included in every plan.
  - "I got an SMS from a number I don't recognize" → Their AI uses a Twilio-owned number, but messages identify the business in the body.
  - "Can I port my existing number to Twilio?" → Yes but adds 2-14 business days. For now, forwarding is the fast path.
- If you CANNOT resolve an issue, include [CREATE_TICKET] at the end and [TICKET_SUMMARY: brief description].
- Never make up features. Be concise. Don't promise SMS works if sms_enabled is false.`
}

// ============================================
// LEARNING SYSTEM
// ============================================

async function getActiveInsights(): Promise<string> {
  try {
    const { data } = await publicSupabase
      .from('maya_insights').select('situation, winning_response, category')
      .eq('is_active', true).order('effectiveness_score', { ascending: false }).limit(8)
    if (!data?.length) return ''
    return `\n\n## Proven Responses\n${data.map(i => `[${i.category}] When: ${i.situation}\nBest response: ${i.winning_response}`).join('\n\n')}`
  } catch { return '' }
}

async function logConversation(sessionId: string, messages: any[], leadCaptured: boolean, businessType?: string, employeeInterest?: string): Promise<void> {
  const exchangeCount = messages.filter((m: any) => m.role === 'user').length
  await publicSupabase.from('chat_conversations').upsert({
    session_id: sessionId, messages, lead_captured: leadCaptured, exchange_count: exchangeCount,
    visitor_business_type: businessType || null, visitor_employee_interest: employeeInterest || null,
    outcome: leadCaptured ? 'lead_captured' : 'browsing', updated_at: new Date().toISOString(),
  }, { onConflict: 'session_id' })
}

async function embedAndStore(sessionId: string, conversationText: string): Promise<void> {
  // Routed through AI Gateway — uses AI_GATEWAY_API_KEY (or OIDC on Vercel)
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) return
  try {
    const { embedding } = await embed({
      model: MAYA_EMBED_MODEL,
      value: conversationText.slice(0, 8000),
    })
    if (embedding?.length) {
      await publicSupabase.from('chat_conversations').update({ embedding }).eq('session_id', sessionId)
    }
  } catch {
    // Non-blocking — embedding failures shouldn't break the chat response
  }
}

function extractVisitorContext(messages: any[]): { businessType?: string; employeeInterest?: string } {
  const allText = messages.map((m: any) => m.content || m.parts?.map((p: any) => p.text).join(' ') || '').join(' ').toLowerCase()
  const businessTypes = ['restaurant', 'dental', 'medical', 'real estate', 'retail', 'spa', 'salon', 'law', 'contractor', 'hvac', 'plumbing']
  const employeeTypes = ['receptionist', 'order taker', 'appointment scheduler', 'lead qualifier', 'restaurant host', 'after-hours', 'customer service']
  return { businessType: businessTypes.find(t => allText.includes(t)), employeeInterest: employeeTypes.find(t => allText.includes(t.toLowerCase())) }
}

// ============================================
// DASHBOARD TOOLS — AI SDK format
// ============================================

function buildDashboardTools(businessId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  return {
    create_employee: tool({
      description: 'Create a new AI phone employee. Use when the user wants to set up a new employee or agrees to create one.',
      parameters: z.object({
        job_type: z.enum(['receptionist', 'order-taker', 'appointment-scheduler', 'personal-assistant', 'customer-service', 'after-hours-emergency', 'restaurant-host', 'lead-qualifier']),
        name: z.string().describe('A human name for the employee (e.g. Sarah, Aria, Jake)'),
        website_url: z.string().optional().describe('Business website URL to auto-generate config from'),
      }),
      execute: async ({ job_type, name, website_url }) => {
        let config: any = undefined
        if (website_url) {
          try {
            const extractRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/phone-employees/generate-config`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessId, jobType: job_type, websiteUrl: website_url }),
            })
            if (extractRes.ok) config = (await extractRes.json()).config
          } catch (err) { console.error('[Maya Tool] Config generation failed:', err) }
        }

        const { data: employee, error } = await supabase
          .from('phone_employees')
          .insert({ business_id: businessId, name: name || 'Maya', job_type, is_active: true, personality: { tone: 'professional', enthusiasm: 'medium' }, job_config: config || {} })
          .select().single()

        if (error) return { success: false, error: error.message }

        try {
          const { employeeProvisioning } = await import('@/lib/phone-employees')
          await employeeProvisioning.provisionEmployee(employee.id, businessId)
        } catch (err) { console.error('[Maya Tool] VAPI provisioning error:', err) }

        return { success: true, employee_id: employee.id, name: employee.name, job_type: employee.job_type, message: `Created ${employee.name} as ${employee.job_type.replace(/-/g, ' ')}` }
      },
    }),

    provision_phone_number: tool({
      description: 'Give a phone number to an existing employee so they can receive calls.',
      parameters: z.object({
        employee_id: z.string(),
        area_code: z.string().optional().describe('3-digit US area code for a local number'),
      }),
      execute: async ({ employee_id, area_code }) => {
        try {
          const { employeeProvisioning } = await import('@/lib/phone-employees')
          const result = await employeeProvisioning.provisionPhoneNumber(employee_id, businessId, { mode: 'twilio-vapi', areaCode: area_code || '' })
          return { success: true, phone_number: result.phoneNumber, message: `Phone number ${result.phoneNumber} provisioned` }
        } catch (err: any) {
          return { success: false, error: err.message || 'Failed to provision phone number' }
        }
      },
    }),

    update_employee_config: tool({
      description: "Update an employee's configuration — greeting, instructions, tone, etc.",
      parameters: z.object({
        employee_id: z.string(),
        greeting: z.string().optional(),
        custom_instructions: z.string().optional(),
        business_description: z.string().optional(),
        tone: z.enum(['professional', 'friendly', 'warm', 'casual', 'luxury']).optional(),
      }),
      execute: async ({ employee_id, greeting, custom_instructions, business_description, tone }) => {
        const updates: any = {}
        if (greeting) updates.job_config = { greeting }
        if (custom_instructions) updates.job_config = { ...updates.job_config, customInstructions: custom_instructions }
        if (business_description) updates.job_config = { ...updates.job_config, businessDescription: business_description }
        if (tone) updates.personality = { tone, enthusiasm: 'medium' }

        const { data: existing } = await supabase.from('phone_employees').select('job_config, personality').eq('id', employee_id).eq('business_id', businessId).single()
        const mergedConfig = { ...(existing?.job_config || {}), ...(updates.job_config || {}) }
        const mergedPersonality = { ...(existing?.personality || {}), ...(updates.personality || {}) }

        const { error } = await supabase.from('phone_employees')
          .update({ job_config: mergedConfig, personality: mergedPersonality, updated_at: new Date().toISOString() })
          .eq('id', employee_id).eq('business_id', businessId)

        if (error) return { success: false, error: error.message }
        return { success: true, message: 'Employee configuration updated' }
      },
    }),

    navigate_user: tool({
      description: 'Navigate the user to a specific dashboard page.',
      parameters: z.object({
        page: z.enum(['/dashboard', '/dashboard/employees', '/dashboard/voice-ai', '/dashboard/messages', '/dashboard/integrations', '/dashboard/settings', '/dashboard/billing', '/dashboard/appointments', '/dashboard/orders']),
      }),
      execute: async ({ page }) => ({ success: true, page, message: `Navigating to ${page}` }),
    }),

    toggle_employee: tool({
      description: 'Activate or deactivate an employee.',
      parameters: z.object({
        employee_id: z.string(),
        active: z.boolean(),
      }),
      execute: async ({ employee_id, active }) => {
        const { data: emp } = await supabase.from('phone_employees').select('name').eq('id', employee_id).eq('business_id', businessId).single()
        const { error } = await supabase.from('phone_employees').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', employee_id).eq('business_id', businessId)
        if (error) return { success: false, error: error.message }
        return { success: true, message: `${emp?.name || 'Employee'} ${active ? 'activated' : 'deactivated'}` }
      },
    }),

    delete_employee: tool({
      description: 'Permanently delete an employee. Always confirm with user first.',
      parameters: z.object({
        employee_id: z.string(),
        employee_name: z.string().optional(),
      }),
      execute: async ({ employee_id }) => {
        const { data: emp } = await supabase.from('phone_employees').select('name').eq('id', employee_id).eq('business_id', businessId).single()
        const { error } = await supabase.from('phone_employees').delete().eq('id', employee_id).eq('business_id', businessId)
        if (error) return { success: false, error: error.message }
        return { success: true, message: `${emp?.name || 'Employee'} has been deleted` }
      },
    }),

    update_business_settings: tool({
      description: 'Update business profile settings.',
      parameters: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        timezone: z.string().optional(),
        business_type: z.string().optional(),
      }),
      execute: async (input) => {
        const updates: any = { updated_at: new Date().toISOString() }
        if (input.name) updates.name = input.name
        if (input.phone) updates.phone = input.phone
        if (input.email) updates.email = input.email
        if (input.address) updates.address = input.address
        if (input.timezone) updates.timezone = input.timezone
        if (input.business_type) updates.business_type = input.business_type
        const updatedFields = Object.keys(updates).filter(k => k !== 'updated_at')
        if (updatedFields.length === 0) return { success: false, error: 'No fields to update' }
        const { error } = await supabase.from('businesses').update(updates).eq('id', businessId)
        if (error) return { success: false, error: error.message }
        return { success: true, message: `Updated ${updatedFields.join(', ')}`, updated_fields: updatedFields }
      },
    }),

    update_ai_knowledge: tool({
      description: 'Update shared AI Knowledge fields — owner name, address, hours summary, payment methods, parking, policies, etc.',
      parameters: z.object({
        owner_name: z.string().optional(),
        address_display: z.string().optional(),
        hours_summary: z.string().optional(),
        payment_methods: z.string().optional(),
        parking_info: z.string().optional(),
        languages: z.string().optional(),
        policies: z.string().optional(),
        special_notes: z.string().optional(),
      }),
      execute: async (input) => {
        const { data: biz } = await supabase.from('businesses').select('business_context').eq('id', businessId).single()
        const updated = { ...(biz?.business_context || {}), ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) }
        const { error } = await supabase.from('businesses').update({ business_context: updated, updated_at: new Date().toISOString() }).eq('id', businessId)
        if (error) return { success: false, error: error.message }
        const changedFields = Object.keys(input).filter(k => (input as any)[k] !== undefined)
        return { success: true, message: `Updated AI Knowledge: ${changedFields.join(', ')}`, updated_fields: changedFields }
      },
    }),

    update_business_hours: tool({
      description: 'Set the business hours for specific days.',
      parameters: z.object({
        hours: z.record(z.string(), z.nullable(z.object({ open: z.string(), close: z.string() }))).describe('Object with day names as keys. null = closed. { open: "HH:MM", close: "HH:MM" } = open.'),
      }),
      execute: async ({ hours }) => {
        await supabase.from('business_hours').delete().eq('business_id', businessId)
        const rows = Object.entries(hours).map(([day, value]) => ({
          business_id: businessId, day_of_week: day, is_open: value !== null, open_time: value?.open || '09:00', close_time: value?.close || '17:00',
        }))
        const { error } = await supabase.from('business_hours').insert(rows)
        if (error) return { success: false, error: error.message }
        const openDays = rows.filter(r => r.is_open).map(r => r.day_of_week)
        return { success: true, message: `Business hours updated. Open: ${openDays.join(', ') || 'none'}` }
      },
    }),

    resolve_message: tool({
      description: 'Mark a phone message as resolved or in-progress.',
      parameters: z.object({
        message_id: z.string(),
        status: z.enum(['read', 'in_progress', 'resolved', 'archived']),
      }),
      execute: async ({ message_id, status }) => {
        const updates: any = { status, updated_at: new Date().toISOString() }
        if (status === 'resolved' || status === 'archived') updates.callback_completed = true
        const { error } = await supabase.from('phone_messages').update(updates).eq('id', message_id).eq('business_id', businessId)
        if (error) return { success: false, error: error.message }
        return { success: true, message: `Message marked as ${status}` }
      },
    }),
  }
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages: incomingMessages, context, businessId, currentPage, sessionId } = body

    // Extract the user's latest text from the incoming messages
    const lastUserMsg = [...(incomingMessages || [])].reverse().find((m: any) => m.role === 'user')
    if (!lastUserMsg) {
      return new Response(JSON.stringify({ error: 'No user message' }), { status: 400 })
    }

    let systemPrompt: string
    let tools: Record<string, any> | undefined
    let onboardingStep: OnboardingState['step'] | null = null

    if (context === 'dashboard') {
      if (!businessId) return new Response(JSON.stringify({ error: 'businessId required' }), { status: 400 })

      const authResult = await validateBusinessAccess(request as any, businessId)
      if (!authResult.success) return new Response(JSON.stringify({ error: authResult.error }), { status: 403 })

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const [{ data: business }, { data: employees }, { count: callCount }, { data: recentCalls }, { data: integrations }, { count: messageCount }, { data: recentMessages }, { count: orderCount }, { data: businessHours }] = await Promise.all([
        supabase.from('businesses').select('name, phone, business_type, timezone, subscription_tier, subscription_status, monthly_credits, purchased_credits, credits_used_this_month, business_context, sms_enabled, sms_segments_used, sms_segments_limit').eq('id', businessId).single(),
        supabase.from('phone_employees').select('id, name, job_type, is_active, phone_number, job_config, voice, personality').eq('business_id', businessId).order('created_at', { ascending: false }),
        supabase.from('employee_calls').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('employee_calls').select('customer_phone, status, direction, duration, summary, started_at, employee_id').eq('business_id', businessId).order('started_at', { ascending: false }).limit(10),
        supabase.from('business_integrations').select('platform').eq('business_id', businessId).eq('is_active', true),
        supabase.from('phone_messages').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('phone_messages').select('caller_name, caller_phone, reason, full_message, urgency, status, created_at').eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
        supabase.from('phone_orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('business_hours').select('day_of_week, open_time, close_time, is_open').eq('business_id', businessId),
      ])

      if (!business) return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 })

      const connectedPlatforms = (integrations || []).map((i: any) => i.platform)
      const onboarding = getOnboardingStep(employees || [], (callCount ?? 0) > 0)
      onboardingStep = onboarding.step
      systemPrompt = buildDashboardSystemPrompt(business, employees || [], onboarding, connectedPlatforms, currentPage, {
        messages: messageCount ?? 0, orders: orderCount ?? 0,
        recentCalls: recentCalls || [], recentMessages: recentMessages || [], businessHours: businessHours || [],
      })
      tools = buildDashboardTools(businessId)

    } else if (context === 'support') {
      if (!businessId) return new Response(JSON.stringify({ error: 'businessId required' }), { status: 400 })
      const authResult = await validateBusinessAccess(request as any, businessId)
      if (!authResult.success) return new Response(JSON.stringify({ error: authResult.error }), { status: 403 })

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const [{ data: business }, { data: employees }, { data: integrations }, { data: recentCalls }] = await Promise.all([
        supabase.from('businesses').select('name, phone, business_type, timezone, subscription_tier, subscription_status').eq('id', businessId).single(),
        supabase.from('phone_employees').select('name, job_type, is_active, phone_number').eq('business_id', businessId),
        supabase.from('business_integrations').select('platform').eq('business_id', businessId),
        supabase.from('employee_calls').select('status, duration, started_at').eq('business_id', businessId).order('started_at', { ascending: false }).limit(20),
      ])
      if (!business) return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 })
      systemPrompt = buildSupportSystemPrompt(business, employees || [], (integrations || []).map((i: any) => i.platform), recentCalls || [])

    } else {
      const insightsSection = await getActiveInsights()
      systemPrompt = PUBLIC_SYSTEM_PROMPT + insightsSection
    }

    // Build the messages array for the AI SDK
    // The incoming messages are in { role, content } format from the frontend
    const aiMessages = (incomingMessages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : m.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '',
    }))

    const result = streamText({
      model: MAYA_CHAT_MODEL,
      system: systemPrompt,
      messages: aiMessages,
      ...(tools ? { tools, stopWhen: stepCountIs(3) } : {}),
      onFinish: async ({ text, steps }) => {
        // Public context: log conversation
        if (context === 'public' && sessionId) {
          const allMessages = [...aiMessages, { role: 'assistant', content: text }]
          const { businessType, employeeInterest } = extractVisitorContext(allMessages)
          const leadCaptured = text.includes('[SUGGEST_TRIAL]')
          const conversationText = allMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n')
          logConversation(sessionId, allMessages, leadCaptured, businessType, employeeInterest)
            .then(() => embedAndStore(sessionId, conversationText))
            .catch(err => console.error('[chat] log/embed error:', err))
        }
      },
    })

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === 'finish') {
          return {
            ...(onboardingStep !== null ? { onboardingStep } : {}),
            context,
          }
        }
        return undefined
      },
    })
  } catch (error: any) {
    console.error('[API] Chat error:', error?.message || error)
    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: 'AI service rate limited. Please try again.' }), { status: 429 })
    }
    return new Response(JSON.stringify({ error: `Failed to get response: ${error?.message || String(error)}` }), { status: 500 })
  }
}
