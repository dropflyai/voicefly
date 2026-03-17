/**
 * VoiceFly Stripe Products Configuration
 * 3-tier model: Starter ($49/mo), Growth ($129/mo), Pro ($249/mo)
 * Annual pricing: 20% off — Starter $39/mo, Growth $103/mo, Pro $199/mo
 * Founding offers: Starter $25/mo (50% off), Growth $90/mo (30% off), Pro $175/mo (30% off)
 */

// Subscription Products - Monthly recurring
export const SUBSCRIPTION_PRODUCTS = {
  starter: {
    name: 'VoiceFly Starter',
    description: '60 voice minutes per month. Your AI employee answers calls 24/7.',
    price_cents: 4900,
    annual_price_cents: 3900,
    founding_price_cents: 2500,
    interval: 'month' as const,
    features: [
      '60 voice minutes/month',
      '1 AI employee',
      '1 phone number',
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
      employees: '1',
      phone_numbers: '1',
      overage_per_minute: '0.25'
    }
  },
  growth: {
    name: 'VoiceFly Growth',
    description: '250 voice minutes per month. For growing businesses that need more.',
    price_cents: 12900,
    annual_price_cents: 10300,
    founding_price_cents: 9000,
    interval: 'month' as const,
    features: [
      '250 voice minutes/month',
      '3 AI employees',
      '3 phone numbers',
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
      employees: '3',
      phone_numbers: '3',
      overage_per_minute: '0.20'
    }
  },
  pro: {
    name: 'VoiceFly Pro',
    description: '750 voice minutes per month. For busy businesses ready to scale.',
    price_cents: 24900,
    annual_price_cents: 19900,
    founding_price_cents: 17500,
    interval: 'month' as const,
    features: [
      '750 voice minutes/month',
      '5 AI employees',
      '5 phone numbers',
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
      employees: '5',
      phone_numbers: '5',
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
