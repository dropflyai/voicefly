import { NextRequest, NextResponse } from 'next/server'
import { validateAuth, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Auth
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get('business_id') || authResult.user.businessId

    // Verify access
    if (!authResult.user.businessIds.includes(business_id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch real revenue data from payments table
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const { data: payments, error } = await supabase
      .from('payments')
      .select('total_amount, created_at, status')
      .eq('business_id', business_id)
      .eq('status', 'paid')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Group by month
    const monthlyData: Record<string, number> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (const payment of (payments || [])) {
      const date = new Date(payment.created_at)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      monthlyData[key] = (monthlyData[key] || 0) + (payment.total_amount || 0)
    }

    // Format for response
    const revenueData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      revenueData.push({
        month: months[date.getMonth()],
        revenue: monthlyData[key] || 0,
      })
    }

    return NextResponse.json(revenueData)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Auth
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { business_id, revenue_amount, source, appointment_id } = body

    if (!business_id || !revenue_amount) {
      return NextResponse.json({ error: 'business_id and revenue_amount are required' }, { status: 400 })
    }

    // Verify access
    if (!authResult.user.businessIds.includes(business_id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: revenue, error } = await supabase
      .from('payments')
      .insert({
        business_id,
        total_amount: revenue_amount * 100,
        source: source || 'manual',
        appointment_id: appointment_id || null,
        status: 'paid',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record revenue' }, { status: 500 })
    }

    return NextResponse.json({ revenue })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
