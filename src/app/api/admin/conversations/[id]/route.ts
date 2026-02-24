import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function validateAdminAccess(request: NextRequest) {
  const result = await validateAuth(request)
  if (!result.success) return result
  if (result.user!.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Forbidden', user: undefined }
  }
  return result
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ conversation: data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const body = await request.json()
  const allowed = ['outcome', 'insights_extracted', 'lead_captured', 'visitor_business_type', 'visitor_employee_interest']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  // Support lookup by session_id OR uuid id
  const isUUID = /^[0-9a-f-]{36}$/i.test(params.id)
  const query = supabase.from('chat_conversations').update(updates)
  const { data, error } = await (isUUID ? query.eq('id', params.id) : query.eq('session_id', params.id)).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversation: data })
}
