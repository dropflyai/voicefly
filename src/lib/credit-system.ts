/**
 * VoiceFly Credit System
 * Manages credits for all platform features with add-on purchase support
 */

import { supabase } from './supabase-client'
import AuditLogger, { AuditEventType } from './audit-logger'

// Credit costs per feature
export enum CreditCost {
  // Voice AI
  VOICE_CALL_INBOUND = 5,
  VOICE_CALL_OUTBOUND = 8,
  AI_CHAT_MESSAGE = 1,

  // Maya Research
  MAYA_DEEP_RESEARCH = 25,
  MAYA_QUICK_RESEARCH = 10,
  MAYA_MARKET_ANALYSIS = 20,

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

// Monthly credit allocations by tier
export enum MonthlyCredits {
  TRIAL = 50,           // One-time, doesn't reset
  STARTER = 500,        // $147/mo
  PROFESSIONAL = 2000,  // $397/mo
  ENTERPRISE = 10000,   // $997/mo
}

// Additional credit packs (one-time purchase)
export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  savings: number
  pricePerCredit: number
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_small',
    name: 'Small Pack',
    credits: 100,
    price: 15,
    savings: 0,
    pricePerCredit: 0.15
  },
  {
    id: 'pack_medium',
    name: 'Medium Pack',
    credits: 500,
    price: 60,
    savings: 15,
    pricePerCredit: 0.12
  },
  {
    id: 'pack_large',
    name: 'Large Pack',
    credits: 1000,
    price: 100,
    savings: 50,
    pricePerCredit: 0.10
  },
  {
    id: 'pack_enterprise',
    name: 'Enterprise Pack',
    credits: 5000,
    price: 400,
    savings: 150,
    pricePerCredit: 0.08
  }
]

// Overage pricing by tier (per credit)
export const OVERAGE_PRICING = {
  STARTER: 0.10,
  PROFESSIONAL: 0.08,
  ENTERPRISE: 0.05
}

interface CreditBalance {
  monthly_credits: number          // Resets on billing date
  purchased_credits: number        // Never expires, rolls over
  total_credits: number            // Sum of both
  credits_used_this_month: number
  credits_reset_date: string
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

      return {
        monthly_credits: monthly,
        purchased_credits: purchased,
        total_credits: monthly + purchased,
        credits_used_this_month: data.credits_used_this_month || 0,
        credits_reset_date: data.credits_reset_date
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

      const newBalance: CreditBalance = {
        monthly_credits: newMonthly,
        purchased_credits: newPurchased,
        total_credits: newMonthly + newPurchased,
        credits_used_this_month: balance.credits_used_this_month + credits,
        credits_reset_date: balance.credits_reset_date
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
          total_credits: balance.monthly_credits + newPurchased
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
        case 'professional':
          monthlyAllocation = MonthlyCredits.PROFESSIONAL
          break
        case 'enterprise':
          monthlyAllocation = MonthlyCredits.ENTERPRISE
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
    tier: 'trial' | 'starter' | 'professional' | 'enterprise'
  ): Promise<boolean> {
    try {
      let monthlyAllocation = MonthlyCredits.TRIAL
      switch (tier) {
        case 'starter':
          monthlyAllocation = MonthlyCredits.STARTER
          break
        case 'professional':
          monthlyAllocation = MonthlyCredits.PROFESSIONAL
          break
        case 'enterprise':
          monthlyAllocation = MonthlyCredits.ENTERPRISE
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
}

// Convenience exports for named imports
export const hasEnoughCredits = CreditSystem.hasCredits
export const deductCredits = CreditSystem.deductCredits

export default CreditSystem
