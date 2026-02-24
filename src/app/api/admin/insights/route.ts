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

export async function GET(request: NextRequest) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const url = new URL(request.url)
  const activeOnly = url.searchParams.get('active') === 'true'

  let query = supabase
    .from('maya_insights')
    .select('*')
    .order('effectiveness_score', { ascending: false })
    .order('times_seen', { ascending: false })

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ insights: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const body = await request.json()
  const { category, situation, winning_response, trigger_keywords, effectiveness_score, source, source_conversation_id } = body

  if (!category || !situation || !winning_response) {
    return NextResponse.json({ error: 'category, situation, winning_response required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('maya_insights').insert({
    category,
    situation,
    winning_response,
    trigger_keywords: trigger_keywords || [],
    effectiveness_score: effectiveness_score || 3,
    source: source || 'manual',
    source_conversation_id: source_conversation_id || null,
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ insight: data })
}
