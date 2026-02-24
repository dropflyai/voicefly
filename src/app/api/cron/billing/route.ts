/**
 * Billing Agent Worker
 *
 * Orchestrates billing responsibilities on two schedules:
 * - Frequent cycle (every 5 min): alerts, fraud detection, dunning, overages
 * - Daily cycle (once per day): resets, usage metering, invoices, reports,
 *   lifecycle, refunds, forecasting, credit expiration
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 *
 * GET /api/cron/billing?secret=CRON_SECRET
 * GET /api/cron/billing?secret=CRON_SECRET&cycle=daily  (force daily cycle)
 */

import { NextRequest, NextResponse } from 'next/server'
import { BillingAgent } from '@/lib/billing-agent'
import { mayaPrime } from '@/lib/agents/maya-prime'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const secret = request.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const forceDailyCycle = request.nextUrl.searchParams.get('cycle') === 'daily'

  try {
    // === FREQUENT CYCLE (every 5 min) ===
    const alertsResult = await BillingAgent.processBillingAlerts()
    const anomalyResult = await BillingAgent.detectAnomalies()
    const dunningResult = await BillingAgent.processDunning()
    const overageResult = await BillingAgent.processOverages()

    // Report frequent-cycle results to Maya — she decides if alerts are needed
    mayaPrime.onBillingCycleComplete({
      anomalies: anomalyResult,
      alerts: alertsResult,
      dunning: dunningResult,
      overages: overageResult,
    }).catch((err) => console.error('[BillingCron] Maya report error:', err))

    // === DAILY CYCLE ===
    let dailyResult = null
    const shouldRunDaily = forceDailyCycle || await BillingAgent.shouldRunDailyCycle()

    if (shouldRunDaily) {
      dailyResult = {
        resets: await BillingAgent.processMonthlyResets(),
        usage: await BillingAgent.aggregateUsage(),
        invoices: await BillingAgent.generateInvoices(),
        revenue: await BillingAgent.generateRevenueSnapshot(),
        lifecycle: await BillingAgent.processSubscriptionLifecycle(),
        deprovisioning: await BillingAgent.processTrialDeprovisioning(),
        refunds: await BillingAgent.processFailedCallRefunds(),
        forecasts: await BillingAgent.runForecasts(),
        creditExpiration: await BillingAgent.enforceCreditExpiration(),
      }
      await BillingAgent.markDailyCycleComplete()
    }

    const duration = Date.now() - startTime

    const response = {
      ok: true,
      duration_ms: duration,
      frequent: {
        alerts: alertsResult,
        anomalies: anomalyResult,
        dunning: dunningResult,
        overages: overageResult,
      },
      daily: dailyResult,
      timestamp: new Date().toISOString(),
    }

    // Only log if something was processed
    const totalProcessed =
      alertsResult.alerts +
      anomalyResult.flagged +
      dunningResult.processed +
      overageResult.newOverages +
      (dailyResult
        ? dailyResult.resets.processed +
          dailyResult.invoices.generated +
          dailyResult.refunds.issued
        : 0)

    if (totalProcessed > 0) {
      console.log('[BillingAgent]', JSON.stringify(response))
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[BillingAgent] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message, duration_ms: Date.now() - startTime },
      { status: 500 }
    )
  }
}
