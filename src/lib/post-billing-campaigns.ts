/**
 * Post-Billing Activation Campaigns
 * Psychology-driven feature unlock campaigns that activate after billing
 * Uses "already paid for it" motivation to drive feature adoption
 */

import { createClient } from '@supabase/supabase-js'

// Campaign timing after billing starts
export const CAMPAIGN_SCHEDULE = {
  DAY_1: 'billing_activated',
  DAY_3: 'early_adoption',
  DAY_7: 'feature_discovery',
  DAY_14: 'value_maximization',
  DAY_21: 'retention_check',
  DAY_30: 'full_utilization'
} as const

// Psychology triggers for each tier
export const PSYCHOLOGY_TRIGGERS = {
  starter: {
    primary: 'You\'re now getting 24/7 AI booking coverage',
    secondary: 'Every missed call is now a potential booking',
    motivation: 'Your AI is already taking calls - make sure it\'s working perfectly for you'
  },
  professional: {
    primary: 'Your advanced features are now unlocked',
    secondary: 'Analytics, loyalty programs, and payment processing are waiting',
    motivation: 'You\'re paying for premium features - let\'s activate them to boost revenue'
  },
  business: {
    primary: 'Your enterprise system is fully activated',
    secondary: 'Custom AI, multi-location support, and white-label options are ready',
    motivation: 'Your investment in growth is active - let\'s scale your business'
  }
}

// Feature activation campaigns by tier
export interface ActivationCampaign {
  id: string
  tier: 'starter' | 'professional' | 'business'
  day: number
  subject: string
  preheader: string
  psychologyTrigger: string
  features: string[]
  cta: string
  urgency?: string
  roi?: string
}

