import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { getMinutesBalance } from '@/lib/minutes'

/**
 * GET /api/credits/balance
 * Get minutes balance for a business
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(req, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    const balance = await getMinutesBalance(businessId)
    if (!balance) {
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      balance: {
        monthly_minutes: balance.monthly_minutes,
        purchased_minutes: balance.purchased_minutes,
        minutes_used_this_month: balance.minutes_used_this_month,
        minutes_remaining: balance.minutes_remaining,
        total_allocation: balance.total_allocation,
        reset_date: balance.reset_date,
        // Keep old field names for backward compat with CreditMeter
        monthly_credits: balance.monthly_minutes,
        purchased_credits: balance.purchased_minutes,
        credits_used_this_month: balance.minutes_used_this_month,
        total_credits: balance.minutes_remaining,
      },
    })
  } catch (error) {
    console.error('Error getting balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
