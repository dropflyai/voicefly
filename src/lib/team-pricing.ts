// Team seat pricing configuration

export interface TeamPricingTier {
  id: string
  name: string
  basePrice: number
  includedSeats: number
  additionalSeatPrice: number
  maxSeats: number | null // null = unlimited
}

export const TEAM_PRICING: Record<string, TeamPricingTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    basePrice: 147,
    includedSeats: 1,
    additionalSeatPrice: 39,
    maxSeats: 3
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    basePrice: 397,
    includedSeats: 3,
    additionalSeatPrice: 49,
    maxSeats: 10
  },
  business: {
    id: 'business',
    name: 'Business',
    basePrice: 697,
    includedSeats: 5,
    additionalSeatPrice: 59,
    maxSeats: 25
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 997,
    includedSeats: 10,
    additionalSeatPrice: 69,
    maxSeats: null // unlimited
  }
}

export function calculateTeamCost(
  tier: string,
  totalSeats: number
): {
  basePrice: number
  includedSeats: number
  additionalSeats: number
  additionalSeatCost: number
  totalMonthlyPrice: number
  perSeatPrice: number
} {
  const pricing = TEAM_PRICING[tier]

  if (!pricing) {
    throw new Error(`Invalid pricing tier: ${tier}`)
  }

  const additionalSeats = Math.max(0, totalSeats - pricing.includedSeats)
  const additionalSeatCost = additionalSeats * pricing.additionalSeatPrice
  const totalMonthlyPrice = pricing.basePrice + additionalSeatCost
  const perSeatPrice = totalSeats > 0 ? totalMonthlyPrice / totalSeats : 0

  return {
    basePrice: pricing.basePrice,
    includedSeats: pricing.includedSeats,
    additionalSeats,
    additionalSeatCost,
    totalMonthlyPrice,
    perSeatPrice
  }
}

export function canAddSeats(tier: string, currentSeats: number, seatsToAdd: number): {
  allowed: boolean
  reason?: string
  maxSeats?: number
} {
  const pricing = TEAM_PRICING[tier]

  if (!pricing) {
    return { allowed: false, reason: 'Invalid pricing tier' }
  }

  const newTotal = currentSeats + seatsToAdd

  // Check if unlimited
  if (pricing.maxSeats === null) {
    return { allowed: true }
  }

  // Check against max
  if (newTotal > pricing.maxSeats) {
    return {
      allowed: false,
      reason: `${pricing.name} plan limited to ${pricing.maxSeats} seats. Upgrade to add more.`,
      maxSeats: pricing.maxSeats
    }
  }

  return { allowed: true }
}

export function getRecommendedTier(desiredSeats: number): string {
  // Find the most cost-effective tier for the desired number of seats
  let bestTier = 'starter'
  let lowestCost = Infinity

  for (const [tierId, pricing] of Object.entries(TEAM_PRICING)) {
    if (pricing.maxSeats !== null && desiredSeats > pricing.maxSeats) {
      continue // Skip tiers that can't accommodate the seats
    }

    const cost = calculateTeamCost(tierId, desiredSeats)
    if (cost.totalMonthlyPrice < lowestCost) {
      lowestCost = cost.totalMonthlyPrice
      bestTier = tierId
    }
  }

  return bestTier
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

export function getSeatPricingBreakdown(tier: string, seats: number): string {
  const pricing = TEAM_PRICING[tier]
  if (!pricing) return 'Invalid tier'

  const cost = calculateTeamCost(tier, seats)

  if (cost.additionalSeats === 0) {
    return `${formatPrice(cost.basePrice)}/mo (${seats} seat${seats === 1 ? '' : 's'} included)`
  }

  return `${formatPrice(cost.basePrice)}/mo base + ${formatPrice(cost.additionalSeatCost)}/mo for ${cost.additionalSeats} additional seat${cost.additionalSeats === 1 ? '' : 's'} = ${formatPrice(cost.totalMonthlyPrice)}/mo total`
}
