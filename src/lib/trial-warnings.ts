/**
 * Trial Credit Warning System
 *
 * Monitors trial credit usage and sends warnings at 50%, 80%, and 100%.
 * Pauses employees when trial is exhausted.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Trial credits: 50 (10 minutes)
const TRIAL_CREDITS = 50

export interface TrialStatus {
  businessId: string
  businessName: string
  ownerEmail: string
  subscriptionTier: string
  totalCredits: number
  creditsUsed: number
  creditsRemaining: number
  minutesUsed: number
  minutesRemaining: number
  usagePercent: number
  warning50Sent: boolean
  warning80Sent: boolean
  exhaustedSent: boolean
  trialPaused: boolean
  employeeCount: number
}

/**
 * Check a business's trial status and send warnings if needed.
 * Called after each call ends via the phone-employee webhook.
 */
export async function checkTrialAndWarn(businessId: string): Promise<{
  action: 'none' | 'warning_50' | 'warning_80' | 'exhausted'
  status: TrialStatus
}> {
  const status = await getTrialStatus(businessId)
  if (!status) return { action: 'none', status: {} as TrialStatus }

  // Only applies to trial tier
  if (status.subscriptionTier !== 'trial') {
    return { action: 'none', status }
  }

  // Check 100% (exhausted)
  if (status.usagePercent >= 100 && !status.exhaustedSent) {
    await sendTrialExhaustedWarning(status)
    await pauseTrialEmployees(businessId)
    await markWarningSent(businessId, 'exhausted')
    return { action: 'exhausted', status: { ...status, exhaustedSent: true, trialPaused: true } }
  }

  // Check 80%
  if (status.usagePercent >= 80 && !status.warning80Sent) {
    await sendTrialWarning80(status)
    await markWarningSent(businessId, '80')
    return { action: 'warning_80', status: { ...status, warning80Sent: true } }
  }

  // Check 50%
  if (status.usagePercent >= 50 && !status.warning50Sent) {
    await sendTrialWarning50(status)
    await markWarningSent(businessId, '50')
    return { action: 'warning_50', status: { ...status, warning50Sent: true } }
  }

  return { action: 'none', status }
}

/**
 * Get trial status for a business.
 */
