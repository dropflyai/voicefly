/**
 * Background Task Worker
 *
 * Processes due scheduled tasks and pending action queue items.
 * Should be called by a cron job every 1-2 minutes (e.g., Railway cron, Vercel cron).
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * GET /api/cron/process-tasks?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { taskScheduler } from '@/lib/phone-employees/task-scheduler'
import { actionExecutor } from '@/lib/phone-employees/action-executor'
import { campaignExecutor } from '@/lib/phone-employees/campaign-executor'

export async function GET(request: NextRequest) {
  // Verify cron secret via Authorization header
  const auth = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    // Process scheduled tasks (callbacks, reminders, follow-ups)
    const taskResult = await taskScheduler.processDueTasks()

    // Process action queue (SMS, emails, outbound calls)
    const actionResult = await actionExecutor.processQueue(20)

    // Process active outbound campaigns
    const campaignResult = await campaignExecutor.processActiveCampaigns()

    const duration = Date.now() - startTime

    const response = {
      ok: true,
      duration_ms: duration,
      tasks: {
        processed: taskResult.processed,
        succeeded: taskResult.succeeded,
        failed: taskResult.failed,
      },
      actions: {
        processed: actionResult.processed,
        succeeded: actionResult.succeeded,
        failed: actionResult.failed,
      },
      campaigns: {
        processed: campaignResult.campaignsProcessed,
        callsMade: campaignResult.callsMade,
        errors: campaignResult.errors,
      },
      timestamp: new Date().toISOString(),
    }

    // Only log if something was actually processed
    if (taskResult.processed > 0 || actionResult.processed > 0 || campaignResult.callsMade > 0) {
      console.log('[CronWorker]', JSON.stringify(response))
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[CronWorker] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message, duration_ms: Date.now() - startTime },
      { status: 500 }
    )
  }
}
