import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/phone-employees/transfer-contacts/[id]
// Body: { businessId, name?, phone?, role?, department?, keywords?, priority?, notes?, is_active? }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { businessId, ...updates } = body

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const allowed = ['name', 'phone', 'role', 'department', 'keywords', 'priority', 'notes', 'is_active']
  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }

  const { data, error } = await supabase
    .from('transfer_contacts')
    .update(patch)
    .eq('id', params.id)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  return NextResponse.json({ contact: data })
}

// DELETE /api/phone-employees/transfer-contacts/[id]?businessId=xxx
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  const businessId = url.searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const auth = await validateBusinessAccess(request, businessId)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { error } = await supabase
    .from('transfer_contacts')
    .delete()
    .eq('id', params.id)
    .eq('business_id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
