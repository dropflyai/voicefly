import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateBusinessAccess, validateAuth, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { testCallSchema, validate } from '@/lib/validations'

const VAPI_API_KEY = process.env.VAPI_API_KEY!

/**
 * POST /api/voice-ai/test-call
 * Initiate a test call to the business's AI agent
 *
 * Body:
 * - businessId: string (required)
 * - phoneNumber: string (optional - defaults to business owner's phone)
 * - testType: 'inbound' | 'outbound' (default: 'outbound')
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check - strict tier for expensive AI calls
    const rateLimit = await checkRateLimit(request, 'strict')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    const body = await request.json()

    // Validate input
    const validation = validate(testCallSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { businessId, phoneNumber, testType } = validation.data

    // Validate authentication and business access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    console.log(`📞 Initiating test call for business: ${businessId}`)

    // Get business data including agent and phone configuration
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      console.error('Business not found:', fetchError)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Validate that voice AI is provisioned
    if (!business.agent_id) {
      return NextResponse.json(
        {
          error: 'Voice AI not provisioned',
          message: 'Please complete onboarding to provision your AI agent'
        },
        { status: 400 }
      )
    }

    // Determine the phone number to call
    const targetPhone = phoneNumber || business.phone
    if (!targetPhone) {
      return NextResponse.json(
        {
          error: 'No phone number',
          message: 'Please provide a phone number to receive the test call'
        },
        { status: 400 }
      )
    }

    // Clean the phone number (ensure E.164 format)
    const cleanedPhone = cleanPhoneNumber(targetPhone)
    if (!cleanedPhone) {
      return NextResponse.json(
        {
          error: 'Invalid phone number',
          message: 'Please provide a valid phone number in format: +1XXXXXXXXXX'
        },
        { status: 400 }
      )
    }

    // Create a call record for tracking
    const { data: callRecord, error: callCreateError } = await supabase
      .from('voice_ai_calls')
      .insert({
        business_id: businessId,
        vapi_call_id: `test-${Date.now()}`, // Temporary ID, will be updated
        customer_phone: cleanedPhone,
        call_type: 'outbound',
        status: 'initiating',
        is_test_call: true,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (callCreateError) {
      console.error('Error creating call record:', callCreateError)
      // Continue anyway - call record is for tracking
    }

    // Initiate the call via VAPI
    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: business.agent_id,
        customer: {
          number: cleanedPhone,
          name: business.owner_first_name
            ? `${business.owner_first_name} ${business.owner_last_name || ''}`.trim()
            : 'Test Caller'
        },
        // Optional: Override first message for test calls
        assistantOverrides: {
          firstMessage: `Hello! This is a test call from ${business.name}. I'm Maya, your AI assistant. How can I help you today?`
        }
      })
    })

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text()
      console.error('VAPI call initiation failed:', vapiResponse.status, errorText)

      // Parse the error for better messaging
      let errorMessage = 'Failed to initiate test call'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        // Use default error message
      }

      return NextResponse.json(
        {
          error: 'Call initiation failed',
          message: errorMessage,
          details: errorText
        },
        { status: 500 }
      )
    }

    const vapiData = await vapiResponse.json()
    console.log('Test call initiated:', vapiData)

    // Update the call record with the real VAPI call ID
    if (callRecord?.id && vapiData.id) {
      await supabase
        .from('voice_ai_calls')
        .update({
          vapi_call_id: vapiData.id,
          status: 'ringing',
          updated_at: new Date().toISOString()
        })
        .eq('id', callRecord.id)
    }

    return NextResponse.json({
      success: true,
      message: `Test call initiated to ${cleanedPhone}`,
      callId: vapiData.id,
      recordId: callRecord?.id,
      phoneNumber: cleanedPhone,
      agentName: `Maya for ${business.name}`
    })

  } catch (error) {
    console.error('Test call error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice-ai/test-call?callId=xxx
 * Check status of a test call
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate: require valid Supabase JWT
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    // Get call status from VAPI
    const vapiResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!vapiResponse.ok) {
      // Try to get from local database
      const { data: localCall } = await supabase
        .from('voice_ai_calls')
        .select('*')
        .eq('vapi_call_id', callId)
        .single()

      if (localCall) {
        return NextResponse.json({
          callId: callId,
          status: localCall.status,
          duration: localCall.duration,
          transcript: localCall.transcript,
          source: 'local'
        })
      }

      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    const vapiData = await vapiResponse.json()

    // Map VAPI status to user-friendly status
    const statusMap: Record<string, string> = {
      'queued': 'Queuing...',
      'ringing': 'Ringing...',
      'in-progress': 'In Progress',
      'forwarding': 'Forwarding',
      'ended': 'Completed'
    }

    return NextResponse.json({
      callId: vapiData.id,
      status: statusMap[vapiData.status] || vapiData.status,
      rawStatus: vapiData.status,
      startedAt: vapiData.startedAt,
      endedAt: vapiData.endedAt,
      duration: vapiData.endedAt && vapiData.startedAt
        ? Math.round((new Date(vapiData.endedAt).getTime() - new Date(vapiData.startedAt).getTime()) / 1000)
        : null,
      transcript: vapiData.transcript,
      recordingUrl: vapiData.recordingUrl,
      cost: vapiData.cost,
      source: 'vapi'
    })

  } catch (error) {
    console.error('Get call status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Clean and validate phone number, return E.164 format or null
 */
function cleanPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If it doesn't start with +, assume US number
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present (US country code)
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned
    } else {
      return null // Invalid length
    }
  }

  // Validate E.164 format (+ followed by 10-15 digits)
  const e164Regex = /^\+[1-9]\d{9,14}$/
  if (!e164Regex.test(cleaned)) {
    return null
  }

  return cleaned
}
