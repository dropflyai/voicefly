// ==============================================
// MVP FEATURES TYPE DEFINITIONS
// Payment Processing + Multi-Location + Loyalty Program
// ==============================================

import { Business, Customer, Appointment, Service, Staff } from './supabase'

// ==============================================
// 1. LOCATION MANAGEMENT TYPES
// ==============================================

export interface Location {
  id: string
  business_id: string
  name: string
  slug: string
  
  // Address
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  
  // Contact
  phone?: string
  email?: string
  
  // Settings
  timezone: string
  is_active: boolean
  is_primary: boolean
  
  // Integration IDs
  square_location_id?: string
  stripe_account_id?: string
  
  created_at: string
  updated_at: string
}

// Extended business type with location limits
export interface BusinessWithLocations extends Business {
  max_locations: number
  payment_processors_enabled: string[]
  loyalty_program_enabled: boolean
  locations?: Location[]
}

// ==============================================
// 2. PAYMENT PROCESSING TYPES
// ==============================================

export interface PaymentProcessor {
  id: string
  business_id: string
  location_id: string
  processor_type: 'square' | 'stripe' | 'paypal'
  
  // Status
  is_active: boolean
  is_live_mode: boolean
  
  // API Configuration
  api_key_public: string
  api_key_secret: string // Should be encrypted in production
  webhook_secret: string
  
  // Processor-specific
  account_id: string
  application_id?: string
  
  // Settings
  auto_capture: boolean
  allow_tips: boolean
  default_tip_percentages: number[]
  
  created_at: string
  updated_at: string
}

export interface PaymentWithDetails {
  id: string
  business_id: string
  location_id?: string
  appointment_id?: string
  customer_id?: string
  
  // Amounts (in cents)
  subtotal_amount: number
  tip_amount: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  
  // Processing
  processor_type: 'square' | 'stripe' | 'paypal' | 'cash'
  processor_transaction_id?: string
  processor_fee_amount: number
  currency: string
  
  // Status
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  payment_method?: string
  payment_method_details: {
    brand?: string
    last_four?: string
    exp_month?: number
    exp_year?: number
  }
  
  // Timestamps
  authorized_at?: string
  captured_at?: string
  refunded_at?: string
  
  // Additional
  receipt_url?: string
  refund_reason?: string
  processor_webhook_data: any
  notes?: string
  
  created_at: string
  updated_at: string
  
  // Related data
  appointment?: Appointment
  customer?: Customer
  location?: Location
}

// ==============================================
// 3. LOYALTY PROGRAM TYPES
// ==============================================

export interface LoyaltyProgram {
  id: string
  business_id: string
  
  // Program settings
  is_active: boolean
  program_name: string
  
  // Points configuration
  points_per_dollar: number
  points_per_visit: number
  
  // Reward tiers
  reward_tiers: LoyaltyRewardTier[]
  
  // Rules
  points_expire_days: number
  minimum_purchase_for_points: number
  max_points_per_transaction?: number
  
  // UI compatibility properties (optional for backwards compatibility)
  name?: string
  description?: string
  tiers?: LoyaltyRewardTier[]
  referral_points?: number
  birthday_bonus_points?: number
  
  created_at: string
  updated_at: string
}

export interface LoyaltyRewardTier {
  points: number
  reward: string
  discount_amount: number // in cents
  
  // UI compatibility properties (optional)
  id?: string
  name?: string
  min_points?: number
  discount_percentage?: number
  color?: string
  benefits?: string[]
  member_count?: number
}

// Type aliases for component compatibility
export type LoyaltyTier = LoyaltyRewardTier
export type LoyaltyCustomer = CustomerWithLoyalty

export interface CustomerLoyaltyPoints {
  id: string
  business_id: string
  customer_id: string
  
  // Points balance
  total_points_earned: number
  total_points_redeemed: number
  current_balance: number
  
  // Tracking
  last_earned_at?: string
  last_redeemed_at?: string
  
  created_at: string
  updated_at: string
  
  // Related data
  customer?: Customer
  transactions?: LoyaltyTransaction[]
}

export interface LoyaltyTransaction {
  id: string
  business_id: string
  customer_id: string
  appointment_id?: string
  payment_id?: string
  
  // Transaction details
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points_amount: number
  description: string
  reference_amount?: number
  balance_after: number
  
  created_at: string
  
  // Related data
  customer?: Customer
  appointment?: Appointment
  payment?: PaymentWithDetails
}

// ==============================================
// 4. EXTENDED TYPES WITH MULTI-LOCATION
// ==============================================

export interface StaffWithLocation extends Staff {
  location_id?: string
  location?: Location
}

export interface AppointmentWithLocation extends Appointment {
  location_id?: string
  location?: Location
  payment?: PaymentWithDetails
  loyalty_points_earned?: number
}

export interface CustomerWithLoyalty extends Customer {
  loyalty_points?: CustomerLoyaltyPoints
  lifetime_points_earned?: number
  current_points_balance?: number
  loyalty_tier?: string
  
  // UI compatibility properties (optional)
  customer?: Customer
  total_points?: number
  points_earned?: number
  points_redeemed?: number
  current_tier_id?: string
  is_active?: boolean
  lifetime_spent?: number
  joined_at?: string
}

// ==============================================
// 5. DASHBOARD & ANALYTICS TYPES
// ==============================================

export interface LocationDashboardStats {
  location_id: string
  location_name: string
  total_appointments: number
  today_appointments: number
  monthly_revenue: number
  active_customers: number
}

export interface PaymentMethodBreakdown {
  method: string
  count: number
  total_amount: number
  percentage: number
}

