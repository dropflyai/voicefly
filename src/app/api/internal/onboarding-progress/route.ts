/**
 * Internal API - Onboarding Progress
 *
 * GET /api/internal/onboarding-progress?businessId=uuid
 * Authorization: Bearer {INTERNAL_API_SECRET}
 *
 * Used by VoiceFly's Onboarding Specialist employee to check
 * how far along a new customer is with their setup mid-call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  if (!INTERNAL_API_SECRET || auth !== `Bearer ${INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId query param required' }, { status: 400 })
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, plan_type, created_at')
    .eq('id', businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Parallel data fetches
  const [employeesResult, callsResult, integrationsResult] = await Promise.all([
    supabase
      .from('phone_employees')
      .select('id, is_active, vapi_phone_id')
      .eq('business_id', businessId),
    supabase
      .from('voice_ai_calls')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('business_integrations')
      .select('platform')
      .eq('business_id', businessId)
      .eq('status', 'connected'),
  ])

  const employees = employeesResult.data ?? []
  const employeesCreated = employees.length
  const employeesActive = employees.filter(e => e.is_active).length
  const phoneProvisioned = employees.some(e => e.vapi_phone_id)
  const firstCallMade = (callsResult.count ?? 0) > 0
  const integrationsConnected = (integrationsResult.data ?? []).map(i => i.platform)

  // Calculate days since account creation
  const daysActive = Math.floor(
    (Date.now() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Simple completion percentage
  const steps = [
    employeesCreated > 0,    // Created at least one employee
    phoneProvisioned,         // Provisioned a phone number
    firstCallMade,            // Made at least one call
    integrationsConnected.length > 0, // Connected at least one integration
  ]
  const completionPercent = Math.round((steps.filter(Boolean).length / steps.length) * 100)

  return NextResponse.json({
    businessName: business.name,
    planType: business.plan_type,
    daysActive,
    employeesCreated,
    employeesActive,
    phoneProvisioned,
    firstCallMade,
    integrationsConnected,
    completionPercent,
  })
}
