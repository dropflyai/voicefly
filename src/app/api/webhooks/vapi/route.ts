import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { VAPICallData } from '@/lib/agents/call-intelligence'
import { AgentEvent } from '@/lib/agents/types'

/**
 * Multi-tenant VAPI Webhook Handler
 *
 * This endpoint receives all webhook events from VAPI for all businesses.
 * The businessId is identified via:
 * 1. X-Vapi-Secret header (set to businessId during agent/phone provisioning)
 * 2. Assistant metadata.businessId (fallback)
 * 3. Phone number lookup (last resort for inbound calls)
 */

/**
 * Verify VAPI webhook signature using HMAC-SHA256
 * VAPI sends the signature in the 'x-vapi-signature' header
 */
function verifyVapiSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('VAPI webhook signature or secret missing')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Error verifying VAPI signature:', error)
    return false
  }
}

interface VAPIWebhookPayload {
  message: {
    type: 'status-update' | 'transcript' | 'hang' | 'function-call' |
          'conversation-update' | 'end-of-call-report' | 'speech-update' |
          'assistant-request'
    call?: {
      id: string
      orgId?: string
      type?: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall'
      status?: string
      startedAt?: string
      endedAt?: string
      customer?: {
        number?: string
        name?: string
      }
      phoneNumber?: {
        id?: string
        number?: string
      }
      assistant?: {
        id?: string
        name?: string
        metadata?: Record<string, any>
      }
      transcript?: string
      summary?: string
      recordingUrl?: string
      cost?: number
      costBreakdown?: {
        llm?: number
        stt?: number
        tts?: number
        vapi?: number
      }
    }
    transcript?: string | Array<{role: string; message: string}>
    functionCall?: {
      name: string
      parameters: Record<string, any>
    }
    conversation?: Array<{role: string; message: string}>
    statusUpdate?: {
      status: string
      messages?: any[]
    }
    artifact?: {
      transcript?: string
      recordingUrl?: string
      summary?: string
    }
  }
}

/**
 * Extract businessId from the webhook request
 */
async function extractBusinessId(request: NextRequest, payload: VAPIWebhookPayload): Promise<string | null> {
  // Method 1: X-Vapi-Secret header (preferred - set during provisioning)
  const secretHeader = request.headers.get('x-vapi-secret')
  if (secretHeader && !secretHeader.startsWith('shared-')) {
    console.log(`Business ID from X-Vapi-Secret: ${secretHeader}`)
    return secretHeader
  }

  // Method 2: Assistant metadata
  const metadata = payload.message?.call?.assistant?.metadata
  if (metadata?.businessId) {
    console.log(`Business ID from assistant metadata: ${metadata.businessId}`)
    return metadata.businessId
  }

  // Method 3: Phone number lookup for inbound calls
  const phoneNumber = payload.message?.call?.phoneNumber?.number ||
                      payload.message?.call?.phoneNumber?.id
  if (phoneNumber) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single()

    if (business) {
      console.log(`Business ID from phone number lookup: ${business.id}`)
      return business.id
    }
  }

  // Method 4: Phone number ID lookup
  const phoneId = payload.message?.call?.phoneNumber?.id
  if (phoneId) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('vapi_phone_number_id', phoneId)
      .single()

    if (business) {
      console.log(`Business ID from phone ID lookup: ${business.id}`)
      return business.id
    }
  }

  console.warn('Could not determine business ID from webhook')
  return null
}

/**
 * Find or create a voice_ai_calls record for this call
 */
