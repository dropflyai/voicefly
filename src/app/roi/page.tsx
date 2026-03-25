"use client"

import Link from 'next/link'
import { Phone, PhoneCall, ArrowRight, CheckCircle, Menu, X, Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { useState, useMemo } from 'react'

const JORDAN_PHONE = '+19892997944'
const JORDAN_PHONE_DISPLAY = '(989) 299-7944'

type Industry = 'Restaurant' | 'Salon/Spa' | 'Auto Shop' | 'Dental/Medical' | 'Law Firm' | 'Home Services' | 'Other'

const INDUSTRY_CONVERSION_RATES: Record<Industry, number> = {
  'Restaurant': 0.45,
  'Salon/Spa': 0.55,
  'Auto Shop': 0.40,
  'Dental/Medical': 0.60,
  'Law Firm': 0.50,
  'Home Services': 0.35,
  'Other': 0.40,
}

const INDUSTRIES: Industry[] = ['Restaurant', 'Salon/Spa', 'Auto Shop', 'Dental/Medical', 'Law Firm', 'Home Services', 'Other']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ROICalculatorPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [callsPerDay, setCallsPerDay] = useState(20)
  const [missRate, setMissRate] = useState(30)
  const [avgValue, setAvgValue] = useState(200)
  const [industry, setIndustry] = useState<Industry>('Restaurant')

  const results = useMemo(() => {
    const conversionRate = INDUSTRY_CONVERSION_RATES[industry]
    const missedCallsPerMonth = callsPerDay * (missRate / 100) * 30
    const revenueLostMonthly = missedCallsPerMonth * avgValue * conversionRate
    const revenueLostYearly = revenueLostMonthly * 12

    let voiceflyCost: number
    let planName: string
    if (callsPerDay < 30) {
      voiceflyCost = 49
      planName = 'Starter'
    } else if (callsPerDay <= 80) {
      voiceflyCost = 129
      planName = 'Growth'
    } else {
      voiceflyCost = 249
      planName = 'Pro'
    }

    const monthlyROI = revenueLostMonthly - voiceflyCost
    const dailyRevenueRecovered = revenueLostMonthly / 30
    const paybackDays = dailyRevenueRecovered > 0 ? Math.ceil(voiceflyCost / dailyRevenueRecovered) : 999
    const roiMultiplier = voiceflyCost > 0 ? revenueLostMonthly / voiceflyCost : 0

    return {
      conversionRate,
      missedCallsPerMonth,
      revenueLostMonthly,
      revenueLostYearly,
      voiceflyCost,
      planName,
      monthlyROI,
      paybackDays,
      roiMultiplier,
    }
  }, [callsPerDay, missRate, avgValue, industry])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <Link href="/" className="flex items-center">
              <Phone className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">VoiceFly</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/beauty" className="text-gray-700 hover:text-blue-600 font-medium">Industries</Link>
              <Link href="/demo" className="text-gray-700 hover:text-blue-600 font-medium">Demo</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/roi" className="text-blue-600 font-medium">ROI Calculator</Link>
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
              <Link href="/" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/beauty" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Industries</Link>
              <Link href="/demo" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
              <Link href="/pricing" className="block px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/roi" className="block px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>ROI Calculator</Link>
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

      {/* Hero */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Calculator className="h-4 w-4 mr-2" />
            ROI Calculator
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How Much Are Missed Calls
            <span className="text-blue-600 block mt-2">Costing You?</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
            Adjust the sliders below to see exactly how much revenue you are leaving on the table -- and how fast VoiceFly pays for itself.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Inputs */}
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                Your Business Numbers
              </h2>

              {/* Industry */}
              <div className="mb-6">
                <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as Industry)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind} ({Math.round(INDUSTRY_CONVERSION_RATES[ind] * 100)}% call-to-booking rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Calls per day */}
              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="callsPerDay" className="text-sm font-semibold text-gray-700">
                    Calls per day
                  </label>
                  <span className="text-lg font-bold text-blue-600">{callsPerDay}</span>
                </div>
                <input
                  id="callsPerDay"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={callsPerDay}
                  onChange={(e) => setCallsPerDay(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5</span>
                  <span>100</span>
                </div>
              </div>

              {/* Miss rate */}
              <div className="mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="missRate" className="text-sm font-semibold text-gray-700">
                    % of calls missed
                  </label>
                  <span className="text-lg font-bold text-red-600">{missRate}%</span>
                </div>
                <input
                  id="missRate"
                  type="range"
                  min={10}
                  max={80}
                  step={1}
                  value={missRate}
                  onChange={(e) => setMissRate(Number(e.target.value))}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>80%</span>
                </div>
              </div>

              {/* Average customer value */}
              <div className="mb-2">
                <div className="flex justify-between items-baseline mb-2">
                  <label htmlFor="avgValue" className="text-sm font-semibold text-gray-700">
                    Average customer value
                  </label>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(avgValue)}</span>
                </div>
                <input
                  id="avgValue"
                  type="range"
                  min={50}
                  max={5000}
                  step={10}
                  value={avgValue}
                  onChange={(e) => setAvgValue(Number(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$50</span>
                  <span>$5,000</span>
                </div>
              </div>

              {/* Benchmark note */}
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Industry benchmark:</strong> {industry} businesses convert roughly {Math.round(results.conversionRate * 100)}% of answered calls into paying customers.
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {/* Revenue Lost */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-4">What You Are Losing</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Missed calls / month</span>
                    <span className="text-2xl font-bold text-red-600">{formatNumber(results.missedCallsPerMonth)}</span>
                  </div>
                  <div className="border-t border-red-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Revenue lost / month</span>
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(results.revenueLostMonthly)}</span>
                  </div>
                  <div className="border-t border-red-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Revenue lost / year</span>
                    <span className="text-3xl font-bold text-red-600">{formatCurrency(results.revenueLostYearly)}</span>
                  </div>
                </div>
              </div>

              {/* VoiceFly ROI */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-4">With VoiceFly</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">VoiceFly cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(results.voiceflyCost)}/mo
                      <span className="text-sm font-normal text-gray-500 ml-1">({results.planName})</span>
                    </span>
                  </div>
                  <div className="border-t border-green-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Net revenue recovered / month</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(results.monthlyROI)}</span>
                  </div>
                  <div className="border-t border-green-200" />

                  {/* Big ROI numbers */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Payback Period</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {results.paybackDays}
                      </div>
                      <div className="text-sm text-gray-600">
                        {results.paybackDays === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">ROI</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">
                        {results.roiMultiplier.toFixed(0)}x
                      </div>
                      <div className="text-sm text-gray-600">
                        return
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary callout */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <p className="text-lg font-semibold mb-1">
                  VoiceFly pays for itself in {results.paybackDays} {results.paybackDays === 1 ? 'day' : 'days'}
                </p>
                <p className="text-blue-100 text-sm">
                  {formatCurrency(results.roiMultiplier * results.voiceflyCost)} recovered for every {formatCurrency(results.voiceflyCost)} spent
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stop Losing {formatCurrency(results.revenueLostMonthly)} Every Month
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Your AI receptionist answers every call, books appointments, and captures revenue you are currently missing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              Start Your 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href={`tel:${JORDAN_PHONE}`}
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
            >
              <PhoneCall className="h-5 w-5 mr-2 animate-pulse" />
              Call Our AI: {JORDAN_PHONE_DISPLAY}
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/80 text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Live in 10 minutes</span>
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
                <li><Link href="/roi" className="hover:text-white">ROI Calculator</Link></li>
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
              &copy; 2026 VoiceFly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