export const ACTIVATION_CAMPAIGNS: ActivationCampaign[] = [
  // STARTER TIER CAMPAIGNS
  {
    id: 'starter-day-1',
    tier: 'starter',
    day: 1,
    subject: '🎉 Your AI Assistant is Now Active!',
    preheader: 'Start getting bookings while you sleep',
    psychologyTrigger: 'Your investment is already working for you 24/7',
    features: [
      'AI answering all calls professionally',
      'Automatic appointment scheduling',
      'SMS confirmations to customers',
      'No more missed opportunities'
    ],
    cta: 'Test Your AI Assistant Now',
    urgency: 'Most successful businesses forward their number in the first week',
    roi: 'Average business sees 35% more bookings in first month'
  },
  {
    id: 'starter-day-3',
    tier: 'starter',
    day: 3,
    subject: '📞 Have You Tested Your AI Yet?',
    preheader: 'Your dedicated number is waiting for calls',
    psychologyTrigger: 'You\'re paying for an AI that could be booking appointments right now',
    features: [
      'Make a test call to see how professional it sounds',
      'Share the number with friends for feedback',
      'Fine-tune your services and hours',
      'Get comfortable before forwarding your main line'
    ],
    cta: 'Make Your First Test Call',
    urgency: '73% of businesses that test early stay longer',
  },
  {
    id: 'starter-day-7',
    tier: 'starter',
    day: 7,
    subject: '🚀 Ready to Forward Your Business Number?',
    preheader: 'You\'ve been paying for a week - time to go live',
    psychologyTrigger: 'You\'ve invested in 24/7 coverage - don\'t leave it unused',
    features: [
      'Simple 2-minute forwarding setup',
      'Instant rollback if needed',
      'Keep your existing number',
      'Start capturing after-hours bookings'
    ],
    cta: 'Forward Your Number Now',
    urgency: 'Businesses that forward by day 7 see 2x better results',
    roi: 'Every day without forwarding = lost bookings'
  },
  {
    id: 'starter-day-14',
    tier: 'starter',
    day: 14,
    subject: '💰 You\'re Losing Money Every Day',
    preheader: 'Missed calls = missed revenue',
    psychologyTrigger: 'You\'re paying $67/month but missing 40% of potential bookings',
    features: [
      'Average business misses 15 calls per week',
      'That\'s $750 in lost revenue monthly',
      'Your AI could be capturing these NOW',
      'Full refund if not satisfied'
    ],
    cta: 'Activate Full Potential',
    urgency: 'Day 14 is the #1 cancellation point - don\'t give up now',
    roi: 'ROI break-even: just 2 extra bookings per month'
  },

  // PROFESSIONAL TIER CAMPAIGNS
  {
    id: 'professional-day-1',
    tier: 'professional',
    day: 1,
    subject: '🎯 Your Professional Features Are Unlocked!',
    preheader: '$147/month of premium tools now active',
    psychologyTrigger: 'You\'re investing in growth - these features will 3x your ROI',
    features: [
      'Advanced analytics dashboard ready',
      'Payment processing can start today',
      'Loyalty program attracts repeat customers',
      'Email marketing campaigns available',
      'Custom branding throughout'
    ],
    cta: 'Explore Professional Features',
    roi: 'Professional users see 45% revenue increase in 60 days'
  },
  {
    id: 'professional-day-3',
    tier: 'professional',
    day: 3,
    subject: '💳 Activate Payment Processing = Instant Revenue',
    preheader: 'Get paid automatically when customers book',
    psychologyTrigger: 'You\'re already paying for payment processing - turn it on!',
    features: [
      'Reduce no-shows by 70% with upfront payment',
      'Automatic payment collection',
      'Instant deposits to your account',
      'Professional checkout experience'
    ],
    cta: 'Setup Payment Processing',
    urgency: 'Every booking without payment = potential no-show',
    roi: '$2,400 average additional revenue from reduced no-shows'
  },
  {
    id: 'professional-day-7',
    tier: 'professional',
    day: 7,
    subject: '🎁 Your Loyalty Program is Waiting',
    preheader: 'Turn one-time customers into regulars',
    psychologyTrigger: 'You paid for customer retention tools - activate them!',
    features: [
      'Automatic points on every purchase',
      '4-tier reward system ready',
      'Increases visit frequency by 35%',
      'Builds customer database'
    ],
    cta: 'Launch Loyalty Program',
    roi: 'Loyalty members spend 2.5x more annually'
  },
  {
    id: 'professional-day-14',
    tier: 'professional',
    day: 14,
    subject: '📊 Your Analytics Show Hidden Opportunities',
    preheader: 'Data-driven insights waiting in your dashboard',
    psychologyTrigger: 'You invested in business intelligence - use it to grow',
    features: [
      'Peak hours analysis for staffing',
      'Most profitable services identified',
      'Customer retention insights',
      'Revenue optimization recommendations'
    ],
    cta: 'View Your Analytics',
    urgency: 'Businesses using analytics grow 3x faster'
  },

  // BUSINESS TIER CAMPAIGNS
  {
    id: 'business-day-1',
    tier: 'business',
    day: 1,
    subject: '🏢 Your Enterprise System is Fully Activated',
    preheader: 'Custom AI, multi-location support, everything ready',
    psychologyTrigger: 'You made an enterprise investment - time for enterprise growth',
    features: [
      'Custom AI trained for your business',
      'Multi-location management ready',
      'White-label options available',
      'Advanced reporting unlocked',
      'Priority support activated'
    ],
    cta: 'Access Enterprise Dashboard',
    roi: 'Business tier users average 5x ROI in 90 days'
  },
  {
    id: 'business-day-3',
    tier: 'business',
    day: 3,
    subject: '🌟 Your Custom AI is Learning Your Business',
    preheader: 'Personalized responses for your brand',
    psychologyTrigger: 'You paid for a custom AI - make it perfect for your business',
    features: [
      'AI uses your exact service names',
      'Knows your pricing and policies',
      'Handles complex multi-service bookings',
      'Upsells your premium services'
    ],
    cta: 'Test Custom AI Experience'
  },
  {
    id: 'business-day-7',
    tier: 'business',
    day: 7,
    subject: '📍 Ready to Add Your Other Locations?',
    preheader: 'Scale your success across all locations',
    psychologyTrigger: 'You have 3 locations included - use them all!',
    features: [
      'Centralized management dashboard',
      'Location-specific phone numbers',
      'Cross-location analytics',
      'Unified customer database'
    ],
    cta: 'Add Second Location',
    urgency: 'Multi-location setup takes just 10 minutes per location'
  },
  {
    id: 'business-day-30',
    tier: 'business',
    day: 30,
    subject: '🚀 Your First Month Results & Optimization',
    preheader: 'Enterprise insights and growth opportunities',
    psychologyTrigger: 'Your $297 investment delivered - here\'s how to 10x it',
    features: [
      'Custom performance report',
      'Optimization recommendations',
      'Expansion opportunities identified',
      'White-label revenue potential'
    ],
    cta: 'View Executive Report',
    roi: 'Average Business tier: $8,900 additional revenue month 1'
  }
]

