/**
 * VoiceFly Stripe Products Configuration
 * 2-tier model: Starter ($49/mo) and Pro ($199/mo)
 */

// Subscription Products - Monthly recurring
export const SUBSCRIPTION_PRODUCTS = {
  starter: {
    name: 'VoiceFly Starter',
    description: '100 voice minutes per month. AI receptionist for salons getting started.',
    price_cents: 4900,
    interval: 'month' as const,
    features: [
      '100 voice minutes/month',
      '1 AI receptionist',
      '24/7 call answering',
      'Appointment booking',
      'Lead capture',
      'Call analytics dashboard',
      'Email support',
      '$0.15/min overage'
    ],
    metadata: {
      tier: 'starter',
      minutes: '100',
      overage_per_minute: '0.15'
    }
  },
  pro: {
    name: 'VoiceFly Pro',
    description: '1,000 voice minutes per month. For busy salons ready to grow.',
    price_cents: 19900,
    interval: 'month' as const,
    features: [
      '1,000 voice minutes/month',
      'Up to 5 AI receptionists',
      '24/7 call answering',
      'Appointment booking',
      'Lead capture',
      'SMS appointment reminders',
      'Custom call scripts',
      'Advanced analytics dashboard',
      'Voice customization',
      'API access',
      'Priority support',
      '$0.12/min overage'
    ],
    metadata: {
      tier: 'pro',
      minutes: '1000',
      overage_per_minute: '0.12'
    }
  }
}

// Environment variable names for Stripe Price IDs
export const STRIPE_PRICE_ENV_KEYS = {
  subscriptions: {
    starter: 'STRIPE_PRICE_STARTER',
    pro: 'STRIPE_PRICE_PRO'
  }
}

/**
 * Get Stripe price ID for a subscription tier
 */
export function getSubscriptionPriceId(tier: keyof typeof SUBSCRIPTION_PRODUCTS): string | undefined {
  const envKey = STRIPE_PRICE_ENV_KEYS.subscriptions[tier]
  return process.env[envKey]
}
