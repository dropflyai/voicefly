/**
 * MEMORY Layer — Context & Learning Tools
 * Remember interactions, track prospects, and build playbooks
 */

import { supabase } from '../lib/supabase.js'

const DEFAULT_BIZ = process.env.VOICEFLY_BUSINESS_ID || ''

function bizId(args: any): string {
  return args.business_id || DEFAULT_BIZ
}

export const memoryTools = [
  {
    name: 'log_interaction',
    description: 'Record an interaction with a prospect or customer — call, email, SMS, meeting, or note. Used to build a timeline.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        interaction_type: { type: 'string', enum: ['call', 'email', 'sms', 'meeting', 'note', 'demo'] },
        subject: { type: 'string', description: 'Brief description of the interaction' },
        content: { type: 'string', description: 'Full details of what happened' },
        contact_name: { type: 'string' },
        contact_phone: { type: 'string' },
        contact_email: { type: 'string' },
        metadata: { type: 'object', description: 'Additional structured data (outcome, next steps, etc.)' },
      },
      required: ['interaction_type', 'subject', 'content'],
    },
  },
  {
    name: 'log_learning',
    description: 'Record something the agent learned — a pattern, insight, or recommendation for the product/business. This builds institutional knowledge.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string', description: 'What was learned (e.g. "Customers ask about X but we don\'t support it")' },
        content: { type: 'string', description: 'Detailed explanation and recommendation' },
        category: { type: 'string', enum: ['product_gap', 'customer_pattern', 'sales_insight', 'technical_issue', 'feature_request', 'competitive_intel'] },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['subject', 'content', 'category'],
    },
  },
  {
    name: 'get_prospect_history',
    description: 'Get the full interaction timeline for a prospect/customer by phone number or email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        phone: { type: 'string', description: 'Phone number to search' },
        email: { type: 'string', description: 'Email to search' },
        name: { type: 'string', description: 'Name to search' },
      },
    },
  },
  {
    name: 'get_customer_health',
    description: 'Assess the health of a customer account — usage trends, recent activity, support requests, engagement level',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'The customer\'s business ID' },
      },
      required: ['business_id'],
    },
  },
  {
    name: 'get_learnings',
    description: 'Retrieve past learnings/insights logged by the agent, optionally filtered by category',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['product_gap', 'customer_pattern', 'sales_insight', 'technical_issue', 'feature_request', 'competitive_intel'] },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_playbook',
    description: 'Get proven strategies and scripts — what has worked before for sales, onboarding, retention',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['sales', 'onboarding', 'retention', 'support', 'upsell'] },
      },
    },
  },
  {
    name: 'save_playbook',
    description: 'Save a new playbook entry — a strategy, script, or approach that worked',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['sales', 'onboarding', 'retention', 'support', 'upsell'] },
        title: { type: 'string' },
        content: { type: 'string', description: 'The strategy, script, or approach' },
        effectiveness_score: { type: 'number', description: '0.0 to 1.0 — how well this worked' },
      },
      required: ['category', 'title', 'content'],
    },
  },
]

