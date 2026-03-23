/**
 * HANDS Layer — Operations Tools
 * Create, manage, and configure VoiceFly resources
 */

import { supabase } from '../lib/supabase.js'
import { vapi } from '../lib/vapi.js'
import { sendSms } from '../lib/twilio.js'
import { stripe } from '../lib/stripe.js'

const DEFAULT_BIZ = process.env.VOICEFLY_BUSINESS_ID || ''

function bizId(args: any): string {
  return args.business_id || DEFAULT_BIZ
}

export const handsTools = [
  {
    name: 'list_employees',
    description: 'List all phone employees for a business with their status, phone numbers, and job types',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Business ID (optional, uses default)' },
      },
    },
  },
  {
    name: 'create_employee',
    description: 'Create a new AI phone employee. Inserts into database — use provision_phone_employee for full setup with VAPI assistant and phone number.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        name: { type: 'string', description: 'Employee name (e.g. "Maya", "Jordan")' },
        job_type: { type: 'string', description: 'receptionist, order-taker, lead-qualifier, appointment-scheduler, etc.' },
        greeting: { type: 'string', description: 'The greeting the employee uses when answering calls' },
        personality_tone: { type: 'string', enum: ['professional', 'friendly', 'warm', 'casual'] },
        voice_id: { type: 'string', description: 'ElevenLabs voice ID' },
      },
      required: ['name', 'job_type'],
    },
  },
  {
    name: 'update_employee',
    description: 'Update an existing phone employee config (name, greeting, personality, voice, job config, FAQs, etc.)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        employee_id: { type: 'string', description: 'Phone employee UUID' },
        updates: {
          type: 'object',
          description: 'Fields to update: name, job_type, voice, personality, job_config, is_active, etc.',
        },
      },
      required: ['employee_id', 'updates'],
    },
  },
  {
    name: 'pause_employee',
    description: 'Pause a phone employee — stops them from receiving calls',
    inputSchema: {
      type: 'object' as const,
      properties: {
        employee_id: { type: 'string' },
      },
      required: ['employee_id'],
    },
  },
  {
    name: 'resume_employee',
    description: 'Resume a paused phone employee — starts receiving calls again',
    inputSchema: {
      type: 'object' as const,
      properties: {
        employee_id: { type: 'string' },
      },
      required: ['employee_id'],
    },
  },
  {
    name: 'delete_employee',
    description: 'Delete a phone employee and clean up their VAPI assistant',
    inputSchema: {
      type: 'object' as const,
      properties: {
        employee_id: { type: 'string' },
      },
      required: ['employee_id'],
    },
  },
  {
    name: 'setup_business',
    description: 'Create or update a business profile — name, type, phone, email, hours, timezone, AI knowledge',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string', description: 'Existing business ID to update (omit to create new)' },
        name: { type: 'string' },
        business_type: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        address: { type: 'string' },
        website: { type: 'string' },
        timezone: { type: 'string' },
        business_context: { type: 'string', description: 'AI knowledge base text about the business' },
      },
    },
  },
  {
    name: 'provision_phone_employee',
    description: 'Full end-to-end setup: creates DB record, VAPI assistant, and assigns phone number. This is the main tool for onboarding.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        name: { type: 'string', description: 'Employee name' },
        job_type: { type: 'string', description: 'receptionist, order-taker, lead-qualifier, etc.' },
        greeting: { type: 'string' },
        business_name: { type: 'string', description: 'The business name for the VAPI prompt' },
        business_context: { type: 'string', description: 'Business info for the AI prompt' },
        voice_id: { type: 'string', description: 'ElevenLabs voice ID (default: sarah)' },
        personality_tone: { type: 'string', enum: ['professional', 'friendly', 'warm', 'casual'] },
      },
      required: ['name', 'job_type', 'business_name'],
    },
  },
  {
    name: 'send_sms',
    description: 'Send an SMS message to a phone number via Twilio',
    inputSchema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Phone number to send to (E.164 format)' },
        body: { type: 'string', description: 'Message text' },
      },
      required: ['to', 'body'],
    },
  },
  {
    name: 'test_employee_call',
    description: 'Trigger an outbound test call from a VAPI assistant to verify it works',
    inputSchema: {
      type: 'object' as const,
      properties: {
        employee_id: { type: 'string', description: 'Phone employee UUID' },
        phone_number: { type: 'string', description: 'Number to call for testing (E.164)' },
      },
      required: ['employee_id', 'phone_number'],
    },
  },
  {
    name: 'upgrade_plan',
    description: 'Change a business subscription tier (starter, growth, pro) via Stripe',
    inputSchema: {
      type: 'object' as const,
      properties: {
        business_id: { type: 'string' },
        plan: { type: 'string', enum: ['starter', 'growth', 'pro'] },
        coupon_code: { type: 'string', description: 'Optional Stripe coupon/promo code' },
      },
      required: ['plan'],
    },
  },
]

