/**
 * SMS AI Responder
 *
 * Generates contextual AI responses to inbound SMS using Anthropic Claude.
 * Supports tool_use for appointment scheduling (book, check availability,
 * reschedule, cancel) when the employee type supports it.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { customerMemoryAgent } from '@/lib/agents/customer-memory'
import {
  handleScheduleAppointment,
  handleCheckAvailability,
  handleRescheduleAppointment,
  handleCancelAppointment,
} from '@/lib/phone-employees/appointment-handlers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SMS_INSTRUCTION_PREFIX = `You are responding via SMS text message. Follow these rules strictly:
- Keep responses under 300 characters when possible (1-2 SMS segments)
- Be concise and direct. No verbal filler
- Use short sentences. One idea per message
- Format dates readably like "Tue Feb 25 at 2:30 PM"
- Don't use emojis unless the customer does first
- If you need multiple pieces of info from the customer, ask for them all at once
- Never volunteer that you are AI unless directly asked`

const APPOINTMENT_JOB_TYPES = [
  'appointment-scheduler',
  'receptionist',
  'personal-assistant',
  'restaurant-host',
]

// Anthropic tool definitions for appointment functions
const APPOINTMENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'schedule_appointment',
    description: 'Book a new appointment for the customer. Only call when you have all required info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customerName: { type: 'string', description: "Customer's full name" },
        customerPhone: { type: 'string', description: "Customer's phone number" },
        service: { type: 'string', description: 'Type of service or appointment' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM (24h) format' },
        notes: { type: 'string', description: 'Optional notes' },
      },
      required: ['customerName', 'customerPhone', 'service', 'date', 'time'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a date',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date to check in YYYY-MM-DD format' },
        appointmentType: { type: 'string', description: 'Type of appointment/service' },
      },
      required: ['date'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Move an existing appointment to a new date/time',
    input_schema: {
      type: 'object' as const,
      properties: {
        customerName: { type: 'string', description: "Customer's name on the appointment" },
        customerPhone: { type: 'string', description: "Customer's phone number" },
        originalDate: { type: 'string', description: 'Original appointment date (YYYY-MM-DD)' },
        newDate: { type: 'string', description: 'New date (YYYY-MM-DD)' },
        newTime: { type: 'string', description: 'New time (HH:MM)' },
        reason: { type: 'string', description: 'Reason for rescheduling' },
      },
      required: ['customerName', 'newDate', 'newTime'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment',
    input_schema: {
      type: 'object' as const,
      properties: {
        customerName: { type: 'string', description: "Customer's name on the appointment" },
        customerPhone: { type: 'string', description: "Customer's phone number" },
        appointmentDate: { type: 'string', description: 'Date of appointment to cancel (YYYY-MM-DD)' },
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
      required: ['customerName'],
    },
  },
]

interface GenerateResponseParams {
  employee: {
    id: string
    name: string
    job_type: string
    job_config: any
    business_id: string
    schedule?: any
  }
  customerPhone: string
  inboundMessage: string
}

export async function generateSmsResponse(params: GenerateResponseParams): Promise<string> {
  const { employee, customerPhone, inboundMessage } = params
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return buildFallbackReply(employee.name, employee.job_config)
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  try {
    // Build system prompt
    const systemPrompt = await buildSystemPrompt(employee, customerPhone)

    // Load conversation history
    const history = await getConversationHistory(
      employee.business_id,
      employee.id,
      customerPhone
    )

    // Append current message
    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: inboundMessage },
    ]

    // Determine tools
    const tools = APPOINTMENT_JOB_TYPES.includes(employee.job_type)
      ? APPOINTMENT_TOOLS
      : undefined

    // Call Anthropic
    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages,
      ...(tools ? { tools } : {}),
    })

    // Tool use loop (max 3 iterations)
    let iterations = 0
    while (iterations < 3) {
      const toolUseBlock = response.content.find(b => b.type === 'tool_use')
      if (!toolUseBlock || toolUseBlock.type !== 'tool_use') break

      iterations++
      console.log(`[SmsAI] Tool call: ${toolUseBlock.name}`, toolUseBlock.input)

      const toolResult = await dispatchTool(
        toolUseBlock.name,
        toolUseBlock.input as Record<string, any>,
        employee.business_id,
        employee.id,
        employee,
        customerPhone
      )

      // Continue conversation with tool result
      messages.push({ role: 'assistant', content: response.content })
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(toolResult),
        }],
      })

      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages,
        ...(tools ? { tools } : {}),
      })
    }

    // Extract text from final response
    const textBlock = response.content.find(b => b.type === 'text')
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text.trim()
    }

    return buildFallbackReply(employee.name, employee.job_config)
  } catch (err) {
    console.error('[SmsAI] Error generating response:', err)
    return buildFallbackReply(employee.name, employee.job_config)
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

async function buildSystemPrompt(employee: any, customerPhone: string): Promise<string> {
  const jobConfig = employee.job_config || {}

  // Use stored prompt if available, otherwise build a default
  const basePrompt =
    jobConfig.systemPrompt ||
    jobConfig.instructions ||
    buildDefaultPrompt(employee.name, employee.job_type, jobConfig)

  // Get customer context
  const brief = await customerMemoryAgent.getCustomerBrief(
    employee.business_id,
    customerPhone,
    employee.name
  )

  let prompt = `${SMS_INSTRUCTION_PREFIX}\n\n${basePrompt}`

  if (brief) {
    prompt += `\n\n--- CUSTOMER CONTEXT ---\n${brief}\n--- END CONTEXT ---\nUse this naturally. Don't recite it.`
  }

  // Append extra knowledge if available
  if (jobConfig.extraKnowledge) {
    prompt += `\n\n## Additional Business Knowledge\n${jobConfig.extraKnowledge}`
  }

  return prompt
}

function buildDefaultPrompt(name: string, jobType: string, jobConfig: any): string {
  const businessName = jobConfig.businessName || jobConfig.businessDescription || 'our business'
  const greeting = jobConfig.greeting || ''
  const services = jobConfig.appointmentTypes?.map((t: any) => t.name).join(', ') ||
    jobConfig.services?.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') || ''

  return `You are ${name}, an AI ${jobType.replace(/-/g, ' ')} for ${businessName}.
${greeting ? `Your greeting: "${greeting}"` : ''}
${services ? `Services: ${services}` : ''}
Be helpful, friendly, and professional. Answer questions about the business.
If you cannot help with something, offer to have a team member follow up.`
}

// ============================================
// CONVERSATION HISTORY
// ============================================

async function getConversationHistory(
  businessId: string,
  employeeId: string,
  customerPhone: string,
  limit = 15
): Promise<Anthropic.MessageParam[]> {
  const { data } = await supabase
    .from('communication_logs')
    .select('direction, content, created_at')
    .eq('business_id', businessId)
    .eq('type', 'sms')
    .eq('customer_phone', customerPhone)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (!data || data.length === 0) return []

  // Map to Anthropic message format, merging consecutive same-role messages
  const messages: Anthropic.MessageParam[] = []
  for (const row of data) {
    const role = row.direction === 'inbound' ? 'user' : 'assistant'
    const content = row.content || ''
    if (!content.trim()) continue

    // Merge consecutive messages from same role
    const last = messages[messages.length - 1]
    if (last && last.role === role) {
      last.content = `${last.content}\n${content}`
    } else {
      messages.push({ role, content })
    }
  }

  // Ensure first message is from user (Anthropic requirement)
  while (messages.length > 0 && messages[0].role !== 'user') {
    messages.shift()
  }

  return messages
}

// ============================================
// TOOL DISPATCH
// ============================================

async function dispatchTool(
  toolName: string,
  input: Record<string, any>,
  businessId: string,
  employeeId: string,
  employee: any,
  customerPhone: string
): Promise<any> {
  // Inject customer phone into params so handlers can use it
  const params = { ...input, customerPhone }

  try {
    switch (toolName) {
      case 'schedule_appointment':
        return await handleScheduleAppointment(params, businessId, employeeId, {
          suppressConfirmationSms: true,
          source: 'sms',
        })

      case 'check_availability':
        return await handleCheckAvailability(params, businessId, employee)

      case 'reschedule_appointment':
        return await handleRescheduleAppointment(params, businessId, {
          suppressConfirmationSms: true,
          source: 'sms',
        })

      case 'cancel_appointment':
        return await handleCancelAppointment(params, businessId, {
          suppressConfirmationSms: true,
          source: 'sms',
        })

      default:
        return { success: false, error: `Unknown tool: ${toolName}` }
    }
  } catch (err) {
    console.error(`[SmsAI] Tool ${toolName} error:`, err)
    return { success: false, error: 'Tool execution failed' }
  }
}

// ============================================
// FALLBACK
// ============================================

function buildFallbackReply(employeeName: string, jobConfig: any): string {
  if (jobConfig?.smsAutoReply) return jobConfig.smsAutoReply
  return `Hi! You've reached ${employeeName}. We received your message and will get back to you shortly.`
}
