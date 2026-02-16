/**
 * VoiceFly Credit System
 * Manages credits for all platform features with add-on purchase support
 */

import { supabase } from './supabase-client'
import AuditLogger, { AuditEventType } from './audit-logger'

// Credit costs per feature
// 1 voice minute = 5 credits (VOICE_CALL_INBOUND is the baseline)
export enum CreditCost {
  // Voice AI
  VOICE_CALL_INBOUND = 5,    // 1 minute of inbound voice
  VOICE_CALL_OUTBOUND = 8,   // 1.6 minute equivalent (higher cost for outbound)
  AI_CHAT_MESSAGE = 1,

  // Maya Research
  MAYA_DEEP_RESEARCH = 25,   // 5 minute equivalent
  MAYA_QUICK_RESEARCH = 10,  // 2 minute equivalent
  MAYA_MARKET_ANALYSIS = 20, // 4 minute equivalent

  // Core Operations
  APPOINTMENT_BOOKING = 2,
  APPOINTMENT_REMINDER = 1,
  LEAD_ENRICHMENT = 5,

  // Marketing (per 100 contacts)
  EMAIL_CAMPAIGN_PER_100 = 15,
  SMS_CAMPAIGN_PER_100 = 20,

  // Automation
  WORKFLOW_EXECUTION = 3,
  AUTOMATION_TRIGGER = 2,
}

// Credits to minutes conversion (for customer-facing display)
export const CREDITS_PER_MINUTE = 5

// Monthly credit allocations by tier (Hybrid model)
// Customer sees minutes, system uses credits internally
// Conversion: 5 credits = 1 voice minute
export enum MonthlyCredits {
  TRIAL = 50,           // 10 minutes - One-time, doesn't reset
  STARTER = 1000,       // 200 minutes - $97/mo
  GROWTH = 2500,        // 500 minutes - $197/mo
  PRO = 6000,           // 1,200 minutes - $297/mo
  SCALE = 12500,        // 2,500 minutes - $497/mo
}

// Subscription tier pricing in cents
export const TIER_PRICING = {
  trial: { price_cents: 0, name: 'Free Trial' },
  starter: { price_cents: 9700, name: 'Starter' },
  growth: { price_cents: 19700, name: 'Growth' },
  pro: { price_cents: 29700, name: 'Pro' },
  scale: { price_cents: 49700, name: 'Scale' },
} as const

// Minutes included per tier (for customer display)
export const TIER_MINUTES = {
  trial: 10,
  starter: 200,
  growth: 500,
  pro: 1200,
  scale: 2500,
} as const

// Additional minute packs (one-time purchase)
// Presented as minutes to customers, stored as credits internally
export interface MinutePack {
  id: string
  name: string
  minutes: number        // Customer-facing
  credits: number        // Internal (minutes * CREDITS_PER_MINUTE)
  price: number          // In dollars
  savings: number        // Savings vs pay-as-you-go
  pricePerMinute: number // Customer-facing
}

export const MINUTE_PACKS: MinutePack[] = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    minutes: 50,
    credits: 250,         // 50 * 5
    price: 20,
    savings: 0,
    pricePerMinute: 0.40
  },
  {
    id: 'pack_growth',
    name: 'Growth Pack',
    minutes: 150,
    credits: 750,         // 150 * 5
    price: 50,
    savings: 10,
    pricePerMinute: 0.33
  },
  {
    id: 'pack_pro',
    name: 'Pro Pack',
    minutes: 400,
    credits: 2000,        // 400 * 5
    price: 100,
    savings: 60,
    pricePerMinute: 0.25
  },
  {
    id: 'pack_scale',
    name: 'Scale Pack',
    minutes: 1000,
    credits: 5000,        // 1000 * 5
    price: 200,
    savings: 200,
    pricePerMinute: 0.20
  }
]

// Legacy alias for backwards compatibility
export type CreditPack = MinutePack
export const CREDIT_PACKS = MINUTE_PACKS

// Overage pricing by tier (per minute for customer display)
// Internal calculation: overage_per_minute / CREDITS_PER_MINUTE = per_credit_cost
export const OVERAGE_PRICING_PER_MINUTE = {
  trial: 0.50,      // $0.50/min overage
  starter: 0.45,    // $0.45/min overage ($0.09/credit)
  growth: 0.38,     // $0.38/min overage ($0.076/credit)
  pro: 0.28,        // $0.28/min overage ($0.056/credit)
  scale: 0.22,      // $0.22/min overage ($0.044/credit)
} as const

