import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase'
import { getSubscriptionPriceId } from '@/lib/stripe-products'
import Stripe from 'stripe'

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  })
}

/**
 * POST /api/billing/create-checkout
 * Creates a Stripe Checkout Session for subscription signup/upgrade
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    // Authenticate
    const authResult = await validateAuth(req)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, targetPlan } = await req.json()

    // Validate business access
    if (!authResult.user.businessIds.includes(businessId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate target plan
    if (!['starter', 'growth', 'pro'].includes(targetPlan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be "starter", "growth", or "pro".' }, { status: 400 })
    }

    // Get Stripe price ID
    const priceId = getSubscriptionPriceId(targetPlan as 'starter' | 'growth' | 'pro')
    if (!priceId) {
      return NextResponse.json({ error: `Stripe price not configured for ${targetPlan} plan` }, { status: 500 })
    }

    const supabase = createServerClient()

    // Get business details
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = business.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: authResult.user.email,
        name: business.name,
        metadata: {
          business_id: businessId,
          voicefly_user_id: authResult.user.id
        }
      })
      stripeCustomerId = customer.id

      // Save customer ID to business
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', businessId)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        business_id: businessId,
        target_plan: targetPlan,
        type: 'subscription'
      },
      subscription_data: {
        metadata: {
          business_id: businessId,
          plan: targetPlan
        }
      },
      success_url: `${appUrl}/dashboard/billing?subscribed=true&plan=${targetPlan}`,
      cancel_url: `${appUrl}/dashboard/billing`,
      allow_promotion_codes: true
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error creating checkout session', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
