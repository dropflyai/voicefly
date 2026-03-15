/**
 * Phone Employees API
 *
 * GET    /api/phone-employees - List all employees
 * POST   /api/phone-employees - Create a new employee
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { employeeProvisioning } from '@/lib/phone-employees'
import { validateBusinessAccess } from '@/lib/api-auth'



import {
  EmployeeJobType,
  ReceptionistConfig,
  PersonalAssistantConfig,
  OrderTakerConfig,
  SIMPLE_EMPLOYEE_JOBS,
} from '@/lib/phone-employees/types'
import {
  getDefaultReceptionistConfig,
} from '@/lib/phone-employees/templates/receptionist'
import {
  getDefaultPersonalAssistantConfig,
} from '@/lib/phone-employees/templates/personal-assistant'
import {
  getDefaultOrderTakerConfig,
} from '@/lib/phone-employees/templates/order-taker'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Validate access — JWT required
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employees = await employeeProvisioning.getEmployees(businessId)

    return NextResponse.json({
      employees,
      count: employees.length,
    })
  } catch (error: any) {
    console.error('[API] Failed to fetch employees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      jobType,
      name,
      config,
      voice,
      personality,
      schedule,
      provisionPhone,
      phoneMode,
      areaCode,
    } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!jobType) {
      return NextResponse.json({ error: 'Job type required' }, { status: 400 })
    }

    // Validate job type
    if (!SIMPLE_EMPLOYEE_JOBS.includes(jobType as EmployeeJobType)) {
      return NextResponse.json({
        error: `Invalid job type. Available: ${SIMPLE_EMPLOYEE_JOBS.join(', ')}`,
      }, { status: 400 })
    }

    // Validate access — JWT required
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch actual business name for default configs
    let employeeConfig = config
    if (!employeeConfig) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single()
      const businessName = business?.name || 'Your Business'

      switch (jobType) {
        case 'receptionist':
          employeeConfig = getDefaultReceptionistConfig(businessName)
          break
        case 'personal-assistant':
          employeeConfig = getDefaultPersonalAssistantConfig(name || businessName)
          break
        case 'order-taker':
          employeeConfig = getDefaultOrderTakerConfig(businessName)
          break
        default:
          employeeConfig = { type: 'generic', greeting: 'Hello!', systemPrompt: '' }
      }
    }

    // Create the employee
    const employee = await employeeProvisioning.createEmployee({
      businessId,
      jobType: jobType as EmployeeJobType,
      name,
      config: employeeConfig,
      voice,
      personality,
      schedule,
      provisionPhone: provisionPhone || false,
      phoneMode: phoneMode || 'twilio-vapi',
      areaCode,
    })

    // Extract phoneError if present (phone failed but employee was still created)
    const { phoneError, ...employeeData } = employee as any

    return NextResponse.json({
      success: true,
      employee: employeeData,
      phoneError: phoneError || null,
      message: `${jobType} employee "${employee.name}" created successfully`,
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] Failed to create employee:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
