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
    starter: [
      '24/7 AI Voice Assistant',
      'Unlimited Bookings',
      'Customer Portal',
      'Basic Analytics',
      'Email Support'
    ],
    professional: [
      'Everything in Starter',
      'Payment Processing (Square/Stripe)',
      'Loyalty Program Management', 
      'Advanced Analytics',
      'SMS Notifications',
      'Priority Support'
    ],
    business: [
      'Everything in Professional',
      'Multi-Location Support (3 locations)',
      'Location-Based Analytics',
      'Staff Management Tools',
      'Custom Integrations',
      'Phone Support'
    ],
    enterprise: [
      'Everything in Business',
      'Unlimited Locations',
      'White-Label Options',
      'Custom Development',
      'Dedicated Account Manager',
      '24/7 Phone Support'
    ]
  }
  
  return features[tier as keyof typeof features] || features.starter
}

export const getUpgradeROI = (currentTier: string, targetTier: string) => {
  const roi = {
    'starter-professional': {
      revenue_increase: '25-40%',
      features: ['Payment processing reduces friction', 'Loyalty program increases retention'],
      payback_period: '2-3 months'
    },
    'starter-business': {
      revenue_increase: '40-70%',
      features: ['Multi-location efficiency', 'Advanced analytics insights', 'Streamlined operations'],
      payback_period: '3-4 months'
    },
    'professional-business': {
      revenue_increase: '20-30%',
      features: ['Multi-location scaling', 'Advanced staff management', 'Location analytics'],
      payback_period: '2-3 months'
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