import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { employeeProvisioning } from '@/lib/phone-employees/employee-provisioning'
import type { ReceptionistConfig, AppointmentSchedulerConfig, OrderTakerConfig, CustomerServiceConfig } from '@/lib/phone-employees/types'

// Map onboarding employee type → job type + config builder
const JOB_TYPE_MAP: Record<string, string> = {
  'receptionist': 'receptionist',
  'appointment-scheduler': 'appointment-scheduler',
  'order-taker': 'order-taker',
  'customer-service': 'customer-service',
}

// ElevenLabs voice ID → VAPI-compatible voice ID mapping
// We store the EL voice ID from onboarding and pass it through
function buildVoiceConfig(voiceId: string) {
  return {
    voiceId,
    speed: 1.0,
    stability: 0.8,
    similarityBoost: 0.75,
  }
}

function buildJobConfig(
  jobType: string,
  params: {
    businessName: string
    industry: string
    address: string
    hoursNote: string
    services: string
    escalationPhone: string
    greeting: string
    employeeName: string
  }
): ReceptionistConfig | AppointmentSchedulerConfig | OrderTakerConfig | CustomerServiceConfig {
  const base = {
    greeting: params.greeting,
    businessHours: params.hoursNote || 'Please check our website for current hours',
    transferNumber: params.escalationPhone || undefined,
    address: params.address || undefined,
  }

  switch (jobType) {
    case 'receptionist':
      return {
        ...base,
        departments: [],
        commonQuestions: params.services
          ? [{ question: 'What services do you offer?', answer: `We offer: ${params.services}` }]
          : [],
      } as ReceptionistConfig

    case 'appointment-scheduler':
      return {
        ...base,
        services: params.services ? params.services.split(',').map(s => s.trim()) : [],
        confirmationMessage: `Your appointment has been confirmed. We look forward to seeing you!`,
      } as AppointmentSchedulerConfig

    case 'order-taker':
      return {
        ...base,
        menuItems: params.services ? params.services.split(',').map(s => ({ name: s.trim(), price: 0 })) : [],
      } as OrderTakerConfig

    case 'customer-service':
      return {
        ...base,
        commonIssues: [],
        escalationPolicy: params.escalationPhone ? 'transfer' : 'message',
      } as CustomerServiceConfig

    default:
      return base as ReceptionistConfig
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Auth check
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    const {
      industry,
      address = '',
      hoursNote = '',
      employeeType,
      employeeName,
      voiceId,
      greeting,
      services = '',
      escalationPhone = '',
      areaCode,
    } = body

    if (!employeeType || !employeeName) {
      return NextResponse.json({ error: 'Employee type and name are required' }, { status: 400 })
    }

    const jobType = JOB_TYPE_MAP[employeeType]
    if (!jobType) {
      return NextResponse.json({ error: `Unknown employee type: ${employeeType}` }, { status: 400 })
    }

    // Get business name
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    const businessName = business?.name || 'Your Business'

    console.log(`[Onboarding] Creating ${jobType} employee "${employeeName}" for business ${businessId}`)

    const jobConfig = buildJobConfig(jobType, {
      businessName,
      industry,
      address,
      hoursNote,
      services,
      escalationPhone,
      greeting,
      employeeName,
    })

    // Create employee + provision Twilio+VAPI number
    const employee = await employeeProvisioning.createEmployee({
      businessId,
      jobType: jobType as any,
      name: employeeName,
      config: jobConfig,
      voice: buildVoiceConfig(voiceId),
      provisionPhone: true,
      phoneMode: 'twilio-vapi',
      areaCode: areaCode || undefined,
    })

    // Mark onboarding complete
    await supabase
      .from('businesses')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        business_type: industry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    console.log(`[Onboarding] Complete — employee: ${employee.id}, phone: ${employee.phoneNumber}`)

    return NextResponse.json({
      success: true,
      employeeId: employee.id,
      employeeName: employee.name,
      phoneNumber: employee.phoneNumber || null,
      vapiAssistantId: employee.vapiAssistantId,
    })

  } catch (error: any) {
    console.error('[Onboarding] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
