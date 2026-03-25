/**
 * Trial Nurture Email Sequence
 *
 * 8 emails over 14 days that guide trial users toward conversion.
 * Emails are personalized based on industry, usage, and onboarding progress.
 *
 * Sent via Gmail OAuth (Google Workspace domain delegation).
 * Triggered by daily cron at /api/cron/trial-nurture.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Nurture Sequence Definition
// ============================================================================

export interface NurtureEmail {
  day: number          // Days since trial_start_date
  key: string          // Unique identifier for tracking
  subject: string      // Email subject (supports {{variables}})
  getHtml: (ctx: NurtureContext) => string
  condition?: (ctx: NurtureContext) => boolean  // Optional skip condition
}

export interface NurtureContext {
  businessId: string
  businessName: string
  ownerName: string
  ownerEmail: string
  industry: string
  employeeCount: number
  hasPhoneNumber: boolean
  hasMadeCall: boolean
  minutesUsed: number
  minutesRemaining: number
  employeeName: string
  trialDaysLeft: number
}

export const NURTURE_SEQUENCE: NurtureEmail[] = [
  {
    day: 0,
    key: 'welcome',
    subject: 'Welcome to VoiceFly — your AI employee is ready',
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2>Welcome to VoiceFly, ${ctx.ownerName}! 🎉</h2>
        <p>You just took the first step toward never missing another call. Here's what happens next:</p>
        <ol>
          <li><strong>Set up your business profile</strong> — Tell us about your ${ctx.industry || 'business'} so your AI employee knows how to represent you.</li>
          <li><strong>Hire your AI employee</strong> — Choose their personality, voice, and what they should handle (calls, appointments, FAQs).</li>
          <li><strong>Make a test call</strong> — Call your new number and hear your AI employee in action.</li>
        </ol>
        <p>You have <strong>10 free minutes</strong> to try everything. Most businesses are set up and live in under 15 minutes.</p>
        <a href="https://voicefly.ai/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Your Dashboard →</a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">Questions? Just reply to this email — a real human will get back to you.</p>
      </div>
    `,
  },
  {
    day: 1,
    key: 'first_call',
    subject: 'Did you make your first test call yet?',
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2>Quick check-in 👋</h2>
        ${ctx.hasMadeCall
          ? `<p>We saw you made your first call — nice! 🎉 How did ${ctx.employeeName || 'your AI employee'} do? If anything felt off, we can fine-tune the personality, greeting, or responses in minutes.</p>
             <a href="https://voicefly.ai/dashboard/employees" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Fine-Tune Your Employee →</a>`
          : `<p>Your AI employee is ready and waiting — but they haven't taken their first call yet.</p>
             <p>Here's the fastest way to see it work:</p>
             <ol>
               <li>Open your dashboard</li>
               <li>Click "Make a Test Call"</li>
               <li>Talk to your AI employee like a customer would</li>
             </ol>
             <p>It takes 30 seconds and you'll immediately see why businesses love this.</p>
             <a href="https://voicefly.ai/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Make Your First Call →</a>`
        }
      </div>
    `,
  },
  {
    day: 3,
    key: 'features',
    subject: "Here's what your AI employee can do",
    getHtml: (ctx) => {
      const industryFeatures: Record<string, string> = {
        restaurant: 'take reservations, answer menu questions, handle takeout orders, and manage waitlists',
        salon: 'book appointments, explain services and pricing, match clients with stylists, and send reminders',
        auto: 'schedule service appointments, provide estimates, answer common repair questions, and follow up on quotes',
        dental: 'schedule patient appointments, answer insurance questions, handle new patient intake, and send reminders',
        law: 'screen potential clients, schedule consultations, answer basic case questions, and capture lead information',
        home_services: 'book service calls, provide quotes, answer availability questions, and handle emergency requests',
      }
      const features = industryFeatures[ctx.industry] || 'answer calls, book appointments, handle FAQs, capture leads, and send follow-up messages'

      return `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
          <h2>Your AI employee can do more than you think 💪</h2>
          <p>For ${ctx.industry || 'your'} businesses, VoiceFly can:</p>
          <p><strong>${features}</strong></p>
          <p>Most businesses only set up basic call answering — but the real power is in what happens after the call:</p>
          <ul>
            <li>📱 <strong>SMS follow-ups</strong> — Automatically text callers with confirmation details</li>
            <li>📊 <strong>Call insights</strong> — See what customers are asking about most</li>
            <li>🔗 <strong>Integrations</strong> — Connect to Calendly, Google Calendar, Square, and more</li>
          </ul>
          <a href="https://voicefly.ai/dashboard/integrations" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Explore Integrations →</a>
        </div>
      `
    },
  },
  {
    day: 5,
    key: 'usage_update',
    subject: `Trial update: ${'{minutesUsed}'} minutes used, ${'{minutesRemaining}'} minutes left`,
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2>Your trial progress 📊</h2>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Minutes used:</strong> ${ctx.minutesUsed} of 10</p>
          <p style="margin: 8px 0 0;"><strong>Minutes remaining:</strong> ${ctx.minutesRemaining}</p>
          <p style="margin: 8px 0 0;"><strong>AI Employee:</strong> ${ctx.employeeName || 'Active'}</p>
          <p style="margin: 8px 0 0;"><strong>Trial days left:</strong> ${ctx.trialDaysLeft}</p>
        </div>
        ${ctx.minutesUsed > 0
          ? `<p>Your AI employee is working! When you upgrade, you get <strong>60-750 minutes/month</strong> depending on your plan — enough to handle all your calls.</p>`
          : `<p>You haven't used any minutes yet. Your AI employee is ready — try a test call and see it in action!</p>`
        }
        <a href="https://voicefly.ai/pricing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">See Plans & Pricing →</a>
      </div>
    `,
  },
  {
    day: 7,
    key: 'social_proof',
    subject: `How ${'{industry}'} businesses use VoiceFly`,
    getHtml: (ctx) => {
      const testimonials: Record<string, { quote: string; name: string; business: string }> = {
        restaurant: { quote: "We went from missing 40% of calls during rush to missing zero. VoiceFly handles reservations while we focus on the kitchen.", name: "Marco D.", business: "Italian restaurant owner" },
        salon: { quote: "My clients love that they can book anytime. We've seen a 35% increase in appointment bookings since switching to VoiceFly.", name: "Ashley T.", business: "Salon owner" },
        auto: { quote: "We used to lose $3,000/month in missed service appointments. VoiceFly paid for itself in the first week.", name: "James K.", business: "Auto shop owner" },
        dental: { quote: "Patient no-shows dropped 60% since VoiceFly started sending automated reminders and confirmations.", name: "Dr. Sarah L.", business: "Dental practice" },
        law: { quote: "Every missed call is a potential client going to another firm. VoiceFly ensures we capture every lead, 24/7.", name: "Michael R.", business: "Personal injury attorney" },
        home_services: { quote: "When a pipe bursts at 2 AM, the customer calls whoever answers. That's us now, thanks to VoiceFly.", name: "Dave P.", business: "Plumbing company" },
      }
      const t = testimonials[ctx.industry] || testimonials.restaurant

      return `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
          <h2>Real results from businesses like yours 📈</h2>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 16px 0; border-left: 4px solid #4f46e5;">
            <p style="font-style: italic; margin: 0;">"${t.quote}"</p>
            <p style="margin: 8px 0 0; font-weight: 600;">— ${t.name}, ${t.business}</p>
          </div>
          <p>See how much missed calls are costing YOUR business:</p>
          <a href="https://voicefly.ai/roi" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Calculate Your ROI →</a>
        </div>
      `
    },
  },
  {
    day: 10,
    key: 'pre_conversion',
    subject: '4 days left on your trial — here\'s what happens next',
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2>Your trial ends in 4 days ⏰</h2>
        <p>Here's what happens when your trial ends:</p>
        <ul>
          <li>❌ Your AI employee <strong>stops answering calls</strong></li>
          <li>❌ Your phone number is <strong>released</strong> (someone else can claim it)</li>
          <li>❌ Your employee's training and configuration are <strong>archived</strong></li>
        </ul>
        <p>Here's what happens when you upgrade:</p>
        <ul>
          <li>✅ Your AI employee <strong>keeps working 24/7</strong></li>
          <li>✅ Your phone number is <strong>yours permanently</strong></li>
          <li>✅ You get <strong>60-750 minutes/month</strong> (vs. 10 in trial)</li>
          <li>✅ Access to <strong>all integrations</strong> (Calendly, Square, HubSpot, etc.)</li>
        </ul>
        <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px;">Upgrade Now — Starting at $49/mo</a>
      </div>
    `,
  },
  {
    day: 13,
    key: 'last_day',
    subject: "Last day — don't lose your AI employee and phone number",
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2 style="color: #dc2626;">Your trial expires tomorrow 🚨</h2>
        <p><strong>${ctx.employeeName || 'Your AI employee'}</strong> has been handling calls for your business. Tomorrow, they stop.</p>
        <p>Everything you've set up — the training, the personality, the phone number — will be archived unless you upgrade today.</p>
        <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: 700; color: #dc2626; margin: 0;">Don't go back to missing calls.</p>
        </div>
        <div style="text-align: center;">
          <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 18px;">Keep My AI Employee — $49/mo</a>
        </div>
      </div>
    `,
  },
  {
    day: 14,
    key: 'expired',
    subject: 'Your AI employee is paused — reactivate anytime',
    getHtml: (ctx) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.7;">
        <h2>Your trial has ended 😔</h2>
        <p>${ctx.employeeName || 'Your AI employee'} has been paused. Calls to your VoiceFly number are going unanswered.</p>
        <p>But nothing is lost — your employee's training, configuration, and phone number are saved for <strong>30 days</strong>. Upgrade anytime to pick up right where you left off.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0;">💡 <strong>Fun fact:</strong> The average small business loses $1,200/month in revenue from missed calls. That's ${Math.round(1200 / 49)}x more than VoiceFly costs.</p>
        </div>
        <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reactivate My Employee →</a>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">Not the right time? No worries. We'll keep your setup saved. Reply if you have questions.</p>
      </div>
    `,
  },
]

// ============================================================================
// Nurture Engine
// ============================================================================

/**
 * Process all trial businesses and send due nurture emails.
 * Called by the daily cron job.
 */
