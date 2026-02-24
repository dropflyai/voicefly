import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { createServerClient } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

/**
 * GET /api/billing/invoices
 * Returns invoice history for the authenticated user's business
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAuth(req)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const businessId = authResult.user.businessId

    // Get business Stripe customer ID
    const { data: business, error } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // If no Stripe customer yet, return empty
    if (!business.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    // Fetch invoices from Stripe
    try {
      const invoices = await stripe.invoices.list({
        customer: business.stripe_customer_id,
        limit: 20
      })

      const formatted = invoices.data.map(inv => ({
        id: inv.id,
        date: new Date((inv.created || 0) * 1000).toISOString(),
        amount: (inv.amount_paid || inv.amount_due || 0) / 100,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'open' ? 'pending' : 'failed',
        description: inv.lines.data[0]?.description || `Invoice ${inv.number || inv.id}`,
        downloadUrl: inv.invoice_pdf || undefined
      }))

      return NextResponse.json({ invoices: formatted })
    } catch (stripeErr) {
      console.error('Error fetching Stripe invoices:', stripeErr)
      return NextResponse.json({ invoices: [] })
    }
  } catch (error: any) {
    console.error('Error getting invoices:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get invoices' },
      { status: 500 }
    )
  }
}
