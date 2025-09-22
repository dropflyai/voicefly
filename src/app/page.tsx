"use client"

import Link from 'next/link'
import { Phone, DollarSign, Clock, CheckCircle, ArrowRight, Star, Users, TrendingUp, Shield, Zap, Calendar, Search, Mail, BarChart3, Brain, Workflow } from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [monthlyCallVolume, setMonthlyCallVolume] = useState(500)
  const receptionistCost = 150000 // Full employee cost including benefits
  const voiceFlyCost = 297 * 12
  const annualSavings = receptionistCost - voiceFlyCost
  const roi = ((receptionistCost - voiceFlyCost) / voiceFlyCost * 100).toFixed(0)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-2xl font-bold text-gray-900">VoiceFly</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-blue-600 font-medium">Home</Link>
              <Link href="/features" className="text-gray-700 hover:text-blue-600 font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/testimonials" className="text-gray-700 hover:text-blue-600 font-medium">Testimonials</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">Sign In</Link>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Free Trial
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Brain className="h-4 w-4 mr-2" />
              The World's Most Advanced AI Business Employee
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Meet Maya: Your AI Employee
              <span className="text-blue-600 block mt-2">Who Runs Your Entire Business</span>
            </h1>

            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Maya isn't just another chatbot - she's a complete AI employee who handles sales calls,
              conducts deep market research, manages multi-channel marketing campaigns, processes payments,
              and automates your entire business operations 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                See Maya in Action
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center space-x-8 text-gray-600">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                <span>Enterprise Grade</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <span>Live in 10 Minutes</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                <span>500+ Businesses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maya's Capabilities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Maya Does Everything A Full-Time Employee Does (And More)
            </h2>
            <p className="text-xl text-gray-600">
              She's not just answering phones - she's running your entire business operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 border border-blue-100">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Sales Operations</h3>
              <p className="text-gray-600 mb-4">
                Handles complex sales calls, qualifies leads with custom criteria, books appointments,
                processes payments, and manages your entire sales pipeline.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Intelligent lead qualification & scoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Payment processing & invoicing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Multi-location business management</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 border border-green-100">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Deep Research & Intelligence</h3>
              <p className="text-gray-600 mb-4">
                Conducts autonomous market research, analyzes competitors, discovers prospects,
                and provides actionable business intelligence with citations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Company & competitive analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Contact discovery & decision makers</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Market trend analysis & insights</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 border border-purple-100">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing Campaign Management</h3>
              <p className="text-gray-600 mb-4">
                Designs and executes multi-channel marketing campaigns across voice, email, and SMS
                with automated follow-ups and performance tracking.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Voice, email & SMS campaigns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Automated nurturing sequences</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Real-time performance analytics</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8 border border-orange-100">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Workflow className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Business Process Automation</h3>
              <p className="text-gray-600 mb-4">
                Creates and manages complex business workflows, automates repetitive tasks,
                and optimizes operations across your entire organization.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Custom workflow automation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">50+ CRM & tool integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Real-time monitoring & optimization</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-8 border border-red-100">
              <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Revenue & Analytics Management</h3>
              <p className="text-gray-600 mb-4">
                Tracks revenue, manages loyalty programs, generates business intelligence reports,
                and provides actionable insights to grow your business.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Revenue tracking & forecasting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Customer loyalty program management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Advanced business intelligence</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-8 border border-indigo-100">
              <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Operations</h3>
              <p className="text-gray-600 mb-4">
                Manages multiple locations, teams, and complex business operations with
                enterprise-grade security and compliance features.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Multi-location management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">HIPAA & SOC 2 compliance</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Team & staff coordination</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Supercharge Your Team's Productivity 10x With Maya</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-white/80 text-sm mb-2">Current Team Output</div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-white/60 text-sm mt-1">What your team does now:</div>
                <ul className="text-white/70 text-xs mt-3 space-y-1">
                  <li>• 20 calls per day</li>
                  <li>• 5 leads researched</li>
                  <li>• 3 email campaigns</li>
                  <li>• 8-hour work days</li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-lg p-6">
                <div className="text-white/80 text-sm mb-2">With Maya Added</div>
                <div className="text-3xl font-bold">1,000%</div>
                <div className="text-white/60 text-sm mt-1">What Maya adds:</div>
                <ul className="text-white/70 text-xs mt-3 space-y-1">
                  <li>• 200+ calls per day</li>
                  <li>• 50+ leads researched</li>
                  <li>• 30+ email campaigns</li>
                  <li>• 24/7 operation</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border-2 border-green-500 shadow-2xl">
                <div className="text-center">
                  <div className="text-white text-sm mb-2 font-bold">🚀 PRODUCTIVITY GAIN</div>
                  <div className="text-4xl font-black text-white mb-1 drop-shadow-lg">+900%</div>
                  <div className="text-green-50 text-xs mb-3 font-medium">Additional Output</div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-xl font-bold text-white drop-shadow-md">10x More Done</div>
                    <div className="text-green-50 text-xs font-medium">Same team, exponential results</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                See Your Team's Productivity Potential <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Give Your Team a 24/7 AI Powerhouse That Never Sleeps
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Team Capacity Limits</h3>
                    <p className="text-gray-600">Your talented team can only work so many hours. Critical tasks get delayed when everyone's already at capacity.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">After-Hours Gaps</h3>
                    <p className="text-gray-600">Leads come in, customers call, and opportunities arise 24/7. Your team needs rest, but business never stops.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Repetitive Task Burnout</h3>
                    <p className="text-gray-600">Your skilled team gets bogged down with routine tasks like research, data entry, and follow-ups instead of high-value work.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Maya Amplifies Your Team's Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-white rounded-lg border border-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Handles All Routine Tasks 24/7</span>
                  </div>
                  <div className="flex items-center p-4 bg-white rounded-lg border border-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Frees Your Team for High-Value Work</span>
                  </div>
                  <div className="flex items-center p-4 bg-white rounded-lg border border-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Never Sleeps, Never Takes Breaks</span>
                  </div>
                  <div className="flex items-center p-4 bg-white rounded-lg border border-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Scales Instantly With Your Growth</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Supercharge Your Team Today
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              500+ Businesses Supercharged Their Teams With Maya
            </h2>
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-gray-600">4.9/5 based on 500+ reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Maya transformed our entire sales and marketing operation. She generates more qualified leads,
                runs better campaigns, and costs 95% less. ROI was immediate."
              </p>
              <div className="flex items-center">
                <div className="bg-gray-300 w-10 h-10 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">CEO, TechStart Solutions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The research capabilities alone are worth 10x the cost. Maya finds prospects,
                analyzes competitors, and creates campaigns that our marketing team never could."
              </p>
              <div className="flex items-center">
                <div className="bg-gray-300 w-10 h-10 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-gray-900">Michael Chen</div>
                  <div className="text-sm text-gray-600">Founder, Growth Dynamics</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "We went from a team of 8 to just Maya. Revenue increased 300% while costs dropped
                by $120K annually. She literally runs our entire operation."
              </p>
              <div className="flex items-center">
                <div className="bg-gray-300 w-10 h-10 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-gray-900">Dr. Robert Kim</div>
                  <div className="text-sm text-gray-600">Owner, Premier Medical Group</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Multiply Your Team's Output 10x
            <span className="block mt-2">With Your New AI Powerhouse</span>
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Maya can amplify your entire sales, marketing, and research team's output.
            She's live in 10 minutes and costs 98% less than hiring humans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Supercharge Your Team Today
            </Link>
            <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              See Maya's Full Capabilities
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center space-x-8 text-white/80">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Works alongside your existing team</span>
            </div>
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
                The world's most advanced AI business employee platform
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white text-sm">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><Link href="#" className="hover:text-white">HIPAA</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-sm">
              © 2024 VoiceFly. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-white">SOC 2 Certified</span>
              <span className="text-sm text-white">•</span>
              <span className="text-sm text-white">HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}