'use client'

import React, { useState } from 'react'
import { StarIcon, GiftIcon, TrophyIcon, ArrowRightIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { getCurrentBusinessId } from '../../../lib/auth-utils'

interface LoyaltyProgramIntroProps {
  planTier: 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

export default function LoyaltyProgramIntro({
  planTier,
  businessName,
  onStepComplete
}: LoyaltyProgramIntroProps) {
  const [programSettings, setProgramSettings] = useState({
    enabled: true,
    pointsPerDollar: 1,
    bonusPointsPerVisit: 10,
    tierSystem: 'standard',
    programName: `${businessName} Rewards`
  })

  // Apply Settings state management
  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [showCustomization, setShowCustomization] = useState(false)

  const handleContinue = () => {
    onStepComplete()
  }

  const applyLoyaltyProgram = async () => {
    setIsApplying(true)
    setApplyError(null)

    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) {
        throw new Error('No business ID found')
      }

      const loyaltyProgramData = {
        business_id: businessId,
        name: programSettings.programName,
        points_per_dollar: programSettings.pointsPerDollar,
        bonus_points_per_visit: programSettings.bonusPointsPerVisit,
        is_active: true,
        tiers: loyaltyTiers.map(tier => ({
          name: tier.name,
          requirement: parseInt(tier.requirement.replace(/\D/g, '')) || 0,
          benefits: tier.benefits,
          icon: tier.icon
        })),
        rewards: rewardOptions
      }

      const response = await fetch('/api/loyalty/program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loyaltyProgramData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to create loyalty program')
      }

      setApplied(true)
      console.log('✅ Loyalty program created and will appear in dashboard!')
      
    } catch (error) {
      console.error('❌ Failed to create loyalty program:', error)
      setApplyError(error instanceof Error ? error.message : 'Setup failed')
    } finally {
      setIsApplying(false)
    }
  }

  const loyaltyTiers = [
    {
      name: 'Bronze',
      requirement: '0 points',
      color: 'bg-orange-100 text-orange-800',
      benefits: ['Welcome gift', 'Birthday discount'],
      icon: '🥉'
    },
    {
      name: 'Silver',
      requirement: '500 points',
      color: 'bg-gray-100 text-gray-800',
      benefits: ['5% service discount', 'Priority booking', 'Free nail file'],
      icon: '🥈'
    },
    {
      name: 'Gold',
      requirement: '1,500 points',
      color: 'bg-yellow-100 text-yellow-800',
      benefits: ['10% service discount', 'Complimentary nail art', 'Free upgrades'],
      icon: '🥇'
    },
    {
      name: 'Platinum',
      requirement: '3,000 points',
      color: 'bg-purple-100 text-purple-800',
      benefits: ['15% service discount', 'VIP treatment', 'Exclusive services'],
      icon: '💎'
    }
  ]

  const rewardOptions = [
    { points: 100, reward: '$5 Service Credit', popular: true },
    { points: 250, reward: '$15 Off Next Service', popular: true },
    { points: 500, reward: '$35 Service Credit', popular: false },
    { points: 1000, reward: 'Free Basic Service', popular: true },
    { points: 1500, reward: 'Free Premium Service', popular: false },
    { points: 2000, reward: 'Spa Day Package', popular: false }
  ]

  const tierBenefits = {
    professional: [
      'Automated point earning and tracking',
      '4-tier customer loyalty system',
      'Customizable rewards and redemptions',
      'Birthday and anniversary bonuses',
      'Loyalty analytics and insights',
      'Email notifications for point milestones'
    ],
    business: [
      'Multi-location loyalty program',
      'Cross-location point redemption',
      'Advanced customer segmentation',
      'Enterprise loyalty reporting',
      'Custom tier requirements per location',
      'Franchise-level loyalty management',
      'VIP customer identification',
      'Advanced retention analytics'
    ]
  }

  const businessImpactStats = {
    professional: [
      { metric: 'Customer Retention', improvement: '+35%', icon: '🔄' },
      { metric: 'Visit Frequency', improvement: '+28%', icon: '📅' },
      { metric: 'Average Spending', improvement: '+22%', icon: '💰' }
    ],
    business: [
      { metric: 'Customer Retention', improvement: '+45%', icon: '🔄' },
      { metric: 'Visit Frequency', improvement: '+38%', icon: '📅' },
      { metric: 'Average Spending', improvement: '+32%', icon: '💰' },
      { metric: 'Cross-Location Visits', improvement: '+15%', icon: '🏢' }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <StarIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Loyalty Program Available
        </h3>
        <p className="text-gray-600">
          Turn one-time customers into regular clients with an automated loyalty rewards program.
        </p>
      </div>

      {/* Business Impact */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">
          📈 Expected Business Impact:
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {businessImpactStats[planTier].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg font-bold text-green-600">{stat.improvement}</div>
              <div className="text-xs text-green-700">{stat.metric}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">
          🔄 How It Works Automatically:
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-blue-800 text-sm">Customer books and completes appointment</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-blue-800 text-sm">Points automatically awarded (1 point per $1 + 10 bonus points per visit)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-blue-800 text-sm">Customer receives SMS/email about points earned and tier progress</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <span className="text-blue-800 text-sm">Customers redeem points for rewards on future visits</span>
          </div>
        </div>
      </div>

      {/* Loyalty Tiers */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">🏆 4-Tier Loyalty System:</h4>
        
        <div className="grid grid-cols-2 gap-3">
          {loyaltyTiers.map((tier, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tier.icon}</span>
                  <span className="font-semibold text-gray-900">{tier.name}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tier.color}`}>
                  {tier.requirement}
                </span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {tier.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Reward Options */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">🎁 Popular Reward Options:</h4>
        
        <div className="grid grid-cols-2 gap-3">
          {rewardOptions.map((reward, index) => (
            <div key={index} className={`border rounded-lg p-3 ${reward.popular ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{reward.points} pts</span>
                {reward.popular && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">{reward.reward}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Program Settings */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-3">⚙️ Program Settings:</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800 font-medium">Enable Loyalty Program</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={programSettings.enabled}
                onChange={(e) => setProgramSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-yellow-800">Points per $1 spent</span>
            <select
              value={programSettings.pointsPerDollar}
              onChange={(e) => setProgramSettings(prev => ({ ...prev, pointsPerDollar: parseInt(e.target.value) }))}
              className="px-2 py-1 border border-yellow-300 rounded text-sm"
            >
              <option value={1}>1 point</option>
              <option value={2}>2 points</option>
              <option value={5}>5 points</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-yellow-800">Bonus points per visit</span>
            <select
              value={programSettings.bonusPointsPerVisit}
              onChange={(e) => setProgramSettings(prev => ({ ...prev, bonusPointsPerVisit: parseInt(e.target.value) }))}
              className="px-2 py-1 border border-yellow-300 rounded text-sm"
            >
              <option value={5}>5 points</option>
              <option value={10}>10 points</option>
              <option value={20}>20 points</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Loyalty Features:
        </h4>
        <ul className="text-purple-800 text-sm space-y-1">
          {tierBenefits[planTier].map((benefit, index) => (
            <li key={index}>✅ {benefit}</li>
          ))}
        </ul>
      </div>

      {/* Apply Settings Section - Option C Implementation */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="font-semibold text-gray-900 mb-4">💡 Want to activate this loyalty program now?</h4>
        
        {!applied ? (
          <div className="space-y-4">
            {/* Quick Setup Option */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-semibold text-green-900 mb-2">🚀 Quick Setup</h5>
                  <p className="text-green-800 text-sm mb-3">
                    We'll create "{programSettings.programName}" with these settings:
                  </p>
                  <ul className="text-green-700 text-xs space-y-1 mb-4">
                    <li>• {programSettings.pointsPerDollar} point per $1 spent + {programSettings.bonusPointsPerVisit} bonus points per visit</li>
                    <li>• 4-tier system (Bronze → Silver → Gold → Platinum)</li>
                    <li>• 6 reward options ($5 credit to Spa Package)</li>
                    <li>• Appears immediately in your Loyalty dashboard</li>
                  </ul>
                  
                  {applyError && (
                    <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm mb-3">
                      <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                      {applyError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={applyLoyaltyProgram}
                  disabled={isApplying}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Program...
                    </>
                  ) : (
                    <>
                      <GiftIcon className="w-4 h-4 mr-2" />
                      Activate Loyalty Program
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Customize First
                </button>
              </div>
            </div>

            {/* Customization Panel */}
            {showCustomization && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h6 className="font-medium text-gray-900 mb-3">Customize Program Settings:</h6>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                    <input
                      type="text"
                      value={programSettings.programName}
                      onChange={(e) => setProgramSettings(prev => ({ ...prev, programName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points per $1</label>
                      <select
                        value={programSettings.pointsPerDollar}
                        onChange={(e) => setProgramSettings(prev => ({ ...prev, pointsPerDollar: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value={1}>1 point</option>
                        <option value={2}>2 points</option>
                        <option value={5}>5 points</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bonus per visit</label>
                      <select
                        value={programSettings.bonusPointsPerVisit}
                        onChange={(e) => setProgramSettings(prev => ({ ...prev, bonusPointsPerVisit: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value={5}>5 points</option>
                        <option value={10}>10 points</option>
                        <option value={20}>20 points</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skip Option */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">📅 Setup Later</h5>
                  <p className="text-gray-600 text-sm">Configure from Dashboard → Loyalty anytime</p>
                </div>
                <button
                  onClick={handleContinue}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Success State
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h5 className="font-semibold text-green-900">✅ Loyalty Program Activated!</h5>
                <p className="text-green-800 text-sm">
                  "{programSettings.programName}" is now active and will appear in your Dashboard → Loyalty section.
                  Customer points will start earning automatically!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-2">📋 What Happens Next:</h5>
        <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
          <li>Loyalty program activates automatically</li>
          <li>Customer points start earning with completed appointments</li>
          <li>Automated SMS/email notifications keep customers engaged</li>
          <li>Reward redemptions increase customer return frequency</li>
          <li>View loyalty analytics from your dashboard</li>
        </ol>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Loyalty settings are always available in Settings → Marketing → Loyalty
        </p>
      </div>
    </div>
  )
}