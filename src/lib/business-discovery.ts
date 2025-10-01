import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client for business discovery
const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use anon key
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  } else {
    // Server-side: use service role key
    return createClient(supabaseUrl, supabaseServiceKey)
  }
}

export interface BusinessRelationship {
  business_id: string
  business_name: string
  business_slug: string
  is_preferred: boolean
  last_visit_date: string | null
  total_visits: number
  // Additional business info
  business_phone?: string
  business_address?: string
  business_timezone?: string
}

export interface CustomerDiscovery {
  customer_id: string
  phone: string
  first_name: string
  last_name: string
  email?: string
  businesses: BusinessRelationship[]
}

export class BusinessDiscoveryService {
  /**
   * Find all businesses associated with a phone number
   * This is the primary entry point for customer login
   */
  static async discoverBusinessesForPhone(phone: string): Promise<BusinessRelationship[]> {
    try {
      const supabase = createAdminClient()
      
      // Normalize phone number (remove formatting)
      const normalizedPhone = phone.replace(/\D/g, '')
      
      // First, find the customer by phone
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()
      
      if (customerError || !customer) {
        console.log('No customer found for phone:', normalizedPhone)
        return []
      }
      
      // Get all business relationships for this customer
      const { data: relationships, error: relError } = await supabase
        .from('customer_business_relationships')
        .select(`
          business_id,
          is_preferred,
          last_visit_date,
          total_visits,
          business:businesses(
            id,
            name,
            slug,
            phone,
            address_line1,
            city,
            state,
            timezone,
            subscription_status
          )
        `)
        .eq('customer_id', customer.id)
        .order('is_preferred', { ascending: false })
        .order('last_visit_date', { ascending: false })
      
      if (relError) {
        console.error('Error fetching business relationships:', relError)
        return []
      }
      
      // Transform businesses (using type assertion to bypass typing issues)
      const activeBusinesses = relationships
        ?.filter(rel => rel.business)
        ?.map(rel => {
          const business = rel.business as any;
          return {
            business_id: rel.business_id,
            business_name: business.name,
            business_slug: business.slug,
            is_preferred: rel.is_preferred,
            last_visit_date: rel.last_visit_date,
            total_visits: rel.total_visits,
            business_phone: business.phone,
            business_address: business.address_line1 ? 
              `${business.address_line1}, ${business.city}, ${business.state}` : undefined,
            business_timezone: business.timezone
          }
        }) || []
      
      return activeBusinesses
    } catch (error) {
      console.error('Business discovery failed:', error)
      return []
    }
  }
  
  /**
   * Get or create a customer for a specific business
   * Used during booking flow
   */
  static async getOrCreateCustomerForBusiness(
    phone: string, 
    businessId: string,
    customerData?: {
      first_name?: string
      last_name?: string
      email?: string
    }
  ) {
    try {
      const supabase = createAdminClient()
      const normalizedPhone = phone.replace(/\D/g, '')
      
      // Check if customer exists globally
      let { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', normalizedPhone)
        .single()
      
      if (!customer && customerData?.first_name) {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            phone: normalizedPhone,
            first_name: customerData.first_name,
            last_name: customerData.last_name || '',
            email: customerData.email || '',
            business_id: businessId, // Initial business
            total_visits: 0,
            total_spent: 0
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating customer:', createError)
          throw createError
        }
        
        customer = newCustomer
      }
      
      if (!customer) {
        throw new Error('Customer not found and cannot be created')
      }
      
      // Ensure relationship exists
      await supabase
        .from('customer_business_relationships')
        .upsert({
          customer_id: customer.id,
          business_id: businessId,
          first_visit_date: new Date().toISOString().split('T')[0],
          last_visit_date: new Date().toISOString().split('T')[0],
          total_visits: 1
        }, {
          onConflict: 'customer_id,business_id'
        })
      
      return customer
    } catch (error) {
      console.error('Get or create customer failed:', error)
      throw error
    }
  }
  
  /**
   * Set a business as preferred for a customer
   */
  static async setPreferredBusiness(customerId: string, businessId: string): Promise<boolean> {
    try {
      const supabase = createAdminClient()
      
      // Clear all preferred flags for this customer
      await supabase
        .from('customer_business_relationships')
        .update({ is_preferred: false })
        .eq('customer_id', customerId)
      
      // Set the new preferred business
      const { error } = await supabase
        .from('customer_business_relationships')
        .update({ is_preferred: true })
        .eq('customer_id', customerId)
        .eq('business_id', businessId)
      
      return !error
    } catch (error) {
      console.error('Set preferred business failed:', error)
      return false
    }
  }
  
  /**
   * Get customer details with all their business relationships
   */
  static async getCustomerWithBusinesses(phone: string): Promise<CustomerDiscovery | null> {
    try {
      const supabase = createAdminClient()
      const normalizedPhone = phone.replace(/\D/g, '')
      
      // Get customer details
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', normalizedPhone)
        .single()
      
      if (error || !customer) {
        return null
      }
      
      // Get business relationships
      const businesses = await this.discoverBusinessesForPhone(phone)
      
      return {
        customer_id: customer.id,
        phone: customer.phone,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        businesses
      }
    } catch (error) {
      console.error('Get customer with businesses failed:', error)
      return null
    }
  }
  
  /**
   * Create a new business relationship when customer books with a new salon
   */
  static async createBusinessRelationship(
    customerId: string, 
    businessId: string,
    isPreferred = false
  ): Promise<boolean> {
    try {
      const supabase = createAdminClient()
      
      const { error } = await supabase
        .from('customer_business_relationships')
        .insert({
          customer_id: customerId,
          business_id: businessId,
          first_visit_date: new Date().toISOString().split('T')[0],
          last_visit_date: new Date().toISOString().split('T')[0],
          total_visits: 1,
          is_preferred: isPreferred
        })
      
      return !error
    } catch (error) {
      console.error('Create business relationship failed:', error)
      return false
    }
  }
}