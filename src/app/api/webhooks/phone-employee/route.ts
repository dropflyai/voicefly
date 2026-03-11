/**
 * Phone Employee Webhook Handler
 *
 * Handles VAPI events for phone employees:
 * - Call status updates
 * - Function calls (booking, messages, orders)
 * - Transcripts
 * - Call end reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { messageSystem } from '@/lib/phone-employees/message-system'
import { taskScheduler } from '@/lib/phone-employees/task-scheduler'
import { actionExecutor } from '@/lib/phone-employees/action-executor'
import { employeeProvisioning } from '@/lib/phone-employees'
import { StripeService } from '@/lib/stripe-service'
import { GoogleCalendarService } from '@/lib/google-calendar-service'
import { webhookService } from '@/lib/webhooks/webhook-service'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { AgentEvent } from '@/lib/agents/types'
import { GoogleReviewsManager } from '@/lib/google-reviews-manager'
import { HubSpotService } from '@/lib/hubspot-service'
import { CalendlyService } from '@/lib/calendly-service'
import { SquareService } from '@/lib/square-service'
import { getToastConnection, createToastOrder } from '@/lib/integrations/toast-sync'
import { getCloverConnection, createCloverOrder } from '@/lib/integrations/clover-sync'
import { customerMemoryAgent } from '@/lib/agents/customer-memory'
import { automationEngine } from '@/lib/automation/automation-engine'
import { routingAgent } from '@/lib/agents/routing-agent'
import CreditSystem, { CreditCost, CREDITS_PER_MINUTE } from '@/lib/credit-system'
import {
  handleScheduleAppointment,
  handleCheckAvailability,
  handleRescheduleAppointment,
  handleCancelAppointment,
} from '@/lib/phone-employees/appointment-handlers'
import { sendSms } from '@/lib/sms/twilio-client'
import {
  sendMessageNotification,
  sendAppointmentNotification,
  sendCallSummaryNotification,
  sendOrderNotification,
  getOwnerEmail,
} from '@/lib/notifications/email-notifications'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// TRIAL LIMITS
// ============================================

const TRIAL_LIMITS = {
  maxCalls: 10,
  maxCallDurationSeconds: 300, // 5 minutes
  trialDays: 14,
}

// ============================================
// BUSINESS SUBSCRIPTION HELPERS
// ============================================

async function isTrialBusiness(businessId: string): Promise<boolean> {
  const { data } = await supabase
    .from('businesses')
    .select('subscription_status')
    .eq('id', businessId)
    .single()
  return data?.subscription_status === 'trial'
}

// ============================================
// ORDER STATE HELPERS (Supabase-backed)
// ============================================

async function getActiveOrder(callId: string): Promise<any | null> {
  const { data } = await supabase
    .from('phone_orders')
    .select('*')
    .eq('call_id', callId)
    .eq('status', 'in_progress')
    .single()
  return data
}

async function upsertActiveOrder(callId: string, businessId: string, employeeId: string, orderData: any): Promise<any> {
  const existing = await getActiveOrder(callId)
  if (existing) {
    const { data } = await supabase
      .from('phone_orders')
      .update({
        items: orderData.items,
        subtotal: orderData.subtotal,
        customer_name: orderData.customerInfo?.name || existing.customer_name,
        customer_phone: orderData.customerInfo?.phone || existing.customer_phone,
        customer_email: orderData.customerInfo?.email || existing.customer_email,
        order_type: orderData.orderType || existing.order_type,
        delivery_address: orderData.deliveryAddress || existing.delivery_address,
        requested_time: orderData.requestedTime || existing.requested_time,
        payment_method: orderData.paymentMethod || existing.payment_method,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    return data
  } else {
    const { data } = await supabase
      .from('phone_orders')
      .insert({
        business_id: businessId,
        employee_id: employeeId,
        call_id: callId,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        status: 'in_progress',
        order_type: orderData.orderType || 'pickup',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    return data
  }
}

/**
 * Get or create a trial employee for a business.
 * Used when calls come in via the shared trial assistant.
 * Looks for any employee using the shared assistant ID, regardless of job type.
 */
