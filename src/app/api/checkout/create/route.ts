import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { validateRequest, checkoutCreateSchema, formatValidationErrors } from '@/lib/validation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting (10 requests per minute for payment endpoints)
    const rateLimitIdentifier = getRateLimitIdentifier(request)
    const rateLimit = await checkRateLimit(rateLimitIdentifier, 'payment')

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.reset || Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rateLimit.remaining || 0),
          }
        }
      )
    }

    // 2. Input Validation with Zod
    const validation = await validateRequest(request, checkoutCreateSchema)

    if (!validation.success) {
      const formattedErrors = formatValidationErrors(validation.errors)
      return NextResponse.json(
        formattedErrors,
        { status: 400 }
      )
    }

    const { priceId, businessId, planName, successUrl, cancelUrl } = validation.data

    // 3. Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3022'

    // 4. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancelUrl || `${baseUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          business_id: businessId || 'unknown',
          plan_name: planName || 'Unknown Plan',
        },
      },
      metadata: {
        business_id: businessId || 'unknown',
        plan_name: planName || 'Unknown Plan',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    // 5. Return success response
    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })
  } catch (error: any) {
    // 6. Error handling with Sentry
    console.error('Stripe checkout error:', error)

    Sentry.captureException(error, {
      tags: {
        api_route: '/api/checkout/create',
        error_type: 'stripe_checkout_error',
      },
      extra: {
        errorMessage: error.message,
      },
    })

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
