/**
 * Internal API - Trial Status
 *
 * GET /api/internal/trial-status?businessId=uuid
 * Authorization: Bearer {INTERNAL_API_SECRET}
 *
 * Used by VoiceFly's Trial Converter employee to check a business's
 * trial status and usage metrics mid-call.
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
  if (INTERNAL_API_SECRET && auth !== `Bearer ${INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId query param required' }, { status: 400 })
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, plan_type, subscription_status, trial_ends_at')
    .eq('id', businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const [callsResult, employeesResult] = await Promise.all([
    supabase
      .from('voice_ai_calls')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('phone_employees')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true),
  ])

  const isTrialing = business.subscription_status === 'trial'
  const trialEndsAt = business.trial_ends_at

  let daysRemaining: number | null = null
  if (isTrialing && trialEndsAt) {
    daysRemaining = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
  }

  return NextResponse.json({
    businessName: business.name,
    isTrialing,
    trialEndsAt: trialEndsAt ?? null,
    daysRemaining,
    callsMade: callsResult.count ?? 0,
    employeesActive: employeesResult.count ?? 0,
    planOptions: ['starter', 'professional', 'enterprise'],
  })
}
