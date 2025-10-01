'use client'

import { StarIcon, GiftIcon, TrophyIcon } from '@heroicons/react/24/outline'
import type { LoyaltyCustomer, LoyaltyTier } from '../lib/supabase-types-mvp'

interface LoyaltyPointsDisplayProps {
  customer: LoyaltyCustomer
  tiers?: LoyaltyTier[]
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  showTierInfo?: boolean
  className?: string
}

export default function LoyaltyPointsDisplay({
  customer,
  tiers = [],
  size = 'md',
  showProgress = true,
  showTierInfo = true,
  className = ''
}: LoyaltyPointsDisplayProps) {
  const currentTier = tiers.find(t => t.id === customer.current_tier_id)
  const nextTier = tiers
    .filter(t => t.min_points > customer.total_points)
    .sort((a, b) => a.min_points - b.min_points)[0]

  const progressToNextTier = nextTier 
    ? Math.min(100, ((customer.total_points - (currentTier?.min_points || 0)) / (nextTier.min_points - (currentTier?.min_points || 0))) * 100)
    : 100

  const sizeClasses = {
    sm: {
      container: 'p-3',
      points: 'text-lg',
      tier: 'text-xs',
      icon: 'h-4 w-4'
    },
    md: {
      container: 'p-4',
      points: 'text-xl',
      tier: 'text-sm',
      icon: 'h-5 w-5'
    },
    lg: {
      container: 'p-6',
      points: 'text-2xl',
      tier: 'text-base',
      icon: 'h-6 w-6'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 ${classes.container} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="p-2 rounded-full"
            style={{ backgroundColor: currentTier?.color || '#6B7280' }}
          >
            <StarIcon className={`${classes.icon} text-white`} />
          </div>
          {showTierInfo && currentTier && (
            <div>
              <div className={`font-medium text-gray-900 ${classes.tier}`}>
                {currentTier.name} Member
              </div>
              {currentTier.discount_percentage > 0 && (
                <div className="text-xs text-purple-600">
                  {currentTier.discount_percentage}% discount
                </div>
              )}
            </div>
          )}
        </div>
        <GiftIcon className={`${classes.icon} text-purple-600`} />
      </div>

      {/* Points Display */}
      <div className="text-center mb-3">
        <div className={`font-bold text-gray-900 ${classes.points}`}>
          {customer.total_points.toLocaleString()}
        </div>
        <div className={`text-gray-600 ${classes.tier}`}>
          {customer.total_points === 1 ? 'point' : 'points'} available
        </div>
      </div>

      {/* Progress to Next Tier */}
      {showProgress && nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Progress to {nextTier.name}</span>
            <span>{nextTier.min_points - customer.total_points} points to go</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progressToNextTier}%`,
                backgroundColor: nextTier.color || '#8B5CF6'
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {size === 'lg' && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-purple-200">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {customer.points_earned.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Earned</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {customer.points_redeemed.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Redeemed</div>
          </div>
        </div>
      )}

      {/* Top Tier Badge */}
      {!nextTier && (
        <div className="flex items-center justify-center mt-2 text-xs text-amber-600">
          <TrophyIcon className="h-3 w-3 mr-1" />
          Top Tier Member!
        </div>
      )}
    </div>
  )
}