import { NextRequest, NextResponse } from 'next/server'
import CreditSystem from '@/lib/credit-system'

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

    // Get balance
    const balance = await CreditSystem.getBalance(businessId)

    if (!balance) {
      return NextResponse.json(
        { error: 'Failed to get balance' },
        { status: 500 }
      )
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
