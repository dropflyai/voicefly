'use client'

import React, { useState } from 'react'
import { PhoneIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface PhoneForwardingIntroProps {
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  phoneNumber: string
  existingPhoneNumber: string
  onStepComplete: () => void
}

export default function PhoneForwardingIntro({
  planTier,
  businessName,
  phoneNumber,
  existingPhoneNumber,
  onStepComplete
}: PhoneForwardingIntroProps) {
  const [selectedOption, setSelectedOption] = useState<'test-more' | 'forward-now' | 'later'>('test-more')

  const formatPhoneNumber = (phone: string) => {
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

  const handleContinue = () => {
    onStepComplete()
  }

  const tierSpecificContent = {
    starter: {
      title: 'Simple Phone Forwarding',
      description: 'Forward your business calls to AI when you\'re ready',
      features: [
        'Basic call forwarding setup',
        'Easy rollback if needed',
        'Simple instructions provided',
        'Support available if issues arise'
      ]
    },
    professional: {
      title: 'Professional Phone Management',
      description: 'Advanced call routing with business hours support',
      features: [
        'Business hours vs after-hours routing',
        'Call analytics and tracking',
        'Multiple forwarding options',
        'Payment integration with calls',
        'Customer data sync with calls'
      ]
    },
    business: {
      title: 'Enterprise Phone Management',
      description: 'Multi-location phone forwarding and management',
      features: [
        'Bulk forwarding for multiple locations',
        'Location-specific AI contexts',
        'Advanced routing and backup options',
        'Cross-location call analytics',
        'Enterprise support for setup'
      ]
    }
  }

  const content = tierSpecificContent[planTier]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {content.title}
        </h3>
        <p className="text-gray-600">
          {content.description}
        </p>
      </div>

      {/* Current Setup Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-4 text-center">
          📞 Your Current Phone Setup
        </h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* AI Phone Number */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-500">
            <div className="text-center">
              <PhoneIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h5 className="font-semibold text-gray-900 mb-1">AI Assistant Line</h5>
              <div className="text-lg font-bold text-green-600 mb-2">
                {formatPhoneNumber(phoneNumber)}
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Active & Taking Calls
              </span>
            </div>
          </div>

          {/* Business Phone Number */}
          <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
            <div className="text-center">
              <PhoneIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h5 className="font-semibold text-gray-900 mb-1">Your Business Line</h5>
              <div className="text-lg font-bold text-blue-600 mb-2">
                {formatPhoneNumber(existingPhoneNumber)}
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Safe & Unchanged
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">What would you like to do?</h4>
        
        {/* Test More */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'test-more' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('test-more')}
        >
          <div className="flex items-start space-x-3">
            <input 
              type="radio" 
              checked={selectedOption === 'test-more'} 
              onChange={() => setSelectedOption('test-more')}
              className="mt-1" 
            />
            <div>
              <h5 className="font-semibold text-gray-900">🧪 Keep Testing First</h5>
              <p className="text-gray-600 text-sm mt-1">
                Continue using your dedicated AI line for testing. Forward your business line later when you're completely confident.
              </p>
              <p className="text-green-700 text-sm font-medium mt-2">
                ✅ Recommended: Build confidence with more test calls first
              </p>
            </div>
          </div>
        </div>

        {/* Forward Now */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'forward-now' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('forward-now')}
        >
          <div className="flex items-start space-x-3">
            <input 
              type="radio" 
              checked={selectedOption === 'forward-now'} 
              onChange={() => setSelectedOption('forward-now')}
              className="mt-1" 
            />
            <div>
              <h5 className="font-semibold text-gray-900">🚀 Forward Business Line Now</h5>
              <p className="text-gray-600 text-sm mt-1">
                I'm confident in the AI! Forward {formatPhoneNumber(existingPhoneNumber)} to {formatPhoneNumber(phoneNumber)} right now.
              </p>
              <ul className="text-gray-600 text-sm mt-2 space-y-1">
                {content.features.slice(0, 2).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Later */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'later' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('later')}
        >
          <div className="flex items-start space-x-3">
            <input 
              type="radio" 
              checked={selectedOption === 'later'} 
              onChange={() => setSelectedOption('later')}
              className="mt-1" 
            />
            <div>
              <h5 className="font-semibold text-gray-900">📅 Set Up Forwarding Later</h5>
              <p className="text-gray-600 text-sm mt-1">
                Skip phone forwarding for now. I'll set it up from Settings → Phone when I'm ready.
              </p>
              <p className="text-purple-700 text-sm font-medium mt-2">
                💡 You can always change this decision later
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Messaging */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-gray-900 mb-2">🛡️ Complete Safety Guarantee</h5>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>✅ Your business line stays safe and unchanged until YOU decide</li>
              <li>✅ Forwarding can be reversed instantly if needed</li>
              <li>✅ Test calls work perfectly right now - no pressure to forward</li>
              <li>✅ Professional support available 24/7 for any issues</li>
              {planTier === 'business' && (
                <li>✅ Enterprise support includes hands-on forwarding assistance</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Based on Selection */}
      {selectedOption === 'forward-now' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-semibold text-yellow-800 mb-2">📋 Next Steps for Forwarding:</h5>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>Complete this dashboard training first</li>
            <li>Go to Settings → Phone Management</li>
            <li>Follow the step-by-step forwarding wizard</li>
            <li>Test the forwarding with a trial call</li>
            <li>Go live with confidence!</li>
          </ol>
        </div>
      )}

      {selectedOption === 'test-more' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-800 mb-2">🎯 Great Choice! Continue Testing:</h5>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>✅ Make more test calls to {formatPhoneNumber(phoneNumber)}</li>
            <li>✅ Try different services and booking scenarios</li>
            <li>✅ Share the AI number with friends/family for testing</li>
            <li>✅ Forward your business line when you feel 100% confident</li>
          </ul>
        </div>
      )}

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue Dashboard Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Phone forwarding will always be available in Settings → Phone when you're ready
        </p>
      </div>
    </div>
  )
}