/**
 * Widget Voice Escalation Endpoint
 *
 * Triggers a VAPI outbound call from the phone employee to the visitor's
 * phone number. Only available for employees on Pro+ plans with
 * voiceEscalationEnabled in their widget config.
 *
 * POST /api/widget/escalate
 * Body: { token, visitorPhone, visitorName? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, visitorPhone, visitorName } = body

  if (!token || !visitorPhone) {
    return NextResponse.json({ error: 'token and visitorPhone are required' }, { status: 400 })
  }

  // Validate phone number format loosely
  const cleanPhone = visitorPhone.replace(/\s/g, '')
  if (!/^\+?[1-9]\d{7,14}$/.test(cleanPhone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // Look up employee and check tier
  const { data: employee } = await supabase
    .from('phone_employees')
    .select(`
      id,
      name,
      vapi_assistant_id,
      phone_number,
      widget_config,
      businesses (
        subscription_tier
      )
    `)
    .eq('widget_token', token)
    .eq('is_active', true)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

  const business: any = Array.isArray(employee.businesses)
    ? employee.businesses[0]
    : employee.businesses
  const tier: string = business?.subscription_tier ?? 'starter'
  const isProPlus = tier === 'pro' || tier === 'professional'

  if (!isProPlus) {
    return NextResponse.json({ error: 'Voice escalation requires Pro plan' }, { status: 403 })
  }

  const widgetConfig: any = employee.widget_config ?? {}
  if (!widgetConfig.voiceEscalationEnabled) {
    return NextResponse.json({ error: 'Voice escalation is disabled for this widget' }, { status: 403 })
  }

  if (!employee.vapi_assistant_id) {
    return NextResponse.json({ error: 'Employee has no voice assistant configured' }, { status: 422 })
  }

  // Initiate outbound call via VAPI
  const callPayload: any = {
    assistantId: employee.vapi_assistant_id,
    customer: {
      number: cleanPhone.startsWith('+') ? cleanPhone : `+1${cleanPhone}`,
      ...(visitorName ? { name: visitorName } : {}),
    },
    assistantOverrides: {
      firstMessage: `Hi${visitorName ? `, ${visitorName}` : ''}! You requested a callback through our website chat. How can I help you today?`,
    },
  }

  // Use phone number as the calling line if employee has one
  if (employee.phone_number) {
    callPayload.phoneNumberId = undefined // VAPI looks up by number when phoneNumber is set
    callPayload.phoneNumber = { number: employee.phone_number }
  }

  try {
    const vapiRes = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    })

    if (!vapiRes.ok) {
      const detail = await vapiRes.text()
      console.error('[Widget Escalate] VAPI error:', detail)
      return NextResponse.json({ error: 'Failed to initiate call' }, { status: 502 })
    }

    const callData = await vapiRes.json()

    return NextResponse.json({
      success: true,
      callId: callData.id,
      message: 'Calling you now — please keep your phone nearby!',
    })
  } catch (err) {
    console.error('[Widget Escalate] fetch error:', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
