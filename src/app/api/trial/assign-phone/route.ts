/**
 * Trial Phone Assignment Endpoint
 *
 * POST /api/trial/assign-phone
 *
 * Assigns the shared trial phone number to a trial business.
 * Creates a trial-receptionist employee if one does not exist.
 * All trial businesses share a single phone number -- the webhook
 * routes calls by metadata (businessId) on the shared assistant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { DEFAULT_CAPABILITIES_BY_JOB, EmployeeJobType } from '@/lib/phone-employees/types'
import { getDefaultReceptionistConfig } from '@/lib/phone-employees/templates/receptionist'
import { getDefaultOrderTakerConfig } from '@/lib/phone-employees/templates/order-taker'
import { getDefaultAppointmentSchedulerConfig } from '@/lib/phone-employees/templates/appointment-scheduler'
import { getDefaultCustomerServiceConfig } from '@/lib/phone-employees/templates/customer-service'
import { getDefaultRestaurantHostConfig } from '@/lib/phone-employees/templates/restaurant-host'
import { getDefaultAfterHoursEmergencyConfig } from '@/lib/phone-employees/templates/after-hours-emergency'

function getDefaultJobConfig(jobType: string, businessName: string): any {
  switch (jobType) {
    case 'receptionist':
      return getDefaultReceptionistConfig(businessName)
    case 'order-taker':
      return getDefaultOrderTakerConfig(businessName)
    case 'appointment-scheduler':
      return getDefaultAppointmentSchedulerConfig(businessName)
    case 'customer-service':
      return getDefaultCustomerServiceConfig(businessName)
    case 'restaurant-host':
      return getDefaultRestaurantHostConfig(businessName)
    case 'after-hours-emergency':
      return getDefaultAfterHoursEmergencyConfig(businessName)
    default:
      return getDefaultReceptionistConfig(businessName)
  }
}

const JOB_TYPE_NAMES: Record<string, string> = {
  'receptionist': 'Receptionist',
  'order-taker': 'Order Taker',
  'appointment-scheduler': 'Appointment Scheduler',
  'customer-service': 'Customer Service',
  'restaurant-host': 'Restaurant Host',
  'after-hours-emergency': 'After Hours',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { businessId, jobType } = body
    // Default to receptionist if no job type specified
    const selectedJobType = jobType || 'receptionist'

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
    }

    // Validate auth and business access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the business is on trial
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, subscription_status, subscription_tier, ai_phone_number')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.subscription_status !== 'trial') {
      return NextResponse.json(
        { error: 'This endpoint is only for trial businesses. Upgrade to get a dedicated phone number.' },
        { status: 403 }
      )
    }

    const trialPhoneNumber = process.env.TRIAL_PHONE_NUMBER
    if (!trialPhoneNumber) {
      console.error('[TrialAssignPhone] TRIAL_PHONE_NUMBER env var not set')
      return NextResponse.json(
        { error: 'Trial phone number not configured. Contact support.' },
        { status: 500 }
      )
    }

    const sharedAssistantId = process.env.VAPI_SHARED_ASSISTANT_ID
    if (!sharedAssistantId) {
      console.error('[TrialAssignPhone] VAPI_SHARED_ASSISTANT_ID env var not set')
      return NextResponse.json(
        { error: 'Shared assistant not configured. Contact support.' },
        { status: 500 }
      )
    }

    // Check for existing trial employee (any job type with shared assistant)
    const { data: existingEmployee } = await supabase
      .from('phone_employees')
      .select('id, name, phone_number, vapi_assistant_id, job_type')
      .eq('business_id', businessId)
      .eq('vapi_assistant_id', sharedAssistantId)
      .limit(1)
      .single()

    const jobConfig = getDefaultJobConfig(selectedJobType, business.name)
    // Trial employees don't get transfer or SMS — those are paid features
    const TRIAL_BLOCKED_CAPABILITIES = ['transfer_to_human', 'send_sms', 'send_email']
    const capabilities = (DEFAULT_CAPABILITIES_BY_JOB[selectedJobType as EmployeeJobType]
      || DEFAULT_CAPABILITIES_BY_JOB['receptionist'])
      .filter(c => !TRIAL_BLOCKED_CAPABILITIES.includes(c))
    const employeeName = `Trial ${JOB_TYPE_NAMES[selectedJobType] || 'Receptionist'}`

    let employeeId: string

    if (existingEmployee) {
      employeeId = existingEmployee.id

      // Update the employee with new job type / phone number
      await supabase
        .from('phone_employees')
        .update({
          phone_number: trialPhoneNumber,
          vapi_assistant_id: sharedAssistantId,
          job_type: selectedJobType,
          name: employeeName,
          job_config: jobConfig,
          capabilities,
          provisioning_status: 'active',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
    } else {
      // Create a new trial employee with the chosen job type
      const { data: newEmployee, error: insertError } = await supabase
        .from('phone_employees')
        .insert({
          business_id: businessId,
          name: employeeName,
          job_type: selectedJobType,
          is_active: true,
          phone_number: trialPhoneNumber,
          vapi_assistant_id: sharedAssistantId,
          provisioning_status: 'active',
          job_config: jobConfig,
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
          capabilities,
        })
        .select('id')
        .single()

      if (insertError || !newEmployee) {
        console.error('[TrialAssignPhone] Failed to create trial employee:', insertError)
        return NextResponse.json(
          { error: 'Failed to create trial employee' },
          { status: 500 }
        )
      }

      employeeId = newEmployee.id
    }

    // Update the business record with the trial phone number
    await supabase
      .from('businesses')
      .update({ ai_phone_number: trialPhoneNumber })
      .eq('id', businessId)

    return NextResponse.json({
      success: true,
      employeeId,
      phoneNumber: trialPhoneNumber,
      jobType: selectedJobType,
      message: `Trial phone number assigned. Your AI ${employeeName} is ready to take calls.`,
    })
  } catch (error: any) {
    console.error('[TrialAssignPhone] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
