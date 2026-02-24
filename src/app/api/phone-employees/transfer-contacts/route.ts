import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/phone-employees/transfer-contacts?businessId=xxx
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data, error } = await supabase
    .from('transfer_contacts')
    .select('*')
    .eq('business_id', businessId)
    .order('priority', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contacts: data || [] })
}

// POST /api/phone-employees/transfer-contacts
// Body: { businessId, name, phone, role?, department?, keywords?, priority?, notes? }
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { businessId, name, phone, role, department, keywords, priority, notes } = body

  if (!businessId || !name || !phone) {
    return NextResponse.json({ error: 'businessId, name, and phone are required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data, error } = await supabase
    .from('transfer_contacts')
    .insert({
      business_id: businessId,
      name,
      phone,
      role: role || null,
      department: department || null,
      keywords: keywords || [],
      priority: priority ?? 1,
      notes: notes || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contact: data })
}
