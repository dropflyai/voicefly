import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKS } from '@/lib/credit-system'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
})

/**
 * POST /api/credits/purchase
 * Create Stripe checkout session for credit pack purchase
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { business_id, pack_id } = body

    if (!business_id || !pack_id) {
      return NextResponse.json(
        { error: 'business_id and pack_id are required' },
        { status: 400 }
      )
    }

    // Find credit pack
    const pack = CREDIT_PACKS.find(p => p.id === pack_id)
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
              name: `VoiceFly Credits - ${pack.name}`,
              description: `${pack.credits.toLocaleString()} credits for your VoiceFly account`,
              images: ['https://voicefly.com/logo.png'], // Replace with actual logo URL
            },
            unit_amount: pack.price, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?credits_purchased=true&pack=${pack_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/credits`,
      metadata: {
        business_id,
        pack_id,
        credits: pack.credits.toString(),
        type: 'credit_pack_purchase'
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
