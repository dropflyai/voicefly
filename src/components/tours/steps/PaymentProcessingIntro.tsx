'use client'

import React, { useState } from 'react'
import { CreditCardIcon, BanknotesIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface PaymentProcessingIntroProps {
  planTier: 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

export default function PaymentProcessingIntro({
  planTier,
  businessName,
  onStepComplete
}: PaymentProcessingIntroProps) {
  const [selectedProcessor, setSelectedProcessor] = useState<'stripe' | 'square' | 'later'>('later')
  const [readyToSetup, setReadyToSetup] = useState(false)

  const handleContinue = () => {
    onStepComplete()
  }

  const processors = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Popular online payment processing with excellent developer tools',
      fees: '2.9% + 30¢ per transaction',
      features: [
        'Accept all major credit cards',
        'Instant payouts available',
        'Built-in fraud protection',
        'Detailed transaction reporting',
        'Automatic tax calculation'
      ],
      icon: '💳',
      bestFor: 'Online bookings and card-not-present transactions'
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Great for in-person payments with optional online processing',
      fees: '2.6% + 10¢ per transaction',
      features: [
        'In-person and online payments',
        'Free card reader available',
        'Inventory management included',
        'Same-day deposits available',
        'No monthly fees'
      ],
      icon: '🏪',
      bestFor: 'Businesses with both in-person and online transactions'
    }
  ]

  const tierBenefits = {
    professional: [
      'Automatic payment collection from AI bookings',
      'Payment confirmation emails to customers',
      'Failed payment retry logic',
      'Basic payment analytics and reporting',
      'Integration with your existing booking system'
    ],
    business: [
      'Multi-location payment processing',
      'Advanced payment analytics across locations',
      'Custom payment flows per location',
      'Enterprise-grade security and compliance',
      'Dedicated account management',
      'Advanced fraud protection'
    ]
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <CreditCardIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Payment Processing Available
        </h3>
        <p className="text-gray-600">
          Your {planTier} plan includes automatic payment processing. Accept credit cards and get paid instantly when customers book through your AI assistant.
        </p>
      </div>

      {/* Plan Benefits */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Includes:
        </h4>
        <ul className="text-green-800 text-sm space-y-1">
          {tierBenefits[planTier].map((benefit, index) => (
            <li key={index}>✅ {benefit}</li>
          ))}
        </ul>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">
          🔄 How Automatic Payments Work:
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-blue-800 text-sm">Customer calls AI and books appointment</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-blue-800 text-sm">AI asks for payment information securely</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-blue-800 text-sm">Payment processed automatically, customer confirmed</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <span className="text-blue-800 text-sm">Money deposited directly to your bank account</span>
          </div>
        </div>
      </div>

      {/* Payment Processor Selection */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Choose Your Payment Processor:</h4>

        {processors.map((processor) => (
          <div 
            key={processor.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedProcessor === processor.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedProcessor(processor.id as 'stripe' | 'square')}
          >
            <div className="flex items-start space-x-3">
              <input 
                type="radio" 
                checked={selectedProcessor === processor.id} 
                onChange={() => setSelectedProcessor(processor.id as 'stripe' | 'square')}
                className="mt-1" 
              />
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{processor.icon}</span>
                  <h5 className="font-semibold text-gray-900">{processor.name}</h5>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {processor.fees}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{processor.description}</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {processor.features.map((feature, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-center">
                      <span className="text-green-500 mr-1">•</span>
                      {feature}
                    </div>
                  ))}
                </div>
                <p className="text-blue-600 text-sm font-medium mt-2">
                  Best for: {processor.bestFor}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Setup Later Option */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedProcessor === 'later' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedProcessor('later')}
        >
          <div className="flex items-start space-x-3">
            <input 
              type="radio" 
              checked={selectedProcessor === 'later'} 
              onChange={() => setSelectedProcessor('later')}
              className="mt-1" 
            />
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📅</span>
                <h5 className="font-semibold text-gray-900">Setup Payment Processing Later</h5>
              </div>
              <p className="text-gray-600 text-sm">
                I'll configure payment processing from Settings → Payments when I'm ready to start accepting payments.
              </p>
              <p className="text-purple-700 text-sm font-medium mt-2">
                💡 Your AI will still book appointments, just without payment collection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-gray-900 mb-2">🔒 Enterprise-Grade Security</h5>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>✅ PCI DSS compliant payment processing</li>
              <li>✅ End-to-end encryption for all transactions</li>
              <li>✅ Advanced fraud detection and prevention</li>
              <li>✅ Secure data storage with bank-level security</li>
              <li>✅ 24/7 monitoring and instant alerts</li>
              {planTier === 'business' && (
                <li>✅ Enterprise compliance (SOX, GDPR, CCPA)</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      {selectedProcessor !== 'later' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-semibold text-yellow-800 mb-2">
            📋 Next Steps for {processors.find(p => p.id === selectedProcessor)?.name} Setup:
          </h5>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>Complete this dashboard training</li>
            <li>Go to Settings → Payments</li>
            <li>Connect your {processors.find(p => p.id === selectedProcessor)?.name} account</li>
            <li>Configure payment settings and preferences</li>
            <li>Test payment processing with a trial transaction</li>
            <li>Start accepting payments automatically!</li>
          </ol>
        </div>
      )}

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Payment processing setup is always available in Settings → Payments
        </p>
      </div>
    </div>
  )
}