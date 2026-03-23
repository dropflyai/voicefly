/**
 * EYES Layer — Awareness Tools
 * Monitor metrics, health, and business state
 */

import { supabase } from '../lib/supabase.js'
import { stripe } from '../lib/stripe.js'

const DEFAULT_BIZ = process.env.VOICEFLY_BUSINESS_ID || ''

function bizId(args: any): string {
  return args.business_id || DEFAULT_BIZ
}

export const eyesTools = [
  {
    name: 'get_dashboard_summary',
    description: 'Get a snapshot of a business: calls today, messages, orders, active employees, credits remaining',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_system_health',
    description: 'Check health of all employees — which are active, failing, or have issues. Also checks integration status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_subscription_status',
    description: 'Get current plan, credit usage, overage risk, and billing details for a business',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_growth_metrics',
    description: 'Platform-wide growth metrics: total businesses, signups over time, plan distribution, active vs churned',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_revenue_metrics',
    description: 'Revenue metrics from Stripe: MRR, subscription counts by tier, recent charges',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_product_state',
    description: 'Current state of VoiceFly product: features built, integrations available, known limitations, roadmap items',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
]

export async function handleEyesTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'get_dashboard_summary': {
      const bId = bizId(args)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [employees, callsToday, callsWeek, messages, orders, business] = await Promise.all([
        supabase.from('phone_employees').select('id, name, is_active, job_type').eq('business_id', bId),
        supabase.from('employee_calls').select('id', { count: 'exact' }).eq('business_id', bId).gte('created_at', todayStart),
        supabase.from('employee_calls').select('id', { count: 'exact' }).eq('business_id', bId).gte('created_at', weekAgo),
        supabase.from('phone_messages').select('id, status', { count: 'exact' }).eq('business_id', bId).eq('status', 'new'),
        supabase.from('phone_orders').select('id', { count: 'exact' }).eq('business_id', bId).eq('status', 'pending'),
        supabase.from('businesses').select('name, subscription_tier, subscription_status, monthly_credits, credits_used_this_month').eq('id', bId).single(),
      ])

      return JSON.stringify({
        business: business.data?.name,
        plan: business.data?.subscription_tier,
        status: business.data?.subscription_status,
        employees: {
          total: employees.data?.length || 0,
          active: employees.data?.filter(e => e.is_active).length || 0,
          list: employees.data,
        },
        calls: {
          today: callsToday.count || 0,
          this_week: callsWeek.count || 0,
        },
        unread_messages: messages.count || 0,
        pending_orders: orders.count || 0,
        credits: {
          monthly: business.data?.monthly_credits || 0,
          used: business.data?.credits_used_this_month || 0,
          remaining: (business.data?.monthly_credits || 0) - (business.data?.credits_used_this_month || 0),
        },
      }, null, 2)
    }

    case 'get_system_health': {
      const bId = bizId(args)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      const { data: employees } = await supabase
        .from('phone_employees')
        .select('id, name, job_type, is_active, vapi_assistant_id, phone_number')
        .eq('business_id', bId)

      const healthReport = []
      for (const emp of employees || []) {
        const { count: recentCalls } = await supabase
          .from('employee_calls')
          .select('id', { count: 'exact' })
          .eq('employee_id', emp.id)
          .gte('created_at', twoDaysAgo)

        const { count: failedCalls } = await supabase
          .from('employee_calls')
          .select('id', { count: 'exact' })
          .eq('employee_id', emp.id)
          .gte('created_at', twoDaysAgo)
          .lt('duration_seconds', 10)

        const issues = []
        if (!emp.is_active) issues.push('PAUSED')
        if (!emp.vapi_assistant_id) issues.push('NO_VAPI_ASSISTANT')
        if (!emp.phone_number) issues.push('NO_PHONE_NUMBER')
        if (failedCalls && recentCalls && failedCalls > recentCalls * 0.5) issues.push('HIGH_FAILURE_RATE')

        healthReport.push({
          name: emp.name,
          job_type: emp.job_type,
          status: issues.length === 0 ? 'healthy' : 'issues',
          issues,
          recent_calls_48h: recentCalls || 0,
          short_calls_48h: failedCalls || 0,
        })
      }

      return JSON.stringify({ employees: healthReport }, null, 2)
    }

    case 'get_subscription_status': {
      const bId = bizId(args)
      const { data } = await supabase
        .from('businesses')
        .select('name, subscription_tier, subscription_status, monthly_credits, purchased_credits, credits_used_this_month, credits_reset_date, stripe_customer_id')
        .eq('id', bId)
        .single()

      if (!data) return JSON.stringify({ error: 'Business not found' })

      const remaining = (data.monthly_credits || 0) + (data.purchased_credits || 0) - (data.credits_used_this_month || 0)
      const total = (data.monthly_credits || 0) + (data.purchased_credits || 0)
      const usagePercent = total > 0 ? Math.round((data.credits_used_this_month || 0) / total * 100) : 0

      return JSON.stringify({
        ...data,
        credits_remaining: remaining,
        usage_percent: usagePercent,
        overage_risk: usagePercent > 80 ? 'HIGH' : usagePercent > 60 ? 'MEDIUM' : 'LOW',
      }, null, 2)
    }

    case 'get_growth_metrics': {
      const [allBiz, activeBiz, trialBiz] = await Promise.all([
        supabase.from('businesses').select('id', { count: 'exact' }),
        supabase.from('businesses').select('id', { count: 'exact' }).eq('subscription_status', 'active'),
        supabase.from('businesses').select('id', { count: 'exact' }).eq('subscription_status', 'trial'),
      ])

      const { data: tierDist } = await supabase
        .from('businesses')
        .select('subscription_tier')

      const tiers: Record<string, number> = {}
      for (const b of tierDist || []) {
        tiers[b.subscription_tier] = (tiers[b.subscription_tier] || 0) + 1
      }

      return JSON.stringify({
        total_businesses: allBiz.count || 0,
        active_subscriptions: activeBiz.count || 0,
        active_trials: trialBiz.count || 0,
        tier_distribution: tiers,
      }, null, 2)
    }

    case 'get_revenue_metrics': {
      const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active' })
      let mrr = 0
      const tierCounts: Record<string, number> = {}

      for (const sub of subscriptions.data) {
        const amount = sub.items.data[0]?.price?.unit_amount || 0
        mrr += amount / 100
        const tier = sub.items.data[0]?.price?.metadata?.tier || sub.items.data[0]?.price?.product || 'unknown'
        tierCounts[String(tier)] = (tierCounts[String(tier)] || 0) + 1
      }

      return JSON.stringify({
        mrr: Math.round(mrr * 100) / 100,
        active_subscriptions: subscriptions.data.length,
        tier_counts: tierCounts,
      }, null, 2)
    }

    case 'get_product_state': {
      return JSON.stringify({
        version: '1.0-beta',
        features_built: [
          'AI phone employees (9 job types)',
          'VAPI voice AI integration',
          'Google Calendar integration',
          'Calendly integration (OAuth flow)',
          'Square POS integration',
          'HubSpot CRM integration',
          'Twilio SMS (A2P 10DLC registered)',
          'Stripe billing (3-tier: Starter $49, Growth $129, Pro $249)',
          'Credit system with overage billing',
          'Call transcripts and recordings',
          'Phone message system with callbacks',
          'Order taking system',
          'Appointment booking and calendar',
          'Google OAuth sign-in',
          'Employee hire wizard (6-step)',
          'AI-powered employee configuration (Maya trainer)',
          'Multi-tenant business isolation',
          'Demo page with live AI conversations',
        ],
        integrations_available: ['Google Calendar', 'Calendly', 'Square', 'HubSpot'],
        integrations_coming: ['Toast POS', 'Shopify', 'Clover', 'Salesforce'],
        known_limitations: [
          'SMS pending A2P 10DLC campaign vetting (~2 weeks)',
          'Apple Sign-In not yet configured (Coming Soon badge)',
          'Vercel production builds failing (flag definitions error) — using preview+promote workaround',
          'No email notification system yet (SendGrid placeholder)',
        ],
        roadmap: [
          'Apple Sign-In',
          'Email notifications via SendGrid/Resend',
          'Outbound calling campaigns',
          'White-label solution',
          'API access for customers',
          'Advanced analytics dashboard',
        ],
      }, null, 2)
    }

    default:
      throw new Error(`Unknown eyes tool: ${name}`)
  }
}
