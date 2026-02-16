/**
 * VoiceFly Stripe Products Configuration
 *
 * Use this configuration to set up products in Stripe Dashboard or via API.
 * Run: stripe products create ... or use Stripe Dashboard
 *
 * After creating products in Stripe, add the price IDs to your .env file
 */

import { TIER_PRICING, TIER_MINUTES, MINUTE_PACKS, OVERAGE_PRICING_PER_MINUTE } from './credit-system'

// Subscription Products - Monthly recurring
export const SUBSCRIPTION_PRODUCTS = {
  starter: {
    name: 'VoiceFly Starter',
    description: `${TIER_MINUTES.starter} voice minutes per month. Perfect for small businesses getting started with AI voice.`,
    price_cents: TIER_PRICING.starter.price_cents,
    interval: 'month' as const,
    features: [
      `${TIER_MINUTES.starter} voice minutes/month`,
      '24/7 AI Voice Assistant',
      'Unlimited Bookings',
      'Customer Portal',
      'Basic Analytics',
      'Email Support',
      `$${OVERAGE_PRICING_PER_MINUTE.starter}/min overage`
    ],
    metadata: {
      tier: 'starter',
      minutes: TIER_MINUTES.starter.toString(),
      overage_per_minute: OVERAGE_PRICING_PER_MINUTE.starter.toString()
    }
  },
  growth: {
    name: 'VoiceFly Growth',
    description: `${TIER_MINUTES.growth} voice minutes per month. For growing businesses ready to scale.`,
    price_cents: TIER_PRICING.growth.price_cents,
    interval: 'month' as const,
    features: [
      `${TIER_MINUTES.growth} voice minutes/month`,
      'Everything in Starter',
      'Payment Processing',
      'SMS Notifications',
      'Advanced Analytics',
      'Priority Support',
      `$${OVERAGE_PRICING_PER_MINUTE.growth}/min overage`
    ],
    metadata: {
      tier: 'growth',
      minutes: TIER_MINUTES.growth.toString(),
      overage_per_minute: OVERAGE_PRICING_PER_MINUTE.growth.toString()
    }
  },
  pro: {
    name: 'VoiceFly Pro',
    description: `${TIER_MINUTES.pro.toLocaleString()} voice minutes per month. Multi-location support for expanding businesses.`,
    price_cents: TIER_PRICING.pro.price_cents,
    interval: 'month' as const,
    features: [
      `${TIER_MINUTES.pro.toLocaleString()} voice minutes/month`,
      'Everything in Growth',
      'Multi-Location (3 locations)',
      'Staff Management',
      'Custom Integrations',
      'Phone Support',
      `$${OVERAGE_PRICING_PER_MINUTE.pro}/min overage`
    ],
    metadata: {
      tier: 'pro',
      minutes: TIER_MINUTES.pro.toString(),
      overage_per_minute: OVERAGE_PRICING_PER_MINUTE.pro.toString()
    }
  },
  scale: {
    name: 'VoiceFly Scale',
    description: `${TIER_MINUTES.scale.toLocaleString()} voice minutes per month. Enterprise-ready with unlimited locations.`,
    price_cents: TIER_PRICING.scale.price_cents,
    interval: 'month' as const,
    features: [
      `${TIER_MINUTES.scale.toLocaleString()} voice minutes/month`,
      'Everything in Pro',
      'Unlimited Locations',
      'White-Label Options',
      'Dedicated Account Manager',
      '24/7 Phone Support',
      `$${OVERAGE_PRICING_PER_MINUTE.scale}/min overage`
    ],
    metadata: {
      tier: 'scale',
      minutes: TIER_MINUTES.scale.toString(),
      overage_per_minute: OVERAGE_PRICING_PER_MINUTE.scale.toString()
    }
  }
}

// Minute Pack Products - One-time purchase
export const MINUTE_PACK_PRODUCTS = MINUTE_PACKS.map(pack => ({
  id: pack.id,
  name: `VoiceFly ${pack.name}`,
  description: `${pack.minutes} additional voice minutes. Never expires.`,
  price_cents: pack.price * 100,
  type: 'one_time' as const,
  metadata: {
    pack_id: pack.id,
    minutes: pack.minutes.toString(),
    credits: pack.credits.toString(),
    price_per_minute: pack.pricePerMinute.toString()
  }
}))

// Environment variable names for Stripe Price IDs
// Add these to your .env after creating products in Stripe
export const STRIPE_PRICE_ENV_KEYS = {
  subscriptions: {
    starter: 'STRIPE_PRICE_STARTER',
    growth: 'STRIPE_PRICE_GROWTH',
    pro: 'STRIPE_PRICE_PRO',
    scale: 'STRIPE_PRICE_SCALE'
  },
  minutePacks: {
    pack_starter: 'STRIPE_PRICE_PACK_STARTER',
    pack_growth: 'STRIPE_PRICE_PACK_GROWTH',
    pack_pro: 'STRIPE_PRICE_PACK_PRO',
    pack_scale: 'STRIPE_PRICE_PACK_SCALE'
  }
}

/**
 * Get Stripe price ID for a subscription tier
 */
export function getSubscriptionPriceId(tier: keyof typeof SUBSCRIPTION_PRODUCTS): string | undefined {
  const envKey = STRIPE_PRICE_ENV_KEYS.subscriptions[tier]
  return process.env[envKey]
}

/**
 * Get Stripe price ID for a minute pack
 */
export function getMinutePackPriceId(packId: string): string | undefined {
  const envKey = STRIPE_PRICE_ENV_KEYS.minutePacks[packId as keyof typeof STRIPE_PRICE_ENV_KEYS.minutePacks]
  return process.env[envKey]
}

/**
 * Stripe CLI commands to create products (for reference)
 * Run these in your terminal after installing Stripe CLI
 */
export const STRIPE_CLI_COMMANDS = `
# Create Subscription Products
stripe products create --name="VoiceFly Starter" --description="200 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=9700 --currency=usd --recurring[interval]=month

stripe products create --name="VoiceFly Growth" --description="500 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=19700 --currency=usd --recurring[interval]=month

stripe products create --name="VoiceFly Pro" --description="1,200 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=29700 --currency=usd --recurring[interval]=month

stripe products create --name="VoiceFly Scale" --description="2,500 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=49700 --currency=usd --recurring[interval]=month

# Create Minute Pack Products
stripe products create --name="VoiceFly Starter Pack" --description="50 voice minutes"
stripe prices create --product=prod_xxx --unit-amount=2000 --currency=usd

stripe products create --name="VoiceFly Growth Pack" --description="150 voice minutes"
stripe prices create --product=prod_xxx --unit-amount=5000 --currency=usd

stripe products create --name="VoiceFly Pro Pack" --description="400 voice minutes"
stripe prices create --product=prod_xxx --unit-amount=10000 --currency=usd

stripe products create --name="VoiceFly Scale Pack" --description="1000 voice minutes"
stripe prices create --product=prod_xxx --unit-amount=20000 --currency=usd
`
