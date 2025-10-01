'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, PaymentAPIImpl, PLAN_TIER_LIMITS, type Business, type PaymentWithDetails } from '../../../lib/supabase'
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'
import { getCurrentBusinessId } from '../../../lib/auth-utils'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function BillingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if we're in test mode
  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_') ?? true

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const businessId = getCurrentBusinessId() || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
      console.log('Loading billing data for business:', businessId)
      
      // Load business data
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData) {
        setBusiness(businessData)
        
        // Load payment history for Professional+ tiers
        if (['professional', 'business'].includes(businessData.subscription_tier)) {
          const paymentAPI = new PaymentAPIImpl()
          const paymentsData = await paymentAPI.getPayments(businessId, { limit: 10 })
          setPayments(paymentsData)
        }
      } else {
        setError('Business not found')
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
      setError('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (targetPlan: string) => {
    if (!business) return
    
    setUpgrading(targetPlan)
    
    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')
      
      // Create checkout session
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          targetPlan,
          currentPlan: business.subscription_tier
        })
      })
      
      const { sessionId, error: checkoutError } = await response.json()
      
      if (checkoutError) {
        throw new Error(checkoutError)
      }
      
      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      
      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setError(`Upgrade failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpgrading(null)
    }
  }

  const getPlanPrice = (tier: string) => {
    return PLAN_TIER_LIMITS[tier as keyof typeof PLAN_TIER_LIMITS]?.monthly_price || 0
  }

  const canUpgradeTo = (targetTier: string) => {
    if (!business) return false
    const currentTierOrder = ['starter', 'professional', 'business', 'enterprise']
    const currentIndex = currentTierOrder.indexOf(business.subscription_tier)
    const targetIndex = currentTierOrder.indexOf(targetTier)
    return targetIndex > currentIndex
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button onClick={loadBillingData} className="btn-primary">Try Again</button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Test Mode Warning */}
        {isTestMode && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">🧪 Test Mode Active</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  You can safely test all payment features without any real charges. Use card 4242 4242 4242 4242 for testing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage your subscription, billing, and unlock more AI features
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 capitalize">{business?.subscription_tier || 'Starter'} Plan</h3>
                  <span className={`ml-3 px-3 py-1 text-sm font-medium rounded-full ${
                    business?.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    business?.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {business?.subscription_status === 'trialing' ? 'Trial Period' : business?.subscription_status}
                  </span>
                </div>
                <p className="text-gray-600">{getPlanDescription(business?.subscription_tier || 'starter')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {business?.subscription_tier === 'starter' ? 'Free' : `$${getPlanPrice(business?.subscription_tier || 'starter')}`}
                </div>
                <p className="text-sm text-gray-500">
                  {business?.subscription_tier === 'starter' ? 'Trial period' : 'per month'}
                </p>
              </div>
            </div>

            {/* Plan Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">24/7 AI Voice Assistant</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">Unlimited Bookings</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-700">Customer Portal</span>
              </div>
              {['professional', 'business'].includes(business?.subscription_tier || '') && (
                <>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-gray-700">Payment Processing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-gray-700">Loyalty Programs</span>
                  </div>
                </>
              )}
              {business?.subscription_tier === 'business' && (
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Multi-Location Support</span>
                </div>
              )}
            </div>

            {/* Trial Information */}
            {business?.subscription_status === 'trialing' && business?.trial_ends_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-blue-800 font-medium">
                      Trial ends {new Date(business.trial_ends_at).toLocaleDateString()}
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Upgrade now to continue using all features without interruption
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Options */}
        {(business?.subscription_tier === 'starter' || business?.subscription_tier === 'professional') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade Your Plan</h2>
              <p className="text-gray-600 mt-1">Unlock more features to grow your business</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Professional Plan */}
                {canUpgradeTo('professional') && (
                  <div className="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Professional</h3>
                      <div className="text-2xl font-bold text-purple-600">${getPlanPrice('professional')}/mo</div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-purple-500 mr-2" />
                        Everything in Starter
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-purple-500 mr-2" />
                        Payment Processing (Square/Stripe)
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-purple-500 mr-2" />
                        Loyalty Program Management
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-purple-500 mr-2" />
                        Advanced Analytics
                      </li>
                    </ul>
                    <button
                      onClick={() => handleUpgrade('professional')}
                      disabled={upgrading === 'professional'}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'professional' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Upgrade to Professional
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Business Plan */}
                {canUpgradeTo('business') && (
                  <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-300 transition-colors relative">
                    <div className="absolute -top-3 left-6">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Business</h3>
                      <div className="text-2xl font-bold text-green-600">${getPlanPrice('business')}/mo</div>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-green-500 mr-2" />
                        Everything in Professional
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-green-500 mr-2" />
                        Multi-Location Support (3 locations)
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-green-500 mr-2" />
                        Location-Based Analytics
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-green-500 mr-2" />
                        Priority Support
                      </li>
                    </ul>
                    <button
                      onClick={() => handleUpgrade('business')}
                      disabled={upgrading === 'business'}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'business' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Upgrade to Business
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
          </div>
          <div className="p-6">
            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-8 w-8 text-gray-400 mr-4" />
                      <div>
                        <p className="font-medium text-gray-900">
                          ${payment.total_amount.toFixed(2)} - {payment.payment_method || 'Card'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()} • 
                          <span className={`ml-1 ${
                            payment.status === 'paid' ? 'text-green-600' :
                            payment.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {payment.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {business?.subscription_tier === 'starter' ? 'No billing history yet' : 'No recent transactions'}
                </h3>
                <p className="text-gray-500">
                  {business?.subscription_tier === 'starter' 
                    ? 'Your invoices and billing history will appear here once you upgrade to a paid plan.'
                    : 'Your payment history and invoices will appear here.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Management */}
        {business?.subscription_tier !== 'starter' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Need to make changes?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Contact support for subscription modifications or cancellations
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Contact Support
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// Helper function for plan descriptions
function getPlanDescription(tier: string) {
  const descriptions = {
    starter: 'Perfect for getting started with AI voice booking',
    professional: 'Advanced features for growing salons',
    business: 'Complete solution for multi-location businesses',
    enterprise: 'Custom enterprise solution'
  }
  return descriptions[tier as keyof typeof descriptions] || descriptions.starter
}

// Wrap with ProtectedRoute
function ProtectedBillingPage() {
  return (
    <ProtectedRoute>
      <BillingPage />
    </ProtectedRoute>
  )
}

export default ProtectedBillingPage