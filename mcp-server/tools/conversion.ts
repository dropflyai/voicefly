/**
 * VoiceFly MCP — Conversion Tools
 *
 * 8 tools focused on converting trial users to paid customers:
 * - Onboarding status + nudge
 * - Trial status + warning
 * - ROI calculator
 * - Nurture email status + trigger + skip
 */

import { createClient } from '@supabase/supabase-js'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUSINESS_ID = process.env.VOICEFLY_BUSINESS_ID || ''

// ============================================================================
// Tool Definitions
// ============================================================================

export const conversionTools: Tool[] = [
  {
    name: 'get_onboarding_status',
    description: 'Check onboarding progress for a business — which steps are complete and which are pending. Shows the path to activation (first call).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID. Defaults to the configured business.' },
      },
    },
  },
  {
    name: 'nudge_onboarding',
    description: 'Send a targeted nudge to a business based on which onboarding step they are stuck on. Generates and logs an appropriate email/SMS.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID.' },
        step: { type: 'number', description: 'Which step to nudge about (2-6). If not provided, nudges the first incomplete step.' },
      },
    },
  },
  {
    name: 'check_trial_status',
    description: 'Get trial credit usage, warning state, and pause status for a business. Shows usage %, minutes remaining, which warnings have been sent, and whether the employee is paused.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID. Defaults to configured business.' },
      },
    },
  },
  {
    name: 'send_trial_warning',
    description: 'Manually trigger a trial credit warning email for a business. Use when you want to send a specific warning level outside of the automatic system.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID.' },
        level: { type: 'string', enum: ['50', '80', 'exhausted'], description: 'Warning level to send.' },
      },
      required: ['business_id', 'level'],
    },
  },
  {
    name: 'calculate_roi',
    description: 'Calculate ROI for a prospect based on their call volume, miss rate, and average customer value. Returns monthly revenue lost, VoiceFly cost, net ROI, and payback period.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        calls_per_day: { type: 'number', description: 'Calls received per day. Default: 20' },
        miss_rate: { type: 'number', description: 'Percentage of calls missed (0-100). Default: 30' },
        avg_customer_value: { type: 'number', description: 'Average value of a customer in dollars. Default: 200' },
        industry: { type: 'string', enum: ['restaurant', 'salon', 'auto', 'dental', 'law', 'home_services', 'other'], description: 'Industry type — adjusts conversion rate. Default: other' },
      },
    },
  },
  {
    name: 'get_nurture_status',
    description: 'Get the trial nurture email sequence status for a business — which emails have been sent, which are pending, and what is next.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID.' },
      },
    },
  },
  {
    name: 'trigger_nurture_email',
    description: 'Manually send a specific nurture email to a business, regardless of timing. Useful for re-engaging a stuck prospect.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID.' },
        email_key: { type: 'string', enum: ['welcome', 'first_call', 'features', 'usage_update', 'social_proof', 'pre_conversion', 'last_day', 'expired'], description: 'Which nurture email to send.' },
      },
      required: ['business_id', 'email_key'],
    },
  },
  {
    name: 'skip_nurture_email',
    description: 'Skip a nurture email for a business (e.g., they already converted, or the timing is wrong). Marks the email as sent so it won\'t trigger automatically.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID.' },
        email_key: { type: 'string', enum: ['welcome', 'first_call', 'features', 'usage_update', 'social_proof', 'pre_conversion', 'last_day', 'expired'], description: 'Which nurture email to skip.' },
      },
      required: ['business_id', 'email_key'],
    },
  },
]

// ============================================================================
// Tool Handlers
// ============================================================================

