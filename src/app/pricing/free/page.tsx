'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import {
  Check,
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  Gift,
  Clock
} from 'lucide-react'

export default function FreeTierPage() {
  return (
    <Layout business={null}>
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        {/* Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/pricing"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Pricing
          </Link>
        </div>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
              <Gift className="h-4 w-4 mr-2" />
              No Credit Card Required
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Free Forever Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Test drive VoiceFly with real features. Perfect for exploring our platform
              before scaling your business communications.
            </p>
            <div className="flex items-baseline justify-center mb-8">
              <span className="text-6xl font-bold text-gray-900">$0</span>
              <span className="text-2xl text-gray-500 ml-2">/month</span>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup?tier=free"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center"
              >
                Start Free Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold text-lg transition-all"
              >
                Compare Plans
              </Link>
            </div>
          </div>

          {/* What's Included */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Monthly Allowances */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Allowances</h2>
              <div className="space-y-4">
                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Phone className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">50 Voice Minutes</h3>
                    <p className="text-sm text-gray-600">
                      Inbound calls handled by Maya AI. Perfect for testing our voice assistant
                      with real customer interactions.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.25/minute</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">25 SMS Messages</h3>
                    <p className="text-sm text-gray-600">
                      Send appointment confirmations, reminders, and quick updates to customers.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.05/message</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Mail className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">50 Emails</h3>
                    <p className="text-sm text-gray-600">
                      Professional email campaigns to nurture leads and engage customers.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.01/email</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">10 Appointment Bookings</h3>
                    <p className="text-sm text-gray-600">
                      Automated scheduling directly through Maya without manual coordination.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.50/booking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Basic CRM</span>
                      <p className="text-sm text-gray-600">Store up to 100 contacts with notes and history</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">1 Phone Number</span>
                      <p className="text-sm text-gray-600">Local or toll-free number for your business</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Maya AI Assistant</span>
                      <p className="text-sm text-gray-600">24/7 voice-based customer service</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Analytics Dashboard</span>
                      <p className="text-sm text-gray-600">Track calls, bookings, and engagement metrics</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Call Recording</span>
                      <p className="text-sm text-gray-600">Access recordings for quality and training</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Appointment Scheduling</span>
                      <p className="text-sm text-gray-600">Let Maya book appointments automatically</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Basic Integrations</span>
                      <p className="text-sm text-gray-600">Stripe, SendGrid, and PayPal ready</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">5-Day Support Response</span>
                      <p className="text-sm text-gray-600">Email support during business hours</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Perfect For Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Perfect For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <Zap className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Testing VoiceFly</h3>
                <p className="text-sm text-gray-600">
                  Try our platform with real features before committing. No credit card needed.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <Users className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Solo Entrepreneurs</h3>
                <p className="text-sm text-gray-600">
                  Freelancers and solopreneurs handling low call volume with basic needs.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Early-Stage Startups</h3>
                <p className="text-sm text-gray-600">
                  Pre-revenue companies validating their business model and customer service flow.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              What Happens When You Hit Your Limits?
            </h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Reset</h3>
                  <p className="text-gray-600 mb-4">
                    Your allowances reset on the 1st of each month. All unused minutes, messages,
                    and bookings refresh automatically.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Example:</strong> If you use 30 of your 50 voice minutes in January,
                      you'll start February with a fresh 50 minutes.
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">When You Exceed Limits</h3>
                  <p className="text-gray-600 mb-4">
                    Free tier blocks overage usage. When you hit a limit, you'll need to upgrade
                    or wait for your monthly reset.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Pro Tip:</strong> Most free users hit their limits within 3-5 days.
                      Upgrade to Starter for just $97/month to keep your momentum going!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Path */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Scale?</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                Once you're hooked on VoiceFly, upgrade to unlock more capacity and advanced features.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="text-3xl font-bold mb-4">$97<span className="text-lg font-normal">/mo</span></div>
                <ul className="space-y-2 text-sm text-blue-100 mb-6">
                  <li>• 150 voice minutes</li>
                  <li>• 100 SMS messages</li>
                  <li>• 500 emails</li>
                  <li>• 50 bookings</li>
                  <li>• 2-day support</li>
                </ul>
                <Link
                  href="/pricing/starter"
                  className="block w-full py-3 bg-white text-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-all"
                >
                  View Starter
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/40 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-4">$297<span className="text-lg font-normal">/mo</span></div>
                <ul className="space-y-2 text-sm text-blue-100 mb-6">
                  <li>• 500 inbound + 200 outbound min</li>
                  <li>• 40 fresh leads/month</li>
                  <li>• Outbound campaigns</li>
                  <li>• Advanced automation</li>
                  <li>• 1-day support</li>
                </ul>
                <Link
                  href="/pricing/professional"
                  className="block w-full py-3 bg-white text-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-all"
                >
                  View Professional
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-4">$997<span className="text-lg font-normal">/mo</span></div>
                <ul className="space-y-2 text-sm text-blue-100 mb-6">
                  <li>• 1,000 inbound + 500 outbound</li>
                  <li>• 60 fresh leads/month</li>
                  <li>• Multi-location support</li>
                  <li>• VIP exclusive services</li>
                  <li>• 4-8 hour support</li>
                </ul>
                <Link
                  href="/pricing/enterprise"
                  className="block w-full py-3 bg-white text-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-all"
                >
                  View Enterprise
                </Link>
              </div>
            </div>
          </div>

          {/* Add-Ons Teaser */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Capacity?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Once you upgrade to a paid plan, you can purchase additional capacity and premium services
              from our Add-Ons marketplace.
            </p>
            <Link
              href="/pricing/addons"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              View Add-Ons
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Do I need a credit card to sign up?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  No! The Free plan requires no credit card. Start using VoiceFly immediately with
                  zero commitment. Only upgrade when you're ready.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  What happens if I exceed my monthly allowances?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  On the Free plan, services pause when you hit limits. You won't be charged overages.
                  You can either wait for your monthly reset or upgrade to a paid plan to continue immediately.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can I upgrade mid-month?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes! Upgrade anytime and gain immediate access to higher limits. You'll be charged
                  pro-rated for the remainder of the month, and your new allowances kick in right away.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Do my unused minutes roll over?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  No, unused monthly allowances don't roll over. They reset on the 1st of each month.
                  However, if you purchase add-on credit packs, those credits never expire and roll over forever.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Is Maya AI really free?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes! Maya AI is included in all plans, including Free. She can answer questions,
                  book appointments, take messages, and provide information to callers 24/7. The only
                  limit is the number of voice minutes included in your plan.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can I cancel anytime?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Absolutely. Since the Free plan has no commitment, you can stop using VoiceFly at any
                  time with zero obligation. If you upgrade to a paid plan, you can cancel anytime and
                  revert to the Free plan to keep your data and phone number.
                </p>
              </details>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-white border-2 border-blue-200 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Your VoiceFly Journey Today
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              No credit card required. No time limits. Just real features you can test right now.
            </p>
            <Link
              href="/signup?tier=free"
              className="inline-flex items-center px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Get Started Free
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Setup takes less than 2 minutes • Get your phone number instantly
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
