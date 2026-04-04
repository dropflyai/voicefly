'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import CreditMeter from '../../../components/CreditMeter'
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
  ArrowDownTrayIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { loadStripe } from '@stripe/stripe-js'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import { supabase } from '../../../lib/supabase-client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  growth: 129,
  pro: 249,
}

interface BillingInfo {
  currentPlan: string
  billingCycle: string
  nextBillingDate: string
  amount: number
  paymentMethod: {
    type: string
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
  } | null
  subscriptionStatus: string
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: string
  description: string
  downloadUrl?: string
}

function BillingPageContent() {
  const searchParams = useSearchParams()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)

  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_') ?? true

  useEffect(() => {
    // Check for post-checkout success
    const subscribed = searchParams.get('subscribed')
    const plan = searchParams.get('plan')
    if (subscribed === 'true' && plan) {
      setSuccess(`Welcome to VoiceFly ${plan === 'pro' ? 'Pro' : plan === 'growth' ? 'Growth' : 'Starter'}! Your subscription is now active.`)
      setTimeout(() => setSuccess(null), 8000)
    }

    loadBillingData()
  }, [searchParams])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return null
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      const bizId = getCurrentBusinessId()
      if (!bizId) {
        setError('Authentication required. Please log in.')
        return
      }
      setBusinessId(bizId)

      const headers = await getAuthHeaders()

      // Fetch business, billing info, and invoices in parallel
      const [businessData, billingRes, invoicesRes] = await Promise.all([
        BusinessAPI.getBusiness(bizId),
        headers ? fetch('/api/billing/info', { headers }).then(r => r.ok ? r.json() : null).catch(() => null) : null,
        headers ? fetch('/api/billing/invoices', { headers }).then(r => r.ok ? r.json() : null).catch(() => null) : null,
      ])

      if (businessData) {
        setBusiness(businessData)
      } else {
        setError('Business not found')
      }

      if (billingRes) {
        setBillingInfo(billingRes)
      }

      if (invoicesRes?.invoices) {
        setInvoices(invoicesRes.invoices)
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
  const isPaidPlan = ['starter', 'growth', 'pro'].includes(currentTier) && business?.subscription_status === 'active'
  const isStarter = currentTier === 'starter' && !isOnTrial && isPaidPlan
  const isGrowth = currentTier === 'growth' && isPaidPlan
  const isPro = currentTier === 'pro' && isPaidPlan
  const canUpgrade = !isPro

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-highest rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-surface-highest rounded mb-6"></div>
            <div className="h-96 bg-surface-highest rounded"></div>
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
            <div className="text-[#ffb4ab] text-lg font-medium mb-4">{error}</div>
            <button onClick={loadBillingData} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors text-sm font-medium">
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8 space-y-8">
        {/* Test Mode Warning */}
        {isTestMode && (
          <div className="bg-accent/5 rounded-2xl p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-accent mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent">Test Mode Active</p>
                <p className="text-text-muted text-xs mt-0.5">
                  Use card 4242 4242 4242 4242 for testing. No real charges.
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-2xl text-sm font-medium bg-emerald-500/5 text-emerald-500 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm font-medium bg-[#93000a]/5 text-[#ffb4ab]">
            {error}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Billing & Subscription</h1>
          <p className="text-text-secondary mt-1">Manage your plan, usage, and payment methods.</p>
        </div>

        {/* Two-Column Layout — Stitch Style */}
        <div className="flex gap-8">
          {/* Left Column — Plan & Usage */}
          <div className="flex-1 space-y-6">
            {/* Current Plan Card */}
            <div className="bg-surface-low rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                      business?.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      business?.subscription_status === 'cancelled' ? 'bg-[#93000a]/10 text-[#ffb4ab]' :
                      'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      {business?.subscription_status === 'cancelled' ? 'Cancelled' : isOnTrial ? 'Trial' : 'Active'}
                    </span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">
                    {isOnTrial ? 'Free Trial' : currentTier === 'pro' ? 'Pro Plan' : currentTier === 'growth' ? 'Growth Plan' : 'Starter Plan'}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {isOnTrial ? 'Free' : `$${PLAN_PRICES[currentTier] || 49}`}
                    {!isOnTrial && <span className="text-text-muted">/mo</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canUpgrade && (
                    <button onClick={() => {}} className="px-4 py-2 bg-brand-primary text-brand-on text-sm font-medium rounded-lg hover:bg-[#0060d0] transition-colors">
                      Change Plan
                    </button>
                  )}
                  {isPaidPlan && (
                    <button onClick={handleCancelSubscription} disabled={cancelling} className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-high rounded-lg hover:bg-surface-highest transition-colors disabled:opacity-50">
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>
              </div>

              {/* Monthly Usage Bar */}
              {businessId && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Monthly Usage</span>
                    <span className="text-sm text-text-muted">
                      {business?.credits_used_this_month || 0} / {(business?.monthly_credits || 0) + (business?.purchased_credits || 0)} <span className="text-xs">mins</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((business?.credits_used_this_month || 0) / Math.max(1, (business?.monthly_credits || 1) + (business?.purchased_credits || 0))) * 100)}%` }}
                    />
                  </div>
                  {billingInfo?.nextBillingDate && !isOnTrial && (
                    <p className="text-xs text-text-muted mt-2">Next billing cycle starts on {new Date(billingInfo.nextBillingDate).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {isOnTrial && business?.trial_ends_at && (
                <div className="bg-brand-primary/5 rounded-lg p-4 mt-2">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-brand-primary mr-2 flex-shrink-0" />
                    <p className="text-sm text-brand-light font-medium">
                      Trial ends {new Date(business.trial_ends_at).toLocaleDateString()} — upgrade to keep your AI employees running
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-manrope)]">Usage Breakdown</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-low rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Voice Minutes</p>
                  <p className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">
                    {business?.credits_used_this_month || 0}<span className="text-sm font-normal text-text-muted"> / {business?.monthly_credits || 0}</span>
                  </p>
                </div>
                <div className="bg-surface-low rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-text-muted mb-1">SMS Sent</p>
                  <p className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">--</p>
                </div>
                <div className="bg-surface-low rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Employees</p>
                  <p className="text-2xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">--</p>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div>
              <h3 className="text-lg font-bold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Invoice History</h3>
              <div className="bg-surface-low rounded-2xl overflow-hidden">
                {invoices.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-highest/30">
                        <th className="px-6 py-3 text-xs uppercase tracking-widest text-text-muted font-bold">Date</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-widest text-text-muted font-bold">Amount</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-widest text-text-muted font-bold">Status</th>
                        <th className="px-6 py-3 text-xs uppercase tracking-widest text-text-muted font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(65,71,84,0.1)]">
                      {invoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-surface-med transition-colors">
                          <td className="px-6 py-4 text-sm text-text-primary">{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-medium text-text-primary">${invoice.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                              invoice.status === 'pending' ? 'bg-accent/10 text-accent' :
                              'bg-[#93000a]/10 text-[#ffb4ab]'
                            }`}>
                              {invoice.status === 'paid' ? 'Paid' : invoice.status === 'pending' ? 'Pending' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {invoice.downloadUrl && (
                              <a href={invoice.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-brand-light hover:text-brand-primary text-sm font-medium inline-flex items-center">
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Download PDF
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10">
                    <DocumentTextIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">
                      {isPaidPlan ? 'Invoices appear after your first billing cycle.' : 'Subscribe to a plan to see billing history.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column — Minutes Balance & Payment */}
          <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
            {/* Minutes Balance */}
            <div className="bg-surface-low rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold">Minutes Balance</h4>
              <div className="text-center">
                <div className="text-5xl font-extrabold text-brand-primary font-[family-name:var(--font-manrope)]">
                  {Math.max(0, (business?.monthly_credits || 0) + (business?.purchased_credits || 0) - (business?.credits_used_this_month || 0)).toLocaleString()}
                </div>
                <div className="text-sm text-text-secondary mt-1">Minutes remaining</div>
              </div>
              <button className="w-full px-4 py-2.5 text-sm font-medium text-text-primary bg-surface-high rounded-lg hover:bg-surface-highest transition-colors">
                + Purchase More
              </button>
            </div>

            {/* Payment Method */}
            <div className="bg-surface-low rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold">Payment Method</h4>
              {billingInfo?.paymentMethod ? (
                <div>
                  <div className="bg-surface-lowest rounded-xl p-4 mb-3">
                    <p className="text-sm text-text-primary font-medium capitalize">{billingInfo.paymentMethod.brand} ending in</p>
                    <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">{billingInfo.paymentMethod.last4}</p>
                    <p className="text-xs text-text-muted mt-1">Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-sm font-medium text-text-primary bg-surface-high rounded-lg hover:bg-surface-highest transition-colors">
                    Update
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No payment method on file</p>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {canUpgrade && (
          <div className="bg-surface-low rounded-xl border border-[rgba(65,71,84,0.15)] mb-8">
            <div className="px-6 py-4 border-b border-[rgba(65,71,84,0.15)]">
              <h2 className="text-lg font-semibold text-text-primary">
                {isOnTrial ? 'Choose a Plan' : 'Upgrade'}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Trial / Free */}
                <div className={`border-2 rounded-xl p-6 transition-colors ${
                  isOnTrial ? 'border-[rgba(65,71,84,0.2)] bg-surface' : 'border-[rgba(65,71,84,0.15)]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Trial</h3>
                    <div className="text-2xl font-bold text-text-secondary">Free</div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm text-text-secondary"><CheckCircleIcon className="h-4 w-4 text-text-muted mr-2 flex-shrink-0" />10 free calls</li>
                    <li className="flex items-center text-sm text-text-secondary"><CheckCircleIcon className="h-4 w-4 text-text-muted mr-2 flex-shrink-0" />Shared phone number</li>
                    <li className="flex items-center text-sm text-text-secondary"><CheckCircleIcon className="h-4 w-4 text-text-muted mr-2 flex-shrink-0" />Basic AI receptionist</li>
                    <li className="flex items-center text-sm text-text-secondary"><CheckCircleIcon className="h-4 w-4 text-text-muted mr-2 flex-shrink-0" />Appointment booking</li>
                    <li className="flex items-center text-sm text-text-secondary"><CheckCircleIcon className="h-4 w-4 text-text-muted mr-2 flex-shrink-0" />Email notifications</li>
                  </ul>
                  {isOnTrial ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-surface-high text-text-primary">
                      Current Plan
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium text-text-muted">
                      Trial expired
                    </div>
                  )}
                </div>

                {/* Starter Plan */}
                <div className={`border-2 rounded-xl p-6 transition-colors ${
                  isStarter ? 'border-blue-300 bg-brand-primary/5' : 'border-[rgba(65,71,84,0.15)] hover:border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Starter</h3>
                    <div className="text-2xl font-bold text-brand-primary">$49<span className="text-sm font-normal text-text-secondary">/mo</span></div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {SUBSCRIPTION_PRODUCTS.starter.features.slice(0, 8).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-text-primary">
                        <SparklesIcon className="h-4 w-4 text-brand-primary mr-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isStarter ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-brand-primary/10 text-brand-primary">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('starter')}
                      disabled={upgrading === 'starter'}
                      className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-[#0060d0] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'starter' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-surface"></div>
                      ) : (
                        <>
                          Get Starter
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Growth Plan */}
                <div className={`border-2 rounded-xl p-6 transition-colors relative ${
                  isGrowth ? 'border-blue-300 bg-brand-primary/5' : 'border-blue-200 hover:border-blue-300'
                }`}>
                  <div className="absolute -top-3 left-6">
                    <span className="bg-brand-primary text-white px-3 py-0.5 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Growth</h3>
                    <div className="text-2xl font-bold text-brand-primary">$129<span className="text-sm font-normal text-text-secondary">/mo</span></div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {SUBSCRIPTION_PRODUCTS.growth.features.slice(0, 7).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-text-primary">
                        <SparklesIcon className="h-4 w-4 text-brand-primary mr-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isGrowth ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-brand-primary/10 text-brand-primary">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('growth')}
                      disabled={upgrading === 'growth'}
                      className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-[#0060d0] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'growth' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-surface"></div>
                      ) : (
                        <>
                          {isStarter ? 'Upgrade to Growth' : 'Get Growth'}
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Pro Plan */}
                <div className={`border-2 rounded-xl p-6 transition-colors relative ${
                  isPro ? 'border-indigo-300 bg-indigo-50' : 'border-indigo-200 hover:border-indigo-300'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary">Pro</h3>
                    <div className="text-2xl font-bold text-indigo-400">$249<span className="text-sm font-normal text-text-secondary">/mo</span></div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {SUBSCRIPTION_PRODUCTS.pro.features.slice(0, 7).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-text-primary">
                        <SparklesIcon className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isPro ? (
                    <div className="w-full py-3 px-4 rounded-lg text-center text-sm font-medium bg-indigo-500/10 text-indigo-400">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade('pro')}
                      disabled={upgrading === 'pro'}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {upgrading === 'pro' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-surface"></div>
                      ) : (
                        <>
                          Upgrade to Pro
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-surface-low rounded-xl border border-[rgba(65,71,84,0.15)] mb-8">
          <div className="px-6 py-4 border-b border-[rgba(65,71,84,0.15)]">
            <h2 className="text-lg font-semibold text-text-primary">Billing History</h2>
          </div>
          <div className="p-6">
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[rgba(65,71,84,0.15)]">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(65,71,84,0.1)]">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 text-sm text-text-primary whitespace-nowrap">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {invoice.description}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap">
                          ${invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            invoice.status === 'pending' ? 'bg-accent/10 text-accent' :
                            'bg-[#93000a]/10 text-[#ffb4ab]'
                          }`}>
                            {invoice.status === 'paid' ? 'Paid' :
                             invoice.status === 'pending' ? 'Pending' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {invoice.downloadUrl && (
                            <a
                              href={invoice.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-primary hover:text-brand-primary text-sm font-medium inline-flex items-center"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <DocumentTextIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-secondary">
                  {isPaidPlan
                    ? 'Your invoices will appear here after your first billing cycle.'
                    : 'Billing history will appear here once you subscribe to a plan.'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}

function ProtectedBillingPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout business={null}>
          <div className="p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-surface-highest rounded w-1/3 mb-8"></div>
              <div className="h-64 bg-surface-highest rounded mb-6"></div>
              <div className="h-96 bg-surface-highest rounded"></div>
            </div>
          </div>
        </Layout>
      }>
        <BillingPageContent />
      </Suspense>
    </ProtectedRoute>
  )
}

export default ProtectedBillingPage
