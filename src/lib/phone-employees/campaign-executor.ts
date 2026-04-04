/**
 * Campaign Executor
 *
 * Processes outbound voice campaigns by:
 * 1. Reading active campaigns from the database
 * 2. Throttling calls to respect rate limits and business hours
 * 3. Making VAPI outbound calls to each target
 * 4. Tracking results (connected, voicemail, no-answer)
 * 5. Updating campaign stats
 *
 * Called by the cron worker (/api/cron/process-tasks)
 */

import { createClient } from '@supabase/supabase-js'
// Credit system removed — feature is included

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const VAPI_API_KEY = process.env.VAPI_API_KEY

// Max calls per campaign per execution cycle
const MAX_CALLS_PER_CYCLE = 5
// Min seconds between calls in same campaign
const CALL_SPACING_MS = 10000

export interface CampaignTarget {
  phone: string
  name?: string
  metadata?: Record<string, any>
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer' | 'voicemail'
  callId?: string
  attemptCount: number
  lastAttemptAt?: string
}

export interface Campaign {
  id: string
  businessId: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  employeeId?: string       // Phone employee to use for calls
  firstMessage?: string     // Custom greeting for this campaign
  targets: CampaignTarget[]
  schedule?: {
    startTime?: string      // HH:MM format (business hours)
    endTime?: string
    timezone?: string
    daysOfWeek?: number[]   // 0=Sun, 6=Sat
    maxCallsPerDay?: number
  }
  stats: {
    totalTargets: number
    called: number
    connected: number
    noAnswer: number
    voicemail: number
    failed: number
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export class CampaignExecutor {
  private static instance: CampaignExecutor

  private constructor() {}

  static getInstance(): CampaignExecutor {
    if (!CampaignExecutor.instance) {
      CampaignExecutor.instance = new CampaignExecutor()
    }
    return CampaignExecutor.instance
  }

  /**
   * Process all active campaigns. Called by the cron worker.
   */
  async processActiveCampaigns(): Promise<{
    campaignsProcessed: number
    callsMade: number
    errors: number
  }> {
    let callsMade = 0
    let errors = 0

    try {
      // Get active campaigns
      const { data: campaigns, error } = await supabase
        .from('voice_campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error || !campaigns || campaigns.length === 0) {
        return { campaignsProcessed: 0, callsMade: 0, errors: 0 }
      }

      for (const campaignRow of campaigns) {
        try {
          const campaign = this.mapRowToCampaign(campaignRow)

          // Check if within schedule
          if (!this.isWithinSchedule(campaign)) {
            continue
          }

          // Check daily limit
          if (this.isDailyLimitReached(campaign)) {
            continue
          }

          // Get pending targets
          const pendingTargets = campaign.targets.filter(
            t => t.status === 'pending' || (t.status === 'no_answer' && t.attemptCount < 3)
          )

          if (pendingTargets.length === 0) {
            // All targets processed - mark campaign complete
            await this.completeCampaign(campaign.id)
            continue
          }

          // Process up to MAX_CALLS_PER_CYCLE targets
          const batch = pendingTargets.slice(0, MAX_CALLS_PER_CYCLE)

          for (const target of batch) {
            try {
              await this.makeCall(campaign, target)
              callsMade++
              // Space out calls
              await this.sleep(CALL_SPACING_MS)
            } catch (err) {
              errors++
              console.error(`[CampaignExecutor] Call failed for ${target.phone}:`, err)
              await this.updateTargetStatus(campaign.id, target.phone, 'failed')
            }
          }

          // Update campaign stats
          await this.updateCampaignStats(campaign.id)
        } catch (err) {
          errors++
          console.error(`[CampaignExecutor] Campaign processing error:`, err)
        }
      }

      return {
        campaignsProcessed: campaigns.length,
        callsMade,
        errors,
      }
    } catch (err) {
      console.error('[CampaignExecutor] Fatal error:', err)
      return { campaignsProcessed: 0, callsMade: 0, errors: 1 }
    }
  }

  /**
   * Make an outbound call to a campaign target
   */
  private async makeCall(campaign: Campaign, target: CampaignTarget): Promise<void> {
    if (!VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY not configured')
    }

    // Check credits before making outbound call (minimum 2 minutes worth)
    const minCredits = CreditCost.VOICE_CALL_OUTBOUND * 2
    const hasCredits = true /* minutes system: included feature */
    if (!hasCredits) {
      console.warn(`[CampaignExecutor] Business ${campaign.businessId} out of credits, skipping call to ${target.phone}`)
      await this.updateTargetStatus(campaign.id, target.phone, 'skipped_no_credits')
      return
    }

    // Get the phone employee's VAPI assistant ID
    let assistantId: string | null = null

    if (campaign.employeeId) {
      const { data: employee } = await supabase
        .from('phone_employees')
        .select('vapi_assistant_id')
        .eq('id', campaign.employeeId)
        .single()

      assistantId = employee?.vapi_assistant_id
    }

    // Fallback to business's default agent
    if (!assistantId) {
      const { data: business } = await supabase
        .from('businesses')
        .select('agent_id')
        .eq('id', campaign.businessId)
        .single()

      assistantId = business?.agent_id
    }

    if (!assistantId) {
      throw new Error('No VAPI assistant configured')
    }

    // Mark target as calling
    await this.updateTargetStatus(campaign.id, target.phone, 'calling')

    // Make the outbound call
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        customer: {
          number: target.phone,
          name: target.name || 'Customer',
        },
        assistantOverrides: {
          firstMessage: campaign.firstMessage || undefined,
          metadata: {
            businessId: campaign.businessId,
            campaignId: campaign.id,
            campaignName: campaign.name,
            callType: 'outbound_campaign',
            targetName: target.name,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`VAPI call failed: ${errorData.message || response.statusText}`)
    }

    const result = await response.json()

    // Update target with call ID
    await this.updateTargetWithCall(campaign.id, target.phone, result.id)

    // Log the outbound call
    await supabase.from('employee_calls').insert({
      call_id: result.id,
      business_id: campaign.businessId,
      employee_id: campaign.employeeId || null,
      status: 'initiating',
      customer_phone: target.phone,
      metadata: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        callType: 'outbound_campaign',
      },
      created_at: new Date().toISOString(),
    })

    console.log(`[CampaignExecutor] Call initiated: ${result.id} -> ${target.phone}`)
  }

  /**
   * Check if current time is within campaign schedule
   */
  private isWithinSchedule(campaign: Campaign): boolean {
    if (!campaign.schedule) return true

    const tz = campaign.schedule.timezone || 'America/Los_Angeles'
    const now = new Date()

    // Check day of week
    if (campaign.schedule.daysOfWeek) {
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      const currentDay = dayMap[formatter.format(now)] || 0

      if (!campaign.schedule.daysOfWeek.includes(currentDay)) {
        return false
      }
    }

    // Check business hours
    if (campaign.schedule.startTime && campaign.schedule.endTime) {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const currentTime = timeFormatter.format(now)

      if (currentTime < campaign.schedule.startTime || currentTime > campaign.schedule.endTime) {
        return false
      }
    }

    return true
  }

  /**
   * Check if daily call limit has been reached
   */
  private isDailyLimitReached(campaign: Campaign): boolean {
    if (!campaign.schedule?.maxCallsPerDay) return false

    const todaysCalls = campaign.targets.filter(t => {
      if (!t.lastAttemptAt) return false
      const attemptDate = new Date(t.lastAttemptAt).toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      return attemptDate === today
    }).length

    return todaysCalls >= campaign.schedule.maxCallsPerDay
  }

  // ============================================
  // DATABASE HELPERS
  // ============================================

  private async updateTargetStatus(campaignId: string, phone: string, status: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('voice_campaigns')
      .select('targets')
      .eq('id', campaignId)
      .single()

    if (!campaign) return

    const targets = (campaign.targets || []).map((t: any) => {
      if (t.phone === phone) {
        return {
          ...t,
          status,
          attemptCount: (t.attemptCount || 0) + (status === 'calling' ? 0 : 1),
          lastAttemptAt: new Date().toISOString(),
        }
      }
      return t
    })

    await supabase
      .from('voice_campaigns')
      .update({ targets, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
  }

  private async updateTargetWithCall(campaignId: string, phone: string, callId: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('voice_campaigns')
      .select('targets')
      .eq('id', campaignId)
      .single()

    if (!campaign) return

    const targets = (campaign.targets || []).map((t: any) => {
      if (t.phone === phone) {
        return { ...t, callId, status: 'calling', lastAttemptAt: new Date().toISOString() }
      }
      return t
    })

    await supabase
      .from('voice_campaigns')
      .update({ targets, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
  }

  private async updateCampaignStats(campaignId: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('voice_campaigns')
      .select('targets')
      .eq('id', campaignId)
      .single()

    if (!campaign) return

    const targets = campaign.targets || []
    const stats = {
      totalTargets: targets.length,
      called: targets.filter((t: any) => t.status !== 'pending').length,
      connected: targets.filter((t: any) => t.status === 'completed').length,
      noAnswer: targets.filter((t: any) => t.status === 'no_answer').length,
      voicemail: targets.filter((t: any) => t.status === 'voicemail').length,
      failed: targets.filter((t: any) => t.status === 'failed').length,
    }

    await supabase
      .from('voice_campaigns')
      .update({ stats, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
  }

  private async completeCampaign(campaignId: string): Promise<void> {
    await supabase
      .from('voice_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    console.log(`[CampaignExecutor] Campaign completed: ${campaignId}`)
  }

  private mapRowToCampaign(row: any): Campaign {
    return {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      status: row.status,
      employeeId: row.employee_id,
      firstMessage: row.first_message,
      targets: row.targets || [],
      schedule: row.schedule,
      stats: row.stats || {
        totalTargets: 0, called: 0, connected: 0,
        noAnswer: 0, voicemail: 0, failed: 0,
      },
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton
export const campaignExecutor = CampaignExecutor.getInstance()
