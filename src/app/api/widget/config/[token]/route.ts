/**
 * Public Widget Config Endpoint
 *
 * Returns the public configuration for a chat widget identified by its token.
 * This endpoint is intentionally public — the token is safe to expose in
 * embed scripts. No secrets are returned.
 *
 * GET /api/widget/config/[token]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Default widget config applied when a field is absent
const WIDGET_DEFAULTS = {
  primaryColor: '#6366f1',
  position: 'bottom-right',
  displayName: null,
  logoUrl: null,
  welcomeMessage: 'Hi! How can I help you today?',
  quickReplies: [],
  autoPopDelay: 0,
  showOnMobile: true,
  leadCapture: false,
  bookingEnabled: false,
  voiceEscalationEnabled: false,
  hideBranding: false,
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const { data: employee, error } = await supabase
    .from('phone_employees')
    .select(`
      id,
      name,
      job_type,
      widget_config,
      business_id,
      businesses (
        name,
        subscription_tier
      )
    `)
    .eq('widget_token', token)
    .eq('is_active', true)
    .single()

  if (error || !employee) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

  const rawConfig: Record<string, any> = employee.widget_config ?? {}
  const business: any = Array.isArray(employee.businesses)
    ? employee.businesses[0]
    : employee.businesses
  const tier: string = business?.subscription_tier ?? 'starter'

  // Merge stored config over defaults
  const config = { ...WIDGET_DEFAULTS, ...rawConfig }

  // Tier gating — override stored values for features above tier
  const isPro = tier === 'pro' || tier === 'professional'

  if (!isPro)          config.bookingEnabled = false
  if (!isPro)          config.voiceEscalationEnabled = false
  // hideBranding is a Pro feature
  if (!isPro)          config.hideBranding = false

  return NextResponse.json({
    token,
    employeeId: employee.id,
    employeeName: employee.name,
    jobType: employee.job_type,
    businessName: business?.name ?? null,
    config,
  })
}
