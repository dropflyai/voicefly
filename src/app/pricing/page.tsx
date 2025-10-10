"use client"

import { useState } from 'react'
import SEOOptimization from '../../components/SEOOptimization'
import {
  CheckCircle,
  Star,
  ArrowRight,
  Mic,
  Phone,
  Sparkles,
  Zap,
  Users,
  Building
} from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      subtitle: 'Try before you buy',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: Sparkles,
      color: 'green',
      highlights: [
        '50 voice minutes/month',
        '25 SMS messages',
        '10 appointment bookings',
        'Basic CRM (100 contacts)'
      ],
      roi: 'Perfect for testing',
      badge: 'No credit card'
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'For solopreneurs',
      monthlyPrice: 97,
      yearlyPrice: 82,
      icon: Zap,
      color: 'blue',
      highlights: [
        '150 inbound voice minutes',
        '100 SMS + 500 emails',
        '50 appointment bookings',
        'CRM with 500 contacts'
      ],
      roi: '7.4x ROI',
      badge: null
    },
    {
      id: 'professional',
      name: 'Professional',
      subtitle: 'For growing businesses',
      monthlyPrice: 297,
      yearlyPrice: 247,
      icon: Users,
      color: 'purple',
      highlights: [
        '500 inbound + 200 outbound',
        '40 AI-generated leads/month',
        'Lead automation workflows',
        '5 user seats'
      ],
      roi: '11x ROI',
      badge: 'Most Popular',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      subtitle: 'Multi-location scale',
      monthlyPrice: 997,
      yearlyPrice: 830,
      icon: Building,
      color: 'indigo',
      highlights: [
        '1,000 inbound + 500 outbound',
        '60 premium leads/month',
        'Multi-location (up to 3)',
        'White-label available'
      ],
      roi: '36x ROI',
      badge: null
    }
  ]

  const getPrice = (plan: any) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getSavings = (plan: any) => {
    if (billingPeriod === 'yearly' && plan.monthlyPrice > 0) {
      return Math.round(((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100)
    }
    return 0
  }

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover') => {
    const colorMap: any = {
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600',
        border: 'border-green-500',
        hover: 'hover:bg-green-600'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-500',
        hover: 'hover:bg-blue-600'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-500',
        hover: 'hover:bg-purple-600'
      },
      indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-600',
        border: 'border-indigo-500',
        hover: 'hover:bg-indigo-600'
      }
    }
    return colorMap[color]?.[variant] || ''
  }

  return (
    <>
      <SEOOptimization
        page="pricing"
        canonicalUrl="https://voicefly.ai/pricing"
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">VoiceFly</span>
              </Link>

              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="pt-16 pb-12 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Pricing That Makes You Money
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Start free, scale up. Each tier pays for itself 7-36x over.
            </p>
            <p className="text-sm text-gray-500">
              No contracts • Cancel anytime • Overage protection
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8">
              <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  billingPeriod === 'yearly' ? 'transform translate-x-6 bg-blue-600' : ''
                }`} />
              </button>
              <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                Yearly
              </span>
              {billingPeriod === 'yearly' && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                  Save up to 17%
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Simplified Pricing Cards */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-xl shadow-lg border-2 transition-all hover:shadow-2xl ${
                      plan.popular ? 'border-purple-500 lg:scale-105' : 'border-gray-200'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className={`${
                          plan.popular ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-700'
                        } px-3 py-1 rounded-full text-xs font-semibold`}>
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Icon & Name */}
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 ${getColorClasses(plan.color, 'bg')} bg-opacity-10 rounded-lg flex items-center justify-center mr-3`}>
                          <Icon className={`h-6 w-6 ${getColorClasses(plan.color, 'text')}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                          <p className="text-xs text-gray-500">{plan.subtitle}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {plan.monthlyPrice === 0 ? (
                          <div>
                            <span className="text-4xl font-bold text-gray-900">Free</span>
                            <div className="text-xs text-gray-600 mt-1">Forever</div>
                          </div>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                            <span className="text-gray-600 text-sm">/mo</span>
                            {billingPeriod === 'yearly' && getSavings(plan) > 0 && (
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                Save {getSavings(plan)}%
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Highlights */}
                      <ul className="space-y-2 mb-4">
                        {plan.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>

                      {/* ROI Badge */}
                      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                        <span className="text-xs font-semibold text-green-700">{plan.roi}</span>
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/pricing/${plan.id}`}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                          plan.popular
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : `${getColorClasses(plan.color, 'bg')} text-white ${getColorClasses(plan.color, 'hover')}`
                        }`}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>

                      <p className="text-center text-xs text-gray-500 mt-3">
                        Click to see full details
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Add-Ons CTA */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need More? Check Out Our Add-Ons
            </h2>
            <p className="text-gray-600 mb-6">
              Extra locations, white-label, custom development, and more
            </p>
            <Link
              href="/pricing/addons"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View All Add-Ons
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* ROI Example */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-white mb-8">
              <h2 className="text-3xl font-bold mb-4">
                See How It Pays For Itself
              </h2>
              <p className="text-blue-100">
                Real example from a hair salon using the Starter tier
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">$97</div>
                  <div className="text-sm text-gray-600">Monthly Cost</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">$720</div>
                  <div className="text-sm text-gray-600">Extra Revenue/Month</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">7.4x</div>
                  <div className="text-sm text-gray-600">Return on Investment</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Captures 12 missed calls per month = 12 new appointments at $60 each = <span className="font-bold">$623 profit after costs</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is Free really free?</h3>
                <p className="text-sm text-gray-600">Yes! 50 voice minutes, 25 SMS, and more every month. No credit card required.</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I change plans?</h3>
                <p className="text-sm text-gray-600">Upgrade or downgrade anytime. No penalties or commitments.</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What if I exceed limits?</h3>
                <p className="text-sm text-gray-600">We notify you at 80%. Pay overage rates or upgrade for better value.</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do minutes roll over?</h3>
                <p className="text-sm text-gray-600">No, they reset monthly to keep pricing simple and predictable.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Start Free Today
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              No credit card required. See results in your first week.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center">
                Start Free Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/pricing/addons" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
                View Add-Ons
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-6 text-blue-100 text-sm">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Free forever tier
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                No contracts
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Cancel anytime
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <Phone className="h-6 w-6 text-blue-400 mr-2" />
                  <span className="text-xl font-bold">VoiceFly</span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI-powered business automation that pays for itself
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/features" className="hover:text-white">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/pricing/addons" className="hover:text-white">Add-Ons</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                  <li><Link href="/signup" className="hover:text-white">Get Started</Link></li>
                  <li><Link href="mailto:hello@voiceflyai.com" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 VoiceFly. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">SOC 2 Certified</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
