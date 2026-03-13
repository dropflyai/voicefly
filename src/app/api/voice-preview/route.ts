/**
 * Voice Preview API
 *
 * GET /api/voice-preview?voiceId=xxx
 *
 * Generates a short TTS audio clip via ElevenLabs for voice previewing
 * during onboarding. Uses the flash model for low latency.
 * Caches generated audio in-memory to avoid regeneration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit as checkRateLimitUpstash, getClientIp } from '@/lib/rate-limit'

const SAMPLE_TEXT =
  "Hi, thank you for calling! I'm here to help you with anything you need today. How can I assist you?"

// In-memory cache: voiceId -> audio buffer
const audioCache = new Map<string, Buffer>()

export async function GET(request: NextRequest) {
  // Rate limit - expensive API call
  const ip = getClientIp(request.headers)
  const rateLimitResult = await checkRateLimitUpstash(ip, 'strict')
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const voiceId = request.nextUrl.searchParams.get('voiceId')

  if (!voiceId) {
    return NextResponse.json({ error: 'voiceId required' }, { status: 400 })
  }

  // Return cached audio if available
  const cached = audioCache.get(voiceId)
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: SAMPLE_TEXT,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[VoicePreview] ElevenLabs error:', errText)
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Cache for subsequent requests
    audioCache.set(voiceId, audioBuffer)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    console.error('[VoicePreview] Error:', error)
    return NextResponse.json({ error: 'Failed to generate voice preview' }, { status: 500 })
  }
}
