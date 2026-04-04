import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'
import { TIER_MINUTES } from '@/lib/minutes'
import AuditLogger, { AuditEventType } from '@/lib/audit-logger'
import { employeeProvisioning } from '@/lib/phone-employees'
import { logger } from '@/lib/logger'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!endpointSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  if (!sig) {
    return NextResponse.json({ error: 'No signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  const stripe = getStripe()

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        logger.info('PaymentIntent succeeded', { id: paymentIntent.id })

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', paymentIntent.customer)

        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        logger.info('Subscription created', { id: subscription.id })

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
      }

      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object as Stripe.Subscription
        logger.info('Subscription updated', { id: updatedSubscription.id })

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
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object
        logger.info('Subscription deleted', { id: deletedSubscription.id })

        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSubscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        logger.info('Invoice payment succeeded', { id: invoice.id })

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
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object
        logger.warn('Invoice payment failed', { id: failedInvoice.id })

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
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        logger.info('Checkout session completed', { id: session.id, type: session.metadata?.type })

        // Handle minute pack purchase
        if (session.metadata?.type === 'minute_pack_purchase' || session.metadata?.type === 'credit_pack_purchase') {
          const businessId = session.metadata.business_id
          const packId = session.metadata.pack_id
          const minutes = parseInt(session.metadata.minutes || session.metadata.credits || '0')
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

          if (businessId && packId && minutes) {
            // Add purchased minutes directly
            const { error: addErr } = await supabase.rpc('increment_purchased_credits', {
              p_business_id: businessId,
              p_amount: minutes,
            }).catch(() => ({ error: 'rpc not found' })) as any

            // Fallback: direct update if RPC doesn't exist
            if (addErr) {
              const { data: biz } = await supabase.from('businesses').select('purchased_credits').eq('id', businessId).single()
              await supabase.from('businesses').update({
                purchased_credits: (biz?.purchased_credits || 0) + minutes,
                updated_at: new Date().toISOString(),
              }).eq('id', businessId)
            }

            {
              logger.info('Minutes added', { businessId, minutes })

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
              logger.error('Failed to add purchased credits', { businessId, result })
            }
          } else {
            logger.error('Missing metadata in minute pack purchase', { metadata: session.metadata })
          }
        }

        // Handle subscription checkout completion
        if (session.metadata?.type === 'subscription' && session.metadata?.business_id) {
          const businessId = session.metadata.business_id
          const targetPlan = session.metadata.target_plan
          const stripeCustomerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.toString()

          logger.info('Subscription checkout completed', { businessId, plan: targetPlan })

          const monthlyCredits = TIER_MINUTES[targetPlan as keyof typeof TIER_MINUTES] || TIER_MINUTES.starter
          const nextResetDate = new Date()
          nextResetDate.setMonth(nextResetDate.getMonth() + 1)

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

          // Provision/migrate based on plan tier
          if (targetPlan === 'starter') {
            employeeProvisioning.provisionStarterForBusiness(businessId)
              .then(() => logger.info('Starter provisioning complete', { businessId }))
              .catch(err => logger.error('Starter provisioning failed', err))
          } else if (targetPlan === 'pro') {
            employeeProvisioning.migrateBusinessTier(businessId, 'pro')
              .then(result => {
                logger.info('Pro migration complete', { businessId, migrated: result.migrated })
                if (result.errors.length > 0) {
                  logger.warn('Pro migration had errors', { errors: result.errors })
                }
              })
              .catch(err => logger.error('Pro migration failed', err))
          }

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
      }

      default:
        logger.debug('Unhandled event type', { type: event.type })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Error processing webhook', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
