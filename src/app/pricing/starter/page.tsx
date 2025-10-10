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
  TrendingUp,
  DollarSign,
  Clock,
  Star
} from 'lucide-react'

export default function StarterTierPage() {
  return (
    <Layout business={null}>
      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
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
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4">
              <Star className="h-4 w-4 mr-2" />
              Best for Small Businesses
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Starter Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Everything you need to automate customer communications and never miss an opportunity.
              Perfect for businesses ready to scale beyond manual operations.
            </p>
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-6xl font-bold text-gray-900">$97</span>
              <span className="text-2xl text-gray-500 ml-2">/month</span>
            </div>
            <div className="text-green-600 font-semibold text-lg mb-8">
              7.4x ROI • $720 monthly revenue impact
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup?tier=starter"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center"
              >
                Start 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold text-lg transition-all"
              >
                Compare Plans
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required for trial • Cancel anytime
            </p>
          </div>

          {/* ROI Calculator */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-16">
            <div className="flex items-start">
              <TrendingUp className="h-12 w-12 text-green-600 mr-6 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Real ROI Example</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">What You Get:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>150 inbound calls handled by Maya = <strong>20 new bookings</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>100 SMS + 500 emails = <strong>30% better show-up rate</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>24/7 availability = <strong>Capture after-hours leads</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>CRM with 500 contacts = <strong>Organized follow-ups</strong></span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Financial Impact:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">20 new bookings/month</span>
                        <span className="font-semibold">×</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">Avg. $50 per booking</span>
                        <span className="font-semibold">=</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300">
                        <span className="text-gray-900 font-semibold">New Revenue</span>
                        <span className="text-xl font-bold text-green-600">$1,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">VoiceFly Cost</span>
                        <span className="text-gray-900 font-semibold">-$97</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold text-gray-900">Net Profit</span>
                        <span className="text-2xl font-bold text-green-600">$903</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    <h3 className="font-semibold text-gray-900 mb-1">150 Inbound Voice Minutes</h3>
                    <p className="text-sm text-gray-600">
                      Let Maya handle customer calls 24/7. Average call: 6 minutes = 25 calls/month.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.25/minute</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100 SMS Messages</h3>
                    <p className="text-sm text-gray-600">
                      Appointment reminders, confirmations, and follow-ups to reduce no-shows.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.05/message</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Mail className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">500 Emails</h3>
                    <p className="text-sm text-gray-600">
                      Nurture campaigns, newsletters, and promotional offers to drive repeat business.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.01/email</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">50 Appointment Bookings</h3>
                    <p className="text-sm text-gray-600">
                      Fully automated scheduling. Maya books appointments without you lifting a finger.
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
                      <span className="font-semibold text-gray-900">Enhanced CRM</span>
                      <p className="text-sm text-gray-600">Store up to 500 contacts with full conversation history</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">1 Phone Number</span>
                      <p className="text-sm text-gray-600">Local or toll-free number with instant setup</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Maya AI Assistant</span>
                      <p className="text-sm text-gray-600">Advanced voice AI with natural conversations</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Advanced Analytics</span>
                      <p className="text-sm text-gray-600">Track conversion rates, peak call times, and ROI metrics</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Call Recording & Transcripts</span>
                      <p className="text-sm text-gray-600">Review conversations with searchable transcripts</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Smart Appointment Scheduling</span>
                      <p className="text-sm text-gray-600">Calendar sync with automatic reminders</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Email Campaigns</span>
                      <p className="text-sm text-gray-600">Build and send professional email campaigns</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Custom Workflows</span>
                      <p className="text-sm text-gray-600">Automate follow-ups based on call outcomes</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Basic Integrations</span>
                      <p className="text-sm text-gray-600">Stripe, SendGrid, PayPal ready to go</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">2-Day Support Response</span>
                      <p className="text-sm text-gray-600">Priority email support during business hours</p>
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
                <Users className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Solo Practitioners</h3>
                <p className="text-sm text-gray-600">
                  Lawyers, consultants, and coaches who need a professional front office without hiring staff.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <Zap className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Service Businesses</h3>
                <p className="text-sm text-gray-600">
                  Salons, spas, repair shops, and clinics that need reliable appointment booking.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Growing Startups</h3>
                <p className="text-sm text-gray-600">
                  Early-stage companies scaling customer service without burning cash on hiring.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison to Free */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Upgrade from Free?
            </h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Free Plan</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>50 voice minutes (burns in 3 days)</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>25 SMS (not enough for reminders)</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>10 bookings (limits growth)</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>100 contacts (fills up fast)</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>5-day support response</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 bg-blue-50 border-l-4 border-blue-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Starter Plan</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>150 voice minutes</strong> (full month of calls)</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>100 SMS + 500 emails</strong> (real communication)</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>50 bookings</strong> (scale without limits)</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>500 contacts</strong> (room to grow)</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>2-day support</strong> (faster help)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Add-Ons Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Need More Capacity?</h2>
            <p className="text-gray-600 mb-6 text-center max-w-2xl mx-auto">
              Easily add extra minutes, messages, or phone numbers from our Add-Ons marketplace.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <Phone className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">+500 Voice Minutes</div>
                <div className="text-sm text-gray-600">$149/month</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">+500 SMS Messages</div>
                <div className="text-sm text-gray-600">$49/month</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <Phone className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Extra Phone Number</div>
                <div className="text-sm text-gray-600">$49/month</div>
              </div>
            </div>
            <div className="text-center">
              <Link
                href="/pricing/addons"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                View All Add-Ons
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Upgrade Path */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Ready for More?</h2>
              <p className="text-purple-100 text-lg max-w-2xl mx-auto">
                Outgrow Starter? Upgrade to Professional or Enterprise for outbound calling,
                lead generation, and advanced automation.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/40 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-4">$297<span className="text-lg font-normal">/mo</span></div>
                <ul className="space-y-2 text-sm text-purple-100 mb-6">
                  <li>• 500 inbound + 200 outbound minutes</li>
                  <li>• 40 fresh leads per month</li>
                  <li>• Outbound calling campaigns</li>
                  <li>• Advanced workflow automation</li>
                  <li>• 1-day support response</li>
                </ul>
                <Link
                  href="/pricing/professional"
                  className="block w-full py-3 bg-white text-purple-600 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all"
                >
                  View Professional
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-3xl font-bold mb-4">$997<span className="text-lg font-normal">/mo</span></div>
                <ul className="space-y-2 text-sm text-purple-100 mb-6">
                  <li>• 1,000 inbound + 500 outbound minutes</li>
                  <li>• 60 fresh leads per month</li>
                  <li>• Multi-location support (up to 5)</li>
                  <li>• VIP exclusive services & white-glove treatment</li>
                  <li>• 4-8 hour priority support</li>
                </ul>
                <Link
                  href="/pricing/enterprise"
                  className="block w-full py-3 bg-white text-purple-600 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all"
                >
                  View Enterprise
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  What happens if I exceed my monthly allowances?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  We automatically charge overage fees: $0.25/minute for voice, $0.05/SMS, $0.01/email,
                  and $0.50/booking. You'll get a notification when you hit 80% of your monthly limits
                  so you can upgrade or purchase add-ons if needed.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can I cancel my subscription anytime?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes! Cancel anytime and you can downgrade to the Free plan to keep your data,
                  phone number, and contacts. You won't lose anything—just access to the higher limits
                  and premium features.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Do I get a dedicated phone number?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes! The Starter plan includes 1 dedicated phone number (local or toll-free). You can
                  add additional numbers for $49/month each from the Add-Ons page.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  How does the 14-day trial work?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  We don't require a credit card for the trial. Start with full Starter features for
                  14 days. When the trial ends, you can add payment to continue or downgrade to the
                  Free plan automatically.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can Maya handle complex customer questions?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Maya is powered by advanced AI and can handle FAQs, book appointments, take messages,
                  provide business information, and transfer calls when needed. You can customize her
                  knowledge base with your specific business info, pricing, and policies.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  How fast is the 2-day support response?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  We aim to respond within 2 business days (Monday-Friday). Most inquiries get answered
                  within 24 hours. For faster support (4-8 hours), consider upgrading to Enterprise or
                  adding the Dedicated Manager service.
                </p>
              </details>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-white border-2 border-blue-200 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Your 14-Day Free Trial
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              No credit card required. Full access to all Starter features. Cancel anytime.
            </p>
            <Link
              href="/signup?tier=starter"
              className="inline-flex items-center px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Try Starter Free for 14 Days
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              7.4x ROI • Setup in 2 minutes • Instant phone number
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
