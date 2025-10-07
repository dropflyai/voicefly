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
   * Check customer limit
   */
  static checkCustomerLimit(
    tier: SubscriptionTier,
    currentCount: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier] as any
    const maxCustomers = limits.max_customers

    if (maxCustomers && maxCustomers > 0 && currentCount >= maxCustomers) {
      return {
        hasAccess: false,
        reason: `You've reached your limit of ${maxCustomers} customers`,
        upgradeRequired: tier === 'starter' ? 'professional' : 'enterprise'
      }
    }

    return { hasAccess: true }
  }

  /**
   * Check user seat limit
   */
  static checkUserSeatLimit(
    tier: SubscriptionTier,
    currentSeats: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier] as any
    const maxSeats = limits.max_user_seats

    if (maxSeats && maxSeats > 0 && currentSeats >= maxSeats) {
      return {
        hasAccess: false,
        reason: `You've reached your limit of ${maxSeats} user seats`,
        upgradeRequired: tier === 'starter' ? 'professional' : 'enterprise'
      }
    }

    return { hasAccess: true }
  }

  /**
   * Get add-on pricing for seats and locations
   */
  static getAddOnPricing(tier: SubscriptionTier): {
    seatPrice: number
    locationPrice: number
  } {
    const limits = PLAN_TIER_LIMITS[tier] as any
    return {
      seatPrice: limits.additional_seat_price || 0,
      locationPrice: limits.additional_location_price || 0
    }
  }

  /**
   * Check service limit
   */
  static checkServiceLimit(
    tier: SubscriptionTier,
    currentCount: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier] as any
    const maxServices = limits.max_services

    if (maxServices && maxServices > 0 && currentCount >= maxServices) {
      return {
        hasAccess: false,
        reason: `You've reached your limit of ${maxServices} services`,
        upgradeRequired: tier === 'starter' ? 'professional' : tier === 'professional' ? 'business' : 'enterprise'
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
   * Check AI minutes limit
   */
  static checkAIMinutesLimit(
    tier: SubscriptionTier,
    currentMinutes: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier] as any
    const maxMinutes = limits.max_ai_minutes

    if (maxMinutes && maxMinutes > 0 && currentMinutes >= maxMinutes) {
      return {
        hasAccess: false,
        reason: `You've used ${currentMinutes} of ${maxMinutes} AI call minutes this month`,
        upgradeRequired: 'professional'
      }
    }

    return { hasAccess: true }
  }

  /**
   * Check SMS limit
   */
  static checkSMSLimit(
    tier: SubscriptionTier,
    currentCount: number
  ): FeatureAccessResult {
    const limits = PLAN_TIER_LIMITS[tier] as any
    const maxSMS = limits.max_sms

    if (maxSMS && maxSMS > 0 && currentCount >= maxSMS) {
      return {
        hasAccess: false,
        reason: `You've sent ${currentCount} of ${maxSMS} SMS messages this month`,
        upgradeRequired: 'professional'
      }
    }

    return { hasAccess: true }
  }

  /**
   * Get upgrade benefits when moving from one tier to another
   */
  static getUpgradeBenefits(currentTier: SubscriptionTier, targetTier: SubscriptionTier): string[] {
    const benefits: string[] = []

    if (currentTier === 'starter' && targetTier === 'professional') {
      benefits.push(
        '🚀 500 AI call minutes/month (vs 60)',
        '📅 500 appointments/month (vs 25)',
        '💬 1,000 SMS messages/month (vs 50)',
        '👥 3 user seats (vs 1 solo user)',
        '📊 Full analytics dashboard - Track ROI and revenue',
        '🔔 Automated reminders - Reduce no-shows by 30%',
        '💳 Payment processing - Accept Stripe/Square',
        '📧 Marketing campaigns - Email & SMS automation',
        '🎨 Custom branding - Logo, colors',
        '⭐ Loyalty program - Increase retention 40%',
        '➕ Add locations at $50/mo each',
        '➕ Add team members at $25/mo per seat'
      )
    } else if (currentTier === 'professional' && targetTier === 'enterprise') {
      benefits.push(
        '🚀 2,000 AI minutes/month (vs 500)',
        '📅 2,000 appointments/month (vs 500)',
        '💬 5,000 SMS/month (vs 1,000)',
        '🏢 5 locations included (vs 1)',
        '👥 10 user seats included (vs 3)',
        '🤖 CUSTOM AI assistant - Unique personality (Enterprise exclusive)',
        '🏷️ White-label branding - Remove VoiceFly branding (Enterprise exclusive)',
        '🔌 API access - Custom integrations (Enterprise exclusive)',
        '📈 Multi-location analytics - Cross-location insights (Enterprise exclusive)',
        '👨‍💼 Dedicated account manager',
        '⚡ Priority support with SLA guarantee',
        '🛠️ Custom integrations and development',
        '➕ Add locations at $75/mo each (vs $50)',
        '➕ Add seats at $40/mo each (vs $25)'
      )
    } else if (targetTier === 'enterprise') {
      benefits.push(
        '2,000 AI minutes/month',
        '5 locations included',
        '10 user seats included',
        'CUSTOM AI assistant (Enterprise exclusive)',
        'White-label branding (Enterprise exclusive)',
        'API access (Enterprise exclusive)',
        'Multi-location analytics',
        'Dedicated account manager',
        'SLA guarantee',
        'Priority support'
      )
    }

    return benefits
  }
}