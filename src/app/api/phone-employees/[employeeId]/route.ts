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
    const { businessId, name, personality, schedule, jobConfig, isActive } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const employee = await employeeProvisioning.updateEmployee(employeeId, businessId, {
      name,
      personality,
      schedule,
      jobConfig,
      isActive,
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