// Cancellation prevention campaigns
export interface CancellationPreventionCampaign {
  id: string
  tier: string
  trigger: 'unused_features' | 'low_engagement' | 'payment_failed' | 'competitor_research'
  subject: string
  psychologyTrigger: string
  unusedFeatures?: string[]
  savings?: string
  alternativeAction: string
}

export const CANCELLATION_PREVENTION: CancellationPreventionCampaign[] = [
  {
    id: 'unused-features-starter',
    tier: 'starter',
    trigger: 'unused_features',
    subject: '⚠️ You\'re paying for features you\'re not using',
    psychologyTrigger: 'You\'re wasting $67/month on unused potential',
    unusedFeatures: [
      'Phone forwarding not activated',
      'AI assistant sitting idle',
      'Zero bookings captured'
    ],
    savings: '$800+ in missed bookings this month',
    alternativeAction: 'Pause billing while we help you set up'
  },
  {
    id: 'unused-features-professional',
    tier: 'professional',
    trigger: 'unused_features',
    subject: '💸 You\'re leaving money on the table',
    psychologyTrigger: 'You invested $147/month but haven\'t activated key features',
    unusedFeatures: [
      'Payment processing (worth $200+/month)',
      'Loyalty program (35% retention boost)',
      'Email marketing (proven 3x ROI)',
      'Analytics insights unused'
    ],
    savings: 'Could be earning $2000+ more monthly',
    alternativeAction: 'Free setup call to activate everything'
  },
  {
    id: 'low-engagement-all',
    tier: 'all',
    trigger: 'low_engagement',
    subject: '🤝 Let us help you succeed',
    psychologyTrigger: 'Your investment isn\'t delivering yet - we can fix that',
    alternativeAction: 'Free consultation to maximize your ROI'
  },
  {
    id: 'competitor-research',
    tier: 'all',
    trigger: 'competitor_research',
    subject: '🎯 Why we\'re different (and better)',
    psychologyTrigger: 'You already learned our system - switching means starting over',
    savings: 'Competitors charge 2x more for half the features',
    alternativeAction: 'Match any competitor price for 3 months'
  }
]

// ROI calculator for each tier
export function calculateROI(tier: string, daysActive: number, featuresUsed: string[]) {
  const baseROI = {
    starter: {
      costPerMonth: 67,
      valuePerBooking: 55,
      bookingsNeeded: 2,
      averageIncrease: '15 bookings/month'
    },
    professional: {
      costPerMonth: 147,
      valuePerBooking: 55,
      bookingsNeeded: 3,
      averageIncrease: '25 bookings/month',
      additionalRevenue: {
        paymentProcessing: 200,
        loyaltyProgram: 350,
        emailMarketing: 180
      }
    },
    business: {
      costPerMonth: 297,
      valuePerBooking: 55,
      bookingsNeeded: 6,
      averageIncrease: '45 bookings/month',
      additionalRevenue: {
        multiLocation: 1500,
        customAI: 500,
        whiteLabel: 2000
      }
    }
  }

  return baseROI[tier as keyof typeof baseROI]
}

