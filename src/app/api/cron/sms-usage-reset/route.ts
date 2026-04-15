/**
 * SMS Usage Reset Cron
 *
 * Runs monthly (1st of each month) to reset each business's SMS segment
 * counter. We reset ALL businesses at the calendar-month boundary rather
 * than per-business billing anniversary — simpler and matches how our
 * pricing page communicates the monthly limits.
 *
 * Stripe overage billing (separate, coming later) will happen on the
 * tenant's billing anniversary via usage records pushed incrementally.
 *
 * This cron is also the place we'd fire an overage warning email if we
 * see a business closing the month at >80% usage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const userAgent = req.headers.get('user-agent') || ''
  const isVercelCron = userAgent.includes('vercel-cron')
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Reset sms_segments_used=0 and set next reset timestamp for every business
  // that has a limit configured (i.e., participates in the SMS program).
  const { data: updated, error } = await supabase
    .from('businesses')
    .update({
      sms_segments_used: 0,
      sms_segments_reset_at: nextMonthStart.toISOString(),
      updated_at: now.toISOString(),
    })
    .gt('sms_segments_limit', 0)
    .select('id')

  if (error) {
    console.error('[cron/sms-usage-reset] Failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = updated?.length ?? 0
  console.log(`[cron/sms-usage-reset] Reset ${count} businesses at ${now.toISOString()}`)

  return NextResponse.json({
    reset: count,
    nextResetAt: nextMonthStart.toISOString(),
    timestamp: now.toISOString(),
  })
}
