import { createClient } from '@supabase/supabase-js'
import {
  Location, BusinessWithLocations, PaymentWithDetails, PaymentProcessor,
  LoyaltyProgram, CustomerLoyaltyPoints, LoyaltyTransaction,
  LocationAPI, PaymentAPI, LoyaltyAPI,
  CreateLocationRequest, CreatePaymentRequest, ProcessPaymentResponse,
  LoyaltyRedemptionRequest, PlanTierLimits, LoyaltyCustomer, LoyaltyRewardTier
} from './supabase-types-mvp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create admin client for operations that require elevated permissions
const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use anon key (limited permissions)
    return createClient(supabaseUrl, supabaseAnonKey)
  } else {
    // Server-side: use service role key (full permissions)
    return createClient(supabaseUrl, supabaseServiceKey)
  }
}

// Export MVP types for easy importing
export * from './supabase-types-mvp'

// Helper function to validate business ID format
function validateBusinessId(businessId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return businessId && uuidRegex.test(businessId)
}

// Database types that match our schema
export interface Business {
  id: string
  name: string
  slug: string
  business_type: string
  phone?: string
  email?: string
  website?: string
  address?: string // Use single address field to match database
  address_line1?: string // Optional for compatibility
  address_line2?: string // Optional for compatibility
  city?: string
  state?: string
  postal_code?: string
  zip_code?: string // Database uses zip_code, not postal_code
  country?: string
  timezone?: string
  subscription_tier: 'starter' | 'professional' | 'business' | 'enterprise'
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  trial_ends_at?: string
  settings?: {
    currency?: string
    booking_buffer_minutes?: number
    cancellation_window_hours?: number
    selected_plan?: string
    selected_addons?: string[]
    monthly_price?: number
    tech_calendar_count?: number
  }
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  business_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: 'owner' | 'manager' | 'technician' | 'receptionist'
  specialties: string[]
  hourly_rate?: number
  commission_rate?: number
  is_active: boolean
  hire_date?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration_minutes: number
  base_price: number
  category?: string
  is_active: boolean
  requires_deposit: boolean
  deposit_amount: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  date_of_birth?: string
  notes?: string
  preferences?: any
  total_visits: number
  total_spent: number
  last_visit_date?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  business_id: string
  customer_id: string
  staff_id?: string
  service_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  internal_notes?: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
  // MVP additions
  location_id?: string
  total_amount?: number
  raw_appointment?: any
  // Related data
  customer?: Customer
  staff?: Staff
  service?: Service
  location?: Location
}

export interface Payment {
  id: string
  business_id: string
  appointment_id: string
  customer_id: string
  amount: number
  tip_amount: number
  tax_amount: number
  total_amount: number
  payment_method?: string
  status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed'
  stripe_payment_intent_id?: string
  processed_at?: string
  created_at: string
  updated_at: string
}

// Analytics and dashboard types
export interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  monthlyRevenue: number
  activeCustomers: number
}

export interface RevenueData {
  month: string
  revenue: number
  appointments: number
}

export interface ServicePopularity {
  name: string
  value: number
  color: string
}

export interface StaffPerformance {
  name: string
  appointments: number
  revenue: number
  rating: number
}

// API class with real database operations
export class BusinessAPI {
  static async getBusiness(businessId: string): Promise<Business | null> {
    // Validate UUID format to prevent database errors
    if (!validateBusinessId(businessId)) {
      console.error('Invalid business ID format:', businessId)
      console.log('Expected UUID format like: 8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad')
      console.log('Please use proper authentication via localStorage or login system')
      return null
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()
    
    if (error) {
      console.error('Error fetching business:', error)
      return null
    }
    
    // Default subscription tier to professional if not set
    if (data && !data.subscription_tier) {
      data.subscription_tier = 'professional'
    }
    
    return data
  }

  static async getAppointments(businessId: string, filters?: {
    date?: string
    status?: string
    staff_id?: string
    limit?: number
  }): Promise<Appointment[]> {
    if (!validateBusinessId(businessId)) {
      console.error('Invalid business ID format for getAppointments:', businessId)
      return []
    }
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(*),
        staff:staff(*),
        service:services(*)
      `)
      .eq('business_id', businessId)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: true })

    if (filters?.date) {
      query = query.eq('appointment_date', filters.date)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }
    return data || []
  }

  static async getUpcomingAppointments(businessId: string, limit = 10): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(*),
        staff:staff(*),
        service:services(*)
      `)
      .eq('business_id', businessId)
      .gte('appointment_date', today)
      .in('status', ['pending', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming appointments:', error)
      return []
    }
    return data || []
  }

  static async getStaff(businessId: string): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('first_name')

    if (error) {
      console.error('Error fetching staff:', error)
      return []
    }
    return data || []
  }

