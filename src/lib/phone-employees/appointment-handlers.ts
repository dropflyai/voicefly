/**
 * Shared Appointment Handlers
 *
 * Extracted from the phone-employee webhook so both VAPI function calls
 * and SMS AI tool_use can reuse the same booking logic.
 */

import { createClient } from '@supabase/supabase-js'
import { GoogleCalendarService } from '@/lib/google-calendar-service'
import { CalendlyService } from '@/lib/calendly-service'
import { actionExecutor } from '@/lib/phone-employees/action-executor'
import { webhookService } from '@/lib/webhooks/webhook-service'
import { automationEngine } from '@/lib/automation/automation-engine'
import { taskScheduler } from '@/lib/phone-employees/task-scheduler'
import { sendAppointmentNotification, getOwnerEmail } from '@/lib/notifications/email-notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AppointmentHandlerOptions {
  suppressConfirmationSms?: boolean
  source?: 'voice' | 'sms' | 'web'
  isTrial?: boolean
}

// ============================================
// SCHEDULE APPOINTMENT
// ============================================

export async function handleScheduleAppointment(
  params: any,
  businessId: string,
  employeeId: string,
  options?: AppointmentHandlerOptions
) {
  // Calculate end_time (default 30 min after start)
  const startTimeParts = (params.time || '09:00').split(':')
  const startMinutes = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1] || '0')
  const endMinutes = startMinutes + 30
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      customer_name: params.customerName || params.name,
      customer_phone: params.customerPhone || params.phone,
      customer_email: params.customerEmail || params.email,
      appointment_date: params.date,
      start_time: params.time,
      end_time: endTime,
      notes: params.service ? `Service: ${params.service}. ${params.notes || ''}`.trim() : (params.notes || null),
      status: 'confirmed',
      booking_source: options?.source === 'sms' ? 'sms' : 'phone_employee',
    })
    .select()
    .single()

  if (error) {
    console.error('[ScheduleAppointment] Insert error:', error)
    return { success: false, message: "I'm sorry, I wasn't able to book that appointment right now. Would you like me to try a different time, or I can take your information and have someone call you back to confirm?" }
  }

  // Create calendar event if connected (Google Calendar or Calendly)
  const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(businessId)
  if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
    const startDateTime = `${params.date}T${params.time}:00`
    const endDate = new Date(startDateTime)
    endDate.setMinutes(endDate.getMinutes() + 60)

    const customerName = params.customerName || params.name || 'Customer'

    await GoogleCalendarService.createEvent(calendarConfig.calendarId, {
      summary: `${params.service || 'Appointment'} - ${customerName}`,
      description: `Booked by phone employee.\nCustomer: ${customerName}\nPhone: ${params.customerPhone || params.phone || 'N/A'}\nNotes: ${params.notes || 'None'}`,
      start: new Date(startDateTime).toISOString(),
      end: endDate.toISOString(),
    })
  } else {
    // Calendly: send the customer a scheduling link via SMS
    const calendlyConfig = await CalendlyService.getBusinessCalendlyConfig(businessId)
    if (calendlyConfig.provider === 'calendly' && calendlyConfig.accessToken) {
      const schedulingUrl = calendlyConfig.eventTypeUri
        ? `https://calendly.com/d/${calendlyConfig.eventTypeUri.split('/').pop()}`
        : null

      if (schedulingUrl && (params.customerPhone || params.phone) && !options?.suppressConfirmationSms) {
        await actionExecutor.execute({
          id: `calendly-link-${appointment.id}`,
          businessId,
          employeeId,
          actionType: 'send_sms',
          target: { phone: params.customerPhone || params.phone },
          content: {
            message: `To confirm your ${params.service || 'appointment'} — use this link to pick your exact time: ${schedulingUrl}`,
          },
          status: 'pending',
          triggeredBy: 'call',
          createdAt: new Date(),
        })
      }
    }
  }

  // Fire webhook event
  webhookService.fireEvent(businessId, 'appointment_booked', {
    appointmentId: appointment.id,
    customerName: params.customerName || params.name,
    customerPhone: params.customerPhone || params.phone,
    service: params.service,
    date: params.date,
    time: params.time,
    source: options?.source || 'voice',
  }).catch(err => console.error('[Webhook] appointment_booked fire error:', err))

  // Evaluate automation rules
  automationEngine.evaluateRules(businessId, 'appointment_booked', {
    appointmentId: appointment.id,
    customerName: params.customerName || params.name,
    customerPhone: params.customerPhone || params.phone,
    service: params.service,
    date: params.date,
    time: params.time,
  }).catch(err => console.error('[Automation] appointment_booked error:', err))

  const customerPhone = params.customerPhone || params.phone
  const customerName = params.customerName || params.name || 'Customer'

  if (options?.isTrial) {
    // Trial: email the business owner instead of SMS to customer
    const ownerEmail = await getOwnerEmail(businessId)
    const { data: biz } = await supabase.from('businesses').select('name').eq('id', businessId).single()
    if (ownerEmail) {
      sendAppointmentNotification({
        businessId,
        ownerEmail,
        businessName: biz?.name || 'Your Business',
        customerName,
        customerPhone,
        service: params.service,
        date: params.date,
        time: params.time,
      }).catch(err => console.error('[AppointmentEmail] error:', err))
    }
  } else if (customerPhone && !options?.suppressConfirmationSms) {
    // Paid: send confirmation SMS to customer
    await actionExecutor.execute({
      id: `appt-confirm-${appointment.id}`,
      businessId,
      employeeId,
      actionType: 'send_sms',
      target: { phone: customerPhone },
      content: {
        message: `Your ${params.service || 'appointment'} is confirmed for ${params.date} at ${params.time}. We look forward to seeing you!`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })

    // Schedule day-before reminder (paid only)
    const appointmentDateTime = new Date(`${params.date}T${params.time}:00`)
    const reminderTime = new Date(appointmentDateTime)
    reminderTime.setDate(reminderTime.getDate() - 1)
    reminderTime.setHours(10, 0, 0, 0)
    const delayMinutes = Math.max(0, Math.floor((reminderTime.getTime() - Date.now()) / 60000))

    if (delayMinutes > 60) {
      taskScheduler.scheduleFollowUp({
        businessId,
        employeeId,
        targetPhone: customerPhone,
        delayMinutes,
        message: `Reminder: You have a ${params.service || 'appointment'} tomorrow at ${params.time}. Reply STOP to unsubscribe.`,
        channel: 'sms',
      }).catch(err => console.error('[AppointmentReminder] schedule error:', err))
    }
  }

  return {
    success: true,
    appointmentId: appointment.id,
    message: options?.isTrial
      ? `Great! I've booked your ${params.service || 'appointment'} for ${params.date} at ${params.time}. Is there anything else I can help with?`
      : `Great! I've booked your ${params.service} appointment for ${params.date} at ${params.time}. You'll receive a confirmation text shortly.`,
  }
}

