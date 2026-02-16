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
import { StripeService } from '@/lib/stripe-service'
import { GoogleCalendarService } from '@/lib/google-calendar-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    // Get employee ID from serverUrlSecret header or metadata
    const employeeId = request.headers.get('x-vapi-secret') ||
      message?.call?.assistant?.metadata?.employeeId

    if (!employeeId) {
      console.warn('[PhoneEmployeeWebhook] No employee ID found')
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Get employee and business info
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('*, businesses(name, phone, email, settings)')
      .eq('id', employeeId)
      .single()

    if (!employee) {
      console.warn('[PhoneEmployeeWebhook] Employee not found:', employeeId)
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const businessId = employee.business_id

    console.log(`[PhoneEmployeeWebhook] Received ${message?.type} for ${employee.name}`)

    // Handle different message types
    switch (message?.type) {
      case 'function-call':
        return handleFunctionCall(message, employee, businessId)

      case 'status-update':
        return handleStatusUpdate(message, employee, businessId)

      case 'transcript':
        return handleTranscript(message, employee, businessId)

      case 'end-of-call-report':
      case 'hang':
        return handleCallEnd(message, employee, businessId)

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

  console.log(`[PhoneEmployeeWebhook] Function call: ${functionCall?.name}`)

  try {
    let result: any

    switch (functionCall?.name) {
      // === RECEPTIONIST FUNCTIONS ===
      case 'scheduleAppointment':
        result = await handleScheduleAppointment(functionCall.parameters, businessId, employee.id)
        break

      case 'checkAvailability':
        result = await handleCheckAvailability(functionCall.parameters, businessId, employee)
        break

      case 'takeMessage':
        result = await handleTakeMessage(functionCall.parameters, businessId, employee.id, callId)
        break

      case 'transferCall':
        result = await handleTransferCall(functionCall.parameters, businessId)
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
// APPOINTMENT FUNCTIONS
// ============================================

async function handleScheduleAppointment(params: any, businessId: string, employeeId: string) {
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      customer_name: params.customerName || params.name,
      customer_phone: params.customerPhone || params.phone,
      customer_email: params.customerEmail || params.email,
      service: params.service,
      appointment_date: params.date,
      start_time: params.time,
      notes: params.notes,
      status: 'confirmed',
      source: 'phone_employee',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to book appointment' }
  }

  // Create Google Calendar event if connected
  const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(businessId)
  if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
    const startDateTime = `${params.date}T${params.time}:00`
    const endDate = new Date(startDateTime)
    endDate.setMinutes(endDate.getMinutes() + 60) // Default 1 hour appointment

    const customerName = params.customerName || params.name || 'Customer'

    await GoogleCalendarService.createEvent(calendarConfig.calendarId, {
      summary: `${params.service || 'Appointment'} - ${customerName}`,
      description: `Booked by phone employee.\nCustomer: ${customerName}\nPhone: ${params.customerPhone || params.phone || 'N/A'}\nNotes: ${params.notes || 'None'}`,
      start: new Date(startDateTime).toISOString(),
      end: endDate.toISOString(),
    })
  }

  // Send confirmation SMS
  if (params.customerPhone || params.phone) {
    await actionExecutor.execute({
      id: `appt-confirm-${appointment.id}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: params.customerPhone || params.phone },
      content: {
        message: `Your appointment is confirmed for ${params.date} at ${params.time}. We look forward to seeing you!`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  return {
    success: true,
    appointmentId: appointment.id,
    message: `Great! I've booked your ${params.service} appointment for ${params.date} at ${params.time}. You'll receive a confirmation text shortly.`,
  }
}

async function handleCheckAvailability(params: any, businessId: string, employee: any) {
  const date = params.date || new Date().toISOString().split('T')[0]

  // Determine business hours for this day from employee schedule
  const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const businessHours = employee.schedule?.businessHours
  const dayHours = businessHours?.[dayOfWeek]

  if (!dayHours) {
    return {
      available: false,
      message: `I'm sorry, we're closed on ${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}s. Would you like to check another day?`,
    }
  }

  // Check if business has Google Calendar connected
  const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(businessId)

  if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
    // Use Google Calendar for real-time availability
    const slotsResult = await GoogleCalendarService.getAvailableSlots(
      calendarConfig.calendarId,
      date,
      30,
      { start: dayHours.start, end: dayHours.end }
    )

    if (slotsResult.success && slotsResult.slots) {
      if (slotsResult.slots.length === 0) {
        return {
          available: false,
          message: `I'm sorry, we're fully booked on ${date}. Would you like to check another day?`,
        }
      }

      const slotTimes = slotsResult.slots.slice(0, 5).map(s => {
        const d = new Date(s.start)
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      })

      return {
        available: true,
        slots: slotsResult.slots.map(s => s.start),
        message: `For ${date}, I have openings at ${slotTimes.join(', ')}${slotsResult.slots.length > 5 ? ' and more' : ''}. Which time works best for you?`,
      }
    }
    // Fall through to local check if Google Calendar fails
  }

  // Fallback: check local Supabase appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('business_id', businessId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')

  const allSlots = generateTimeSlots(dayHours.start, dayHours.end, 30)
  const bookedTimes = appointments?.map(a => a.start_time) || []
  const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot))

  if (availableSlots.length === 0) {
    return {
      available: false,
      message: `I'm sorry, we're fully booked on ${date}. Would you like to check another day?`,
    }
  }

  return {
    available: true,
    slots: availableSlots,
    message: `For ${date}, I have openings at ${availableSlots.slice(0, 5).join(', ')}${availableSlots.length > 5 ? ' and more' : ''}. Which time works best for you?`,
  }
}

function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
  const slots: string[] = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  let current = startH * 60 + startM
  const end = endH * 60 + endM - intervalMinutes // Last slot must end before closing

  while (current <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    current += intervalMinutes
  }
  return slots
}

async function handleRescheduleAppointment(params: any, businessId: string) {
  // Find the appointment
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .ilike('customer_name', `%${params.callerName}%`)

  if (params.originalDate) {
    query = query.eq('appointment_date', params.originalDate)
  }

  const { data: appointments } = await query

  if (!appointments?.length) {
    return {
      success: false,
      message: "I couldn't find an appointment under that name. Could you provide more details?",
    }
  }

  const appointment = appointments[0]

  // Update to new time
  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: params.newDate,
      start_time: params.newTime,
      notes: `Rescheduled from ${appointment.appointment_date} ${appointment.start_time}. Reason: ${params.reason || 'Not specified'}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointment.id)

  if (error) {
    return { success: false, message: 'Sorry, I had trouble rescheduling. Let me get someone to help.' }
  }

  return {
    success: true,
    message: `I've rescheduled your appointment to ${params.newDate} at ${params.newTime}. Is there anything else I can help with?`,
  }
}

async function handleCancelAppointment(params: any, businessId: string) {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .ilike('customer_name', `%${params.callerName}%`)
    .neq('status', 'cancelled')

  if (params.appointmentDate) {
    query = query.eq('appointment_date', params.appointmentDate)
  }

  const { data: appointments } = await query

  if (!appointments?.length) {
    return {
      success: false,
      message: "I couldn't find an active appointment under that name.",
    }
  }

  const appointment = appointments[0]

  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      notes: `Cancelled. Reason: ${params.reason || 'Not specified'}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointment.id)

  const response: any = {
    success: true,
    message: `I've cancelled your appointment for ${appointment.appointment_date}.`,
  }

  if (params.reschedule) {
    response.message += " Would you like to reschedule for another time?"
  }

  return response
}

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

  return {
    success: true,
    messageId: message.id,
    message: `I've recorded your message${params.forPerson ? ` for ${params.forPerson}` : ''}. ${params.callbackRequested ? "They'll call you back as soon as possible." : "We'll make sure they receive it."}`,
  }
}

async function handleTransferCall(params: any, businessId: string) {
  // In a real implementation, this would initiate a transfer
  // For now, we'll log it and provide guidance

  console.log(`[Transfer Request] Destination: ${params.destination}, Reason: ${params.reason}`)

  return {
    transfer: true,
    destination: params.destination,
    message: `I'll transfer you to ${params.destination} now. Please hold for just a moment.`,
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
  const report = message.call || message

  console.log(`[PhoneEmployeeWebhook] Call ended: ${callId}`)

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
      ended_at: new Date().toISOString(),
      duration: report.duration,
      transcript: report.transcript,
      recording_url: report.recordingUrl,
      summary: report.summary,
      cost: report.cost,
      updated_at: new Date().toISOString(),
    })
    .eq('call_id', callId)

  // Update employee metrics
  await updateEmployeeMetrics(employee.id, businessId)

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
