import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

/**
 * POST /api/billing/cancel
 * Cancels the active subscription at end of billing period
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuth(req)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await req.json()

    if (!authResult.user.businessIds.includes(businessId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = createServerClient()

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, stripe_customer_id, subscription_tier')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Find active subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: business.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // Also check for trialing
      const trialingSubs = await stripe.subscriptions.list({
        customer: business.stripe_customer_id,
        status: 'trialing',
        limit: 1,
      })

      if (trialingSubs.data.length === 0) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
      }

      // Cancel trialing subscription immediately
      await stripe.subscriptions.cancel(trialingSubs.data[0].id)
    } else {
      // Cancel at end of period (graceful)
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true,
      })
    }

    // Update business record
    await supabase
      .from('businesses')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been cancelled. You will retain access until the end of your billing period.',
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
