/**
 * Trial Usage API
 *
 * GET /api/trial/usage?businessId=X
 *
 * Returns trial call usage for the dashboard meter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TRIAL_LIMITS = {
  maxCalls: 10,
  maxCallDurationSeconds: 300,
  trialDays: 14,
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Get business info for trial start date
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_status, created_at')
      .eq('id', businessId)
      .single()

    if (!business || business.subscription_status !== 'trial') {
      return NextResponse.json({
        isTrial: false,
        limits: TRIAL_LIMITS,
      })
    }

    // Count calls for this business
    const { count } = await supabase
      .from('employee_calls')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)

    const callCount = count || 0

    // Calculate trial expiry
    const trialStart = new Date(business.created_at)
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialEnd.getDate() + TRIAL_LIMITS.trialDays)
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const isExpired = daysRemaining === 0

    // Get call stats for upgrade hooks
    const { data: calls } = await supabase
      .from('employee_calls')
      .select('duration, status, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50)

    const totalMinutes = Math.round(
      (calls || []).reduce((sum, c) => sum + (c.duration || 0), 0) / 60
    )
    const completedCalls = (calls || []).filter(c => c.status === 'completed').length

    // Count appointments booked (for upgrade hook messaging)
    const { count: appointmentCount } = await supabase
      .from('scheduled_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('task_type', 'callback')

    // Count messages taken
    const { count: messageCount } = await supabase
      .from('phone_messages')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)

    return NextResponse.json({
      isTrial: true,
      limits: TRIAL_LIMITS,
      usage: {
        callsUsed: callCount,
        callsRemaining: Math.max(0, TRIAL_LIMITS.maxCalls - callCount),
        limitReached: callCount >= TRIAL_LIMITS.maxCalls,
        totalMinutes,
        completedCalls,
        appointmentsBooked: appointmentCount || 0,
        messagesTaken: messageCount || 0,
      },
      trial: {
        startDate: trialStart.toISOString(),
        endDate: trialEnd.toISOString(),
        daysRemaining,
        isExpired,
      },
    })
  } catch (error: any) {
    console.error('[TrialUsage] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
