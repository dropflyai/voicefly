import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'
import CreditSystem, { CREDITS_PER_MINUTE } from '@/lib/credit-system'
import AuditLogger, { AuditEventType } from '@/lib/audit-logger'
import { employeeProvisioning } from '@/lib/phone-employees'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  if (!sig) {
    console.error('No stripe-signature header found')
    return NextResponse.json({ error: 'No signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature - SECURITY CRITICAL
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
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
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription created:', subscription.id)

        // Create subscription record
        await supabase
          .from('subscriptions')
          .insert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            plan_id: subscription.items.data[0]?.price?.id,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', updatedSubscription.id)

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            status: updatedSubscription.status,
            plan_id: updatedSubscription.items.data[0]?.price?.id,
            current_period_start: new Date((updatedSubscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
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

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)

        // Check if this is a minute/credit pack purchase
        if (session.metadata?.type === 'minute_pack_purchase' || session.metadata?.type === 'credit_pack_purchase') {
          const businessId = session.metadata.business_id
          const packId = session.metadata.pack_id
          const credits = parseInt(session.metadata.credits)
          const minutes = session.metadata.minutes ? parseInt(session.metadata.minutes) : Math.floor(credits / CREDITS_PER_MINUTE)
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

          if (businessId && packId && credits) {
            console.log(`💳 Processing minute pack purchase: ${minutes} minutes (${credits} credits) for business ${businessId}`)

            // Add purchased credits to business
            const result = await CreditSystem.addPurchasedCredits(
              businessId,
              credits,
              packId,
              paymentIntentId
            )

            if (result.success) {
              console.log(`✅ Added ${minutes} minutes (${credits} credits) to business ${businessId}. New balance: ${result.balance?.total_minutes} minutes`)

              // Log purchase to credit_purchases table
              await supabase
                .from('credit_purchases')
                .insert({
                  business_id: businessId,
                  pack_id: packId,
                  credits_purchased: credits,
                  minutes_purchased: minutes,
                  amount_paid: session.amount_total || 0,
                  stripe_payment_id: paymentIntentId,
                  stripe_invoice_id: typeof session.invoice === 'string' ? session.invoice : session.invoice?.id,
                  status: 'completed',
                  created_at: new Date().toISOString()
                })

              // Audit log
              await AuditLogger.log({
                event_type: AuditEventType.CREDIT_PURCHASED,
                business_id: businessId,
                metadata: {
                  pack_id: packId,
                  minutes_purchased: minutes,
                  credits_purchased: credits,
                  amount_paid: session.amount_total,
                  stripe_session_id: session.id
                },
                severity: 'low'
              })
            } else {
              console.error('❌ Failed to add purchased credits:', result)
            }
          } else {
            console.error('Missing metadata in minute pack purchase:', session.metadata)
          }
        }

        // Handle subscription checkout completion
        if (session.metadata?.type === 'subscription' && session.metadata?.business_id) {
          const businessId = session.metadata.business_id
          const targetPlan = session.metadata.target_plan
          const stripeCustomerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.toString()

          console.log(`💳 Subscription checkout completed: ${targetPlan} plan for business ${businessId}`)

          // Determine credits allocation based on plan
          const monthlyCredits = targetPlan === 'pro' ? 5000 : 500 // Pro: 1000 min, Starter: 100 min
          const nextResetDate = new Date()
          nextResetDate.setMonth(nextResetDate.getMonth() + 1)

          // Update business with subscription info
          await supabase
            .from('businesses')
            .update({
              subscription_tier: targetPlan,
              subscription_status: 'active',
              stripe_customer_id: stripeCustomerId,
              monthly_credits: monthlyCredits,
              credits_used_this_month: 0,
              credits_reset_date: nextResetDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', businessId)

          console.log(`✅ Business ${businessId} upgraded to ${targetPlan} plan`)

          // Provision phone based on plan tier
          if (targetPlan === 'starter') {
            // Starter: dedicated Twilio number, shared VAPI assistant (Maya)
            employeeProvisioning.provisionStarterForBusiness(businessId)
              .then(() => console.log(`✅ Starter provisioning complete for business ${businessId}`))
              .catch(err => console.error(`❌ Starter provisioning failed for business ${businessId}:`, err))
          } else {
            // Pro: full upgrade — dedicated VAPI assistant + dedicated Twilio number
            employeeProvisioning.upgradeAllPhonesToTwilioVapi(businessId)
              .then(count => {
                if (count > 0) console.log(`✅ Upgraded ${count} employee phone(s) to Twilio-VAPI for business ${businessId}`)
              })
              .catch(err => console.error(`❌ Failed to upgrade employee phones for business ${businessId}:`, err))
          }

          // Audit log
          await AuditLogger.log({
            event_type: AuditEventType.CREDIT_PURCHASED,
            business_id: businessId,
            metadata: {
              event: 'subscription_activated',
              plan: targetPlan,
              monthly_credits: monthlyCredits,
              stripe_session_id: session.id
            },
            severity: 'medium'
          })
        }

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