// Email template builder
export function buildActivationEmail(campaign: ActivationCampaign, businessName: string) {
  return {
    subject: campaign.subject,
    preheader: campaign.preheader,
    body: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">
          ${campaign.subject}
        </h1>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 18px; margin: 0; font-weight: 600;">
            ${campaign.psychologyTrigger}
          </p>
        </div>

        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0;">What's Available Now:</h3>
          <ul style="color: #4a5568; line-height: 1.8;">
            ${campaign.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        ${campaign.roi ? `
          <div style="background: #c6f6d5; border: 2px solid #9ae6b4; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #22543d; margin: 0; font-weight: 600;">
              💰 ${campaign.roi}
            </p>
          </div>
        ` : ''}

        ${campaign.urgency ? `
          <div style="background: #fed7d7; border: 2px solid #fc8181; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #742a2a; margin: 0; font-weight: 600;">
              ⏰ ${campaign.urgency}
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://dashboard.example.com/activate" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            ${campaign.cta}
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 32px;">
          <p style="color: #718096; font-size: 14px;">
            You\'re receiving this because your ${businessName} subscription is now active. 
            Need help? Reply to this email or call our success team.
          </p>
        </div>
      </div>
    `
  }
}

// Dashboard notification builder
export function buildDashboardNotification(campaign: ActivationCampaign) {
  return {
    id: `notification-${campaign.id}`,
    type: 'activation',
    priority: campaign.day <= 7 ? 'high' : 'medium',
    title: campaign.subject.replace(/[🎉🎯💰📊🚀]/g, '').trim(),
    message: campaign.psychologyTrigger,
    cta: {
      text: campaign.cta,
      action: `activate-${campaign.features[0].toLowerCase().replace(/\s+/g, '-')}`
    },
    dismissible: false,
    expiresAt: campaign.day + 7 // Show for a week
  }
}

// Track feature usage for targeted campaigns
export async function trackFeatureUsage(businessId: string, feature: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  await supabase
    .from('feature_usage')
    .insert({
      business_id: businessId,
      feature,
      used_at: new Date().toISOString()
    })
}

// Determine which campaigns to send
export async function getActiveCampaigns(businessId: string, tier: string, billingStartDate: Date) {
  const daysSinceBilling = Math.floor((Date.now() - billingStartDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const campaigns = ACTIVATION_CAMPAIGNS.filter(c => 
    c.tier === tier && c.day === daysSinceBilling
  )

  // Check for unused features to trigger prevention campaigns
  const unusedFeatures = await checkUnusedFeatures(businessId)
  if (unusedFeatures.length > 3) {
    const preventionCampaign = CANCELLATION_PREVENTION.find(c => 
      c.tier === tier && c.trigger === 'unused_features'
    )
    if (preventionCampaign) {
      campaigns.push(convertPreventionToCampaign(preventionCampaign))
    }
  }

  return campaigns
}

// Check which features haven't been used
async function checkUnusedFeatures(businessId: string): Promise<string[]> {
  // This would check actual feature usage in production
  const allFeatures = [
    'phone_forwarding',
    'payment_processing',
    'loyalty_program',
    'email_marketing',
    'analytics_viewed',
    'multi_location',
    'white_label'
  ]

  // Mock implementation - in production, query actual usage
  const usedFeatures = ['analytics_viewed'] // Example
  
  return allFeatures.filter(f => !usedFeatures.includes(f))
}

// Convert prevention campaign to activation campaign format
function convertPreventionToCampaign(prevention: CancellationPreventionCampaign): ActivationCampaign {
  return {
    id: prevention.id,
    tier: prevention.tier as any,
    day: 0, // Immediate
    subject: prevention.subject,
    preheader: 'Important account update',
    psychologyTrigger: prevention.psychologyTrigger,
    features: prevention.unusedFeatures || [],
    cta: 'Get Help Now',
    urgency: prevention.savings,
    roi: prevention.alternativeAction
  }
}

// Main campaign orchestrator
export async function runPostBillingCampaigns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Get all businesses that have started billing
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .not('billing_start_date', 'is', null)
    .eq('subscription_status', 'active')

  if (!businesses) return

  for (const business of businesses) {
    const campaigns = await getActiveCampaigns(
      business.id,
      business.plan_tier,
      new Date(business.billing_start_date)
    )

    for (const campaign of campaigns) {
      // Send email campaign
      const email = buildActivationEmail(campaign, business.name)
      // await sendEmail(business.email, email) // Implement with your email service

      // Create dashboard notification
      const notification = buildDashboardNotification(campaign)
      await supabase
        .from('dashboard_notifications')
        .insert({
          business_id: business.id,
          ...notification
        })
    }
  }
}

export default {
  ACTIVATION_CAMPAIGNS,
  CANCELLATION_PREVENTION,
  PSYCHOLOGY_TRIGGERS,
  calculateROI,
  buildActivationEmail,
  buildDashboardNotification,
  runPostBillingCampaigns
}