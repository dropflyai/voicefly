/**
 * VoiceFly Stripe Products Configuration
 * 3-tier model: Starter ($49/mo), Growth ($129/mo), Pro ($249/mo)
 */

// Subscription Products - Monthly recurring
export const SUBSCRIPTION_PRODUCTS = {
  starter: {
    name: 'VoiceFly Starter',
    description: '60 voice minutes per month. Your AI employee answers calls 24/7.',
    price_cents: 4900,
    interval: 'month' as const,
    features: [
      '60 voice minutes/month',
      '1 AI employee',
      '24/7 call answering',
      'Appointment booking',
      'Lead capture',
      'SMS confirmations',
      'Call analytics dashboard',
      'Email support',
      '$0.25/min overage'
    ],
    metadata: {
      tier: 'starter',
      minutes: '60',
      overage_per_minute: '0.25'
    }
  },
  growth: {
    name: 'VoiceFly Growth',
    description: '250 voice minutes per month. For growing businesses that need more.',
    price_cents: 12900,
    interval: 'month' as const,
    features: [
      '250 voice minutes/month',
      'Up to 3 AI employees',
      '24/7 call answering',
      'Appointment booking',
      'Lead capture',
      'SMS confirmations',
      'Custom greeting',
      'Custom FAQ answers',
      'Custom call routing',
      'Advanced analytics',
      'Chat support',
      '$0.20/min overage'
    ],
    metadata: {
      tier: 'growth',
      minutes: '250',
      overage_per_minute: '0.20'
    }
  },
  pro: {
    name: 'VoiceFly Pro',
    description: '750 voice minutes per month. For busy businesses ready to scale.',
    price_cents: 24900,
    interval: 'month' as const,
    features: [
      '750 voice minutes/month',
      'Up to 5 AI employees',
      '24/7 call answering',
      'Fully custom AI agent (dedicated, not shared)',
      'AI SMS conversations',
      'Custom voice selection',
      'Custom call scripts',
      'API access',
      'CRM integration',
      'Advanced analytics',
      'Priority support',
      '$0.18/min overage'
    ],
    metadata: {
      tier: 'pro',
      minutes: '750',
      overage_per_minute: '0.18'
    }
  }
}

// Environment variable names for Stripe Price IDs
export const STRIPE_PRICE_ENV_KEYS = {
  subscriptions: {
    starter: 'STRIPE_PRICE_STARTER',
    growth: 'STRIPE_PRICE_GROWTH',
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
