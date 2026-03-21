#!/usr/bin/env npx tsx
/**
 * VoiceFly MCP Server
 *
 * Exposes VoiceFly's API as MCP tools for AI agents.
 * Enables: customer onboarding, employee management, call analytics,
 * billing, lead management, and integration control.
 *
 * Usage in .mcp.json:
 * {
 *   "voicefly": {
 *     "command": "npx",
 *     "args": ["tsx", "/Users/dropfly/VoiceFly/mcp/server.ts"],
 *     "env": {
 *       "VOICEFLY_API_URL": "https://www.voiceflyai.com",
 *       "VOICEFLY_API_TOKEN": "...",
 *       "VOICEFLY_BUSINESS_ID": "..."
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const API_URL = process.env.VOICEFLY_API_URL || 'https://www.voiceflyai.com'
const API_TOKEN = process.env.VOICEFLY_API_TOKEN || ''
const DEFAULT_BUSINESS_ID = process.env.VOICEFLY_BUSINESS_ID || ''

async function api(method: string, path: string, body?: any, query?: Record<string, string>): Promise<any> {
  let url = `${API_URL}/api${path}`
  if (query) {
    const params = new URLSearchParams(query)
    url += `?${params}`
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${data?.error || data?.message || response.statusText}`)
  }

  return data
}

const server = new Server(
  { name: 'voicefly', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

// ============================================================================
// Tool Definitions
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── Customer Onboarding ──
    {
      name: 'onboard_customer',
      description: 'Complete customer onboarding — creates business, AI employee, assigns phone number, sends welcome email. This is the "yes → live in 10 minutes" flow.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID (from signup)' },
          industry: { type: 'string', description: 'Business industry (dental, salon, auto, restaurant, law, nonprofit, etc.)' },
          address: { type: 'string', description: 'Business address' },
          hours_note: { type: 'string', description: 'Business hours description' },
          employee_type: { type: 'string', enum: ['receptionist', 'appointment-scheduler', 'order-taker', 'customer-service', 'restaurant-host', 'after-hours-emergency'], description: 'Type of AI employee' },
          employee_name: { type: 'string', description: 'Name for the AI employee' },
          voice_id: { type: 'string', description: 'ElevenLabs voice ID' },
          greeting: { type: 'string', description: 'Custom greeting the AI says when answering' },
          services: { type: 'string', description: 'Business services description' },
          escalation_phone: { type: 'string', description: 'Phone number to forward urgent calls to' },
          area_code: { type: 'string', description: 'Preferred area code for the AI phone number' },
          extra_knowledge: { type: 'object', description: 'Additional context: { businessDescription, faqs, staff, policies }' },
        },
        required: ['business_id', 'industry', 'employee_type', 'employee_name'],
      },
    },

    // ── Phone Employee Management ──
    {
      name: 'create_employee',
      description: 'Create a new AI phone employee for a business.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          job_type: { type: 'string', enum: ['receptionist', 'appointment-scheduler', 'order-taker', 'customer-service', 'restaurant-host', 'after-hours-emergency', 'lead-qualifier'], description: 'Employee job type' },
          name: { type: 'string', description: 'Employee name' },
          provision_phone: { type: 'boolean', description: 'Auto-assign a phone number. Default: true' },
          area_code: { type: 'string', description: 'Preferred area code' },
        },
        required: ['business_id', 'job_type', 'name'],
      },
    },
    {
      name: 'list_employees',
      description: 'List all AI employees for a business.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID. Defaults to configured business.' },
        },
      },
    },
    {
      name: 'get_employee',
      description: 'Get detailed info about an AI employee — config, personality, voice, schedule, phone number.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          employee_id: { type: 'string', description: 'Employee UUID' },
          business_id: { type: 'string', description: 'Business UUID' },
        },
        required: ['employee_id'],
      },
    },
    {
      name: 'update_employee',
      description: 'Update an AI employee — change greeting, FAQ answers, services, personality, voice, schedule.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          employee_id: { type: 'string', description: 'Employee UUID' },
          business_id: { type: 'string', description: 'Business UUID' },
          name: { type: 'string', description: 'New name' },
          job_config: { type: 'object', description: 'Updated job configuration (greeting, services, FAQs, etc.)' },
          personality: { type: 'object', description: 'Updated personality (tone, enthusiasm, formality)' },
          voice: { type: 'object', description: 'Updated voice config (provider, voiceId, speed, stability)' },
          schedule: { type: 'object', description: 'Updated schedule (timezone, business hours)' },
          is_active: { type: 'boolean', description: 'Enable/disable employee' },
        },
        required: ['employee_id'],
      },
    },
    {
      name: 'generate_config_from_website',
      description: 'AI-generate employee config by scraping a business website. Extracts services, hours, FAQ answers.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          url: { type: 'string', description: 'Business website URL to scrape' },
          business_id: { type: 'string', description: 'Business UUID' },
        },
        required: ['url'],
      },
    },

    // ── Business Management ──
    {
      name: 'get_business',
      description: 'Get business details — name, phone, address, subscription, settings.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID. Defaults to configured business.' },
        },
      },
    },
    {
      name: 'update_business',
      description: 'Update business profile — name, address, timezone, settings.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          website: { type: 'string' },
          address_line1: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postal_code: { type: 'string' },
          timezone: { type: 'string' },
        },
        required: ['business_id'],
      },
    },

    // ── Call Logs & Analytics ──
    {
      name: 'get_call_logs',
      description: 'Get call history for a business — caller info, transcripts, outcomes.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          limit: { type: 'number', description: 'Max results. Default: 50' },
        },
      },
    },
    {
      name: 'get_conversations',
      description: 'Get SMS conversation threads for a business.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          employee_id: { type: 'string', description: 'Filter by employee' },
        },
      },
    },

    // ── Leads ──
    {
      name: 'list_leads',
      description: 'List all leads captured by AI employees — name, phone, email, score, source.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          status: { type: 'string', description: 'Filter: hot, warm, cold, new' },
          limit: { type: 'number', description: 'Max results. Default: 50' },
        },
      },
    },
    {
      name: 'create_lead',
      description: 'Manually create a lead.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          contact_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company_name: { type: 'string' },
          source: { type: 'string', enum: ['phone', 'web', 'email', 'chat', 'referral', 'manual'] },
          notes: { type: 'string' },
        },
        required: ['business_id', 'contact_name'],
      },
    },

    // ── Appointments ──
    {
      name: 'list_appointments',
      description: 'List appointments for a business.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          date: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
          status: { type: 'string', description: 'Filter: pending, confirmed, completed, cancelled' },
        },
      },
    },
    {
      name: 'create_appointment',
      description: 'Book an appointment.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
          customer_phone: { type: 'string' },
          customer_first_name: { type: 'string' },
          customer_last_name: { type: 'string' },
          customer_email: { type: 'string' },
          service_id: { type: 'string' },
          appointment_date: { type: 'string', description: 'YYYY-MM-DD' },
          start_time: { type: 'string', description: 'HH:MM' },
          notes: { type: 'string' },
        },
        required: ['business_id', 'customer_phone', 'customer_first_name', 'appointment_date', 'start_time'],
      },
    },

    // ── Billing ──
    {
      name: 'get_billing_info',
      description: 'Get current subscription plan, billing status, and payment method.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
        },
      },
    },
    {
      name: 'get_credit_balance',
      description: 'Check remaining call minutes/credits.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
        },
      },
    },

    // ── Integrations ──
    {
      name: 'list_integrations',
      description: 'List connected integrations (Calendly, HubSpot, Square, Toast, etc.).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
        },
      },
    },

    // ── Services ──
    {
      name: 'list_services',
      description: 'List services offered by a business (used for appointment booking).',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
        },
      },
    },

    // ── Trial ──
    {
      name: 'get_trial_usage',
      description: 'Check trial usage — calls made, minutes used, minutes remaining.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          business_id: { type: 'string', description: 'Business UUID' },
        },
      },
    },

    // ── Admin ──
    {
      name: 'get_dashboard_stats',
      description: 'Get admin dashboard stats — total businesses, calls, leads, revenue.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'get_support_analytics',
      description: 'Get support analytics — resolution rate, top queries, unresolved issues.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ],
}))

// ============================================================================
// Tool Handlers
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const bizId = (args.business_id as string) || DEFAULT_BUSINESS_ID

  try {
    let result: any

    switch (name) {
      // ── Onboarding ──
      case 'onboard_customer':
        result = await api('POST', '/onboarding/complete', {
          businessId: args.business_id,
          industry: args.industry,
          address: args.address,
          hoursNote: args.hours_note,
          employeeType: args.employee_type,
          employeeName: args.employee_name,
          voiceId: args.voice_id,
          greeting: args.greeting,
          services: args.services,
          escalationPhone: args.escalation_phone,
          areaCode: args.area_code,
          extraKnowledge: args.extra_knowledge,
        })
        break

      // ── Employees ──
      case 'create_employee':
        result = await api('POST', '/phone-employees', {
          businessId: args.business_id,
          jobType: args.job_type,
          name: args.name,
          provisionPhone: args.provision_phone !== false,
          phoneMode: 'vapi-only',
          areaCode: args.area_code,
        })
        break
      case 'list_employees':
        result = await api('GET', '/phone-employees', undefined, { businessId: bizId })
        break
      case 'get_employee':
        result = await api('GET', `/phone-employees/${args.employee_id}`, undefined, { businessId: bizId })
        break
      case 'update_employee':
        result = await api('PATCH', `/phone-employees/${args.employee_id}`, {
          businessId: bizId,
          name: args.name,
          jobConfig: args.job_config,
          personality: args.personality,
          voice: args.voice,
          schedule: args.schedule,
          isActive: args.is_active,
        })
        break
      case 'generate_config_from_website':
        result = await api('POST', '/phone-employees/extract-from-website', {
          url: args.url,
          businessId: bizId,
        })
        break

      // ── Business ──
      case 'get_business':
        result = await api('GET', '/business', undefined, { businessId: bizId })
        break
      case 'update_business':
        result = await api('PATCH', '/business', args, { businessId: bizId })
        break

      // ── Calls & Conversations ──
      case 'get_call_logs':
        result = await api('GET', '/voice-calls', undefined, { businessId: bizId })
        break
      case 'get_conversations':
        result = await api('GET', '/conversations', undefined, {
          businessId: bizId,
          ...(args.employee_id ? { employeeId: args.employee_id as string } : {}),
        })
        break

      // ── Leads ──
      case 'list_leads': {
        const leadQuery: Record<string, string> = { businessId: bizId }
        if (args.status) leadQuery.status = args.status as string
        if (args.limit) leadQuery.limit = String(args.limit)
        result = await api('GET', '/leads', undefined, leadQuery)
        break
      }
      case 'create_lead':
        result = await api('POST', '/leads', {
          businessId: bizId,
          contact_name: args.contact_name,
          email: args.email,
          phone: args.phone,
          company_name: args.company_name,
          source: args.source || 'manual',
          notes: args.notes,
        })
        break

      // ── Appointments ──
      case 'list_appointments': {
        const apptQuery: Record<string, string> = { businessId: bizId }
        if (args.date) apptQuery.date = args.date as string
        if (args.status) apptQuery.status = args.status as string
        result = await api('GET', '/appointments', undefined, apptQuery)
        break
      }
      case 'create_appointment':
        result = await api('POST', '/appointments', {
          businessId: bizId,
          customer_phone: args.customer_phone,
          customer_first_name: args.customer_first_name,
          customer_last_name: args.customer_last_name,
          customer_email: args.customer_email,
          service_id: args.service_id,
          appointment_date: args.appointment_date,
          start_time: args.start_time,
          notes: args.notes,
          booking_source: 'ai-agent',
        })
        break

      // ── Billing ──
      case 'get_billing_info':
        result = await api('GET', '/billing/info', undefined, { businessId: bizId })
        break
      case 'get_credit_balance':
        result = await api('GET', '/credits/balance', undefined, { businessId: bizId })
        break

      // ── Integrations ──
      case 'list_integrations':
        result = await api('GET', '/integrations', undefined, { businessId: bizId })
        break

      // ── Services ──
      case 'list_services':
        result = await api('GET', `/services`, undefined, { businessId: bizId })
        break

      // ── Trial ──
      case 'get_trial_usage':
        result = await api('GET', '/trial/usage', undefined, { businessId: bizId })
        break

      // ── Admin ──
      case 'get_dashboard_stats':
        result = await api('GET', '/admin/stats')
        break
      case 'get_support_analytics':
        result = await api('GET', '/admin/support-analytics')
        break

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
    }
  }
})

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[voicefly-mcp] Server running')
  console.error(`[voicefly-mcp] API: ${API_URL}`)
}

main().catch((error) => {
  console.error('[voicefly-mcp] Fatal error:', error)
  process.exit(1)
})
