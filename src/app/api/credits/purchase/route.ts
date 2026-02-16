import { NextRequest, NextResponse } from 'next/server'
import { MINUTE_PACKS } from '@/lib/credit-system'
import { validateBusinessAccess, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { creditPurchaseSchema, validate } from '@/lib/validations'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
})

/**
 * POST /api/credits/purchase
 * Create Stripe checkout session for credit pack purchase
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit check - sensitive tier for payment operations
    const rateLimit = await checkRateLimit(req, 'sensitive')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    const body = await req.json()

    // Validate input
    const validation = validate(creditPurchaseSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { business_id, pack_id } = validation.data

    // Validate authentication and business access
    const authResult = await validateBusinessAccess(req, business_id)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    // Find minute pack
    const pack = MINUTE_PACKS.find(p => p.id === pack_id)
    if (!pack) {
      return NextResponse.json(
        { error: 'Invalid pack_id' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VoiceFly Minutes - ${pack.name}`,
              description: `${pack.minutes.toLocaleString()} voice minutes for your VoiceFly account`,
              images: ['https://voicefly.com/logo.png'], // Replace with actual logo URL
            },
            unit_amount: pack.price * 100, // Convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?minutes_purchased=true&pack=${pack_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/credits`,
      metadata: {
        business_id,
        pack_id,
        minutes: pack.minutes.toString(),
        credits: pack.credits.toString(),
        type: 'minute_pack_purchase'
      }
    })

    return NextResponse.json({
      success: true,
      checkout_url: session.url
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
