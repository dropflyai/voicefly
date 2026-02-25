/**
 * Billing Agent
 *
 * Orchestrates all billing responsibilities on two schedules:
 * - Frequent cycle (every 5 min): alerts, fraud detection, dunning, overages
 * - Daily cycle (once per day): resets, usage metering, invoices, reports,
 *   lifecycle, refunds, forecasting, credit expiration
 *
 * Called by /api/cron/billing
 */

import { supabase } from './supabase-client'
import { EmployeeProvisioningService } from './phone-employees/employee-provisioning'
import CreditSystem, {
  CreditCost,
  CREDITS_PER_MINUTE,
  MonthlyCredits,
  TIER_PRICING,
  OVERAGE_PRICING_PER_CREDIT,
  OVERAGE_PRICING_PER_MINUTE,
} from './credit-system'
import AuditLogger, { AuditEventType } from './audit-logger'

// Feature name -> service_type mapping for usage aggregation
const FEATURE_TO_SERVICE: Record<string, string> = {
  voice_call_inbound: 'voice_inbound',
  voice_call_outbound: 'voice_outbound',
  email_campaign: 'email_campaign',
  sms_campaign: 'sms_campaign',
  maya_research: 'maya_research',
  maya_deep_research: 'maya_research',
  maya_quick_research: 'maya_research',
  maya_market_analysis: 'maya_research',
  workflow_execution: 'workflow',
  automation_trigger: 'automation',
  appointment_booking: 'appointment',
  appointment_reminder: 'appointment',
  ai_chat_message: 'ai_chat',
  lead_enrichment: 'lead_enrichment',
  credit_pack: 'pack_purchase',
}

// Get monthly allocation for a tier
function getMonthlyAllocation(tier: string): number {
  switch (tier) {
    case 'trial': return MonthlyCredits.TRIAL
    case 'starter': return MonthlyCredits.STARTER
    case 'pro':
    case 'professional': return MonthlyCredits.PRO
    default: return MonthlyCredits.STARTER
  }
}

export class BillingAgent {

  // =========================================================
  // FREQUENT CYCLE (every 5 min)
  // =========================================================

  /**
   * 1. Process billing alerts for all active businesses
   * Checks credit levels and trial expiration
   */
  static async processBillingAlerts(): Promise<{ processed: number; alerts: number }> {
    let processed = 0
    let alerts = 0

    try {
      const businesses = await this.getActiveBusinesses()

      for (const biz of businesses) {
        processed++

        // Check credit levels
        const balance = await CreditSystem.getBalance(biz.id)
        if (!balance) continue

        const allocation = getMonthlyAllocation(biz.subscription_tier)
        const totalAvailable = allocation + (biz.purchased_credits || 0)
        if (totalAvailable === 0) continue

        const percentRemaining = (balance.total_credits / totalAvailable) * 100

        if (percentRemaining <= 5 && balance.total_credits > 0) {
          const sent = await this.insertBillingAlert(
            biz.id,
            'credits_exhausted',
            'critical',
            `Your voice minutes are almost depleted (${balance.total_minutes} min remaining). Purchase more to avoid service interruption.`,
            { percentRemaining, totalMinutes: balance.total_minutes }
          )
          if (sent) alerts++
        } else if (percentRemaining <= 20 && balance.total_credits > 0) {
          const sent = await this.insertBillingAlert(
            biz.id,
            'low_credits',
            'warning',
            `You're at ${Math.round(percentRemaining)}% of your voice minutes (${balance.total_minutes} min remaining).`,
            { percentRemaining, totalMinutes: balance.total_minutes }
          )
          if (sent) alerts++
        } else if (balance.total_credits <= 0) {
          const sent = await this.insertBillingAlert(
            biz.id,
            'credits_exhausted',
            'critical',
            'Your voice minutes are fully depleted. Purchase more minutes or upgrade your plan to continue service.',
            { totalCredits: 0 }
          )
          if (sent) alerts++
        }

        // Check trial expiration (within 3 days)
        if (biz.subscription_status === 'trial' && biz.trial_ends_at) {
          const trialEnd = new Date(biz.trial_ends_at)
          const now = new Date()
          const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysRemaining > 0 && daysRemaining <= 3) {
            const sent = await this.insertBillingAlert(
              biz.id,
              'trial_expiring',
              'warning',
              `Your free trial expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Upgrade now to keep your AI assistant running.`,
              { daysRemaining, trialEndsAt: biz.trial_ends_at }
            )
            if (sent) alerts++
          }
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processBillingAlerts error:', err)
    }

    return { processed, alerts }
  }

  /**
   * 2. Detect usage anomalies / fraud
   * Flags businesses with consumption > 5x their average or > 50% depletion in 1 hour
   */
  static async detectAnomalies(): Promise<{ processed: number; flagged: number }> {
    let processed = 0
    let flagged = 0

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Get recent high-volume consumers (last hour)
      const { data: recentUsage } = await supabase
        .from('credit_transactions')
        .select('business_id, amount')
        .eq('operation', 'deduct')
        .gte('created_at', oneHourAgo)

      if (!recentUsage || recentUsage.length === 0) {
        return { processed: 0, flagged: 0 }
      }

      // Aggregate by business
      const hourlyUsage: Record<string, number> = {}
      for (const tx of recentUsage) {
        hourlyUsage[tx.business_id] = (hourlyUsage[tx.business_id] || 0) + Math.abs(tx.amount)
      }

      for (const [businessId, creditsThisHour] of Object.entries(hourlyUsage)) {
        processed++

        // Get 30-day average hourly rate
        const { data: historicalUsage } = await supabase
          .from('credit_transactions')
          .select('amount')
          .eq('business_id', businessId)
          .eq('operation', 'deduct')
          .gte('created_at', thirtyDaysAgo)
          .lt('created_at', oneHourAgo)

        const totalHistorical = (historicalUsage || []).reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
        const hoursInPeriod = Math.max(1, (Date.now() - new Date(thirtyDaysAgo).getTime()) / (60 * 60 * 1000))
        const avgHourlyRate = totalHistorical / hoursInPeriod

        // Check 5x spike
        const isSpike = avgHourlyRate > 0 && creditsThisHour > avgHourlyRate * 5

        // Check 50% depletion in one hour
        const { data: biz } = await supabase
          .from('businesses')
          .select('subscription_tier, monthly_credits, purchased_credits')
          .eq('id', businessId)
          .single()

        const allocation = biz ? getMonthlyAllocation(biz.subscription_tier) + (biz.purchased_credits || 0) : 0
        const isRapidDepletion = allocation > 0 && creditsThisHour > allocation * 0.5

        if (isSpike || isRapidDepletion) {
          flagged++
          const sent = await this.insertBillingAlert(
            businessId,
            'usage_spike',
            'critical',
            `Unusual usage detected: ${Math.round(creditsThisHour / CREDITS_PER_MINUTE)} minutes consumed in the last hour.`,
            {
              creditsThisHour,
              avgHourlyRate: Math.round(avgHourlyRate),
              spikeMultiple: avgHourlyRate > 0 ? Math.round(creditsThisHour / avgHourlyRate) : 0,
              isRapidDepletion,
            }
          )

          if (sent) {
            await AuditLogger.log({
              event_type: AuditEventType.BILLING_FRAUD_DETECTED,
              business_id: businessId,
              metadata: { creditsThisHour, avgHourlyRate, isSpike, isRapidDepletion },
              severity: 'critical',
            })
          }
        }
      }
    } catch (err) {
      console.error('[BillingAgent] detectAnomalies error:', err)
    }

    return { processed, flagged }
  }

