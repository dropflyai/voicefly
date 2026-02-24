/**
 * Public Widget Chat Endpoint
 *
 * Handles chat messages from embedded widgets. Receives the widget token,
 * visitor's message history, and optional visitor metadata. Calls Claude
 * using the employee's configured system prompt and returns a text reply.
 *
 * Rate-limited to 30 req/min per IP to prevent abuse.
 *
 * POST /api/widget/chat
 * Body: { token, messages: [{role, content}], visitorId?, metadata? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Simple in-memory rate limiter (resets on cold start — acceptable for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Default system prompt if the employee has none configured
const DEFAULT_SYSTEM_PROMPT = `You are a helpful business assistant. Be friendly, concise, and professional.
Answer questions about the business, help visitors book appointments, and assist with common inquiries.
If asked about something outside your knowledge, politely say you'll have someone follow up.`

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, messages, visitorId, metadata } = body

  if (!token || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'token and messages are required' }, { status: 400 })
  }

  // Look up employee by widget token
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('id, business_id, name, job_type, job_config, widget_config')
    .eq('widget_token', token)
    .eq('is_active', true)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

  // Build system prompt from employee config
  const jobConfig: any = employee.job_config ?? {}
  const systemPrompt: string =
    jobConfig.systemPrompt ||
    jobConfig.instructions ||
    buildDefaultPrompt(employee.name, employee.job_type, jobConfig)

  // Validate message format — only pass role/content pairs
  const cleanMessages = messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20) // Cap history to last 20 messages

  if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: cleanMessages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Log the message to phone_messages for the dashboard (best-effort)
    const lastUserMessage = cleanMessages.findLast((m: any) => m.role === 'user')?.content ?? ''
    void supabase.from('phone_messages').insert({
      business_id: employee.business_id,
      employee_id: employee.id,
      caller_phone: visitorId ? `widget:${visitorId}` : 'widget:anonymous',
      reason: 'Widget Chat',
      full_message: `[VISITOR] ${lastUserMessage}\n[REPLY] ${reply}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[Widget Chat] Claude error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

function buildDefaultPrompt(name: string, jobType: string, jobConfig: any): string {
  const businessName = jobConfig.businessName ?? 'our business'
  const services = jobConfig.services?.join(', ') ?? ''

  return `You are ${name}, an AI assistant for ${businessName}.
Your role: ${jobType}.
${services ? `Services offered: ${services}.` : ''}
Be helpful, friendly, and concise. Keep responses under 3 sentences when possible.
If you cannot answer something, offer to have someone follow up.`
}
