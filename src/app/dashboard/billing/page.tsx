'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { SUBSCRIPTION_PRODUCTS } from '../../../lib/stripe-products'
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import { supabase } from '../../../lib/supabase-client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  pro: 199,
}

function BillingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_') ?? true

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      const businessId = getCurrentBusinessId()
      if (!businessId) {
        setError('Authentication required. Please log in.')
        return
      }

      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData) {
        setBusiness(businessData)
      } else {
        setError('Business not found')
      }
    } catch (err) {
      console.error('Error loading billing data:', err)
      setError('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (targetPlan: string) => {
    if (!business) return

    setUpgrading(targetPlan)
    setError(null)

    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          businessId: business.id,
          targetPlan,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      if (data.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (stripeError) throw new Error(stripeError.message)
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError(`Upgrade failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!business) return
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) return

    setCancelling(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ businessId: business.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess(data.message || 'Your subscription has been cancelled.')
      loadBillingData()
    } catch (err) {
      setError(`Cancel failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setCancelling(false)
    }
  }

  const currentTier = business?.subscription_tier || 'starter'
  const isOnTrial = business?.subscription_status === 'trial'
  const isPaidPlan = ['starter', 'pro'].includes(currentTier) && business?.subscription_status === 'active'
  const isStarter = currentTier === 'starter' && !isOnTrial && isPaidPlan
  const isPro = currentTier === 'pro' && isPaidPlan
  const canUpgrade = !isPro

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

  if (error && !business) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button onClick={loadBillingData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8 max-w-4xl">
        {/* Test Mode Warning */}
        {isTestMode && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Test Mode Active</p>
                <p className="text-yellow-700 text-xs mt-0.5">
                  Use card 4242 4242 4242 4242 for testing. No real charges.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your plan and billing
          </p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-gray-900 capitalize">
                    {isOnTrial ? 'Free Trial' : currentTier === 'pro' ? 'Pro' : 'Starter'}
                  </h3>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    business?.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                    business?.subscription_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    isOnTrial ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {business?.subscription_status === 'cancelled' ? 'Cancelled' :
                     isOnTrial ? 'Trial' :
                     business?.subscription_status === 'active' ? 'Active' :
                     business?.subscription_status || 'Trial'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {isOnTrial ? '10 free calls, shared phone number, basic AI receptionist'
                    : currentTier === 'pro' ? '1,000 voice minutes/month, up to 5 AI employees, custom training & voice'
                    : '100 voice minutes/month, dedicated number, Maya AI receptionist'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {isOnTrial ? 'Free' : `$${PLAN_PRICES[currentTier] || 49}`}
                </div>
                <p className="text-xs text-gray-500">
                  {isOnTrial ? 'during trial' : 'per month'}
                </p>
              </div>
            </div>

            {/* Current plan features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {(SUBSCRIPTION_PRODUCTS[currentTier as keyof typeof SUBSCRIPTION_PRODUCTS]?.features || SUBSCRIPTION_PRODUCTS.starter.features).slice(0, 6).map((feature, i) => (
                <div key={i} className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Trial info */}
            {isOnTrial && business?.trial_ends_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Trial ends {new Date(business.trial_ends_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Upgrade to keep your AI employees running
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Options */}
        {canUpgrade && (
          <div className="bg-white rounded-xl border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {isOnTrial ? 'Choose a Plan' : 'Upgrade'}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trial / Free */}
                <div className={`border-2 rounded-xl p-6 transition-colors ${
                  isOnTrial ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Trial</h3>
                    <div className="text-2xl font-bold text-gray-500">Free</div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm text-gray-600"><CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />10 free calls</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />Shared phone number</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />Basic AI receptionist</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />Appointment booking</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />Email notifications</li>
                  </ul>
                  {isOnTrial ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-gray-100 text-gray-700">
                      Current Plan
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium text-gray-400">
                      Trial expired
                    </div>
                  )}
                </div>

                {/* Starter Plan */}
                <div className={`border-2 rounded-xl p-6 transition-colors ${
                  isStarter ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                    <div className="text-2xl font-bold text-blue-600">$49<span className="text-sm font-normal text-gray-500">/mo</span></div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {SUBSCRIPTION_PRODUCTS.starter.features.slice(0, 7).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isStarter ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-blue-100 text-blue-700">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('starter')}
                      disabled={upgrading === 'starter'}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'starter' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          Get Starter
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-indigo-200 rounded-xl p-6 hover:border-indigo-300 transition-colors relative">
                  <div className="absolute -top-3 left-6">
                    <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                    <div className="text-2xl font-bold text-indigo-600">$199<span className="text-sm font-normal text-gray-500">/mo</span></div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {SUBSCRIPTION_PRODUCTS.pro.features.slice(0, 7).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <SparklesIcon className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgrading === 'pro'}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {upgrading === 'pro' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        Upgrade to Pro
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing History placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-6">
              <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isPaidPlan
                  ? 'Your invoices will appear here after your first billing cycle.'
                  : 'Billing history will appear here once you subscribe to a plan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Subscription */}
        {isPaidPlan && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Subscription Management</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Cancel your subscription</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You&apos;ll retain access until the end of your billing period.
                  </p>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function ProtectedBillingPage() {
  return (
    <ProtectedRoute>
      <BillingPage />
    </ProtectedRoute>
  )
}

export default ProtectedBillingPage