export async function handleConversionTool(name: string, args: Record<string, unknown>): Promise<string> {
  const businessId = (args.business_id as string) || BUSINESS_ID

  switch (name) {
    case 'get_onboarding_status': {
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name, business_type, phone, email, business_hours, onboarding_step, onboarding_completed, first_call_at')
        .eq('id', businessId)
        .single()

      if (!business) return JSON.stringify({ error: 'Business not found' })

      const { data: employees } = await supabase
        .from('phone_employees')
        .select('id, name, phone_number, status')
        .eq('business_id', businessId)

      const { count: callCount } = await supabase
        .from('employee_calls')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)

      const steps = [
        { step: 1, name: 'Create account', complete: true, action: null },
        { step: 2, name: 'Set up business profile', complete: !!(business.name && business.business_type), action: '/dashboard/settings' },
        { step: 3, name: 'Hire first AI employee', complete: (employees?.length || 0) > 0, action: '/dashboard/employees' },
        { step: 4, name: 'Assign a phone number', complete: employees?.some(e => e.phone_number) || false, action: '/dashboard/employees' },
        { step: 5, name: 'Make a test call', complete: (callCount || 0) > 0, action: '/dashboard/voice-ai' },
        { step: 6, name: 'Share your number', complete: business.onboarding_completed || false, action: null },
      ]

      const completedCount = steps.filter(s => s.complete).length
      const firstIncomplete = steps.find(s => !s.complete)

      return JSON.stringify({
        businessId,
        businessName: business.name,
        completedSteps: completedCount,
        totalSteps: 6,
        progress: `${completedCount}/6`,
        onboardingComplete: business.onboarding_completed,
        firstCallAt: business.first_call_at,
        steps,
        nextStep: firstIncomplete ? { step: firstIncomplete.step, name: firstIncomplete.name, action: firstIncomplete.action } : null,
        activated: (callCount || 0) > 0,
      }, null, 2)
    }

    case 'nudge_onboarding': {
      const targetStep = args.step as number | undefined

      // Get onboarding status first
      const statusResult = await handleConversionTool('get_onboarding_status', { business_id: businessId })
      const status = JSON.parse(statusResult)

      const step = targetStep || status.nextStep?.step
      if (!step) return JSON.stringify({ error: 'All onboarding steps complete — no nudge needed' })

      const nudgeMessages: Record<number, { subject: string; message: string }> = {
        2: { subject: "Let's set up your business profile", message: "Your AI employee needs to know about your business to represent you well. Set up your profile in 2 minutes — name, hours, and what you do." },
        3: { subject: "Time to hire your AI employee", message: "Your account is ready — now hire your first AI phone employee. Choose their personality, voice, and what they should handle. Takes 5 minutes." },
        4: { subject: "Assign a phone number to your AI employee", message: "Your AI employee is trained and ready — they just need a phone number. We'll assign one instantly so they can start taking calls." },
        5: { subject: "Make your first test call!", message: "Everything is set up. Call your VoiceFly number and hear your AI employee in action. It takes 30 seconds and you'll see exactly how it works." },
        6: { subject: "Last step: share your new number", message: "Your AI employee is live! Share your VoiceFly number with customers, or forward your existing business line to it. Never miss a call again." },
      }

      const nudge = nudgeMessages[step]
      if (!nudge) return JSON.stringify({ error: `No nudge available for step ${step}` })

      // Log the nudge
      await supabase.from('mcp_agent_interactions').insert({
        business_id: businessId,
        interaction_type: 'email',
        direction: 'outbound',
        subject: `onboarding_nudge_step_${step}`,
        content: JSON.stringify(nudge),
        metadata: { step, nudge_type: 'onboarding' },
      })

      return JSON.stringify({ success: true, step, nudge })
    }

    case 'check_trial_status': {
      const { data: business } = await supabase
        .from('businesses')
        .select(`
          subscription_tier, monthly_credits, purchased_credits,
          credits_used_this_month, trial_warning_50_sent, trial_warning_80_sent,
          trial_exhausted_sent, trial_paused, trial_start_date, created_at
        `)
        .eq('id', businessId)
        .single()

      if (!business) return JSON.stringify({ error: 'Business not found' })

      const total = (business.monthly_credits || 0) + (business.purchased_credits || 0)
      const used = business.credits_used_this_month || 0
      const remaining = Math.max(0, total - used)
      const percent = total > 0 ? Math.round((used / total) * 100) : 0

      const trialStart = new Date(business.trial_start_date || business.created_at)
      const daysInTrial = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24))

      return JSON.stringify({
        businessId,
        tier: business.subscription_tier,
        credits: { total, used, remaining },
        minutes: { total: Math.floor(total / 5), used: Math.floor(used / 5), remaining: Math.floor(remaining / 5) },
        usagePercent: percent,
        warnings: {
          warning50Sent: business.trial_warning_50_sent || false,
          warning80Sent: business.trial_warning_80_sent || false,
          exhaustedSent: business.trial_exhausted_sent || false,
        },
        trialPaused: business.trial_paused || false,
        trialDaysElapsed: daysInTrial,
        trialDaysRemaining: Math.max(0, 14 - daysInTrial),
      }, null, 2)
    }

    case 'send_trial_warning': {
      const level = args.level as string
      await supabase
        .from('businesses')
        .update({
          [`trial_warning_${level === 'exhausted' ? 'exhausted' : level}_sent`]: true,
        })
        .eq('id', businessId)

      await supabase.from('mcp_agent_interactions').insert({
        business_id: businessId,
        interaction_type: 'email',
        direction: 'outbound',
        subject: `trial_warning_${level}`,
        content: `Manual trial warning: ${level}%`,
        metadata: { warning_level: level, manual: true },
      })

      return JSON.stringify({ success: true, level, message: `Trial warning ${level} sent for ${businessId}` })
    }

    case 'calculate_roi': {
      const callsPerDay = (args.calls_per_day as number) || 20
      const missRate = ((args.miss_rate as number) || 30) / 100
      const avgValue = (args.avg_customer_value as number) || 200
      const industry = (args.industry as string) || 'other'

      const conversionRates: Record<string, number> = {
        restaurant: 0.45, salon: 0.55, auto: 0.40, dental: 0.60,
        law: 0.50, home_services: 0.35, other: 0.40,
      }

      const conversionRate = conversionRates[industry] || 0.40
      const missedCallsPerMonth = Math.round(callsPerDay * missRate * 30)
      const revenueLostMonthly = Math.round(missedCallsPerMonth * avgValue * conversionRate)
      const revenueLostYearly = revenueLostMonthly * 12

      // Recommend tier based on call volume
      const totalCallMinutes = callsPerDay * 2.5 * 30 // avg 2.5 min per call
      let tier = 'starter'
      let cost = 49
      if (totalCallMinutes > 250) { tier = 'pro'; cost = 249 }
      else if (totalCallMinutes > 60) { tier = 'growth'; cost = 129 }

      const monthlyROI = revenueLostMonthly - cost
      const paybackDays = cost > 0 ? Math.ceil(cost / (revenueLostMonthly / 30)) : 0
      const roiMultiplier = cost > 0 ? Math.round(revenueLostMonthly / cost) : 0

      return JSON.stringify({
        inputs: { callsPerDay, missRate: missRate * 100, avgCustomerValue: avgValue, industry, conversionRate: conversionRate * 100 },
        results: {
          missedCallsPerMonth,
          revenueLostMonthly: `$${revenueLostMonthly.toLocaleString()}`,
          revenueLostYearly: `$${revenueLostYearly.toLocaleString()}`,
          recommendedTier: tier,
          voiceflyCost: `$${cost}/mo`,
          monthlyROI: `$${monthlyROI.toLocaleString()}`,
          paybackPeriod: `${paybackDays} days`,
          roiMultiplier: `${roiMultiplier}x return`,
        },
        pitch: `You're losing approximately $${revenueLostMonthly.toLocaleString()}/month from missed calls. VoiceFly costs $${cost}/month — that's a ${roiMultiplier}x return on investment. It pays for itself in ${paybackDays} days.`,
      }, null, 2)
    }

    case 'get_nurture_status': {
      const { data: biz } = await supabase
        .from('businesses')
        .select('trial_start_date, created_at, nurture_emails_sent')
        .eq('id', businessId)
        .single()

      if (!biz) return JSON.stringify({ error: 'Business not found' })

      const trialStart = new Date(biz.trial_start_date || biz.created_at)
      const daysSinceStart = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
      const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>

      const sequence = [
        { day: 0, key: 'welcome', subject: 'Welcome to VoiceFly' },
        { day: 1, key: 'first_call', subject: 'Did you make your first test call?' },
        { day: 3, key: 'features', subject: "Here's what your AI employee can do" },
        { day: 5, key: 'usage_update', subject: 'Trial update: usage report' },
        { day: 7, key: 'social_proof', subject: 'How businesses like yours use VoiceFly' },
        { day: 10, key: 'pre_conversion', subject: '4 days left on your trial' },
        { day: 13, key: 'last_day', subject: "Last day — don't lose your AI employee" },
        { day: 14, key: 'expired', subject: 'Your AI employee is paused' },
      ]

      const emailStatus = sequence.map(e => ({
        ...e,
        sent: sentEmails[e.key] || false,
        due: daysSinceStart >= e.day,
        overdue: daysSinceStart >= e.day && !sentEmails[e.key],
      }))

      const nextEmail = emailStatus.find(e => !e.sent && e.due)

      return JSON.stringify({
        businessId,
        trialDaysSinceStart: daysSinceStart,
        trialDaysLeft: Math.max(0, 14 - daysSinceStart),
        emailsSent: Object.keys(sentEmails).filter(k => sentEmails[k]).length,
        totalEmails: 8,
        emails: emailStatus,
        nextOverdueEmail: nextEmail || null,
      }, null, 2)
    }

    case 'trigger_nurture_email': {
      const emailKey = args.email_key as string
      const { data: biz } = await supabase
        .from('businesses')
        .select('nurture_emails_sent')
        .eq('id', businessId)
        .single()

      if (!biz) return JSON.stringify({ error: 'Business not found' })

      const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>
      sentEmails[emailKey] = true

      await supabase.from('businesses').update({ nurture_emails_sent: sentEmails }).eq('id', businessId)
      await supabase.from('mcp_agent_interactions').insert({
        business_id: businessId,
        interaction_type: 'email',
        direction: 'outbound',
        subject: `nurture_${emailKey}`,
        content: `Manual nurture email trigger: ${emailKey}`,
        metadata: { nurture_key: emailKey, manual: true },
      })

      return JSON.stringify({ success: true, emailKey, message: `Nurture email "${emailKey}" triggered for ${businessId}` })
    }

    case 'skip_nurture_email': {
      const emailKey = args.email_key as string
      const { data: biz } = await supabase
        .from('businesses')
        .select('nurture_emails_sent')
        .eq('id', businessId)
        .single()

      if (!biz) return JSON.stringify({ error: 'Business not found' })

      const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>
      sentEmails[emailKey] = true

      await supabase.from('businesses').update({ nurture_emails_sent: sentEmails }).eq('id', businessId)

      return JSON.stringify({ success: true, emailKey, message: `Nurture email "${emailKey}" skipped for ${businessId}` })
    }

    default:
      return JSON.stringify({ error: `Unknown conversion tool: ${name}` })
  }
}
