'use client'

import { StarIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface LoyaltyTier {
  name: string
  color: string
  minPoints: number
}

interface CustomerLoyaltyBadgeProps {
  points: number
  tierName?: string
  size?: 'sm' | 'md'
  showPoints?: boolean
  className?: string
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze', color: '#CD7F32', minPoints: 0 },
  { name: 'Silver', color: '#C0C0C0', minPoints: 100 },
  { name: 'Gold', color: '#FFD700', minPoints: 250 },
  { name: 'Platinum', color: '#E5E4E2', minPoints: 500 }
]

export default function CustomerLoyaltyBadge({
  points,
  tierName,
  size = 'md',
  showPoints = true,
  className = ''
}: CustomerLoyaltyBadgeProps) {
  // Determine tier based on points
  const currentTier = LOYALTY_TIERS
    .filter(tier => points >= tier.minPoints)
    .pop() || LOYALTY_TIERS[0]

  const nextTier = LOYALTY_TIERS.find(tier => tier.minPoints > points)
  
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      text: 'text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      container: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'h-4 w-4'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`inline-flex items-center space-x-1.5 rounded-full border ${classes.container} ${className}`}
         style={{ 
           backgroundColor: `${currentTier.color}20`,
           borderColor: currentTier.color,
           color: currentTier.color
         }}>
      {/* Tier Icon */}
      <div className="flex items-center">
        {currentTier.name === 'Platinum' ? (
          <TrophyIcon className={classes.icon} />
        ) : (
          <StarIconSolid className={classes.icon} />
        )}
      </div>

      {/* Tier Name */}
      <span className={`font-medium ${classes.text}`}>
        {tierName || currentTier.name}
      </span>

      {/* Points Display */}
      {showPoints && (
        <span className={`font-normal ${classes.text}`} style={{ color: '#6B7280' }}>
          {points} pts
        </span>
      )}
    </div>
  )
}

// Export helper function to get tier info
export function getLoyaltyTier(points: number) {
  const tier = LOYALTY_TIERS
    .filter(tier => points >= tier.minPoints)
    .pop() || LOYALTY_TIERS[0]
  
  const nextTier = LOYALTY_TIERS.find(t => t.minPoints > points)
  const progress = nextTier 
    ? Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
    : 100

  return {
    current: tier,
    next: nextTier,
    progress,
    pointsToNext: nextTier ? nextTier.minPoints - points : 0
  }
}