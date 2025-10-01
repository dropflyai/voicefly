'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, PhoneIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

export interface RapidSetupSuccessProps {
  businessName: string
  newPhoneNumber: string | undefined | null
  existingPhoneNumber: string | undefined | null
  selectedPlan: 'starter' | 'professional' | 'business'
  onContinueToDashboard: () => void
}

const PLAN_NAMES = {
  starter: 'Starter',
  professional: 'Professional', 
  business: 'Business'
}

export default function RapidSetupSuccess({
  businessName,
  newPhoneNumber,
  existingPhoneNumber,
  selectedPlan,
  onContinueToDashboard
}: RapidSetupSuccessProps) {
  const [showCelebration, setShowCelebration] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const formatPhoneNumber = (phone: string | undefined | null) => {
    // Safety check for undefined/null phone numbers
    if (!phone || typeof phone !== 'string') {
      return 'Phone number not available'
    }
    
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.substring(1)
      return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`
    }
    return phone
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Success Header */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎉 Your AI is Ready!
        </h1>
        <p className="text-xl text-gray-600">
          {businessName} now has a 24/7 AI assistant on the {PLAN_NAMES[selectedPlan]} plan
        </p>
      </div>

      {/* Phone Numbers Display */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your Phone Setup - Risk-Free Testing!
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* New AI Phone Number */}
          <div className="bg-white rounded-lg p-6 border-2 border-green-500">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
              <PhoneIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🤖 Your NEW AI Phone Number
            </h3>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatPhoneNumber(newPhoneNumber)}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This is your dedicated AI assistant line for testing
            </p>
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <p className="font-semibold text-green-800 mb-1">✅ Ready Now:</p>
              <ul className="text-green-700 space-y-1">
                <li>• Takes calls 24/7</li>
                <li>• Books appointments automatically</li>
                <li>• Sends confirmations</li>
                <li>• Perfect for testing!</li>
              </ul>
            </div>
          </div>

          {/* Existing Business Number */}
          <div className="bg-white rounded-lg p-6 border-2 border-blue-500">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
              <PhoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              📞 Your Business Line
            </h3>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatPhoneNumber(existingPhoneNumber)}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your current business number stays exactly the same
            </p>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-semibold text-blue-800 mb-1">🛡️ Protected:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• No changes made</li>
                <li>• Still works normally</li>
                <li>• Forward when YOU'RE ready</li>
                <li>• Always reversible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🚀 What Happens Next?
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📞</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">1. Test Your AI</h4>
            <p className="text-sm text-gray-600">
              Call {formatPhoneNumber(newPhoneNumber)} and book a test appointment
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📊</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">2. See It Work</h4>
            <p className="text-sm text-gray-600">
              Watch your test booking appear live in the dashboard
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🎯</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">3. Go Live</h4>
            <p className="text-sm text-gray-600">
              Forward your business line when you feel confident
            </p>
          </div>
        </div>

        {/* Test Call CTA */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium mb-2">
            🎯 Try it right now! Call your AI:
          </p>
          <div className="text-2xl font-bold text-yellow-900">
            {formatPhoneNumber(newPhoneNumber)}
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Say "I'd like to book a manicure" and watch the magic happen!
          </p>
        </div>
      </div>

      {/* Safety Messaging */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
        <h4 className="font-semibold text-green-800 mb-2">
          🛡️ Complete Risk-Free Testing
        </h4>
        <div className="text-sm text-green-700 grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">✅ Your business line stays safe:</p>
            <ul className="space-y-1 ml-4">
              <li>• No forwarding required initially</li>
              <li>• No disruption to current operations</li>
              <li>• Test extensively before going live</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">✅ Your payment is protected:</p>
            <ul className="space-y-1 ml-4">
              <li>• 7-day free trial (no charges)</li>
              <li>• Cancel anytime during trial</li>
              <li>• Billing starts only after trial</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Continue to Dashboard */}
      <div className="text-center">
        <button
          onClick={() => {
            console.log('🎯 Dashboard button clicked in RapidSetupSuccess')
            onContinueToDashboard()
          }}
          className="bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue to Dashboard
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-3">
          Start with a guided tour of your {PLAN_NAMES[selectedPlan]} features
        </p>
      </div>

      {/* Emergency Contact */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Need help? We're here for you!</p>
        <p>
          <a href="mailto:support@vapi-nail-salon.com" className="text-blue-600 hover:underline">
            support@vapi-nail-salon.com
          </a>
          {' • '}
          <a href="tel:+1-844-GET-HELP" className="text-blue-600 hover:underline">
            (844) GET-HELP
          </a>
        </p>
      </div>
    </div>
  )
}