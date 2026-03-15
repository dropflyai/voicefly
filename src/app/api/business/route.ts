import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  // Validate access — JWT required
  const authResult = await validateBusinessAccess(request, businessId)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await serviceClient
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  return NextResponse.json({ business: data })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  const authResult = await validateBusinessAccess(request, businessId)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { updates } = body
  if (!updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'updates object is required' }, { status: 400 })
  }

  // Allowlist: only permit safe fields to be updated
  const ALLOWED_FIELDS = new Set([
    'name', 'business_type', 'phone', 'address', 'website',
    'hours', 'timezone', 'logo_url', 'description',
  ])
  const sanitizedUpdates: Record<string, any> = {}
  for (const key of Object.keys(updates)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitizedUpdates[key] = updates[key]
    }
  }
  if (Object.keys(sanitizedUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await serviceClient
    .from('businesses')
    .update(sanitizedUpdates)
    .eq('id', businessId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
