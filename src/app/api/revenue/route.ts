import { NextRequest, NextResponse } from 'next/server'

// Demo revenue data for development
const generateRevenueData = (businessId: string) => {
  return [
    { month: 'Jan', revenue: 45000, appointments: 120, calls: 350, leads: 78 },
    { month: 'Feb', revenue: 52000, appointments: 142, calls: 420, leads: 89 },
    { month: 'Mar', revenue: 61000, appointments: 168, calls: 485, leads: 102 },
    { month: 'Apr', revenue: 58000, appointments: 155, calls: 462, leads: 94 },
    { month: 'May', revenue: 72000, appointments: 198, calls: 567, leads: 125 },
    { month: 'Jun', revenue: 89000, appointments: 245, calls: 678, leads: 156 },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get('business_id')

    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 })
    }

    // Return demo revenue data for dashboard
    const revenueData = generateRevenueData(business_id)
    return NextResponse.json(revenueData)
  } catch (error) {
    console.error('Revenue API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, revenue_amount, source, appointment_id } = body

    // For development, return demo response
    const revenue = {
      id: `rev_${Date.now()}`,
      business_id,
      amount_cents: revenue_amount * 100,
      source,
      appointment_id,
      created_at: new Date().toISOString()
    }

    return NextResponse.json({ revenue })
  } catch (error) {
    console.error('Revenue tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}