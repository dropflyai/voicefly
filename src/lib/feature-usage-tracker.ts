/**
 * Feature Usage Tracker
 * Monitors feature adoption to trigger targeted activation campaigns
 * Critical for identifying at-risk customers and driving feature adoption
 */

import { createClient } from '@supabase/supabase-js'

// Feature categories and their importance
export const FEATURE_CATEGORIES = {
  CRITICAL: [
    'phone_forwarding', // Most important - without this, no value
    'test_call_made', // Shows engagement
    'ai_assistant_active' // Core value prop
  ],
  VALUE_DRIVERS: [
    'payment_processing', // Reduces no-shows
    'loyalty_program', // Increases retention
    'email_marketing', // Drives repeat business
    'analytics_viewed' // Shows business intelligence usage
  ],
  GROWTH_FEATURES: [
    'multi_location_added',
    'white_label_configured',
    'custom_ai_trained',
    'staff_added',
    'services_customized'
  ],
  ENGAGEMENT_SIGNALS: [
    'dashboard_login',
    'settings_updated',
    'appointment_viewed',
    'report_generated',
    'customer_added'
  ]
} as const

// Feature value scores (for calculating engagement)
export const FEATURE_VALUE_SCORES = {
  phone_forwarding: 100,
  test_call_made: 50,
  ai_assistant_active: 80,
  payment_processing: 70,
  loyalty_program: 60,
  email_marketing: 50,
  analytics_viewed: 40,
  multi_location_added: 90,
  white_label_configured: 80,
  custom_ai_trained: 70,
  staff_added: 30,
  services_customized: 40,
  dashboard_login: 10,
  settings_updated: 20,
  appointment_viewed: 15,
  report_generated: 35,
  customer_added: 25
}

// Risk thresholds by plan tier
export const RISK_THRESHOLDS = {
  starter: {
    high_risk: 50, // Score below 50 = high churn risk
    medium_risk: 100,
    healthy: 150
  },
  professional: {
    high_risk: 150,
    medium_risk: 250,
    healthy: 350
  },
  business: {
    high_risk: 300,
    medium_risk: 450,
    healthy: 600
  }
}

// Time-based multipliers (features used recently are worth more)
export const RECENCY_MULTIPLIERS = {
  today: 2.0,
  this_week: 1.5,
  this_month: 1.0,
  older: 0.5
}

export interface FeatureUsageMetrics {
  businessId: string
  planTier: 'starter' | 'professional' | 'business'
  totalScore: number
  riskLevel: 'high' | 'medium' | 'low' | 'healthy'
  unusedCriticalFeatures: string[]
  unusedValueDrivers: string[]
  lastEngagement: Date
  daysSinceSignup: number
  featureAdoptionRate: number
  recommendedActions: string[]
}

