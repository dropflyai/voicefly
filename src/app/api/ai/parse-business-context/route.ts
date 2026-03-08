/**
 * Parse Business Context API
 *
 * POST /api/ai/parse-business-context
 *
 * Accepts pasted text OR a website URL and uses Claude to extract
 * structured business context fields for the AI Knowledge settings.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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
  const { text, url } = body

  if (!text?.trim() && !url?.trim()) {
    return NextResponse.json({ error: 'Provide either text or a URL' }, { status: 400 })
  }

  let contentToAnalyze = ''

  // If URL provided, fetch the page content
  if (url?.trim()) {
    try {
      const res = await fetch(url.trim(), {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 422 })
      }
      const html = await res.text()
      contentToAnalyze = stripHtml(html).slice(0, 10000)
    } catch {
      return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 422 })
    }
  } else {
    contentToAnalyze = text.trim().slice(0, 10000)
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  const systemPrompt = `You extract business information from text to populate an AI phone receptionist's knowledge base.

Given the text, extract these fields. Return ONLY the fields you can confidently find. Omit fields where the information isn't present.

Fields to extract:
- owner_name: The owner or manager's name
- address_display: The business address, written naturally for speaking aloud (e.g. "123 Main Street, downtown Los Angeles")
- hours_summary: Business hours in natural language (e.g. "Monday through Friday 9am to 5pm, Saturday 10am to 2pm, closed Sunday")
- payment_methods: Accepted payment methods (e.g. "Cash, all major credit cards, Apple Pay")
- parking_info: Parking or directions info
- languages: Languages spoken (e.g. "English, Spanish, Vietnamese")
- policies: Business policies — cancellation, refund, walk-in, booking policies, etc.
- special_notes: Any other notable info — current promotions, temporary closures, special instructions

Return valid JSON only. No markdown, no explanation. Example:
{
  "owner_name": "Dr. Sarah Johnson",
  "address_display": "456 Oak Avenue, Suite 200, Beverly Hills",
  "hours_summary": "Monday through Friday 9am to 6pm, Saturday 10am to 3pm, closed Sunday",
  "payment_methods": "Cash, Visa, Mastercard, Apple Pay",
  "parking_info": "Free parking in rear lot",
  "languages": "English, Spanish",
  "policies": "24-hour cancellation policy. Walk-ins welcome but appointments preferred.",
  "special_notes": "20% off all services this month"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: contentToAnalyze }],
      system: systemPrompt,
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : ''

    let parsed: Record<string, string>
    try {
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      parsed = JSON.parse(jsonText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({
          error: 'Could not extract business information from that content. Try adding more details.',
        }, { status: 422 })
      }
    }

    // Only return valid field keys
    const validKeys = ['owner_name', 'address_display', 'hours_summary', 'payment_methods', 'parking_info', 'languages', 'policies', 'special_notes']
    const filtered: Record<string, string> = {}
    for (const key of validKeys) {
      if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim()) {
        filtered[key] = parsed[key].trim()
      }
    }

    return NextResponse.json({ success: true, context: filtered })
  } catch (error: any) {
    console.error('[ParseBusinessContext] AI error:', error)
    return NextResponse.json({ error: 'Failed to process content' }, { status: 500 })
  }
}
