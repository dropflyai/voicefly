"use client"

import Link from 'next/link'
import {
  Phone,
  CheckCircle,
  ArrowRight,
  Clock,
  Calendar,
  Mic,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Star
} from 'lucide-react'
import { useState } from 'react'

export default function BeautyLandingPage() {
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
              <Link href="/beauty" className="text-blue-600 font-medium">For Salons</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">Sign In</Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Trial
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
              <Link href="/beauty" className="block px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>For Salons</Link>
              <Link href="/pricing" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/signup" className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors" onClick={() => setMobileMenuOpen(false)}>Start Trial</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Mic className="h-4 w-4 mr-2" />
              Built for Salons, Spas & Beauty Professionals
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              AI Receptionist That
              <span className="text-purple-600 block mt-2">Keeps Your Chair Full</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Stop losing clients to missed calls and voicemail. VoiceFly answers every call 24/7,
              books appointments, and sends reminders -- so you can focus on what you do best.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/signup"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="border-2 border-gray-300 text-gray-700 hover:border-purple-600 hover:text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                See Pricing
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-gray-600 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <span>Live in 10 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <span>Starting at $49/mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Every Missed Call Is a Lost Client
            </h2>
            <p className="text-xl text-gray-600">
              Here's what happens when you can't answer the phone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-50 rounded-xl p-8 border border-red-100 text-center">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">You're With a Client</h3>
              <p className="text-gray-600">
                The phone rings while you're mid-color or mid-cut. You can't stop what you're doing.
                The call goes to voicemail. That potential client calls the next salon in their search results.
              </p>
            </div>

            <div className="bg-orange-50 rounded-xl p-8 border border-orange-100 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No-Shows Happen</h3>
              <p className="text-gray-600">
                Without reminders, 15-30% of appointments are no-shows. That's empty chair time you
                can't get back. Manual reminder calls eat up your breaks.
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-8 border border-purple-100 text-center">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Closed After 7pm</h3>
              <p className="text-gray-600">
                Most people browse and want to book in the evening. If your phone isn't answered,
                they book with someone whose is -- or they forget entirely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How Much Revenue Are You Losing?
            </h2>

            <div className="grid md:grid-cols-4 gap-4 items-center">
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600">5</div>
                <div className="text-sm text-gray-600 mt-1">missed calls per week</div>
              </div>

              <div className="text-center text-2xl font-bold text-gray-400 hidden md:block">x</div>

              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold text-gray-900">$80</div>
                <div className="text-sm text-gray-600 mt-1">avg service value</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">$1,600</div>
                <div className="text-sm text-gray-600 mt-1">lost per month</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                VoiceFly starts at <span className="font-bold">$49/month</span>. It pays for itself by capturing
                just <span className="font-bold">1 extra booking per week</span>.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Capturing Those Calls <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Up and running in under 10 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Choose Your Voice</h3>
              <p className="text-sm text-gray-600">Pick a natural-sounding AI voice that fits your salon's vibe.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Add Your Info</h3>
              <p className="text-sm text-gray-600">Services, prices, hours, stylists -- your AI learns it all in minutes.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Forward Calls</h3>
              <p className="text-sm text-gray-600">Forward your salon phone to your VoiceFly number. Done.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Appointments Roll In</h3>
              <p className="text-sm text-gray-600">Your AI books clients, answers questions, and sends you updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Your AI Receptionist Does */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Your AI Receptionist Handles
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Answers Every Call</h3>
                  <p className="text-gray-600 text-sm">
                    "Thanks for calling Bella Salon! I'd love to help you book an appointment.
                    Are you looking for a haircut, color, or something else today?"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Books Appointments</h3>
                  <p className="text-gray-600 text-sm">
                    "Let me check availability for a balayage with Sarah... I have openings on
                    Tuesday at 2pm or Thursday at 10am. Which works better?"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Answers Service Questions</h3>
                  <p className="text-gray-600 text-sm">
                    "Our gel manicure is $45 and takes about 45 minutes. We also offer nail art
                    starting at $10 per nail. Would you like to book?"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Handles After-Hours</h3>
                  <p className="text-gray-600 text-sm">
                    "We're currently closed but I can book your appointment right now!
                    We open at 9am Tuesday through Saturday. What day works for you?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No contracts. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">For salons getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  100 AI voice minutes
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  1 AI receptionist
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  24/7 call answering
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Appointment booking
                </li>
              </ul>
              <Link href="/signup" className="block w-full text-center bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                Start 14-Day Trial
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">For busy salons ready to grow</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$199</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  1,000 AI voice minutes
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Up to 5 AI receptionists
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  SMS appointment reminders
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Custom call scripts
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced analytics
                </li>
              </ul>
              <Link href="/signup" className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Start 14-Day Trial
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-purple-600 hover:text-purple-700 font-medium">
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Founding Offer */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-8 w-8 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Founding Salon Partner Program
          </h2>
          <p className="text-gray-700 mb-2">
            Be one of our first salon partners and get <span className="font-bold">50% off for life</span>.
          </p>
          <p className="text-gray-600 mb-6 text-sm">
            Starter at $25/mo or Pro at $100/mo -- forever. In exchange, we ask for honest feedback
            and permission to share your story.
          </p>
          <Link
            href="/founding"
            className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Apply for Founding Rate <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Your Next Client Is Calling Right Now.
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Don't send them to voicemail. Let your AI receptionist book that appointment.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              No credit card needed
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Live in 10 minutes
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Cancel anytime
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
                AI receptionist for salons and spas
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/beauty" className="hover:text-white">For Salons & Spas</Link></li>
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
    </div>
  )
}
