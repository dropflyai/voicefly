import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAuth } from '@/lib/api-auth'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function validateAdminAccess(request: NextRequest) {
  const result = await validateAuth(request)
  if (!result.success) return result
  if (result.user!.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Forbidden', user: undefined }
  }
  return result
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 })
  }

  const { data: convo, error } = await supabase
    .from('chat_conversations')
    .select('messages, lead_captured, outcome')
    .eq('id', params.id)
    .single()

  if (error || !convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const messages = Array.isArray(convo.messages) ? convo.messages : []
  const transcript = messages
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Visitor' : 'Maya'}: ${m.content}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze this VoiceFly sales chat transcript and extract 1-3 reusable insights for improving Maya's sales responses.

Outcome: ${convo.outcome} (lead_captured: ${convo.lead_captured})

Transcript:
${transcript}

Return a JSON array of insight objects. Each object must have:
- category: "objection" | "question" | "winning_close" | "demo_script"
- situation: one sentence describing when to use this (e.g., "Visitor asks about pricing and seems hesitant")
- winning_response: the exact response text that worked well (or an improved version if the outcome was poor)
- trigger_keywords: array of 2-5 keywords that signal this situation

Only extract insights where Maya's response was notably effective OR where a better response would have helped. Return [] if nothing useful to extract.

Respond with ONLY the JSON array, no other text.`
    }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }

  let insights: unknown[]
  try {
    const cleaned = textBlock.text.replace(/```json\n?|\n?```/g, '').trim()
    insights = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse extraction', raw: textBlock.text }, { status: 500 })
  }

  return NextResponse.json({ insights, conversationId: params.id })
}