// ============================================
// CHECK AVAILABILITY
// ============================================

export async function handleCheckAvailability(params: any, businessId: string, employee: any) {
  const date = params.date || new Date().toISOString().split('T')[0]

  const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const businessHours = employee.schedule?.businessHours
  const dayHours = businessHours?.[dayOfWeek]

  if (!dayHours) {
    return {
      available: false,
      message: `I'm sorry, we're closed on ${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}s. Would you like to check another day?`,
    }
  }

  // Google Calendar
  const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(businessId)
  if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
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
  }

  // Calendly
  const calendlyConfig = await CalendlyService.getBusinessCalendlyConfig(businessId)
  if (calendlyConfig.provider === 'calendly' && calendlyConfig.accessToken && calendlyConfig.eventTypeUri) {
    const slotsResult = await CalendlyService.getAvailableSlots(
      calendlyConfig.accessToken,
      calendlyConfig.eventTypeUri,
      date
    )

    if (slotsResult.success && slotsResult.slots) {
      const availableSlots = slotsResult.slots.filter(s => s.status === 'available')
      if (availableSlots.length === 0) {
        return {
          available: false,
          message: `I'm sorry, we're fully booked on ${date}. Would you like to check another day?`,
        }
      }

      const slotTimes = availableSlots.slice(0, 5).map(s => {
        const d = new Date(s.start)
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      })

      return {
        available: true,
        slots: availableSlots.map(s => s.start),
        message: `For ${date}, I have openings at ${slotTimes.join(', ')}${availableSlots.length > 5 ? ' and more' : ''}. Which time works best for you?`,
      }
    }
  }

  // Fallback: local appointments table
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
  const end = endH * 60 + endM - intervalMinutes

  while (current <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    current += intervalMinutes
  }
  return slots
}

// ============================================
// RESCHEDULE APPOINTMENT
// ============================================

export async function handleRescheduleAppointment(
  params: any,
  businessId: string,
  options?: AppointmentHandlerOptions
) {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .ilike('customer_name', `%${params.callerName || params.customerName}%`)

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

  const callerPhone = params.callerPhone || params.customerPhone
  if (callerPhone && !options?.suppressConfirmationSms) {
    await actionExecutor.execute({
      id: `appt-reschedule-${appointment.id}`,
      businessId: appointment.business_id,
      employeeId: appointment.employee_id || '',
      actionType: 'send_sms',
      target: { phone: callerPhone },
      content: {
        message: `Your appointment has been rescheduled to ${params.newDate} at ${params.newTime}. See you then!`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  return {
    success: true,
    message: `I've rescheduled your appointment to ${params.newDate} at ${params.newTime}. Is there anything else I can help with?`,
  }
}

// ============================================
// CANCEL APPOINTMENT
// ============================================

export async function handleCancelAppointment(
  params: any,
  businessId: string,
  options?: AppointmentHandlerOptions
) {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .ilike('customer_name', `%${params.callerName || params.customerName}%`)
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

  const callerPhone = params.callerPhone || params.customerPhone
  if (callerPhone && !options?.suppressConfirmationSms) {
    await actionExecutor.execute({
      id: `appt-cancel-${appointment.id}`,
      businessId: appointment.business_id,
      employeeId: appointment.employee_id || '',
      actionType: 'send_sms',
      target: { phone: callerPhone },
      content: {
        message: `Your appointment for ${appointment.appointment_date} has been cancelled.${params.reschedule ? ' We hope to see you soon — call us to rebook!' : ''}`,
      },
      status: 'pending',
      triggeredBy: 'call',
      createdAt: new Date(),
    })
  }

  const response: any = {
    success: true,
    message: `I've cancelled your appointment for ${appointment.appointment_date}.`,
  }

  if (params.reschedule) {
    response.message += " Would you like to reschedule for another time?"
  }

  return response
}