export async function getTrialStatus(businessId: string): Promise<TrialStatus | null> {
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      id, name, subscription_tier, monthly_credits, purchased_credits,
      credits_used_this_month, trial_warning_50_sent, trial_warning_80_sent,
      trial_exhausted_sent, trial_paused, owner_email
    `)
    .eq('id', businessId)
    .single()

  if (!business) return null

  // Get employee count
  const { count } = await supabase
    .from('phone_employees')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)

  const totalCredits = (business.monthly_credits || 0) + (business.purchased_credits || 0)
  const creditsUsed = business.credits_used_this_month || 0
  const creditsRemaining = Math.max(0, totalCredits - creditsUsed)

  return {
    businessId: business.id,
    businessName: business.name || 'Your business',
    ownerEmail: business.owner_email || '',
    subscriptionTier: business.subscription_tier || 'trial',
    totalCredits,
    creditsUsed,
    creditsRemaining,
    minutesUsed: Math.floor(creditsUsed / 5),
    minutesRemaining: Math.floor(creditsRemaining / 5),
    usagePercent: totalCredits > 0 ? Math.round((creditsUsed / totalCredits) * 100) : 0,
    warning50Sent: business.trial_warning_50_sent || false,
    warning80Sent: business.trial_warning_80_sent || false,
    exhaustedSent: business.trial_exhausted_sent || false,
    trialPaused: business.trial_paused || false,
    employeeCount: count || 0,
  }
}

/**
 * Pause all employees for a trial business (stop taking calls).
 */
async function pauseTrialEmployees(businessId: string): Promise<void> {
  await supabase
    .from('phone_employees')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('status', 'active')

  await supabase
    .from('businesses')
    .update({ trial_paused: true, updated_at: new Date().toISOString() })
    .eq('id', businessId)
}

/**
 * Reactivate employees after upgrade.
 */
export async function reactivateAfterUpgrade(businessId: string): Promise<void> {
  await supabase
    .from('phone_employees')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('status', 'paused')

  await supabase
    .from('businesses')
    .update({
      trial_paused: false,
      trial_warning_50_sent: false,
      trial_warning_80_sent: false,
      trial_exhausted_sent: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId)
}

async function markWarningSent(businessId: string, level: '50' | '80' | 'exhausted'): Promise<void> {
  const field = level === '50' ? 'trial_warning_50_sent'
    : level === '80' ? 'trial_warning_80_sent'
    : 'trial_exhausted_sent'

  await supabase
    .from('businesses')
    .update({ [field]: true, updated_at: new Date().toISOString() })
    .eq('id', businessId)
}

// ============================================================================
// Warning Email Templates (sent via Gmail OAuth in production)
// ============================================================================

export function getWarning50Email(status: TrialStatus): { subject: string; html: string } {
  return {
    subject: `You've used half your trial minutes — ${status.minutesRemaining} minutes left`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Hey ${status.businessName} 👋</h2>
        <p>Your AI employee has been busy! You've used <strong>${status.minutesUsed} of your ${Math.floor(status.totalCredits / 5)} trial minutes</strong>.</p>
        <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #856404;"><strong>⚡ ${status.minutesRemaining} minutes remaining</strong></p>
        </div>
        <p>When your trial minutes run out, your AI employee will pause. Upgrade now to keep them active and never miss another call.</p>
        <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Upgrade Now — Starting at $49/mo</a>
        <p style="color: #888; margin-top: 24px; font-size: 13px;">Not sure if VoiceFly is right for you? <a href="https://voicefly.ai/roi">See how much missed calls are costing you →</a></p>
      </div>
    `,
  }
}

export function getWarning80Email(status: TrialStatus): { subject: string; html: string } {
  return {
    subject: `⚠️ Only ${status.minutesRemaining} trial minutes left — your AI employee will pause soon`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your trial is almost up ⏰</h2>
        <p>You've used <strong>${status.minutesUsed} out of ${Math.floor(status.totalCredits / 5)} minutes</strong>. Only <strong>${status.minutesRemaining} minutes left</strong>.</p>
        <div style="background: #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #c2410c;"><strong>🔥 ${status.minutesRemaining} minutes remaining — your AI employee will pause when credits run out</strong></p>
        </div>
        <p>Don't lose your phone number and the AI employee you've trained. Upgrade to keep everything running.</p>
        <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #ea580c; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px;">Upgrade Now — Keep Your AI Employee</a>
        <p style="color: #888; margin-top: 24px; font-size: 13px;">Questions? Reply to this email and we'll help.</p>
      </div>
    `,
  }
}

export function getExhaustedEmail(status: TrialStatus): { subject: string; html: string } {
  return {
    subject: `Your AI employee is paused — upgrade to reactivate`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Your trial minutes are used up 😔</h2>
        <p>Your AI employee has been <strong>paused</strong> and is no longer answering calls. Any calls to your VoiceFly number will go unanswered until you upgrade.</p>
        <div style="background: #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>🚫 ${status.employeeCount} AI employee${status.employeeCount > 1 ? 's' : ''} paused — calls are going unanswered</strong></p>
        </div>
        <p>The good news: your employee's training, phone number, and configuration are all saved. Upgrade and they'll be back online instantly.</p>
        <a href="https://voicefly.ai/dashboard/billing" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 16px;">Reactivate Now — $49/mo</a>
        <p style="margin-top: 16px;"><a href="https://voicefly.ai/roi" style="color: #4f46e5;">See how much missed calls are costing you →</a></p>
      </div>
    `,
  }
}

// Internal helpers for sending (these get called by the cron or webhook)
async function sendTrialWarning50(status: TrialStatus): Promise<void> {
  const email = getWarning50Email(status)
  await logTrialWarningEmail(status.businessId, '50', email.subject)
}

async function sendTrialWarning80(status: TrialStatus): Promise<void> {
  const email = getWarning80Email(status)
  await logTrialWarningEmail(status.businessId, '80', email.subject)
}

async function sendTrialExhaustedWarning(status: TrialStatus): Promise<void> {
  const email = getExhaustedEmail(status)
  await logTrialWarningEmail(status.businessId, 'exhausted', email.subject)
}

async function logTrialWarningEmail(businessId: string, level: string, subject: string): Promise<void> {
  await supabase
    .from('mcp_agent_interactions')
    .insert({
      business_id: businessId,
      interaction_type: 'email',
      direction: 'outbound',
      subject: `trial_warning_${level}`,
      content: subject,
      metadata: { warning_level: level, sent_at: new Date().toISOString() },
    })
}
