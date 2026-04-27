/**
 * Insurance Records — collection endpoints
 *
 * POST   /api/insurance-records          — create a new pending record
 *                                          (called by AI during a call OR by
 *                                          the dashboard if staff captures
 *                                          manually)
 * GET    /api/insurance-records?...      — list records for the queue UI
 *
 * See docs/scopes/insurance-verification.md for the full spec.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REQUIRED_FIELDS = ['business_id', 'carrier_name', 'member_id'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const businessId = body.business_id || body.businessId
    if (!businessId) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const missing = REQUIRED_FIELDS.filter(k => {
      const v = (body as any)[k] || (body as any)[k.replace('_id', 'Id')]
      return !v
    })
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Missing required fields', fields: missing }, { status: 400 })
    }

    const insertRow = {
      business_id: businessId,
      appointment_id: body.appointment_id || null,
      call_id: body.call_id || null,
      customer_name: body.customer_name || null,
      customer_phone: body.customer_phone || null,
      customer_dob: body.customer_dob || null,
      carrier_name: body.carrier_name,
      member_id: body.member_id,
      group_number: body.group_number || null,
      subscriber_name: body.subscriber_name || null,
      subscriber_relationship: body.subscriber_relationship || null,
      subscriber_dob: body.subscriber_dob || null,
      procedure_inquired: body.procedure_inquired || null,
      status: 'pending',
    }

    const { data, error } = await supabase
      .from('insurance_records')
      .insert(insertRow)
      .select()
      .single()

    if (error) {
      console.error('[insurance-records POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire owner-notification email in background (non-blocking)
    notifyOwnerOfNewRecord(businessId, data).catch(err =>
      console.error('[insurance-records] owner notification failed', err)
    )

    return NextResponse.json({ success: true, record: data })
  } catch (err: any) {
    console.error('[insurance-records POST] unexpected', err)
    return NextResponse.json({ error: err.message || 'Failed to create record' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '100'), 500)

    let query = supabase
      .from('insurance_records')
      .select(`
        *,
        appointment:appointments(id, customer_name, appointment_date, appointment_time, service)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) {
      console.error('[insurance-records GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records: data || [] })
  } catch (err: any) {
    console.error('[insurance-records GET] unexpected', err)
    return NextResponse.json({ error: err.message || 'Failed to load records' }, { status: 500 })
  }
}

// ─── Owner notification helper ──────────────────────────────────────────────

async function notifyOwnerOfNewRecord(businessId: string, record: any): Promise<void> {
  const { data: business } = await supabase
    .from('businesses')
    .select('name, email')
    .eq('id', businessId)
    .maybeSingle()

  if (!business?.email) return

  const { sendInsuranceVerificationNeededEmail } = await import('@/lib/notifications/email-notifications')
  await sendInsuranceVerificationNeededEmail({
    ownerEmail: business.email,
    businessName: business.name || 'your business',
    customerName: record.customer_name || 'Unknown caller',
    customerPhone: record.customer_phone || '—',
    carrier: record.carrier_name,
    memberId: record.member_id,
    procedureInquired: record.procedure_inquired || null,
    recordId: record.id,
  })
}
