import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function validateAdminAccess(request: NextRequest): Promise<{ success: boolean; error?: string; user?: { email?: string } }> {
  // Allow n8n service-to-service calls via webhook secret
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret && webhookSecret === process.env.N8N_WEBHOOK_SECRET) {
    return { success: true, user: { email: process.env.ADMIN_EMAIL } }
  }

  const result = await validateAuth(request)
  if (!result.success) return result
  if (result.user!.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Forbidden' }
  }
  return result
}

export async function GET(request: NextRequest) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const url = new URL(request.url)
  const outcome = url.searchParams.get('outcome')
  const insightsExtracted = url.searchParams.get('insights_extracted')
  const since = url.searchParams.get('since') // e.g., '24h'
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = supabase
    .from('chat_conversations')
    .select('id, session_id, outcome, lead_captured, exchange_count, visitor_business_type, visitor_employee_interest, insights_extracted, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (outcome) query = query.eq('outcome', outcome)
  if (insightsExtracted !== null) query = query.eq('insights_extracted', insightsExtracted === 'true')
  if (since === '24h') {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', since24h)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversations: data || [], total: count || 0, limit, offset })
}
