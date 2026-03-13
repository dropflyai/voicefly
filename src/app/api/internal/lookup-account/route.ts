/**
 * Internal API - Lookup Account by Phone
 *
 * GET /api/internal/lookup-account?phone=+15551234567
 * Authorization: Bearer {INTERNAL_API_SECRET}
 *
 * Used by VoiceFly's own inbound Sales Rep employee to check
 * if a caller is already a VoiceFly customer mid-call.
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

  const phone = request.nextUrl.searchParams.get('phone')
  if (!phone) {
    return NextResponse.json({ error: 'phone query param required' }, { status: 400 })
  }

  // Normalize: strip spaces/dashes, ensure E.164-ish
  const normalizedPhone = phone.trim()

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, plan_type, subscription_status, trial_ends_at, created_at')
    .eq('phone_number', normalizedPhone)
    .single()

  if (error || !business) {
    return NextResponse.json({ hasAccount: false })
  }

  // Count active employees for context
  const { count: employeeCount } = await supabase
    .from('phone_employees')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('is_active', true)

  const isOnTrial = business.subscription_status === 'trial'
  const trialEndsAt = business.trial_ends_at

  return NextResponse.json({
    hasAccount: true,
    businessId: business.id,
    businessName: business.name,
    planType: business.plan_type,
    subscriptionStatus: business.subscription_status,
    trialEndsAt: trialEndsAt ?? null,
    employeeCount: employeeCount ?? 0,
    isOnTrial,
  })
}
