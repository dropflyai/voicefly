import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/phone-employees/orders?businessId=xxx&status=confirmed&date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')
  const status = url.searchParams.get('status')
  const date = url.searchParams.get('date')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  let query = supabase
    .from('phone_orders')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (status) query = (query as any).eq('status', status)
  if (date) query = (query as any).gte('created_at', date + 'T00:00:00').lte('created_at', date + 'T23:59:59')

  const { data, error } = await (query as any).limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orders: data || [] })
}

// PATCH /api/phone-employees/orders — update order status
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, businessId, status, internal_notes } = body

  if (!id || !businessId) {
    return NextResponse.json({ error: 'id and businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (status) patch.status = status
  if (internal_notes !== undefined) patch.internal_notes = internal_notes

  const { data, error } = await supabase
    .from('phone_orders')
    .update(patch)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ order: data })
}
