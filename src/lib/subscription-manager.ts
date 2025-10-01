/**
 * Subscription Manager
 * Handles plan upgrades, downgrades, trials, and billing
 */

import { supabase } from './supabase'
import { Business } from './supabase-types-mvp'

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  features: string[]
  limits: {
    max_locations: number
    max_bookings_per_month: number
    payment_processors: string[]
    loyalty_program: boolean
    voice_ai: boolean
  }
  popular?: boolean
}

export interface TrialInfo {
  is_trial: boolean
  trial_days_remaining: number
  trial_ends_at?: string
  trial_plan: string
  can_extend: boolean
}

export interface UsageStats {
  current_period_start: string
  current_period_end: string
  bookings_this_month: number
  locations_count: number
  payment_volume: number
  overage_fees: number
}

export interface UpgradeOption {
  plan: SubscriptionPlan
  immediate_benefits: string[]
  upgrade_cost: number
  prorated_amount: number
  next_billing_date: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    price_monthly: 39,
    price_yearly: 390, // 17% off
    features: [
      'Web booking widget',
      'SMS reminders',
      'Customer portal',
      'Smart analytics',
      'Email marketing',
      'Custom themes',
      'Social booking',
      'Smart scheduling',
      '500 bookings/month'
    ],
    limits: {
      max_locations: 1,
      max_bookings_per_month: 500,
      payment_processors: [],
      loyalty_program: false,
      voice_ai: false
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    slug: 'professional',
    price_monthly: 127,
    price_yearly: 1270, // 17% off
    features: [
      'Everything in Starter',
      'Voice AI booking agent',
      'Online payments (Square/Stripe)',
      'Loyalty program',
      'Advanced reporting',
      'Unlimited bookings',
      'Priority support'
    ],
    limits: {
      max_locations: 1,
      max_bookings_per_month: -1,
      payment_processors: ['square', 'stripe'],
      loyalty_program: true,
      voice_ai: true
    },
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    price_monthly: 247,
    price_yearly: 2470, // 17% off
    features: [
      'Everything in Professional',
      'Multi-location (up to 3)',
      'Team management',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support'
    ],
    limits: {
      max_locations: 3,
      max_bookings_per_month: -1,
      payment_processors: ['square', 'stripe'],
      loyalty_program: true,
      voice_ai: true
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price_monthly: 497,
    price_yearly: 4970, // 17% off
    features: [
      'Everything in Business',
      'Unlimited locations',
      'White-label solution',
      'API access',
      'Custom development',
      'Account manager'
    ],
    limits: {
      max_locations: -1,
      max_bookings_per_month: -1,
      payment_processors: ['square', 'stripe'],
      loyalty_program: true,
      voice_ai: true
    }
  }
]

export class SubscriptionManager {
  private businessId: string

  constructor(businessId: string) {
    this.businessId = businessId
  }

  /**
   * Get current subscription details
   */
  async getCurrentSubscription(): Promise<{
    business: Business
    plan: SubscriptionPlan
    trial_info: TrialInfo
    usage_stats: UsageStats
  } | null> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', this.businessId)
        .single()

      if (error || !business) return null

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === business.subscription_tier) || SUBSCRIPTION_PLANS[0]
      
      const trial_info = this.calculateTrialInfo(business)
      const usage_stats = await this.calculateUsageStats(business)

