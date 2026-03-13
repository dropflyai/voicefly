/**
 * Admin Route -- Migrate Business Tier
 *
 * POST /api/admin/migrate-tier
 * x-admin-key: {SUPABASE_SERVICE_ROLE_KEY}
 * Body: { businessId, toTier }
 *
 * Handles all tier transitions:
 * - trial → starter: updates tier, keeps shared assistant
 * - starter → pro: creates dedicated VAPI assistants, rebinds phone numbers
 * - pro → starter: deletes dedicated assistants, reverts to shared
 * - any → trial: deletes dedicated assistants, reverts to trial
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { employeeProvisioning } from '@/lib/phone-employees'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth: x-admin-key must match SUPABASE_SERVICE_ROLE_KEY
  const adminKey = request.headers.get('x-admin-key') || ''

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { businessId, toTier } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    if (!['trial', 'starter', 'pro'].includes(toTier)) {
      return NextResponse.json(
        { error: 'toTier must be one of: trial, starter, pro' },
        { status: 400 }
      )
    }

    // Fetch current tier using service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('subscription_tier')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const currentTier = business.subscription_tier || 'trial'

    const result = await employeeProvisioning.migrateBusinessTier(businessId, toTier)

    return NextResponse.json({
      success: result.errors.length === 0,
      from: currentTier,
      to: toTier,
      migrated: result.migrated,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('[Admin MigrateTier] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
