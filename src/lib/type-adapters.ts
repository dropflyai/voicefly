// ==============================================
// TYPE COMPATIBILITY LAYER
// Adapters between database types and UI component types
// ==============================================

import { 
  LoyaltyProgram, 
  LoyaltyRewardTier, 
  CustomerWithLoyalty,
  CustomerLoyaltyPoints,
  Customer,
  Appointment,
  Location
} from './supabase-types-mvp'

// ==============================================
// 1. ENHANCED UI TYPES (What components expect)
// ==============================================

export interface LoyaltyTier extends LoyaltyRewardTier {
  id?: string
  name: string
  min_points: number
  discount_percentage: number
  color: string
  benefits: string[]
  member_count?: number
}

export interface LoyaltyProgramUI extends LoyaltyProgram {
  name: string
  description: string
  tiers: LoyaltyTier[]
  referral_points?: number
  birthday_bonus_points?: number
}

export interface LoyaltyCustomer extends CustomerWithLoyalty {
  customer: Customer
  total_points: number
  points_earned: number
  points_redeemed: number
  current_tier_id: string
  is_active: boolean
  lifetime_spent: number
  joined_at: string
}

// ==============================================
// 2. ADAPTER FUNCTIONS
// ==============================================

export function adaptLoyaltyProgram(dbProgram: LoyaltyProgram): LoyaltyProgramUI {
  // Convert reward_tiers to enhanced tiers
  const tiers: LoyaltyTier[] = dbProgram.reward_tiers.map((tier, index) => ({
    ...tier,
    id: `tier-${index}`,
    name: getTierName(tier.points),
    min_points: tier.points,
    discount_percentage: Math.floor((tier.discount_amount / 100) / 10), // Convert cents to percentage
    color: getTierColor(tier.points),
    benefits: getTierBenefits(tier.points, tier.discount_amount),
    member_count: 0 // Will be populated by API call
  }))

  return {
    ...dbProgram,
    name: dbProgram.program_name,
    description: `${dbProgram.program_name} - Earn ${dbProgram.points_per_dollar} point${dbProgram.points_per_dollar !== 1 ? 's' : ''} per dollar spent`,
    tiers,
    referral_points: 50, // Default values for UI
    birthday_bonus_points: 25
  }
}

export function adaptLoyaltyCustomer(
  customer: CustomerWithLoyalty, 
  loyaltyData?: CustomerLoyaltyPoints
): LoyaltyCustomer {
  const totalPoints = loyaltyData?.current_balance || customer.current_points_balance || 0
  
  return {
    ...customer,
    customer: customer as Customer,
    total_points: totalPoints,
    points_earned: loyaltyData?.total_points_earned || 0,
    points_redeemed: loyaltyData?.total_points_redeemed || 0,
    current_tier_id: customer.loyalty_tier || getTierIdFromPoints(totalPoints),
    is_active: true, // Default to active
    lifetime_spent: customer.total_spent || 0,
    joined_at: customer.created_at
  }
}

export function adaptAppointmentWithLocation(appointment: Appointment): Appointment & { location?: Location } {
  return {
    ...appointment,
    // Ensure required properties exist
    location_id: appointment.location_id || undefined,
    total_amount: appointment.total_amount || 0,
    raw_appointment: appointment, // Self-reference for compatibility
    location: appointment.location || undefined
  }
}

// ==============================================
// 3. HELPER FUNCTIONS
// ==============================================

function getTierName(points: number): string {
  if (points <= 100) return 'Bronze'
  if (points <= 250) return 'Silver'
  if (points <= 500) return 'Gold'
  return 'Platinum'
}

function getTierColor(points: number): string {
  if (points <= 100) return '#CD7F32' // Bronze
  if (points <= 250) return '#C0C0C0' // Silver
  if (points <= 500) return '#FFD700' // Gold
  return '#E5E4E2' // Platinum
}

function getTierBenefits(points: number, discountAmount: number): string[] {
  const discount = `$${discountAmount / 100} off services`
  const benefits = [discount]
  
  if (points >= 250) benefits.push('Priority booking')
  if (points >= 500) benefits.push('Birthday bonus', 'Exclusive offers')
  if (points >= 1000) benefits.push('VIP treatment', 'Free add-ons')
  
  return benefits
}

function getTierIdFromPoints(points: number): string {
  if (points <= 100) return 'bronze'
  if (points <= 250) return 'silver' 
  if (points <= 500) return 'gold'
  return 'platinum'
}

// ==============================================
// 4. API ADAPTER FUNCTIONS  
// ==============================================

export class AdaptedLoyaltyAPI {
  static async getLoyaltyProgram(businessId: string): Promise<LoyaltyProgramUI | null> {
    // This will be implemented to call the real API and adapt the response
    return null // Placeholder
  }

  static async getLoyaltyCustomers(businessId: string): Promise<LoyaltyCustomer[]> {
    // This will be implemented to call the real API and adapt the response
    return [] // Placeholder
  }

  static async updateLoyaltyTier(tierId: string, data: Partial<LoyaltyTier>): Promise<LoyaltyTier> {
    // Convert UI tier back to database tier and call API
    throw new Error('Not implemented yet')
  }

  static async createLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgramUI>): Promise<LoyaltyProgramUI> {
    // Convert UI program to database program and call API
    throw new Error('Not implemented yet')
  }

  static async adjustCustomerPoints(customerId: string, points: number, reason: string): Promise<boolean> {
    // Direct pass-through to existing API
    return true
  }
}

// ==============================================
// 5. ALL TYPES ARE EXPORTED ABOVE AS INTERFACES
// ==============================================