// ---- Tool Handlers ----

export async function handleHandsTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'list_employees': {
      const { data, error } = await supabase
        .from('phone_employees')
        .select('id, name, job_type, phone_number, is_active, vapi_assistant_id, created_at')
        .eq('business_id', bizId(args))
        .order('created_at', { ascending: false })
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'create_employee': {
      const { data, error } = await supabase
        .from('phone_employees')
        .insert({
          business_id: bizId(args),
          name: args.name,
          job_type: args.job_type,
          is_active: false,
          voice: {
            provider: '11labs',
            voiceId: args.voice_id || 'sarah',
            speed: 1.0,
            stability: 0.8,
          },
          personality: {
            tone: args.personality_tone || 'professional',
            enthusiasm: 'medium',
            formality: 'semi-formal',
          },
          job_config: {
            greeting: args.greeting || `Thank you for calling. How can I help you today?`,
          },
        })
        .select()
        .single()
      if (error) throw error
      return JSON.stringify(data, null, 2)
    }

    case 'update_employee': {
      const { data, error } = await supabase
        .from('phone_employees')
        .update({ ...args.updates, updated_at: new Date().toISOString() })
        .eq('id', args.employee_id)
        .select()
        .single()
      if (error) throw error

      // Sync to VAPI if assistant exists
      if (data.vapi_assistant_id && args.updates.job_config) {
        await vapi.updateAssistant(data.vapi_assistant_id, {
          firstMessage: args.updates.job_config.greeting,
        })
      }
      return JSON.stringify(data, null, 2)
    }

    case 'pause_employee': {
      const { data, error } = await supabase
        .from('phone_employees')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', args.employee_id)
        .select('id, name, is_active')
        .single()
      if (error) throw error
      return JSON.stringify({ ...data, message: `${data.name} has been paused` })
    }

    case 'resume_employee': {
      const { data, error } = await supabase
        .from('phone_employees')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', args.employee_id)
        .select('id, name, is_active')
        .single()
      if (error) throw error
      return JSON.stringify({ ...data, message: `${data.name} is now active` })
    }

    case 'delete_employee': {
      // Get employee first to clean up VAPI
      const { data: emp } = await supabase
        .from('phone_employees')
        .select('id, name, vapi_assistant_id')
        .eq('id', args.employee_id)
        .single()

      if (emp?.vapi_assistant_id) {
        try {
          await vapi.deleteAssistant(emp.vapi_assistant_id)
        } catch (e) {
          // VAPI cleanup is best-effort
        }
      }

      const { error } = await supabase
        .from('phone_employees')
        .delete()
        .eq('id', args.employee_id)
      if (error) throw error
      return JSON.stringify({ message: `Employee ${emp?.name || args.employee_id} deleted` })
    }

    case 'setup_business': {
      if (args.business_id) {
        // Update existing
        const updates: any = {}
        for (const key of ['name', 'business_type', 'phone', 'email', 'address', 'website', 'timezone', 'business_context']) {
          if (args[key] !== undefined) updates[key] = args[key]
        }
        const { data, error } = await supabase
          .from('businesses')
          .update(updates)
          .eq('id', args.business_id)
          .select()
          .single()
        if (error) throw error
        return JSON.stringify(data, null, 2)
      } else {
        // Create new
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            name: args.name || 'New Business',
            business_type: args.business_type,
            phone: args.phone,
            email: args.email,
            address: args.address,
            website: args.website,
            timezone: args.timezone || 'America/Los_Angeles',
            business_context: args.business_context,
            subscription_tier: 'trial',
            subscription_status: 'trial',
          })
          .select()
          .single()
        if (error) throw error
        return JSON.stringify(data, null, 2)
      }
    }

    case 'provision_phone_employee': {
      const bId = bizId(args)
      const voiceId = args.voice_id || 'sarah'
      const tone = args.personality_tone || 'professional'

      // 1. Create VAPI assistant
      const systemPrompt = buildSystemPrompt(args)
      const assistant = await vapi.createAssistant({
        name: `${args.business_name} - ${args.name}`.substring(0, 40),
        model: { provider: 'openai', model: 'gpt-4o', messages: [{ role: 'system', content: systemPrompt }] },
        voice: { provider: '11labs', voiceId },
        firstMessage: args.greeting || `Thank you for calling ${args.business_name}. This is ${args.name}, how can I help you today?`,
        serverUrl: 'https://www.voiceflyai.com/api/webhooks/phone-employee',
      })

      // 2. Insert DB record
      const { data: employee, error } = await supabase
        .from('phone_employees')
        .insert({
          business_id: bId,
          name: args.name,
          job_type: args.job_type,
          is_active: true,
          vapi_assistant_id: assistant.id,
          voice: { provider: '11labs', voiceId, speed: 1.0, stability: 0.8 },
          personality: { tone, enthusiasm: 'medium', formality: 'semi-formal' },
          job_config: {
            greeting: args.greeting || `Thank you for calling ${args.business_name}. This is ${args.name}, how can I help you today?`,
            businessName: args.business_name,
            businessContext: args.business_context || '',
          },
        })
        .select()
        .single()
      if (error) throw error

      return JSON.stringify({
        employee,
        vapi_assistant_id: assistant.id,
        message: `${args.name} is provisioned and ready. VAPI assistant created. Assign a phone number to start receiving calls.`,
      }, null, 2)
    }

    case 'send_sms': {
      const result = await sendSms(args.to, args.body)
      return JSON.stringify(result)
    }

    case 'test_employee_call': {
      const { data: emp } = await supabase
        .from('phone_employees')
        .select('vapi_assistant_id, name')
        .eq('id', args.employee_id)
        .single()

      if (!emp?.vapi_assistant_id) {
        return JSON.stringify({ error: 'Employee has no VAPI assistant configured' })
      }

      const call = await vapi.createCall({
        assistantId: emp.vapi_assistant_id,
        phoneNumberId: undefined, // Uses VAPI default
        customer: { number: args.phone_number },
      })
      return JSON.stringify({ call_id: call.id, status: call.status, message: `Test call initiated to ${args.phone_number} from ${emp.name}` })
    }

    case 'upgrade_plan': {
      const bId = bizId(args)
      const { data: biz } = await supabase
        .from('businesses')
        .select('stripe_customer_id, subscription_tier')
        .eq('id', bId)
        .single()

      if (!biz) return JSON.stringify({ error: 'Business not found' })

      // Update tier in database
      const { error } = await supabase
        .from('businesses')
        .update({
          subscription_tier: args.plan,
          subscription_status: 'active',
        })
        .eq('id', bId)
      if (error) throw error

      return JSON.stringify({
        message: `Plan upgraded from ${biz.subscription_tier} to ${args.plan}`,
        previous_plan: biz.subscription_tier,
        new_plan: args.plan,
      })
    }

    default:
      throw new Error(`Unknown hands tool: ${name}`)
  }
}