  static async addStaff(businessId: string, staffData: {
    first_name: string
    last_name: string
    email: string
    phone?: string | null
    role: string
    is_active: boolean
    hire_date: string
    hourly_rate?: number
    commission_rate?: number
    specialties?: string[]
  }): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .insert({
        business_id: businessId,
        ...staffData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding staff:', error)
      throw new Error(`Failed to add staff member: ${error.message}`)
    }
    return data
  }

  static async getServices(businessId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      return []
    }
    return data || []
  }

  static async addService(businessId: string, serviceData: {
    name: string
    description?: string
    category?: string
    duration_minutes: number
    base_price: number
    is_active?: boolean
    requires_deposit?: boolean
    deposit_amount?: number
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        business_id: businessId,
        is_active: true,
        requires_deposit: false,
        deposit_amount: 0,
        ...serviceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding service:', error)
      throw new Error(`Failed to add service: ${error.message}`)
    }
    return data
  }

  static async getCustomers(businessId: string, limit = 50): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('last_visit_date', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }
    return data || []
  }

  static async addCustomer(businessId: string, customerData: {
    first_name: string
    last_name: string
    email?: string
    phone: string
    date_of_birth?: string
    notes?: string
    preferences?: any
  }): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        total_visits: 0,
        total_spent: 0,
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding customer:', error)
      throw new Error(`Failed to add customer: ${error.message}`)
    }
    return data
  }

  static async getDashboardStats(businessId: string): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    try {
      // Get total appointments count
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)

      // Get today's appointments
      const { count: todayAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('appointment_date', today)
        .in('status', ['confirmed', 'in_progress'])

      // Get monthly revenue from payments
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('total_amount')
        .eq('business_id', businessId)
        .eq('status', 'paid')
        .gte('created_at', startOfMonth)

      const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + payment.total_amount, 0) || 0

      // Get active customers count
      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gt('total_visits', 0)

      return {
        totalAppointments: totalAppointments || 0,
        todayAppointments: todayAppointments || 0,
        monthlyRevenue: monthlyRevenue || 0,
        activeCustomers: activeCustomers || 0
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalAppointments: 0,
        todayAppointments: 0,
        monthlyRevenue: 0,
        activeCustomers: 0
      }
    }
  }

  static async getRevenueData(businessId: string, months = 6): Promise<RevenueData[]> {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        total_amount,
        created_at,
        appointment:appointments(appointment_date)
      `)
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching revenue data:', error)
      return []
    }

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; appointments: number } } = {}
    
    payments?.forEach(payment => {
      const date = new Date(payment.created_at)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, appointments: 0 }
      }
      
      monthlyData[monthKey].revenue += payment.total_amount
      monthlyData[monthKey].appointments += 1
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      appointments: data.appointments
    }))
  }

  static async getStaffPerformance(businessId: string, limit = 10): Promise<StaffPerformance[]> {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    
    const { data, error } = await supabase
      .from('staff')
      .select(`
        first_name,
        last_name,
        appointments:appointments!staff_id(
          id,
          status,
          payments:payments(total_amount)
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .in('role', ['technician', 'manager'])
      .gte('appointments.created_at', startOfMonth)
      .eq('appointments.status', 'completed')

    if (error) {
      console.error('Error fetching staff performance:', error)
      return []
    }

    return data?.map(staff => {
      const appointments = staff.appointments?.length || 0
      const revenue = staff.appointments?.reduce((sum: number, apt: any) => 
        sum + (apt.payments?.[0]?.total_amount || 0), 0) || 0
      
      return {
        name: `${staff.first_name} ${staff.last_name}`,
        appointments,
        revenue,
        rating: 4.5 + Math.random() * 0.5 // Mock rating for now
      }
    }).slice(0, limit) || []
  }

  // Customer-specific methods
  static async getCustomerByPhone(phone: string, businessId?: string): Promise<Customer | null> {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
      
      if (businessId) {
        query = query.eq('business_id', businessId)
      }
      
      const { data, error } = await query.single()
      
      if (error) {
        console.error('Error fetching customer by phone:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('getCustomerByPhone failed:', error)
      return null
    }
  }

  static async getCustomerAppointments(customerId: string, limit = 20): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(*),
        staff:staff(*),
        service:services(*)
      `)
      .eq('customer_id', customerId)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching customer appointments:', error)
      return []
    }
    return data || []
  }

  // Create or get customer
  static async createOrGetCustomer(businessId: string, customerData: {
    phone: string
    first_name: string
    last_name?: string
    email?: string
  }): Promise<Customer | null> {
    try {
      console.log('Looking for existing customer...', { businessId, phone: customerData.phone })
      
      // First try to find existing customer
      const { data: existing, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .eq('phone', customerData.phone)
        .single()
      
      if (existing) {
        console.log('Found existing customer:', existing)
        return existing
      }
      
      console.log('Customer not found, creating new one...', { searchError })

      // Create new customer
      const nameParts = customerData.first_name.split(' ')
      const firstName = nameParts[0]
      const lastName = customerData.last_name || nameParts.slice(1).join(' ') || ''
      
      const customerInsert = {
        business_id: businessId,
        first_name: firstName,
        last_name: lastName,
        phone: customerData.phone,
        email: customerData.email || '',
        total_visits: 0,
        total_spent: 0,
        created_at: new Date().toISOString()
      }
      
      console.log('Inserting customer:', customerInsert)
      
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert(customerInsert)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating customer:', error)
        throw new Error(`Database error creating customer: ${error.message}`)
      }
      
      console.log('Created new customer:', newCustomer)
      return newCustomer
    } catch (error) {
      console.error('createOrGetCustomer failed:', error)
      throw error
    }
  }

  // Create appointment directly
  static async createAppointment(appointmentData: {
    business_id: string
    customer_id: string
    service_id: string
    appointment_date: string
    start_time: string
    end_time: string
    status?: string
    notes?: string
  }): Promise<Appointment | null> {
    try {
      const appointmentInsert = {
        ...appointmentData,
        status: appointmentData.status || 'confirmed',
        reminder_sent: false,
        created_at: new Date().toISOString()
      }
      
      console.log('Inserting appointment:', appointmentInsert)
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentInsert)
        .select(`
          *,
          customer:customers(*),
          staff:staff(*),
          service:services(*)
        `)
        .single()
      
      if (error) {
        console.error('Error creating appointment:', error)
        throw new Error(`Database error creating appointment: ${error.message}`)
      }
      
      console.log('Created appointment:', data)
      return data
    } catch (error) {
      console.error('createAppointment failed:', error)
      throw error
    }
  }

  // Update appointment
  static async updateAppointment(appointmentId: string, updateData: {
    appointment_date?: string
    start_time?: string
    end_time?: string
    service_id?: string
    staff_id?: string
    status?: string
    notes?: string
  }): Promise<Appointment | null> {
    try {
      console.log('Updating appointment:', appointmentId, updateData)
      
      // Get original appointment data first for reschedule comparison
      const { data: originalData } = await supabase
        .from('appointments')
        .select(`
          appointment_date,
          start_time,
          customer:customers(*),
          business:businesses(*)
        `)
        .eq('id', appointmentId)
        .single()
      
      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select(`
          *,
          customer:customers(*),
          staff:staff(*),
          service:services(*),
          business:businesses(*)
        `)
        .single()
      
      if (error) {
        console.error('Error updating appointment:', error)
        throw new Error(`Database error updating appointment: ${error.message}`)
      }
      
      console.log('Appointment updated successfully:', data)
      
      // Send SMS reschedule notice if date or time changed
      if ((updateData.appointment_date || updateData.start_time) && originalData) {
        try {
          const { SMSService } = await import('./sms-service')
          const oldDateTime = {
            date: new Date(originalData.appointment_date).toLocaleDateString(),
            time: originalData.start_time || 'scheduled time'
          }
          await SMSService.sendRescheduleNotice(data, oldDateTime)
        } catch (smsError) {
          console.error('Failed to send reschedule SMS:', smsError)
          // Don't fail the entire operation if SMS fails
        }
      }
      
      return data
    } catch (error) {
      console.error('updateAppointment failed:', error)
      throw error
    }
  }

  // Cancel appointment
  static async cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment | null> {
    try {
      console.log('Cancelling appointment:', appointmentId)
      
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select(`
          *,
          customer:customers(*),
          staff:staff(*),
          service:services(*),
          business:businesses(*)
        `)
        .single()
      
      if (error) {
        console.error('Error cancelling appointment:', error)
        throw new Error(`Database error cancelling appointment: ${error.message}`)
      }
      
      console.log('Appointment cancelled successfully:', data)
      
      // Send SMS cancellation notice
      try {
        const { SMSService } = await import('./sms-service')
        await SMSService.sendCancellationNotice(data)
      } catch (smsError) {
        console.error('Failed to send cancellation SMS:', smsError)
        // Don't fail the entire operation if SMS fails
      }

      // Send email cancellation notice
      if (data.customer?.email) {
        try {
          const { EmailService } = await import('./email-service')
          await EmailService.sendCancellationEmail(data, reason)
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError)
          // Don't fail the entire operation if email fails
        }
      }
      
      return data
    } catch (error) {
      console.error('cancelAppointment failed:', error)
      throw error
    }
  }

  // Award loyalty points when appointment is completed
  static async awardLoyaltyPoints(customerId: string, amount: number, visitCount: number = 1): Promise<void> {
    try {
      // Get current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('preferences, total_spent, total_visits')
        .eq('id', customerId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching customer for loyalty:', fetchError)
        return
      }
      
      // Calculate points (1 point per dollar + 10 points per visit)
      const pointsFromSpending = Math.floor(amount)
      const pointsFromVisit = visitCount * 10
      const pointsEarned = pointsFromSpending + pointsFromVisit
      
      // Get current loyalty data
      const currentLoyalty = customer.preferences?.loyalty || {
        current_balance: 0,
        total_earned: 0,
        transactions: []
      }
      
      // Update loyalty data
      const newBalance = (currentLoyalty.current_balance || 0) + pointsEarned
      const totalEarned = (currentLoyalty.total_earned || 0) + pointsEarned
      
      // Add transaction record
      const transaction = {
        date: new Date().toISOString(),
        type: 'earned',
        points: pointsEarned,
        description: `Earned from service ($${amount})`,
        balance_after: newBalance
      }
      
      const transactions = currentLoyalty.transactions || []
      transactions.unshift(transaction) // Add to beginning
      if (transactions.length > 50) transactions.pop() // Keep only last 50
      
      // Update customer with new loyalty data
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          preferences: {
            ...customer.preferences,
            loyalty: {
              current_balance: newBalance,
              total_earned: totalEarned,
              transactions: transactions,
              last_earned_at: new Date().toISOString()
            }
          },
          total_spent: (customer.total_spent || 0) + amount,
          total_visits: (customer.total_visits || 0) + visitCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
      
      if (updateError) {
        console.error('Error updating loyalty points:', updateError)
      } else {
        console.log(`✅ Awarded ${pointsEarned} loyalty points to customer ${customerId}`)
        
        // Send email notification if customer has email
        // Temporarily disabled for build - customer object structure mismatch
        if (false && pointsEarned > 0) {
          try {
            // Get business info for email
            const { data: businessData } = await supabase
              .from('businesses')
              .select('*')
              .single()
            
            const { EmailService } = await import('./email-service')
            await EmailService.sendLoyaltyPointsEarned(
              { ...customer, id: customerId },
              pointsEarned,
              newBalance,
              businessData || { name: 'Your Business' }
            )
          } catch (emailError) {
            console.error('Failed to send loyalty points email:', emailError)
          }
        }
      }
    } catch (error) {
      console.error('Error in awardLoyaltyPoints:', error)
    }
  }

  // Update customer profile information
  static async updateCustomer(customerId: string, updateData: {
    email?: string
    first_name?: string
    last_name?: string
    date_of_birth?: string
    notes?: string
    preferences?: any
  }): Promise<Customer | null> {
    try {
      console.log('Updating customer:', customerId, updateData)
      
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating customer:', error)
        throw new Error(`Database error updating customer: ${error.message}`)
      }
      
      console.log('Customer updated successfully:', data)
      return data
    } catch (error) {
      console.error('updateCustomer failed:', error)
      throw error
    }
  }
}

// MVP Feature API Classes  
export class LocationAPIImpl implements LocationAPI {
  static async getLocations(businessId: string): Promise<Location[]> {
    const instance = new LocationAPIImpl()
    return instance.getLocations(businessId)
  }
  async getLocations(businessId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }
    return data || []
  }

  async createLocation(businessId: string, data: CreateLocationRequest): Promise<Location> {
    // Create slug from name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        business_id: businessId,
        slug,
        timezone: data.timezone || 'America/Los_Angeles',
        country: data.country || 'US',
        is_active: true,
        is_primary: false, // Will be set manually if needed
        ...data
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create location: ${error.message}`)
    return location
  }

  async updateLocation(locationId: string, data: Partial<CreateLocationRequest>): Promise<Location> {
    const { data: location, error } = await supabase
      .from('locations')
      .update(data)
      .eq('id', locationId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update location: ${error.message}`)
    return location
  }

  async deleteLocation(locationId: string): Promise<boolean> {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('locations')
      .update({ is_active: false })
      .eq('id', locationId)

    if (error) throw new Error(`Failed to delete location: ${error.message}`)
    return true
  }

  async setAsPrimary(locationId: string): Promise<boolean> {
    // Get the business_id for this location
    const { data: location } = await supabase
      .from('locations')
      .select('business_id')
      .eq('id', locationId)
      .single()

    if (!location) throw new Error('Location not found')

    // Set all locations for this business to not primary
    await supabase
      .from('locations')
      .update({ is_primary: false })
      .eq('business_id', location.business_id)

    // Set the target location as primary
    const { error } = await supabase
      .from('locations')
      .update({ is_primary: true })
      .eq('id', locationId)

    if (error) throw new Error(`Failed to set primary location: ${error.message}`)
    return true
  }
}

export class PaymentAPIImpl implements PaymentAPI {
  async getPayments(businessId: string, filters?: {
    location_id?: string
    date_range?: [string, string]
    status?: string
    limit?: number
  }): Promise<PaymentWithDetails[]> {
    let query = supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(*),
        customer:customers(*),
        location:locations(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range[0])
        .lte('created_at', filters.date_range[1])
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching payments:', error)
      return []
    }
    return data || []
  }

  async createPayment(data: CreatePaymentRequest): Promise<ProcessPaymentResponse> {
    // This would integrate with actual payment processors (Square/Stripe)
    // For now, return a mock implementation
    const payment = {
      id: crypto.randomUUID(),
      business_id: data.customer_id, // This should come from the appointment
      subtotal_amount: data.amount,
      tip_amount: data.tip_amount || 0,
      tax_amount: data.tax_amount || 0,
      discount_amount: data.discount_amount || 0,
      total_amount: data.amount + (data.tip_amount || 0) + (data.tax_amount || 0) - (data.discount_amount || 0),
      processor_type: data.processor_type,
      currency: 'USD',
      status: 'paid' as const,
      payment_method: data.payment_method,
      payment_method_details: {},
      processor_fee_amount: 0,
      processor_webhook_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    } as PaymentWithDetails

    return {
      success: true,
      payment,
      loyalty_points_earned: Math.floor(payment.total_amount / 100) // 1 point per dollar
    }
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<ProcessPaymentResponse> {
    // Mock implementation - would integrate with actual payment processors
    return {
      success: true,
      error: 'Refund functionality not implemented yet'
    }
  }

  async getPaymentProcessors(businessId: string): Promise<PaymentProcessor[]> {
    const { data, error } = await supabase
      .from('payment_processors')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching payment processors:', error)
      return []
    }
    return data || []
  }

  async configureProcessor(businessId: string, locationId: string, config: Partial<PaymentProcessor>): Promise<PaymentProcessor> {
    const { data, error } = await supabase
      .from('payment_processors')
      .upsert({
        business_id: businessId,
        location_id: locationId,
        is_active: true,
        auto_capture: true,
        allow_tips: true,
        default_tip_percentages: [15, 18, 20, 25],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...config
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to configure payment processor: ${error.message}`)
    return data
  }
}

