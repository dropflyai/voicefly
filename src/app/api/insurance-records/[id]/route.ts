/**
 * Insurance Records — single-record endpoints
 *
 * GET    /api/insurance-records/:id    — fetch one (with linked appointment)
 * PATCH  /api/insurance-records/:id    — staff updates after verifying;
 *                                        triggers SMS to patient if newly
 *                                        verified/denied/needs_more_info
 * DELETE /api/insurance-records/:id    — soft delete (sets status='archived')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { sendSmsForBusiness } from '@/lib/a2p/sms-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteContext {
  params: Promise<{ id: string }>
}

// Status transitions that trigger an SMS to the patient
const NOTIFY_PATIENT_STATUSES = new Set(['verified', 'denied', 'needs_more_info'])

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params

    const { data: record, error } = await supabase
      .from('insurance_records')
      .select(`
        *,
        appointment:appointments(
          id, appointment_date, start_time, end_time, status,
          customer:customers(first_name, last_name),
          service:services(name)
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const authResult = await validateBusinessAccess(request, record.business_id)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    return NextResponse.json({ record })
  } catch (err: any) {
    console.error('[insurance-records GET :id]', err)
    return NextResponse.json({ error: err.message || 'Failed to load record' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params
    const body = await request.json()

    // Load existing record (need business_id for auth + previous status for transition logic)
    const { data: existing, error: loadErr } = await supabase
      .from('insurance_records')
      .select('*, appointment:appointments(*)')
      .eq('id', id)
      .maybeSingle()

    if (loadErr || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const authResult = await validateBusinessAccess(request, existing.business_id)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Build update payload — only allowed fields
    const updates: Record<string, any> = {}
    const allowed = [
      'status', 'coverage_notes',
      'estimated_patient_responsibility', 'estimated_insurance_pays',
      'carrier_name', 'member_id', 'group_number',
      'subscriber_name', 'subscriber_relationship', 'subscriber_dob',
      'customer_name', 'customer_phone', 'customer_dob', 'procedure_inquired',
    ]
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    // If status is becoming verified/denied/needs_more_info, stamp verified_at + verified_by
    const isStatusFinalizing =
      'status' in body
      && existing.status === 'pending'
      && ['verified', 'denied', 'needs_more_info'].includes(body.status)

    if (isStatusFinalizing) {
      updates.verified_at = new Date().toISOString()
      updates.verified_by = (authResult as any).userId || null
    }

    const { data: updated, error: updateErr } = await supabase
      .from('insurance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Trigger patient SMS if we just transitioned into a notify-worthy status
    let notification: { sent: boolean; reason?: string } = { sent: false }
    if (isStatusFinalizing && NOTIFY_PATIENT_STATUSES.has(body.status)) {
      notification = await notifyPatient(updated, existing.appointment)
      // Stamp the result on the record
      await supabase
        .from('insurance_records')
        .update({
          patient_notified_at: notification.sent ? new Date().toISOString() : null,
          patient_notification_status: notification.sent
            ? 'sent'
            : (notification.reason || 'failed'),
        })
        .eq('id', id)
    }

    return NextResponse.json({ success: true, record: updated, notification })
  } catch (err: any) {
    console.error('[insurance-records PATCH]', err)
    return NextResponse.json({ error: err.message || 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params

    const { data: existing } = await supabase
      .from('insurance_records')
      .select('business_id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const authResult = await validateBusinessAccess(request, existing.business_id)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Soft delete via status='archived'
    const { error } = await supabase
      .from('insurance_records')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[insurance-records DELETE]', err)
    return NextResponse.json({ error: err.message || 'Failed to archive record' }, { status: 500 })
  }
}

// ─── Patient SMS helper ─────────────────────────────────────────────────────

async function notifyPatient(
  record: any,
  appointment: any
): Promise<{ sent: boolean; reason?: 'blocked_no_sms' | 'blocked_quota' | 'failed' | 'no_phone' }> {
  if (!record.customer_phone) return { sent: false, reason: 'no_phone' }

  // Look up business + a tenant phone number to send from
  const { data: business } = await supabase
    .from('businesses')
    .select('name, phone')
    .eq('id', record.business_id)
    .maybeSingle()

  const { data: emp } = await supabase
    .from('phone_employees')
    .select('phone_number')
    .eq('business_id', record.business_id)
    .eq('phone_provider', 'twilio-vapi')
    .eq('is_active', true)
    .not('phone_number', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!emp?.phone_number) return { sent: false, reason: 'failed' }

  const businessName = business?.name || 'your provider'
  const businessPhone = business?.phone || emp.phone_number
  const customerFirst = (record.customer_name || '').split(' ')[0] || 'there'

  let body: string
  if (record.status === 'verified') {
    const apptInfo = appointment
      ? ` for your appointment ${formatAppointment(appointment)}`
      : ''
    const costInfo = record.estimated_patient_responsibility != null
      ? ` Estimated cost: $${record.estimated_patient_responsibility} out of pocket.`
      : ''
    body = `Hi ${customerFirst}, your ${record.carrier_name} coverage is confirmed${apptInfo}.${costInfo} Reply STOP to opt out. — ${businessName}`
  } else if (record.status === 'denied') {
    body = `Hi ${customerFirst}, we weren't able to verify your ${record.carrier_name} coverage. Please call us at ${businessPhone} so we can help. Reply STOP to opt out. — ${businessName}`
  } else {
    // needs_more_info
    body = `Hi ${customerFirst}, we need a bit more info to verify your ${record.carrier_name} coverage. Please call us at ${businessPhone} when you have a moment. Reply STOP to opt out. — ${businessName}`
  }

  const result = await sendSmsForBusiness({
    businessId: record.business_id,
    to: record.customer_phone,
    from: emp.phone_number,
    body,
  })

  if (result.success) return { sent: true }
  if (result.blocked === 'sms_not_enabled') return { sent: false, reason: 'blocked_no_sms' }
  if (result.blocked === 'quota_exceeded') return { sent: false, reason: 'blocked_quota' }
  return { sent: false, reason: 'failed' }
}

function formatAppointment(appt: any): string {
  if (!appt?.appointment_date) return ''
  try {
    const time = appt.start_time || appt.appointment_time
    const date = new Date(`${appt.appointment_date}T${time || '12:00'}`)
    const dayPart = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const timePart = time ? ` at ${time.slice(0, 5)}` : ''
    return `${dayPart}${timePart}`
  } catch {
    return appt.appointment_date
  }
}
