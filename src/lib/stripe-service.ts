import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Lazy initialization to avoid build-time errors
const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  })
}

export interface PaymentIntentData {
  amount: number // in cents
  customerId: string
  appointmentId: string
  businessId: string
  locationId?: string
  description?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  transactionId?: string
  error?: string
}

export class StripeService {
  /**
   * Create a payment intent for appointment payment
   */
  static async processPayment(data: PaymentIntentData): Promise<PaymentResult> {
    try {
      const stripe = getStripeClient()
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe client not initialized. Please configure Stripe credentials.'
        }
      }
      
      console.log('🔄 Processing Stripe payment:', { ...data, amount: data.amount / 100 })

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

      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: 'usd',
        description: data.description || `${business?.name || 'Nail Salon'} - ${appointment?.service?.name || 'Service'}`,
        metadata: {
          customerId: data.customerId,
          appointmentId: data.appointmentId,
          businessId: data.businessId,
          locationId: data.locationId || '',
          customerEmail: appointment?.customer?.email || '',
          ...data.metadata
        },
        receipt_email: appointment?.customer?.email || undefined,
        setup_future_usage: 'off_session' // Allow saving for future payments
      })

      console.log('✅ Stripe payment intent created:', paymentIntent.id)

      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        transactionId: paymentIntent.id
      }
    } catch (error: any) {
      console.error('❌ Stripe payment error:', error)
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      }
    }
  }

  /**
   * Confirm a payment intent (usually called after client-side confirmation)
   */
  static async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const stripe = getStripeClient()
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe client not initialized. Please configure Stripe credentials.'
        }
      }
      
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        transactionId: paymentIntent.id,
        error: paymentIntent.status !== 'succeeded' ? `Payment status: ${paymentIntent.status}` : undefined
      }
    } catch (error: any) {
      console.error('❌ Stripe confirmation error:', error)
      return {
        success: false,
        error: error.message || 'Payment confirmation failed'
      }
    }
  }

  /**
   * Refund a payment (full or partial)
   */
  static async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    try {
      const stripe = getStripeClient()
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe client not initialized. Please configure Stripe credentials.'
        }
      }
      
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // If not provided, refunds the full amount
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        metadata: {
          refund_reason: reason || 'Customer request',
          refund_date: new Date().toISOString()
        }
      })

      console.log('✅ Stripe refund created:', refund.id)

      return {
        success: true,
        transactionId: refund.id,
        paymentIntentId
      }
    } catch (error: any) {
      console.error('❌ Stripe refund error:', error)
      return {
        success: false,
        error: error.message || 'Refund processing failed'
      }
    }
  }

  /**
   * Retrieve payment intent details
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const stripe = getStripeClient()
      if (!stripe) return null
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent
    } catch (error: any) {
      console.error('❌ Error retrieving payment intent:', error)
      return null
    }
  }

  /**
   * Create a customer in Stripe (for future payments)
   */
  static async createCustomer(customerData: {
    email?: string
    name: string
    phone?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer | null> {
    try {
      const stripe = getStripeClient()
      if (!stripe) return null
      
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: customerData.metadata || {}
      })
      
      return customer
    } catch (error: any) {
      console.error('❌ Error creating Stripe customer:', error)
      return null
    }
  }

  /**
   * Handle Stripe webhooks
   */
  static async handleWebhook(body: string, signature: string): Promise<{ success: boolean; event?: Stripe.Event; error?: string }> {
    try {
      const stripe = getStripeClient()
      if (!stripe) {
        return { success: false, error: 'Stripe client not initialized' }
      }
      
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
      
      console.log('🎣 Stripe webhook received:', event.type)
      
      return { success: true, event }
    } catch (error: any) {
      console.error('❌ Stripe webhook error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get payment method details
   */
  static async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod | null> {
    try {
      const stripe = getStripeClient()
      if (!stripe) return null
      
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      return paymentMethod
    } catch (error: any) {
      console.error('❌ Error retrieving payment method:', error)
      return null
    }
  }
}