export class LoyaltyAPIImpl implements LoyaltyAPI {
  static async getLoyaltyStats(businessId: string): Promise<any> {
    const instance = new LoyaltyAPIImpl()
    return instance.getLoyaltyStats(businessId)
  }
  
  static async getCustomerPoints(businessId: string, customerId: string): Promise<CustomerLoyaltyPoints | null> {
    const instance = new LoyaltyAPIImpl()
    return instance.getCustomerPoints(businessId, customerId)
  }
  
  static async getLoyaltyCustomers(businessId: string): Promise<LoyaltyCustomer[]> {
    const instance = new LoyaltyAPIImpl()
    return instance.getLoyaltyCustomers(businessId)
  }
  async getLoyaltyProgram(businessId: string): Promise<LoyaltyProgram | null> {
    try {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('business_id', businessId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null
        }
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('loyalty_programs table does not exist, no programs available')
          return null
        }
        console.error('Error fetching loyalty program:', error)
        return null
      }

      // Transform response to frontend format
      if (data) {
        return {
          ...data,
          name: data.program_name,
          tiers: data.reward_tiers?.map((tier: any, index: number) => ({
            id: `tier-${index}`,
            name: tier.reward.includes('Bronze') ? 'Bronze' : 
                  tier.reward.includes('Silver') ? 'Silver' :
                  tier.reward.includes('Gold') ? 'Gold' :
                  tier.reward.includes('Platinum') ? 'Platinum' : 
                  `Tier ${index + 1}`,
            min_points: tier.points,
            discount_percentage: Math.floor(tier.discount_amount / 100),
            color: index === 0 ? '#CD7F32' : index === 1 ? '#C0C0C0' : index === 2 ? '#FFD700' : '#E5E4E2',
            benefits: [`${Math.floor(tier.discount_amount / 100)}% discount on all services`, 'Priority booking']
          })) || []
        } as LoyaltyProgram
      }
      
