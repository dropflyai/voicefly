/**
 * Individual Phone Employee API
 *
 * GET    /api/phone-employees/[employeeId] - Get employee details
 * PATCH  /api/phone-employees/[employeeId] - Update employee
 * DELETE /api/phone-employees/[employeeId] - Delete employee
 */

import { NextRequest, NextResponse } from 'next/server'
import { employeeProvisioning } from '@/lib/phone-employees'
import { validateBusinessAccess } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

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
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const employee = await employeeProvisioning.getEmployee(employeeId, businessId)

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error: any) {
    console.error('[API] Failed to fetch employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const body = await request.json()
    const { businessId, name, personality, schedule, jobConfig, isActive, widgetConfig, voice } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // If this is a widget-config-only update, handle it directly
    if (widgetConfig !== undefined && !name && !personality && !schedule && !jobConfig && isActive === undefined) {
      const { error: wcErr } = await supabase
        .from('phone_employees')
        .update({ widget_config: widgetConfig })
        .eq('id', employeeId)
        .eq('business_id', businessId)

      if (wcErr) {
        return NextResponse.json({ error: wcErr.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const employee = await employeeProvisioning.updateEmployee(employeeId, businessId, {
      name,
      personality,
      schedule,
      jobConfig,
      isActive,
      voice,
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employee,
      message: 'Employee updated successfully',
    })
  } catch (error: any) {
    console.error('[API] Failed to update employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const success = await employeeProvisioning.deleteEmployee(employeeId, businessId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    })
  } catch (error: any) {
    console.error('[API] Failed to delete employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
