import { Client, Environment } from 'squareup'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Square client with environment validation
const isProduction = process.env.SQUARE_ENVIRONMENT === 'production'

// Lazy initialization to avoid build-time errors
const getSquareClient = (): Client | null => {
  try {
    if (process.env.SQUARE_ACCESS_TOKEN) {
      return new Client({
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: isProduction ? Environment.Production : Environment.Sandbox
      })
    }
    return null
  } catch (error) {
    console.warn('Square client initialization failed:', error)
    return null
  }
}

export interface SquarePaymentData {
  amount: number // in cents
  customerId: string
  appointmentId: string
  businessId: string
  locationId?: string
  description?: string
  nonce?: string // For client-side payments
  metadata?: Record<string, string>
}

export interface SquarePaymentResult {
  success: boolean
  transactionId?: string
  paymentId?: string
  error?: string
}

export class SquareService {
  /**
   * Process payment using Square
   */
  static async processPayment(data: SquarePaymentData): Promise<SquarePaymentResult> {
    try {
      console.log('🔄 Processing Square payment:', { ...data, amount: data.amount / 100 })

      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.'
        }
      }

      // Get business and appointment details
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', data.businessId)
        .single()

      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name),
          customer:customers(first_name, last_name, email, phone)
        `)
        .eq('id', data.appointmentId)
        .single()

      // Get Square location ID (use provided or get default)
      let squareLocationId = data.locationId
      if (!squareLocationId) {
        const locationsApi = client.locationsApi
        const { result } = await locationsApi.listLocations()
        squareLocationId = result.locations?.[0]?.id || process.env.SQUARE_LOCATION_ID!
      }

      const paymentsApi = client.paymentsApi
      const idempotencyKey = randomUUID()

      const requestBody = {
        sourceId: data.nonce || 'CASH', // Use provided nonce or default to cash
        idempotencyKey,
        amountMoney: {
          amount: BigInt(data.amount),
          currency: 'USD'
        },
        locationId: squareLocationId,
        note: data.description || `${business?.name || 'Nail Salon'} - ${appointment?.service?.name || 'Service'}`,
        buyerEmailAddress: appointment?.customer?.email,
        metadata: {
          customerId: data.customerId,
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          customerName: `${appointment?.customer?.first_name || ''} ${appointment?.customer?.last_name || ''}`.trim(),
          customerPhone: appointment?.customer?.phone || '',
          ...data.metadata
        }
      }

      const { result } = await paymentsApi.createPayment(requestBody)
      
      if (result.payment) {
        console.log('✅ Square payment processed:', result.payment.id)
        
        return {
          success: true,
          transactionId: result.payment.id,
          paymentId: result.payment.id
        }
      } else {
        throw new Error('No payment result returned from Square')
      }

    } catch (error: any) {
      console.error('❌ Square payment error:', error)
      
      // Handle specific Square errors
      let errorMessage = 'Payment processing failed'
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.detail || e.code).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Get payment details from Square
   */
  static async getPayment(paymentId: string): Promise<any> {
    try {
      const client = getSquareClient()
      if (!client) return null
      
      const paymentsApi = client.paymentsApi
      const { result } = await paymentsApi.getPayment(paymentId)
      return result.payment
    } catch (error: any) {
      console.error('❌ Error retrieving Square payment:', error)
      return null
    }
  }

  /**
   * Refund a Square payment
   */
  static async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<SquarePaymentResult> {
    try {
      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.'
        }
      }
      
      const refundsApi = client.refundsApi
      const idempotencyKey = randomUUID()

      // First get the original payment to know the amount
      const payment = await this.getPayment(paymentId)
      if (!payment) {
        return {
          success: false,
          error: 'Original payment not found'
        }
      }

      const refundAmount = amount || Number(payment.amountMoney?.amount || 0)

      const requestBody = {
        idempotencyKey,
        amountMoney: {
          amount: BigInt(refundAmount),
          currency: 'USD'
        },
        paymentId,
        reason: reason || 'Customer request'
      }

      const { result } = await refundsApi.refundPayment(requestBody)
      
      if (result.refund) {
        console.log('✅ Square refund processed:', result.refund.id)
        
        return {
          success: true,
          transactionId: result.refund.id,
          paymentId
        }
      } else {
        throw new Error('No refund result returned from Square')
      }

    } catch (error: any) {
      console.error('❌ Square refund error:', error)
      
      let errorMessage = 'Refund processing failed'
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.detail || e.code).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * List Square locations for this account
   */
  static async getLocations(): Promise<any[]> {
    try {
      const client = getSquareClient()
      if (!client) {
        console.warn('Square client not initialized for getLocations')
        return []
      }
      
      const locationsApi = client.locationsApi
      const { result } = await locationsApi.listLocations()
      return result.locations || []
    } catch (error: any) {
      console.error('❌ Error retrieving Square locations:', error)
      return []
    }
  }

  /**
   * Create a customer in Square
   */
  static async createCustomer(customerData: {
    givenName: string
    familyName?: string
    emailAddress?: string
    phoneNumber?: string
    note?: string
  }): Promise<any> {
    try {
      const client = getSquareClient()
      if (!client) return null
      
      const customersApi = client.customersApi
      
      const requestBody = {
        givenName: customerData.givenName,
        familyName: customerData.familyName || '',
        emailAddress: customerData.emailAddress,
        phoneNumber: customerData.phoneNumber,
        note: customerData.note
      }

      const { result } = await customersApi.createCustomer(requestBody)
      return result.customer
    } catch (error: any) {
      console.error('❌ Error creating Square customer:', error)
      return null
    }
  }

  /**
   * Handle Square webhooks
   */
  static async handleWebhook(body: any, signature?: string): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // Square webhook validation would go here if needed
      // For now, we'll just process the event
      
      console.log('🎣 Square webhook received:', body.type || 'unknown')
      
      return { success: true, event: body }
    } catch (error: any) {
      console.error('❌ Square webhook error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Test Square connection
   */
  static async testConnection(): Promise<{ success: boolean; error?: string; locations?: any[] }> {
    try {
      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.'
        }
      }
      
      const locations = await this.getLocations()
      return {
        success: true,
        locations
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Square connection failed'
      }
    }
  }
}