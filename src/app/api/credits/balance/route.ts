import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CREDITS_PER_MINUTE } from '@/lib/credit-system'
import { validateBusinessAccess } from '@/lib/api-auth'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/credits/balance
 * Get credit balance for a business
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json(
        { error: 'business_id is required' },
        { status: 400 }
      )
    }

    const authResult = await validateBusinessAccess(req, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    // Query balance directly with service role to bypass RLS
    const { data, error } = await serviceClient
      .from('businesses')
      .select('monthly_credits, purchased_credits, credits_used_this_month, credits_reset_date')
      .eq('id', businessId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 })
    }

    const monthly = data.monthly_credits || 0
    const purchased = data.purchased_credits || 0
    const used = data.credits_used_this_month || 0

    const balance = {
      monthly_credits: monthly,
      purchased_credits: purchased,
      total_credits: monthly + purchased,
      credits_used_this_month: used,
      credits_reset_date: data.credits_reset_date,
      monthly_minutes: Math.floor(monthly / CREDITS_PER_MINUTE),
      purchased_minutes: Math.floor(purchased / CREDITS_PER_MINUTE),
      total_minutes: Math.floor((monthly + purchased) / CREDITS_PER_MINUTE),
      minutes_used_this_month: Math.floor(used / CREDITS_PER_MINUTE),
    }

    return NextResponse.json({
      success: true,
      balance
    })
  } catch (error) {
    console.error('Error getting credit balance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
