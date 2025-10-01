'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe with your publishable key
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null)

export type PlanTier = 'starter' | 'professional' | 'business'

export interface PlanDetails {
  id: PlanTier
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: string[]
  popular?: boolean
  badge?: string
}

export interface PlanSelectorProps {
  onPlanSelected: (plan: PlanTier, paymentMethodId: string) => Promise<void>
  loading?: boolean
}

const PLANS: PlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 67,
    yearlyPrice: 670,
    description: 'Perfect for single-location businesses',
    features: [
      '24/7 AI Voice Assistant',
      'Smart Web Booking Widget', 
      'Unlimited Appointments',
      'SMS Text Confirmations',
      'Customer Management',
      'Single Location Support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 147,
    yearlyPrice: 1470,
    description: 'Advanced features for growing businesses',
    features: [
      'Everything in Starter',
      'Advanced Analytics Dashboard',
      'Payment Processing Integration',
      'Email Marketing Campaigns',
      'Custom Branding System',
      'Loyalty Points Program',
      'Automated Daily Reports'
    ],
    popular: true,
    badge: 'Most Popular'
  },
  {
    id: 'business',
    name: 'Business',
    price: 297,
    yearlyPrice: 2970,
    description: 'Enterprise features for multiple locations',
    features: [
      'Everything in Professional',
      'Up to 3 Business Locations',
      'Cross-Location Analytics',
      'Custom AI Voice Assistant',
      'Multi-Location Staff Management',
      'White-Label Options',
      'Priority Support'
    ],
    badge: 'Enterprise'
  }
]

interface PaymentFormProps {
  selectedPlan: PlanDetails
  isYearly: boolean
  onPaymentComplete: (paymentMethodId: string) => Promise<void>
  loading: boolean
}

function PaymentForm({ selectedPlan, isYearly, onPaymentComplete, loading }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)

  // Check if Stripe is ready
  React.useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true)
    } else {
      // Add timeout to detect if Stripe fails to load
      const timeout = setTimeout(() => {
        if (!stripe || !elements) {
          setPaymentError('Payment system failed to load. Please check your internet connection and try again.')
        }
      }, 10000)
      
      return () => clearTimeout(timeout)
    }
  }, [stripe, elements])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      setPaymentError('Payment system not ready. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card information is required.')
      return
    }

    setProcessing(true)
    setPaymentError(null)

    try {
      // Create payment method for $0 authorization
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: 'Trial User', // Will be updated with actual business info
        },
      })

      if (error) {
        setPaymentError(error.message || 'Payment validation failed')
        return
      }

      if (!paymentMethod) {
        setPaymentError('Failed to validate payment method')
        return
      }

      // Pass payment method ID to parent
      await onPaymentComplete(paymentMethod.id)

    } catch (err) {
      setPaymentError('Payment processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const price = isYearly ? selectedPlan.yearlyPrice : selectedPlan.price
  const priceLabel = isYearly ? 'year' : 'month'

  // Check if Stripe publishable key is available
  const hasStripeKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  // Show error state if Stripe key is missing
  if (!hasStripeKey) {
    return (
      <div className="bg-white rounded-lg border-2 border-red-500 shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedPlan.name} Plan
          </h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ${price}<span className="text-lg text-gray-500">/{priceLabel}</span>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">⚠️ Payment Configuration Issue</div>
          <p className="text-gray-600 mb-4">The payment system is not properly configured.</p>
          <p className="text-sm text-gray-500">
            Please contact support or set up the Stripe integration in the environment variables.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state while Stripe initializes  
  if (!stripeReady) {
    return (
      <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedPlan.name} Plan
          </h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ${price}<span className="text-lg text-gray-500">/{priceLabel}</span>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading secure payment form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedPlan.name} Plan
        </h3>
        <div className="text-3xl font-bold text-blue-600 mb-2">
          ${price}<span className="text-lg text-gray-500">/{priceLabel}</span>
        </div>
        <p className="text-green-600 font-medium">
          ✅ Card won't be charged during 7-day trial
        </p>
        <p className="text-sm text-gray-600 mt-1">
          We'll validate your payment method with a $0 authorization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-4 border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    lineHeight: '24px',
                    '::placeholder': {
                      color: '#9CA3AF',
                    },
                  },
                  invalid: {
                    color: '#EF4444',
                  },
                },
                hidePostalCode: false,
              }}
              onChange={(event) => {
                if (event.error) {
                  setPaymentError(event.error.message)
                } else {
                  setPaymentError(null)
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter your card number, expiry date, CVC, and postal code
          </p>
        </div>


        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {paymentError}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? 'Validating Payment Method...' : 'Start Free Trial'}
        </button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🔒 Secure payment processing by Stripe</p>
          <p>✅ Cancel anytime during trial • No setup fees</p>
          <p>💳 Billing starts after 7-day trial expires</p>
        </div>
      </form>
    </div>
  )
}

function PlanCard({ plan, isYearly, selected, onSelect }: {
  plan: PlanDetails
  isYearly: boolean
  selected: boolean
  onSelect: () => void
}) {
  const price = isYearly ? plan.yearlyPrice : plan.price
  const priceLabel = isYearly ? 'year' : 'month'

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onClick={onSelect}
    >
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full text-white ${
          plan.popular ? 'bg-blue-500' : 'bg-gray-600'
        }`}>
          {plan.badge}
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          ${price}<span className="text-lg text-gray-500">/{priceLabel}</span>
        </div>
        {isYearly && (
          <p className="text-sm text-green-600 font-medium">
            Save ${(plan.price * 12) - plan.yearlyPrice}/year
          </p>
        )}
        <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
      </div>

      <ul className="space-y-2 mb-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <button className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
          selected 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}>
          {selected ? 'Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  )
}

function PlanSelectorContent({ onPlanSelected, loading }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('professional')
  const [isYearly, setIsYearly] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlan)!

  const handlePlanSelection = (planId: PlanTier) => {
    setSelectedPlan(planId)
    setShowPayment(false)
  }

  const handleContinueToPayment = () => {
    setShowPayment(true)
  }

  const handlePaymentComplete = async (paymentMethodId: string) => {
    await onPlanSelected(selectedPlan, paymentMethodId)
  }

  if (showPayment) {
    return (
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setShowPayment(false)}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          ← Back to plans
        </button>
        <PaymentForm
          selectedPlan={selectedPlanDetails}
          isYearly={isYearly}
          onPaymentComplete={handlePaymentComplete}
          loading={loading}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Start your free trial and get your AI assistant working in 3 minutes
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isYearly ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-gray-500'}`}>
            Yearly
          </span>
          {isYearly && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Save up to 17%
            </span>
          )}
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            selected={selectedPlan === plan.id}
            onSelect={() => handlePlanSelection(plan.id)}
          />
        ))}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={handleContinueToPayment}
          disabled={loading}
          className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          Continue with {selectedPlanDetails.name} Plan
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Next: Enter your business information and get your AI phone number
        </p>
      </div>
    </div>
  )
}

export default function PlanSelector(props: PlanSelectorProps) {
  return (
    <Elements stripe={stripePromise}>
      <PlanSelectorContent {...props} />
    </Elements>
  )
}