async function getOrCreateTrialEmployee(businessId: string): Promise<any | null> {
  const sharedAssistantId = process.env.VAPI_SHARED_ASSISTANT_ID || ''

  // Find existing employee using the shared assistant
  const { data: existing } = await supabase
    .from('phone_employees')
    .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
    .eq('business_id', businessId)
    .eq('vapi_assistant_id', sharedAssistantId)
    .limit(1)
    .single()

  if (existing) {
    return existing
  }

  // Fallback: create a default receptionist trial employee
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .single()

  const businessName = business?.name || 'the business'

  const { data: newEmployee, error } = await supabase
    .from('phone_employees')
    .insert({
      business_id: businessId,
      name: 'Trial Receptionist',
      job_type: 'receptionist',
      is_active: true,
      vapi_assistant_id: sharedAssistantId,
      job_config: {
        type: 'receptionist',
        greeting: `Thank you for calling ${businessName}! How can I help you today?`,
        businessDescription: businessName,
        transferRules: [],
        messagePrompt: "I'd be happy to take a message. Can I get your name?",
        messageFields: ['name', 'phone', 'reason', 'urgency'],
        faqs: [],
        services: [],
      },
      personality: { tone: 'warm', enthusiasm: 'medium', formality: 'semi-formal' },
      voice: { provider: '11labs', voiceId: 'aVR2rUXJY4MTezzJjPyQ', speed: 1.0, stability: 0.5 },
      schedule: {
        timezone: 'America/New_York',
        businessHours: {
          monday: { start: '00:00', end: '23:59' },
          tuesday: { start: '00:00', end: '23:59' },
          wednesday: { start: '00:00', end: '23:59' },
          thursday: { start: '00:00', end: '23:59' },
          friday: { start: '00:00', end: '23:59' },
          saturday: { start: '00:00', end: '23:59' },
          sunday: { start: '00:00', end: '23:59' },
        },
      },
      // Trial capabilities — no transfer_to_human or send_sms (paid features)
      capabilities: ['answer_calls', 'take_messages', 'provide_business_info', 'answer_faqs', 'book_appointments', 'check_availability', 'capture_lead_info', 'log_interactions'],
      provisioning_status: 'active',
    })
    .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
    .single()

  if (error) {
    console.error('[getOrCreateTrialEmployee] Insert failed:', error)
    return null
  }

  return newEmployee
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    // Get employee ID from serverUrlSecret header or metadata
    const secretHeader = request.headers.get('x-vapi-secret')
    const metadataEmployeeId = message?.call?.assistant?.metadata?.employeeId
    const metadataBusinessId = message?.call?.assistant?.metadata?.businessId

    const lookupId = secretHeader || metadataEmployeeId

    // Check if this call is from the shared trial assistant
    const assistantId = message?.call?.assistantId || message?.call?.assistant?.id
    const sharedAssistantId = process.env.VAPI_SHARED_ASSISTANT_ID

    if (sharedAssistantId && assistantId === sharedAssistantId) {
      const trialBusinessId = message?.call?.assistant?.metadata?.businessId || metadataBusinessId
      if (!trialBusinessId) {
        console.warn('[PhoneEmployeeWebhook] Shared assistant call with no businessId in metadata')
        return NextResponse.json({ error: 'Business ID required for shared assistant calls' }, { status: 400 })
      }

      console.log(`[PhoneEmployeeWebhook] Shared assistant call for business ${trialBusinessId}`)

      // Resolve the correct employee for this call:
      // 1. Try by VAPI phone number ID (matches when each employee has its own number)
      // 2. Fall back to getOrCreateTrialEmployee (single-employee businesses / trials)
      const vapiPhoneNumberId = message?.call?.phoneNumberId
      let trialEmployee: any = null

      if (vapiPhoneNumberId) {
        const { data: byPhone } = await supabase
          .from('phone_employees')
          .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
          .eq('business_id', trialBusinessId)
          .eq('vapi_phone_id', vapiPhoneNumberId)
          .eq('is_active', true)
          .single()
        trialEmployee = byPhone
      }

      // Fallback: find by metadata employeeId if provided
      if (!trialEmployee && metadataEmployeeId) {
        const { data: byId } = await supabase
          .from('phone_employees')
          .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
          .eq('id', metadataEmployeeId)
          .eq('business_id', trialBusinessId)
          .single()
        trialEmployee = byId
      }

      // Final fallback: get or create a default trial employee
      if (!trialEmployee) {
        trialEmployee = await getOrCreateTrialEmployee(trialBusinessId)
      }

      if (!trialEmployee) {
        console.error('[PhoneEmployeeWebhook] Failed to resolve employee for', trialBusinessId)
        return NextResponse.json({ error: 'Failed to resolve employee' }, { status: 500 })
      }

      const businessId = trialBusinessId

      console.log(`[PhoneEmployeeWebhook] Received ${message?.type} for shared-assistant employee ${trialEmployee.name} (${trialEmployee.job_type})`)

      // Handle message types using existing handlers
      switch (message?.type) {
        case 'function-call':
          return handleFunctionCall(message, trialEmployee, businessId)
        case 'tool-calls':
          return handleToolCalls(message, trialEmployee, businessId)
        case 'status-update':
          return handleStatusUpdate(message, trialEmployee, businessId)
        case 'transcript':
          return handleTranscript(message, trialEmployee, businessId)
        case 'end-of-call-report':
        case 'hang':
          return handleCallEnd(message, trialEmployee, businessId)
        case 'conversation-update':
          return NextResponse.json({ received: true })
        case 'assistant-request':
          return handleAssistantRequest(trialEmployee)
        default:
          console.log(`[PhoneEmployeeWebhook] Unhandled message type: ${message?.type}`)
          return NextResponse.json({ received: true })
      }
    }

    if (!lookupId && !metadataBusinessId) {
      console.warn('[PhoneEmployeeWebhook] No employee or business ID found')
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Get employee and business info
    // Try direct employee ID lookup first, then fall back to business ID
    let employee: any = null

    if (lookupId) {
      const { data } = await supabase
        .from('phone_employees')
        .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
        .eq('id', lookupId)
        .single()
      employee = data

      // If not found by ID, the secret might be a businessId — find the active employee
      if (!employee) {
        const { data: byBusiness } = await supabase
          .from('phone_employees')
          .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
          .eq('business_id', lookupId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        employee = byBusiness
      }
    }

    if (!employee && metadataBusinessId) {
      const { data: byBusiness } = await supabase
        .from('phone_employees')
        .select('*, businesses(name, phone, email, address_line1, website, timezone, settings, business_context)')
        .eq('business_id', metadataBusinessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      employee = byBusiness
    }

    if (!employee) {
      console.warn('[PhoneEmployeeWebhook] Employee not found for:', lookupId || metadataBusinessId)
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const businessId = employee.business_id

    console.log(`[PhoneEmployeeWebhook] Received ${message?.type} for ${employee.name}`)

    // Handle different message types
    switch (message?.type) {
      case 'function-call':
        return handleFunctionCall(message, employee, businessId)

      case 'tool-calls':
        return handleToolCalls(message, employee, businessId)

      case 'status-update':
        return handleStatusUpdate(message, employee, businessId)

      case 'transcript':
        return handleTranscript(message, employee, businessId)

      case 'end-of-call-report':
      case 'hang':
        return handleCallEnd(message, employee, businessId)

      case 'conversation-update':
        // Live conversation monitoring — log but don't process
        return NextResponse.json({ received: true })

      case 'assistant-request':
        return handleAssistantRequest(employee)

      default:
        console.log(`[PhoneEmployeeWebhook] Unhandled message type: ${message?.type}`)
        return NextResponse.json({ received: true })
    }
  } catch (error: any) {
    console.error('[PhoneEmployeeWebhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================
// FUNCTION CALL HANDLERS
// ============================================

async function handleFunctionCall(
  message: any,
  employee: any,
  businessId: string
): Promise<NextResponse> {
  const functionCall = message.functionCall
  const callId = message.call?.id
  const callerNumber = message.call?.customer?.number

  console.log(`[PhoneEmployeeWebhook] Function call: ${functionCall?.name}`)

  try {
    let result: any

    switch (functionCall?.name) {
      // === RECEPTIONIST FUNCTIONS ===
      case 'scheduleAppointment':
      case 'bookAppointment': {
        // Inject caller phone if AI didn't collect it
        const apptParams = { ...functionCall.parameters }
        if (!apptParams.customerPhone && !apptParams.phone && callerNumber) {
          apptParams.customerPhone = callerNumber
        }
        const isTrialEmp = await isTrialBusiness(businessId)
        result = await handleScheduleAppointment(apptParams, businessId, employee.id, { isTrial: isTrialEmp })
        break
      }

      case 'checkAvailability':
        result = await handleCheckAvailability(functionCall.parameters, businessId, employee)
        break

      case 'takeMessage':
        result = await handleTakeMessage(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'transferCall':
      case 'transferToHuman':
        result = await handleTransferCall(functionCall.parameters, businessId, callId)
        break

      case 'getBusinessInfo':
        result = await handleGetBusinessInfo(functionCall.parameters, businessId, employee)
        break

      // === PERSONAL ASSISTANT FUNCTIONS ===
      case 'rescheduleAppointment':
        result = await handleRescheduleAppointment(functionCall.parameters, businessId)
        break

      case 'cancelAppointment':
        result = await handleCancelAppointment(functionCall.parameters, businessId)
        break

      case 'sendReminder':
        result = await handleSendReminder(functionCall.parameters, businessId, employee.id)
        break

      // === ORDER TAKER FUNCTIONS ===
      case 'addToOrder':
        result = await handleAddToOrder(functionCall.parameters, callId, employee)
        break

      case 'modifyOrderItem':
        result = await handleModifyOrderItem(functionCall.parameters, callId, employee)
        break

      case 'removeFromOrder':
        result = await handleRemoveFromOrder(functionCall.parameters, callId, employee)
        break

      case 'getOrderSummary':
      case 'calculateTotal':
        result = await handleGetOrderSummary(callId, employee)
        break

      case 'setOrderType':
        result = await handleSetOrderType(functionCall.parameters, callId, employee)
        break

      case 'setCustomerInfo':
        result = await handleSetCustomerInfo(functionCall.parameters, callId, employee)
        break

      case 'confirmOrder':
        result = await handleConfirmOrder(callId, businessId, employee.id, employee)
        break

      case 'getEstimatedTime':
        result = await handleGetEstimatedTime(functionCall.parameters, employee)
        break

      case 'processPayment':
        result = await handleProcessPayment(functionCall.parameters, callId, employee)
        break

      case 'checkItemAvailability':
        result = await handleCheckItemAvailability(functionCall.parameters, employee)
        break

      case 'getCalendarInfo':
        result = await handleGetCalendarInfo(functionCall.parameters, businessId)
        break

      case 'captureLeadInfo':
        result = await handleCaptureLeadInfo(functionCall.parameters, businessId, employee.id, callId)
        break

      // === PERSONAL ASSISTANT — SCREENING & TASKS ===
      case 'screenCall':
        result = await handleScreenCall(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'lookupContact':
        result = await handleLookupContact(functionCall.parameters, businessId, employee)
        break

      case 'createTask':
        result = await handleCreateTask(functionCall.parameters, businessId, employee.id, callId)
        break

      // === AFTER-HOURS EMERGENCY FUNCTIONS ===
      case 'triageEmergency':
        result = await handleTriageEmergency(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'notifyOnCall':
        result = await handleNotifyOnCall(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'escalateToBackup':
        result = await handleEscalateToBackup(functionCall.parameters, businessId, employee.id)
        break

      case 'takeEmergencyMessage':
        result = await handleTakeEmergencyMessage(functionCall.parameters, businessId, employee.id, callId)
        break

      // === RESTAURANT HOST FUNCTIONS ===
      case 'checkReservationAvailability':
        result = await handleCheckReservationAvailability(functionCall.parameters, businessId, employee)
        break

      case 'bookReservation':
        result = await handleBookReservation(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'cancelReservation':
        result = await handleCancelReservation(functionCall.parameters, businessId, employee.id)
        break

      case 'modifyReservation':
        result = await handleModifyReservation(functionCall.parameters, businessId, employee.id)
        break

      case 'addToWaitlist':
        result = await handleAddToWaitlist(functionCall.parameters, businessId, employee.id, callId)
        break

      // === SURVEY CALLER FUNCTIONS ===
      case 'recordResponse':
        result = await handleRecordSurveyResponse(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'completeSurvey':
        result = await handleCompleteSurvey(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'requestReview':
        result = await handleRequestReview(functionCall.parameters, businessId, employee.id, callId)
        break

      // === LEAD QUALIFIER FUNCTIONS ===
      case 'qualifyLead':
        result = await handleQualifyLead(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'scoreLead':
        result = await handleScoreLead(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'bookDiscoveryCall':
        result = await handleBookDiscoveryCall(functionCall.parameters, businessId, employee.id, callId)
        break

      // === APPOINTMENT REMINDER FUNCTIONS ===
      case 'confirmAppointment':
        result = await handleConfirmAppointment(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'requestReschedule':
        result = await handleRescheduleRequest(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'recordNoAnswer':
        result = await handleRecordNoAnswer(functionCall.parameters, businessId, employee.id, callId)
        break

      // === COLLECTIONS FUNCTIONS ===
      case 'lookupBalance':
        result = await handleLookupBalance(functionCall.parameters, businessId, employee.id)
        break

      case 'recordPaymentPromise':
        result = await handleRecordPaymentPromise(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'offerPaymentPlan':
        result = await handleOfferPaymentPlan(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'recordDispute':
        result = await handleRecordDispute(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'scheduleCallback':
        result = await handleScheduleCallback(functionCall.parameters, businessId, employee.id, callId)
        break

      // === CUSTOMER SERVICE FUNCTIONS ===
      case 'lookupOrder':
        result = await handleLookupOrder(functionCall.parameters, businessId)
        break

      case 'logComplaint':
        result = await handleLogComplaint(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'processReturnRequest':
        result = await handleProcessReturnRequest(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'escalateToManager':
        result = await handleEscalateToManager(functionCall.parameters, businessId, employee.id, callId)
        break

      // === LIVE CALLER LOOKUP ===
      case 'lookupCaller':
        result = await handleLookupCaller(functionCall.parameters, businessId, employee)
        break

      default:
        result = { error: `Unknown function: ${functionCall?.name}` }
    }

    return NextResponse.json({ result })

  } catch (error: any) {
    console.error(`[PhoneEmployeeWebhook] Function error:`, error)
    return NextResponse.json({
      result: { error: error.message, success: false }
    })
  }
}

// ============================================
// TOOL-CALLS HANDLER (new VAPI format)
// ============================================

async function handleToolCalls(
  message: any,
  employee: any,
  businessId: string
): Promise<NextResponse> {
  const callId = message.call?.id
  const callerNumber = message.call?.customer?.number

  // Log raw structure to debug VAPI payload format
  console.log(`[PhoneEmployeeWebhook] tool-calls raw keys:`, {
    hasToolCallList: !!message.toolCallList,
    hasToolWithToolCallList: !!message.toolWithToolCallList,
    toolCallListSample: message.toolCallList?.[0] ? JSON.stringify(message.toolCallList[0]).substring(0, 300) : 'empty',
    toolWithToolCallListSample: message.toolWithToolCallList?.[0] ? JSON.stringify(message.toolWithToolCallList[0]).substring(0, 300) : 'empty',
  })

  // Normalize tool calls from various VAPI payload formats
  const rawList = message.toolCallList || message.toolWithToolCallList || []
  const toolCallList = rawList.map((t: any) => {
    // Format 1: { id, function: { name, arguments } } (OpenAI format)
    // Format 2: { id, name, parameters } (simple format)
    // Format 3: { toolCall: { id, function: { name, arguments } }, type, function: { name } } (toolWithToolCallList)
    const tc = t.toolCall || t
    const name = tc.function?.name || tc.name || t.function?.name || t.name
    let parameters = tc.parameters || {}
    if (tc.function?.arguments) {
      try {
        parameters = typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments
      } catch { parameters = {} }
    }
    return { id: tc.id || t.id, name, parameters }
  })

  console.log(`[PhoneEmployeeWebhook] tool-calls: ${toolCallList.map((t: any) => t.name).join(', ')}`)

  const results = []

  for (const toolCall of toolCallList) {
    const functionName = toolCall.name
    const parameters = toolCall.parameters || {}
    const toolCallId = toolCall.id

    try {
      let result: any

      switch (functionName) {
        case 'scheduleAppointment':
        case 'bookAppointment': {
          // Inject caller phone if AI didn't collect it
          const apptParams = { ...parameters }
          if (!apptParams.customerPhone && !apptParams.phone && callerNumber) {
            apptParams.customerPhone = callerNumber
          }
          const isTrialToolCall = await isTrialBusiness(businessId)
          result = await handleScheduleAppointment(apptParams, businessId, employee.id, { isTrial: isTrialToolCall })
          break
        }

        case 'checkAvailability':
          result = await handleCheckAvailability(parameters, businessId, employee)
          break

        case 'takeMessage':
          result = await handleTakeMessage(parameters, businessId, employee.id, callId)
          break

        case 'transferCall':
        case 'transferToHuman':
          result = await handleTransferCall(parameters, businessId, callId)
          break

        case 'getBusinessInfo':
          result = await handleGetBusinessInfo(parameters, businessId, employee)
          break

        case 'rescheduleAppointment':
          result = await handleRescheduleAppointment(parameters, businessId)
          break

        case 'cancelAppointment':
          result = await handleCancelAppointment(parameters, businessId)
          break

        case 'sendReminder':
          result = await handleSendReminder(parameters, businessId, employee.id)
          break

        case 'addToOrder':
          result = await handleAddToOrder(parameters, callId, employee)
          break

        case 'modifyOrderItem':
          result = await handleModifyOrderItem(parameters, callId, employee)
          break

        case 'removeFromOrder':
          result = await handleRemoveFromOrder(parameters, callId, employee)
          break

        case 'getOrderSummary':
        case 'calculateTotal':
          result = await handleGetOrderSummary(callId, employee)
          break

        case 'setOrderType':
          result = await handleSetOrderType(parameters, callId, employee)
          break

        case 'setCustomerInfo':
          result = await handleSetCustomerInfo(parameters, callId, employee)
          break

        case 'confirmOrder':
          result = await handleConfirmOrder(callId, businessId, employee.id, employee)
          break

        case 'getEstimatedTime':
          result = await handleGetEstimatedTime(parameters, employee)
          break

        case 'processPayment':
          result = await handleProcessPayment(parameters, callId, employee)
          break

        case 'checkItemAvailability':
          result = await handleCheckItemAvailability(parameters, employee)
          break

        case 'getCalendarInfo':
          result = await handleGetCalendarInfo(parameters, businessId)
          break

        case 'captureLeadInfo':
          result = await handleCaptureLeadInfo(parameters, businessId, employee.id, callId)
          break

        case 'screenCall':
          result = await handleScreenCall(parameters, businessId, employee.id, callId)
          break

        case 'lookupContact':
          result = await handleLookupContact(parameters, businessId, employee)
          break

        case 'createTask':
          result = await handleCreateTask(parameters, businessId, employee.id, callId)
          break

        case 'triageEmergency':
          result = await handleTriageEmergency(parameters, businessId, employee.id, callId)
          break

        case 'notifyOnCall':
          result = await handleNotifyOnCall(parameters, businessId, employee.id, callId)
          break

        case 'escalateToBackup':
          result = await handleEscalateToBackup(parameters, businessId, employee.id)
          break

        case 'takeEmergencyMessage':
          result = await handleTakeEmergencyMessage(parameters, businessId, employee.id, callId)
          break

        case 'checkReservationAvailability':
          result = await handleCheckReservationAvailability(parameters, businessId, employee)
          break

        case 'bookReservation':
          result = await handleBookReservation(parameters, businessId, employee.id, callId)
          break

        case 'cancelReservation':
          result = await handleCancelReservation(parameters, businessId, employee.id)
          break

        case 'modifyReservation':
          result = await handleModifyReservation(parameters, businessId, employee.id)
          break

        case 'addToWaitlist':
          result = await handleAddToWaitlist(parameters, businessId, employee.id, callId)
          break

        case 'recordResponse':
          result = await handleRecordSurveyResponse(parameters, businessId, employee.id, callId)
          break

        case 'completeSurvey':
          result = await handleCompleteSurvey(parameters, businessId, employee.id, callId)
          break

        case 'requestReview':
          result = await handleRequestReview(parameters, businessId, employee.id, callId)
          break

        case 'qualifyLead':
          result = await handleQualifyLead(parameters, businessId, employee.id, callId)
          break

        case 'scoreLead':
          result = await handleScoreLead(parameters, businessId, employee.id, callId)
          break

        case 'bookDiscoveryCall':
          result = await handleBookDiscoveryCall(parameters, businessId, employee.id, callId)
          break

        case 'confirmAppointment':
          result = await handleConfirmAppointment(parameters, businessId, employee.id, callId)
          break

        case 'requestReschedule':
          result = await handleRescheduleRequest(parameters, businessId, employee.id, callId)
          break

        case 'recordNoAnswer':
          result = await handleRecordNoAnswer(parameters, businessId, employee.id, callId)
          break

        case 'lookupBalance':
          result = await handleLookupBalance(parameters, businessId, employee.id)
          break

        case 'recordPaymentPromise':
          result = await handleRecordPaymentPromise(parameters, businessId, employee.id, callId)
          break

        case 'offerPaymentPlan':
          result = await handleOfferPaymentPlan(parameters, businessId, employee.id, callId)
          break

        case 'recordDispute':
          result = await handleRecordDispute(parameters, businessId, employee.id, callId)
          break

        case 'scheduleCallback':
          result = await handleScheduleCallback(parameters, businessId, employee.id, callId)
          break

        case 'lookupOrder':
          result = await handleLookupOrder(parameters, businessId)
          break

        case 'logComplaint':
          result = await handleLogComplaint(parameters, businessId, employee.id, callId)
          break

        case 'processReturnRequest':
          result = await handleProcessReturnRequest(parameters, businessId, employee.id, callId)
          break

        case 'escalateToManager':
          result = await handleEscalateToManager(parameters, businessId, employee.id, callId)
          break

        case 'lookupCaller':
          result = await handleLookupCaller(parameters, businessId, employee)
          break

        default:
          result = { error: `Unknown function: ${functionName}` }
      }

      results.push({
        name: functionName,
        toolCallId,
        result: typeof result === 'string' ? result : JSON.stringify(result),
      })
    } catch (error: any) {
      console.error(`[PhoneEmployeeWebhook] Tool call error (${functionName}):`, error)
      results.push({
        name: functionName,
        toolCallId,
        result: JSON.stringify({ error: error.message, success: false }),
      })
    }
  }

  return NextResponse.json({ results })
}

// ============================================
// APPOINTMENT FUNCTIONS
// ============================================

// Appointment handlers imported from @/lib/phone-employees/appointment-handlers

// ============================================
// MESSAGE FUNCTIONS
// ============================================

async function handleTakeMessage(params: any, businessId: string, employeeId: string, callId?: string) {
  const message = await messageSystem.takeMessage({
    businessId,
    employeeId,
    callerName: params.callerName,
    callerPhone: params.callerPhone,
    callerEmail: params.callerEmail,
    forPerson: params.forPerson,
    reason: params.message?.substring(0, 100) || 'General inquiry',
    fullMessage: params.message,
    urgency: params.urgency || 'normal',
    callbackRequested: params.callbackRequested || false,
    callId,
  })

  // Fire automation rules for message_received
  automationEngine.evaluateRules(businessId, 'message_received', {
    messageId: message.id,
    callerName: params.callerName,
    callerPhone: params.callerPhone,
    message: params.message,
    urgency: params.urgency || 'normal',
    forPerson: params.forPerson,
    callbackRequested: params.callbackRequested,
  }).catch(err => console.error('[Automation] message_received error:', err))

  // Notify business owner — email for trial, SMS for paid
  const isTrial = await isTrialBusiness(businessId)
  if (isTrial) {
    const ownerEmail = await getOwnerEmail(businessId)
    const { data: biz } = await supabase.from('businesses').select('name').eq('id', businessId).single()
    if (ownerEmail) {
      sendMessageNotification({
        businessId,
        ownerEmail,
        businessName: biz?.name || 'Your Business',
        callerName: params.callerName || 'Unknown',
        callerPhone: params.callerPhone || '',
        message: params.message || '',
        urgency: params.urgency || 'normal',
        forPerson: params.forPerson,
        callbackRequested: params.callbackRequested,
      }).catch(err => console.error('[TakeMessage] email notify error:', err))
    }
  } else {
    const urgencyLabel = params.urgency === 'urgent' || params.urgency === 'high' ? ' [URGENT]' : ''
    const forLabel = params.forPerson ? ` for ${params.forPerson}` : ''
    notifyBusinessOwner(
      businessId,
      employeeId,
      `${urgencyLabel}New message${forLabel} from ${params.callerName} (${params.callerPhone}): "${params.message}"${params.callbackRequested ? ' — callback requested.' : ''}`
    ).catch(err => console.error('[TakeMessage] owner notify error:', err))
  }

  return {
    success: true,
    messageId: message.id,
    message: `I've recorded your message${params.forPerson ? ` for ${params.forPerson}` : ''}. ${params.callbackRequested ? "They'll call you back as soon as possible." : "We'll make sure they receive it."}`,
  }
}

async function handleTransferCall(params: any, businessId: string, callId?: string) {
  const destination = params.destination // phone number or department name
  const reason = params.reason

  console.log(`[Transfer Request] Call: ${callId}, Destination: ${destination}, Reason: ${reason}`)

  // Look up transfer destination from business settings
  const { data: business } = await supabase
    .from('businesses')
    .select('phone_number, settings')
    .eq('id', businessId)
    .single()

  // Resolve destination to a phone number
  let transferNumber = destination
  const transferMap = business?.settings?.transfer_numbers as Record<string, string> | undefined
  if (transferMap && transferMap[destination.toLowerCase()]) {
    transferNumber = transferMap[destination.toLowerCase()]
  }

  // Validate it looks like a phone number
  const isPhoneNumber = /^\+?[\d\s\-()]{7,}$/.test(transferNumber)

  if (!isPhoneNumber) {
    // Can't resolve to a real number - fall back to taking a message
    console.warn(`[Transfer] Could not resolve "${destination}" to a phone number`)
    return {
      transfer: false,
      message: `I wasn't able to transfer you directly. Let me take a message and have ${destination} call you back as soon as possible. What would you like me to tell them?`,
    }
  }

  // Use VAPI's transfer mechanism via the function call response
  // VAPI supports transferCall by returning a destination in the response
  // which triggers VAPI's built-in SIP/phone transfer
  if (callId && process.env.VAPI_API_KEY) {
    try {
      // Use VAPI's transfer call API
      const response = await fetch(`https://api.vapi.ai/call/${callId}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: {
            type: 'number',
            number: transferNumber,
            message: `Transferring call. Reason: ${reason || 'Customer requested transfer'}`,
          },
        }),
      })

      if (response.ok) {
        // Log the transfer
        await supabase.from('communication_logs').insert({
          business_id: businessId,
          type: 'call',
          direction: 'outbound',
          to_phone: transferNumber,
          content: `Call transferred to ${destination}. Reason: ${reason}`,
          status: 'transferred',
          metadata: { callId, destination, reason },
          created_at: new Date().toISOString(),
        })

        return {
          transfer: true,
          destination: transferNumber,
          message: `I'm transferring you to ${destination} now. Please hold for just a moment.`,
        }
      }

      const errorData = await response.json().catch(() => ({}))
      console.error('[Transfer] VAPI transfer failed:', errorData)
    } catch (err) {
      console.error('[Transfer] VAPI transfer error:', err)
    }
  }

  // Fallback: return transfer intent for VAPI to handle via function response
  return {
    transfer: true,
    destination: transferNumber,
    message: `I'm transferring you to ${destination} now. Please hold for just a moment.`,
  }
}

async function handleSendReminder(params: any, businessId: string, employeeId: string) {
  await taskScheduler.scheduleFollowUp({
    businessId,
    employeeId,
    targetPhone: params.recipientPhone,
    delayMinutes: calculateDelayMinutes(params.reminderTime),
    message: params.message,
    channel: 'sms',
  })

  return {
    success: true,
    message: `I'll send a reminder at ${params.reminderTime}.`,
  }
}

function calculateDelayMinutes(timeString: string): number {
  // Parse relative time strings like "in 1 hour", "tomorrow at 9am"
  // For simplicity, default to 60 minutes
  const lower = timeString.toLowerCase()
  if (lower.includes('hour')) {
    const hours = parseInt(lower.match(/\d+/)?.[0] || '1')
    return hours * 60
  }
  if (lower.includes('minute')) {
    return parseInt(lower.match(/\d+/)?.[0] || '30')
  }
  return 60
}

// ============================================
// BUSINESS INFO FUNCTIONS
// ============================================

async function handleGetBusinessInfo(params: any, businessId: string, employee: any) {
  const { data: business } = await supabase
    .from('businesses')
    .select('name, phone, email, settings, business_description')
    .eq('id', businessId)
    .single()

  if (!business) {
    return { error: 'Business not found' }
  }

  switch (params.infoType) {
    case 'hours':
      return {
        message: formatBusinessHours(employee.schedule?.businessHours),
      }
    case 'location':
      return {
        message: "You can find our address on our website, or I can text it to you if you'd like.",
      }
    case 'contact':
      return {
        phone: business.phone,
        email: business.email,
        message: `You can reach us at ${business.phone} or email ${business.email}.`,
      }
    default:
      return {
        name: business.name,
        description: business.business_description,
        message: business.business_description || `${business.name} is happy to serve you!`,
      }
  }
}

/**
 * Format business hours from schedule into a human-readable string.
 * Groups consecutive days with identical hours together.
 */
function formatBusinessHours(businessHours: Record<string, { start: string; end: string } | null> | undefined): string {
  if (!businessHours) {
    return "We're open Monday through Friday from 9 AM to 5 PM."
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  }

  // Group consecutive days with the same hours
  const groups: { days: string[]; hours: { start: string; end: string } | null }[] = []

  for (const day of dayOrder) {
    const hours = businessHours[day] ?? null
    const lastGroup = groups[groups.length - 1]

    if (
      lastGroup &&
      lastGroup.hours === null && hours === null
    ) {
      lastGroup.days.push(day)
    } else if (
      lastGroup &&
      lastGroup.hours !== null && hours !== null &&
      lastGroup.hours.start === hours.start &&
      lastGroup.hours.end === hours.end
    ) {
      lastGroup.days.push(day)
    } else {
      groups.push({ days: [day], hours })
    }
  }

  const openParts: string[] = []
  const closedDays: string[] = []

  for (const group of groups) {
    if (group.hours === null) {
      closedDays.push(...group.days.map(d => dayNames[d]))
    } else {
      const startFormatted = formatTime(group.hours.start)
      const endFormatted = formatTime(group.hours.end)
      const dayRange = group.days.length === 1
        ? dayNames[group.days[0]]
        : `${dayNames[group.days[0]]} through ${dayNames[group.days[group.days.length - 1]]}`
      openParts.push(`${dayRange} from ${startFormatted} to ${endFormatted}`)
    }
  }

  let message = ''
  if (openParts.length > 0) {
    message = `We're open ${openParts.join(', and ')}.`
  }
  if (closedDays.length > 0) {
    message += ` Closed on ${closedDays.join(' and ')}.`
  }

  return message.trim()
}

/**
 * Convert 24-hour time string (e.g., "09:00", "17:00") to readable format (e.g., "9 AM", "5 PM").
 */
function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  if (minute > 0) {
    return `${hour}:${minuteStr} ${ampm}`
  }
  return `${hour} ${ampm}`
}

// ============================================
// ORDER FUNCTIONS
// ============================================

async function handleAddToOrder(params: any, callId: string, employee: any) {
  const existing = await getActiveOrder(callId)
  const items = existing?.items || []
  let subtotal = existing?.subtotal || 0

  const menu = employee.job_config?.menu
  const item = findMenuItem(menu, params.itemName)

  if (!item) {
    return {
      success: false,
      message: `I couldn't find "${params.itemName}" on our menu. Could you try again?`,
    }
  }

  const quantity = params.quantity || 1
  let itemTotal = item.price * quantity

  // Handle modifiers
  const modifiers: any[] = []
  if (params.modifiers) {
    for (const mod of params.modifiers) {
      const itemMod = item.modifiers?.find((m: any) => m.name.toLowerCase() === mod.name.toLowerCase())
      const option = itemMod?.options?.find((o: any) => o.name.toLowerCase() === mod.option.toLowerCase())
      if (option) {
        modifiers.push({ name: mod.name, option: option.name, price: option.price })
        itemTotal += option.price * quantity
      }
    }
  }

  items.push({
    name: item.name,
    quantity,
    unitPrice: item.price,
    totalPrice: itemTotal,
    modifiers,
    specialInstructions: params.specialInstructions,
    ...(item.posItemId ? { posItemId: item.posItemId } : {}),
  })

  subtotal += itemTotal
  await upsertActiveOrder(callId, employee.business_id, employee.id, { items, subtotal })

  return {
    success: true,
    item: item.name,
    quantity,
    itemTotal,
    orderTotal: subtotal,
    message: `Added ${quantity} ${item.name} to your order. Your current total is $${subtotal.toFixed(2)}. Anything else?`,
  }
}

async function handleModifyOrderItem(params: any, callId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order || !order.items?.length) {
    return { success: false, message: "I don't see any items in your order yet." }
  }

  const items = [...order.items]
  const itemIndex = items.findIndex((i: any) =>
    i.name.toLowerCase().includes(params.itemName.toLowerCase())
  )

  if (itemIndex === -1) {
    return { success: false, message: `I couldn't find ${params.itemName} in your order.` }
  }

  items[itemIndex].specialInstructions =
    (items[itemIndex].specialInstructions || '') + ' ' + params.modification

  await upsertActiveOrder(callId, employee.business_id, employee.id, { items, subtotal: order.subtotal })

  return {
    success: true,
    message: `Got it, I've noted "${params.modification}" for your ${params.itemName}.`,
  }
}

async function handleRemoveFromOrder(params: any, callId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order || !order.items?.length) {
    return { success: false, message: "Your order is empty." }
  }

  const items = [...order.items]
  const itemIndex = items.findIndex((i: any) =>
    i.name.toLowerCase().includes(params.itemName.toLowerCase())
  )

  if (itemIndex === -1) {
    return { success: false, message: `I couldn't find ${params.itemName} in your order.` }
  }

  const removed = items.splice(itemIndex, 1)[0]
  const subtotal = order.subtotal - removed.totalPrice

  await upsertActiveOrder(callId, employee.business_id, employee.id, { items, subtotal })

  return {
    success: true,
    message: `Removed ${removed.name} from your order. Your new total is $${subtotal.toFixed(2)}.`,
  }
}

async function handleGetOrderSummary(callId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order || !order.items?.length) {
    return { message: "Your order is empty. What would you like to order?" }
  }

  const itemList = order.items.map((i: any) =>
    `${i.quantity}x ${i.name}${i.modifiers?.length ? ` (${i.modifiers.map((m: any) => m.option).join(', ')})` : ''}`
  ).join(', ')

  const taxRate = employee.job_config?.taxRate || 0.0875
  const tax = order.subtotal * taxRate
  const total = order.subtotal + tax

  return {
    items: order.items,
    subtotal: order.subtotal,
    tax,
    total,
    message: `Your order is: ${itemList}. Subtotal is $${order.subtotal.toFixed(2)}, plus $${tax.toFixed(2)} tax, for a total of $${total.toFixed(2)}.`,
  }
}

async function handleSetOrderType(params: any, callId: string, employee: any) {
  const existing = await getActiveOrder(callId)
  await upsertActiveOrder(callId, employee.business_id, employee.id, {
    items: existing?.items || [],
    subtotal: existing?.subtotal || 0,
    orderType: params.orderType,
    deliveryAddress: params.deliveryAddress,
    requestedTime: params.requestedTime,
  })

  return {
    success: true,
    message: params.orderType === 'delivery'
      ? "Great, that'll be for delivery. Can I get your delivery address?"
      : "Perfect, that'll be for pickup. Can I get a name for the order?",
  }
}

async function handleSetCustomerInfo(params: any, callId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order) {
    return { success: false, message: "Let's add some items to your order first." }
  }

  await upsertActiveOrder(callId, employee.business_id, employee.id, {
    items: order.items,
    subtotal: order.subtotal,
    customerInfo: { name: params.name, phone: params.phone, email: params.email },
  })

  return {
    success: true,
    message: `Got it, ${params.name}. Let me read back your order to make sure I have everything right.`,
  }
}

async function handleConfirmOrder(callId: string, businessId: string, employeeId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order || !order.items?.length) {
    return { success: false, message: "Your order is empty. What would you like to order?" }
  }

  const settings = employee.job_config?.orderSettings
  const taxRate = employee.job_config?.taxRate || 0.0875
  const tax = order.subtotal * taxRate
  const deliveryFee = order.order_type === 'delivery' ? (settings?.deliveryFee || 0) : 0
  const total = order.subtotal + tax + deliveryFee

  const pickupTime = settings?.estimatedTime?.pickup || 20
  const deliveryTime = settings?.estimatedTime?.delivery || 45

  // Update order to confirmed
  const { data: savedOrder, error } = await supabase
    .from('phone_orders')
    .update({
      tax,
      delivery_fee: deliveryFee,
      total,
      status: 'confirmed',
      payment_method: order.payment_method,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select()
    .single()

  if (error) {
    console.error('[Order Error]', error)
    return { success: false, message: "I'm having trouble confirming your order. Let me get a manager." }
  }

  // Submit to Square POS if connected (fire-and-forget — never block order flow)
  SquareService.getConnection(businessId).then(async (squareConn) => {
    if (!squareConn) return
    const locationId = squareConn.locationId
    const squareResult = await SquareService.createOrder(businessId, savedOrder, locationId)
    if (squareResult.success && squareResult.squareOrderId) {
      await supabase
        .from('phone_orders')
        .update({ external_order_id: squareResult.squareOrderId, external_provider: 'square' })
        .eq('id', savedOrder.id)
    }
  }).catch(err => console.error('[Square] POS submission error:', err))

  // Send confirmation SMS
  if (order.customer_phone) {
    const timeEstimate = order.order_type === 'delivery'
      ? `Delivery in ~${deliveryTime} mins.`
      : `Ready in ~${pickupTime} mins.`

    await actionExecutor.execute({
      id: `order-confirm-${savedOrder.id}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: order.customer_phone },
      content: {
        message: `Your order #${savedOrder.id.slice(-6)} is confirmed! Total: $${total.toFixed(2)}. ${timeEstimate}`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  // Email the business owner — fires alongside SMS so orders are visible
  // during testing even when A2P SMS is pending approval
  Promise.all([
    getOwnerEmail(businessId),
    supabase.from('businesses').select('name').eq('id', businessId).single(),
  ]).then(([ownerEmail, bizResult]) => {
    if (!ownerEmail) return
    sendOrderNotification({
      businessId,
      ownerEmail,
      businessName: bizResult.data?.name || 'Your Business',
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      orderType: order.order_type,
      items: (order.items || []).map((item: any) => ({
        name: item.name || item.itemName,
        quantity: item.quantity || 1,
        price: item.price,
      })),
      total,
    })
  }).catch(err => console.error('[Order Email] notification error:', err))

  // --- Integration hooks (all fire-and-forget, never block order flow) ---

  // Fire webhook event
  webhookService.fireEvent(businessId, 'order_confirmed', {
    orderId: savedOrder.id,
    total,
    items: order.items,
    orderType: order.order_type,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    paymentMethod: order.payment_method,
  }).catch(err => console.error('[Webhook] order_confirmed fire error:', err))

  // Evaluate automation rules
  automationEngine.evaluateRules(businessId, 'order_confirmed', {
    orderId: savedOrder.id,
    total,
    itemCount: order.items?.length || 0,
    items: order.items,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    paymentMethod: order.payment_method,
  }).catch(err => console.error('[Automation] order_confirmed error:', err))

  // Schedule Google Reviews SMS request
  if (order.customer_phone) {
    GoogleReviewsManager.scheduleReviewRequest({
      businessId,
      employeeId,
      customerPhone: order.customer_phone,
      customerName: order.customer_name,
      orderId: savedOrder.id,
      interactionType: 'order',
    }).catch(err => console.error('[GoogleReviews] schedule error:', err))
  }

  // HubSpot CRM: upsert contact + create deal
  if (order.customer_phone) {
    HubSpotService.upsertContact(businessId, {
      phone: order.customer_phone,
      firstName: order.customer_name?.split(' ')[0],
      lastName: order.customer_name?.split(' ').slice(1).join(' '),
    }).then(result => {
      if (result.contactId) {
        HubSpotService.createDealFromOrder(businessId, result.contactId, {
          orderId: savedOrder.id,
          customerName: order.customer_name || 'Customer',
          total,
          items: (order.items || []).map((i: any) => `${i.quantity}x ${i.name}`),
        }).catch(err => console.error('[HubSpot] deal creation error:', err))
      }
    }).catch(err => console.error('[HubSpot] contact upsert error:', err))
  }

  // Toast POS: submit order
  getToastConnection(businessId).then(conn => {
    if (!conn) return
    createToastOrder(conn, {
      items: (savedOrder.items || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity || 1,
        unitPrice: i.unitPrice || 0,
        posItemId: i.posItemId,
        modifiers: i.modifiers,
        specialInstructions: i.specialInstructions,
      })),
      orderType: savedOrder.order_type || 'pickup',
      customerName: savedOrder.customer_name,
      customerPhone: savedOrder.customer_phone,
      total,
    }).then(result => {
      if (result.success && result.toastOrderId) {
        supabase
          .from('phone_orders')
          .update({ external_order_id: result.toastOrderId, external_provider: 'toast' })
          .eq('id', savedOrder.id)
          .then(() => {})
      } else if (!result.success) {
        console.warn('[Toast] POS submission failed:', result.error)
      }
    })
  }).catch(err => console.error('[Toast] connection check error:', err))

  // Clover POS: submit order
  getCloverConnection(businessId).then(conn => {
    if (!conn) return
    createCloverOrder(conn, {
      items: (savedOrder.items || []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity || 1,
        unitPrice: i.unitPrice || 0,
        posItemId: i.posItemId,
        modifiers: i.modifiers,
        specialInstructions: i.specialInstructions,
      })),
      orderType: savedOrder.order_type || 'pickup',
      customerName: savedOrder.customer_name,
      customerPhone: savedOrder.customer_phone,
      total,
    }).then(result => {
      if (result.success && result.cloverOrderId) {
        supabase
          .from('phone_orders')
          .update({ external_order_id: result.cloverOrderId, external_provider: 'clover' })
          .eq('id', savedOrder.id)
          .then(() => {})
      } else if (!result.success) {
        console.warn('[Clover] POS submission failed:', result.error)
      }
    })
  }).catch(err => console.error('[Clover] connection check error:', err))

  const timeMsg = order.order_type === 'delivery'
    ? `It should arrive in about ${deliveryTime} minutes.`
    : `It'll be ready in about ${pickupTime} minutes.`

  return {
    success: true,
    orderId: savedOrder.id,
    total,
    message: `Your order is confirmed! Your total is $${total.toFixed(2)}. ${timeMsg} Thank you for your order!`,
  }
}

async function handleGetEstimatedTime(params: any, employee: any) {
  const settings = employee.job_config?.orderSettings
  const time = params.orderType === 'delivery'
    ? settings?.estimatedTime?.delivery || 45
    : settings?.estimatedTime?.pickup || 20

  return {
    estimatedMinutes: time,
    message: `${params.orderType === 'delivery' ? 'Delivery' : 'Pickup'} will be ready in approximately ${time} minutes.`,
  }
}

function findMenuItem(menu: any, itemName: string): any {
  if (!menu?.categories) return null

  const search = itemName.toLowerCase()
  for (const category of menu.categories) {
    for (const item of category.items) {
      if (item.name.toLowerCase().includes(search)) {
        return item
      }
    }
  }
  return null
}

// ============================================
// MISSING FUNCTION HANDLERS
// ============================================

async function handleProcessPayment(params: any, callId: string, employee: any) {
  const order = await getActiveOrder(callId)
  if (!order) {
    return { success: false, message: "I don't see an active order to process payment for." }
  }

  const method = params.paymentMethod || 'card'

  // Record payment method on the order
  await supabase
    .from('phone_orders')
    .update({
      payment_method: method,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (method === 'cash') {
    return {
      success: true,
      message: "No problem, you can pay with cash when you pick up your order.",
    }
  }

  // For card payments, create a Stripe Checkout Session and send link via SMS
  const taxRate = employee.job_config?.taxRate || 0.0875
  const tax = order.subtotal * taxRate
  const deliveryFee = order.order_type === 'delivery' ? (employee.job_config?.orderSettings?.deliveryFee || 0) : 0
  const total = order.subtotal + tax + deliveryFee
  const totalCents = Math.round(total * 100)

  const businessName = employee.businesses?.name || 'Business'
  const itemSummary = (order.items || [])
    .map((i: any) => `${i.quantity}x ${i.name}`)
    .join(', ')

  const checkoutResult = await StripeService.createCheckoutSession({
    amount: totalCents,
    businessId: employee.business_id,
    orderId: order.id,
    businessName,
    orderDescription: itemSummary || 'Phone order',
    customerPhone: order.customer_phone,
  })

  if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
    // Fallback: tell them to pay at pickup
    return {
      success: true,
      message: "I wasn't able to create a payment link right now. You can pay with your card when you pick up your order.",
    }
  }

  // Send payment link via SMS if we have a phone number
  if (order.customer_phone) {
    await actionExecutor.execute({
      id: `payment-link-${order.id}`,
      businessId: employee.business_id,
      employeeId: employee.id,
      actionType: 'send_sms',
      target: { phone: order.customer_phone },
      content: {
        message: `Pay for your ${businessName} order ($${total.toFixed(2)}): ${checkoutResult.checkoutUrl}`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })

    return {
      success: true,
      message: `I'm sending a payment link to your phone now. Your total is $${total.toFixed(2)}. Just tap the link to pay with your card.`,
    }
  }

  return {
    success: true,
    message: `Your total is $${total.toFixed(2)}. You can pay with your card when you arrive to pick up your order.`,
  }
}

async function handleCheckItemAvailability(params: any, employee: any) {
  const menu = employee.job_config?.menu
  const item = findMenuItem(menu, params.itemName)

  if (!item) {
    return {
      available: false,
      message: `I don't see "${params.itemName}" on our menu. Would you like to hear what we have available?`,
    }
  }

  // Check optional out-of-stock list in job config
  const outOfStock = employee.job_config?.outOfStockItems || []
  const isOutOfStock = outOfStock.some((name: string) =>
    name.toLowerCase() === item.name.toLowerCase()
  )

  if (isOutOfStock) {
    return {
      available: false,
      item: item.name,
      message: `I'm sorry, the ${item.name} is currently unavailable. Can I suggest something else?`,
    }
  }

  return {
    available: true,
    item: item.name,
    price: item.price,
    message: `Yes, the ${item.name} is available! It's $${item.price.toFixed(2)}. Would you like to add it to your order?`,
  }
}

// ============================================
// LEAD CAPTURE
// ============================================

async function handleCaptureLeadInfo(params: any, businessId: string, employeeId: string, callId?: string) {
  const { data: lead, error } = await supabase
    .from('phone_messages')
    .insert({
      business_id: businessId,
      employee_id: employeeId,
      call_id: callId,
      caller_name: params.name,
      caller_phone: params.phone,
      caller_email: params.email,
      message: `Lead captured. Interested in: ${params.interestedIn || 'general inquiry'}. Notes: ${params.notes || 'none'}`,
      urgency: 'low',
      status: 'unread',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[CaptureLeadInfo] DB error:', error)
  }

  // Notify business owner
  await notifyBusinessOwner(
    businessId,
    employeeId,
    `New lead from ${params.name} (${params.phone}): interested in ${params.interestedIn || 'your services'}. Follow up when ready.`
  )

  return {
    success: true,
    message: `Got it! I've noted your interest${params.interestedIn ? ` in ${params.interestedIn}` : ''}. Someone from our team will be in touch with you soon.`,
  }
}

// ============================================
// PERSONAL ASSISTANT — SCREENING & TASKS
// ============================================

async function handleScreenCall(params: any, businessId: string, employeeId: string, callId?: string) {
  // Log the screened call as an action_request so the owner can review
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.callerPhone },
    content: {
      data: {
        callerName: params.callerName,
        callerPhone: params.callerPhone,
        callerCompany: params.callerCompany,
        purpose: params.purpose,
        urgency: params.urgency,
        requestType: params.requestType,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  // For urgent calls, notify owner immediately
  if (params.urgency === 'urgent' || params.urgency === 'high') {
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `URGENT call: ${params.callerName}${params.callerCompany ? ` (${params.callerCompany})` : ''} — ${params.purpose}. Phone: ${params.callerPhone || 'unknown'}`
    )
  }

  return {
    success: true,
    screened: true,
    urgency: params.urgency || 'normal',
    message: 'Call screened and logged successfully.',
  }
}

async function handleLookupContact(params: any, businessId: string, employee: any) {
  const jobConfig = employee.job_config || {}
  const vipContacts: string[] = jobConfig.messagePriorities?.vipContacts || []

  // Check against VIP list (name or phone match)
  const phone = params.phone?.replace(/\D/g, '') || ''
  const name = (params.name || '').toLowerCase()

  const isVip = vipContacts.some(v => {
    const clean = v.replace(/\D/g, '')
    return (phone && clean === phone) || (name && v.toLowerCase().includes(name))
  })

  // Check call history in employee_calls
  const { data: pastCalls } = await supabase
    .from('employee_calls')
    .select('id, started_at, duration_seconds')
    .eq('business_id', businessId)
    .eq('caller_phone', params.phone)
    .order('started_at', { ascending: false })
    .limit(5)

  const callCount = pastCalls?.length || 0
  const isRepeatCaller = callCount > 0

  return {
    success: true,
    isVip,
    isRepeatCaller,
    callCount,
    lastCalled: pastCalls?.[0]?.started_at || null,
    recommendation: isVip
      ? 'VIP contact — offer to connect immediately or take priority message'
      : isRepeatCaller
      ? `Repeat caller (${callCount} previous calls) — treat as established contact`
      : 'New caller — screen purpose before connecting',
  }
}

async function handleCreateTask(params: any, businessId: string, employeeId: string, callId?: string) {
  // Save to action_requests as a task
  const { data: task, error } = await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.relatedCallerPhone },
    content: {
      message: params.notes || params.title,
      data: {
        taskTitle: params.title,
        notes: params.notes,
        dueDate: params.dueDate,
        priority: params.priority || 'normal',
        relatedCallerName: params.relatedCallerName,
        relatedCallerPhone: params.relatedCallerPhone,
        callId,
      },
    },
    status: 'pending',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    console.error('[CreateTask] DB error:', error)
  }

  // Notify owner about the task
  await notifyBusinessOwner(
    businessId,
    employeeId,
    `New task from your assistant: "${params.title}"${params.relatedCallerName ? ` — re: ${params.relatedCallerName}` : ''}${params.dueDate ? ` (due ${params.dueDate})` : ''}`
  )

  return {
    success: true,
    taskId: task?.id,
    message: `Task created: "${params.title}". I've noted it for follow-up.`,
  }
}

// ============================================
// AFTER-HOURS EMERGENCY FUNCTIONS
// ============================================

async function handleTriageEmergency(params: any, businessId: string, employeeId: string, callId?: string) {
  // Log the triage to action_requests
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.callerPhone },
    content: {
      data: {
        callerName: params.callerName,
        callerPhone: params.callerPhone,
        emergencyType: params.emergencyType,
        urgencyLevel: params.urgencyLevel,
        description: params.description,
        location: params.location,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  // For critical emergencies, notify business owner immediately via notifyBusinessOwner
  if (params.urgencyLevel === 'critical' || params.urgencyLevel === 'emergency') {
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `EMERGENCY: ${params.callerName || 'Unknown caller'} — ${params.emergencyType || params.description}. Phone: ${params.callerPhone || 'unknown'}. IMMEDIATE RESPONSE REQUIRED.`
    )
  }

  return {
    success: true,
    urgencyLevel: params.urgencyLevel,
    triaged: true,
    message: params.urgencyLevel === 'critical' || params.urgencyLevel === 'emergency'
      ? 'Emergency logged. On-call contact has been notified immediately.'
      : 'Situation recorded. Appropriate action will be taken.',
  }
}

async function handleNotifyOnCall(params: any, businessId: string, employeeId: string, callId?: string) {
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('job_config')
    .eq('id', employeeId)
    .single()

  const jobConfig = employee?.job_config as any
  const onCallContacts = jobConfig?.onCallContacts || []

  const contactIndex = params.contactIndex || 0
  const contact = onCallContacts[contactIndex]

  if (!contact) {
    // No on-call contacts configured — fall back to business owner notification
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `AFTER-HOURS EMERGENCY: ${params.callerName || 'Caller'} — ${params.emergencyDescription}. Phone: ${params.callerPhone}`
    )
    return {
      success: true,
      notified: false,
      message: 'No on-call contact configured. Business owner notified.',
    }
  }

  // Send SMS to on-call contact
  await actionExecutor.execute({
    id: `oncall-${Date.now()}`,
    businessId,
    employeeId,
    actionType: 'send_sms',
    target: { phone: contact.phone },
    content: {
      message: `[AFTER-HOURS EMERGENCY] ${params.emergencyDescription}. Caller: ${params.callerName || 'Unknown'} at ${params.callerPhone || 'unknown number'}. Please respond immediately.`,
    },
    status: 'pending',
    triggeredBy: 'call',
    createdAt: new Date(),
  })

  // Log the notification
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'send_sms',
    target: { phone: contact.phone },
    content: { message: `On-call notification sent to ${contact.name}` },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  return {
    success: true,
    notified: true,
    contactName: contact.name,
    contactPhone: contact.phone,
    message: `${contact.name} has been notified via SMS. They should respond shortly.`,
  }
}

async function handleEscalateToBackup(params: any, businessId: string, employeeId: string) {
  const { data: employee } = await supabase
    .from('phone_employees')
    .select('job_config')
    .eq('id', employeeId)
    .single()

  const jobConfig = employee?.job_config as any
  const onCallContacts = jobConfig?.onCallContacts || []

  const nextIndex = (params.failedContactIndex || 0) + 1
  const backupContact = onCallContacts[nextIndex]

  if (!backupContact) {
    await notifyBusinessOwner(businessId, employeeId,
      `ESCALATION: All on-call contacts unreachable. Emergency: ${params.emergencyDescription}. Caller: ${params.callerPhone}`)
    return {
      success: false,
      hasBackup: false,
      message: 'All on-call contacts have been tried. Business owner notified.',
    }
  }

  await actionExecutor.execute({
    id: `escalate-${Date.now()}`,
    businessId,
    employeeId,
    actionType: 'send_sms',
    target: { phone: backupContact.phone },
    content: {
      message: `[URGENT ESCALATION] Previous on-call unreachable. Emergency: ${params.emergencyDescription}. Caller: ${params.callerPhone}. You are now the primary on-call contact.`,
    },
    status: 'pending',
    triggeredBy: 'call',
    createdAt: new Date(),
  })

  return {
    success: true,
    hasBackup: true,
    contactName: backupContact.name,
    contactPhone: backupContact.phone,
    message: `Escalated to ${backupContact.name}. They've been notified via SMS.`,
  }
}

async function handleTakeEmergencyMessage(params: any, businessId: string, employeeId: string, callId?: string) {
  // Save as high-urgency phone message
  const { data: msg } = await supabase.from('phone_messages').insert({
    business_id: businessId,
    employee_id: employeeId,
    call_id: callId,
    caller_name: params.callerName,
    caller_phone: params.callerPhone,
    message: params.message,
    urgency: 'urgent',
    status: 'unread',
    callback_requested: true,
    created_at: new Date().toISOString(),
  }).select().single()

  // Always notify business owner of emergency messages
  await notifyBusinessOwner(
    businessId,
    employeeId,
    `AFTER-HOURS MESSAGE: ${params.callerName || 'Unknown'} (${params.callerPhone}) — ${params.message}. Callback requested.`
  )

  return {
    success: true,
    messageId: msg?.id,
    message: `Message recorded. ${params.callerName ? params.callerName + ', your message has been logged' : 'Your message has been logged'} and the appropriate person will follow up as soon as possible.`,
  }
}

// ============================================
// RESTAURANT HOST FUNCTIONS
// ============================================

async function handleCheckReservationAvailability(params: any, businessId: string, employee: any) {
  // Query appointments table for existing reservations on that date
  const { data: existing } = await supabase
    .from('appointments')
    .select('start_time, notes')
    .eq('business_id', businessId)
    .eq('appointment_date', params.date)
    .neq('status', 'cancelled')

  const jobConfig = employee.job_config as any
  const partySize = params.partySize || 1
  const tableCapacity = jobConfig?.tableCapacity || 60
  const slotInterval = 30

  // Find the matching day's reservation slots
  const dayOfWeek = new Date(params.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const daySlot = jobConfig?.reservationSlots?.find((s: any) => s.day === dayOfWeek)

  if (!daySlot) {
    return {
      success: true,
      available: false,
      message: `We are closed on that day. Please check our hours and try another date.`,
    }
  }

  // Count reserved seats already booked
  const reservedSeats = (existing || []).reduce((sum: number, appt: any) => {
    const partyMatch = appt.notes?.match(/Party of (\d+)/i)
    return sum + (partyMatch ? parseInt(partyMatch[1]) : 2)
  }, 0)

  const remainingCapacity = tableCapacity - reservedSeats

  if (remainingCapacity < partySize) {
    return {
      success: true,
      available: false,
      message: `We don't have availability for a party of ${partySize} on that date. Would you like to be added to the waitlist?`,
      canWaitlist: true,
    }
  }

  // Generate available time slots
  const slots: string[] = []
  const [openH, openM] = daySlot.openTime.split(':').map(Number)
  const [closeH, closeM] = daySlot.closeTime.split(':').map(Number)
  const interval = daySlot.slotIntervalMinutes || slotInterval

  let current = openH * 60 + openM
  const end = closeH * 60 + closeM - 60 // Last seating 1hr before close

  while (current <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    const isBooked = (existing || []).some((a: any) => a.start_time === timeStr)
    if (!isBooked) slots.push(timeStr)
    current += interval
  }

  return {
    success: true,
    available: slots.length > 0,
    availableSlots: slots.slice(0, 8), // return up to 8 options
    date: params.date,
    partySize,
    message: slots.length > 0
      ? `Great news! We have availability for a party of ${partySize} on that date. Available times: ${slots.slice(0, 4).join(', ')}${slots.length > 4 ? ', and more.' : '.'}`
      : `Unfortunately we're fully booked for that date. Would you like to be added to the waitlist or check another date?`,
  }
}

async function handleBookReservation(params: any, businessId: string, employeeId: string, callId?: string) {
  // Store in appointments table (service = 'Reservation')
  const { data: reservation, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      customer_name: params.guestName,
      customer_phone: params.guestPhone,
      customer_email: params.guestEmail,
      service: 'Reservation',
      appointment_date: params.date,
      start_time: params.time,
      notes: `Party of ${params.partySize}${params.specialOccasion ? '. Special occasion: ' + params.specialOccasion : ''}${params.specialRequests ? '. Requests: ' + params.specialRequests : ''}`,
      status: 'confirmed',
      source: 'phone_employee',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[BookReservation] DB error:', error)
  }

  // Send confirmation SMS to guest
  if (params.guestPhone) {
    await actionExecutor.execute({
      id: `res-confirm-${Date.now()}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: params.guestPhone },
      content: {
        message: `Your reservation is confirmed! Party of ${params.partySize} on ${params.date} at ${params.time}.${params.specialOccasion ? ` We noted your ${params.specialOccasion} — we look forward to celebrating with you!` : ''} Reply CANCEL to cancel.`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  // Notify owner of large party reservations
  if (params.partySize >= 8) {
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `Large party reservation: ${params.guestName}, party of ${params.partySize} on ${params.date} at ${params.time}.${params.specialOccasion ? ' Special occasion: ' + params.specialOccasion : ''}`
    )
  }

  return {
    success: true,
    reservationId: reservation?.id,
    message: `Perfect! Your reservation is confirmed for ${params.partySize} guests on ${params.date} at ${params.time}. We'll see you then${params.specialOccasion ? ' — and we look forward to celebrating with you' : ''}!`,
  }
}

async function handleCancelReservation(params: any, businessId: string, employeeId: string) {
  const { data: updated } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('customer_phone', params.guestPhone)
    .eq('status', 'confirmed')
    .select()

  return {
    success: true,
    cancelled: (updated?.length || 0) > 0,
    message: (updated?.length || 0) > 0
      ? `Your reservation has been cancelled. We hope to see you another time!`
      : `I couldn't find a reservation under that name and number. Please double-check your details or call us back.`,
  }
}

async function handleModifyReservation(params: any, businessId: string, employeeId: string) {
  const updates: any = { updated_at: new Date().toISOString() }
  if (params.newDate) updates.appointment_date = params.newDate
  if (params.newTime) updates.start_time = params.newTime
  if (params.newPartySize) {
    const { data: existing } = await supabase
      .from('appointments')
      .select('notes')
      .eq('business_id', businessId)
      .eq('customer_phone', params.guestPhone)
      .eq('status', 'confirmed')
      .single()
    if (existing) {
      updates.notes = existing.notes?.replace(/Party of \d+/, `Party of ${params.newPartySize}`) || `Party of ${params.newPartySize}`
    }
  }

  const { data: updated } = await supabase
    .from('appointments')
    .update(updates)
    .eq('business_id', businessId)
    .eq('customer_phone', params.guestPhone)
    .eq('status', 'confirmed')
    .select()

  return {
    success: true,
    modified: (updated?.length || 0) > 0,
    message: (updated?.length || 0) > 0
      ? `Your reservation has been updated.${params.newDate ? ' New date: ' + params.newDate + '.' : ''}${params.newTime ? ' New time: ' + params.newTime + '.' : ''}${params.newPartySize ? ' Party size: ' + params.newPartySize + '.' : ''} See you then!`
      : `I couldn't find your reservation. Please double-check your details.`,
  }
}

async function handleAddToWaitlist(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('phone_messages').insert({
    business_id: businessId,
    employee_id: employeeId,
    call_id: callId,
    caller_name: params.guestName,
    caller_phone: params.guestPhone,
    message: `Waitlist request: party of ${params.partySize}${params.preferredDate ? ' on ' + params.preferredDate : ''}${params.preferredTime ? ' at ' + params.preferredTime : ''}.`,
    urgency: 'normal',
    status: 'unread',
    callback_requested: true,
    created_at: new Date().toISOString(),
  })

  await notifyBusinessOwner(
    businessId,
    employeeId,
    `Waitlist: ${params.guestName} (${params.guestPhone}), party of ${params.partySize}${params.preferredDate ? ' for ' + params.preferredDate : ''}.`
  )

  return {
    success: true,
    message: `You've been added to our waitlist for a party of ${params.partySize}${params.preferredDate ? ' on ' + params.preferredDate : ''}. We'll call you at ${params.guestPhone} if a table opens up!`,
  }
}

// ============================================
// SURVEY CALLER FUNCTIONS
// ============================================

async function handleRecordSurveyResponse(params: any, businessId: string, employeeId: string, callId?: string) {
  // Store individual response in action_requests for aggregation
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: {},
    content: {
      data: {
        type: 'survey_response',
        questionId: params.questionId,
        questionText: params.questionText,
        responseType: params.responseType,
        numericValue: params.numericValue,
        textValue: params.textValue,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  return {
    success: true,
    recorded: true,
  }
}

async function handleCompleteSurvey(params: any, businessId: string, employeeId: string, callId?: string) {
  // Store survey completion summary
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: {},
    content: {
      data: {
        type: 'survey_complete',
        avgRating: params.avgRating,
        npsScore: params.npsScore,
        sentiment: params.sentiment,
        followUpRequested: params.followUpRequested,
        notes: params.notes,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  // If negative or follow-up requested, alert business owner
  if (params.sentiment === 'negative' || params.followUpRequested) {
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `Survey feedback alert: ${params.sentiment === 'negative' ? `Negative feedback (avg ${params.avgRating}/10)` : 'Customer requested follow-up'}. ${params.notes ? 'Notes: ' + params.notes : ''}`
    )
  }

  return {
    success: true,
    surveyComplete: true,
    sentiment: params.sentiment,
    avgRating: params.avgRating,
  }
}

async function handleRequestReview(params: any, businessId: string, employeeId: string, callId?: string) {
  // Log review request
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: {},
    content: {
      data: {
        type: 'review_requested',
        platform: params.platform,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  return {
    success: true,
    platform: params.platform,
    message: `Great — I'm glad to hear you had such a positive experience! Your review would mean a lot to us on ${params.platform === 'google' ? 'Google' : params.platform === 'yelp' ? 'Yelp' : 'Facebook'}.`,
  }
}

// ============================================
// LEAD QUALIFIER FUNCTIONS
// ============================================

async function handleQualifyLead(params: any, businessId: string, employeeId: string, callId?: string) {
  // Save lead info to phone_messages as a lead capture
  const { data: lead } = await supabase.from('phone_messages').insert({
    business_id: businessId,
    employee_id: employeeId,
    call_id: callId,
    caller_name: params.callerName,
    caller_phone: params.callerPhone,
    caller_email: params.callerEmail,
    caller_company: params.callerCompany,
    message: `Lead qualification data: Interest: ${params.interest || 'N/A'}. Timeline: ${params.timeline || 'N/A'}. Budget: ${params.budgetRange || 'N/A'}. Decision maker: ${params.isDecisionMaker ? 'Yes' : 'Unknown'}. Notes: ${params.additionalNotes || 'none'}`,
    urgency: 'normal',
    status: 'unread',
    callback_requested: false,
    created_at: new Date().toISOString(),
  }).select().single()

  return {
    success: true,
    leadId: lead?.id,
    recorded: true,
  }
}

async function handleScoreLead(params: any, businessId: string, employeeId: string, callId?: string) {
  // Update or create the lead record with tier
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.callerPhone },
    content: {
      data: {
        type: 'lead_scored',
        tier: params.tier,
        reasoning: params.reasoning,
        callerName: params.callerName,
        callerPhone: params.callerPhone,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  // Hot leads get immediate owner notification
  if (params.tier === 'hot') {
    await notifyBusinessOwner(
      businessId,
      employeeId,
      `HOT LEAD: ${params.callerName} (${params.callerPhone}). Reason: ${params.reasoning}. Follow up immediately!`
    )
  }

  return {
    success: true,
    tier: params.tier,
    scored: true,
  }
}

async function handleBookDiscoveryCall(params: any, businessId: string, employeeId: string, callId?: string) {
  // Book in appointments table as a discovery call
  const { data: appointment } = await supabase.from('appointments').insert({
    business_id: businessId,
    customer_name: params.callerName,
    customer_phone: params.callerPhone,
    customer_email: params.callerEmail,
    service: 'Discovery Call',
    appointment_date: params.date,
    start_time: params.time,
    notes: `Lead qualification notes: ${params.notes || 'N/A'}`,
    status: 'confirmed',
    source: 'phone_employee',
    created_at: new Date().toISOString(),
  }).select().single()

  // Send confirmation SMS to prospect
  if (params.callerPhone) {
    await actionExecutor.execute({
      id: `discovery-confirm-${Date.now()}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: params.callerPhone },
      content: {
        message: `Your discovery call is booked for ${params.date} at ${params.time}. We're looking forward to speaking with you, ${params.callerName}!`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  // Notify owner about the hot lead booking
  await notifyBusinessOwner(
    businessId,
    employeeId,
    `Discovery call booked: ${params.callerName} (${params.callerPhone}) on ${params.date} at ${params.time}. Notes: ${params.notes || 'N/A'}`
  )

  return {
    success: true,
    appointmentId: appointment?.id,
    message: `Your discovery call is confirmed for ${params.date} at ${params.time}. You'll receive a confirmation text shortly. We look forward to speaking with you!`,
  }
}

// ============================================
// APPOINTMENT REMINDER FUNCTIONS
// ============================================

async function handleConfirmAppointment(params: any, businessId: string, employeeId: string, callId?: string) {
  if (params.confirmed) {
    // Update appointment status to confirmed
    await supabase
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('customer_phone', params.customerPhone)
      .eq('appointment_date', params.appointmentDate)

    // Send confirmation SMS
    if (params.customerPhone) {
      await actionExecutor.execute({
        id: `appt-confirm-sms-${Date.now()}`,
        businessId,
        employeeId,
        actionType: 'send_sms',
        target: { phone: params.customerPhone },
        content: {
          message: `Appointment confirmed! We look forward to seeing you${params.appointmentDate ? ' on ' + params.appointmentDate : ''}${params.appointmentTime ? ' at ' + params.appointmentTime : ''}. Reply CANCEL to cancel.`,
        },
        status: 'pending',
        triggeredBy: 'call',
        createdAt: new Date(),
      })
    }
  } else {
    // They declined to confirm — treat as reschedule candidate
    await notifyBusinessOwner(businessId, employeeId,
      `Appointment not confirmed: ${params.customerName} (${params.customerPhone})${params.appointmentDate ? ' for ' + params.appointmentDate : ''}. May need rescheduling.`)
  }

  return {
    success: true,
    confirmed: params.confirmed,
    message: params.confirmed
      ? `Great! Your appointment is confirmed. See you soon!`
      : `No problem. We'll follow up with you about rescheduling.`,
  }
}

async function handleRescheduleRequest(params: any, businessId: string, employeeId: string, callId?: string) {
  // Mark existing appointment as pending reschedule
  await supabase
    .from('appointments')
    .update({ status: 'pending', notes: `Reschedule requested. Reason: ${params.reason || 'not stated'}`, updated_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('customer_phone', params.customerPhone)
    .eq('appointment_date', params.originalDate)

  // Notify owner
  await notifyBusinessOwner(businessId, employeeId,
    `Reschedule requested: ${params.customerName} (${params.customerPhone})${params.originalDate ? ' for ' + params.originalDate + ' at ' + (params.originalTime || '?') : ''}. Reason: ${params.reason || 'not given'}`)

  return {
    success: true,
    message: `No problem! I've noted your reschedule request and someone from our team will reach out to find a new time that works for you.`,
  }
}

async function handleRecordNoAnswer(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.customerPhone },
    content: {
      data: {
        type: 'reminder_no_answer',
        customerPhone: params.customerPhone,
        voicemailLeft: params.voicemailLeft,
        callId,
      },
    },
    status: 'completed',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  return { success: true, noAnswer: true, voicemailLeft: params.voicemailLeft }
}

// ============================================
// COLLECTIONS FUNCTIONS
// ============================================

async function handleLookupBalance(params: any, businessId: string, employeeId: string) {
  // In a real integration, this would query the business's billing system
  // For now, check action_requests for any stored balance data
  const { data } = await supabase
    .from('action_requests')
    .select('content')
    .eq('business_id', businessId)
    .contains('target', { phone: params.customerPhone })
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const storedBalance = (data?.content as any)?.data?.balance

  return {
    success: true,
    found: !!storedBalance,
    balance: storedBalance || null,
    message: storedBalance
      ? `I'm showing a balance of $${storedBalance} on file.`
      : `I don't have a specific balance on file. The team will need to provide that during the follow-up.`,
  }
}

async function handleRecordPaymentPromise(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.customerPhone },
    content: {
      data: {
        type: 'payment_promise',
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        promiseDate: params.promiseDate,
        promiseAmount: params.promiseAmount,
        paymentMethod: params.paymentMethod,
        callId,
      },
    },
    status: 'pending',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  await notifyBusinessOwner(businessId, employeeId,
    `Payment promise: ${params.customerName} (${params.customerPhone}) committed to pay $${params.promiseAmount} by ${params.promiseDate} via ${params.paymentMethod || 'unspecified method'}.`)

  return {
    success: true,
    recorded: true,
    message: `Thank you, ${params.customerName}. I've recorded your payment commitment of $${params.promiseAmount} by ${params.promiseDate}. We appreciate you working with us on this.`,
  }
}

async function handleOfferPaymentPlan(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'update_crm',
    target: { phone: params.customerPhone },
    content: {
      data: {
        type: 'payment_plan',
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        totalBalance: params.totalBalance,
        monthlyAmount: params.monthlyAmount,
        months: params.months,
        startDate: params.startDate,
        callId,
      },
    },
    status: 'pending',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  await notifyBusinessOwner(businessId, employeeId,
    `Payment plan agreed: ${params.customerName} (${params.customerPhone}): $${params.monthlyAmount}/month for ${params.months} months. Starts ${params.startDate || 'TBD'}.`)

  return {
    success: true,
    planCreated: true,
    message: `We've agreed to a payment plan of $${params.monthlyAmount} per month for ${params.months} months${params.startDate ? ', starting ' + params.startDate : ''}. Thank you for working with us on this resolution.`,
  }
}

async function handleRecordDispute(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'escalate',
    target: { phone: params.customerPhone },
    content: {
      data: {
        type: 'debt_dispute',
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        disputeReason: params.disputeReason,
        callId,
      },
    },
    status: 'pending',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
  })

  await notifyBusinessOwner(businessId, employeeId,
    `DISPUTE: ${params.customerName} (${params.customerPhone}) disputes the debt. Reason: ${params.disputeReason || 'not stated'}. Review required.`)

  return {
    success: true,
    disputed: true,
    message: `I understand. I've noted your dispute and will have our billing department follow up with you in writing within 30 days as required by law. Is there a good address or email to reach you?`,
  }
}

async function handleScheduleCallback(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('scheduled_tasks').insert({
    business_id: businessId,
    employee_id: employeeId,
    task_type: 'callback',
    target_phone: params.callerPhone,
    target_name: params.customerName,
    scheduled_for: params.callbackTime ? new Date(params.callbackTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
    timezone: 'America/Los_Angeles',
    message: params.reason || 'Customer requested callback',
    status: 'pending',
    attempts: 0,
    max_attempts: 3,
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return {
    success: true,
    scheduled: true,
    message: `I've scheduled a callback for ${params.customerName}${params.callbackTime ? ' at ' + params.callbackTime : ''}. We'll be in touch.`,
  }
}

// ============================================
// BUSINESS OWNER NOTIFICATION HELPER
// ============================================

async function notifyBusinessOwner(businessId: string, employeeId: string, message: string) {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('name, phone, settings, subscription_status')
      .eq('id', businessId)
      .single()

    // Trial businesses get email notifications (SMS is a paid feature)
    if (business?.subscription_status === 'trial') {
      const ownerEmail = await getOwnerEmail(businessId)
      if (ownerEmail) {
        sendMessageNotification({
          businessId,
          ownerEmail,
          businessName: business.name || 'Your Business',
          callerName: 'Caller',
          callerPhone: '',
          message,
          urgency: 'normal',
        }).catch(err => console.error('[notifyBusinessOwner] email error:', err))
      }
      return
    }

    // Paid businesses get SMS notifications
    const ownerPhone = business?.settings?.owner_phone || business?.phone
    if (!ownerPhone) return

    await actionExecutor.execute({
      id: `owner-notify-${Date.now()}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: ownerPhone },
      content: { message },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[notifyBusinessOwner] error:', err)
  }
}

async function handleGetCalendarInfo(params: any, businessId: string) {
  const today = new Date().toISOString().split('T')[0]
  const lookAhead = params.date || today

  // Check if business has Google Calendar connected
  const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(businessId)

  if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
    const eventsResult = await GoogleCalendarService.listUpcomingEvents(
      calendarConfig.calendarId,
      10,
      lookAhead
    )

    if (eventsResult.success && eventsResult.events?.length) {
      const list = eventsResult.events.map(e => {
        const startDate = new Date(e.start)
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        return `${dateStr} at ${timeStr} - ${e.summary}`
      }).join('; ')

      return {
        appointments: eventsResult.events,
        count: eventsResult.events.length,
        message: `There are ${eventsResult.events.length} upcoming events: ${list}.`,
      }
    }

    if (eventsResult.success && !eventsResult.events?.length) {
      return {
        appointments: [],
        message: `There are no upcoming events${lookAhead === today ? ' for today' : ` from ${lookAhead}`}.`,
      }
    }
    // Fall through to local check if Google Calendar fails
  }

  // Check Calendly for upcoming events if provider is calendly
  const calendlyConfig = await CalendlyService.getBusinessCalendlyConfig(businessId)
  if (calendlyConfig.provider === 'calendly' && calendlyConfig.accessToken && calendlyConfig.userUri) {
    const eventsResult = await CalendlyService.listUpcomingEvents(
      calendlyConfig.accessToken,
      calendlyConfig.userUri,
      10,
      lookAhead
    )

    if (eventsResult.success && eventsResult.events?.length) {
      const list = eventsResult.events.map(e => {
        const startDate = new Date(e.start_time)
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        return `${dateStr} at ${timeStr} - ${e.name}`
      }).join('; ')

      return {
        appointments: eventsResult.events,
        count: eventsResult.events.length,
        message: `There are ${eventsResult.events.length} upcoming events: ${list}.`,
      }
    }

    if (eventsResult.success && !eventsResult.events?.length) {
      return {
        appointments: [],
        message: `There are no upcoming events${lookAhead === today ? ' for today' : ` from ${lookAhead}`}.`,
      }
    }
    // Fall through to local check if Calendly fails
  }

  // Fallback: check local Supabase appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('customer_name, service, appointment_date, start_time, status')
    .eq('business_id', businessId)
    .gte('appointment_date', lookAhead)
    .neq('status', 'cancelled')
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(10)

  if (!appointments?.length) {
    return {
      appointments: [],
      message: `There are no upcoming appointments${lookAhead === today ? ' for today' : ` from ${lookAhead}`}.`,
    }
  }

  const list = appointments.map(a =>
    `${a.appointment_date} at ${a.start_time} - ${a.customer_name} (${a.service})`
  ).join('; ')

  return {
    appointments,
    count: appointments.length,
    message: `There are ${appointments.length} upcoming appointments: ${list}.`,
  }
}

// ============================================
// STATUS AND TRANSCRIPT HANDLERS
// ============================================

async function handleStatusUpdate(message: any, employee: any, businessId: string) {
  const status = message.statusUpdate?.status
  const callId = message.call?.id

  console.log(`[PhoneEmployeeWebhook] Call status: ${status}`)

  // Log call status
  await supabase.from('employee_calls').upsert({
    call_id: callId,
    business_id: businessId,
    employee_id: employee.id,
    status,
    customer_phone: message.call?.customer?.number,
    started_at: status === 'in-progress' ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'call_id' })

  // When call connects, check credits and fire intelligence hooks
  if (status === 'in-progress' && callId) {
    const callerPhone = message.call?.customer?.number

    // Check if business has credits for at least 1 minute
    const hasCredits = await CreditSystem.hasCredits(businessId, CreditCost.VOICE_CALL_INBOUND)
    if (!hasCredits) {
      console.warn(`[PhoneEmployeeWebhook] Business ${businessId} out of credits, ending call ${callId}`)
      // End the call via VAPI - business has no credits
      if (process.env.VAPI_API_KEY) {
        fetch(`https://api.vapi.ai/call/${callId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantOverrides: {
              model: {
                messages: [{
                  role: 'system',
                  content: 'The business has reached their call limit. Politely tell the caller that the business is temporarily unavailable and to please try again later or call the business directly. Then end the call.',
                }],
              },
            },
          }),
        }).catch(err => console.error('[Credits] Failed to end call:', err))
      }
    }

    // Inject customer memory
    if (callerPhone) {
      customerMemoryAgent.injectCustomerContext(
        callId,
        businessId,
        callerPhone,
        employee.name || 'Assistant'
      ).catch(err => console.error('[CustomerMemory] injection error:', err))
    }

    // Route call if business has multiple employees
    routingAgent.routeCall(businessId, callerPhone).then(decision => {
      if (decision && decision.employeeId !== employee.id) {
        console.log(`[Routing] Suggested ${decision.employeeName} (${decision.reason}, confidence: ${decision.confidence})`)
        // Log routing decision for analytics - don't override current call
        supabase.from('communication_logs').insert({
          business_id: businessId,
          type: 'routing',
          direction: 'internal',
          content: JSON.stringify({
            callId,
            currentEmployee: employee.id,
            suggestedEmployee: decision.employeeId,
            reason: decision.reason,
            confidence: decision.confidence,
          }),
          status: 'logged',
          created_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {})
      }
    }).catch(err => console.error('[Routing] error:', err))
  }

  return NextResponse.json({ received: true })
}

async function handleTranscript(message: any, employee: any, businessId: string) {
  const callId = message.call?.id
  const transcript = message.transcript

  // Update transcript
  await supabase
    .from('employee_calls')
    .update({
      transcript: transcript,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', callId)

  return NextResponse.json({ received: true })
}

async function handleCallEnd(message: any, employee: any, businessId: string) {
  const callId = message.call?.id

  console.log(`[PhoneEmployeeWebhook] Call ended: ${callId}`)

  // VAPI end-of-call-report puts data at message level and message.artifact
  // Calculate duration from startedAt/endedAt since VAPI doesn't provide a duration field
  const startedAt = message.startedAt || message.call?.startedAt
  const endedAt = message.endedAt || message.call?.endedAt
  const calculatedDuration = startedAt && endedAt
    ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    : null

  const transcript = message.transcript || message.artifact?.transcript || null
  const recordingUrl = message.recordingUrl || message.artifact?.recordingUrl || null
  const summary = message.summary || message.analysis?.summary || null
  const cost = message.cost ?? message.costBreakdown?.total ?? null
  const endedReason = message.endedReason || null

  // Clean up any in-progress order for this call (mark abandoned if not confirmed)
  await supabase
    .from('phone_orders')
    .update({ status: 'abandoned', updated_at: new Date().toISOString() })
    .eq('call_id', callId)
    .eq('status', 'in_progress')

  // Update call record
  await supabase
    .from('employee_calls')
    .update({
      status: 'completed',
      ended_at: endedAt || new Date().toISOString(),
      started_at: startedAt || undefined,
      duration: calculatedDuration,
      transcript,
      recording_url: recordingUrl,
      summary,
      cost,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', callId)

  // Update employee metrics
  await updateEmployeeMetrics(employee.id, businessId)

  // Check subscription to determine trial vs paid (Starter/Pro)
  const isTrialCall = await isTrialBusiness(businessId)
  const durationSeconds = calculatedDuration || 0

  if (durationSeconds > 0) {
    // Send call summary email for all tiers
    const ownerEmail = await getOwnerEmail(businessId)
    const { data: biz } = await supabase.from('businesses').select('name').eq('id', businessId).single()
    if (ownerEmail) {
      sendCallSummaryNotification({
        businessId,
        ownerEmail,
        businessName: biz?.name || 'Your Business',
        callerPhone: message.customer?.number || message.call?.customer?.number,
        duration: durationSeconds,
        summary: summary || undefined,
        employeeName: employee.name || 'AI Assistant',
        jobType: employee.job_type || 'receptionist',
      }).catch(err => console.error('[CallSummaryEmail] error:', err))
    }

    // Paid tiers (Starter + Pro): deduct credits
    if (!isTrialCall) {
      const durationMinutes = Math.ceil(durationSeconds / 60)
      const isOutbound = message.call?.type === 'outboundPhoneCall' ||
        message.type === 'outboundPhoneCall'
      const costPerMinute = isOutbound ? CreditCost.VOICE_CALL_OUTBOUND : CreditCost.VOICE_CALL_INBOUND
      const totalCredits = durationMinutes * costPerMinute

      CreditSystem.deductCredits(
        businessId,
        totalCredits,
        isOutbound ? 'voice_call_outbound' : 'voice_call_inbound',
        {
          callId,
          durationSeconds,
          durationMinutes,
          employeeId: employee.id,
          costPerMinute,
        }
      ).then(result => {
        if (!result.success) {
          console.warn(`[Credits] Deduction failed for call ${callId}: ${result.error}`)
        } else {
          console.log(`[Credits] Deducted ${totalCredits} credits (${durationMinutes} min) for business ${businessId}. Remaining: ${result.balance?.total_credits}`)
        }
      }).catch(err => console.error('[Credits] Deduction error:', err))
    }
  }

  // --- Integration hooks (fire-and-forget) ---

  const callerPhone = message.customer?.number || message.call?.customer?.number

  // Fire webhook event
  webhookService.fireEvent(businessId, 'call_completed', {
    callId,
    employeeId: employee.id,
    employeeName: employee.name,
    duration: calculatedDuration,
    summary,
    callerPhone,
  }).catch(err => console.error('[Webhook] call_completed fire error:', err))

  // Evaluate automation rules
  automationEngine.evaluateRules(businessId, 'call_completed', {
    callId,
    employeeId: employee.id,
    employeeName: employee.name,
    duration: calculatedDuration,
    summary,
    callerPhone,
  }).catch(err => console.error('[Automation] call_completed error:', err))

  // Schedule Google Reviews SMS for completed calls
  if (callerPhone) {
    GoogleReviewsManager.scheduleReviewRequest({
      businessId,
      employeeId: employee.id,
      customerPhone: callerPhone,
      callId,
      interactionType: 'call',
    }).catch(err => console.error('[GoogleReviews] schedule error:', err))
  }

  // Post-call follow-up SMS (opt-in per employee, requires twilio-vapi number)
  if (
    callerPhone &&
    durationSeconds > 30 &&
    employee.job_config?.sendPostCallSms &&
    employee.phone_number &&
    employee.phone_provider === 'twilio-vapi'
  ) {
    sendPostCallSMS(callerPhone, employee, businessId)
      .catch(err => console.error('[PostCallSMS] Error:', err))
  }

  // HubSpot: upsert contact + log call engagement
  if (callerPhone) {
    HubSpotService.upsertContact(businessId, { phone: callerPhone })
      .then(result => {
        if (result.contactId) {
          HubSpotService.createCallEngagement(businessId, result.contactId, {
            duration: calculatedDuration || 0,
            transcript: typeof transcript === 'string' ? transcript : undefined,
            outcome: 'completed',
            timestamp: new Date(),
            callId: callId || '',
            callNotes: summary,
          }).catch(err => console.error('[HubSpot] call engagement error:', err))
        }
      })
      .catch(err => console.error('[HubSpot] contact upsert error:', err))
  }

  // Trigger intelligence agents (call analysis, lead scoring, etc.)
  if (callId) {
    agentRegistry.processVAPICall(businessId, {
      callId,
      duration: calculatedDuration || 0,
      transcript: typeof transcript === 'string' ? transcript : undefined,
      outcome: summary,
      recordingUrl,
      startTime: new Date(startedAt || Date.now()),
      endTime: new Date(endedAt || Date.now()),
      metadata: {
        employeeId: employee.id,
        employeeName: employee.name,
        callerPhone,
      },
    }).catch(err => console.error('[AgentRegistry] processVAPICall error:', err))
  }

  return NextResponse.json({ received: true })
}

// --- Post-call follow-up SMS ---

async function sendPostCallSMS(callerPhone: string, employee: any, businessId: string) {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    const businessName = business?.name || 'us'
    const message = `Thanks for calling ${businessName}! If you need anything else, just call or text us back.`

    const result = await sendSms({
      to: callerPhone,
      from: employee.phone_number,
      body: message,
    })

    if (!result.success) {
      console.error(`[PostCallSMS] Send failed:`, result.error)
      return
    }

    console.log(`[PostCallSMS] Sent follow-up SMS to ${callerPhone} for business ${businessId}`)

    await supabase.from('communication_logs').insert({
      business_id: businessId,
      employee_id: employee.id,
      type: 'sms',
      direction: 'outbound',
      to_phone: callerPhone,
      from_phone: employee.phone_number,
      customer_phone: callerPhone,
      content: message,
      status: 'sent',
      metadata: { trigger: 'post_call_followup', twilioSid: result.sid },
    })
  } catch (err) {
    console.error('[PostCallSMS] Failed:', err)
  }
}

// ============================================
// CUSTOMER SERVICE FUNCTIONS
// ============================================

async function handleLookupOrder(params: any, businessId: string) {
  let query = supabase
    .from('phone_orders')
    .select('id, customer_name, customer_phone, items, subtotal, total, order_type, status, payment_status, created_at')
    .eq('business_id', businessId)

  if (params.orderId) {
    query = (query as any).eq('id', params.orderId)
  } else {
    if (params.customerPhone) query = (query as any).eq('customer_phone', params.customerPhone)
    if (params.customerName) query = (query as any).ilike('customer_name', `%${params.customerName}%`)
  }

  const { data: orders } = await (query as any).order('created_at', { ascending: false }).limit(3)

  if (!orders || orders.length === 0) {
    return { success: true, found: false, message: "I couldn't find any orders for that customer. Could you double-check the name or phone number?" }
  }

  const order = orders[0]
  const itemCount = Array.isArray(order.items) ? order.items.length : 0

  return {
    success: true,
    found: true,
    order: { id: order.id, status: order.status, paymentStatus: order.payment_status, orderType: order.order_type, itemCount, total: order.total, createdAt: order.created_at },
    message: `Found order for ${order.customer_name} — ${itemCount} item(s), total $${order.total?.toFixed(2) || '0.00'}, status: ${order.status}.`,
  }
}

async function handleLogComplaint(params: any, businessId: string, employeeId: string, callId?: string) {
  const urgency = params.severity === 'high' ? 'urgent' : params.severity === 'medium' ? 'normal' : 'low'

  await supabase.from('phone_messages').insert({
    business_id: businessId,
    employee_id: employeeId,
    call_id: callId,
    caller_name: params.customerName,
    caller_phone: params.customerPhone,
    message: `[${(params.severity || 'medium').toUpperCase()} SEVERITY] Complaint - ${params.issueType}: ${params.description}`,
    urgency,
    status: 'unread',
    callback_requested: true,
    created_at: new Date().toISOString(),
  })

  if (urgency === 'urgent') {
    await notifyBusinessOwner(businessId, employeeId,
      `URGENT COMPLAINT from ${params.customerName} (${params.customerPhone}): ${params.description}`)
  }

  return {
    success: true,
    message: `I've logged your complaint and marked it as ${params.severity || 'medium'} priority. Our team will follow up${urgency === 'urgent' ? ' as soon as possible' : ' within 1–2 business days'}.`,
  }
}

async function handleProcessReturnRequest(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('action_requests').insert({
    business_id: businessId,
    employee_id: employeeId,
    action_type: 'return_request',
    target: { name: params.customerName, phone: params.customerPhone },
    content: { orderId: params.orderId, reason: params.reason, preferredResolution: params.preferredResolution },
    status: 'pending',
    triggered_by: 'call',
    source_call_id: callId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const resolutionMap: Record<string, string> = {
    refund: 'refund to your original payment method',
    exchange: 'exchange for a new item',
    store_credit: 'store credit',
    repair: 'repair or replacement',
  }
  const resolutionText = resolutionMap[params.preferredResolution] || params.preferredResolution

  return {
    success: true,
    message: `Your return request has been submitted. You'll receive a ${resolutionText} once we process it. Our team will contact you at ${params.customerPhone} within 1–2 business days with next steps.`,
  }
}

async function handleEscalateToManager(params: any, businessId: string, employeeId: string, callId?: string) {
  await supabase.from('phone_messages').insert({
    business_id: businessId,
    employee_id: employeeId,
    call_id: callId,
    caller_name: params.customerName,
    caller_phone: params.customerPhone,
    message: `Manager escalation: ${params.reason}. ${params.issueDescription || ''}`,
    urgency: params.priority === 'urgent' ? 'urgent' : 'normal',
    status: 'unread',
    callback_requested: true,
    created_at: new Date().toISOString(),
  })

  await notifyBusinessOwner(businessId, employeeId,
    `MANAGER ESCALATION: ${params.customerName} (${params.customerPhone}) — ${params.reason}. Priority: ${params.priority || 'normal'}`)

  return {
    success: true,
    message: `I've escalated your case to our management team as ${params.priority || 'normal'} priority. A manager will contact you at ${params.customerPhone} as soon as possible.`,
  }
}

// ============================================
// LIVE CALLER LOOKUP
// ============================================

async function handleLookupCaller(params: any, businessId: string, employee: any) {
  const phoneNumber = params.phoneNumber
  if (!phoneNumber) {
    return { found: false, message: 'phoneNumber required' }
  }

  // Check local contacts/customers
  const { data: contact } = await supabase
    .from('customers')
    .select('name, email, phone, notes')
    .eq('business_id', businessId)
    .eq('phone', phoneNumber)
    .single()

  if (contact) {
    return { found: true, ...contact }
  }

  // Check leads
  const { data: lead } = await supabase
    .from('leads')
    .select('first_name, last_name, company, status')
    .eq('business_id', businessId)
    .eq('phone', phoneNumber)
    .limit(1)
    .single()

  if (lead) {
    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    return { found: true, name, company: lead.company, status: lead.status }
  }

  // Check HubSpot if configured
  const ds = employee.data_source
  if (ds?.type === 'hubspot') {
    const { data: integration } = await supabase
      .from('business_integrations')
      .select('credentials')
      .eq('business_id', businessId)
      .eq('platform', 'hubspot')
      .single()

    if (integration?.credentials?.accessToken) {
      try {
        const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [{ filters: [{ propertyName: 'phone', operator: 'EQ', value: phoneNumber }] }],
            properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
            limit: 1,
          }),
        })
        const hsData = await hsRes.json()
        const hsContact = hsData.results?.[0]?.properties
        if (hsContact) {
          return { found: true, name: `${hsContact.firstname || ''} ${hsContact.lastname || ''}`.trim(), ...hsContact }
        }
      } catch (err) {
        console.error('[lookupCaller] HubSpot error:', err)
      }
    }
  }

  return { found: false }
}

// ============================================
// ASSISTANT REQUEST HANDLER
// ============================================

async function getBusinessHoursContext(businessId: string, timezone: string): Promise<string> {
  const { data: hours } = await supabase
    .from('business_hours')
    .select('day_of_week, open_time, close_time, is_open')
    .eq('business_id', businessId)

  if (!hours || hours.length === 0) return ''

  const tz = timezone || 'America/Los_Angeles'
  const now = new Date()
  // Get local time in the business timezone
  const localStr = now.toLocaleString('en-US', { timeZone: tz, hour12: false })
  const localDate = new Date(localStr)
  const dayOfWeek = localDate.getDay() // 0=Sunday
  const currentHour = localDate.getHours()
  const currentMinute = localDate.getMinutes()
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

  const todayHours = hours.find(h => h.day_of_week === dayOfWeek)

  let isOpen = false
  if (todayHours && todayHours.is_open && todayHours.open_time && todayHours.close_time) {
    const openTime = todayHours.open_time.slice(0, 5)
    const closeTime = todayHours.close_time.slice(0, 5)
    isOpen = currentTime >= openTime && currentTime < closeTime
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = dayNames[dayOfWeek]
  const formatTime12 = (t: string) => {
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
  }

  let nextOpenInfo = ''
  if (!isOpen) {
    // Find the next opening time
    for (let offset = 0; offset <= 7; offset++) {
      const checkDay = (dayOfWeek + (offset === 0 ? 1 : offset)) % 7
      if (offset === 0) {
        // Check if business opens later today
        if (todayHours && todayHours.is_open && todayHours.open_time) {
          const openTime = todayHours.open_time.slice(0, 5)
          if (currentTime < openTime) {
            nextOpenInfo = `The business opens today at ${formatTime12(todayHours.open_time)}.`
            break
          }
        }
        continue
      }
      const nextDayHours = hours.find(h => h.day_of_week === checkDay)
      if (nextDayHours && nextDayHours.is_open && nextDayHours.open_time) {
        const nextDayName = dayNames[checkDay]
        nextOpenInfo = `The business next opens on ${nextDayName} at ${formatTime12(nextDayHours.open_time)}.`
        break
      }
    }
  }

  const timeStr = formatTime12(currentTime + ':00')

  let context = `\n\n## Current Status\nIt is currently ${timeStr} on ${dayName} (${tz.replace('_', ' ')}).`
  if (isOpen) {
    context += ` The business is currently OPEN.`
    if (todayHours?.close_time) {
      context += ` Closing time today is ${formatTime12(todayHours.close_time)}.`
    }
  } else {
    context += ` The business is currently CLOSED.`
    if (nextOpenInfo) context += ` ${nextOpenInfo}`
    context += `\nWhen the business is closed, adjust your behavior:\n- Mention that the business is currently closed and when it reopens\n- Proactively offer to take a message or schedule a callback\n- Still answer general questions about the business (hours, location, services)`
  }

  return context
}

async function handleAssistantRequest(employee: any) {
  const businessName = employee.businesses?.name || 'the business'
  const sharedAssistantId = process.env.VAPI_SHARED_ASSISTANT_ID
  const isSharedAssistant = !employee.vapi_assistant_id
    || employee.vapi_assistant_id === sharedAssistantId

  if (isSharedAssistant) {
    // Shared assistant — could be Trial or Starter. Check subscription.
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_status, subscription_tier')
      .eq('id', employee.business_id)
      .single()

    const isTrial = business?.subscription_status === 'trial'

    if (isTrial) {
      // Trial: enforce call count limits
      const { count } = await supabase
        .from('employee_calls')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', employee.business_id)

      const callCount = count || 0

      if (callCount >= TRIAL_LIMITS.maxCalls) {
        console.log(`[handleAssistantRequest] Trial limit reached for business ${employee.business_id} (${callCount}/${TRIAL_LIMITS.maxCalls})`)
        return NextResponse.json({
          assistant: {
            model: {
              provider: 'openai',
              model: 'gpt-4o-mini',
              messages: [{
                role: 'system',
                content: `You are an automated message system. The business "${businessName}" has reached their free trial limit. Politely tell the caller: "Thank you for calling ${businessName}. Our AI assistant is currently unavailable. Please call the business directly or visit their website." Then end the call. Do not engage in conversation.`,
              }],
            },
            voice: {
              provider: '11labs',
              voiceId: 'aVR2rUXJY4MTezzJjPyQ',
              model: 'eleven_flash_v2_5',
              stability: 0.5,
              similarityBoost: 0.75,
            },
            firstMessage: `Thank you for calling ${businessName}. Our AI assistant is currently unavailable. Please call the business directly or visit their website. Goodbye.`,
            maxDurationSeconds: 30,
            metadata: {
              businessId: employee.business_id,
              trialLimitReached: true,
            },
          },
        })
      }

      const config = await employeeProvisioning.buildAssistantConfig(employee, businessName)
      // Inject business hours awareness
      const hoursContext = await getBusinessHoursContext(employee.business_id, employee.businesses?.timezone)
      if (hoursContext && config.model?.messages?.[0]?.content) {
        config.model.messages[0].content += hoursContext
      }
      console.log(`[handleAssistantRequest] Trial config for ${employee.id} (${employee.job_type}) - ${businessName} [call ${callCount + 1}/${TRIAL_LIMITS.maxCalls}]`)
      return NextResponse.json({
        assistant: {
          ...config,
          name: `${employee.name} - ${businessName}`.substring(0, 40),
          maxDurationSeconds: TRIAL_LIMITS.maxCallDurationSeconds,
          serverUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.voiceflyai.com'}/api/webhooks/phone-employee`,
          metadata: {
            employeeId: employee.id,
            businessId: employee.business_id,
            jobType: employee.job_type,
            isTrial: true,
          },
        },
      })
    }

    // Starter: shared assistant with no call count limit, standard duration
    const config = await employeeProvisioning.buildAssistantConfig(employee, businessName)
    // Inject business hours awareness
    const hoursContext = await getBusinessHoursContext(employee.business_id, employee.businesses?.timezone)
    if (hoursContext && config.model?.messages?.[0]?.content) {
      config.model.messages[0].content += hoursContext
    }
    console.log(`[handleAssistantRequest] Starter config for ${employee.id} (${employee.job_type}) - ${businessName}`)
    return NextResponse.json({
      assistant: {
        ...config,
        name: `${employee.name} - ${businessName}`.substring(0, 40),
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.voiceflyai.com'}/api/webhooks/phone-employee`,
        metadata: {
          employeeId: employee.id,
          businessId: employee.business_id,
          jobType: employee.job_type,
          isStarter: true,
        },
      },
    })
  }

  // Pro: return dedicated VAPI assistant reference
  if (employee.vapi_assistant_id) {
    return NextResponse.json({ assistantId: employee.vapi_assistant_id })
  }

  return NextResponse.json({ received: true })
}

async function updateEmployeeMetrics(employeeId: string, businessId: string) {
  const today = new Date().toISOString().split('T')[0]

  // Get today's calls
  const { data: calls } = await supabase
    .from('employee_calls')
    .select('duration, status')
    .eq('employee_id', employeeId)
    .gte('created_at', `${today}T00:00:00`)

  const totalCalls = calls?.length || 0
  const completedCalls = calls?.filter(c => c.status === 'completed').length || 0
  const avgDuration = calls?.reduce((sum, c) => sum + (c.duration || 0), 0) / (completedCalls || 1)

  // Upsert metrics
  await supabase
    .from('employee_metrics')
    .upsert({
      employee_id: employeeId,
      business_id: businessId,
      date: today,
      period: 'daily',
      total_calls: totalCalls,
      answered_calls: completedCalls,
      avg_call_duration: Math.round(avgDuration),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employee_id,date,period' })
}
