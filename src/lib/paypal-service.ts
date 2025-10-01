import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PayPal SDK types
interface PayPalOrder {
  id: string
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED'
  links: Array<{
    href: string
    rel: string
    method: string
  }>
  purchase_units: Array<{
    amount: {
      currency_code: string
      value: string
    }
  }>
}

interface PayPalPayment {
  id: string
  status: string
  amount: {
    total: string
    currency: string
  }
  payer: {
    payment_method: string
    payer_info: {
      email: string
      first_name?: string
      last_name?: string
    }
  }
}

export interface PayPalPaymentData {
  amount: number // in dollars (not cents like Stripe)
  customerId: string
  appointmentId: string
  businessId: string
  locationId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface PayPalResult {
  success: boolean
  orderId?: string
  approvalUrl?: string
  transactionId?: string
  error?: string
}

export class PayPalService {
  private static getAccessToken = async (): Promise<string | null> => {
    try {
      const clientId = process.env.PAYPAL_CLIENT_ID
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET
      const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com'

      if (!clientId || !clientSecret) {
        console.error('❌ PayPal credentials not configured')
        return null
      }

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('❌ PayPal access token error:', error)
      return null
    }
  }

  private static getBaseUrl = (): string => {
    return process.env.PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'
  }

  /**
   * Create a PayPal order for appointment payment
   */
  static async createOrder(data: PayPalPaymentData): Promise<PayPalResult> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'PayPal authentication failed. Please check your credentials.'
        }
      }

      console.log('🔄 Creating PayPal order:', { ...data, amount: `$${data.amount}` })

      // Get business information for better payment descriptions
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', data.businessId)
        .single()

      // Get appointment details
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name),
          customer:customers(first_name, last_name, email)
        `)
        .eq('id', data.appointmentId)
        .single()

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: data.amount.toFixed(2)
          },
          description: data.description || `${business?.name || 'Service Business'} - ${appointment?.service?.name || 'Service'}`,
          custom_id: data.appointmentId,
          invoice_id: `APP-${data.appointmentId}-${Date.now()}`,
          soft_descriptor: business?.name?.substring(0, 22) || 'Service Business'
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/cancel`,
          brand_name: business?.name || 'Service Business',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW'
        }
      }

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `${data.appointmentId}-${Date.now()}`
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ PayPal order creation failed:', errorData)
        return {
          success: false,
          error: errorData.message || 'Failed to create PayPal order'
        }
      }

      const order: PayPalOrder = await response.json()
      console.log('✅ PayPal order created:', order.id)

      // Find approval URL
      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href

      return {
        success: true,
        orderId: order.id,
        approvalUrl,
        transactionId: order.id
      }
    } catch (error: any) {
      console.error('❌ PayPal order error:', error)
      return {
        success: false,
        error: error.message || 'PayPal order creation failed'
      }
    }
  }

  /**
   * Capture a PayPal order (after customer approval)
   */
  static async captureOrder(orderId: string): Promise<PayPalResult> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'PayPal authentication failed'
        }
      }

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ PayPal capture failed:', errorData)
        return {
          success: false,
          error: errorData.message || 'Failed to capture PayPal payment'
        }
      }

      const capture = await response.json()
      console.log('✅ PayPal payment captured:', capture.id)

      return {
        success: true,
        orderId: capture.id,
        transactionId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || capture.id
      }
    } catch (error: any) {
      console.error('❌ PayPal capture error:', error)
      return {
        success: false,
        error: error.message || 'PayPal payment capture failed'
      }
    }
  }

  /**
   * Refund a PayPal payment
   */
  static async refundPayment(captureId: string, amount?: number, reason?: string): Promise<PayPalResult> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        return {
          success: false,
          error: 'PayPal authentication failed'
        }
      }

      const refundData: any = {
        note_to_payer: reason || 'Refund processed by salon'
      }

      if (amount) {
        refundData.amount = {
          currency_code: 'USD',
          value: amount.toFixed(2)
        }
      }

      const response = await fetch(`${this.getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refundData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ PayPal refund failed:', errorData)
        return {
          success: false,
          error: errorData.message || 'Failed to process PayPal refund'
        }
      }

      const refund = await response.json()
      console.log('✅ PayPal refund created:', refund.id)

      return {
        success: true,
        transactionId: refund.id
      }
    } catch (error: any) {
      console.error('❌ PayPal refund error:', error)
      return {
        success: false,
        error: error.message || 'PayPal refund failed'
      }
    }
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string): Promise<PayPalOrder | null> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) return null

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ Failed to get PayPal order:', orderId)
        return null
      }

      return await response.json()
    } catch (error: any) {
      console.error('❌ Error retrieving PayPal order:', error)
      return null
    }
  }

  /**
   * Handle PayPal webhooks
   */
  static async handleWebhook(body: any, headers: Record<string, string>): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // PayPal webhook verification would go here
      // For now, we'll trust the webhook (add verification in production)
      
      console.log('🎣 PayPal webhook received:', body.event_type)
      
      return { success: true, event: body }
    } catch (error: any) {
      console.error('❌ PayPal webhook error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Verify webhook signature (implement for production)
   */
  static verifyWebhookSignature(body: string, headers: Record<string, string>): boolean {
    // TODO: Implement PayPal webhook signature verification
    // https://developer.paypal.com/api/rest/webhooks/
    return true // For now, trust all webhooks
  }
}