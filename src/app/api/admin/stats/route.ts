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

  const [
    { count: totalConversations },
    { count: leadsCaptured },
    { data: topInsights },
    { data: recentConversations },
  ] = await Promise.all([
    supabase.from('chat_conversations').select('*', { count: 'exact', head: true }),
    supabase.from('chat_conversations').select('*', { count: 'exact', head: true }).eq('lead_captured', true),
    supabase.from('maya_insights').select('situation, times_seen, times_used, conversion_rate, effectiveness_score').eq('is_active', true).order('times_seen', { ascending: false }).limit(5),
    supabase.from('chat_conversations').select('id, outcome, exchange_count, visitor_business_type, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const leadRate = totalConversations && totalConversations > 0
    ? Math.round(((leadsCaptured || 0) / totalConversations) * 100)
    : 0

  return NextResponse.json({
    totalConversations: totalConversations || 0,
    leadsCaptured: leadsCaptured || 0,
    leadCaptureRate: leadRate,
    topInsights: topInsights || [],
    recentConversations: recentConversations || [],
  })
}
