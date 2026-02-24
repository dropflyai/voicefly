/**
 * Employee Data Source API
 *
 * GET    /api/phone-employees/[employeeId]/data-source?businessId=
 * POST   /api/phone-employees/[employeeId]/data-source
 *        Body: { businessId, type, webhookUrl?, webhookSecret?, fields? }
 * DELETE /api/phone-employees/[employeeId]/data-source?businessId=
 *
 * Manages the data_source config for an employee. When set, the VAPI
 * assistant receives a lookupCaller function and will query the configured
 * source at the start of every call.
 *
 * After saving/deleting, triggers re-provisioning if vapi_assistant_id exists.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { employeeProvisioning } from '@/lib/phone-employees'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const { data: employee, error } = await supabase
      .from('phone_employees')
      .select('id, data_source')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ dataSource: employee.data_source ?? null })
  } catch (error: any) {
    console.error('[DataSource GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const body = await request.json()
    const { businessId, type, webhookUrl, webhookSecret, fields } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!type || !['voicefly-contacts', 'hubspot', 'custom-webhook'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be voicefly-contacts, hubspot, or custom-webhook' },
        { status: 400 }
      )
    }

    if (type === 'custom-webhook' && !webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl required for custom-webhook type' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const dataSource: Record<string, any> = { type }
    if (webhookUrl) dataSource.webhookUrl = webhookUrl
    if (webhookSecret) dataSource.webhookSecret = webhookSecret
    if (fields?.length) dataSource.fields = fields

    const { data: employee, error: updateError } = await supabase
      .from('phone_employees')
      .update({ data_source: dataSource, updated_at: new Date().toISOString() })
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select('id, vapi_assistant_id')
      .single()

    if (updateError || !employee) {
      console.error('[DataSource POST] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to save data source' }, { status: 500 })
    }

    // Re-provision VAPI assistant to inject lookupCaller function
    if (employee.vapi_assistant_id) {
      employeeProvisioning.updateEmployeeAssistant(employeeId, businessId)
        .catch(err => console.error('[DataSource POST] Re-provision failed:', err))
    }

    console.log(`[DataSource POST] Set ${type} data source for employee ${employeeId}`)
    return NextResponse.json({ success: true, dataSource })
  } catch (error: any) {
    console.error('[DataSource POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const { data: employee, error: updateError } = await supabase
      .from('phone_employees')
      .update({ data_source: null, updated_at: new Date().toISOString() })
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select('id, vapi_assistant_id')
      .single()

    if (updateError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Re-provision to remove lookupCaller function
    if (employee.vapi_assistant_id) {
      employeeProvisioning.updateEmployeeAssistant(employeeId, businessId)
        .catch(err => console.error('[DataSource DELETE] Re-provision failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DataSource DELETE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
