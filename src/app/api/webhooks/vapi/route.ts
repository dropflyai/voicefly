import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface VAPIWebhookPayload {
  event: 'call-started' | 'call-ended' | 'transcript' | 'function-call'
  call: {
    id: string
    status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed'
    started_at?: string
    ended_at?: string
    duration?: number
  }
  transcript?: {
    text: string
    user?: string
    assistant?: string
  }
  recording_url?: string
}

export async function POST(request: NextRequest) {
  try {
    const payload: VAPIWebhookPayload = await request.json()

    console.log('VAPI Webhook received:', payload.event, payload.call.id)

    // Find the voice call record by VAPI call ID
    const { data: voiceCall, error: findError } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('vapi_call_id', payload.call.id)
      .single()

    if (findError) {
      console.error('Voice call not found:', findError)
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Update call based on webhook event
    let updateData: any = {}

    switch (payload.event) {
      case 'call-started':
        updateData = {
          status: 'calling',
          updated_at: new Date().toISOString()
        }
        break

      case 'call-ended':
        updateData = {
          status: payload.call.status === 'completed' ? 'completed' : 'failed',
          duration: payload.call.duration,
          recording_url: payload.recording_url,
          updated_at: new Date().toISOString()
        }

        // Update campaign stats
        await updateCampaignStats(voiceCall.campaign_id)
        break

      case 'transcript':
        // Append transcript data
        const existingTranscript = voiceCall.transcript || ''
        const newTranscript = `${existingTranscript}\n${payload.transcript?.user || 'Assistant'}: ${payload.transcript?.text}`

        updateData = {
          transcript: newTranscript,
          updated_at: new Date().toISOString()
        }
        break

      default:
        console.log('Unhandled webhook event:', payload.event)
        return NextResponse.json({ message: 'Event received' })
    }

    // Update the voice call record
    const { error: updateError } = await supabase
      .from('voice_calls')
      .update(updateData)
      .eq('id', voiceCall.id)

    if (updateError) {
      console.error('Error updating voice call:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateCampaignStats(campaignId: string) {
  try {
    // Get campaign stats
    const { data: calls } = await supabase
      .from('voice_calls')
      .select('status, outcome')
      .eq('campaign_id', campaignId)

    if (!calls) return

    const completedCalls = calls.filter(call => call.status === 'completed').length
    const successfulCalls = calls.filter(call => call.outcome === 'qualified').length
    const successRate = completedCalls > 0 ? (successfulCalls / completedCalls) * 100 : 0

    // Update campaign
    await supabase
      .from('voice_campaigns')
      .update({
        completed_calls: completedCalls,
        success_rate: Math.round(successRate * 100) / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

  } catch (error) {
    console.error('Error updating campaign stats:', error)
  }
}