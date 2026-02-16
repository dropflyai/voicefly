import Stripe from 'stripe'

// Client-side Stripe utilities
export const formatPrice = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount)
}

export const isTestMode = (): boolean => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_') ?? true
}

export const getTestCards = () => ({
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  declined: '4000000000000002'
})

export const getPlanFeatures = (tier: string) => {
  const features = {
    trial: [
      '10 Voice Minutes',
      'AI Voice Assistant',
      'Basic Booking',
      'Try Before You Buy'
    ],
    starter: [
      '200 Voice Minutes/mo',
      '24/7 AI Voice Assistant',
      'Unlimited Bookings',
      'Customer Portal',
      'Basic Analytics',
      'Email Support',
      '$0.45/min overage'
    ],
    growth: [
      '500 Voice Minutes/mo',
      'Everything in Starter',
      'Payment Processing',
      'SMS Notifications',
      'Advanced Analytics',
      'Priority Support',
      '$0.38/min overage'
    ],
    pro: [
      '1,200 Voice Minutes/mo',
      'Everything in Growth',
      'Multi-Location (3 locations)',
      'Staff Management',
      'Custom Integrations',
      'Phone Support',
      '$0.28/min overage'
    ],
    scale: [
      '2,500 Voice Minutes/mo',
      'Everything in Pro',
      'Unlimited Locations',
      'White-Label Options',
      'Dedicated Account Manager',
      '24/7 Phone Support',
      '$0.22/min overage'
    ]
  }

  return features[tier as keyof typeof features] || features.starter
}

export const getUpgradeROI = (currentTier: string, targetTier: string) => {
  const roi = {
    'starter-growth': {
      revenue_increase: '25-40%',
      features: ['2.5x more voice minutes', 'Payment processing reduces friction', 'SMS notifications'],
      payback_period: '2-3 months',
      minutes_increase: '+300 minutes'
    },
    'starter-pro': {
      revenue_increase: '40-70%',
      features: ['6x more voice minutes', 'Multi-location support', 'Staff management'],
      payback_period: '3-4 months',
      minutes_increase: '+1,000 minutes'
    },
    'starter-scale': {
      revenue_increase: '70-120%',
      features: ['12.5x more voice minutes', 'Unlimited locations', 'Dedicated support'],
      payback_period: '4-5 months',
      minutes_increase: '+2,300 minutes'
    },
    'growth-pro': {
      revenue_increase: '20-35%',
      features: ['2.4x more voice minutes', 'Multi-location scaling', 'Advanced integrations'],
      payback_period: '2-3 months',
      minutes_increase: '+700 minutes'
    },
    'growth-scale': {
      revenue_increase: '40-60%',
      features: ['5x more voice minutes', 'Unlimited locations', 'White-label options'],
      payback_period: '3-4 months',
      minutes_increase: '+2,000 minutes'
    },
    'pro-scale': {
      revenue_increase: '20-30%',
      features: ['2x more voice minutes', 'Unlimited locations', 'Dedicated account manager'],
      payback_period: '2-3 months',
      minutes_increase: '+1,300 minutes'
    }
  }

  const key = `${currentTier}-${targetTier}` as keyof typeof roi
  return roi[key] || null
}

// Server-side utilities (use in API routes)
export const createStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  })
}

export const validateStripeConfig = () => {
  const required = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing Stripe configuration: ${missing.join(', ')}`)
  }
  
  return true
}