async function findOrCreateCallRecord(
  callId: string,
  businessId: string,
  payload: VAPIWebhookPayload
): Promise<{ id: string; isNew: boolean }> {
  // Try to find existing record
  const { data: existingCall } = await supabase
    .from('voice_ai_calls')
    .select('id')
    .eq('vapi_call_id', callId)
    .single()

  if (existingCall) {
    return { id: existingCall.id, isNew: false }
  }

  // Create new record for inbound call
  const call = payload.message?.call
  const customerNumber = call?.customer?.number || 'unknown'
  const callType = call?.type || 'inboundPhoneCall'

  const { data: newCall, error } = await supabase
    .from('voice_ai_calls')
    .insert({
      business_id: businessId,
      vapi_call_id: callId,
      customer_phone: customerNumber,
      call_type: callType === 'inboundPhoneCall' ? 'inbound' : 'outbound',
      status: 'in-progress',
      started_at: call?.startedAt || new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating call record:', error)
    throw new Error('Failed to create call record')
  }

  console.log(`Created new call record: ${newCall.id} for call ${callId}`)
  return { id: newCall.id, isNew: true }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-vapi-signature')
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET

    // Verify webhook signature (SECURITY CRITICAL)
    // Skip verification only in development if no secret is configured
    if (webhookSecret && webhookSecret !== 'placeholder_vapi_webhook_secret') {
      if (!verifyVapiSignature(rawBody, signature, webhookSecret)) {
        console.error('VAPI webhook signature verification failed')
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
      console.log('✅ VAPI webhook signature verified')
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require signature verification
      console.error('VAPI webhook secret not configured in production')
      return NextResponse.json(
        { error: 'Webhook security not configured' },
        { status: 500 }
      )
    } else {
      console.warn('⚠️ VAPI webhook signature verification skipped (development mode)')
    }

    // Parse the payload
    const payload: VAPIWebhookPayload = JSON.parse(rawBody)
    const eventType = payload.message?.type
    const callId = payload.message?.call?.id

    console.log(`📞 VAPI Webhook: ${eventType} for call ${callId}`)

    // Extract business ID
    const businessId = await extractBusinessId(request, payload)

    if (!businessId) {
      // For shared agents or unknown calls, log but don't fail
      console.warn('No business ID found, event will be logged but not processed')
      return NextResponse.json({
        received: true,
        warning: 'No business ID identified'
      })
    }

    // Handle different event types
    switch (eventType) {
      case 'status-update':
        return await handleStatusUpdate(payload, businessId, callId!)

      case 'transcript':
        return await handleTranscript(payload, businessId, callId!)

      case 'hang':
      case 'end-of-call-report':
        return await handleCallEnd(payload, businessId, callId!)

      case 'conversation-update':
        return await handleConversationUpdate(payload, businessId, callId!)

      case 'function-call':
        return await handleFunctionCall(payload, businessId)

      case 'assistant-request':
        return await handleAssistantRequest(payload, businessId)

      default:
        console.log(`Unhandled event type: ${eventType}`)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('VAPI Webhook Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle call status updates
 */
async function handleStatusUpdate(
  payload: VAPIWebhookPayload,
  businessId: string,
  callId: string
): Promise<NextResponse> {
  const status = payload.message?.statusUpdate?.status

  if (!callId) {
    return NextResponse.json({ received: true })
  }

  try {
    const { id: recordId } = await findOrCreateCallRecord(callId, businessId, payload)

    const statusMap: Record<string, string> = {
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'forwarding': 'forwarding',
      'ended': 'completed'
    }

    await supabase
      .from('voice_ai_calls')
      .update({
        status: statusMap[status || ''] || status,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)

    console.log(`Updated call ${callId} status to: ${status}`)
  } catch (error) {
    console.error('Error handling status update:', error)
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle transcript updates
 */
async function handleTranscript(
  payload: VAPIWebhookPayload,
  businessId: string,
  callId: string
): Promise<NextResponse> {
  if (!callId) {
    return NextResponse.json({ received: true })
  }

  try {
    const { id: recordId } = await findOrCreateCallRecord(callId, businessId, payload)

    const transcript = payload.message?.transcript
    let transcriptText = ''

    if (typeof transcript === 'string') {
      transcriptText = transcript
    } else if (Array.isArray(transcript)) {
      transcriptText = transcript.map(t => `${t.role}: ${t.message}`).join('\n')
    }

    // Get existing transcript and append
    const { data: existingCall } = await supabase
      .from('voice_ai_calls')
      .select('transcript')
      .eq('id', recordId)
      .single()

    const existingTranscript = existingCall?.transcript || ''
    const newTranscript = existingTranscript
      ? `${existingTranscript}\n${transcriptText}`
      : transcriptText

    await supabase
      .from('voice_ai_calls')
      .update({
        transcript: newTranscript,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)

  } catch (error) {
    console.error('Error handling transcript:', error)
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle call end (hang event or end-of-call-report)
 */
async function handleCallEnd(
  payload: VAPIWebhookPayload,
  businessId: string,
  callId: string
): Promise<NextResponse> {
  if (!callId) {
    return NextResponse.json({ received: true })
  }

  try {
    const { id: recordId } = await findOrCreateCallRecord(callId, businessId, payload)
    const call = payload.message?.call

    // Calculate duration
    let duration = 0
    if (call?.startedAt && call?.endedAt) {
      duration = Math.round(
        (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
      )
    }

    // Get final transcript
    const transcript = call?.transcript || payload.message?.artifact?.transcript || ''
    const recordingUrl = call?.recordingUrl || payload.message?.artifact?.recordingUrl || ''
    const summary = call?.summary || payload.message?.artifact?.summary || ''

    // Analyze call outcome
    const outcome = analyzeCallOutcome(transcript, summary)

    await supabase
      .from('voice_ai_calls')
      .update({
        status: 'completed',
        ended_at: call?.endedAt || new Date().toISOString(),
        duration: duration,
        transcript: transcript,
        recording_url: recordingUrl,
        summary: summary,
        outcome: outcome,
        cost: call?.cost,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)

    console.log(`Call ${callId} completed. Duration: ${duration}s, Outcome: ${outcome}`)

    // Update analytics
    await updateCallAnalytics(businessId)

    // Trigger AI agent analysis
    const callAnalysisData: VAPICallData = {
      callId: recordId,
      leadId: undefined, // Would be populated if linked to a lead
      duration: duration,
      transcript: transcript,
      outcome: outcome,
      recordingUrl: recordingUrl,
      startTime: new Date(call?.startedAt || Date.now()),
      endTime: new Date(call?.endedAt || Date.now()),
      metadata: {
        vapiCallId: callId,
        summary: summary,
        cost: call?.cost,
      }
    }

    // Process with Call Intelligence Agent asynchronously
    agentRegistry.processVAPICall(businessId, callAnalysisData)
      .then((result) => {
        if (result?.success) {
          console.log(`✅ Call Intelligence Agent processed call ${callId}`)
          if (result.insights && result.insights.length > 0) {
            console.log(`   Generated ${result.insights.length} insight(s)`)
          }
          if (result.actions && result.actions.length > 0) {
            console.log(`   Queued ${result.actions.length} action(s)`)
          }
        }
      })
      .catch((error) => {
        console.error('Call Intelligence Agent error:', error)
      })

    // Trigger any post-call workflows
    await triggerPostCallWorkflows(businessId, recordId, outcome, callAnalysisData)

  } catch (error) {
    console.error('Error handling call end:', error)
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle conversation updates for live monitoring
 */
async function handleConversationUpdate(
  payload: VAPIWebhookPayload,
  businessId: string,
  callId: string
): Promise<NextResponse> {
  if (!callId) {
    return NextResponse.json({ received: true })
  }

  try {
    const { id: recordId } = await findOrCreateCallRecord(callId, businessId, payload)
    const conversation = payload.message?.conversation

    if (conversation && conversation.length > 0) {
      // Get last few messages for summary
      const recentMessages = conversation.slice(-3)
      const conversationSummary = recentMessages
        .map(m => `${m.role}: ${m.message}`)
        .join(' | ')

      // Update live status
      await supabase
        .from('voice_ai_calls')
        .update({
          last_activity: conversationSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
    }
  } catch (error) {
    console.error('Error handling conversation update:', error)
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle function calls from the AI agent
 */
async function handleFunctionCall(
  payload: VAPIWebhookPayload,
  businessId: string
): Promise<NextResponse> {
  const functionCall = payload.message?.functionCall

  if (!functionCall) {
    return NextResponse.json({ received: true })
  }

  console.log(`Function call: ${functionCall.name}`, functionCall.parameters)

  try {
    switch (functionCall.name) {
      case 'scheduleAppointment':
      case 'bookAppointment':
        return await handleBookAppointment(functionCall.parameters, businessId)

      case 'checkAvailability':
        return await handleCheckAvailability(functionCall.parameters, businessId)

      case 'getBusinessInfo':
        return await handleGetBusinessInfo(businessId)

      case 'captureLeadInfo':
        return await handleCaptureLeadInfo(functionCall.parameters, businessId)

      case 'transferToHuman':
        return await handleTransferToHuman(functionCall.parameters, businessId)

      default:
        console.log(`Unknown function: ${functionCall.name}`)
        return NextResponse.json({
          result: { success: false, message: 'Function not implemented' }
        })
    }
  } catch (error) {
    console.error(`Error handling function ${functionCall.name}:`, error)
    return NextResponse.json({
      result: { success: false, message: 'Function execution failed' }
    })
  }
}

/**
 * Handle assistant request (dynamic assistant selection)
 */
async function handleAssistantRequest(
  payload: VAPIWebhookPayload,
  businessId: string
): Promise<NextResponse> {
  // Get business agent configuration
  const { data: business } = await supabase
    .from('businesses')
    .select('agent_id, maya_job_id, name')
    .eq('id', businessId)
    .single()

  if (business?.agent_id) {
    return NextResponse.json({
      assistantId: business.agent_id
    })
  }

  // Fallback to default assistant
  console.warn(`No agent configured for business ${businessId}`)
  return NextResponse.json({ received: true })
}

// ============ Function Call Handlers ============

async function handleBookAppointment(
  params: Record<string, any>,
  businessId: string
): Promise<NextResponse> {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        customer_name: params.customerName || params.name,
        customer_phone: params.customerPhone || params.phone,
        customer_email: params.customerEmail || params.email,
        service: params.service,
        date: params.date,
        time: params.time,
        notes: params.notes,
        status: 'scheduled',
        source: 'voice_ai',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      result: {
        success: true,
        message: `Your appointment has been scheduled for ${params.date} at ${params.time}. We'll send you a confirmation shortly.`,
        appointmentId: appointment?.id
      }
    })
  } catch (error) {
    console.error('Error booking appointment:', error)
    return NextResponse.json({
      result: {
        success: false,
        message: 'I was unable to complete the booking. Let me transfer you to someone who can help.'
      }
    })
  }
}

async function handleCheckAvailability(
  params: Record<string, any>,
  businessId: string
): Promise<NextResponse> {
  try {
    const requestedDate = params.date || new Date().toISOString().split('T')[0]

    // Get existing appointments for the date
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('time')
      .eq('business_id', businessId)
      .eq('date', requestedDate)
      .neq('status', 'cancelled')

    const bookedTimes = existingAppointments?.map(a => a.time) || []

    // Generate available time slots (business hours)
    const allSlots = [
      '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ]

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot))

    return NextResponse.json({
      result: {
        success: true,
        date: requestedDate,
        availableSlots: availableSlots,
        message: availableSlots.length > 0
          ? `We have ${availableSlots.length} available times on ${requestedDate}: ${availableSlots.slice(0, 3).join(', ')}${availableSlots.length > 3 ? ' and more' : ''}.`
          : `I'm sorry, we're fully booked on ${requestedDate}. Would you like to try another date?`
      }
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json({
      result: {
        success: false,
        message: 'Let me check our availability for you. One moment please.'
      }
    })
  }
}

async function handleGetBusinessInfo(businessId: string): Promise<NextResponse> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('name, business_description, unique_selling_points, phone, email')
      .eq('id', businessId)
      .single()

    if (!business) {
      return NextResponse.json({
        result: { success: false, message: 'Business information not available' }
      })
    }

    return NextResponse.json({
      result: {
        success: true,
        businessName: business.name,
        description: business.business_description,
        specialties: business.unique_selling_points,
        phone: business.phone,
        email: business.email
      }
    })
  } catch (error) {
    console.error('Error getting business info:', error)
    return NextResponse.json({
      result: { success: false, message: 'Unable to retrieve business information' }
    })
  }
}

async function handleCaptureLeadInfo(
  params: Record<string, any>,
  businessId: string
): Promise<NextResponse> {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .upsert({
        business_id: businessId,
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        phone: params.phone,
        company: params.company,
        notes: params.notes,
        source: 'voice_ai',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email,business_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      result: {
        success: true,
        message: 'Thank you! Your information has been saved. Our team will be in touch soon.',
        leadId: lead?.id
      }
    })
  } catch (error) {
    console.error('Error capturing lead:', error)
    return NextResponse.json({
      result: {
        success: true,
        message: 'Thank you for your information. Someone will follow up with you shortly.'
      }
    })
  }
}

async function handleTransferToHuman(
  params: Record<string, any>,
  businessId: string
): Promise<NextResponse> {
  // Log transfer request for monitoring
  console.log(`Transfer requested for business ${businessId}:`, params.reason)

  return NextResponse.json({
    result: {
      success: true,
      transfer: true,
      message: 'Let me connect you with a team member who can assist you further.'
    }
  })
}

// ============ Helper Functions ============

/**
 * Analyze call transcript to determine outcome
 */
function analyzeCallOutcome(transcript: string, summary: string): string {
  const text = (transcript + ' ' + summary).toLowerCase()

  // Check for appointment bookings
  if (text.includes('appointment') && (text.includes('booked') || text.includes('scheduled') || text.includes('confirmed'))) {
    return 'appointment_booked'
  }

  // Check for qualified lead indicators
  if (text.includes('interested') || text.includes('pricing') || text.includes('cost') || text.includes('demo')) {
    return 'qualified'
  }

  // Check for callback requests
  if (text.includes('call back') || text.includes('callback') || text.includes('follow up')) {
    return 'callback_requested'
  }

  // Check for information requests
  if (text.includes('information') || text.includes('details') || text.includes('learn more')) {
    return 'information_provided'
  }

  // Check for voicemail/no answer
  if (text.includes('voicemail') || text.includes('no answer') || text.length < 50) {
    return 'no_answer'
  }

  return 'completed'
}

/**
 * Update business call analytics
 */
async function updateCallAnalytics(businessId: string): Promise<void> {
  try {
    // Get today's calls for this business
    const today = new Date().toISOString().split('T')[0]

    const { data: todayCalls } = await supabase
      .from('voice_ai_calls')
      .select('status, outcome, duration')
      .eq('business_id', businessId)
      .gte('created_at', today)

    if (!todayCalls) return

    const totalCalls = todayCalls.length
    const completedCalls = todayCalls.filter(c => c.status === 'completed').length
    const appointmentsBooked = todayCalls.filter(c => c.outcome === 'appointment_booked').length
    const totalDuration = todayCalls.reduce((sum, c) => sum + (c.duration || 0), 0)
    const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0

    // Update or create daily analytics record
    await supabase
      .from('voice_ai_analytics')
      .upsert({
        business_id: businessId,
        date: today,
        total_calls: totalCalls,
        completed_calls: completedCalls,
        appointments_booked: appointmentsBooked,
        avg_call_duration: avgDuration,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,date'
      })

  } catch (error) {
    console.error('Error updating analytics:', error)
  }
}

/**
 * Trigger post-call workflows (notifications, CRM updates, etc.)
 */
async function triggerPostCallWorkflows(
  businessId: string,
  callRecordId: string,
  outcome: string,
  callData?: VAPICallData
): Promise<void> {
  console.log(`Post-call workflow triggered: ${outcome} for call ${callRecordId}`)

  try {
    // Emit CALL_ENDED event to all subscribed agents
    await agentRegistry.emitEvent(AgentEvent.CALL_ENDED, businessId, {
      callRecordId,
      outcome,
      ...callData,
    })

    // Handle specific outcomes
    switch (outcome) {
      case 'appointment_booked':
        // Emit appointment booked event
        await agentRegistry.emitEvent(AgentEvent.APPOINTMENT_BOOKED, businessId, {
          callRecordId,
          source: 'voice_ai',
        })
        break

      case 'qualified':
        // Emit lead created/updated event
        await agentRegistry.emitEvent(AgentEvent.LEAD_CREATED, businessId, {
          callRecordId,
          quality: 'warm',
          source: 'voice_ai',
        })
        break

      case 'callback_requested':
        // Queue follow-up action
        console.log(`Callback requested for call ${callRecordId}`)
        break
    }
  } catch (error) {
    console.error('Error in post-call workflows:', error)
  }
}
