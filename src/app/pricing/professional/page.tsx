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
  Crown,
  Target,
  Sparkles,
  PhoneOutgoing
} from 'lucide-react'

export default function ProfessionalTierPage() {
  return (
    <Layout business={null}>
      <div className="bg-gradient-to-b from-purple-50 to-white min-h-screen">
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
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mb-4">
              <Crown className="h-4 w-4 mr-2" />
              Most Popular Plan
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Professional Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Go beyond answering calls—proactively grow your business with outbound campaigns,
              fresh leads, and advanced automation that drives revenue on autopilot.
            </p>
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-6xl font-bold text-gray-900">$297</span>
              <span className="text-2xl text-gray-500 ml-2">/month</span>
            </div>
            <div className="text-green-600 font-semibold text-lg mb-8">
              36x ROI • $10,800 monthly revenue impact
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup?tier=professional"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center"
              >
                Get Started Now
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
              Start with Free tier, upgrade anytime • Cancel anytime
            </p>
          </div>

          {/* ROI Calculator */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-16">
            <div className="flex items-start">
              <TrendingUp className="h-12 w-12 text-green-600 mr-6 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Real ROI Example: Home Services Business</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">What You Get:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>500 inbound minutes = <strong>80 incoming calls handled</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>200 outbound minutes = <strong>35 proactive campaigns</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>40 fresh leads/month = <strong>Qualified prospects delivered</strong></span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Advanced automation = <strong>Zero manual follow-up</strong></span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Financial Impact:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">60 new customers/month</span>
                        <span className="font-semibold">×</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">Avg. $200 per job</span>
                        <span className="font-semibold">=</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300">
                        <span className="text-gray-900 font-semibold">New Revenue</span>
                        <span className="text-xl font-bold text-green-600">$12,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">VoiceFly Cost</span>
                        <span className="text-gray-900 font-semibold">-$297</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-700">Lead acquisition cost</span>
                        <span className="text-gray-900 font-semibold">-$900</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold text-gray-900">Net Profit</span>
                        <span className="text-2xl font-bold text-green-600">$10,803</span>
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
                <div className="flex items-start bg-white border-2 border-purple-200 rounded-lg p-4">
                  <Phone className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">500 Inbound Voice Minutes</h3>
                    <p className="text-sm text-gray-600">
                      Handle up to 80 customer calls per month with Maya AI. Never miss an opportunity.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.25/minute</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border-2 border-purple-200 rounded-lg p-4">
                  <PhoneOutgoing className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">200 Outbound Voice Minutes</h3>
                    <p className="text-sm text-gray-600">
                      Proactive campaigns to follow up with leads, reactivate past customers, and drive sales.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.35/minute</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border-2 border-purple-200 rounded-lg p-4">
                  <Target className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">40 Fresh Leads</h3>
                    <p className="text-sm text-gray-600">
                      Qualified prospects delivered monthly. Targeted by industry, location, and business size.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $3 per lead</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <MessageSquare className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">250 SMS Messages</h3>
                    <p className="text-sm text-gray-600">
                      Reminders, confirmations, and promotional campaigns to boost engagement.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.05/message</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Mail className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">1,000 Emails</h3>
                    <p className="text-sm text-gray-600">
                      Drip campaigns, newsletters, and nurture sequences on autopilot.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.01/email</p>
                  </div>
                </div>

                <div className="flex items-start bg-white border border-gray-200 rounded-lg p-4">
                  <Calendar className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100 Appointment Bookings</h3>
                    <p className="text-sm text-gray-600">
                      Fully automated scheduling with Maya handling all coordination and reminders.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Overage: $0.50/booking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Features</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Advanced CRM</span>
                      <p className="text-sm text-gray-600">Up to 2,500 contacts with segmentation and tagging</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Outbound Campaigns</span>
                      <p className="text-sm text-gray-600">Automated calling and SMS campaigns to drive revenue</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Lead Generation</span>
                      <p className="text-sm text-gray-600">40 fresh, qualified leads delivered every month</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">2 Phone Numbers</span>
                      <p className="text-sm text-gray-600">Multiple lines for different campaigns or locations</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Maya AI Assistant</span>
                      <p className="text-sm text-gray-600">Advanced natural language processing and custom training</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Advanced Analytics</span>
                      <p className="text-sm text-gray-600">Revenue attribution, conversion funnels, and cohort analysis</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Call Recording & Transcripts</span>
                      <p className="text-sm text-gray-600">Searchable transcripts with sentiment analysis</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Advanced Workflow Automation</span>
                      <p className="text-sm text-gray-600">Multi-step sequences triggered by customer behavior</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Email & SMS Campaigns</span>
                      <p className="text-sm text-gray-600">Drag-and-drop builders with A/B testing</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">Priority Integrations</span>
                      <p className="text-sm text-gray-600">Stripe, SendGrid, PayPal with priority support</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">1-Day Support Response</span>
                      <p className="text-sm text-gray-600">Priority email support with 1 business day response</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Perfect For Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Perfect For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Growing Businesses</h3>
                <p className="text-sm text-gray-600">
                  Companies ready to scale beyond reactive customer service and start proactive revenue generation.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <Target className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Lead-Hungry Sales Teams</h3>
                <p className="text-sm text-gray-600">
                  Businesses that need a steady stream of qualified prospects to feed their sales pipeline.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <Zap className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Multi-Service Providers</h3>
                <p className="text-sm text-gray-600">
                  Home services, contractors, agencies running multiple campaigns and needing automation.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison to Starter */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Professional vs. Starter
            </h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Starter Plan - $97/mo</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>150 inbound only (reactive)</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>No outbound campaigns</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>No lead generation</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>Basic workflows</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>500 contacts max</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <span className="mr-3">•</span>
                      <span>2-day support</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 bg-purple-50 border-l-4 border-purple-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Professional Plan - $297/mo</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>500 inbound + 200 outbound</strong> (proactive growth)</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>Outbound campaigns</strong> to drive sales</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>40 fresh leads/month</strong> delivered</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>Advanced automation</strong> workflows</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>2,500 contacts</strong> with segmentation</span>
                    </li>
                    <li className="flex items-start text-gray-900">
                      <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span><strong>1-day priority support</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Add-Ons Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Scale Even Further</h2>
            <p className="text-gray-600 mb-6 text-center max-w-2xl mx-auto">
              Need more capacity? Add extra minutes, leads, or premium services from our marketplace.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <Phone className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">+500 Voice Minutes</div>
                <div className="text-sm text-gray-600">$149/month</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">+50 Additional Leads</div>
                <div className="text-sm text-gray-600">$99/month</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <Phone className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Extra Phone Number</div>
                <div className="text-sm text-gray-600">$49/month</div>
              </div>
            </div>
            <div className="text-center">
              <Link
                href="/pricing/addons"
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
              >
                View All Add-Ons
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Upgrade to Enterprise */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-8 mb-16">
            <div className="text-center mb-8">
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ready for VIP Treatment?</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Upgrade to Enterprise for multi-location support, white-glove service, and exclusive
                access to premium services not available at any other tier.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Enterprise - $997/mo</h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li>• 1,000 inbound + 500 outbound minutes</li>
                    <li>• 60 fresh leads per month</li>
                    <li>• Multi-location support (up to 5)</li>
                    <li>• Up to 10,000 contacts</li>
                    <li>• 4-8 hour support response</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-yellow-400">VIP Exclusive Services:</h4>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li>• White-label branding options</li>
                    <li>• Dedicated account manager</li>
                    <li>• Done-for-you campaign setup</li>
                    <li>• Custom website builds</li>
                    <li>• SEO & lead gen services</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/pricing/enterprise"
                  className="inline-flex items-center px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg font-bold text-lg transition-all"
                >
                  Explore Enterprise
                  <Crown className="ml-2 h-5 w-5" />
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
                  How do the fresh leads work?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  We deliver 40 qualified leads per month based on your target criteria (industry, location,
                  business size). Leads are vetted through our Apollo API integration and delivered directly
                  to your CRM. You own the leads forever—use them for outbound campaigns or nurture sequences.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  What's the difference between inbound and outbound minutes?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  <strong>Inbound minutes</strong> are when customers call you—Maya answers and handles the call.
                  <strong>Outbound minutes</strong> are when you proactively call leads, past customers, or prospects
                  to drive sales. Outbound is more expensive ($0.35/min overage) because it includes dialing costs.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can I customize Maya for my specific business?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Absolutely! Professional plan includes advanced Maya training. Upload your FAQs, pricing,
                  policies, and scripts. Maya learns your business and speaks with your brand voice. You
                  can also customize call flows and transfer rules.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  What happens if I exceed my monthly limits?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  We automatically charge overage fees: $0.25/min inbound voice, $0.35/min outbound voice,
                  $0.05/SMS, $0.01/email, $0.50/booking, and $3 per extra lead. You'll receive notifications
                  at 80% and 100% of your limits. Alternatively, purchase add-on packs for better rates.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Can I downgrade to Starter if Professional is too much?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes! You can downgrade anytime. You'll keep all your data, contacts, and phone numbers.
                  You'll lose access to outbound campaigns and lead generation, but all your historical
                  data stays intact. Downgrade takes effect at the end of your current billing cycle.
                </p>
              </details>

              <details className="bg-white border border-gray-200 rounded-lg p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  How quickly will I see ROI?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">
                  Most Professional customers see positive ROI within the first month. The combination of
                  never missing inbound calls + proactive outbound campaigns + fresh leads typically generates
                  10-20 new customers in month one. Even at modest ticket sizes ($100-200), that's $1,000-4,000
                  in new revenue against the $297 investment.
                </p>
              </details>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-white border-2 border-purple-200 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Growing Proactively Today
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Start with Free tier, upgrade to Professional when ready. Full access to outbound campaigns,
              lead generation, and advanced automation.
            </p>
            <Link
              href="/signup?tier=professional"
              className="inline-flex items-center px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Get Started with Professional
              <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              36x ROI • Cancel anytime • Keep your data forever
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
