"use client"

import { useState } from 'react'
import {
  CheckCircle,
  X,
  Star,
  ArrowRight,
  Mic,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'For businesses getting started with AI',
      monthlyPrice: 49,
      yearlyPrice: 42,
      description: 'Your AI employee answers calls, books appointments, and sends confirmations via text.',
      features: [
        '100 AI voice minutes/month',
        '1 AI employee',
        '24/7 call answering',
        'Appointment booking',
        'Lead capture',
        'SMS appointment confirmations',
        'Call analytics dashboard',
        'Email support'
      ],
      limitations: [
        'AI SMS conversations',
        'Custom call scripts',
        'Multiple AI employees',
        'Priority support'
      ],
      cta: 'Start 14-Day Trial',
      popular: false,
      overage: '$0.15/additional minute'
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: 'For busy businesses ready to grow',
      monthlyPrice: 199,
      yearlyPrice: 169,
      description: 'Everything in Starter plus AI-powered SMS conversations, custom scripts, and advanced analytics.',
      features: [
        '1,000 AI voice minutes/month',
        'Up to 5 AI employees',
        '24/7 call answering',
        'Appointment booking',
        'Lead capture',
        'AI SMS conversations',
        'SMS appointment reminders',
        'Custom call scripts',
        'Advanced analytics dashboard',
        'Voice customization',
        'API access',
        'Priority support'
      ],
      limitations: [],
      cta: 'Start 14-Day Trial',
      popular: true,
      overage: '$0.12/additional minute'
    }
  ]

  const features = [
    {
      category: 'AI Voice & Calls',
      items: [
        { name: 'AI voice minutes per month', starter: '100', pro: '1,000' },
        { name: 'AI employees included', starter: '1', pro: '5' },
        { name: 'Overage pricing', starter: '$0.15/min', pro: '$0.12/min' },
        { name: '24/7 call answering', starter: true, pro: true },
        { name: 'Voice customization', starter: false, pro: true }
      ]
    },
    {
      category: 'SMS & Messaging',
      items: [
        { name: 'SMS appointment confirmations', starter: true, pro: true },
        { name: 'SMS appointment reminders', starter: false, pro: true },
        { name: 'AI SMS conversations', starter: false, pro: true },
        { name: 'Book appointments via text', starter: false, pro: true }
      ]
    },
    {
      category: 'Booking & Clients',
      items: [
        { name: 'Appointment booking', starter: true, pro: true },
        { name: 'Lead capture', starter: true, pro: true },
        { name: 'Custom call scripts', starter: false, pro: true },
        { name: 'Calendar integration', starter: true, pro: true }
      ]
    },
    {
      category: 'Analytics & Integrations',
      items: [
        { name: 'Call analytics dashboard', starter: true, pro: true },
        { name: 'Advanced analytics', starter: false, pro: true },
        { name: 'API access', starter: false, pro: true },
        { name: 'Data export', starter: false, pro: true }
      ]
    },
    {
      category: 'Support',
      items: [
        { name: 'Support', starter: 'Email', pro: 'Priority' },
        { name: 'Onboarding', starter: 'Self-service', pro: 'Guided setup' }
      ]
    }
  ]

  const faq = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What happens if I exceed my monthly minutes?",
      answer: "We'll notify you when you reach 80% of your minute allocation. Overage minutes are billed at $0.15/min (Starter) or $0.12/min (Pro)."
    },
    {
      question: "How does the 14-day trial work?",
      answer: "Your trial includes full access to your plan's features. No credit card required at signup. If you love it, add payment details before day 14 to continue."
    },
    {
      question: "How quickly can I get set up?",
      answer: "Most businesses are up and running in under 10 minutes. Choose your AI voice, set your greeting, and your receptionist starts answering calls immediately."
    },
    {
      question: "Will clients know they're talking to AI?",
      answer: "Our AI voices sound natural and conversational. Many clients won't notice the difference. The AI handles bookings, answers questions about services, and takes messages just like a human receptionist."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel your subscription at any time. No cancellation fees. You'll retain access until the end of your billing period."
    }
  ]

  const getPrice = (plan: typeof plans[0]) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (billingPeriod === 'yearly') {
      const monthlyCost = plan.monthlyPrice * 12
      const yearlyCost = plan.yearlyPrice * 12
      return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100)
    }
    return 0
  }

  return (
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
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            AI Receptionist Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Stop missing calls. Start with a 14-day free trial.
          </p>

          {/* Founding Offer */}
          <div className="inline-flex items-center bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4 mr-2" />
            Founding customer? Get 50% off for life.{' '}
            <Link href="/founding" className="underline ml-1 font-semibold">Learn more</Link>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center">
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
                Save ~15%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.popular ? 'border-blue-500 md:scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.subtitle}</p>

                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">${getPrice(plan)}</span>
                      <span className="text-gray-600">/month</span>
                      {billingPeriod === 'yearly' && (
                        <div className="text-sm text-green-600 font-semibold mt-1">
                          Save {getSavings(plan)}% annually
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start opacity-50">
                        <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors block text-center ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Overage Pricing */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      Additional minutes: {plan.overage}
                    </p>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    14-day trial - No credit card needed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Callout */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How much revenue are you losing to missed calls?
          </h2>
          <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-red-600">5</div>
                <div className="text-sm text-gray-600">missed calls/week</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">x $80</div>
                <div className="text-sm text-gray-600">avg service value</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">= $1,600/mo</div>
                <div className="text-sm text-gray-600">lost revenue</div>
              </div>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              VoiceFly pays for itself by capturing just 1 extra booking per week.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare Plans
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header Row */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="font-bold text-gray-900">Features</div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">Starter</div>
                  <div className="text-xs text-gray-600">${billingPeriod === 'yearly' ? '42' : '49'}/mo</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600 flex items-center justify-center">
                    <Star className="h-3 w-3 mr-1" />
                    Pro
                  </div>
                  <div className="text-xs text-gray-600">${billingPeriod === 'yearly' ? '169' : '199'}/mo</div>
                </div>
              </div>
            </div>

            {features.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {category.category}
                  </h3>
                </div>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-3 gap-3 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-center">
                      {typeof item.starter === 'boolean' ? (
                        item.starter ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400" />
                          </div>
                        )
                      ) : (
                        <div className="bg-gray-100 rounded px-2 py-1 text-xs font-medium text-gray-700">
                          {item.starter}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.pro === 'boolean' ? (
                        item.pro ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400" />
                          </div>
                        )
                      ) : (
                        <div className="bg-blue-100 rounded px-2 py-1 text-xs font-medium text-blue-700">
                          {item.pro}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Bottom CTA Row */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3">
              <div className="grid grid-cols-3 gap-3">
                <div></div>
                <div className="text-center">
                  <Link href="/signup" className="inline-block w-full bg-gray-200 text-gray-900 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">
                    Start Trial
                  </Link>
                </div>
                <div className="text-center">
                  <Link href="/signup" className="inline-block w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Start Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faq.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Never Miss a Client Call Again
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your 14-day trial today. Set up in under 10 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-6 text-blue-100 text-sm">
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              14-day trial
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              No credit card needed
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
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Phone className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold">VoiceFly</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI receptionist for appointment-based businesses
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/beauty" className="hover:text-white">For Salons & Spas</Link></li>
                <li><Link href="/signup" className="hover:text-white">Start Trial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="mailto:hello@voiceflyai.com" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © 2026 VoiceFly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
