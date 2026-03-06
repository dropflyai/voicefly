/**
 * AI Training Parser API
 *
 * POST /api/ai/parse-training
 *
 * Accepts natural language instructions from the user and parses them
 * into structured config changes (FAQs, rules, services, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { message, jobType, currentConfig } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const systemPrompt = `You are a configuration parser for an AI phone employee system. The user is training their AI phone receptionist/assistant by describing how they want it to behave.

Your job: parse the user's natural language into structured configuration changes.

The employee is a "${jobType || 'receptionist'}" type.

Current configuration summary:
- Business description: ${currentConfig?.businessDescription || 'Not set'}
- Custom instructions: ${currentConfig?.customInstructions || 'None'}
- Call handling rules: ${currentConfig?.callHandlingRules || 'None'}
- Restrictions: ${currentConfig?.restrictions || 'None'}
- FAQs: ${currentConfig?.faqs?.length || 0} existing
- Services: ${currentConfig?.services?.length || 0} existing
- Transfer rules: ${currentConfig?.transferRules?.length || 0} existing

Available change types:
1. "faq" - Add a Q&A pair. Data: { question, answer, keywords[] }
2. "service" - Add a service. Data: { name, duration (minutes), description? }
3. "transferRule" - Add a routing rule. Data: { keywords[], destination: "manager"|"sales"|"support"|"specific_person", personName? }
4. "customInstructions" - Set/append business context. Data: { text }
5. "callHandlingRules" - Set/append call handling instructions. Data: { text }
6. "restriction" - Add a rule/restriction. Data: { text }
7. "greeting" - Update the greeting. Data: { text }
8. "businessDescription" - Update business description. Data: { text }

Rules:
- Extract ALL distinct changes from the user's message
- For FAQs: infer the question callers would ask and write a natural answer
- For restrictions: phrase as clear rules the AI must follow
- For services: estimate duration if not specified (default 30 min)
- If the user mentions multiple things, create multiple changes
- Keep answers/descriptions concise and professional
- action should be "add" for new items, "set" for replacing fields, "append" for adding to existing text

Respond with valid JSON only. No markdown, no explanation. Format:
{
  "changes": [{ "type": "...", "action": "add|set|append", "data": {...} }],
  "summary": "Brief 1-sentence summary of what you'll add/change"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
      system: systemPrompt,
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''

    // Parse the JSON response
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Try extracting JSON from potential markdown wrapper
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({
          changes: [],
          summary: "I couldn't parse that. Try being more specific — for example: 'We offer teeth whitening for $199' or 'Never quote prices over the phone'.",
        })
      }
    }

    return NextResponse.json({
      changes: parsed.changes || [],
      summary: parsed.summary || 'Changes parsed successfully',
    })
  } catch (error: any) {
    console.error('[ParseTraining] AI error:', error)
    return NextResponse.json({ error: 'Failed to process training input' }, { status: 500 })
  }
}