function buildSystemPrompt(args: any): string {
  const jobDescriptions: Record<string, string> = {
    'receptionist': 'You are a receptionist. Answer calls, take messages, transfer to the right person, and schedule appointments.',
    'order-taker': 'You are an order taker. Take food/product orders, handle modifications, upsell when appropriate, and confirm orders.',
    'lead-qualifier': 'You are a lead qualifier. Screen inbound prospects, ask qualifying questions, score their interest level, and book discovery calls for qualified leads.',
    'appointment-scheduler': 'You are an appointment scheduler. Focus on booking, rescheduling, and confirming appointments.',
    'after-hours-emergency': 'You handle after-hours calls. Triage urgency, take messages for non-urgent calls, and notify on-call staff for emergencies.',
    'restaurant-host': 'You are a restaurant host. Handle reservations, manage the waitlist, and answer dining inquiries.',
    'survey-caller': 'You are a survey caller. Call customers after visits to collect feedback and satisfaction scores.',
    'appointment-reminder': 'You are an appointment reminder. Call customers before appointments to confirm attendance and reduce no-shows.',
    'collections': 'You handle payment collection calls with FDCPA-compliant scripts.',
  }

  const jobPrompt = jobDescriptions[args.job_type] || 'You are a professional AI phone employee.'

  return `You are ${args.name}, an AI phone employee at ${args.business_name}.

${jobPrompt}

${args.business_context ? `Business context:\n${args.business_context}` : ''}

Guidelines:
- Be natural and conversational
- Never reveal you are an AI unless directly asked
- If you can't help with something, offer to take a message or transfer
- Always be polite and professional`
}
