/**
 * Text-to-Speech API
 * POST /api/tts
 *
 * Converts text to speech using ElevenLabs API
 */

import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = 'aVR2rUXJY4MTezzJjPyQ' // Angie - Reassuring, Calm and Clear

interface TTSRequest {
  text: string
}

export async function POST(request: NextRequest) {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    const { text }: TTSRequest = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Clean text for TTS (remove markdown, special chars)
    const cleanText = text
      .replace(/\[SUGGEST_TRIAL\]/g, '')
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')   // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/•/g, '')    // Remove bullets
      .trim()

    if (cleanText.length === 0) {
      return NextResponse.json(
        { error: 'No valid text to convert' },
        { status: 400 }
      )
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[TTS] ElevenLabs API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      )
    }

    // Stream audio back to client
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[TTS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
