/**
 * EARS Layer — Feedback & Call Intelligence Tools
 * Listen to what's happening with calls, messages, and customer interactions
 */

import { supabase } from '../lib/supabase.js'

const DEFAULT_BIZ = process.env.VOICEFLY_BUSINESS_ID || ''

function bizId(args: any): string {
  return args.business_id || DEFAULT_BIZ
}

export const earsTools = [
  {
    name: 'list_calls',
    description: 'List recent calls with filters — by employee, date range, direction, or minimum duration',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        employee_id: { type: 'string' },
        direction: { type: 'string', enum: ['inbound', 'outbound'] },
        since: { type: 'string', description: 'ISO date string — only calls after this date' },
        min_duration: { type: 'number', description: 'Minimum call duration in seconds' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
    },
  },
  {
    name: 'get_call_detail',
    description: 'Get full details for a single call: transcript, recording URL, cost, duration, summary',
    inputSchema: {
      type: 'object' as const,
      properties: {
        call_id: { type: 'string' },
      },
      required: ['call_id'],
    },
  },
  {
    name: 'list_messages',
    description: 'List phone messages taken during calls — filter by status (new, read, resolved), urgency, or employee',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        status: { type: 'string', enum: ['new', 'read', 'in_progress', 'resolved'] },
        urgency: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
        employee_id: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'list_conversations',
    description: 'List SMS conversation threads grouped by phone number',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_call_insights',
    description: 'Analyze recent calls to identify patterns: common questions, failure reasons, unanswered topics, caller sentiment',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        days: { type: 'number', description: 'Number of days to analyze (default 7)' },
      },
    },
  },
  {
    name: 'get_call_issues',
    description: 'Find problematic calls: very short calls, failed calls, complaints, or calls where the AI couldn\'t help',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        days: { type: 'number', description: 'Number of days to look back (default 7)' },
      },
    },
  },
  {
    name: 'get_customer_feedback',
    description: 'Aggregate customer feedback: message urgency distribution, callback requests, common themes',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
      },
    },
  },
]

export async function handleEarsTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'list_calls': {
      let query = supabase
        .from('employee_calls')
        .select('id, employee_id, caller_number, direction, status, duration_seconds, summary, cost, created_at, phone_employees(name)')
        .eq('business_id', bizId(args))
        .order('created_at', { ascending: false })
        .limit(args.limit || 20)

      if (args.employee_id) query = query.eq('employee_id', args.employee_id)
      if (args.direction) query = query.eq('direction', args.direction)
      if (args.since) query = query.gte('created_at', args.since)
      if (args.min_duration) query = query.gte('duration_seconds', args.min_duration)

      const { data, error } = await query
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'get_call_detail': {
      const { data, error } = await supabase
        .from('employee_calls')
        .select('*, phone_employees(name, job_type)')
        .eq('id', args.call_id)
        .single()
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'list_messages': {
      let query = supabase
        .from('phone_messages')
        .select('id, caller_name, caller_phone, reason, full_message, urgency, status, callback_requested, for_person, created_at, phone_employees(name)')
        .eq('business_id', bizId(args))
        .order('created_at', { ascending: false })
        .limit(args.limit || 20)

      if (args.status) query = query.eq('status', args.status)
      if (args.urgency) query = query.eq('urgency', args.urgency)
      if (args.employee_id) query = query.eq('employee_id', args.employee_id)

      const { data, error } = await query
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'list_conversations': {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('id, phone_number, direction, message_body, employee_id, created_at, phone_employees(name)')
        .eq('business_id', bizId(args))
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(args.limit || 50)
      if (error) throw error

      // Group by phone number
      const threads: Record<string, any[]> = {}
      for (const msg of data || []) {
        const key = msg.phone_number || 'unknown'
        if (!threads[key]) threads[key] = []
        threads[key].push(msg)
      }

      return JSON.stringify({
        total_threads: Object.keys(threads).length,
        threads,
      }, null, 2)
    }

    case 'get_call_insights': {
      const days = args.days || 7
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: calls } = await supabase
        .from('employee_calls')
        .select('duration_seconds, status, summary, transcript')
        .eq('business_id', bizId(args))
        .gte('created_at', since)

      if (!calls || calls.length === 0) {
        return JSON.stringify({ message: 'No calls in the specified period', period_days: days })
      }

      const totalCalls = calls.length
      const avgDuration = Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / totalCalls)
      const shortCalls = calls.filter(c => (c.duration_seconds || 0) < 15).length
      const completedCalls = calls.filter(c => c.status === 'completed').length

      // Extract common topics from summaries
      const summaries = calls.map(c => c.summary || '').filter(Boolean)
      const topicKeywords = ['appointment', 'booking', 'price', 'pricing', 'hours', 'location', 'order', 'menu', 'insurance', 'emergency', 'cancel', 'reschedule']
      const topicCounts: Record<string, number> = {}
      for (const kw of topicKeywords) {
        const count = summaries.filter(s => s.toLowerCase().includes(kw)).length
        if (count > 0) topicCounts[kw] = count
      }

      return JSON.stringify({
        period_days: days,
        total_calls: totalCalls,
        avg_duration_seconds: avgDuration,
        completion_rate: Math.round(completedCalls / totalCalls * 100) + '%',
        short_calls: shortCalls,
        short_call_rate: Math.round(shortCalls / totalCalls * 100) + '%',
        common_topics: topicCounts,
      }, null, 2)
    }

    case 'get_call_issues': {
      const days = args.days || 7
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: shortCalls } = await supabase
        .from('employee_calls')
        .select('id, caller_number, duration_seconds, summary, status, created_at, phone_employees(name)')
        .eq('business_id', bizId(args))
        .gte('created_at', since)
        .lt('duration_seconds', 15)
        .order('created_at', { ascending: false })

      const { data: failedCalls } = await supabase
        .from('employee_calls')
        .select('id, caller_number, duration_seconds, summary, status, created_at, phone_employees(name)')
        .eq('business_id', bizId(args))
        .gte('created_at', since)
        .in('status', ['failed', 'error', 'no-answer'])
        .order('created_at', { ascending: false })

      return JSON.stringify({
        period_days: days,
        short_calls: {
          count: shortCalls?.length || 0,
          calls: shortCalls?.slice(0, 10),
        },
        failed_calls: {
          count: failedCalls?.length || 0,
          calls: failedCalls?.slice(0, 10),
        },
      }, null, 2)
    }

    case 'get_customer_feedback': {
      const { data: messages } = await supabase
        .from('phone_messages')
        .select('urgency, status, callback_requested, reason')
        .eq('business_id', bizId(args))

      const urgencyDist: Record<string, number> = {}
      let callbackRequests = 0
      for (const msg of messages || []) {
        urgencyDist[msg.urgency] = (urgencyDist[msg.urgency] || 0) + 1
        if (msg.callback_requested) callbackRequests++
      }

      const statusDist: Record<string, number> = {}
      for (const msg of messages || []) {
        statusDist[msg.status] = (statusDist[msg.status] || 0) + 1
      }

      return JSON.stringify({
        total_messages: messages?.length || 0,
        urgency_distribution: urgencyDist,
        status_distribution: statusDist,
        callback_requests: callbackRequests,
        pending_callbacks: (messages || []).filter(m => m.callback_requested && m.status !== 'resolved').length,
      }, null, 2)
    }

    default:
      throw new Error(`Unknown ears tool: ${name}`)
  }
}
