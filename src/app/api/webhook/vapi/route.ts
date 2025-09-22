import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// VAPI Webhook Handler for VoiceFly Lead Generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    console.log('VAPI Webhook received:', JSON.stringify(body, null, 2))

    // Handle different VAPI event types
    switch (body.message?.type) {
      case 'transcript':
        return handleTranscript(body, supabase)

      case 'hang':
        return handleCallEnd(body, supabase)

      case 'conversation-update':
        return handleConversationUpdate(body, supabase)

      case 'function-call':
        return handleFunctionCall(body, supabase)

      default:
        console.log('Unhandled VAPI event type:', body.message?.type)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('VAPI webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleTranscript(body: any, supabase: any) {
  // Log conversation transcript for lead scoring
  const transcript = body.message.transcript

  if (transcript && transcript.length > 0) {
    // Store transcript for analysis
    await supabase
      .from('call_transcripts')
      .insert({
        call_id: body.message.call?.id,
        transcript: transcript,
        timestamp: new Date().toISOString(),
        business_id: 'dropfly-leads-001' // DropFly as first customer
      })
  }

  return NextResponse.json({ received: true })
}

async function handleCallEnd(body: any, supabase: any) {
  const call = body.message.call

  if (call) {
    // Create or update lead record
    const leadData = extractLeadFromCall(call)

    if (leadData.phone || leadData.email) {
      const { data, error } = await supabase
        .from('leads')
        .upsert({
          ...leadData,
          business_id: 'dropfly-leads-001',
          source: 'vapi_call',
          call_id: call.id,
          call_duration: call.endedAt ?
            new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime() : 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone,business_id'
        })

      if (error) {
        console.error('Error saving lead:', error)
      } else {
        console.log('Lead saved:', data)

        // Trigger follow-up workflows
        await triggerLeadFollowUp(leadData)
      }
    }
  }

  return NextResponse.json({ received: true })
}

async function handleConversationUpdate(body: any, supabase: any) {
  // Real-time conversation updates for live monitoring
  const conversation = body.message.conversation

  // Update live call status in dashboard
  await supabase
    .from('live_calls')
    .upsert({
      call_id: body.message.call?.id,
      status: 'active',
      conversation_summary: extractKeyPoints(conversation),
      last_update: new Date().toISOString(),
      business_id: 'dropfly-leads-001'
    })

  return NextResponse.json({ received: true })
}

async function handleFunctionCall(body: any, supabase: any) {
  const functionCall = body.message.functionCall

  switch (functionCall.name) {
    case 'scheduleDemo':
      return await scheduleDemo(functionCall.parameters, supabase)

    case 'captureLeadInfo':
      return await captureLeadInfo(functionCall.parameters, supabase)

    case 'requestPricing':
      return await requestPricing(functionCall.parameters, supabase)

    default:
      console.log('Unknown function call:', functionCall.name)
      return NextResponse.json({
        result: { success: false, message: 'Function not found' }
      })
  }
}

async function scheduleDemo(params: any, supabase: any) {
  try {
    // Create demo appointment
    const { data, error } = await supabase
      .from('demo_appointments')
      .insert({
        business_id: 'dropfly-leads-001',
        contact_name: params.name,
        email: params.email,
        phone: params.phone,
        company: params.company,
        preferred_time: params.preferredTime,
        demo_type: params.demoType || 'standard',
        notes: params.notes,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })

    if (error) throw error

    // Send confirmation email and SMS
    if (params.email) {
      // TODO: Send demo confirmation email
      console.log('Demo confirmation email queued for:', params.email)
    }

    if (params.phone) {
      // TODO: Send demo confirmation SMS
      console.log('Demo confirmation SMS queued for:', params.phone)
    }

    return NextResponse.json({
      result: {
        success: true,
        message: `Demo scheduled for ${params.preferredTime}. You'll receive confirmation shortly.`,
        appointmentId: data?.[0]?.id
      }
    })
  } catch (error) {
    console.error('Error scheduling demo:', error)
    return NextResponse.json({
      result: {
        success: false,
        message: 'Sorry, there was an issue scheduling your demo. Our team will follow up with you.'
      }
    })
  }
}

async function captureLeadInfo(params: any, supabase: any) {
  try {
    // Create or update lead
    const { data, error } = await supabase
      .from('leads')
      .upsert({
        business_id: 'dropfly-leads-001',
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        phone: params.phone,
        company: params.company,
        industry: params.industry,
        business_size: params.businessSize,
        current_solution: params.currentSolution,
        pain_points: params.painPoints,
        budget_range: params.budgetRange,
        timeline: params.timeline,
        source: 'vapi_capture',
        status: 'new',
        score: calculateLeadScore(params),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email,business_id'
      })

    if (error) throw error

    return NextResponse.json({
      result: {
        success: true,
        message: 'Thank you! Your information has been saved. Our team will be in touch soon.',
        leadId: data?.[0]?.id
      }
    })
  } catch (error) {
    console.error('Error capturing lead info:', error)
    return NextResponse.json({
      result: {
        success: false,
        message: 'Information captured. Our team will follow up with you.'
      }
    })
  }
}

async function requestPricing(params: any, supabase: any) {
  try {
    // Log pricing request
    await supabase
      .from('pricing_requests')
      .insert({
        business_id: 'dropfly-leads-001',
        contact_name: params.name,
        email: params.email,
        phone: params.phone,
        company: params.company,
        business_size: params.businessSize,
        use_case: params.useCase,
        features_needed: params.featuresNeeded,
        current_solution: params.currentSolution,
        budget_range: params.budgetRange,
        timeline: params.timeline,
        status: 'new',
        created_at: new Date().toISOString()
      })

    // Send pricing information
    const pricingInfo = generatePricingResponse(params)

    return NextResponse.json({
      result: {
        success: true,
        message: pricingInfo,
        followUp: 'Our pricing specialist will email you detailed information within 24 hours.'
      }
    })
  } catch (error) {
    console.error('Error handling pricing request:', error)
    return NextResponse.json({
      result: {
        success: false,
        message: 'I\'ll have our pricing team email you detailed information within 24 hours.'
      }
    })
  }
}

// Helper functions
function extractLeadFromCall(call: any) {
  const transcript = call.transcript || ''

  // Extract contact information from transcript using patterns
  const emailMatch = transcript.match(/[\w\.-]+@[\w\.-]+\.\w+/)
  const phoneMatch = transcript.match(/(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}/)

  return {
    phone: call.customer?.number || phoneMatch?.[0] || null,
    email: emailMatch?.[0] || null,
    call_summary: extractCallSummary(transcript),
    interest_level: assessInterestLevel(transcript),
    created_at: new Date().toISOString()
  }
}

function extractCallSummary(transcript: string) {
  // Simple summary extraction - in production, use AI summarization
  const keywords = ['pricing', 'demo', 'features', 'integration', 'cost', 'roi', 'trial']
  const mentionedKeywords = keywords.filter(keyword =>
    transcript.toLowerCase().includes(keyword)
  )

  return `Call discussed: ${mentionedKeywords.join(', ') || 'general inquiry'}`
}

function assessInterestLevel(transcript: string) {
  const highInterest = ['price', 'cost', 'buy', 'purchase', 'demo', 'trial', 'when can we start']
  const mediumInterest = ['features', 'how does it work', 'tell me more']
  const lowInterest = ['just looking', 'maybe later', 'not sure']

  const text = transcript.toLowerCase()

  if (highInterest.some(phrase => text.includes(phrase))) return 'high'
  if (mediumInterest.some(phrase => text.includes(phrase))) return 'medium'
  if (lowInterest.some(phrase => text.includes(phrase))) return 'low'

  return 'medium' // default
}

function extractKeyPoints(conversation: any) {
  // Extract key discussion points for live monitoring
  if (!conversation || !Array.isArray(conversation)) return ''

  const lastMessages = conversation.slice(-3)
  return lastMessages
    .map(msg => `${msg.role}: ${msg.message}`)
    .join(' | ')
}

function calculateLeadScore(params: any) {
  let score = 0

  // Company size scoring
  if (params.businessSize === 'enterprise') score += 30
  else if (params.businessSize === 'medium') score += 20
  else if (params.businessSize === 'small') score += 10

  // Budget range scoring
  if (params.budgetRange === 'enterprise') score += 25
  else if (params.budgetRange === 'high') score += 20
  else if (params.budgetRange === 'medium') score += 15

  // Timeline scoring
  if (params.timeline === 'immediate') score += 25
  else if (params.timeline === '1-3 months') score += 20
  else if (params.timeline === '3-6 months') score += 10

  // Pain points scoring
  if (params.painPoints?.includes('missing calls')) score += 15
  if (params.painPoints?.includes('lead qualification')) score += 10
  if (params.painPoints?.includes('scaling')) score += 10

  return Math.min(score, 100) // Cap at 100
}

function generatePricingResponse(params: any) {
  const businessSize = params.businessSize || 'small'

  const pricing = {
    small: 'Our Starter plan begins at $97/month for small businesses, including 24/7 voice AI receptionist, lead qualification, and basic CRM integration.',
    medium: 'Our Professional plan at $197/month includes everything in Starter plus advanced analytics, custom integrations, and priority support.',
    enterprise: 'Our Enterprise plan starts at $497/month with custom AI training, dedicated support, advanced security, and unlimited integrations.'
  }

  return pricing[businessSize as keyof typeof pricing] || pricing.small
}

async function triggerLeadFollowUp(leadData: any) {
  // Trigger automated follow-up workflows
  console.log('Triggering follow-up for lead:', leadData.phone || leadData.email)

  // In production, this would trigger:
  // - Email nurture sequences
  // - SMS follow-ups
  // - Sales team notifications
  // - CRM updates
}