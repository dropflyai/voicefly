/**
 * SMS Send Guard — enforces A2P enablement + monthly usage limits
 *
 * All outbound SMS on behalf of a tenant MUST go through this wrapper.
 * It checks:
 *   1. `businesses.sms_enabled` — has the A2P campaign approved?
 *   2. `sms_segments_used < sms_segments_limit` — is there quota left?
 *
 * On success, it sends via the underlying Twilio client and atomically
 * increments the business's segment counter. Callers get a clear error
 * string when the send is blocked so they can log or surface it.
 *
 * One SMS message can be >1 segment (long messages split at 160 chars for
 * GSM-7 or 70 for UCS-2). We approximate segments from body length; Twilio's
 * actual segment count is authoritative but not available until after send.
 */

import { createClient } from '@supabase/supabase-js'
import { sendSms, type SendSmsResult } from '@/lib/sms/twilio-client'
import { sendSmsUsageWarningEmail } from '@/lib/notifications/email-notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Per-tier allowances (matches /pricing)
export const SMS_LIMITS_BY_TIER: Record<string, number> = {
  trial: 20,
  starter: 100,
  growth: 400,
  pro: 1000,
  // Legacy enum values
  professional: 400,
  business: 1000,
  enterprise: 5000,
}

export interface SendSmsForBusinessParams {
  businessId: string
  to: string
  from: string
  body: string
}

export interface SendSmsForBusinessResult extends SendSmsResult {
  blocked?: 'sms_not_enabled' | 'quota_exceeded'
  segmentsUsed?: number
  segmentsLimit?: number
}

function estimateSegments(body: string): number {
  // Simple estimate: non-ASCII content uses UCS-2 (70 chars/segment);
  // pure ASCII uses GSM-7 (160 chars/segment). Good enough for quota math.
  const isAscii = /^[\x00-\x7F]*$/.test(body)
  const perSegment = isAscii ? 160 : 70
  return Math.max(1, Math.ceil(body.length / perSegment))
}

/**
 * Send an SMS on behalf of a tenant business, enforcing A2P + quota.
 */
export async function sendSmsForBusiness(
  params: SendSmsForBusinessParams
): Promise<SendSmsForBusinessResult> {
  const { businessId, to, from, body } = params

  // Fetch current SMS state
  const { data: business, error } = await supabase
    .from('businesses')
    .select('sms_enabled, sms_segments_used, sms_segments_limit, subscription_tier')
    .eq('id', businessId)
    .maybeSingle()

  if (error || !business) {
    return { success: false, error: 'Business not found' }
  }

  // Gate 1: A2P campaign approved?
  if (!business.sms_enabled) {
    return {
      success: false,
      blocked: 'sms_not_enabled',
      error: 'SMS is not yet active for this business — complete A2P registration first',
    }
  }

  // Determine quota: explicit limit > tier default > 0
  const tier = (business.subscription_tier || 'trial').toLowerCase()
  const limit = business.sms_segments_limit ?? SMS_LIMITS_BY_TIER[tier] ?? 0
  const used = business.sms_segments_used ?? 0
  const segments = estimateSegments(body)

  // Gate 2: quota (no overage yet — Stripe overage billing ships separately)
  if (limit > 0 && used + segments > limit) {
    return {
      success: false,
      blocked: 'quota_exceeded',
      error: `Monthly SMS limit reached (${used}/${limit} segments). Upgrade plan or wait for next billing cycle.`,
      segmentsUsed: used,
      segmentsLimit: limit,
    }
  }

  // Clear to send
  const result = await sendSms({ to, from, body })
  if (!result.success) return result

  // Atomically increment usage via the RPC (created in phase 2 migration)
  const { data: newUsed } = await supabase.rpc('increment_sms_usage', {
    p_business_id: businessId,
    p_segments: segments,
  })

  const segmentsUsed = typeof newUsed === 'number' ? newUsed : used + segments

  // Fire 80% usage warning email, but only once per cycle (non-blocking)
  if (limit > 0 && used < limit * 0.8 && segmentsUsed >= limit * 0.8) {
    maybeSendUsageWarning(businessId, segmentsUsed, limit)
      .catch(err => console.error('[sms-guard] usage warning email failed', err))
  }

  return {
    ...result,
    segmentsUsed,
    segmentsLimit: limit,
  }
}

async function maybeSendUsageWarning(businessId: string, used: number, limit: number): Promise<void> {
  const { data: business } = await supabase
    .from('businesses')
    .select('name, email')
    .eq('id', businessId)
    .maybeSingle()
  if (!business?.email) return

  await sendSmsUsageWarningEmail({
    ownerEmail: business.email,
    businessName: business.name || 'your business',
    segmentsUsed: used,
    segmentsLimit: limit,
  })
}

/**
 * Set the segment limit on a business based on its subscription tier.
 * Called when a business signs up, upgrades, or downgrades.
 */
export async function syncSmsLimitFromTier(businessId: string): Promise<void> {
  const { data: business } = await supabase
    .from('businesses')
    .select('subscription_tier')
    .eq('id', businessId)
    .maybeSingle()

  if (!business) return
  const tier = (business.subscription_tier || 'trial').toLowerCase()
  const limit = SMS_LIMITS_BY_TIER[tier] ?? 0

  await supabase
    .from('businesses')
    .update({ sms_segments_limit: limit, updated_at: new Date().toISOString() })
    .eq('id', businessId)
}
