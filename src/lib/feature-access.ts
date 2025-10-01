/**
 * Feature Access Control
 * Determines what features are available based on subscription tier
 */

import { PLAN_TIER_LIMITS } from './supabase'

export type SubscriptionTier = 'starter' | 'professional' | 'business' | 'enterprise'

interface FeatureAccessResult {
  hasAccess: boolean
  reason?: string
  upgradeRequired?: SubscriptionTier
}

export class FeatureAccess {
  /**
   * Check if a specific feature is available for the given tier
   */
  static checkAccess(
    tier: SubscriptionTier,
    feature: string
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier]
    
    if (!limits) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription tier'
      }
    }

    // Check specific features
    switch (feature) {
      case 'analytics':
        return {
          hasAccess: limits.analytics_dashboard ?? false,
          reason: !limits.analytics_dashboard ? 'Analytics dashboard not available in your plan' : undefined,
          upgradeRequired: !limits.analytics_dashboard ? 'professional' : undefined
        }
      
      case 'marketing':
        return {
          hasAccess: limits.marketing_campaigns ?? false,
          reason: !limits.marketing_campaigns ? 'Marketing campaigns not available in your plan' : undefined,
          upgradeRequired: !limits.marketing_campaigns ? 'professional' : undefined
        }
      
      case 'branding':
        return {
          hasAccess: limits.custom_branding ?? false,
          reason: !limits.custom_branding ? 'Custom branding not available in your plan' : undefined,
          upgradeRequired: !limits.custom_branding ? 'professional' : undefined
        }
      
      case 'loyalty':
        return {
          hasAccess: limits.loyalty_program,
          reason: !limits.loyalty_program ? 'Loyalty program not available in your plan' : undefined,
          upgradeRequired: !limits.loyalty_program ? 'professional' : undefined
        }
      
      case 'payments':
        return {
          hasAccess: limits.payment_processors.length > 0,
          reason: limits.payment_processors.length === 0 ? 'Payment processing not available in your plan' : undefined,
          upgradeRequired: limits.payment_processors.length === 0 ? 'professional' : undefined
        }
      
      case 'multi_location':
        return {
          hasAccess: limits.max_locations > 1,
          reason: limits.max_locations <= 1 ? 'Multi-location not available in your plan' : undefined,
          upgradeRequired: limits.max_locations <= 1 ? 'business' : undefined
        }
      
      case 'white_label':
        return {
          hasAccess: (limits as any).white_label ?? false,
          reason: !(limits as any).white_label ? 'White-label not available in your plan' : undefined,
          upgradeRequired: !(limits as any).white_label ? 'business' : undefined
        }
      
      case 'custom_ai':
        return {
          hasAccess: (limits as any).voice_ai_type === 'custom',
          reason: (limits as any).voice_ai_type !== 'custom' ? 'Custom AI assistant not available in your plan' : undefined,
          upgradeRequired: (limits as any).voice_ai_type !== 'custom' ? 'business' : undefined
        }
      
      case 'api_access':
        return {
          hasAccess: (limits as any).api_access ?? false,
          reason: !(limits as any).api_access ? 'API access not available in your plan' : undefined,
          upgradeRequired: !(limits as any).api_access ? 'business' : undefined
        }
      
      case 'automated_reminders':
        return {
          hasAccess: (limits as any).automated_reminders ?? false,
          reason: !(limits as any).automated_reminders ? 'Automated reminders not available in your plan' : undefined,
          upgradeRequired: !(limits as any).automated_reminders ? 'professional' : undefined
        }
      
      default:
        return { hasAccess: true }
    }
  }

  /**
   * Check appointment limit for starter tier
   */
  static checkAppointmentLimit(
    tier: SubscriptionTier,
    currentCount: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier]
    const maxAppointments = (limits as any).max_appointments
    
    if (maxAppointments && maxAppointments > 0 && currentCount >= maxAppointments) {
      return {
        hasAccess: false,
        reason: `You've reached your monthly limit of ${maxAppointments} appointments`,
        upgradeRequired: 'professional'
      }
    }
    
    return { hasAccess: true }
  }

  /**
   * Check location limit
   */
  static checkLocationLimit(
    tier: SubscriptionTier,
    currentCount: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier]
    
    if (limits.max_locations > 0 && currentCount >= limits.max_locations) {
      return {
        hasAccess: false,
        reason: `You've reached your limit of ${limits.max_locations} location(s)`,
        upgradeRequired: tier === 'starter' || tier === 'professional' ? 'business' : 'enterprise'
      }
    }
    
    return { hasAccess: true }
  }

  /**
   * Get list of available features for a tier
   */
  static getAvailableFeatures(tier: SubscriptionTier): string[] {
    const features: string[] = ['appointments', 'customers', 'services', 'calendar']
    const limits = PLAN_TIER_LIMITS[tier]
    
    if (limits.analytics_dashboard) features.push('analytics')
    if (limits.marketing_campaigns) features.push('marketing')
    if (limits.custom_branding) features.push('branding')
    if (limits.loyalty_program) features.push('loyalty')
    if (limits.payment_processors.length > 0) features.push('payments')
    if (limits.max_locations > 1) features.push('locations')
    if ((limits as any).white_label) features.push('white_label')
    if ((limits as any).api_access) features.push('api')
    if ((limits as any).automated_reminders) features.push('reminders')
    
    return features
  }

  /**
   * Get upgrade benefits when moving from one tier to another
   */
  static getUpgradeBenefits(currentTier: SubscriptionTier, targetTier: SubscriptionTier): string[] {
    const benefits: string[] = []
    
    if (currentTier === 'starter' && targetTier === 'professional') {
      benefits.push(
        'Unlimited appointments (no 200/month limit)',
        'Full analytics dashboard to track performance',
        'Automated 24-hour reminders (reduce no-shows by 30%)',
        'Loyalty points program (increase retention by 40%)',
        'Email & SMS marketing campaigns',
        'Custom branding with logo and colors',
        'Payment processing with Square/Stripe'
      )
    } else if (currentTier === 'professional' && targetTier === 'business') {
      benefits.push(
        'CUSTOM AI assistant with unique personality',
        'Support for up to 3 locations',
        'White-label options for your brand',
        'Cross-location analytics and reporting',
        'API access for custom integrations',
        'Priority support response',
        'Custom domain support'
      )
    } else if (targetTier === 'enterprise') {
      benefits.push(
        'Unlimited locations',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Quarterly business reviews'
      )
    }
    
    return benefits
  }
}