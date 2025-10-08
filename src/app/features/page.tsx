"use client"

import Link from 'next/link'
import {
  Phone, Clock, Calendar, Brain, Shield, Zap, Globe, BarChart3,
  Users, MessageSquare, CheckCircle, ArrowRight, Headphones,
  FileText, DollarSign, TrendingUp, Bot, Mic, Database, Languages,
  CalendarCheck, PhoneCall, UserCheck, Star, Sparkles, Settings, Menu, X
} from 'lucide-react'
import { useState } from 'react'

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center">
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">VoiceFly</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/features" className="text-blue-600 font-medium">Features</Link>
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
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
              <Link href="/" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/features" className="block px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="/pricing" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/testimonials" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Testimonials</Link>
              <Link href="/login" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/login" className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Start Free Trial
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4 mr-2" />
            Enterprise-Grade AI Technology
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Everything Maya Can Do
            <span className="text-blue-600 block mt-2">For Your Business</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto px-4">
            Maya isn't just an AI receptionist - she's a full-featured team member with
            capabilities that transform how you handle customer interactions.
          </p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Capabilities</h2>
            <p className="text-xl text-gray-600">Maya handles everything your best employee would - and more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Natural Voice Conversations */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 border border-blue-100">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Natural Voice Conversations</h3>
              <p className="text-gray-600 mb-4">
                Maya sounds completely human with natural speech patterns, appropriate pauses, and emotional intelligence.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">9 different personality modes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Handles interruptions naturally</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Remembers context throughout call</span>
                </li>
              </ul>
            </div>

            {/* Smart Appointment Booking */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 border border-green-100">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Appointment Booking</h3>
              <p className="text-gray-600 mb-4">
                Maya manages your entire calendar, handling bookings, rescheduling, and cancellations seamlessly.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Real-time availability checking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Multi-calendar sync (Google, Outlook)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Automatic reminder sending</span>
                </li>
              </ul>
            </div>

            {/* Lead Qualification */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 border border-purple-100">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Lead Qualification</h3>
              <p className="text-gray-600 mb-4">
                Maya qualifies every lead using your custom criteria and routes them to the right team member.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Custom qualification questions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Lead scoring & prioritization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">CRM auto-population</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Intelligence Features</h2>
            <p className="text-xl text-gray-600">Powered by cutting-edge AI technology</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <Brain className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">Context Memory</h4>
              <p className="text-sm text-gray-600">
                Remembers previous conversations and customer preferences for personalized service
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <Languages className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">Multi-Language Support</h4>
              <p className="text-sm text-gray-600">
                Fluent in 30+ languages with automatic detection and seamless switching
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <Bot className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">Custom AI Training</h4>
              <p className="text-sm text-gray-600">
                Train Maya on your specific business knowledge, products, and services
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <Shield className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">HIPAA Compliant</h4>
              <p className="text-sm text-gray-600">
                Medical-grade security and compliance for healthcare providers
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <Database className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">CRM Integration</h4>
              <p className="text-sm text-gray-600">
                Seamlessly syncs with Salesforce, HubSpot, and 20+ other platforms
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
              <p className="text-sm text-gray-600">
                Real-time insights on calls, conversions, and customer satisfaction
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <MessageSquare className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">SMS Follow-Up</h4>
              <p className="text-sm text-gray-600">
                Automatic text message confirmations and follow-ups after calls
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <FileText className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900 mb-2">Call Transcripts</h4>
              <p className="text-sm text-gray-600">
                Complete searchable transcripts and recordings of every interaction
              </p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry-Specific Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Industry-Specific Capabilities</h2>
            <p className="text-xl text-gray-600">Maya adapts to your industry's unique needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Healthcare */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Healthcare & Medical</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">HIPAA-Compliant Conversations</div>
                    <div className="text-sm text-gray-600">Secure patient information handling</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Insurance Verification</div>
                    <div className="text-sm text-gray-600">Automatically verify coverage and benefits</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Prescription Refills</div>
                    <div className="text-sm text-gray-600">Handle refill requests and pharmacy coordination</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Beauty & Wellness */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="bg-pink-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Beauty & Wellness</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Service Recommendations</div>
                    <div className="text-sm text-gray-600">Suggest treatments based on customer needs</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Package Deals & Promotions</div>
                    <div className="text-sm text-gray-600">Upsell services and current specials</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-pink-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Loyalty Program Management</div>
                    <div className="text-sm text-gray-600">Track points and rewards automatically</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="bg-gray-700 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Legal Services</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Case Intake & Screening</div>
                    <div className="text-sm text-gray-600">Qualify potential clients efficiently</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Consultation Scheduling</div>
                    <div className="text-sm text-gray-600">Book initial consultations with attorneys</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Document Collection</div>
                    <div className="text-sm text-gray-600">Guide clients through required paperwork</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Real Estate */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Real Estate</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Property Inquiries</div>
                    <div className="text-sm text-gray-600">Answer questions about listings instantly</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Showing Coordination</div>
                    <div className="text-sm text-gray-600">Schedule property viewings seamlessly</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Market Analysis Requests</div>
                    <div className="text-sm text-gray-600">Capture seller leads with CMA offers</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Maya's Performance Stats</h2>
            <p className="text-xl text-blue-100">Based on data from 500+ businesses</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">99.8%</div>
              <div className="text-blue-100">Uptime Reliability</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">&lt; 1sec</div>
              <div className="text-blue-100">Response Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">40%</div>
              <div className="text-blue-100">More Appointments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600">Maya works with your existing tools</p>
          </div>

          <div className="grid grid-cols-6 gap-4 max-w-5xl mx-auto">
            {/* First Row */}
            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-50 to-red-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#4285F4" x="4" y="10" width="40" height="30" rx="2"/>
                    <rect fill="#EA4335" x="4" y="10" width="40" height="8"/>
                    <text x="12" y="28" fill="white" fontSize="14" fontWeight="bold">31</text>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Google Calendar</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#0078D4" x="8" y="8" width="32" height="32" rx="2"/>
                    <path fill="white" d="M20 18h8v2h-8zm0 4h8v2h-8zm0 4h8v2h-8zm-4-8h2v12h-2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Outlook</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <circle fill="#00A1E0" cx="24" cy="24" r="18"/>
                    <path fill="white" d="M24 15c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 14c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Salesforce</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <circle fill="#FF7A59" cx="24" cy="24" r="18"/>
                    <path fill="white" d="M30 24c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zm-6-3c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">HubSpot</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-purple-50 to-green-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <path fill="#E01E5A" d="M10 20c0-2.2 1.8-4 4-4s4 1.8 4 4v10c0 2.2-1.8 4-4 4s-4-1.8-4-4V20z"/>
                    <path fill="#36C5F0" d="M28 10c2.2 0 4 1.8 4 4s-1.8 4-4 4H18c-2.2 0-4-1.8-4-4s1.8-4 4-4h10z"/>
                    <path fill="#2EB67D" d="M38 28c0 2.2-1.8 4-4 4s-4-1.8-4-4V18c0-2.2 1.8-4 4-4s4 1.8 4 4v10z"/>
                    <path fill="#ECB22E" d="M20 38c-2.2 0-4-1.8-4-4s1.8-4 4-4h10c2.2 0 4 1.8 4 4s-1.8 4-4 4H20z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Slack</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#2D8CFF" x="8" y="8" width="32" height="32" rx="8"/>
                    <path fill="white" d="M18 20v8h8v-6h6v-2H18z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Zoom</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg transition-colors"></div>
            </div>

            {/* Second Row */}
            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#000000" x="10" y="10" width="28" height="28" rx="4"/>
                    <rect fill="white" x="18" y="18" width="12" height="12" rx="2"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Square</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#6772E5" x="6" y="12" width="36" height="24" rx="4"/>
                    <path fill="white" d="M20 22c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4c-1.1 0-2-.9-2-2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Stripe</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <circle fill="#2CA01C" cx="24" cy="24" r="18"/>
                    <path fill="white" d="M24 16c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 9h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">QuickBooks</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <circle fill="#FFE01B" cx="24" cy="24" r="18"/>
                    <path fill="#000000" d="M24 16c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 7c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                    <path fill="#000000" d="M24 28c-2 0-4 1-4 3v1h8v-1c0-2-2-3-4-3z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Mailchimp</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#F22F46" x="8" y="8" width="32" height="32" rx="4"/>
                    <circle fill="white" cx="18" cy="18" r="3"/>
                    <circle fill="white" cx="30" cy="18" r="3"/>
                    <circle fill="white" cx="18" cy="30" r="3"/>
                    <circle fill="white" cx="30" cy="30" r="3"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Twilio</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500 rounded-lg transition-colors"></div>
            </div>

            <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-4 flex flex-col items-center">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <svg className="h-8 w-8" viewBox="0 0 48 48">
                    <rect fill="#FF4A00" x="8" y="8" width="32" height="32" rx="4"/>
                    <path fill="white" d="M18 24l12-8v6h6l-12 8v-6h-6z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 text-sm text-center">Zapier</h4>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-500 rounded-lg transition-colors"></div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Plus many more integrations through our API</p>
            <Link href="/integrations" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
              View All Integrations <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Meet Maya?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            See all these features in action with a personalized demo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free 14-Day Trial
            </Link>
            <button className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Schedule Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-xl font-bold">VoiceFly</span>
          </div>
          <p className="text-gray-400">© 2024 VoiceFly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}