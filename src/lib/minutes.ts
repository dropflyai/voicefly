/**
 * VoiceFly Minutes System
 * Simple voice-minutes-only tracking. Only voice calls consume the meter.
 * SMS, bookings, chat, research — all included features, not metered.
 *
 * DB columns (kept as-is to avoid schema migration):
 *   monthly_credits    → stores monthly minutes allocation
 *   purchased_credits  → stores purchased minutes
 *   credits_used_this_month → stores minutes used this month
 *   credits_reset_date → stores reset date
 */

import { supabase } from './supabase-client'

// Minutes included per tier
export const TIER_MINUTES = {
  trial: 10,
  starter: 60,
  growth: 250,
  pro: 750,
} as const

export interface MinutesBalance {
  monthly_minutes: number
  purchased_minutes: number
  minutes_used_this_month: number
  minutes_remaining: number
  total_allocation: number
  reset_date: string | null
}

/**
 * Get current minutes balance for a business
 */
export async function getMinutesBalance(businessId: string): Promise<MinutesBalance | null> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('monthly_credits, purchased_credits, credits_used_this_month, credits_reset_date')
      .eq('id', businessId)
      .single()

    if (error || !data) {
      console.error('Failed to get minutes balance:', error)
      return null
    }

    const monthly = data.monthly_credits || 0
    const purchased = data.purchased_credits || 0
    const used = data.credits_used_this_month || 0

    return {
      monthly_minutes: monthly,
      purchased_minutes: purchased,
      minutes_used_this_month: used,
      minutes_remaining: Math.max(0, monthly + purchased - used),
      total_allocation: monthly + purchased,
      reset_date: data.credits_reset_date,
    }
  } catch (error) {
    console.error('Error getting minutes balance:', error)
    return null
  }
}

/**
 * Check if business has enough minutes
 */
export async function hasMinutes(businessId: string, requiredMinutes: number): Promise<boolean> {
  const balance = await getMinutesBalance(businessId)
  if (!balance) return false
  return balance.minutes_remaining >= requiredMinutes
}

/**
 * Initialize minutes for a new business
 */
export async function initializeMinutes(
  businessId: string,
  tier: 'trial' | 'starter' | 'growth' | 'pro'
): Promise<boolean> {
  const allocation = TIER_MINUTES[tier] || TIER_MINUTES.trial

  const resetDate = new Date()
  if (tier !== 'trial') {
    resetDate.setMonth(resetDate.getMonth() + 1)
  } else {
    resetDate.setFullYear(resetDate.getFullYear() + 10)
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      monthly_credits: allocation,
      purchased_credits: 0,
      credits_used_this_month: 0,
      credits_reset_date: resetDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId)

  if (error) {
    console.error('Failed to initialize minutes:', error)
    return false
  }

  console.log(`[Minutes] Initialized ${allocation} min for business ${businessId} (${tier})`)
  return true
}

/**
 * Deduct minutes after a voice call
 */
export async function deductMinutes(
  businessId: string,
  minutes: number,
  metadata?: { callId?: string; durationSeconds?: number; employeeId?: string }
): Promise<{ success: boolean; balance: MinutesBalance | null; error?: string }> {
  try {
    const balance = await getMinutesBalance(businessId)
    if (!balance) {
      return { success: false, balance: null, error: 'Failed to get balance' }
    }

    if (balance.minutes_remaining < minutes) {
      return {
        success: false,
        balance,
        error: `Insufficient minutes. Required: ${minutes}, Available: ${balance.minutes_remaining}`,
      }
    }

    // Deduct from monthly first, then purchased
    let remaining = minutes
    let newMonthly = balance.monthly_minutes
    let newPurchased = balance.purchased_minutes

    // monthly_credits stores remaining monthly minutes (not total allocation)
    // so we deduct directly
    const usedFromMonthly = Math.min(newMonthly, remaining)
    newMonthly -= usedFromMonthly
    remaining -= usedFromMonthly

    if (remaining > 0) {
      newPurchased -= remaining
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        monthly_credits: newMonthly,
        purchased_credits: newPurchased,
        credits_used_this_month: (balance.minutes_used_this_month || 0) + minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Failed to deduct minutes:', updateError)
      return { success: false, balance, error: 'Database update failed' }
    }

    const newBalance: MinutesBalance = {
      monthly_minutes: newMonthly,
      purchased_minutes: newPurchased,
      minutes_used_this_month: balance.minutes_used_this_month + minutes,
      minutes_remaining: newMonthly + newPurchased,
      total_allocation: balance.total_allocation,
      reset_date: balance.reset_date,
    }

    console.log(`[Minutes] Deducted ${minutes} min for business ${businessId}. Remaining: ${newBalance.minutes_remaining}`)

    return { success: true, balance: newBalance }
  } catch (error) {
    console.error('Error deducting minutes:', error)
    return { success: false, balance: null, error: 'Internal error' }
  }
}
