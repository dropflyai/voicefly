/**
 * Admin Route -- Migrate Business Tier
 *
 * POST /api/admin/migrate-tier
 * Authorization: Bearer {CRON_SECRET}
 * Body: { businessId, toTier }
 *
 * Handles all tier transitions:
 * - trial → starter: updates tier, keeps shared assistant
 * - starter → pro: creates dedicated VAPI assistants, rebinds phone numbers
 * - pro → starter: deletes dedicated assistants, reverts to shared
 * - any → trial: deletes dedicated assistants, reverts to trial
 */

import { NextRequest, NextResponse } from 'next/server'
import { employeeProvisioning } from '@/lib/phone-employees'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth: CRON_SECRET only (admin-level operation)
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')

  if (!CRON_SECRET || token !== CRON_SECRET) {
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

    const result = await employeeProvisioning.migrateBusinessTier(businessId, toTier)

    return NextResponse.json({
      success: result.errors.length === 0,
      ...result,
    })
  } catch (error: any) {
    console.error('[Admin MigrateTier] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