      return {
        business,
        plan,
        trial_info,
        usage_stats
      }
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  }

  /**
   * Get available upgrade options
   */
  async getUpgradeOptions(currentPlanId: string): Promise<UpgradeOption[]> {
    const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === currentPlanId)
    const availablePlans = SUBSCRIPTION_PLANS.slice(currentPlanIndex + 1)
    
    const subscription = await this.getCurrentSubscription()
    if (!subscription) return []

    return availablePlans.map(plan => ({
      plan,
      immediate_benefits: this.calculateImmediateBenefits(subscription.plan, plan),
      upgrade_cost: plan.price_monthly - subscription.plan.price_monthly,
      prorated_amount: this.calculateProration(subscription.plan, plan),
      next_billing_date: this.getNextBillingDate()
    }))
  }

  /**
   * Start a trial for a specific plan
   */
  async startTrial(planId: string, trialDays: number = 14): Promise<{ success: boolean; error?: string }> {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
      if (!plan) {
        return { success: false, error: 'Plan not found' }
      }

      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      const { error } = await supabase
        .from('businesses')
        .update({
          subscription_tier: planId,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.businessId)

      if (error) throw error

      // Log trial start event
      await this.logSubscriptionEvent('trial_started', {
        plan: planId,
        trial_days: trialDays,
        trial_ends_at: trialEndsAt.toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Error starting trial:', error)
      return { success: false, error: 'Failed to start trial' }
    }
  }

  /**
   * Upgrade to a new plan
   */
  async upgradePlan(
    newPlanId: string, 
    billing_cycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId)
      if (!newPlan) {
        return { success: false, error: 'Plan not found' }
      }

      // Calculate pricing
      const price = billing_cycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly

      // Update subscription
      const { error } = await supabase
        .from('businesses')
        .update({
          subscription_tier: newPlanId,
          subscription_status: 'active',
          trial_ends_at: null, // Clear trial if upgrading during trial
          settings: {
            ...((await supabase.from('businesses').select('settings').eq('id', this.businessId).single()).data?.settings || {}),
            billing_cycle,
            monthly_price: price
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', this.businessId)

      if (error) throw error

      // Log upgrade event
      await this.logSubscriptionEvent('plan_upgraded', {
        old_plan: (await this.getCurrentSubscription())?.plan.id,
        new_plan: newPlanId,
        billing_cycle,
        price
      })

      // Send welcome email for new plan features
      await this.sendPlanWelcomeEmail(newPlanId)

      return { success: true }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      return { success: false, error: 'Failed to upgrade plan' }
    }
  }

  /**
   * Cancel subscription (downgrade to free trial or basic)
   */
  async cancelSubscription(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          subscription_tier: 'starter',
          subscription_status: 'cancelled',
          trial_ends_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.businessId)

      if (error) throw error

      // Log cancellation
      await this.logSubscriptionEvent('subscription_cancelled', {
        reason,
        cancelled_at: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, error: 'Failed to cancel subscription' }
    }
  }

  /**
   * Check if business can use a specific feature
   */
  async canUseFeature(feature: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription()
    if (!subscription) return false

    const { plan, trial_info } = subscription

    // During trial, allow all features of trial plan
    if (trial_info.is_trial && trial_info.trial_days_remaining > 0) {
      return true
    }

    // Check plan limits
    switch (feature) {
      case 'voice_ai':
        return plan.limits.voice_ai
      case 'loyalty_program':
        return plan.limits.loyalty_program
      case 'payment_processing':
        return plan.limits.payment_processors.length > 0
      case 'multi_location':
        return plan.limits.max_locations > 1
      default:
        return true
    }
  }

  /**
   * Get usage warnings/alerts
   */
  async getUsageAlerts(): Promise<{
    type: 'warning' | 'limit' | 'overage'
    message: string
    action?: string
  }[]> {
    const subscription = await this.getCurrentSubscription()
    if (!subscription) return []

    const alerts = []
    const { plan, usage_stats, trial_info } = subscription

    // Trial expiration warning
    if (trial_info.is_trial && trial_info.trial_days_remaining <= 3) {
      alerts.push({
        type: 'warning' as const,
        message: `Your ${trial_info.trial_plan} trial expires in ${trial_info.trial_days_remaining} days`,
        action: 'upgrade'
      })
    }

    // Booking limit warnings
    if (plan.limits.max_bookings_per_month > 0) {
      const usage_percent = (usage_stats.bookings_this_month / plan.limits.max_bookings_per_month) * 100

      if (usage_percent >= 100) {
        alerts.push({
          type: 'overage' as const,
          message: `You've exceeded your monthly booking limit (${usage_stats.bookings_this_month}/${plan.limits.max_bookings_per_month})`,
          action: 'upgrade'
        })
      } else if (usage_percent >= 80) {
        alerts.push({
          type: 'warning' as const,
          message: `You're at ${Math.round(usage_percent)}% of your monthly booking limit`,
          action: 'upgrade'
        })
      }
    }

    return alerts
  }

  // Private helper methods
  private calculateTrialInfo(business: Business): TrialInfo {
    const now = new Date()
    const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null

    if (business.subscription_status === 'trialing' && trialEnd && trialEnd > now) {
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        is_trial: true,
        trial_days_remaining: daysRemaining,
        trial_ends_at: business.trial_ends_at,
        trial_plan: business.subscription_tier,
        can_extend: daysRemaining <= 3 // Allow extension in last 3 days
      }
    }

    return {
      is_trial: false,
      trial_days_remaining: 0,
      trial_plan: '',
      can_extend: false
    }
  }

  private async calculateUsageStats(business: Business): Promise<UsageStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    try {
      // Get monthly bookings
      const { count: bookings_count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', this.businessId)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0])
        .lte('appointment_date', endOfMonth.toISOString().split('T')[0])
        .neq('status', 'cancelled')

      // Get location count
      const { count: locations_count } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', this.businessId)
        .eq('is_active', true)

      // Get payment volume
      const { data: payments } = await supabase
        .from('payments')
        .select('total_amount')
        .eq('business_id', this.businessId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .eq('status', 'paid')

      const payment_volume = payments?.reduce((sum, p) => sum + p.total_amount, 0) || 0

      return {
        current_period_start: startOfMonth.toISOString().split('T')[0],
        current_period_end: endOfMonth.toISOString().split('T')[0],
        bookings_this_month: bookings_count || 0,
        locations_count: locations_count || 0,
        payment_volume,
        overage_fees: 0 // Would calculate based on overages
      }
    } catch (error) {
      console.error('Error calculating usage stats:', error)
      return {
        current_period_start: startOfMonth.toISOString().split('T')[0],
        current_period_end: endOfMonth.toISOString().split('T')[0],
        bookings_this_month: 0,
        locations_count: 0,
        payment_volume: 0,
        overage_fees: 0
      }
    }
  }

  private calculateImmediateBenefits(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): string[] {
    const benefits: string[] = []
    
    if (newPlan.limits.voice_ai && !currentPlan.limits.voice_ai) {
      benefits.push('Voice AI booking agent')
    }
    
    if (newPlan.limits.loyalty_program && !currentPlan.limits.loyalty_program) {
      benefits.push('Customer loyalty program')
    }
    
    if (newPlan.limits.payment_processors.length > currentPlan.limits.payment_processors.length) {
      benefits.push('Online payment processing')
    }
    
    if (newPlan.limits.max_locations > currentPlan.limits.max_locations) {
      benefits.push(`Multi-location support (up to ${newPlan.limits.max_locations})`)
    }
    
    if (newPlan.limits.max_bookings_per_month === -1 && currentPlan.limits.max_bookings_per_month > 0) {
      benefits.push('Unlimited monthly bookings')
    }

    return benefits
  }

  private calculateProration(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): number {
    // Simplified proration calculation
    const difference = newPlan.price_monthly - currentPlan.price_monthly
    const daysInMonth = new Date().getDate()
    const daysRemaining = 30 - daysInMonth
    
    return (difference * daysRemaining) / 30
  }

  private getNextBillingDate(): string {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    next.setDate(1)
    return next.toISOString().split('T')[0]
  }

  private async logSubscriptionEvent(event_type: string, event_data: any): Promise<void> {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          business_id: this.businessId,
          event_type,
          event_data,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging subscription event:', error)
    }
  }

  private async sendPlanWelcomeEmail(planId: string): Promise<void> {
    // Would integrate with email service
    console.log(`Sending welcome email for ${planId} plan`)
  }
}