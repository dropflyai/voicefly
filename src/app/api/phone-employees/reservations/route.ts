import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/phone-employees/reservations?businessId=xxx&date=YYYY-MM-DD&status=confirmed
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')
  const date = url.searchParams.get('date')
  const status = url.searchParams.get('status')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  let query = supabase
    .from('reservations')
    .select('*')
    .eq('business_id', businessId)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (date) query = (query as any).eq('reservation_date', date)
  if (status) query = (query as any).eq('status', status)
  else query = (query as any).neq('status', 'cancelled')

  const { data, error } = await (query as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reservations: data || [] })
}

// POST /api/phone-employees/reservations
// Body: { businessId, customer_name, customer_phone, party_size, reservation_date, reservation_time, customer_email?, special_requests? }
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { businessId, customer_name, customer_phone, party_size, reservation_date, reservation_time, customer_email, special_requests } = body

  if (!businessId || !customer_name || !customer_phone || !party_size || !reservation_date || !reservation_time) {
    return NextResponse.json({ error: 'businessId, customer_name, customer_phone, party_size, reservation_date, and reservation_time are required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      business_id: businessId,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      party_size,
      reservation_date,
      reservation_time,
      special_requests: special_requests || null,
      status: 'confirmed',
      source: 'dashboard',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reservation: data })
}
