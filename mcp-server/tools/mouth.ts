/**
 * MOUTH Layer — Communication Tools
 * Reach out to prospects, customers, and team
 */

import { supabase } from '../lib/supabase.js'
import { sendSms } from '../lib/twilio.js'
import { vapi } from '../lib/vapi.js'

const DEFAULT_BIZ = process.env.VOICEFLY_BUSINESS_ID || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || ''

function bizId(args: any): string {
  return args.business_id || DEFAULT_BIZ
}

export const mouthTools = [
  {
    name: 'send_email',
    description: 'Send an email to a prospect or customer (via Resend)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Email body (plain text or HTML)' },
        from_name: { type: 'string', description: 'Sender name (default: VoiceFly)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'send_customer_sms',
    description: 'Send an SMS to a customer — for nudges, reminders, follow-ups',
    inputSchema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Phone number (E.164 format)' },
        body: { type: 'string', description: 'Message text' },
      },
      required: ['to', 'body'],
    },
  },
  {
    name: 'create_proposal',
    description: 'Generate a custom pitch/proposal text based on a prospect\'s industry, call volume, and pain points',
    inputSchema: {
      type: 'object' as const,
      properties: {
        prospect_name: { type: 'string' },
        business_name: { type: 'string' },
        industry: { type: 'string', description: 'e.g. dental, salon, law firm, restaurant' },
        estimated_calls_per_week: { type: 'number' },
        avg_service_value: { type: 'number' },
        pain_points: { type: 'array', items: { type: 'string' }, description: 'List of pain points mentioned' },
        recommended_plan: { type: 'string', enum: ['starter', 'growth', 'pro'] },
      },
      required: ['business_name', 'industry'],
    },
  },
  {
    name: 'schedule_demo_call',
    description: 'Schedule an outbound demo call — VAPI assistant calls the prospect to demonstrate the product',
    inputSchema: {
      type: 'object' as const,
      properties: {
        phone_number: { type: 'string', description: 'Prospect phone number (E.164)' },
        assistant_type: { type: 'string', description: 'Which demo assistant to use (dental, salon, auto, restaurant, law, nonprofit)' },
      },
      required: ['phone_number'],
    },
  },
  {
    name: 'post_internal_update',
    description: 'Post a message to the internal team channel (Slack/Discord webhook)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'The message to post' },
        channel: { type: 'string', description: 'Channel name (for context, not routing)' },
        urgency: { type: 'string', enum: ['info', 'warning', 'critical'] },
      },
      required: ['message'],
    },
  },
]

export async function handleMouthTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'send_email': {
      if (!RESEND_API_KEY) {
        return JSON.stringify({ error: 'RESEND_API_KEY not configured' })
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${args.from_name || 'VoiceFly'} <hello@voiceflyai.com>`,
          to: [args.to],
          subject: args.subject,
          html: args.body,
        }),
      })

      const data = await res.json()
      if (!res.ok) return JSON.stringify({ error: 'Email send failed', details: data })
      return JSON.stringify({ success: true, email_id: data.id })
    }

    case 'send_customer_sms': {
      const result = await sendSms(args.to, args.body)
      return JSON.stringify({ success: true, ...result })
    }

    case 'create_proposal': {
      const callsPerWeek = args.estimated_calls_per_week || 5
      const avgValue = args.avg_service_value || 80
      const monthlyRecovery = callsPerWeek * avgValue * 4

      const planPricing: Record<string, number> = { starter: 49, growth: 129, pro: 249 }
      const plan = args.recommended_plan || 'starter'
      const price = planPricing[plan]
      const roi = Math.round(monthlyRecovery / price)

      const painPointsText = (args.pain_points || ['missed calls', 'voicemail', 'after-hours availability'])
        .map((p: string) => `  - ${p}`)
        .join('\n')

      const proposal = `
VOICEFLY PROPOSAL FOR ${(args.business_name || '').toUpperCase()}
${'='.repeat(50)}

Hi ${args.prospect_name || 'there'},

Based on our conversation, here's how VoiceFly can help ${args.business_name}:

YOUR CHALLENGES:
${painPointsText}

THE SOLUTION:
VoiceFly's AI receptionist answers every call 24/7, books appointments,
and handles customer questions — so you never miss another client.

THE MATH:
  ${callsPerWeek} missed calls/week × $${avgValue} avg service = $${monthlyRecovery.toLocaleString()}/mo in lost revenue
  VoiceFly ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan: $${price}/mo
  Potential ROI: ${roi}x return

RECOMMENDED PLAN: ${plan.toUpperCase()} ($${price}/mo)
  - ${plan === 'starter' ? '60' : plan === 'growth' ? '250' : '750'} AI voice minutes/month
  - ${plan === 'starter' ? '1' : plan === 'growth' ? '3' : '5'} AI employee${plan !== 'starter' ? 's' : ''}
  - 24/7 call answering
  - Appointment booking
  - 14-day free trial, no credit card needed

NEXT STEPS:
  1. Start your free trial at voiceflyai.com/signup
  2. Set up takes under 10 minutes
  3. Your AI receptionist starts answering calls immediately

Questions? Reply to this email or call our AI demo at (989) 299-7944.

Best,
The VoiceFly Team
`

      return JSON.stringify({ proposal: proposal.trim(), metrics: { monthly_recovery: monthlyRecovery, plan, price, roi } })
    }

    case 'schedule_demo_call': {
      // Map assistant types to VAPI demo assistant IDs
      const demoAssistants: Record<string, string> = {
        dental: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_DENTAL || '',
        salon: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_SALON || '',
        auto: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_AUTO || '',
        restaurant: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_RESTAURANT || '',
        law: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_LAW || '',
        nonprofit: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_NONPROFIT || '',
      }

      const assistantId = demoAssistants[args.assistant_type || 'salon']
      if (!assistantId) {
        return JSON.stringify({ error: `No demo assistant configured for type: ${args.assistant_type}` })
      }

      const call = await vapi.createCall({
        assistantId,
        customer: { number: args.phone_number },
      })

      return JSON.stringify({
        success: true,
        call_id: call.id,
        message: `Demo call initiated to ${args.phone_number} using ${args.assistant_type || 'salon'} assistant`,
      })
    }

    case 'post_internal_update': {
      if (!SLACK_WEBHOOK_URL) {
        // Fallback: log to database
        await supabase.from('mcp_agent_interactions').insert({
          interaction_type: 'internal_update',
          subject: args.channel || 'general',
          content: args.message,
          metadata: { urgency: args.urgency || 'info' },
        })
        return JSON.stringify({ success: true, destination: 'database (no Slack webhook configured)' })
      }

      const emoji = args.urgency === 'critical' ? '🚨' : args.urgency === 'warning' ? '⚠️' : 'ℹ️'
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${emoji} ${args.message}` }),
      })

      return JSON.stringify({ success: true, destination: 'slack' })
    }

    default:
      throw new Error(`Unknown mouth tool: ${name}`)
  }
}
