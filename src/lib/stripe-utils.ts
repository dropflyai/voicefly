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
      '60 Voice Minutes/mo',
      '1 AI employee',
      '1 Phone Number',
      '24/7 Call Answering',
      'Appointment Booking',
      'Lead Capture',
      'SMS Confirmations',
      'Call Analytics Dashboard',
      'Email Support',
      '$0.25/min overage'
    ],
    growth: [
      '250 Voice Minutes/mo',
      '3 AI employees',
      '3 Phone Numbers',
      'Everything in Starter plus:',
      'Custom Greeting',
      'Custom FAQ Answers',
      'Custom Call Routing',
      'Advanced Analytics',
      'Chat Support',
      '$0.20/min overage'
    ],
    pro: [
      '750 Voice Minutes/mo',
      '5 AI employees',
      '5 Phone Numbers',
      'Everything in Growth plus:',
      'Fully Custom AI Agent (dedicated)',
      'AI SMS Conversations',
      'Custom Voice Selection',
      'Custom Call Scripts',
      'API Access',
      'CRM Integration',
      'Priority Support',
      '$0.18/min overage'
    ]
  }

  return features[tier as keyof typeof features] || features.starter
}

export const getUpgradeROI = (currentTier: string, targetTier: string) => {
  const roi = {
    'starter-growth': {
      revenue_increase: '30-50%',
      features: ['4x more voice minutes', '3 AI employees', '3 phone numbers', 'Custom greetings & routing'],
      payback_period: '2-3 months',
      minutes_increase: '+190 minutes'
    },
    'starter-pro': {
      revenue_increase: '50-80%',
      features: ['12.5x more voice minutes', 'Fully custom AI agent', 'API & CRM integration'],
      payback_period: '3-4 months',
      minutes_increase: '+690 minutes'
    },
    'growth-pro': {
      revenue_increase: '25-40%',
      features: ['3x more voice minutes', 'Fully custom AI agent', 'AI SMS conversations & CRM'],
      payback_period: '2-3 months',
      minutes_increase: '+500 minutes'
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