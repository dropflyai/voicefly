/**
 * Setup Agent API
 *
 * POST /api/setup-agent
 *   - action: "start" -> starts a new setup session
 *   - action: "chat" -> sends a message to the setup agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { setupAgent } from '@/lib/agents/setup-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, businessId, sessionId, message } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'start') {
      const state = await setupAgent.startSession(businessId)
      return NextResponse.json({
        sessionId: state.sessionId,
        messages: state.messages,
        phase: state.phase,
      })
    }

    if (action === 'chat') {
      if (!sessionId || !message) {
        return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 })
      }

      const state = await setupAgent.chat(sessionId, message)
      return NextResponse.json({
        sessionId: state.sessionId,
        messages: state.messages,
        phase: state.phase,
        collectedData: state.phase === 'complete' ? state.collectedData : undefined,
        error: state.error,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "chat".' }, { status: 400 })
  } catch (err: any) {
    console.error('[SetupAgent API] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
