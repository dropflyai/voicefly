'use client'

import { useState, useEffect } from 'react'
import { 
  SparklesIcon,
  CheckIcon,
  CreditCardIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'
import { SubscriptionManager, UpgradeOption, TrialInfo, UsageStats } from '../lib/subscription-manager'

interface UpgradeFlowProps {
  businessId: string
  currentPlan: string
  onUpgradeComplete?: () => void
  onClose?: () => void
}

export default function UpgradeFlow({ 
  businessId, 
  currentPlan, 
  onUpgradeComplete,
  onClose 
}: UpgradeFlowProps) {
  const [subscriptionManager] = useState(new SubscriptionManager(businessId))
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([])
  const [selectedOption, setSelectedOption] = useState<UpgradeOption | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [step, setStep] = useState<'plans' | 'billing' | 'confirmation' | 'processing'>('plans')
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUpgradeData()
  }, [currentPlan])

  const loadUpgradeData = async () => {
    try {
      setIsLoading(true)
      
      const [options, subscription] = await Promise.all([
        subscriptionManager.getUpgradeOptions(currentPlan),
        subscriptionManager.getCurrentSubscription()
      ])
      
      setUpgradeOptions(options)
      if (subscription) {
        setTrialInfo(subscription.trial_info)
        setUsageStats(subscription.usage_stats)
      }
    } catch (error) {
      console.error('Error loading upgrade data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = (option: UpgradeOption) => {
    setSelectedOption(option)
    setStep('billing')
  }

  const handleStartTrial = async (planId: string) => {
    try {
      const result = await subscriptionManager.startTrial(planId, 14)
      if (result.success) {
        onUpgradeComplete?.()
      }
    } catch (error) {
      console.error('Error starting trial:', error)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedOption) return

    setStep('processing')
    
    try {
      const result = await subscriptionManager.upgradePlan(
        selectedOption.plan.id,
        billingCycle
      )
      
      if (result.success) {
        setStep('confirmation')
        setTimeout(() => {
          onUpgradeComplete?.()
        }, 2000)
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      setStep('billing')
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {step === 'plans' && (
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock More Features</h2>
              <p className="text-gray-600">Choose the perfect plan for your growing business</p>
              
              {trialInfo?.is_trial && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center text-orange-800">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      Your {trialInfo.trial_plan} trial ends in {trialInfo.trial_days_remaining} days
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            {usageStats && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Your Current Usage</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{usageStats.bookings_this_month}</div>
                    <div className="text-sm text-gray-600">Bookings This Month</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{usageStats.locations_count}</div>
                    <div className="text-sm text-gray-600">Locations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${(usageStats.payment_volume / 100).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Volume</div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    17% off
                  </span>
                </button>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="grid gap-6">
              {upgradeOptions.map((option) => (
                <div key={option.plan.id} className="border rounded-lg p-6 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{option.plan.name}</h3>
                        {option.plan.popular && (
                          <span className="ml-3 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Most Popular
                          </span>
                        )}
                      </div>
                      
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        ${billingCycle === 'yearly' ? option.plan.price_yearly : option.plan.price_monthly}
                        <span className="text-lg font-normal text-gray-600">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>

                      {billingCycle === 'yearly' && (
                        <div className="text-sm text-green-600 mb-4">
                          Save ${(option.plan.price_monthly * 12) - option.plan.price_yearly} per year
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">What you'll unlock:</h4>
                        <ul className="space-y-2">
                          {option.immediate_benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {option.upgrade_cost > 0 && (
                        <div className="text-sm text-gray-600 mb-4">
                          <div>Monthly increase: <span className="font-medium">${option.upgrade_cost}</span></div>
                          <div>Prorated today: <span className="font-medium">${option.prorated_amount.toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSelectPlan(option)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </button>
                    
                    {!trialInfo?.is_trial && (
                      <button
                        onClick={() => handleStartTrial(option.plan.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        14-Day Trial
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {step === 'billing' && selectedOption && (
          <div className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Upgrade</h2>
              <p className="text-gray-600">
                Upgrading to <span className="font-medium">{selectedOption.plan.name}</span>
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{selectedOption.plan.name} Plan</span>
                    <span>${billingCycle === 'yearly' ? selectedOption.plan.price_yearly : selectedOption.plan.price_monthly}/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                  {selectedOption.prorated_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Prorated amount (today)</span>
                      <span>${selectedOption.prorated_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total Today</span>
                    <span>${selectedOption.prorated_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Payment Method</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-2" />
                  Payment processing integration coming soon. For now, upgrades will be processed manually.
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('plans')}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
                >
                  Complete Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Upgrade</h2>
              <p className="text-gray-600">This will just take a moment...</p>
            </div>
          </div>
        )}

        {step === 'confirmation' && selectedOption && (
          <div className="p-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full inline-flex mb-4">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Complete! 🎉</h2>
              <p className="text-gray-600 mb-6">
                Welcome to <span className="font-medium">{selectedOption.plan.name}</span>! 
                You now have access to all the new features.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-purple-900 mb-2">What's New:</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  {selectedOption.immediate_benefits.map((benefit, index) => (
                    <li key={index}>✓ {benefit}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onUpgradeComplete}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
              >
                Start Exploring
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}