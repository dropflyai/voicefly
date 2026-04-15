/**
 * A2P Registration Poller — Cron Safety Net
 *
 * Runs on a schedule (configured in vercel.json). Finds every tenant
 * registration in a pending state and calls checkAndAdvance() on each.
 * This catches:
 *   - BrandRegistrations (which don't support webhooks — must poll)
 *   - Any webhook events that got lost (Twilio retries help but don't guarantee)
 *
 * Idempotent: advancing a registration that's already up-to-date is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAndAdvance } from '@/lib/a2p/service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Any status that still has forward progress possible via Twilio.
const ACTIVE_STATUSES = [
  'customer_profile_pending',
  'customer_profile_approved',
  'brand_pending',
  'brand_approved',
  'campaign_pending',
]

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  // Auth: accept either CRON_SECRET (manual runs, Vercel cron with header)
  // or the Vercel cron internal user-agent.
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const userAgent = req.headers.get('user-agent') || ''
  const isVercelCron = userAgent.includes('vercel-cron')
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find registrations that still need to advance
  const { data: pending, error } = await supabase
    .from('tenant_a2p_registrations')
    .select('business_id, status')
    .in('status', ACTIVE_STATUSES)

  if (error) {
    console.error('[cron/a2p-advance] Failed to list pending', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!pending?.length) {
    return NextResponse.json({ advanced: 0, checked: 0, timestamp: new Date().toISOString() })
  }

  // Advance each — run in series to avoid rate-limiting the Twilio API.
  const results: Array<{ businessId: string; from: string; to?: string; error?: string }> = []
  for (const row of pending) {
    try {
      const updated = await checkAndAdvance(row.business_id)
      results.push({ businessId: row.business_id, from: row.status, to: updated.status })
    } catch (err: any) {
      results.push({ businessId: row.business_id, from: row.status, error: err.message })
    }
  }

  const advanced = results.filter(r => r.to && r.to !== r.from).length
  console.log(`[cron/a2p-advance] Checked ${results.length}, advanced ${advanced}`)

  return NextResponse.json({
    checked: results.length,
    advanced,
    results,
    timestamp: new Date().toISOString(),
  })
}