      return data
    } catch (error) {
      console.error('Error in getLoyaltyProgram:', error)
      return null
    }
  }

  async updateLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    try {
      // Transform frontend tiers to backend reward_tiers if present
      let reward_tiers = [
        { points: 100, reward: '$5 off next service', discount_amount: 500 },
        { points: 250, reward: '$15 off next service', discount_amount: 1500 },
        { points: 500, reward: '$35 off next service', discount_amount: 3500 }
      ]

      // If data has tiers, convert them to reward_tiers format
      if (data.tiers && Array.isArray(data.tiers)) {
        reward_tiers = data.tiers.map((tier: any) => ({
          points: tier.min_points || 100,
          reward: `${tier.discount_percentage}% discount (${tier.name} tier)`,
          discount_amount: tier.discount_percentage * 100 || 500
        }))
      }

      const programData = {
        business_id: businessId,
        is_active: data.is_active !== undefined ? data.is_active : true,
        program_name: data.name || 'VIP Rewards',
        description: data.description || 'Earn points with every visit and unlock exclusive rewards',
        points_per_dollar: data.points_per_dollar || 1,
        points_per_visit: 0,
        points_expire_days: 365,
        minimum_purchase_for_points: 0,
        reward_tiers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: program, error } = await supabase
        .from('loyalty_programs')
        .upsert(programData)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        // If the table doesn't exist or there's a schema issue, return a mock program
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('loyalty_programs table does not exist, using mock implementation')
          return this.createMockLoyaltyProgram(businessId, data)
        }
        throw new Error(`Failed to update loyalty program: ${error.message}`)
      }
      
      // Transform response back to frontend format
      const transformedProgram = {
        ...program,
        name: program.program_name,
        tiers: program.reward_tiers?.map((tier: any, index: number) => ({
          id: `tier-${index}`,
          name: tier.reward.includes('Bronze') ? 'Bronze' : 
                tier.reward.includes('Silver') ? 'Silver' :
                tier.reward.includes('Gold') ? 'Gold' :
                tier.reward.includes('Platinum') ? 'Platinum' : 
                `Tier ${index + 1}`,
          min_points: tier.points,
          discount_percentage: Math.floor(tier.discount_amount / 100),
          color: index === 0 ? '#CD7F32' : index === 1 ? '#C0C0C0' : index === 2 ? '#FFD700' : '#E5E4E2',
          benefits: [`${Math.floor(tier.discount_amount / 100)}% discount on all services`, 'Priority booking']
        })) || []
      }
      
      return transformedProgram
    } catch (error) {
      console.error('Error in updateLoyaltyProgram:', error)
      // Fallback to mock implementation
      return this.createMockLoyaltyProgram(businessId, data)
    }
  }

  private createMockLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgram>): LoyaltyProgram {
    const mockTiers = data.tiers || [
      {
        id: 'tier-0',
        name: 'Bronze',
        min_points: 0,
        discount_percentage: 0,
        color: '#CD7F32',
        benefits: ['Earn 1 point per $1 spent', 'Birthday month discount']
      },
      {
        id: 'tier-1',
        name: 'Silver', 
        min_points: 250,
        discount_percentage: 5,
        color: '#C0C0C0',
        benefits: ['5% discount on all services', 'Priority booking', 'Birthday month discount']
      },
      {
        id: 'tier-2',
        name: 'Gold',
        min_points: 500,
        discount_percentage: 10,
        color: '#FFD700',
        benefits: ['10% discount on all services', 'Priority booking', 'Free service on birthday', 'Exclusive promotions']
      },
      {
        id: 'tier-3',
        name: 'Platinum',
        min_points: 1000,
        discount_percentage: 15,
        color: '#E5E4E2',
        benefits: ['15% discount on all services', 'Priority booking', 'Free service on birthday', 'Exclusive promotions', 'Complimentary upgrades']
      }
    ]

    return {
      id: `loyalty-program-${businessId}`,
      business_id: businessId,
      name: data.name || 'VIP Rewards',
      description: data.description || 'Earn points with every visit and unlock exclusive rewards',
      is_active: data.is_active !== undefined ? data.is_active : true,
      points_per_dollar: data.points_per_dollar || 1,
      tiers: mockTiers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as LoyaltyProgram
  }

  async getCustomerPoints(businessId: string, customerId: string): Promise<CustomerLoyaltyPoints | null> {
    const { data, error } = await supabase
      .from('customer_loyalty_points')
      .select('*, customer:customers(*)')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching customer points:', error)
      return null
    }
    return data
  }

  async getPointsHistory(businessId: string, customerId: string): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*, customer:customers(*)')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching points history:', error)
      return []
    }
    return data || []
  }

  async redeemPoints(data: LoyaltyRedemptionRequest): Promise<boolean> {
    // Mock implementation - would need proper transaction handling
    const { error } = await supabase
      .from('loyalty_transactions')
      .insert({
        business_id: '', // Should be derived from customer
        customer_id: data.customer_id,
        appointment_id: data.appointment_id,
        transaction_type: 'redeemed',
        points_amount: -data.points_to_redeem,
        description: data.description || 'Points redeemed',
        balance_after: 0, // Should be calculated
        created_at: new Date().toISOString()
      })

    return !error
  }

  async adjustPoints(customerId: string, points: number, reason: string): Promise<boolean> {
    // Mock implementation
    return true
  }

  async adjustCustomerPoints(customerId: string, points: number, reason: string): Promise<boolean> {
    // Mock implementation - same as adjustPoints for now
    return this.adjustPoints(customerId, points, reason)
  }

  async getLoyaltyCustomers(businessId: string): Promise<LoyaltyCustomer[]> {
    // Mock implementation - would need to join customers with loyalty data
    return []
  }

  async awardPoints(businessId: string, customerId: string, appointmentId: string, amount: number): Promise<number> {
    // Mock implementation - would calculate points based on amount
    const points = Math.floor(amount / 100) // 1 point per dollar
    return points
  }

  async createLoyaltyProgram(businessId: string, data?: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    // Use existing updateLoyaltyProgram method
    return this.updateLoyaltyProgram(businessId, data || {})
  }

  async updateLoyaltyTier(tierId: string, data: Partial<LoyaltyRewardTier>): Promise<LoyaltyRewardTier> {
    // Mock implementation - would update specific tier
    return {
      points: data.points || 100,
      reward: data.reward || 'Default reward', 
      discount_amount: data.discount_amount || 500,
      ...data
    }
  }

  async getLoyaltyStats(businessId: string): Promise<any> {
    // Mock implementation - would need complex queries
    return {
      total_members: 0,
      total_points_issued: 0,
      total_points_redeemed: 0,
      redemption_rate: 0,
      average_points_per_customer: 0,
      top_rewards: []
    }
  }
}

