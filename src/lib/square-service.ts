/**
 * Square POS Integration Service
 *
 * Handles two modes of operation:
 * 1. Legacy: Global SQUARE_ACCESS_TOKEN for direct payment processing (existing methods)
 * 2. Per-business OAuth: Each business connects their own Square account via OAuth
 *
 * The OAuth flow stores tokens in the square_connections table.
 * Order syncing uses direct fetch to Square REST API (not the squareup SDK).
 */

import { Client, Environment } from 'square'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Square environment helpers
const isProduction = process.env.SQUARE_ENVIRONMENT === 'production'
const SQUARE_BASE_URL = isProduction
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com'
const SQUARE_OAUTH_URL = 'https://connect.squareup.com' // OAuth always uses production URL

// Lazy initialization for legacy SDK client
const getSquareClient = (): Client | null => {
  try {
    if (process.env.SQUARE_ACCESS_TOKEN) {
      return new Client({
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: isProduction ? Environment.Production : Environment.Sandbox,
      })
    }
    return null
  } catch (error) {
    console.warn('Square client initialization failed:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

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

export interface SquareConnection {
  accessToken: string
  locationId: string
  merchantId: string
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SquareService {
  // ==========================================================================
  // Per-business OAuth connection methods (NEW)
  // ==========================================================================

  /**
   * Get active Square connection for a business.
   * Returns null if no active connection exists.
   */
  static async getConnection(businessId: string): Promise<SquareConnection | null> {
    try {
      const { data, error } = await supabase
        .from('square_connections')
        .select('access_token, square_location_id, square_merchant_id, token_expires_at, refresh_token')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      // Check if token is expired and refresh if needed
      if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        if (data.refresh_token) {
          const refreshed = await this.refreshAccessToken(businessId, data.refresh_token)
          if (!refreshed) return null

          // Re-fetch after refresh
          const { data: refreshedData, error: refreshError } = await supabase
            .from('square_connections')
            .select('access_token, square_location_id, square_merchant_id')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single()

          if (refreshError || !refreshedData) return null

          return {
            accessToken: refreshedData.access_token,
            locationId: refreshedData.square_location_id || '',
            merchantId: refreshedData.square_merchant_id || '',
          }
        }
        return null
      }

      return {
        accessToken: data.access_token,
        locationId: data.square_location_id || '',
        merchantId: data.square_merchant_id || '',
      }
    } catch (error) {
      console.error('[Square] getConnection error:', error)
      return null
    }
  }

  /**
   * Exchange an OAuth authorization code for tokens and store the connection.
   */
  static async storeConnection(
    businessId: string,
    authorizationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch(`${SQUARE_OAUTH_URL}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SQUARE_APPLICATION_ID,
          client_secret: process.env.SQUARE_APPLICATION_SECRET,
          code: authorizationCode,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('[Square] Token exchange failed:', tokenData)
        return {
          success: false,
          error: tokenData.message || tokenData.error_description || 'Token exchange failed',
        }
      }

      const {
        access_token,
        refresh_token,
        expires_at,
        merchant_id,
      } = tokenData

      // Fetch the merchant's default location
      let locationId: string | null = null
      try {
        const locResponse = await fetch(`${SQUARE_BASE_URL}/v2/locations`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        const locData = await locResponse.json()
        locationId = locData.locations?.[0]?.id || null
      } catch (locErr) {
        console.warn('[Square] Could not fetch locations:', locErr)
      }

      // Upsert connection (one per business)
      const { error: upsertError } = await supabase
        .from('square_connections')
        .upsert(
          {
            business_id: businessId,
            access_token,
            refresh_token: refresh_token || null,
            token_expires_at: expires_at || null,
            square_merchant_id: merchant_id || null,
            square_location_id: locationId,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'business_id' }
        )

      if (upsertError) {
        console.error('[Square] Failed to store connection:', upsertError)
        return { success: false, error: 'Failed to save Square connection' }
      }

      console.log(`[Square] Connection stored for business ${businessId}, merchant ${merchant_id}`)
      return { success: true }
    } catch (error: any) {
      console.error('[Square] storeConnection error:', error)
      return { success: false, error: error.message || 'Failed to connect Square' }
    }
  }

  /**
   * Refresh an expired OAuth access token.
   */
  static async refreshAccessToken(businessId: string, refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${SQUARE_OAUTH_URL}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SQUARE_APPLICATION_ID,
          client_secret: process.env.SQUARE_APPLICATION_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.access_token) {
        console.error('[Square] Token refresh failed:', data)
        return false
      }

      const { error } = await supabase
        .from('square_connections')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          token_expires_at: data.expires_at || null,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)

      if (error) {
        console.error('[Square] Failed to update refreshed token:', error)
        return false
      }

      console.log(`[Square] Token refreshed for business ${businessId}`)
      return true
    } catch (error) {
      console.error('[Square] refreshAccessToken error:', error)
      return false
    }
  }

  /**
   * Create a Square order from a phone order.
   * Uses direct fetch to the Square Orders API.
   */
  static async createOrder(
    businessId: string,
    phoneOrder: any,
    locationId: string
  ): Promise<{ success: boolean; squareOrderId?: string; error?: string }> {
    try {
      const connection = await this.getConnection(businessId)
      if (!connection) {
        return { success: false, error: 'No active Square connection for this business' }
      }

      // Build line items from phone order items
      const lineItems = (phoneOrder.items || []).map((item: any) => ({
        name: item.name || 'Item',
        quantity: String(item.quantity || 1),
        base_price_money: {
          amount: Math.round((item.price || 0) * 100), // dollars -> cents
          currency: 'USD',
        },
        note: item.notes || item.special_instructions || undefined,
      }))

      // Build the order payload
      const orderPayload: any = {
        idempotency_key: randomUUID(),
        order: {
          location_id: locationId,
          line_items: lineItems,
          ...(phoneOrder.customer_name && {
            fulfillments: [
              {
                type: phoneOrder.order_type === 'delivery' ? 'DELIVERY' : 'PICKUP',
                state: 'PROPOSED',
                ...(phoneOrder.order_type === 'delivery'
                  ? {
                      delivery_details: {
                        recipient: {
                          display_name: phoneOrder.customer_name,
                          phone_number: phoneOrder.customer_phone || undefined,
                          email_address: phoneOrder.customer_email || undefined,
                        },
                      },
                    }
                  : {
                      pickup_details: {
                        recipient: {
                          display_name: phoneOrder.customer_name,
                          phone_number: phoneOrder.customer_phone || undefined,
                          email_address: phoneOrder.customer_email || undefined,
                        },
                        ...(phoneOrder.requested_time && {
                          pickup_at: new Date(phoneOrder.requested_time).toISOString(),
                        }),
                      },
                    }),
              },
            ],
          }),
          metadata: {
            voicefly_order_id: phoneOrder.id,
            voicefly_business_id: businessId,
          },
        },
      }

      if (phoneOrder.special_instructions) {
        orderPayload.order.metadata.special_instructions = phoneOrder.special_instructions.substring(0, 60)
      }

      const response = await fetch(`${SQUARE_BASE_URL}/v2/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${connection.accessToken}`,
          'Square-Version': '2024-01-18',
        },
        body: JSON.stringify(orderPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.errors
          ? result.errors.map((e: any) => e.detail || e.code).join(', ')
          : 'Failed to create Square order'
        console.error('[Square] Create order failed:', result)

        // Record failed sync
        await supabase.from('square_synced_orders').insert({
          business_id: businessId,
          phone_order_id: phoneOrder.id,
          square_order_id: '',
          status: 'failed',
          sync_error: errorMsg,
        })

        return { success: false, error: errorMsg }
      }

      const squareOrderId = result.order?.id
      if (!squareOrderId) {
        return { success: false, error: 'No order ID returned from Square' }
      }

      // Record successful sync
      await supabase.from('square_synced_orders').insert({
        business_id: businessId,
        phone_order_id: phoneOrder.id,
        square_order_id: squareOrderId,
        status: 'synced',
      })

      // Update last_synced_at on the connection
      await supabase
        .from('square_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('business_id', businessId)

      console.log(`[Square] Order ${squareOrderId} created for phone order ${phoneOrder.id}`)
      return { success: true, squareOrderId }
    } catch (error: any) {
      console.error('[Square] createOrder error:', error)
      return { success: false, error: error.message || 'Failed to create Square order' }
    }
  }

  // ==========================================================================
  // Legacy methods (existing functionality, uses global SQUARE_ACCESS_TOKEN)
  // ==========================================================================

  /**
   * Process payment using Square (legacy - global token)
   */
  static async processPayment(data: SquarePaymentData): Promise<SquarePaymentResult> {
    try {
      console.log('[Square] Processing payment:', { ...data, amount: data.amount / 100 })

      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.',
        }
      }

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

      let squareLocationId = data.locationId
      if (!squareLocationId) {
        const locationsApi = client.locationsApi
        const { result } = await locationsApi.listLocations()
        squareLocationId = result.locations?.[0]?.id || process.env.SQUARE_LOCATION_ID!
      }

      const paymentsApi = client.paymentsApi
      const idempotencyKey = randomUUID()

      const requestBody = {
        sourceId: data.nonce || 'CASH',
        idempotencyKey,
        amountMoney: {
          amount: BigInt(data.amount),
          currency: 'USD',
        },
        locationId: squareLocationId,
        note:
          data.description ||
          `${business?.name || 'Business'} - ${appointment?.service?.name || 'Service'}`,
        buyerEmailAddress: appointment?.customer?.email,
        metadata: {
          customerId: data.customerId,
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          customerName: `${appointment?.customer?.first_name || ''} ${appointment?.customer?.last_name || ''}`.trim(),
          customerPhone: appointment?.customer?.phone || '',
          ...data.metadata,
        },
      }

      const { result } = await paymentsApi.createPayment(requestBody)

      if (result.payment) {
        console.log('[Square] Payment processed:', result.payment.id)
        return {
          success: true,
          transactionId: result.payment.id,
          paymentId: result.payment.id,
        }
      } else {
        throw new Error('No payment result returned from Square')
      }
    } catch (error: any) {
      console.error('[Square] Payment error:', error)
      let errorMessage = 'Payment processing failed'
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.detail || e.code).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get payment details from Square (legacy)
   */
  static async getPayment(paymentId: string): Promise<any> {
    try {
      const client = getSquareClient()
      if (!client) return null

      const paymentsApi = client.paymentsApi
      const { result } = await paymentsApi.getPayment(paymentId)
      return result.payment
    } catch (error: any) {
      console.error('[Square] Error retrieving payment:', error)
      return null
    }
  }

  /**
   * Refund a Square payment (legacy)
   */
  static async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<SquarePaymentResult> {
    try {
      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.',
        }
      }

      const refundsApi = client.refundsApi
      const idempotencyKey = randomUUID()

      const payment = await this.getPayment(paymentId)
      if (!payment) {
        return { success: false, error: 'Original payment not found' }
      }

      const refundAmount = amount || Number(payment.amountMoney?.amount || 0)

      const requestBody = {
        idempotencyKey,
        amountMoney: {
          amount: BigInt(refundAmount),
          currency: 'USD',
        },
        paymentId,
        reason: reason || 'Customer request',
      }

      const { result } = await refundsApi.refundPayment(requestBody)

      if (result.refund) {
        console.log('[Square] Refund processed:', result.refund.id)
        return {
          success: true,
          transactionId: result.refund.id,
          paymentId,
        }
      } else {
        throw new Error('No refund result returned from Square')
      }
    } catch (error: any) {
      console.error('[Square] Refund error:', error)
      let errorMessage = 'Refund processing failed'
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.detail || e.code).join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      return { success: false, error: errorMessage }
    }
  }

  /**
   * List Square locations (legacy)
   */
  static async getLocations(): Promise<any[]> {
    try {
      const client = getSquareClient()
      if (!client) {
        console.warn('[Square] Client not initialized for getLocations')
        return []
      }
      const locationsApi = client.locationsApi
      const { result } = await locationsApi.listLocations()
      return result.locations || []
    } catch (error: any) {
      console.error('[Square] Error retrieving locations:', error)
      return []
    }
  }

  /**
   * Create a customer in Square (legacy)
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
        note: customerData.note,
      }

      const { result } = await customersApi.createCustomer(requestBody)
      return result.customer
    } catch (error: any) {
      console.error('[Square] Error creating customer:', error)
      return null
    }
  }

  /**
   * Handle Square webhooks
   */
  static async handleWebhook(
    body: any,
    signature?: string
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      console.log('[Square] Webhook received:', body.type || 'unknown')
      return { success: true, event: body }
    } catch (error: any) {
      console.error('[Square] Webhook error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Test Square connection (legacy)
   */
  static async testConnection(): Promise<{
    success: boolean
    error?: string
    locations?: any[]
  }> {
    try {
      const client = getSquareClient()
      if (!client) {
        return {
          success: false,
          error: 'Square client not initialized. Please configure Square credentials.',
        }
      }
      const locations = await this.getLocations()
      return { success: true, locations }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Square connection failed',
      }
    }
  }
}