export async function processTrialNurture(): Promise<{
  processed: number
  emailsSent: number
  errors: string[]
}> {
  const result = { processed: 0, emailsSent: 0, errors: [] as string[] }

  // Get all trial businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      id, name, subscription_tier, owner_email, business_type,
      trial_start_date, created_at, nurture_emails_sent,
      monthly_credits, purchased_credits, credits_used_this_month
    `)
    .eq('subscription_tier', 'trial')

  if (!businesses?.length) return result

  for (const biz of businesses) {
    result.processed++

    const trialStart = new Date(biz.trial_start_date || biz.created_at)
    const daysSinceStart = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
    const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>

    // Get context for this business
    const ctx = await getNurtureContext(biz)
    if (!ctx) continue

    // Check each email in the sequence
    for (const email of NURTURE_SEQUENCE) {
      if (daysSinceStart >= email.day && !sentEmails[email.key]) {
        // Check skip condition
        if (email.condition && !email.condition(ctx)) continue

        try {
          // Generate the email
          const subject = email.subject
            .replace('{minutesUsed}', String(ctx.minutesUsed))
            .replace('{minutesRemaining}', String(ctx.minutesRemaining))
            .replace('{industry}', ctx.industry || 'small')

          const html = email.getHtml(ctx)

          // Mark as sent (email sending happens via MCP/Gmail)
          sentEmails[email.key] = true
          await supabase
            .from('businesses')
            .update({ nurture_emails_sent: sentEmails })
            .eq('id', biz.id)

          // Log the email for MCP to pick up and send
          await supabase
            .from('mcp_agent_interactions')
            .insert({
              business_id: biz.id,
              interaction_type: 'email',
              direction: 'outbound',
              subject: `nurture_${email.key}`,
              content: JSON.stringify({ to: ctx.ownerEmail, subject, html }),
              metadata: { nurture_key: email.key, day: email.day },
            })

          result.emailsSent++
        } catch (e) {
          result.errors.push(`${biz.id}/${email.key}: ${e instanceof Error ? e.message : 'Unknown'}`)
        }
      }
    }
  }

  return result
}

/**
 * Get nurture context for a business.
 */
async function getNurtureContext(biz: {
  id: string; name: string; owner_email: string; business_type: string;
  trial_start_date: string; created_at: string;
  monthly_credits: number; purchased_credits: number; credits_used_this_month: number;
}): Promise<NurtureContext | null> {
  // Get employee info
  const { data: employees } = await supabase
    .from('phone_employees')
    .select('id, name, phone_number')
    .eq('business_id', biz.id)
    .limit(5)

  // Check if any call has been made
  const { count: callCount } = await supabase
    .from('employee_calls')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', biz.id)

  const trialStart = new Date(biz.trial_start_date || biz.created_at)
  const trialEnd = new Date(trialStart)
  trialEnd.setDate(trialEnd.getDate() + 14)

  const totalCredits = (biz.monthly_credits || 0) + (biz.purchased_credits || 0)
  const used = biz.credits_used_this_month || 0

  return {
    businessId: biz.id,
    businessName: biz.name || 'Your business',
    ownerName: biz.name?.split(' ')[0] || 'there',
    ownerEmail: biz.owner_email || '',
    industry: biz.business_type || 'general',
    employeeCount: employees?.length || 0,
    hasPhoneNumber: employees?.some(e => e.phone_number) || false,
    hasMadeCall: (callCount || 0) > 0,
    minutesUsed: Math.floor(used / 5),
    minutesRemaining: Math.floor(Math.max(0, totalCredits - used) / 5),
    employeeName: employees?.[0]?.name || 'Your AI employee',
    trialDaysLeft: Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
  }
}

/**
 * Get nurture status for a specific business.
 */
export async function getNurtureStatus(businessId: string): Promise<{
  trialDaysSinceStart: number
  trialDaysLeft: number
  emailsSent: Record<string, boolean>
  nextEmail: { key: string; day: number; subject: string } | null
  allEmailsSent: boolean
}> {
  const { data: biz } = await supabase
    .from('businesses')
    .select('trial_start_date, created_at, nurture_emails_sent')
    .eq('id', businessId)
    .single()

  if (!biz) throw new Error('Business not found')

  const trialStart = new Date(biz.trial_start_date || biz.created_at)
  const daysSinceStart = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, 14 - daysSinceStart)
  const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>

  // Find next unsent email
  const nextEmail = NURTURE_SEQUENCE.find(e => !sentEmails[e.key] && e.day >= daysSinceStart)

  return {
    trialDaysSinceStart: daysSinceStart,
    trialDaysLeft: daysLeft,
    emailsSent: sentEmails,
    nextEmail: nextEmail ? { key: nextEmail.key, day: nextEmail.day, subject: nextEmail.subject } : null,
    allEmailsSent: NURTURE_SEQUENCE.every(e => sentEmails[e.key]),
  }
}

/**
 * Manually trigger a specific nurture email for a business.
 */
export async function triggerNurtureEmail(
  businessId: string,
  emailKey: string
): Promise<{ success: boolean; error?: string }> {
  const email = NURTURE_SEQUENCE.find(e => e.key === emailKey)
  if (!email) return { success: false, error: `Unknown email key: ${emailKey}` }

  const { data: biz } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (!biz) return { success: false, error: 'Business not found' }

  const ctx = await getNurtureContext(biz)
  if (!ctx) return { success: false, error: 'Could not build context' }

  const subject = email.subject
    .replace('{minutesUsed}', String(ctx.minutesUsed))
    .replace('{minutesRemaining}', String(ctx.minutesRemaining))
    .replace('{industry}', ctx.industry || 'small')

  const html = email.getHtml(ctx)

  // Mark as sent
  const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>
  sentEmails[emailKey] = true
  await supabase
    .from('businesses')
    .update({ nurture_emails_sent: sentEmails })
    .eq('id', businessId)

  // Log for sending
  await supabase
    .from('mcp_agent_interactions')
    .insert({
      business_id: businessId,
      interaction_type: 'email',
      direction: 'outbound',
      subject: `nurture_${emailKey}`,
      content: JSON.stringify({ to: ctx.ownerEmail, subject, html }),
      metadata: { nurture_key: emailKey, manual: true },
    })

  return { success: true }
}

/**
 * Skip a nurture email for a business (e.g., they already converted).
 */
export async function skipNurtureEmail(
  businessId: string,
  emailKey: string
): Promise<{ success: boolean }> {
  const { data: biz } = await supabase
    .from('businesses')
    .select('nurture_emails_sent')
    .eq('id', businessId)
    .single()

  if (!biz) return { success: false }

  const sentEmails = (biz.nurture_emails_sent || {}) as Record<string, boolean>
  sentEmails[emailKey] = true // Mark as sent (effectively skipping it)

  await supabase
    .from('businesses')
    .update({ nurture_emails_sent: sentEmails })
    .eq('id', businessId)

  return { success: true }
}