export interface LoyaltyProgramStats {
  total_members: number
  total_points_issued: number
  total_points_redeemed: number
  redemption_rate: number
  average_points_per_customer: number
  top_rewards: Array<{
    reward: string
    redemption_count: number
  }>
}

export interface MultiLocationAnalytics {
  business_summary: {
    total_locations: number
    active_locations: number
    total_revenue: number
    total_appointments: number
  }
  location_performance: LocationDashboardStats[]
  payment_breakdown: PaymentMethodBreakdown[]
  loyalty_stats?: LoyaltyProgramStats
}

// ==============================================
// 6. API REQUEST/RESPONSE TYPES
// ==============================================

export interface CreatePaymentRequest {
  appointment_id?: string
  customer_id: string
  location_id?: string
  
  amount: number
  tip_amount?: number
  tax_amount?: number
  discount_amount?: number
  
  payment_method: string
  processor_type: 'square' | 'stripe' | 'paypal' | 'cash'
  
  // For loyalty point redemption
  loyalty_points_to_redeem?: number
  
  notes?: string
}

export interface ProcessPaymentResponse {
  success: boolean
  payment?: PaymentWithDetails
  processor_response?: any
  loyalty_points_earned?: number
  error?: string
}

export interface CreateLocationRequest {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country?: string
  phone?: string
  email?: string
  timezone?: string
}

export interface LoyaltyRedemptionRequest {
  customer_id: string
  points_to_redeem: number
  appointment_id?: string
  description?: string
}

// ==============================================
// 7. PLAN TIER CONFIGURATIONS
// ==============================================

export interface PlanTierLimits {
  starter: {
    max_locations: 1
    payment_processors: []
    loyalty_program: false
    monthly_price: number
    max_appointments?: number
    analytics_dashboard?: boolean
    marketing_campaigns?: boolean
    custom_branding?: boolean
    automated_reminders?: boolean
    voice_ai_type?: 'shared' | 'custom'
  }
  professional: {
    max_locations: 1
    payment_processors: string[]
    loyalty_program: true
    monthly_price: number
    max_appointments?: number
    analytics_dashboard?: boolean
    marketing_campaigns?: boolean
    custom_branding?: boolean
    automated_reminders?: boolean
    voice_ai_type?: 'shared' | 'custom'
  }
  business: {
    max_locations: number
    payment_processors: string[]
    loyalty_program: true
    monthly_price: number
    max_appointments?: number
    analytics_dashboard?: boolean
    marketing_campaigns?: boolean
    custom_branding?: boolean
    automated_reminders?: boolean
    voice_ai_type?: 'shared' | 'custom'
    white_label?: boolean
    api_access?: boolean
    priority_support?: boolean
  }
  enterprise: {
    max_locations: number // -1 for unlimited
    payment_processors: string[]
    loyalty_program: true
    monthly_price: number
    max_appointments?: number
    analytics_dashboard?: boolean
    marketing_campaigns?: boolean
    custom_branding?: boolean
    automated_reminders?: boolean
    voice_ai_type?: 'shared' | 'custom'
    white_label?: boolean
    api_access?: boolean
    priority_support?: boolean
    dedicated_support?: boolean
    custom_integrations?: boolean
  }
}

// ==============================================
// 8. API SERVICE CLASSES
// ==============================================

export interface LocationAPI {
  getLocations(businessId: string): Promise<Location[]>
  createLocation(businessId: string, data: CreateLocationRequest): Promise<Location>
  updateLocation(locationId: string, data: Partial<CreateLocationRequest>): Promise<Location>
  deleteLocation(locationId: string): Promise<boolean>
  setAsPrimary(locationId: string): Promise<boolean>
}

export interface PaymentAPI {
  getPayments(businessId: string, filters?: {
    location_id?: string
    date_range?: [string, string]
    status?: string
    limit?: number
  }): Promise<PaymentWithDetails[]>
  
  createPayment(data: CreatePaymentRequest): Promise<ProcessPaymentResponse>
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<ProcessPaymentResponse>
  
  getPaymentProcessors(businessId: string): Promise<PaymentProcessor[]>
  configureProcessor(businessId: string, locationId: string, config: Partial<PaymentProcessor>): Promise<PaymentProcessor>
}

export interface LoyaltyAPI {
  getLoyaltyProgram(businessId: string): Promise<LoyaltyProgram | null>
  updateLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram>
  
  getCustomerPoints(businessId: string, customerId: string): Promise<CustomerLoyaltyPoints | null>
  getPointsHistory(businessId: string, customerId: string): Promise<LoyaltyTransaction[]>
  getLoyaltyCustomers(businessId: string): Promise<LoyaltyCustomer[]>
  getLoyaltyStats(businessId: string): Promise<any>
  
  redeemPoints(data: LoyaltyRedemptionRequest): Promise<boolean>
  adjustPoints(customerId: string, points: number, reason: string): Promise<boolean>
  adjustCustomerPoints(customerId: string, points: number, reason: string): Promise<boolean>
  awardPoints(businessId: string, customerId: string, appointmentId: string, amount: number): Promise<number>
}

// ==============================================
// 9. FORM VALIDATION TYPES
// ==============================================

export interface LocationFormData {
  name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  phone: string
  email: string
}

export interface PaymentProcessorFormData {
  processor_type: 'square' | 'stripe' | 'paypal'
  is_live_mode: boolean
  api_key_public: string
  api_key_secret: string
  webhook_secret: string
  account_id: string
  application_id?: string
}

export interface LoyaltyProgramFormData {
  is_active: boolean
  program_name: string
  points_per_dollar: number
  points_per_visit: number
  points_expire_days: number
  minimum_purchase_for_points: number
  max_points_per_transaction?: number
}

// Export all existing types as well
export * from './supabase'