export async function handleMemoryTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'log_interaction': {
      const { data, error } = await supabase
        .from('mcp_agent_interactions')
        .insert({
          business_id: args.business_id || null,
          interaction_type: args.interaction_type,
          subject: args.subject,
          content: args.content,
          contact_name: args.contact_name,
          contact_phone: args.contact_phone,
          contact_email: args.contact_email,
          metadata: args.metadata || {},
        })
        .select()
        .single()
      if (error) throw error
      return JSON.stringify({ success: true, id: data.id })
    }

    case 'log_learning': {
      const { data, error } = await supabase
        .from('mcp_agent_interactions')
        .insert({
          interaction_type: 'learning',
          subject: args.subject,
          content: args.content,
          metadata: {
            category: args.category,
            severity: args.severity || 'medium',
          },
        })
        .select()
        .single()
      if (error) throw error
      return JSON.stringify({ success: true, id: data.id, message: `Learning logged: ${args.subject}` })
    }

    case 'get_prospect_history': {
      const results: any[] = []

      // Search agent interactions
      let query = supabase
        .from('mcp_agent_interactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (args.phone) query = query.eq('contact_phone', args.phone)
      else if (args.email) query = query.eq('contact_email', args.email)
      else if (args.name) query = query.ilike('contact_name', `%${args.name}%`)
      else return JSON.stringify({ error: 'Provide phone, email, or name to search' })

      const { data: interactions } = await query
      if (interactions) results.push(...interactions.map(i => ({ source: 'agent_interaction', ...i })))

      // Search call logs
      if (args.phone) {
        const { data: calls } = await supabase
          .from('employee_calls')
          .select('id, caller_number, duration_seconds, summary, status, created_at, phone_employees(name)')
          .eq('caller_number', args.phone)
          .order('created_at', { ascending: false })
          .limit(20)
        if (calls) results.push(...calls.map(c => ({ source: 'call', ...c })))
      }

      // Search phone messages
      if (args.phone) {
        const { data: msgs } = await supabase
          .from('phone_messages')
          .select('id, caller_name, caller_phone, reason, full_message, urgency, status, created_at')
          .eq('caller_phone', args.phone)
          .order('created_at', { ascending: false })
          .limit(20)
        if (msgs) results.push(...msgs.map(m => ({ source: 'message', ...m })))
      }

      // Sort all by date
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return JSON.stringify({
        search: { phone: args.phone, email: args.email, name: args.name },
        total_interactions: results.length,
        timeline: results,
      }, null, 2)
    }

    case 'get_customer_health': {
      const bId = args.business_id
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [business, calls30d, calls7d, messages, employees] = await Promise.all([
        supabase.from('businesses').select('name, subscription_tier, subscription_status, created_at, monthly_credits, credits_used_this_month').eq('id', bId).single(),
        supabase.from('employee_calls').select('id', { count: 'exact' }).eq('business_id', bId).gte('created_at', thirtyDaysAgo),
        supabase.from('employee_calls').select('id', { count: 'exact' }).eq('business_id', bId).gte('created_at', sevenDaysAgo),
        supabase.from('phone_messages').select('id, status', { count: 'exact' }).eq('business_id', bId),
        supabase.from('phone_employees').select('id, is_active').eq('business_id', bId),
      ])

      const activeEmployees = (employees.data || []).filter(e => e.is_active).length
      const usageRate = business.data?.monthly_credits ?
        Math.round((business.data.credits_used_this_month || 0) / business.data.monthly_credits * 100) : 0

      let healthScore = 100
      if ((calls7d.count || 0) === 0) healthScore -= 30 // No recent activity
      if (activeEmployees === 0) healthScore -= 25 // No active employees
      if (usageRate < 10) healthScore -= 15 // Very low usage
      if (business.data?.subscription_status === 'trial') healthScore -= 10

      const healthLabel = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'at_risk' : 'critical'

      return JSON.stringify({
        business: business.data?.name,
        plan: business.data?.subscription_tier,
        status: business.data?.subscription_status,
        health_score: healthScore,
        health_label: healthLabel,
        activity: {
          calls_last_7d: calls7d.count || 0,
          calls_last_30d: calls30d.count || 0,
          total_messages: messages.count || 0,
          active_employees: activeEmployees,
          total_employees: (employees.data || []).length,
        },
        usage: {
          credits_used: business.data?.credits_used_this_month || 0,
          credits_total: business.data?.monthly_credits || 0,
          usage_percent: usageRate,
        },
        recommendations: [
          ...(healthScore < 50 ? ['URGENT: Customer showing signs of churn — reach out immediately'] : []),
          ...((calls7d.count || 0) === 0 ? ['No calls in 7 days — check if employee is configured correctly'] : []),
          ...(activeEmployees === 0 ? ['No active employees — help customer set up their first employee'] : []),
          ...(usageRate > 80 ? ['Usage over 80% — suggest upgrading plan'] : []),
          ...(usageRate < 10 && business.data?.subscription_status === 'active' ? ['Very low usage on paid plan — check if customer needs help'] : []),
        ],
      }, null, 2)
    }

    case 'get_learnings': {
      let query = supabase
        .from('mcp_agent_interactions')
        .select('*')
        .eq('interaction_type', 'learning')
        .order('created_at', { ascending: false })
        .limit(args.limit || 20)

      if (args.category) {
        query = query.eq('metadata->>category', args.category)
      }

      const { data, error } = await query
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'get_playbook': {
      let query = supabase
        .from('mcp_playbooks')
        .select('*')
        .order('effectiveness_score', { ascending: false })

      if (args.category) query = query.eq('category', args.category)

      const { data, error } = await query
      if (error) {
        // Table might not exist yet
        return JSON.stringify({ playbooks: [], message: 'No playbooks saved yet. Use save_playbook to create one.' })
      }
      return JSON.stringify({ playbooks: data || [] }, null, 2)
    }

    case 'save_playbook': {
      const { data, error } = await supabase
        .from('mcp_playbooks')
        .insert({
          category: args.category,
          title: args.title,
          content: args.content,
          effectiveness_score: args.effectiveness_score || 0.5,
        })
        .select()
        .single()
      if (error) throw error
      return JSON.stringify({ success: true, id: data.id, message: `Playbook saved: ${args.title}` })
    }

    default:
      throw new Error(`Unknown memory tool: ${name}`)
  }
}
