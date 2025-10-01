'use client'

import { useState } from 'react'
import { 
  SparklesIcon, 
  XMarkIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PlanUpgradePromptProps {
  currentPlan: 'starter' | 'professional' | 'business'
  requiredPlan: 'professional' | 'business'
  featureName: string
  featureDescription: string
  onClose?: () => void
  showComparison?: boolean
}

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 47,
    color: 'gray',
    features: [
      '24/7 AI Voice Booking',
      'Web Booking Widget', 
      'Customer Management',
      'SMS Notifications',
      'Single Location'
    ]
  },
  professional: {
    name: 'Professional', 
    price: 97,
    color: 'blue',
    features: [
      'Everything in Starter',
      'Payment Processing',
      'Loyalty Program',
      'Email Marketing',
      'Advanced Analytics',
      'Priority Support'
    ]
  },
  business: {
    name: 'Business',
    price: 197, 
    color: 'purple',
    features: [
      'Everything in Professional',
      'Up to 3 Locations',
      'Custom Integrations',
      'White-Label Options',
      'Priority Phone Support',
      'Advanced Reporting'
    ]
  }
}

export default function PlanUpgradePrompt({
  currentPlan,
  requiredPlan,
  featureName,
  featureDescription,
  onClose,
  showComparison = true
}: PlanUpgradePromptProps) {
  const [showFullComparison, setShowFullComparison] = useState(false)
  
  const currentPlanDetails = PLAN_DETAILS[currentPlan]
  const requiredPlanDetails = PLAN_DETAILS[requiredPlan]

  const savings = requiredPlan === 'professional' 
    ? Math.round((requiredPlanDetails.price * 12) * 0.15) // 15% annual discount
    : Math.round((requiredPlanDetails.price * 12) * 0.20) // 20% annual discount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${requiredPlanDetails.color}-100`}>
              <SparklesIcon className={`w-6 h-6 text-${requiredPlanDetails.color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upgrade Required</h2>
              <p className="text-gray-600">Unlock {featureName} with {requiredPlanDetails.name}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Feature Highlight */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{featureName}</h3>
              <p className="text-gray-600 mb-4">{featureDescription}</p>
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Available in {requiredPlanDetails.name} Plan
              </div>
            </div>
          </div>

          {showComparison && (
            <>
              {/* Quick Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Current Plan */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {currentPlanDetails.name} (Current)
                    </h4>
                    <div className="text-2xl font-bold text-gray-600 mb-4">
                      ${currentPlanDetails.price}/mo
                    </div>
                    <div className="space-y-2">
                      {currentPlanDetails.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 mt-2">
                        +{currentPlanDetails.features.length - 3} more features
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Plan */}
                <div className={`border-2 border-${requiredPlanDetails.color}-500 rounded-xl p-4 relative overflow-hidden`}>
                  {/* Recommended Badge */}
                  <div className={`absolute top-0 right-0 bg-${requiredPlanDetails.color}-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg`}>
                    RECOMMENDED
                  </div>
                  
                  <div className="text-center">
                    <h4 className={`font-semibold text-${requiredPlanDetails.color}-900 mb-2`}>
                      {requiredPlanDetails.name}
                    </h4>
                    <div className="mb-4">
                      <div className={`text-2xl font-bold text-${requiredPlanDetails.color}-600`}>
                        ${requiredPlanDetails.price}/mo
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Save ${savings}/year with annual billing
                      </div>
                    </div>
                    <div className="space-y-2">
                      {requiredPlanDetails.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className={`flex items-center text-sm text-${requiredPlanDetails.color}-700`}>
                          <CheckIcon className={`w-4 h-4 text-${requiredPlanDetails.color}-500 mr-2 flex-shrink-0`} />
                          {feature}
                        </div>
                      ))}
                      <div className={`text-xs text-${requiredPlanDetails.color}-600 mt-2`}>
                        +{requiredPlanDetails.features.length - 3} more features
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Comparison Toggle */}
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowFullComparison(!showFullComparison)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  {showFullComparison ? 'Hide' : 'Show'} Full Feature Comparison
                </button>
              </div>

              {/* Full Feature Comparison */}
              {showFullComparison && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Complete Feature Comparison</h4>
                  <div className="space-y-3">
                    {Object.entries(PLAN_DETAILS).map(([planKey, plan]) => (
                      <div key={planKey} className="border-b border-gray-200 pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{plan.name}</h5>
                          <span className="text-lg font-bold">${plan.price}/mo</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckIcon className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Call to Action */}
          <div className="space-y-4">
            <Link
              href={`/dashboard/settings/billing?upgrade=${requiredPlan}`}
              className={`w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-${requiredPlanDetails.color}-600 to-${requiredPlanDetails.color}-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all`}
            >
              Upgrade to {requiredPlanDetails.name}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
                Instant access
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-4 h-4 text-green-500 mr-1" />
                30-day money back
              </div>
            </div>

            {/* Alternative Actions */}
            <div className="text-center space-y-2">
              <Link
                href="/dashboard/settings/billing"
                className="block text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All Plans & Pricing
              </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="block w-full text-gray-500 hover:text-gray-700 text-sm"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}