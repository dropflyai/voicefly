/**
 * Widget Session End
 *
 * Called by the widget UI when the visitor closes the chat or the page unloads.
 * Emits CHAT_ENDED which triggers the ChatAgent for analysis.
 *
 * POST /api/widget/session-end
 * Body: { token, sessionId, messages, visitorId, leadInfo?, startedAt }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { AgentEvent } from '@/lib/agents/types'
import type { ChatSessionData } from '@/lib/agents/chat-agent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // silent fail — fire and forget
  }

  const { token, sessionId, messages, visitorId, leadInfo, startedAt } = body

  if (!token || !Array.isArray(messages) || messages.length < 2) {
    return NextResponse.json({ ok: true }) // not worth analyzing very short sessions
  }

  // Look up employee
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('id, business_id')
    .eq('widget_token', token)
    .eq('is_active', true)
    .single()

  if (!employee) {
    return NextResponse.json({ ok: true })
  }

  const sessionData: ChatSessionData = {
    sessionId: sessionId ?? `ws_${Date.now()}`,
    employeeId: employee.id,
    businessId: employee.business_id,
    messages,
    visitorId: visitorId ?? 'anonymous',
    leadInfo: leadInfo ?? {},
    startedAt: startedAt ?? new Date().toISOString(),
    endedAt: new Date().toISOString(),
  }

  // Fire CHAT_ENDED — ChatAgent handles the rest
  agentRegistry.emitEvent(AgentEvent.CHAT_ENDED, employee.business_id, sessionData)
    .catch(err => console.error('[WidgetSessionEnd] CHAT_ENDED emit error:', err))

  return NextResponse.json({ ok: true })
}
