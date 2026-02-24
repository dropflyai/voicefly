/**
 * Provision Phone Number for Existing Employee
 *
 * Called after an employee is created to attach a dedicated phone number.
 * Supports both VAPI-managed numbers (calls only) and Twilio-owned numbers
 * (calls + SMS via the twilio-vapi mode).
 *
 * POST /api/phone-employees/[employeeId]/provision-phone
 * Body: { businessId, phoneMode: 'vapi-only' | 'twilio-vapi', areaCode?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { employeeProvisioning } from '@/lib/phone-employees'
import { validateBusinessAccess } from '@/lib/api-auth'
import type { PhoneMode } from '@/lib/phone-employees/employee-provisioning'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const body = await request.json()
    const { businessId, phoneMode, areaCode } = body as {
      businessId: string
      phoneMode: PhoneMode
      areaCode?: string
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!phoneMode || !['vapi-only', 'twilio-vapi'].includes(phoneMode)) {
      return NextResponse.json(
        { error: 'phoneMode must be "vapi-only" or "twilio-vapi"' },
        { status: 400 }
      )
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const result = await employeeProvisioning.provisionPhoneForEmployee(
      employeeId,
      businessId,
      phoneMode,
      areaCode
    )

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      phoneProvider: result.phoneProvider,
      message: `Phone number ${result.phoneNumber} provisioned successfully`,
    })
  } catch (error: any) {
    console.error('[API] Failed to provision phone:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