  /**
   * 3. Process dunning for failed payments
   * Creates records, retries with exponential backoff, suspends after exhaustion
   */
  static async processDunning(): Promise<{
    processed: number
    recovered: number
    escalated: number
    suspended: number
  }> {
    let processed = 0
    let recovered = 0
    let escalated = 0
    let suspended = 0

    try {
      // Create dunning records for new failed payments
      const { data: failedPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (failedPayments) {
        for (const payment of failedPayments) {
          // Check if dunning record already exists
          const { data: existing } = await supabase
            .from('dunning_records')
            .select('id')
            .eq('stripe_invoice_id', payment.stripe_invoice_id)
            .single()

          if (!existing && payment.stripe_customer_id) {
            // Find the business for this customer
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('stripe_customer_id', payment.stripe_customer_id)
              .single()

            // Look up business by payment or subscription
            const businessId = payment.business_id || sub?.id
            if (!businessId) continue

            const gracePeriodEnd = new Date()
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)
            const nextRetry = new Date()
            nextRetry.setDate(nextRetry.getDate() + 2)

            await supabase.from('dunning_records').insert({
              business_id: businessId,
              stripe_invoice_id: payment.stripe_invoice_id,
              stripe_customer_id: payment.stripe_customer_id,
              amount_cents: payment.amount || 0,
              grace_period_ends_at: gracePeriodEnd.toISOString(),
              next_retry_at: nextRetry.toISOString(),
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            await this.insertBillingAlert(
              businessId,
              'payment_failed',
              'critical',
              'Your payment failed. Please update your payment method to avoid service interruption.',
              { amount: payment.amount, invoiceId: payment.stripe_invoice_id }
            )

            // Update business dunning status
            await supabase
              .from('businesses')
              .update({ dunning_status: 'grace_period', updated_at: new Date().toISOString() })
              .eq('id', businessId)

            processed++
          }
        }
      }

      // Process active dunning records
      const { data: activeDunning } = await supabase
        .from('dunning_records')
        .select('*')
        .eq('status', 'active')

      if (activeDunning) {
        const now = new Date()

        for (const record of activeDunning) {
          // Check if payment was recovered
          const { data: successPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('stripe_customer_id', record.stripe_customer_id)
            .eq('status', 'succeeded')
            .gte('created_at', record.created_at)
            .limit(1)

          if (successPayment && successPayment.length > 0) {
            // Payment recovered
            await supabase
              .from('dunning_records')
              .update({ status: 'recovered', updated_at: now.toISOString() })
              .eq('id', record.id)

            await supabase
              .from('businesses')
              .update({
                dunning_status: 'none',
                subscription_status: 'active',
                updated_at: now.toISOString(),
              })
              .eq('id', record.business_id)

            recovered++
            continue
          }

          // Check if max attempts exhausted and grace period expired
          if (
            record.attempt_count >= record.max_attempts &&
            record.grace_period_ends_at &&
            new Date(record.grace_period_ends_at) < now
          ) {
            // Suspend the business
            await supabase
              .from('dunning_records')
              .update({
                status: 'exhausted',
                suspension_date: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', record.id)

            await supabase
              .from('businesses')
              .update({
                dunning_status: 'suspended',
                subscription_status: 'suspended',
                updated_at: now.toISOString(),
              })
              .eq('id', record.business_id)

            await this.insertBillingAlert(
              record.business_id,
              'service_suspended',
              'critical',
              'Your account has been suspended due to unpaid invoices. Please update your payment method to restore service.',
              { dunningId: record.id, attempts: record.attempt_count }
            )

            await AuditLogger.log({
              event_type: AuditEventType.BILLING_DUNNING_ESCALATED,
              business_id: record.business_id,
              metadata: { action: 'suspended', attempts: record.attempt_count },
              severity: 'critical',
            })

            suspended++
            continue
          }

          // Check if it's time to retry/escalate
          if (record.next_retry_at && new Date(record.next_retry_at) <= now) {
            const newAttemptCount = record.attempt_count + 1
            // Exponential backoff: 2d, 4d, 6d, 8d
            const nextRetry = new Date()
            nextRetry.setDate(nextRetry.getDate() + newAttemptCount * 2)

            await supabase
              .from('dunning_records')
              .update({
                attempt_count: newAttemptCount,
                next_retry_at: nextRetry.toISOString(),
                emails_sent: (record.emails_sent || 0) + 1,
                last_email_sent_at: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', record.id)

            await this.insertBillingAlert(
              record.business_id,
              'payment_failed',
              'critical',
              `Payment retry ${newAttemptCount} of ${record.max_attempts} failed. Please update your payment method.`,
              { attempt: newAttemptCount, maxAttempts: record.max_attempts }
            )

            escalated++
          }
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processDunning error:', err)
    }

    return { processed, recovered, escalated, suspended }
  }

  /**
   * 4. Track overages for businesses that exceeded their allocation
   * Records for end-of-period invoicing (not real-time charging)
   */
  static async processOverages(): Promise<{ processed: number; newOverages: number }> {
    let processed = 0
    let newOverages = 0

    try {
      // Find businesses that have used more than their monthly allocation
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, subscription_tier, credits_used_this_month, monthly_credits, purchased_credits')
        .in('subscription_status', ['active', 'past_due'])
        .not('subscription_tier', 'eq', 'trial')

      if (!businesses) return { processed: 0, newOverages: 0 }

      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      for (const biz of businesses) {
        processed++

        const allocation = getMonthlyAllocation(biz.subscription_tier)
        const used = biz.credits_used_this_month || 0

        // Only count overage if used more than allocation AND credits are depleted
        if (used > allocation && (biz.monthly_credits || 0) === 0 && (biz.purchased_credits || 0) === 0) {
          const overageCredits = used - allocation
          const overageMinutes = Math.ceil(overageCredits / CREDITS_PER_MINUTE)
          const tierKey = biz.subscription_tier as keyof typeof OVERAGE_PRICING_PER_MINUTE
          const ratePerMinute = OVERAGE_PRICING_PER_MINUTE[tierKey] || OVERAGE_PRICING_PER_MINUTE.starter
          const overageCost = overageMinutes * ratePerMinute

          // Upsert usage record for overage
          const { data: existing } = await supabase
            .from('usage_records')
            .select('id, credits_consumed')
            .eq('business_id', biz.id)
            .eq('period_start', periodStart.toISOString().split('T')[0])
            .eq('service_type', 'overage')
            .single()

          if (existing) {
            if (overageCredits !== existing.credits_consumed) {
              await supabase
                .from('usage_records')
                .update({
                  units_consumed: overageMinutes,
                  credits_consumed: overageCredits,
                  cost_dollars: overageCost,
                  updated_at: now.toISOString(),
                })
                .eq('id', existing.id)
            }
          } else {
            await supabase.from('usage_records').insert({
              business_id: biz.id,
              period_start: periodStart.toISOString().split('T')[0],
              period_end: periodEnd.toISOString().split('T')[0],
              service_type: 'overage',
              units_consumed: overageMinutes,
              credits_consumed: overageCredits,
              cost_dollars: overageCost,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            })

            newOverages++

            await this.insertBillingAlert(
              biz.id,
              'overage_warning',
              'warning',
              `You've exceeded your monthly voice minutes. Overage charges of $${overageCost.toFixed(2)} apply at $${ratePerMinute.toFixed(2)}/min.`,
              { overageMinutes, overageCost, ratePerMinute }
            )

            await AuditLogger.log({
              event_type: AuditEventType.BILLING_OVERAGE_RECORDED,
              business_id: biz.id,
              metadata: { overageCredits, overageMinutes, overageCost, tier: biz.subscription_tier },
              severity: 'medium',
            })
          }
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processOverages error:', err)
    }

    return { processed, newOverages }
  }

  // =========================================================
  // DAILY CYCLE
  // =========================================================

  /**
   * 5. Process monthly credit resets for businesses whose billing period ended
   */
  static async processMonthlyResets(): Promise<{ processed: number; succeeded: number; failed: number }> {
    let processed = 0
    let succeeded = 0
    let failed = 0

    try {
      const now = new Date().toISOString()

      // Find businesses due for credit reset
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, subscription_tier, credits_reset_date')
        .lte('credits_reset_date', now)
        .in('subscription_status', ['active', 'past_due'])
        .not('subscription_tier', 'eq', 'trial')

      if (!businesses || businesses.length === 0) {
        return { processed: 0, succeeded: 0, failed: 0 }
      }

      for (const biz of businesses) {
        processed++

        const result = await CreditSystem.resetMonthlyCredits(biz.id)
        if (result) {
          succeeded++
        } else {
          failed++
          console.error(`[BillingAgent] Failed to reset credits for business ${biz.id}`)
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processMonthlyResets error:', err)
    }

    return { processed, succeeded, failed }
  }

  /**
   * 6 + 11. Aggregate per-service usage from credit_transactions
   */
  static async aggregateUsage(): Promise<{ businessesProcessed: number; recordsUpserted: number }> {
    let businessesProcessed = 0
    let recordsUpserted = 0

    try {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const periodStartStr = periodStart.toISOString().split('T')[0]
      const periodEndStr = periodEnd.toISOString().split('T')[0]

      // Get all deduction transactions for the current month
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('business_id, feature, amount')
        .eq('operation', 'deduct')
        .gte('created_at', periodStart.toISOString())

      if (!transactions || transactions.length === 0) {
        return { businessesProcessed: 0, recordsUpserted: 0 }
      }

      // Aggregate by business + service type
      const aggregated: Record<string, Record<string, { credits: number; units: number }>> = {}

      for (const tx of transactions) {
        const serviceType = FEATURE_TO_SERVICE[tx.feature] || tx.feature
        if (!aggregated[tx.business_id]) aggregated[tx.business_id] = {}
        if (!aggregated[tx.business_id][serviceType]) {
          aggregated[tx.business_id][serviceType] = { credits: 0, units: 0 }
        }

        const credits = Math.abs(tx.amount)
        aggregated[tx.business_id][serviceType].credits += credits

        // Calculate units based on service type
        if (serviceType === 'voice_inbound') {
          aggregated[tx.business_id][serviceType].units += Math.ceil(credits / CreditCost.VOICE_CALL_INBOUND)
        } else if (serviceType === 'voice_outbound') {
          aggregated[tx.business_id][serviceType].units += Math.ceil(credits / CreditCost.VOICE_CALL_OUTBOUND)
        } else {
          aggregated[tx.business_id][serviceType].units += 1
        }
      }

      // Upsert into usage_records
      for (const [businessId, services] of Object.entries(aggregated)) {
        businessesProcessed++

        for (const [serviceType, data] of Object.entries(services)) {
          const { data: existing } = await supabase
            .from('usage_records')
            .select('id')
            .eq('business_id', businessId)
            .eq('period_start', periodStartStr)
            .eq('service_type', serviceType)
            .single()

          if (existing) {
            await supabase
              .from('usage_records')
              .update({
                units_consumed: data.units,
                credits_consumed: data.credits,
                updated_at: now.toISOString(),
              })
              .eq('id', existing.id)
          } else {
            await supabase.from('usage_records').insert({
              business_id: businessId,
              period_start: periodStartStr,
              period_end: periodEndStr,
              service_type: serviceType,
              units_consumed: data.units,
              credits_consumed: data.credits,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
          }

          recordsUpserted++
        }
      }
    } catch (err) {
      console.error('[BillingAgent] aggregateUsage error:', err)
    }

    return { businessesProcessed, recordsUpserted }
  }

  /**
   * 7. Generate invoices for businesses whose billing period just ended
   */
  static async generateInvoices(): Promise<{ generated: number; totalAmountCents: number }> {
    let generated = 0
    let totalAmountCents = 0

    try {
      const now = new Date()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Find businesses whose credits were just reset (billing period ended)
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, subscription_tier, credits_reset_date, name')
        .in('subscription_status', ['active', 'past_due'])
        .not('subscription_tier', 'eq', 'trial')
        .gte('credits_reset_date', oneDayAgo.toISOString())

      if (!businesses || businesses.length === 0) {
        return { generated: 0, totalAmountCents: 0 }
      }

      for (const biz of businesses) {
        // Calculate billing period (last month)
        const resetDate = new Date(biz.credits_reset_date)
        const periodEnd = new Date(resetDate)
        periodEnd.setDate(periodEnd.getDate() - 1) // day before reset
        const periodStart = new Date(periodEnd)
        periodStart.setMonth(periodStart.getMonth() - 1)
        periodStart.setDate(periodStart.getDate() + 1)

        const periodStartStr = periodStart.toISOString().split('T')[0]
        const periodEndStr = periodEnd.toISOString().split('T')[0]

        // Check if invoice already exists for this period
        const { data: existingInvoice } = await supabase
          .from('billing_invoices')
          .select('id')
          .eq('business_id', biz.id)
          .eq('period_start', periodStartStr)
          .single()

        if (existingInvoice) continue

        // Get subscription price
        const tierKey = biz.subscription_tier as keyof typeof TIER_PRICING
        const subscriptionCents = TIER_PRICING[tierKey]?.price_cents || 0

        // Get overage from usage_records
        const { data: overageRecord } = await supabase
          .from('usage_records')
          .select('cost_dollars')
          .eq('business_id', biz.id)
          .eq('period_start', periodStartStr)
          .eq('service_type', 'overage')
          .single()

        const overageCents = overageRecord
          ? Math.round((overageRecord.cost_dollars || 0) * 100)
          : 0

        // Get pack purchases for the period
        const { data: packPurchases } = await supabase
          .from('credit_purchases')
          .select('amount_paid')
          .eq('business_id', biz.id)
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString())
          .eq('status', 'completed')

        const packCents = (packPurchases || []).reduce(
          (sum, p) => sum + (p.amount_paid || 0),
          0
        )

        const total = subscriptionCents + overageCents + packCents
        const invoiceNumber = this.generateInvoiceNumber(biz.id)

        // Build line items
        const lineItems = []
        if (subscriptionCents > 0) {
          lineItems.push({
            description: `${TIER_PRICING[tierKey]?.name || biz.subscription_tier} Plan - Monthly`,
            amount_cents: subscriptionCents,
          })
        }
        if (overageCents > 0) {
          lineItems.push({
            description: 'Voice minute overage charges',
            amount_cents: overageCents,
          })
        }
        if (packCents > 0) {
          lineItems.push({
            description: 'Voice minute pack purchases',
            amount_cents: packCents,
          })
        }

        await supabase.from('billing_invoices').insert({
          business_id: biz.id,
          invoice_number: invoiceNumber,
          period_start: periodStartStr,
          period_end: periodEndStr,
          subscription_amount_cents: subscriptionCents,
          overage_amount_cents: overageCents,
          pack_purchase_amount_cents: packCents,
          total_amount_cents: total,
          status: 'finalized',
          line_items: lineItems,
          finalized_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })

        generated++
        totalAmountCents += total

        await AuditLogger.log({
          event_type: AuditEventType.BILLING_INVOICE_GENERATED,
          business_id: biz.id,
          metadata: { invoiceNumber, total, subscriptionCents, overageCents, packCents },
          severity: 'low',
        })
      }
    } catch (err) {
      console.error('[BillingAgent] generateInvoices error:', err)
    }

    return { generated, totalAmountCents }
  }

  /**
   * 8. Generate daily revenue snapshot for platform reporting
   */
  static async generateRevenueSnapshot(): Promise<{
    mrr: number
    payingBusinesses: number
    churnRate: number
  }> {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Get all businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, subscription_tier, subscription_status, updated_at')

      if (!businesses) {
        return { mrr: 0, payingBusinesses: 0, churnRate: 0 }
      }

      // Calculate metrics
      let subscriptionMrr = 0
      let payingCount = 0
      let trialCount = 0
      let churnedCount = 0
      const tierBreakdown: Record<string, { count: number; mrr: number }> = {}

      for (const biz of businesses) {
        const tierKey = biz.subscription_tier as keyof typeof TIER_PRICING

        if (biz.subscription_status === 'active' && biz.subscription_tier !== 'trial') {
          const priceCents = TIER_PRICING[tierKey]?.price_cents || 0
          subscriptionMrr += priceCents
          payingCount++

          if (!tierBreakdown[biz.subscription_tier]) {
            tierBreakdown[biz.subscription_tier] = { count: 0, mrr: 0 }
          }
          tierBreakdown[biz.subscription_tier].count++
          tierBreakdown[biz.subscription_tier].mrr += priceCents
        } else if (biz.subscription_status === 'trial') {
          trialCount++
        } else if (
          biz.subscription_status === 'cancelled' &&
          biz.updated_at >= thirtyDaysAgo
        ) {
          churnedCount++
        }
      }

      // Get overage revenue for this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const { data: overageRecords } = await supabase
        .from('usage_records')
        .select('cost_dollars')
        .eq('service_type', 'overage')
        .eq('period_start', monthStart)

      const overageMrr = Math.round(
        (overageRecords || []).reduce((sum, r) => sum + (r.cost_dollars || 0), 0) * 100
      )

      // Get pack revenue for this month
      const { data: packPurchases } = await supabase
        .from('credit_purchases')
        .select('amount_paid')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .eq('status', 'completed')

      const packRevenue = (packPurchases || []).reduce(
        (sum, p) => sum + (p.amount_paid || 0),
        0
      )

      const totalMrr = subscriptionMrr + overageMrr + packRevenue
      const arpu = payingCount > 0 ? Math.round(totalMrr / payingCount) : 0
      const churnRate = payingCount + churnedCount > 0
        ? churnedCount / (payingCount + churnedCount)
        : 0

      // Upsert snapshot
      const { data: existingSnapshot } = await supabase
        .from('revenue_snapshots')
        .select('id')
        .eq('snapshot_date', today)
        .single()

      const snapshotData = {
        snapshot_date: today,
        total_mrr_cents: totalMrr,
        subscription_mrr_cents: subscriptionMrr,
        overage_mrr_cents: overageMrr,
        pack_revenue_cents: packRevenue,
        total_businesses: businesses.length,
        paying_businesses: payingCount,
        trial_businesses: trialCount,
        churned_businesses: churnedCount,
        arpu_cents: arpu,
        churn_rate: churnRate,
        tier_breakdown: tierBreakdown,
      }

      if (existingSnapshot) {
        await supabase
          .from('revenue_snapshots')
          .update(snapshotData)
          .eq('id', existingSnapshot.id)
      } else {
        await supabase.from('revenue_snapshots').insert({
          ...snapshotData,
          created_at: now.toISOString(),
        })
      }

      return {
        mrr: totalMrr,
        payingBusinesses: payingCount,
        churnRate: Math.round(churnRate * 10000) / 10000,
      }
    } catch (err) {
      console.error('[BillingAgent] generateRevenueSnapshot error:', err)
      return { mrr: 0, payingBusinesses: 0, churnRate: 0 }
    }
  }

  /**
   * 9. Process subscription lifecycle (trial expiration, grace period expiration)
   */
  static async processSubscriptionLifecycle(): Promise<{
    trialsExpired: number
    gracePeriodExpired: number
  }> {
    let trialsExpired = 0
    let gracePeriodExpired = 0

    try {
      const now = new Date()

      // Expire trials
      const { data: expiredTrials } = await supabase
        .from('businesses')
        .select('id, trial_ends_at')
        .eq('subscription_status', 'trial')
        .lte('trial_ends_at', now.toISOString())

      if (expiredTrials) {
        for (const biz of expiredTrials) {
          await supabase
            .from('businesses')
            .update({
              subscription_status: 'suspended',
              monthly_credits: 0,
              updated_at: now.toISOString(),
            })
            .eq('id', biz.id)

          await this.insertBillingAlert(
            biz.id,
            'trial_expired',
            'critical',
            'Your free trial has ended. Upgrade to a paid plan to continue using VoiceFly.',
            { trialEndedAt: biz.trial_ends_at }
          )

          trialsExpired++
        }
      }

      // Grace period expiration is handled by processDunning()
      // but double-check for any that slipped through
      const { data: expiredGrace } = await supabase
        .from('dunning_records')
        .select('id, business_id')
        .eq('status', 'active')
        .lte('grace_period_ends_at', now.toISOString())

      if (expiredGrace) {
        for (const record of expiredGrace) {
          if (record.business_id) {
            const { data: biz } = await supabase
              .from('businesses')
              .select('subscription_status')
              .eq('id', record.business_id)
              .single()

            if (biz && biz.subscription_status !== 'suspended') {
              await supabase
                .from('businesses')
                .update({
                  subscription_status: 'suspended',
                  dunning_status: 'suspended',
                  updated_at: now.toISOString(),
                })
                .eq('id', record.business_id)

              await supabase
                .from('dunning_records')
                .update({ status: 'exhausted', suspension_date: now.toISOString(), updated_at: now.toISOString() })
                .eq('id', record.id)

              gracePeriodExpired++
            }
          }
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processSubscriptionLifecycle error:', err)
    }

    return { trialsExpired, gracePeriodExpired }
  }

  /**
   * 10. Deprovision expired trial accounts (30-day grace period after trial ends)
   * Releases Twilio numbers and deletes VAPI assistants for businesses that
   * never converted and have been suspended for 30+ days.
   */
  static async processTrialDeprovisioning(): Promise<{
    deprovisioned: number
    employeesDeleted: number
  }> {
    let deprovisioned = 0
    let employeesDeleted = 0

    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Find suspended trial accounts past the 30-day grace window
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, trial_ends_at')
        .eq('subscription_status', 'suspended')
        .not('trial_ends_at', 'is', null)
        .lte('trial_ends_at', cutoff.toISOString())

      if (!businesses?.length) return { deprovisioned: 0, employeesDeleted: 0 }

      const provisioning = new EmployeeProvisioningService()

      for (const biz of businesses) {
        // Fetch all employees for this business
        const { data: employees } = await supabase
          .from('phone_employees')
          .select('id')
          .eq('business_id', biz.id)

        if (employees?.length) {
          for (const emp of employees) {
            const deleted = await provisioning.deleteEmployee(emp.id, biz.id)
            if (deleted) employeesDeleted++
          }
        }

        // Mark as cancelled
        await supabase
          .from('businesses')
          .update({ subscription_status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', biz.id)

        deprovisioned++
        console.log(`[BillingAgent] Deprovisioned expired trial: ${biz.id} (trial ended ${biz.trial_ends_at})`)
      }
    } catch (err) {
      console.error('[BillingAgent] processTrialDeprovisioning error:', err)
    }

    return { deprovisioned, employeesDeleted }
  }

  /**
   * 11. Process failed call refunds
   * Refunds credits for very short calls (< 5 seconds) indicating platform failure
   */
  static async processFailedCallRefunds(): Promise<{
    processed: number
    issued: number
    creditsRefunded: number
  }> {
    let processed = 0
    let issued = 0
    let creditsRefunded = 0

    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Find very short or errored calls in the last 24h
      const { data: failedCalls } = await supabase
        .from('employee_calls')
        .select('call_id, business_id, status, metadata, created_at')
        .gte('created_at', oneDayAgo)
        .or('status.eq.error,status.eq.failed')

      if (!failedCalls || failedCalls.length === 0) {
        return { processed: 0, issued: 0, creditsRefunded: 0 }
      }

      for (const call of failedCalls) {
        processed++

        // Check if credits were deducted for this call
        const { data: deduction } = await supabase
          .from('credit_transactions')
          .select('amount, feature')
          .eq('business_id', call.business_id)
          .eq('operation', 'deduct')
          .like('metadata->>callId', call.call_id)
          .single()

        if (!deduction) continue

        // Check if already refunded
        const { data: existingRefund } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('business_id', call.business_id)
          .eq('operation', 'purchase')
          .eq('feature', 'failed_call_refund')
          .like('metadata->>callId', call.call_id)
          .single()

        if (existingRefund) continue

        // Issue refund
        const refundCredits = Math.abs(deduction.amount)
        const result = await CreditSystem.addPurchasedCredits(
          call.business_id,
          refundCredits,
          'refund_failed_call',
          undefined
        )

        if (result.success) {
          issued++
          creditsRefunded += refundCredits

          // Log the refund with call reference
          await supabase.from('credit_transactions').insert({
            business_id: call.business_id,
            amount: refundCredits,
            operation: 'refund',
            feature: 'failed_call_refund',
            metadata: { callId: call.call_id, originalDeduction: deduction.amount },
            balance_after: result.balance?.total_credits || 0,
            created_at: new Date().toISOString(),
          })

          await AuditLogger.log({
            event_type: AuditEventType.BILLING_REFUND_ISSUED,
            business_id: call.business_id,
            metadata: {
              callId: call.call_id,
              creditsRefunded: refundCredits,
              reason: 'platform_failure',
            },
            severity: 'medium',
          })
        }
      }
    } catch (err) {
      console.error('[BillingAgent] processFailedCallRefunds error:', err)
    }

    return { processed, issued, creditsRefunded }
  }

  /**
   * 11. Enforce credit expiration policy
   * Monthly credits: handled by resets (don't roll over)
   * Purchased credits: never expire
   * Trial credits: zeroed when trial expires (handled by lifecycle)
   */
  static async enforceCreditExpiration(): Promise<{ processed: number }> {
    let processed = 0

    try {
      // Check for edge case: trial businesses past expiration that still have credits
      const now = new Date()
      const { data: staleTrials } = await supabase
        .from('businesses')
        .select('id, monthly_credits')
        .eq('subscription_status', 'suspended')
        .gt('monthly_credits', 0)

      if (staleTrials) {
        for (const biz of staleTrials) {
          await supabase
            .from('businesses')
            .update({ monthly_credits: 0, updated_at: now.toISOString() })
            .eq('id', biz.id)
          processed++
        }
      }
    } catch (err) {
      console.error('[BillingAgent] enforceCreditExpiration error:', err)
    }

    return { processed }
  }

  /**
   * 12 + 14. Run usage forecasts for all businesses
   * Calculates burn rate and days until exhaustion, sends alerts
   */
  static async runForecasts(): Promise<{ processed: number; warningsSent: number }> {
    let processed = 0
    let warningsSent = 0

    try {
      const businesses = await this.getActiveBusinesses()

      for (const biz of businesses) {
        processed++

        const forecast = await this.calculateUsageForecast(biz.id)
        if (!forecast) continue

        // Alert if exhaustion within 3 days
        if (forecast.daysUntilExhaustion > 0 && forecast.daysUntilExhaustion <= 3) {
          const sent = await this.insertBillingAlert(
            biz.id,
            'credits_exhausted_soon',
            'warning',
            `At your current usage rate, you'll run out of voice minutes in ${Math.ceil(forecast.daysUntilExhaustion)} day${forecast.daysUntilExhaustion > 1 ? 's' : ''}. Consider purchasing more minutes.`,
            {
              dailyBurnRate: forecast.dailyBurnRate,
              daysUntilExhaustion: forecast.daysUntilExhaustion,
              projectedEndOfPeriod: forecast.projectedEndOfPeriod,
            }
          )
          if (sent) warningsSent++
        }
      }
    } catch (err) {
      console.error('[BillingAgent] runForecasts error:', err)
    }

    return { processed, warningsSent }
  }

  // =========================================================
  // ON-DEMAND METHODS
  // =========================================================

  /**
   * 13. Apply promotional credits to a business
   * Credits go into the purchased_credits pool (never expire)
   */
  static async applyPromotionalCredits(
    businessId: string,
    credits: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      const result = await CreditSystem.addPurchasedCredits(
        businessId,
        credits,
        `promo_${reason}`,
        undefined
      )

      if (!result.success) {
        return { success: false, newBalance: 0 }
      }

      // Update promotional_credits tracking column
      const { data: biz } = await supabase
        .from('businesses')
        .select('promotional_credits')
        .eq('id', businessId)
        .single()

      await supabase
        .from('businesses')
        .update({
          promotional_credits: (biz?.promotional_credits || 0) + credits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      await AuditLogger.log({
        event_type: AuditEventType.BILLING_ALERT_SENT,
        business_id: businessId,
        metadata: {
          type: 'promotional_credits',
          credits,
          reason,
          ...metadata,
        },
        severity: 'low',
      })

      return {
        success: true,
        newBalance: result.balance?.total_credits || 0,
      }
    } catch (err) {
      console.error('[BillingAgent] applyPromotionalCredits error:', err)
      return { success: false, newBalance: 0 }
    }
  }

  /**
   * 14. Calculate usage forecast for a specific business
   */
  static async calculateUsageForecast(businessId: string): Promise<{
    dailyBurnRate: number
    daysUntilExhaustion: number
    projectedEndOfPeriod: number
    willNeedTopUp: boolean
  } | null> {
    try {
      const balance = await CreditSystem.getBalance(businessId)
      if (!balance) return null

      // Get last 7 days of deductions
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: recentTx } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('business_id', businessId)
        .eq('operation', 'deduct')
        .gte('created_at', sevenDaysAgo)

      if (!recentTx || recentTx.length === 0) {
        return {
          dailyBurnRate: 0,
          daysUntilExhaustion: -1, // -1 means no usage
          projectedEndOfPeriod: balance.total_credits,
          willNeedTopUp: false,
        }
      }

      const totalUsed7d = recentTx.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
      const dailyBurnRate = totalUsed7d / 7

      const daysUntilExhaustion = dailyBurnRate > 0
        ? balance.total_credits / dailyBurnRate
        : -1

      // Days remaining in billing period
      const resetDate = balance.credits_reset_date
        ? new Date(balance.credits_reset_date)
        : new Date()
      const daysRemaining = Math.max(0,
        Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )

      const projectedEndOfPeriod = Math.max(0,
        balance.total_credits - (dailyBurnRate * daysRemaining)
      )

      return {
        dailyBurnRate: Math.round(dailyBurnRate),
        daysUntilExhaustion: Math.round(daysUntilExhaustion * 10) / 10,
        projectedEndOfPeriod: Math.round(projectedEndOfPeriod),
        willNeedTopUp: projectedEndOfPeriod <= 0,
      }
    } catch (err) {
      console.error('[BillingAgent] calculateUsageForecast error:', err)
      return null
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Check if the daily cycle should run (hasn't run today)
   */
  static async shouldRunDailyCycle(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('revenue_snapshots')
        .select('id')
        .eq('snapshot_date', today)
        .single()

      return !data // Run if no snapshot exists for today
    } catch {
      return true // Run on error (safe default)
    }
  }

  /**
   * Mark daily cycle as complete (revenue snapshot insert handles this)
   */
  static async markDailyCycleComplete(): Promise<void> {
    // No-op: the revenue snapshot insert in generateRevenueSnapshot() serves as the marker
  }

  /**
   * Get all active businesses (active, trial, or past_due)
   */
  private static async getActiveBusinesses(): Promise<any[]> {
    const { data } = await supabase
      .from('businesses')
      .select('id, subscription_tier, subscription_status, trial_ends_at, monthly_credits, purchased_credits, credits_used_this_month, credits_reset_date')
      .in('subscription_status', ['active', 'trial', 'past_due'])

    return data || []
  }

  /**
   * Insert a billing alert with deduplication (one alert per type per day)
   * Returns true if alert was inserted, false if deduplicated
   */
  private static async insertBillingAlert(
    businessId: string,
    alertType: string,
    severity: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('billing_alerts').insert({
        business_id: businessId,
        alert_type: alertType,
        severity,
        message,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })

      if (error) {
        // Unique constraint violation = duplicate alert today, that's fine
        if (error.code === '23505') return false
        console.error('[BillingAgent] insertBillingAlert error:', error)
        return false
      }

      // Update last alert timestamp
      await supabase
        .from('businesses')
        .update({ last_billing_alert_at: new Date().toISOString() })
        .eq('id', businessId)

      await AuditLogger.log({
        event_type: AuditEventType.BILLING_ALERT_SENT,
        business_id: businessId,
        metadata: { alertType, severity, ...metadata },
        severity: severity === 'critical' ? 'high' : 'low',
      })

      return true
    } catch (err) {
      console.error('[BillingAgent] insertBillingAlert exception:', err)
      return false
    }
  }

  /**
   * Generate a unique invoice number
   * Format: VF-YYYYMMDD-XXXX (4-char business ID prefix)
   */
  private static generateInvoiceNumber(businessId: string): string {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
    const bizPrefix = businessId.replace(/-/g, '').substring(0, 4).toUpperCase()
    return `VF-${dateStr}-${bizPrefix}`
  }
}

export default BillingAgent