// Internal overage pricing per credit (for actual billing)
export const OVERAGE_PRICING_PER_CREDIT = {
  trial: 0.10,
  starter: 0.09,
  growth: 0.076,
  pro: 0.056,
  scale: 0.044,
} as const

interface CreditBalance {
  monthly_credits: number          // Resets on billing date
  purchased_credits: number        // Never expires, rolls over
  total_credits: number            // Sum of both
  credits_used_this_month: number
  credits_reset_date: string
  // Customer-facing minute equivalents
  monthly_minutes: number
  purchased_minutes: number
  total_minutes: number
  minutes_used_this_month: number
}

interface CreditTransaction {
  business_id: string
  amount: number
  operation: string
  feature: string
  metadata?: any
  balance_after: number
}

export class CreditSystem {
  /**
   * Get current credit balance for a business
   */
  static async getBalance(businessId: string): Promise<CreditBalance | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('monthly_credits, purchased_credits, credits_used_this_month, credits_reset_date, subscription_tier')
        .eq('id', businessId)
        .single()

      if (error || !data) {
        console.error('Failed to get credit balance:', error)
        return null
      }

      const monthly = data.monthly_credits || 0
      const purchased = data.purchased_credits || 0
      const used = data.credits_used_this_month || 0

      return {
        monthly_credits: monthly,
        purchased_credits: purchased,
        total_credits: monthly + purchased,
        credits_used_this_month: used,
        credits_reset_date: data.credits_reset_date,
        // Customer-facing minute equivalents
        monthly_minutes: Math.floor(monthly / CREDITS_PER_MINUTE),
        purchased_minutes: Math.floor(purchased / CREDITS_PER_MINUTE),
        total_minutes: Math.floor((monthly + purchased) / CREDITS_PER_MINUTE),
        minutes_used_this_month: Math.floor(used / CREDITS_PER_MINUTE)
      }
    } catch (error) {
      console.error('Error getting credit balance:', error)
      return null
    }
  }

  /**
   * Check if business has enough credits for an operation
   */
  static async hasCredits(businessId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getBalance(businessId)
    if (!balance) return false

    return balance.total_credits >= requiredCredits
  }

  /**
   * Deduct credits for a feature usage
   * Uses monthly credits first, then purchased credits
   */
  static async deductCredits(
    businessId: string,
    credits: number,
    feature: string,
    metadata?: any
  ): Promise<{ success: boolean; balance: CreditBalance | null; error?: string }> {
    try {
      // Get current balance
      const balance = await this.getBalance(businessId)
      if (!balance) {
        return { success: false, balance: null, error: 'Failed to get balance' }
      }

      // Check if enough credits
      if (balance.total_credits < credits) {
        return {
          success: false,
          balance,
          error: `Insufficient credits. Required: ${credits}, Available: ${balance.total_credits}`
        }
      }

      // Deduct from monthly first, then purchased
      let remainingToDeduct = credits
      let newMonthly = balance.monthly_credits
      let newPurchased = balance.purchased_credits

      if (newMonthly >= remainingToDeduct) {
        // Deduct all from monthly
        newMonthly -= remainingToDeduct
      } else {
        // Deduct what we can from monthly, rest from purchased
        remainingToDeduct -= newMonthly
        newMonthly = 0
        newPurchased -= remainingToDeduct
      }

      // Update database
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          monthly_credits: newMonthly,
          purchased_credits: newPurchased,
          credits_used_this_month: (balance.credits_used_this_month || 0) + credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)

      if (updateError) {
        console.error('Failed to deduct credits:', updateError)
        return { success: false, balance, error: 'Database update failed' }
      }

      // Log transaction
      await this.logTransaction({
        business_id: businessId,
        amount: -credits,
        operation: 'deduct',
        feature,
        metadata,
        balance_after: newMonthly + newPurchased
      })

      // Audit log
      await AuditLogger.log({
        event_type: AuditEventType.CREDIT_DEDUCTED,
        business_id: businessId,
        metadata: {
          credits_deducted: credits,
          feature,
          balance_after: newMonthly + newPurchased
        },
        severity: 'low'
      })

      const totalUsed = balance.credits_used_this_month + credits
      const newBalance: CreditBalance = {
        monthly_credits: newMonthly,
        purchased_credits: newPurchased,
        total_credits: newMonthly + newPurchased,
        credits_used_this_month: totalUsed,
        credits_reset_date: balance.credits_reset_date,
        // Customer-facing minute equivalents
        monthly_minutes: Math.floor(newMonthly / CREDITS_PER_MINUTE),
        purchased_minutes: Math.floor(newPurchased / CREDITS_PER_MINUTE),
        total_minutes: Math.floor((newMonthly + newPurchased) / CREDITS_PER_MINUTE),
        minutes_used_this_month: Math.floor(totalUsed / CREDITS_PER_MINUTE)
      }

      return { success: true, balance: newBalance }
    } catch (error) {
      console.error('Error deducting credits:', error)
      return { success: false, balance: null, error: 'Unexpected error' }
    }
  }

  /**
   * Add purchased credits (from credit pack purchase)
   */
  static async addPurchasedCredits(
    businessId: string,
    credits: number,
    packId: string,
    stripePaymentId?: string
  ): Promise<{ success: boolean; balance: CreditBalance | null }> {
    try {
      const balance = await this.getBalance(businessId)
      if (!balance) {
        return { success: false, balance: null }
      }

      const newPurchased = balance.purchased_credits + credits

      const { error } = await supabase
        .from('businesses')
        .update({
          purchased_credits: newPurchased,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to add purchased credits:', error)
        return { success: false, balance }
      }

      // Log transaction
      await this.logTransaction({
        business_id: businessId,
        amount: credits,
        operation: 'purchase',
        feature: 'credit_pack',
        metadata: { pack_id: packId, stripe_payment_id: stripePaymentId },
        balance_after: balance.monthly_credits + newPurchased
      })

      // Audit log
      await AuditLogger.log({
        event_type: AuditEventType.CREDIT_PURCHASED,
        business_id: businessId,
        metadata: {
          credits_purchased: credits,
          pack_id: packId,
          balance_after: balance.monthly_credits + newPurchased
        },
        severity: 'low'
      })

      return {
        success: true,
        balance: {
          ...balance,
          purchased_credits: newPurchased,
          total_credits: balance.monthly_credits + newPurchased,
          purchased_minutes: Math.floor(newPurchased / CREDITS_PER_MINUTE),
          total_minutes: Math.floor((balance.monthly_credits + newPurchased) / CREDITS_PER_MINUTE)
        }
      }
    } catch (error) {
      console.error('Error adding purchased credits:', error)
      return { success: false, balance: null }
    }
  }

  /**
   * Reset monthly credits (run on billing date)
   */
  static async resetMonthlyCredits(businessId: string): Promise<boolean> {
    try {
      // Get business tier
      const { data: business } = await supabase
        .from('businesses')
        .select('subscription_tier, purchased_credits')
        .eq('id', businessId)
        .single()

      if (!business) return false

      // Determine monthly allocation based on tier
      let monthlyAllocation = MonthlyCredits.STARTER
      switch (business.subscription_tier) {
        case 'trial':
          monthlyAllocation = MonthlyCredits.TRIAL
          break
        case 'starter':
          monthlyAllocation = MonthlyCredits.STARTER
          break
        case 'growth':
          monthlyAllocation = MonthlyCredits.GROWTH
          break
        case 'pro':
          monthlyAllocation = MonthlyCredits.PRO
          break
        case 'scale':
          monthlyAllocation = MonthlyCredits.SCALE
          break
        // Legacy tier support
        case 'professional':
          monthlyAllocation = MonthlyCredits.PRO
          break
        case 'enterprise':
          monthlyAllocation = MonthlyCredits.SCALE
          break
      }

      // Reset monthly credits (purchased credits remain)
      const nextResetDate = new Date()
      nextResetDate.setMonth(nextResetDate.getMonth() + 1)

      const { error } = await supabase
        .from('businesses')
        .update({
          monthly_credits: monthlyAllocation,
          credits_used_this_month: 0,
          credits_reset_date: nextResetDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to reset monthly credits:', error)
        return false
      }

      // Log transaction
      await this.logTransaction({
        business_id: businessId,
        amount: monthlyAllocation,
        operation: 'reset',
        feature: 'monthly_allocation',
        metadata: { tier: business.subscription_tier },
        balance_after: monthlyAllocation + (business.purchased_credits || 0)
      })

      return true
    } catch (error) {
      console.error('Error resetting monthly credits:', error)
      return false
    }
  }

  /**
   * Initialize credits for new business
   */
  static async initializeCredits(
    businessId: string,
    tier: 'trial' | 'starter' | 'growth' | 'pro' | 'scale'
  ): Promise<boolean> {
    try {
      let monthlyAllocation = MonthlyCredits.TRIAL
      switch (tier) {
        case 'starter':
          monthlyAllocation = MonthlyCredits.STARTER
          break
        case 'growth':
          monthlyAllocation = MonthlyCredits.GROWTH
          break
        case 'pro':
          monthlyAllocation = MonthlyCredits.PRO
          break
        case 'scale':
          monthlyAllocation = MonthlyCredits.SCALE
          break
      }

      const resetDate = new Date()
      if (tier !== 'trial') {
        resetDate.setMonth(resetDate.getMonth() + 1)
      } else {
        // Trial credits don't reset
        resetDate.setFullYear(resetDate.getFullYear() + 10)
      }

      const { error } = await supabase
        .from('businesses')
        .update({
          monthly_credits: monthlyAllocation,
          purchased_credits: 0,
          credits_used_this_month: 0,
          credits_reset_date: resetDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)

      if (error) {
        console.error('Failed to initialize credits:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error initializing credits:', error)
      return false
    }
  }

  /**
   * Log credit transaction to history
   */
  private static async logTransaction(transaction: CreditTransaction): Promise<void> {
    try {
      await supabase
        .from('credit_transactions')
        .insert({
          business_id: transaction.business_id,
          amount: transaction.amount,
          operation: transaction.operation,
          feature: transaction.feature,
          metadata: transaction.metadata,
          balance_after: transaction.balance_after,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log credit transaction:', error)
    }
  }

  /**
   * Get credit transaction history
   */
  static async getTransactionHistory(
    businessId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to get transaction history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting transaction history:', error)
      return []
    }
  }

  /**
   * Calculate cost for email/SMS campaigns
   */
  static calculateCampaignCost(recipientCount: number, type: 'email' | 'sms'): number {
    const costPer100 = type === 'email' ? CreditCost.EMAIL_CAMPAIGN_PER_100 : CreditCost.SMS_CAMPAIGN_PER_100
    return Math.ceil(recipientCount / 100) * costPer100
  }

  /**
   * Convert credits to minutes (for customer display)
   */
  static creditsToMinutes(credits: number): number {
    return Math.floor(credits / CREDITS_PER_MINUTE)
  }

  /**
   * Convert minutes to credits (for internal calculations)
   */
  static minutesToCredits(minutes: number): number {
    return minutes * CREDITS_PER_MINUTE
  }

  /**
   * Get tier details for display
   */
  static getTierDetails(tier: string): {
    name: string
    price: number
    minutes: number
    credits: number
    overagePerMinute: number
  } | null {
    const tierKey = tier as keyof typeof TIER_PRICING
    if (!TIER_PRICING[tierKey]) return null

    return {
      name: TIER_PRICING[tierKey].name,
      price: TIER_PRICING[tierKey].price_cents / 100,
      minutes: TIER_MINUTES[tierKey],
      credits: MonthlyCredits[tierKey.toUpperCase() as keyof typeof MonthlyCredits],
      overagePerMinute: OVERAGE_PRICING_PER_MINUTE[tierKey]
    }
  }

  /**
   * Calculate overage cost for exceeded minutes
   */
  static calculateOverageCost(
    tier: string,
    additionalMinutes: number
  ): { credits: number; cost: number } {
    const tierKey = tier as keyof typeof OVERAGE_PRICING_PER_MINUTE
    const ratePerMinute = OVERAGE_PRICING_PER_MINUTE[tierKey] || OVERAGE_PRICING_PER_MINUTE.starter

    return {
      credits: additionalMinutes * CREDITS_PER_MINUTE,
      cost: additionalMinutes * ratePerMinute
    }
  }
}

export default CreditSystem
