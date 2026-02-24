/**
 * Voice Library API
 *
 * Proxies requests to VAPI's voice library endpoint to return ElevenLabs
 * voices available for use with VAPI assistants.
 *
 * Requires a valid Supabase session (Bearer token) — keeps the VAPI key
 * server-side and prevents public scraping of voice IDs.
 *
 * GET /api/voices?search=&gender=male|female&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') ?? ''
  const gender = searchParams.get('gender') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  // Build VAPI query
  const vapiParams = new URLSearchParams({
    provider: '11labs',
    page: String(page),
    limit: String(Math.min(limit, 50)),
  })
  if (search) vapiParams.set('search', search)
  if (gender && gender !== 'all') vapiParams.set('gender', gender)

  try {
    const res = await fetch(`https://api.vapi.ai/voice-library?${vapiParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[Voices API] VAPI error:', text)
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 502 })
    }

    const data = await res.json()

    // Normalize VAPI voice library response
    // VAPI returns { results: [...], metadata: { total, page, limit } }
    // or just an array depending on API version — handle both
    let rawVoices: any[] = []
    let total = 0

    if (Array.isArray(data)) {
      rawVoices = data
      total = data.length
    } else if (Array.isArray(data.results)) {
      rawVoices = data.results
      total = data.metadata?.total ?? data.results.length
    } else if (Array.isArray(data.voices)) {
      rawVoices = data.voices
      total = data.total ?? data.voices.length
    }

    const voices = rawVoices.map((v: any) => ({
      voiceId: v.voiceId ?? v.voice_id ?? v.id,
      name: v.name,
      provider: v.provider ?? '11labs',
      gender: v.gender ?? v.labels?.gender ?? null,
      age: v.age ?? v.labels?.age ?? null,
      accent: v.accent ?? v.labels?.accent ?? null,
      description: v.description ?? v.labels?.description ?? null,
      previewUrl: v.previewUrl ?? v.preview_url ?? null,
    })).filter((v: any) => v.voiceId && v.name)

    return NextResponse.json({
      voices,
      total,
      page,
      hasMore: voices.length === limit && page * limit < total,
    })
  } catch (err) {
    console.error('[Voices API] fetch error:', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
