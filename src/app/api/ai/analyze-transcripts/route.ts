/**
 * AI Transcript Analysis API
 *
 * POST /api/ai/analyze-transcripts
 *
 * Analyzes call transcripts for a business and returns suggested
 * configuration changes (FAQs, services, transfer rules, etc.)
 * compatible with the TrainingChange interface in the employee edit page.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_TRANSCRIPT_LENGTH = 2000
const MAX_TRANSCRIPTS = 50

export async function POST(request: NextRequest) {
  // Parse body first to get businessId for auth
  let body: { businessId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { businessId } = body
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  // Auth: validate business access
  const authResult = await validateBusinessAccess(request, businessId)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 })
  }

  // Check for Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  try {
    // Fetch recent call transcripts for this business
    const { data: calls, error: dbError } = await supabaseAdmin
      .from('employee_calls')
      .select('id, transcript, summary, customer_phone, duration, direction, created_at')
      .eq('business_id', businessId)
      .not('transcript', 'is', null)
      .neq('transcript', '')
      .order('created_at', { ascending: false })
      .limit(MAX_TRANSCRIPTS)

    if (dbError) {
      console.error('[AnalyzeTranscripts] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch call transcripts' }, { status: 500 })
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        suggestions: [],
        summary: 'No call transcripts found to analyze.',
        insights: {
          totalCallsAnalyzed: 0,
          topTopics: [],
          commonQuestions: [],
        },
      })
    }

    // Prepare truncated transcripts for the prompt
    const transcriptEntries = calls.map((call, index) => {
      const truncated = call.transcript.length > MAX_TRANSCRIPT_LENGTH
        ? call.transcript.slice(0, MAX_TRANSCRIPT_LENGTH) + '...[truncated]'
        : call.transcript
      const meta = [
        call.direction || 'inbound',
        call.duration ? `${Math.round(call.duration / 60)}min` : '',
        call.created_at ? new Date(call.created_at).toLocaleDateString() : '',
      ].filter(Boolean).join(', ')
      return `--- Call ${index + 1} (${meta}) ---\n${truncated}`
    })

    const systemPrompt = `You are analyzing call transcripts for a business that uses an AI phone employee system. Your goal is to extract actionable configuration suggestions that will improve the AI phone employee's performance.

Analyze the transcripts and extract:

1. FAQs - Common questions callers ask, with suggested answers based on how they were handled in the transcripts
2. Services - Services mentioned or requested by callers
3. Transfer Rules - People or departments callers ask to be connected to
4. Business Context - Key information about the business that the AI should know
5. Restrictions - Things the business should NOT do or say (based on patterns or explicit mentions)
6. Greeting Suggestions - Better greetings based on how calls typically start
7. Call Handling Rules - Patterns in how calls should be handled

Rules:
- Only suggest things with clear evidence from the transcripts
- For FAQs: write the question as a caller would ask it, and write a professional answer
- For services: estimate duration if mentioned, otherwise use 60 min default
- For transfer rules: include keywords callers use when asking for that person/dept
- For restrictions: phrase as clear rules ("Never quote prices" not "prices were mentioned")
- Set confidence to "high" if evidence appears in 3+ calls, "medium" for 2 calls, "low" for 1 call
- Include brief evidence notes explaining why you suggest each item

Respond with valid JSON only. No markdown, no explanation. Format:
{
  "suggestions": [
    {
      "type": "faq|service|transferRule|customInstructions|callHandlingRules|restriction|greeting|businessDescription",
      "action": "add|set|append",
      "data": { ... },
      "confidence": "high|medium|low",
      "evidence": "Brief note about where this was found"
    }
  ],
  "summary": "A 1-2 sentence summary of your findings",
  "insights": {
    "totalCallsAnalyzed": <number>,
    "topTopics": ["topic1", "topic2", ...],
    "commonQuestions": ["question1", "question2", ...]
  }
}

Data formats per type:
- faq: { "question": "...", "answer": "...", "keywords": ["..."] }
- service: { "name": "...", "duration": 60, "description": "..." }
- transferRule: { "keywords": ["..."], "destination": "manager|sales|support|specific_person", "personName": "..." }
- customInstructions: { "text": "..." }
- callHandlingRules: { "text": "..." }
- restriction: { "text": "..." }
- greeting: { "text": "..." }
- businessDescription: { "text": "..." }`

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here are ${calls.length} recent call transcripts to analyze:\n\n${transcriptEntries.join('\n\n')}`,
        },
      ],
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
        console.error('[AnalyzeTranscripts] Failed to parse AI response:', text.slice(0, 200))
        return NextResponse.json({
          suggestions: [],
          summary: 'Analysis completed but could not parse results. Please try again.',
          insights: {
            totalCallsAnalyzed: calls.length,
            topTopics: [],
            commonQuestions: [],
          },
        })
      }
    }

    return NextResponse.json({
      suggestions: parsed.suggestions || [],
      summary: parsed.summary || `Analyzed ${calls.length} call transcripts.`,
      insights: {
        totalCallsAnalyzed: calls.length,
        topTopics: parsed.insights?.topTopics || [],
        commonQuestions: parsed.insights?.commonQuestions || [],
      },
    })
  } catch (error: any) {
    console.error('[AnalyzeTranscripts] Error:', error)
    return NextResponse.json({ error: 'Failed to analyze transcripts' }, { status: 500 })
  }
}
