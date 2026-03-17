"use client"

import Link from 'next/link'
import { Phone, PhoneCall, CheckCircle, ArrowRight, Star, Clock, Calendar, Mic, Sparkles, Menu, X } from 'lucide-react'
import { useState, useRef } from 'react'
import AIChatbot, { AIChatbotRef } from '@/components/AIChatbot'

const DEMO_PHONE = process.env.NEXT_PUBLIC_DEMO_PHONE || '+14248887754'
const DEMO_PHONE_DISPLAY = DEMO_PHONE.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')

// Jordan — VoiceFly's lead qualifier AI
const JORDAN_PHONE = '+19892997944'
const JORDAN_PHONE_DISPLAY = '(989) 299-7944'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const chatbotRef = useRef<AIChatbotRef>(null)

  const handleTryDemo = () => {
    chatbotRef.current?.openWithMessage("Show me a demo")
  }

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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-blue-600 font-medium">Home</Link>
              <Link href="/beauty" className="text-gray-700 hover:text-blue-600 font-medium">Industries</Link>
              <Link href="/demo" className="text-gray-700 hover:text-blue-600 font-medium">Demo</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">Sign In</Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Trial
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
              <Link href="/" className="block px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/beauty" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Industries</Link>
              <Link href="/demo" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
              <Link href="/pricing" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link
                href="/signup"
                className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Trial
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Mic className="h-4 w-4 mr-2" />
              AI Receptionist for Every Business
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Never Miss a Client
              <span className="text-blue-600 block mt-2">Call Again</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto px-4">
              Your AI receptionist answers every call 24/7, books appointments, and handles
              questions -- so you can focus on running your business.
            </p>

            {/* Jordan CTA — #1 conversion driver */}
            <div className="mb-8">
              <a
                href={`tel:${JORDAN_PHONE}`}
                className="inline-flex flex-col items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                <span className="flex items-center text-xl sm:text-2xl mb-1">
                  <PhoneCall className="h-6 w-6 mr-3 animate-pulse" />
                  Call Our AI — Right Now
                </span>
                <span className="text-2xl sm:text-3xl font-bold tracking-wide">+1 {JORDAN_PHONE_DISPLAY}</span>
              </a>
              <p className="text-gray-500 text-sm mt-3">
                Talk to Jordan, our AI lead qualifier. Available 7am &ndash; 9pm PT.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href={`tel:${DEMO_PHONE}`}
                className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
              >
                <Phone className="h-5 w-5 mr-2" />
                Hear Maya Demo: {DEMO_PHONE_DISPLAY}
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-gray-600 text-sm sm:text-base">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <span>Live in 10 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                <span>Starting at $49/mo — 60 min included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call Jordan — Lead Qualifier */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-10 text-center shadow-2xl overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute -top-10 -right-10 w-40 h-40 border-4 border-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 border-4 border-white/10 rounded-full" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-5 ring-4 ring-white/10">
                <PhoneCall className="h-8 w-8 text-white animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Talk to Jordan — Our AI Lead Qualifier
              </h2>
              <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
                Call right now and see how VoiceFly qualifies leads, answers questions, and books meetings. No signup needed.
              </p>

              <a
                href={`tel:${JORDAN_PHONE}`}
                className="inline-flex items-center bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-2xl sm:text-3xl tracking-wide transition-all transform hover:scale-105 shadow-lg"
              >
                <Phone className="h-7 w-7 mr-3 flex-shrink-0" />
                +1 {JORDAN_PHONE_DISPLAY}
              </a>

              <p className="text-blue-200 text-sm mt-4">
                Available 7am &ndash; 9pm PT &middot; Ask about pricing, demos, or how VoiceFly works
              </p>

              {/* Secondary: Maya receptionist demo */}
              <div className="mt-6 pt-5 border-t border-white/20">
                <p className="text-blue-200 text-sm mb-2">Want to hear our AI receptionist instead?</p>
                <a
                  href={`tel:${DEMO_PHONE}`}
                  className="inline-flex items-center text-white hover:text-blue-100 font-semibold text-lg transition-colors"
                >
                  <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                  Call Maya: {DEMO_PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sound Familiar?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-50 rounded-xl p-8 border border-red-100">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Missed Calls = Lost Revenue</h3>
              <p className="text-gray-600">
                You're busy with a customer and the phone rings. You can't answer. That caller goes to
                your competitor instead. It happens 5-10 times a week.
              </p>
            </div>

            <div className="bg-orange-50 rounded-xl p-8 border border-orange-100">
              <div className="text-3xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No-Shows Kill Your Schedule</h3>
              <p className="text-gray-600">
                Customers forget their appointments. You lose an hour of revenue and can't fill
                the slot last minute. Reminder calls take time you don't have.
              </p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-8 border border-yellow-100">
              <div className="text-3xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">After-Hours Means Closed</h3>
              <p className="text-gray-600">
                Customers want to book at 9pm on Sunday. Your phone goes to voicemail. Most won't
                leave a message -- they'll just search for someone else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your AI Receptionist Handles It All
            </h2>
            <p className="text-xl text-gray-600">
              Set up in under 10 minutes. Works 24/7/365.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Answers Every Call</h3>
              <p className="text-sm text-gray-600">Natural-sounding AI picks up instantly, 24/7. No hold music, no voicemail.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Books Appointments</h3>
              <p className="text-sm text-gray-600">Checks availability and books clients directly into your calendar.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Answers Questions</h3>
              <p className="text-sm text-gray-600">Knows your services, prices, and hours. Handles common questions like a pro.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sends Reminders</h3>
              <p className="text-sm text-gray-600">SMS reminders reduce no-shows and keep your schedule full. (Pro plan)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-center">The Math Is Simple</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-white/80 text-sm mb-2">Missed calls per week</div>
                <div className="text-4xl font-bold">5</div>
              </div>

              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-white/80 text-sm mb-2">Avg service value</div>
                <div className="text-4xl font-bold">$80</div>
              </div>

              <div className="bg-green-600 rounded-lg p-6 text-center border-2 border-green-400">
                <div className="text-green-100 text-sm mb-2">Monthly revenue recovered</div>
                <div className="text-4xl font-bold">$1,600</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-blue-100 mb-6">
                VoiceFly starts at $49/mo with 60 minutes included. That&apos;s a 32x return if it captures just 1 extra booking per week.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Live in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Choose Your Voice</h3>
              <p className="text-gray-600">Pick from natural-sounding AI voices. Set your business greeting and hours.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tell It About Your Business</h3>
              <p className="text-gray-600">Add your services, prices, and availability. The AI learns your business in minutes.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Forward Your Calls</h3>
              <p className="text-gray-600">Forward calls to your VoiceFly number. Your AI receptionist handles the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Examples */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Businesses That Run on Appointments
            </h2>
            <p className="text-xl text-gray-600">
              Any business that books appointments and answers phone calls can use VoiceFly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link href="/beauty" className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">💇</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Salons & Spas</h3>
              <p className="text-sm text-gray-600">Never miss a booking while you're with a client. AI answers calls 24/7 and fills your chair.</p>
              <span className="text-purple-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>

            <Link href="/solutions" className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">🦷</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Dental Practices</h3>
              <p className="text-sm text-gray-600">Handle appointment scheduling, insurance questions, and new patient inquiries automatically.</p>
              <span className="text-blue-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>

            <Link href="/solutions" className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Home Services</h3>
              <p className="text-sm text-gray-600">Capture leads for plumbers, electricians, HVAC, and cleaning services while you're on the job.</p>
              <span className="text-green-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>

            <Link href="/solutions" className="group bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">Law Firms</h3>
              <p className="text-sm text-gray-600">Screen potential clients, schedule consultations, and capture case details after hours.</p>
              <span className="text-amber-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>

            <Link href="/solutions" className="group bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Medical & Wellness</h3>
              <p className="text-sm text-gray-600">Manage patient scheduling, answer common questions, and reduce front desk workload.</p>
              <span className="text-red-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>

            <Link href="/solutions" className="group bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">🐾</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">Veterinary Clinics</h3>
              <p className="text-sm text-gray-600">Book pet appointments, handle prescription refill requests, and triage urgent calls.</p>
              <span className="text-indigo-600 text-sm font-medium mt-3 inline-flex items-center">Learn more <ArrowRight className="h-4 w-4 ml-1" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* Founding Offer */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
            <Sparkles className="h-8 w-8 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Founding Customer Offer
            </h2>
            <p className="text-gray-700 mb-6">
              Be one of our first business partners and lock in 50% off for life.
              In exchange, we ask for honest feedback and permission to feature your story.
            </p>
            <Link
              href="/founding"
              className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Apply for Founding Rate <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Your Next Client Is Calling.
            <span className="block mt-2">Will You Answer?</span>
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Set up your AI receptionist in under 10 minutes. Free for 14 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              See Pricing
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/80 text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Cancel anytime</span>
            </div>
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
                <li><Link href="/beauty" className="hover:text-white">For Salons & Spas</Link></li>
                <li><Link href="/solutions" className="hover:text-white">For Dental Practices</Link></li>
                <li><Link href="/solutions" className="hover:text-white">For Home Services</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
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

      {/* AI Chatbot */}
      <AIChatbot ref={chatbotRef} />
    </div>
  )
}
