'use client'

import { useState, useEffect } from 'react'
import {
  StarIcon,
  GiftIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import type { LoyaltyCustomer, LoyaltyTier } from '../lib/supabase-types-mvp'

interface LoyaltyPointsEarnedProps {
  customer: LoyaltyCustomer | null
  pointsEarned: number
  previousTier: LoyaltyTier | null
  newTier: LoyaltyTier | null
  isOpen: boolean
  onClose: () => void
  paymentAmount?: number
  className?: string
}

export default function LoyaltyPointsEarned({
  customer,
  pointsEarned,
  previousTier,
  newTier,
  isOpen,
  onClose,
  paymentAmount = 0,
  className = ''
}: LoyaltyPointsEarnedProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [displayPoints, setDisplayPoints] = useState(0)

  // Animate points counting up
  useEffect(() => {
    if (isOpen && pointsEarned > 0) {
      setShowAnimation(true)
      let current = 0
      const increment = Math.max(1, Math.ceil(pointsEarned / 20)) // Animate over ~20 steps
      const timer = setInterval(() => {
        current += increment
        if (current >= pointsEarned) {
          setDisplayPoints(pointsEarned)
          clearInterval(timer)
        } else {
          setDisplayPoints(current)
        }
      }, 50)

      return () => clearInterval(timer)
    }
  }, [isOpen, pointsEarned])

  const tierUpgrade = previousTier && newTier && previousTier.id !== newTier.id
  const isNewCustomer = !customer || customer.total_points === pointsEarned

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full p-8 ${className}`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Header Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 mb-6">
              {tierUpgrade ? (
                <TrophyIcon className="h-8 w-8 text-yellow-600" />
              ) : (
                <StarIcon className="h-8 w-8 text-purple-600" />
              )}
            </div>

            {/* Main Message */}
            <div className="mb-6">
              {tierUpgrade ? (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 Tier Upgrade!
                  </h3>
                  <p className="text-lg text-gray-600">
                    Welcome to {newTier?.name}!
                  </p>
                </div>
              ) : isNewCustomer ? (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Loyalty!
                  </h3>
                  <p className="text-lg text-gray-600">
                    You've earned your first points!
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Points Earned!
                  </h3>
                  <p className="text-lg text-gray-600">
                    Thanks for your visit!
                  </p>
                </div>
              )}
            </div>

            {/* Points Display */}
            <div className="relative mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                {/* Animated Points */}
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className={`text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${showAnimation ? 'animate-bounce' : ''}`}>
                      +{displayPoints}
                    </div>
                    {showAnimation && (
                      <div className="absolute -top-2 -right-2">
                        <SparklesIcon className="h-6 w-6 text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  <StarIconSolid className="h-8 w-8 text-yellow-400 ml-2" />
                </div>
                
                <p className="text-purple-700 font-medium">
                  {displayPoints === 1 ? 'Point' : 'Points'} Earned
                </p>
                
                {paymentAmount > 0 && (
                  <p className="text-sm text-purple-600 mt-2">
                    From ${(paymentAmount / 100).toFixed(2)} purchase
                  </p>
                )}
              </div>
            </div>

            {/* Tier Information */}
            {newTier && (
              <div className="mb-6">
                {tierUpgrade && previousTier ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: previousTier.color }}
                      >
                        {previousTier.name}
                      </div>
                      <div className="text-yellow-600">→</div>
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: newTier.color }}
                      >
                        {newTier.name}
                      </div>
                    </div>
                    
                    {newTier.discount_percentage > 0 && (
                      <div className="text-yellow-800 font-medium">
                        🎊 You now get {newTier.discount_percentage}% off all services!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <div 
                        className="px-4 py-2 rounded-full text-sm font-medium text-white flex items-center"
                        style={{ backgroundColor: newTier.color }}
                      >
                        <StarIconSolid className="h-4 w-4 mr-1" />
                        {newTier.name} Member
                      </div>
                    </div>
                    
                    {customer && (
                      <p className="text-gray-600 text-sm">
                        Total Points: {(customer.total_points + pointsEarned).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Next Tier Progress */}
            {customer && newTier && (
              <div className="mb-6">
                {/* Find next tier */}
                {(() => {
                  const currentPoints = customer.total_points + pointsEarned
                  // This would normally come from props or API, using mock progression
                  const nextTierPoints = newTier.min_points + 250 // Mock next tier requirement
                  const remainingPoints = Math.max(0, nextTierPoints - currentPoints)
                  
                  if (remainingPoints > 0) {
                    const progress = Math.min(100, (currentPoints / nextTierPoints) * 100)
                    
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Progress to Next Tier
                        </h4>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600">
                          {remainingPoints} more points to unlock the next tier
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-center">
                        <TrophyIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 font-medium">
                          You've reached the highest tier!
                        </span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Benefits */}
            {tierUpgrade && newTier?.benefits && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Your New Benefits:
                </h4>
                <div className="space-y-2">
                  {newTier.benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <GiftIcon className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
            >
              {tierUpgrade ? '🎉 Awesome!' : 'Great, Thanks!'}
            </button>

            {/* Footer Message */}
            <p className="text-xs text-gray-500 mt-4">
              Keep earning points with every visit to unlock more rewards!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}