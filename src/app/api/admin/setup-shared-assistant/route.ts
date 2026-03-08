/**
 * Admin Route -- Setup Shared Trial Receptionist Assistant
 *
 * POST /api/admin/setup-shared-assistant
 * Authorization: Bearer {CRON_SECRET}
 *
 * One-time endpoint to create or update the shared VAPI assistant
 * used by all trial businesses. The assistant uses metadata to
 * personalize responses per-business (business name).
 *
 * Returns the assistant ID to store as VAPI_SHARED_ASSISTANT_ID env var.
 */

import { NextRequest, NextResponse } from 'next/server'

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.voiceflyai.com'
const ADMIN_EMAIL = 'escott1188@gmail.com'

const SHARED_ASSISTANT_NAME = 'VoiceFly Trial Receptionist'

// This is a minimal bootstrap prompt. The real per-business, per-role prompt
// is returned dynamically by the webhook's assistant-request handler.
// This fallback only runs if the webhook fails to respond.
const SYSTEM_PROMPT = `You are a friendly, professional receptionist. Greet the caller warmly, ask how you can help, and take a message if needed. Collect their name, phone number, and reason for calling.`

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth check: CRON_SECRET or admin email via Supabase token
  const auth = request.headers.get('authorization') || ''

  let authorized = false

  // Check CRON_SECRET
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) {
    authorized = true
  }

  // Check for admin email via internal secret
  const internalSecret = process.env.INTERNAL_API_SECRET
  if (internalSecret && auth === `Bearer ${internalSecret}`) {
    authorized = true
  }

  // Fallback: check Supabase auth for admin email
  if (!authorized) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const token = auth.replace('Bearer ', '')
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user?.email === ADMIN_EMAIL) {
          authorized = true
        }
      }
    } catch {
      // Auth check failed, continue to rejection
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!VAPI_API_KEY) {
    return NextResponse.json({ error: 'VAPI_API_KEY not configured' }, { status: 500 })
  }

  try {
    // Check if we already have a shared assistant ID in env
    const existingId = process.env.VAPI_SHARED_ASSISTANT_ID

    // If we have an existing ID, try to update it
    if (existingId) {
      const updateResponse = await fetch(`https://api.vapi.ai/assistant/${existingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildAssistantPayload()),
      })

      if (updateResponse.ok) {
        const data = await updateResponse.json()
        return NextResponse.json({
          success: true,
          action: 'updated',
          assistantId: data.id,
          message: 'Shared trial assistant updated successfully',
        })
      }

      // If update fails (404 etc), fall through to create
      console.warn('[SetupSharedAssistant] Update failed, creating new assistant')
    }

    // Create new assistant
    const createResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildAssistantPayload()),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('[SetupSharedAssistant] VAPI create failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create VAPI assistant', details: errorText },
        { status: 500 }
      )
    }

    const data = await createResponse.json()

    return NextResponse.json({
      success: true,
      action: 'created',
      assistantId: data.id,
      message: `Shared trial assistant created. Set VAPI_SHARED_ASSISTANT_ID=${data.id} in your environment variables.`,
    })
  } catch (error: any) {
    console.error('[SetupSharedAssistant] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function buildAssistantPayload() {
  return {
    name: SHARED_ASSISTANT_NAME,
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'takeMessage',
            description: 'Record a message from the caller with their contact info and reason for calling',
            parameters: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'The caller\'s full name',
                },
                phone: {
                  type: 'string',
                  description: 'The caller\'s phone number for callback',
                },
                reason: {
                  type: 'string',
                  description: 'The reason for the call or message content',
                },
                urgency: {
                  type: 'string',
                  enum: ['low', 'normal', 'high', 'urgent'],
                  description: 'How urgent the caller considers their request',
                },
              },
              required: ['name', 'phone', 'reason', 'urgency'],
            },
          },
        },
      ],
    },
    voice: {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ', // Angie — reassuring, calm, professional
      model: 'eleven_flash_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0,
      useSpeakerBoost: true,
      speed: 1.0,
    },
    firstMessage: 'Hello, thank you for calling! How can I help you today?',
    serverUrl: `${WEBHOOK_BASE_URL}/api/webhooks/phone-employee`,
    metadata: {
      agentType: 'shared-trial',
      createdBy: 'setup-shared-assistant',
      version: '1.0',
    },
  }
}