// Plan tier configuration - Updated pricing and features
export const PLAN_TIER_LIMITS: PlanTierLimits = {
  starter: {
    max_locations: 1,
    payment_processors: [], // No payment processing in starter
    loyalty_program: false, // No loyalty in starter
    monthly_price: 67,
    max_appointments: 200, // New limit for starter
    analytics_dashboard: false, // No analytics in starter
    marketing_campaigns: false, // No marketing in starter
    custom_branding: false, // No branding in starter
    automated_reminders: false, // Basic SMS only, no automated
    voice_ai_type: 'shared' // Shared AI assistant
  },
  professional: {
    max_locations: 1,
    payment_processors: ['square', 'stripe'],
    loyalty_program: true,
    monthly_price: 147,
    max_appointments: -1, // Unlimited appointments
    analytics_dashboard: true, // Full analytics
    marketing_campaigns: true, // Email & SMS campaigns
    custom_branding: true, // Logo and colors
    automated_reminders: true, // 24-hour automated reminders
    voice_ai_type: 'shared' // Still shared AI
  },
  business: {
    max_locations: 3,
    payment_processors: ['square', 'stripe'],
    loyalty_program: true,
    monthly_price: 297,
    max_appointments: -1, // Unlimited
    analytics_dashboard: true,
    marketing_campaigns: true,
    custom_branding: true,
    automated_reminders: true,
    voice_ai_type: 'custom', // CUSTOM AI assistant
    white_label: true, // White-label option
    api_access: true, // API access
    priority_support: true // Priority support
  },
  enterprise: {
    max_locations: -1, // unlimited locations
    payment_processors: ['square', 'stripe'],
    loyalty_program: true,
    monthly_price: 597, // Higher price for unlimited
    max_appointments: -1,
    analytics_dashboard: true,
    marketing_campaigns: true,
    custom_branding: true,
    automated_reminders: true,
    voice_ai_type: 'custom',
    white_label: true,
    api_access: true,
    priority_support: true,
    dedicated_support: true, // Dedicated account manager
    custom_integrations: true // Custom development
  }
}