export class FeatureUsageTracker {
  private supabase: any

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }

  /**
   * Track a feature being used
   */
  async trackFeature(businessId: string, feature: string, metadata?: any) {
    try {
      await this.supabase
        .from('feature_usage')
        .insert({
          business_id: businessId,
          feature,
          used_at: new Date().toISOString(),
          metadata
        })

      // Update engagement score in real-time
      await this.updateEngagementScore(businessId)
    } catch (error) {
      console.error('Error tracking feature:', error)
    }
  }

  /**
   * Track bulk features (e.g., after onboarding)
   */
  async trackBulkFeatures(businessId: string, features: string[]) {
    const records = features.map(feature => ({
      business_id: businessId,
      feature,
      used_at: new Date().toISOString()
    }))

    try {
      await this.supabase
        .from('feature_usage')
        .insert(records)
      
      await this.updateEngagementScore(businessId)
    } catch (error) {
      console.error('Error tracking bulk features:', error)
    }
  }

  /**
   * Calculate engagement score for a business
   */
  async calculateEngagementScore(businessId: string): Promise<number> {
    const { data: usageData } = await this.supabase
      .from('feature_usage')
      .select('feature, used_at')
      .eq('business_id', businessId)
      .order('used_at', { ascending: false })

    if (!usageData || usageData.length === 0) return 0

    let totalScore = 0
    const featuresUsed = new Set<string>()

    for (const usage of usageData) {
      // Skip if we've already counted this feature
      if (featuresUsed.has(usage.feature)) continue
      
      featuresUsed.add(usage.feature)

      // Get base score
      const baseScore = FEATURE_VALUE_SCORES[usage.feature as keyof typeof FEATURE_VALUE_SCORES] || 10

      // Apply recency multiplier
      const recency = this.getRecencyMultiplier(new Date(usage.used_at))
      
      totalScore += baseScore * recency
    }

    return Math.round(totalScore)
  }

  /**
   * Get recency multiplier based on when feature was last used
   */
  private getRecencyMultiplier(usedAt: Date): number {
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - usedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 0) return RECENCY_MULTIPLIERS.today
    if (daysSince <= 7) return RECENCY_MULTIPLIERS.this_week
    if (daysSince <= 30) return RECENCY_MULTIPLIERS.this_month
    return RECENCY_MULTIPLIERS.older
  }

  /**
   * Update engagement score in database
   */
  private async updateEngagementScore(businessId: string) {
    const score = await this.calculateEngagementScore(businessId)
    
    await this.supabase
      .from('businesses')
      .update({ engagement_score: score })
      .eq('id', businessId)
  }

  /**
   * Get complete usage metrics for a business
   */
  async getUsageMetrics(businessId: string): Promise<FeatureUsageMetrics> {
    // Get business data
    const { data: business } = await this.supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (!business) throw new Error('Business not found')

    // Get feature usage
    const { data: usageData } = await this.supabase
      .from('feature_usage')
      .select('feature, used_at')
      .eq('business_id', businessId)
      .order('used_at', { ascending: false })

    const usedFeatures = new Set(usageData?.map((u: any) => u.feature) || [])

    // Calculate metrics
    const totalScore = await this.calculateEngagementScore(businessId)
    const riskLevel = this.calculateRiskLevel(totalScore, business.plan_tier)
    const unusedCriticalFeatures = FEATURE_CATEGORIES.CRITICAL.filter(f => !usedFeatures.has(f))
    const unusedValueDrivers = FEATURE_CATEGORIES.VALUE_DRIVERS.filter(f => !usedFeatures.has(f))
    
    const lastUsage = usageData?.[0]?.used_at
    const lastEngagement = lastUsage ? new Date(lastUsage) : new Date(business.created_at)
    
    const daysSinceSignup = Math.floor(
      (new Date().getTime() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate adoption rate
    const totalFeatures = Object.keys(FEATURE_VALUE_SCORES).length
    const featureAdoptionRate = Math.round((usedFeatures.size / totalFeatures) * 100)

    // Generate recommendations
    const recommendedActions = this.generateRecommendations(
      unusedCriticalFeatures,
      unusedValueDrivers,
      business.plan_tier,
      daysSinceSignup
    )

    return {
      businessId,
      planTier: business.plan_tier,
      totalScore,
      riskLevel,
      unusedCriticalFeatures,
      unusedValueDrivers,
      lastEngagement,
      daysSinceSignup,
      featureAdoptionRate,
      recommendedActions
    }
  }

  /**
   * Calculate risk level based on score and tier
   */
  private calculateRiskLevel(score: number, tier: string): 'high' | 'medium' | 'low' | 'healthy' {
    const thresholds = RISK_THRESHOLDS[tier as keyof typeof RISK_THRESHOLDS]
    
    if (score < thresholds.high_risk) return 'high'
    if (score < thresholds.medium_risk) return 'medium'
    if (score < thresholds.healthy) return 'low'
    return 'healthy'
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    unusedCritical: string[],
    unusedValue: string[],
    tier: string,
    daysSinceSignup: number
  ): string[] {
    const recommendations: string[] = []

    // Critical features first
    if (unusedCritical.includes('phone_forwarding')) {
      recommendations.push('🚨 Forward your business phone to start capturing bookings')
    }
    if (unusedCritical.includes('test_call_made')) {
      recommendations.push('📞 Make a test call to experience your AI assistant')
    }

    // Value drivers based on tier
    if (tier !== 'starter') {
      if (unusedValue.includes('payment_processing')) {
        recommendations.push('💳 Enable payment processing to reduce no-shows by 70%')
      }
      if (unusedValue.includes('loyalty_program')) {
        recommendations.push('🎁 Launch loyalty program to increase repeat visits by 35%')
      }
      if (unusedValue.includes('email_marketing')) {
        recommendations.push('📧 Start email campaigns for proven 3x ROI')
      }
    }

    // Time-based recommendations
    if (daysSinceSignup > 14 && recommendations.length > 2) {
      recommendations.unshift('⚠️ You\'re at risk of not seeing full ROI - let\'s fix that')
    }

    return recommendations
  }

  /**
   * Identify at-risk customers for proactive outreach
   */
  async identifyAtRiskCustomers(): Promise<string[]> {
    const { data: businesses } = await this.supabase
      .from('businesses')
      .select('id, plan_tier, created_at, engagement_score')
      .eq('subscription_status', 'active')

    const atRisk: string[] = []

    for (const business of businesses || []) {
      const metrics = await this.getUsageMetrics(business.id)
      
      // High risk if:
      // 1. High risk level
      // 2. Haven't engaged in 7+ days
      // 3. Critical features unused after 14 days
      const daysSinceEngagement = Math.floor(
        (new Date().getTime() - metrics.lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (
        metrics.riskLevel === 'high' ||
        (daysSinceEngagement > 7 && metrics.daysSinceSignup > 7) ||
        (metrics.unusedCriticalFeatures.length > 0 && metrics.daysSinceSignup > 14)
      ) {
        atRisk.push(business.id)
      }
    }

    return atRisk
  }

  /**
   * Generate intervention strategy for at-risk customer
   */
  async generateInterventionStrategy(businessId: string) {
    const metrics = await this.getUsageMetrics(businessId)

    return {
      riskLevel: metrics.riskLevel,
      interventionType: this.determineInterventionType(metrics),
      messages: this.generateInterventionMessages(metrics),
      incentives: this.generateIncentives(metrics),
      escalation: metrics.riskLevel === 'high' ? 'immediate' : 'standard'
    }
  }

  private determineInterventionType(metrics: FeatureUsageMetrics) {
    if (metrics.unusedCriticalFeatures.length > 0) return 'critical_setup'
    if (metrics.featureAdoptionRate < 20) return 'onboarding_assistance'
    if (metrics.riskLevel === 'high') return 'retention_emergency'
    return 'feature_education'
  }

  private generateInterventionMessages(metrics: FeatureUsageMetrics) {
    const messages: string[] = []

    if (metrics.unusedCriticalFeatures.includes('phone_forwarding')) {
      messages.push('Your AI assistant is ready but not receiving calls. Let\'s fix that in 2 minutes.')
    }

    if (metrics.planTier !== 'starter' && metrics.unusedValueDrivers.length > 2) {
      messages.push(`You're paying $${metrics.planTier === 'professional' ? 147 : 297}/month but missing out on $${metrics.planTier === 'professional' ? 2000 : 5000} in potential revenue.`)
    }

    return messages
  }

  private generateIncentives(metrics: FeatureUsageMetrics) {
    const incentives: string[] = []

    if (metrics.riskLevel === 'high') {
      incentives.push('Free setup call with success team')
      incentives.push('30-day money-back guarantee extension')
    }

    if (metrics.unusedCriticalFeatures.length > 0) {
      incentives.push('White-glove setup assistance')
    }

    if (metrics.featureAdoptionRate < 30) {
      incentives.push('1-on-1 training session')
    }

    return incentives
  }
}

// Export singleton instance
export const featureTracker = new FeatureUsageTracker()