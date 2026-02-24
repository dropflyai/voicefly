import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { insights, conversation_ids } = body

  if (!Array.isArray(insights) || insights.length === 0) {
    return NextResponse.json({ error: 'insights array required' }, { status: 400 })
  }

  // Insert suggested insights for admin review (inactive until approved)
  const rows = insights.map((insight: {
    category: string
    situation: string
    winning_response: string
    trigger_keywords?: string[]
    source_conversation_id?: string
  }) => ({
    category: insight.category || 'question',
    situation: insight.situation,
    winning_response: insight.winning_response,
    trigger_keywords: insight.trigger_keywords || [],
    effectiveness_score: 3,
    is_active: false,
    source: 'suggested',
    source_conversation_id: insight.source_conversation_id || null,
  }))

  const { error: insertError } = await supabase.from('maya_insights').insert(rows)
  if (insertError) {
    console.error('[n8n-insights] Insert error:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Mark conversations as insights_extracted
  if (Array.isArray(conversation_ids) && conversation_ids.length > 0) {
    await supabase
      .from('chat_conversations')
      .update({ insights_extracted: true })
      .in('id', conversation_ids)
  }

  return NextResponse.json({ success: true, inserted: rows.length })
}
