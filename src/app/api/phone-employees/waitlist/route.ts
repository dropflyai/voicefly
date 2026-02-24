import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/phone-employees/waitlist?businessId=xxx&status=waiting
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')
  const status = url.searchParams.get('status') || 'waiting'

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data, error } = await supabase
    .from('waitlist_entries')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', status)
    .order('added_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: data || [] })
}

// PATCH /api/phone-employees/waitlist/[id] lives in [id]/route.ts
// This route handles seating or removing from waitlist
// PATCH /api/phone-employees/waitlist?id=xxx&businessId=xxx
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, businessId, status, estimated_wait_minutes } = body

  if (!id || !businessId) {
    return NextResponse.json({ error: 'id and businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const patch: Record<string, any> = {}
  if (status) patch.status = status
  if (status === 'seated') patch.seated_at = new Date().toISOString()
  if (estimated_wait_minutes !== undefined) patch.estimated_wait_minutes = estimated_wait_minutes

  const { data, error } = await supabase
    .from('waitlist_entries')
    .update(patch)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entry: data })
}
