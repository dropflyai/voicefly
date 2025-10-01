'use client'

import { useState } from 'react'
import { 
  CheckIcon, 
  XMarkIcon,
  SparklesIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { StarIcon as CrownIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

interface PlanComparisonProps {
  currentPlan?: 'starter' | 'professional' | 'business'
  highlightPlan?: 'starter' | 'professional' | 'business'
  onClose?: () => void
  showModal?: boolean
}

interface PlanFeature {
  name: string
  starter: boolean | string
  professional: boolean | string
  business: boolean | string
  category: 'core' | 'communication' | 'payment' | 'analytics' | 'business'
}

const PLAN_FEATURES: PlanFeature[] = [
  // Core Features - AI Voice
  { name: '24/7 AI Voice Assistant', starter: 'Shared AI', professional: 'Shared AI', business: 'CUSTOM AI', category: 'core' },
  { name: 'Dedicated Phone Number', starter: true, professional: true, business: true, category: 'core' },
  { name: 'Web Booking Widget', starter: true, professional: true, business: true, category: 'core' },
  { name: 'Monthly Appointments', starter: 'Up to 200', professional: 'Unlimited', business: 'Unlimited', category: 'core' },
  { name: 'Customer Database', starter: true, professional: true, business: true, category: 'core' },
  
  // Analytics & Reporting
  { name: 'Analytics Dashboard', starter: false, professional: true, business: true, category: 'analytics' },
  { name: 'Revenue Tracking', starter: false, professional: true, business: true, category: 'analytics' },
  { name: 'Staff Performance', starter: false, professional: true, business: true, category: 'analytics' },
  { name: 'Service Analytics', starter: false, professional: true, business: true, category: 'analytics' },
  { name: 'Cross-Location Analytics', starter: false, professional: false, business: true, category: 'analytics' },
  
  // Communication & Marketing
  { name: 'Basic SMS Confirmations', starter: true, professional: true, business: true, category: 'communication' },
  { name: 'Automated 24hr Reminders', starter: false, professional: true, business: true, category: 'communication' },
  { name: 'Email Marketing Campaigns', starter: false, professional: true, business: true, category: 'communication' },
  { name: 'SMS Marketing Campaigns', starter: false, professional: true, business: true, category: 'communication' },
  { name: 'Customer Segmentation', starter: false, professional: true, business: true, category: 'communication' },
  
  // Payment & Loyalty
  { name: 'Square Payment Processing', starter: false, professional: true, business: true, category: 'payment' },
  { name: 'Stripe Payment Processing', starter: false, professional: true, business: true, category: 'payment' },
  { name: 'Loyalty Points Program', starter: false, professional: true, business: true, category: 'payment' },
  { name: 'Tier-Based Rewards', starter: false, professional: true, business: true, category: 'payment' },
  { name: 'Points Auto-Award', starter: false, professional: true, business: true, category: 'payment' },
  
  // Branding & Customization
  { name: 'Custom Branding', starter: false, professional: true, business: true, category: 'business' },
  { name: 'Logo Upload', starter: false, professional: true, business: true, category: 'business' },
  { name: 'Color Customization', starter: false, professional: true, business: true, category: 'business' },
  
  // Multi-Location & Enterprise
  { name: 'Business Locations', starter: '1 Location', professional: '1 Location', business: 'Up to 3', category: 'business' },
  { name: 'White-Label Options', starter: false, professional: false, business: true, category: 'business' },
  { name: 'Custom Domain Support', starter: false, professional: false, business: true, category: 'business' },
  { name: 'API Access', starter: false, professional: false, business: true, category: 'business' },
  { name: 'Priority Support', starter: false, professional: false, business: true, category: 'business' },
]

const PLANS = {
  starter: {
    name: 'AI Starter',
    price: 67,
    yearlyPrice: 57,
    description: 'Never miss another booking with 24/7 AI',
    color: 'gray',
    icon: SparklesIcon,
    popular: false
  },
  professional: {
    name: 'AI Professional', 
    price: 147,
    yearlyPrice: 125,
    description: 'Grow smarter with AI, analytics & loyalty',
    color: 'blue',
    icon: CrownIcon,
    popular: true
  },
  business: {
    name: 'AI Business',
    price: 297,
    yearlyPrice: 252,
    description: 'Custom AI & multi-location management',
    color: 'purple',
    icon: BuildingStorefrontIcon,
    popular: false
  }
}

const FEATURE_CATEGORIES = {
  core: '🎯 Core Features',
  communication: '📧 Communication',
  payment: '💳 Payments & Loyalty', 
  analytics: '📊 Analytics & Reporting',
  business: '🏢 Business & Integrations'
}

export default function PlanComparison({ 
  currentPlan, 
  highlightPlan, 
  onClose, 
  showModal = false 
}: PlanComparisonProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFeatures = selectedCategory 
    ? PLAN_FEATURES.filter(f => f.category === selectedCategory)
    : PLAN_FEATURES

  const renderFeatureValue = (value: boolean | string, planKey: string) => {
    if (value === true) {
      return <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
    }
    if (value === false) {
      return <span className="text-gray-300 mx-auto">—</span>
    }
    return <span className="text-sm text-gray-700 text-center">{value}</span>
  }

  const content = (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose the Perfect Plan
        </h2>
        <p className="text-gray-600 mb-6">
          Upgrade or downgrade anytime. All plans include 30-day money-back guarantee.
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-600 font-bold">Save 15%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(PLANS).map(([planKey, plan]) => {
          const isCurrentPlan = currentPlan === planKey
          const isHighlighted = highlightPlan === planKey || plan.popular
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price
          const Icon = plan.icon

          return (
            <div
              key={planKey}
              className={`relative bg-white rounded-xl border-2 p-6 ${
                isHighlighted
                  ? `border-${plan.color}-500 shadow-lg`
                  : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-blue-200' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    CURRENT
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className={`w-12 h-12 bg-${plan.color}-100 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ${price}
                    <span className="text-lg text-gray-600 font-normal">/mo</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-gray-500">
                      ${plan.price * 12} billed annually
                    </div>
                  )}
                </div>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-100 text-gray-500 font-medium rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <Link
                    href={`/dashboard/settings/billing?upgrade=${planKey}&billing=${billingCycle}`}
                    className={`block w-full py-3 bg-${plan.color}-600 text-white font-semibold rounded-lg hover:bg-${plan.color}-700 transition-colors text-center`}
                  >
                    {currentPlan && planKey === 'starter' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Feature Comparison
          </h3>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Features
            </button>
            {Object.entries(FEATURE_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                {Object.entries(PLANS).map(([planKey, plan]) => (
                  <th key={planKey} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeatures.map((feature, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feature.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {renderFeatureValue(feature.starter, 'starter')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {renderFeatureValue(feature.professional, 'professional')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {renderFeatureValue(feature.business, 'business')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h4>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-800">Can I change plans anytime?</p>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">What happens if I exceed my plan limits?</p>
            <p className="text-gray-600">We'll notify you before you reach limits and offer upgrade options. Your service won't be interrupted.</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">Is there a money-back guarantee?</p>
            <p className="text-gray-600">Yes, all plans include a 30-day money-back guarantee. Cancel within 30 days for a full refund.</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          {onClose && (
            <div className="flex justify-end p-4 border-b border-gray-200">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          )}
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return <div className="max-w-6xl mx-auto">{content}</div>
}