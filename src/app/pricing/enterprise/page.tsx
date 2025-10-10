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
  PhoneOutgoing,
  Shield,
  Award,
  Star,
  Building2,
  HeartHandshake,
  Gem
} from 'lucide-react'

export default function EnterpriseTierPage() {
  return (
    <Layout business={null}>
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white">
        {/* Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/pricing"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Pricing
          </Link>
        </div>

        {/* Hero Section - Luxury Positioning */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-16">
            <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <div className="inline-flex items-center px-4 py-2 bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-semibold mb-4 border border-yellow-400/40">
              <Gem className="h-4 w-4 mr-2" />
              Exclusive VIP Membership
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 text-transparent bg-clip-text">
              Enterprise VIP
            </h1>
            <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Welcome to an exclusive tier of service reserved for businesses that demand excellence.
              As an Enterprise member, you gain access to white-glove treatment and premium services
              not available anywhere else.
            </p>
            <div className="flex items-baseline justify-center mb-3">
              <span className="text-6xl font-bold">$997</span>
              <span className="text-2xl text-gray-400 ml-2">/month</span>
            </div>
            <div className="text-yellow-400 font-semibold text-lg mb-12">
              VIP exclusive benefits • White-glove service • Priority everything
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/enterprise/contact"
                className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 rounded-lg font-bold text-xl shadow-2xl hover:shadow-yellow-400/50 transition-all inline-flex items-center"
              >
                Request VIP Access
                <Crown className="ml-3 h-6 w-6" />
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              Personal consultation required • Invitation-only benefits
            </p>
          </div>

          {/* VIP Experience Section */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-2 border-yellow-400/40 rounded-2xl p-10 mb-16 backdrop-blur-sm">
            <div className="text-center mb-10">
              <HeartHandshake className="h-14 w-14 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-bold mb-4">The Enterprise VIP Experience</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                This isn't just a subscription—it's membership in an exclusive circle where your
                business receives treatment reserved for our most valued partners.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/20">
                <Shield className="h-10 w-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">White-Glove Onboarding</h3>
                <p className="text-gray-300">
                  Personal consultation, custom setup, and dedicated training. We handle everything
                  so you can focus on growing your business.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/20">
                <Award className="h-10 w-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">Priority Access</h3>
                <p className="text-gray-300">
                  4-8 hour support response, priority feature requests, and first access to new
                  capabilities before anyone else.
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/20">
                <Sparkles className="h-10 w-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">Exclusive Services</h3>
                <p className="text-gray-300">
                  Access premium services unavailable to other tiers—from done-for-you campaigns
                  to custom development and strategic marketing.
                </p>
              </div>
            </div>
          </div>

          {/* What's Included - Platform Capacity */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-10 text-center">Your Enterprise Foundation</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Core Capacity */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-yellow-400">Core Platform Capacity</h3>
                <div className="space-y-5">
                  <div className="flex items-start">
                    <Phone className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">1,000 Inbound Voice Minutes</h4>
                      <p className="text-sm text-gray-400">Up to 165 customer calls handled per month</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <PhoneOutgoing className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">500 Outbound Voice Minutes</h4>
                      <p className="text-sm text-gray-400">Proactive campaigns to drive revenue</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Target className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">60 Fresh Leads Monthly</h4>
                      <p className="text-sm text-gray-400">Qualified prospects delivered to your CRM</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MessageSquare className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">500 SMS Messages</h4>
                      <p className="text-sm text-gray-400">Multi-channel customer engagement</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">2,500 Emails</h4>
                      <p className="text-sm text-gray-400">Sophisticated drip campaigns and newsletters</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 text-yellow-400 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-lg mb-1">200 Appointment Bookings</h4>
                      <p className="text-sm text-gray-400">Automated scheduling at scale</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-yellow-400">Advanced Capabilities</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">Enterprise CRM</span>
                      <p className="text-sm text-gray-400">Up to 10,000 contacts with advanced segmentation</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">Multi-Location Support</span>
                      <p className="text-sm text-gray-400">Manage up to 5 locations from one account</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">5 Phone Numbers Included</span>
                      <p className="text-sm text-gray-400">Separate lines for each location or campaign</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">Advanced Maya AI Training</span>
                      <p className="text-sm text-gray-400">Custom personality and industry-specific knowledge</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">Enterprise Analytics</span>
                      <p className="text-sm text-gray-400">Multi-location reporting and custom dashboards</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">Advanced Automation</span>
                      <p className="text-sm text-gray-400">Complex multi-step workflows across all channels</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">API Access</span>
                      <p className="text-sm text-gray-400">Integrate VoiceFly with your existing systems</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold">4-8 Hour Priority Support</span>
                      <p className="text-sm text-gray-400">M-F business hours with dedicated team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VIP Exclusive Services - The Key Differentiator */}
          <div className="bg-gradient-to-br from-yellow-400/20 via-yellow-600/20 to-orange-600/20 border-2 border-yellow-400/60 rounded-2xl p-12 mb-16 backdrop-blur-sm">
            <div className="text-center mb-12">
              <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Exclusive VIP Services</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                As an Enterprise member, you unlock premium services available only to our VIP circle.
                These aren't add-ons—they're invitations to invest in services that accelerate your growth.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Premium Services - Enterprise Only */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/40">
                <div className="flex items-center mb-6">
                  <Gem className="h-8 w-8 text-yellow-400 mr-3" />
                  <h3 className="text-2xl font-bold">Premium Services</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">White-Label Branding</span>
                      <span className="text-yellow-400 font-bold">$299/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">Remove VoiceFly branding and use your own logo across all touchpoints</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Dedicated Account Manager</span>
                      <span className="text-yellow-400 font-bold">$999/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">Personal strategist with 2-hour response time and bi-weekly optimization calls</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Done-For-You Campaigns</span>
                      <span className="text-yellow-400 font-bold">$999/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">We create, launch, and optimize your campaigns while you focus on closing deals</p>
                  </div>
                </div>
              </div>

              {/* Custom Development - Enterprise Only */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/40">
                <div className="flex items-center mb-6">
                  <Sparkles className="h-8 w-8 text-yellow-400 mr-3" />
                  <h3 className="text-2xl font-bold">Custom Development</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Template Website</span>
                      <span className="text-yellow-400 font-bold">$2K-$5K</span>
                    </div>
                    <p className="text-sm text-gray-400">Professional site from our proven templates, deployed in 2 weeks</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Custom Website Build</span>
                      <span className="text-yellow-400 font-bold">$5K-$20K</span>
                    </div>
                    <p className="text-sm text-gray-400">Fully custom design and development tailored to your brand</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Custom Integrations</span>
                      <span className="text-yellow-400 font-bold">$2.5K-$10K</span>
                    </div>
                    <p className="text-sm text-gray-400">Connect VoiceFly to your CRM, ERP, or proprietary systems</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">AI Training & Optimization</span>
                      <span className="text-yellow-400 font-bold">$499 one-time</span>
                    </div>
                    <p className="text-sm text-gray-400">Deep Maya training for complex industry-specific scenarios</p>
                  </div>
                </div>
              </div>

              {/* Marketing Services - Enterprise Only */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-yellow-400/40 md:col-span-2">
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-8 w-8 text-yellow-400 mr-3" />
                  <h3 className="text-2xl font-bold">Strategic Marketing Services</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">SEO Services</span>
                      <span className="text-yellow-400 font-bold">$1.5K-$2.5K/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">Technical SEO, content strategy, and link building to dominate local search</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Lead Generation</span>
                      <span className="text-yellow-400 font-bold">$2K-$3.5K/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">Paid ads, landing pages, and conversion optimization managed for you</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">Campaign Management</span>
                      <span className="text-yellow-400 font-bold">$2.5K/mo</span>
                    </div>
                    <p className="text-sm text-gray-400">Full-service campaign strategy, execution, and ongoing optimization</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-300 mb-6">
                These services are exclusively available to Enterprise members. Consider them your invitation
                to invest in strategic growth with partners who understand your business.
              </p>
              <Link
                href="/pricing/addons"
                className="inline-flex items-center px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg font-bold text-lg transition-all"
              >
                Explore All VIP Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* ROI Example */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-10 mb-16">
            <div className="flex items-start">
              <DollarSign className="h-12 w-12 text-green-400 mr-6 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">Enterprise ROI: Multi-Location Home Services</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-yellow-400">What You Deploy:</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• 5 locations, each with dedicated phone number</li>
                      <li>• 1,500 total voice minutes (300 per location)</li>
                      <li>• 60 fresh leads distributed across territories</li>
                      <li>• Automated campaigns running 24/7</li>
                      <li>• Multi-location analytics dashboard</li>
                    </ul>
                  </div>
                  <div className="bg-black/30 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 text-yellow-400">Financial Impact:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                        <span>150 new customers/month</span>
                        <span className="font-semibold">×</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                        <span>Avg. $300 per job</span>
                        <span className="font-semibold">=</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b-2 border-gray-600">
                        <span className="font-semibold">New Revenue</span>
                        <span className="text-xl font-bold text-green-400">$45,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                        <span>VoiceFly Enterprise</span>
                        <span>-$997</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold">Net Profit</span>
                        <span className="text-2xl font-bold text-green-400">$44,003</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Who This Is For */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-10 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Is Enterprise VIP Right for You?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Multi-Location Businesses</h3>
                <p className="text-gray-400">
                  Franchises, regional chains, or businesses expanding into multiple markets who need
                  centralized control with local customization.
                </p>
              </div>

              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">High-Growth Companies</h3>
                <p className="text-gray-400">
                  Scaling businesses that can't afford to miss calls, need reliable lead flow, and
                  want white-glove support as they grow.
                </p>
              </div>

              <div className="text-center">
                <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Premium Brands</h3>
                <p className="text-gray-400">
                  Businesses where brand experience matters and every customer interaction must
                  reflect your premium positioning.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-10 text-center">Enterprise VIP Questions</h2>
            <div className="space-y-4">
              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  How does Enterprise onboarding work?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  We start with a personal consultation call to understand your business, locations, and goals.
                  Then our team handles all setup—phone numbers, Maya training, workflow configuration, and
                  team training. You'll have a dedicated onboarding specialist guiding you through the first
                  30 days. White-glove from day one.
                </p>
              </details>

              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  What makes Enterprise support different?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  Enterprise support means 4-8 hour response times during business hours (M-F) from a dedicated
                  team that knows your account. You get priority on feature requests, early access to new features,
                  and quarterly business reviews. For even faster response (2 hours) and strategic guidance, add
                  the Dedicated Account Manager service for $999/month.
                </p>
              </details>

              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  Can I manage multiple brands or locations?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  Absolutely. Enterprise supports up to 5 locations or brands under one account. Each gets its own
                  phone number, Maya personality, and custom workflows. You manage everything from one unified
                  dashboard with location-specific analytics. Need more than 5? We can accommodate with custom pricing.
                </p>
              </details>

              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  How do the VIP exclusive services work?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  These services are only available to Enterprise members—they're not sold separately. Think of them
                  as investment opportunities to accelerate your growth. Want a custom website? Done-for-you campaigns?
                  Strategic SEO? As an Enterprise member, you have access to our agency-level services at preferred pricing.
                  Each service is quoted based on scope, and we only take on projects where we know we can deliver exceptional results.
                </p>
              </details>

              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  What if I exceed my Enterprise allowances?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  We'll proactively reach out when you hit 80% of any limit to discuss your options. You can add
                  capacity through our Add-Ons marketplace (+500 minutes for $149/mo, +50 leads for $99/mo, etc.)
                  or we can create a custom package that better fits your needs. Enterprise clients never get cut
                  off—we work with you to ensure continuity.
                </p>
              </details>

              <details className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 group">
                <summary className="font-semibold text-lg cursor-pointer list-none flex items-center justify-between">
                  Is there a minimum commitment?
                  <span className="ml-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-400">
                  Enterprise is month-to-month like all our plans—no long-term contract required. That said, we
                  invest significant resources in your onboarding and success, so we look for partners committed
                  to growth. Most Enterprise clients stay for years because the ROI speaks for itself.
                </p>
              </details>
            </div>
          </div>

          {/* Final CTA - VIP Application */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-12 text-gray-900">
            <div className="text-center">
              <Crown className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Ready to Join the VIP Circle?</h2>
              <p className="text-xl mb-10 max-w-3xl mx-auto opacity-90">
                Enterprise VIP membership is reserved for businesses that demand excellence.
                Schedule a consultation to discuss your needs and explore if VoiceFly Enterprise
                is the right fit for your growth trajectory.
              </p>
              <Link
                href="/enterprise/contact"
                className="inline-flex items-center px-12 py-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-2xl shadow-2xl transition-all"
              >
                Request VIP Consultation
                <ArrowRight className="ml-3 h-7 w-7" />
              </Link>
              <p className="text-sm mt-6 opacity-75">
                Personal consultation • Custom onboarding • White-glove service from day one
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
