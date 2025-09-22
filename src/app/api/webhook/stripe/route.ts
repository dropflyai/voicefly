import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = headers().get('stripe-signature')

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  if (!sig) {
    console.error('No stripe-signature header found')
    return NextResponse.json({ error: 'No signature header' }, { status: 400 })
  }

  let event

  try {
    // In a real implementation, you would verify the webhook signature here
    // For now, we'll just parse the event
    event = JSON.parse(body)
  } catch (err) {
    console.error('Error parsing webhook payload:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('PaymentIntent was successful!', paymentIntent.id)

        // Update subscription status in database
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', paymentIntent.customer)

        break

      case 'customer.subscription.created':
        const subscription = event.data.object
        console.log('Subscription created:', subscription.id)

        // Create subscription record
        await supabase
          .from('subscriptions')
          .insert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            plan_id: subscription.items.data[0]?.price?.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object
        console.log('Subscription updated:', updatedSubscription.id)

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status: updatedSubscription.status,
            plan_id: updatedSubscription.items.data[0]?.price?.id,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', updatedSubscription.id)

        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        console.log('Subscription deleted:', deletedSubscription.id)

        // Update subscription status to cancelled
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object
        console.log('Invoice payment succeeded:', invoice.id)

        // Log successful payment
        await supabase
          .from('payments')
          .insert({
            stripe_invoice_id: invoice.id,
            stripe_customer_id: invoice.customer,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            created_at: new Date().toISOString()
          })

        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object
        console.log('Invoice payment failed:', failedInvoice.id)

        // Log failed payment
        await supabase
          .from('payments')
          .insert({
            stripe_invoice_id: failedInvoice.id,
            stripe_customer_id: failedInvoice.customer,
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            status: 'failed',
            created_at: new Date().toISOString()
          })

        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}