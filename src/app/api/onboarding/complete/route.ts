import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { employeeProvisioning } from '@/lib/phone-employees/employee-provisioning'
import type { ReceptionistConfig, AppointmentSchedulerConfig, OrderTakerConfig, CustomerServiceConfig } from '@/lib/phone-employees/types'
import { sendEmployeeReadyEmail, getOwnerEmail } from '@/lib/notifications/email-notifications'

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
    provider: '11labs' as const,
    voiceId,
    speed: 1.0,
    stability: 0.8,
    similarityBoost: 0.75,
  }
}

function buildExtraKnowledgePrompt(extraKnowledge: Record<string, any>): string {
  const sections: string[] = []

  if (extraKnowledge.businessDescription) {
    sections.push(`Business: ${extraKnowledge.businessDescription}`)
  }
  if (extraKnowledge.faqs?.length) {
    const faqText = extraKnowledge.faqs
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n')
    sections.push(`## Frequently Asked Questions\n${faqText}`)
  }
  if (extraKnowledge.staff?.length) {
    const staffText = extraKnowledge.staff
      .map((s: any) => `- ${s.name}${s.role ? ` (${s.role})` : ''}`)
      .join('\n')
    sections.push(`## Team Members\n${staffText}`)
  }
  if (extraKnowledge.policies) {
    const p = extraKnowledge.policies
    const policyLines: string[] = []
    if (p.cancellation) policyLines.push(`Cancellation: ${p.cancellation}`)
    if (p.booking) policyLines.push(`Booking: ${p.booking}`)
    if (p.returns) policyLines.push(`Returns: ${p.returns}`)
    if (p.warranty) policyLines.push(`Warranty: ${p.warranty}`)
    if (p.lateFee) policyLines.push(`Late fee: ${p.lateFee}`)
    if (policyLines.length) sections.push(`## Policies\n${policyLines.join('\n')}`)
  }
  if (extraKnowledge.paymentMethods?.length) {
    sections.push(`## Payment Methods\nWe accept: ${extraKnowledge.paymentMethods.join(', ')}`)
  }
  if (extraKnowledge.parkingInfo) {
    sections.push(`## Parking & Directions\n${extraKnowledge.parkingInfo}`)
  }
  if (extraKnowledge.promotions?.length) {
    sections.push(`## Current Promotions\n${extraKnowledge.promotions.map((p: string) => `- ${p}`).join('\n')}`)
  }

  return sections.join('\n\n')
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
    extraKnowledge?: Record<string, any>
  }
): ReceptionistConfig | AppointmentSchedulerConfig | OrderTakerConfig | CustomerServiceConfig {
  const ek = params.extraKnowledge || {}

  const base: Record<string, any> = {
    greeting: params.greeting,
    businessHours: params.hoursNote || 'Please check our website for current hours',
    transferNumber: params.escalationPhone || undefined,
    address: params.address || ek.address || undefined,
  }

  // Map extracted fields directly into visible config fields
  if (ek.businessDescription) base.businessDescription = ek.businessDescription
  if (ek.faqs?.length) base.faqs = ek.faqs
  if (ek.staff?.length) base.staffMembers = ek.staff.map((s: any) => ({ id: s.name, name: s.name, specialties: s.role ? [s.role] : [] }))
  if (ek.policies?.cancellation) base.cancellationPolicy = ek.policies.cancellation

  // Also keep the compiled text block for the VAPI system prompt
  if (Object.keys(ek).length > 0) {
    base.extraKnowledge = buildExtraKnowledgePrompt(ek)
  }

  switch (jobType) {
    case 'receptionist': {
      // Use scraped structured services if available, fall back to text list
      const scrapedServices = ek.services?.length
        ? ek.services.map((s: any) => ({ name: typeof s === 'string' ? s : s.name, duration: s.duration || 60, description: s.description || '' }))
        : []
      const textServices = params.services
        ? params.services.split(',').map((s: string) => ({ name: s.trim(), duration: 60, description: '' }))
        : []
      return {
        ...base,
        departments: [],
        services: scrapedServices.length ? scrapedServices : textServices,
        commonQuestions: params.services && !scrapedServices.length
          ? [{ question: 'What services do you offer?', answer: `We offer: ${params.services}` }]
          : [],
      } as ReceptionistConfig
    }

    case 'appointment-scheduler': {
      const scrapedApptTypes = ek.appointmentTypes?.length
        ? ek.appointmentTypes.map((a: any) => ({ id: a.name, name: a.name, duration: a.duration || 60, price: a.price, description: a.description || '' }))
        : []
      return {
        ...base,
        apptTypes: scrapedApptTypes,
        services: params.services ? params.services.split(',').map((s: string) => s.trim()) : [],
        confirmationMessage: `Your appointment has been confirmed. We look forward to seeing you!`,
      } as AppointmentSchedulerConfig
    }

    case 'order-taker': {
      // Use scraped menu (structured) if available, fall back to text services
      let menuItems: { name: string; price: number; description?: string }[] = []
      if (ek.menu?.categories?.length) {
        for (const cat of ek.menu.categories) {
          for (const item of (cat.items || [])) {
            menuItems.push({ name: item.name, price: item.price || 0, description: item.description })
          }
        }
      } else if (ek.services?.length) {
        menuItems = ek.services.map((s: any) => ({ name: typeof s === 'string' ? s : s.name, price: (s as any).price || 0, description: (s as any).description }))
      } else if (params.services) {
        menuItems = params.services.split(',').map((s: string) => ({ name: s.trim(), price: 0 }))
      }
      return {
        ...base,
        menuItems,
        menuCategories: ek.menu?.categories || [],
      } as OrderTakerConfig
    }

    case 'customer-service':
      return {
        ...base,
        commonIssues: ek.commonIssues || [],
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

    // Auth check — JWT required
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
      extraKnowledge,
    } = body

    if (!employeeType || !employeeName) {
      return NextResponse.json({ error: 'Employee type and name are required' }, { status: 400 })
    }

    const jobType = JOB_TYPE_MAP[employeeType]
    if (!jobType) {
      return NextResponse.json({ error: `Unknown employee type: ${employeeType}` }, { status: 400 })
    }

    // Get business name
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
      extraKnowledge,
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
        business_type: industry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    console.log(`[Onboarding] Complete — employee: ${employee.id}, phone: ${employee.phoneNumber}`)

    // Send employee-ready email (non-blocking)
    const ownerEmail = await getOwnerEmail(businessId)
    if (ownerEmail && employee.phoneNumber) {
      sendEmployeeReadyEmail({
        ownerEmail,
        businessName,
        employeeName: employee.name,
        phoneNumber: employee.phoneNumber,
        jobType: jobType,
      }).catch(err => console.error('[Onboarding] Failed to send ready email:', err))
    }

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
