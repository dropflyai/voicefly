import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase'
import { TIER_MINUTES } from '@/lib/minutes'
import Stripe from 'stripe'

const getStripe = () => { if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured'); return new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil'
}) }

/**
 * GET /api/billing/info
 * Returns current subscription and billing info for the authenticated user's business
 */
export async function GET(req: NextRequest) {
  try {
    const stripe = getStripe()
    const authResult = await validateAuth(req)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const businessId = authResult.user.businessId

    // Get business details
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, subscription_tier, subscription_status, stripe_customer_id, trial_ends_at, created_at')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const tier = business.subscription_tier || 'starter'
    const tierKey = tier as keyof typeof TIER_PRICING
    const pricing = TIER_PRICING[tierKey] || TIER_PRICING.starter

    // Default response for trial/free users
    let billingInfo: any = {
      currentPlan: tier,
      billingCycle: 'monthly',
      nextBillingDate: business.trial_ends_at || new Date(Date.now() + 14 * 86400000).toISOString(),
      amount: pricing.price_cents / 100,
      paymentMethod: null,
      subscriptionStatus: business.subscription_status || 'trial'
    }

    // If they have a Stripe customer, get real subscription details
    if (business.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: business.stripe_customer_id,
          status: 'all',
          limit: 1
        })

        const sub = subscriptions.data[0]
        if (sub) {
          billingInfo.subscriptionStatus = sub.status
          billingInfo.nextBillingDate = new Date(sub.current_period_end * 1000).toISOString()
          billingInfo.amount = (sub.items.data[0]?.price?.unit_amount || 0) / 100
          billingInfo.billingCycle = sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'
        }

        // Get payment method
        const customer = await stripe.customers.retrieve(business.stripe_customer_id) as Stripe.Customer
        if (customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method as string
          )
          if (pm.card) {
            billingInfo.paymentMethod = {
              type: 'card',
              last4: pm.card.last4,
              brand: pm.card.brand,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year
            }
          }
        }
      } catch (stripeErr) {
        console.error('Error fetching Stripe data:', stripeErr)
        // Continue with defaults -- don't fail the whole request
      }
    }

    return NextResponse.json(billingInfo)
  } catch (error: any) {
    console.error('Error getting billing info:', error)
    return NextResponse.json(
      { error: 'Failed to get billing info' },
      { status: 500 }
    )
  }
}
