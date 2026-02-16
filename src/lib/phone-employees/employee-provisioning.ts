/**
 * Employee Provisioning Service
 *
 * Handles creating, configuring, and managing phone employees.
 * Integrates with VAPI for voice AI capabilities.
 */

import { createClient } from '@supabase/supabase-js'
import {
  EmployeeConfig,
  EmployeeJobType,
  ReceptionistConfig,
  PersonalAssistantConfig,
  OrderTakerConfig,
  DEFAULT_CAPABILITIES_BY_JOB,
} from './types'
import { GoogleCalendarService } from '../google-calendar-service'
import {
  createReceptionistEmployee,
  generateReceptionistPrompt,
  RECEPTIONIST_FUNCTIONS,
} from './templates/receptionist'
import {
  createPersonalAssistantEmployee,
  generatePersonalAssistantPrompt,
  PERSONAL_ASSISTANT_FUNCTIONS,
} from './templates/personal-assistant'
import {
  createOrderTakerEmployee,
  generateOrderTakerPrompt,
  ORDER_TAKER_FUNCTIONS,
} from './templates/order-taker'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const VAPI_API_KEY = process.env.VAPI_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://voicefly.app'

// ============================================
// EMPLOYEE PROVISIONING SERVICE
// ============================================

export class EmployeeProvisioningService {
  private static instance: EmployeeProvisioningService

  private constructor() {}

  static getInstance(): EmployeeProvisioningService {
    if (!EmployeeProvisioningService.instance) {
      EmployeeProvisioningService.instance = new EmployeeProvisioningService()
    }
    return EmployeeProvisioningService.instance
  }

  // ============================================
  // CREATE EMPLOYEES
  // ============================================

  /**
   * Create a new phone employee
   */
  async createEmployee(params: {
    businessId: string
    jobType: EmployeeJobType
    name?: string
    config: ReceptionistConfig | PersonalAssistantConfig | OrderTakerConfig
    voice?: EmployeeConfig['voice']
    personality?: EmployeeConfig['personality']
    schedule?: EmployeeConfig['schedule']
    provisionPhone?: boolean
  }): Promise<EmployeeConfig> {
    console.log(`[EmployeeProvisioning] Creating ${params.jobType} employee for business ${params.businessId}`)

    // Get business info
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('name, subscription_tier, phone')
      .eq('id', params.businessId)
      .single()

    if (bizError || !business) {
      throw new Error('Business not found')
    }

    // Create employee config based on job type
    let employeeData: Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'>

    switch (params.jobType) {
      case 'receptionist':
        employeeData = createReceptionistEmployee({
          businessId: params.businessId,
          businessName: business.name,
          name: params.name,
          customConfig: params.config as Partial<ReceptionistConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'personal-assistant':
        employeeData = createPersonalAssistantEmployee({
          businessId: params.businessId,
          ownerName: (params.config as PersonalAssistantConfig).ownerName || business.name,
          name: params.name,
          customConfig: params.config as Partial<PersonalAssistantConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'order-taker':
        employeeData = createOrderTakerEmployee({
          businessId: params.businessId,
          businessName: business.name,
          name: params.name,
          customConfig: params.config as Partial<OrderTakerConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      default:
        throw new Error(`Unsupported job type: ${params.jobType}`)
    }

    // Override schedule if provided
    if (params.schedule) {
      employeeData.schedule = params.schedule
    }

    // Save to database first to get ID
    const { data: savedEmployee, error: saveError } = await supabase
      .from('phone_employees')
      .insert({
        business_id: params.businessId,
        name: employeeData.name,
        job_type: employeeData.jobType,
        complexity: employeeData.complexity,
        voice: employeeData.voice,
        personality: employeeData.personality,
        schedule: employeeData.schedule,
        capabilities: employeeData.capabilities,
        job_config: employeeData.jobConfig,
        is_active: false,  // Not active until VAPI is provisioned
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('[EmployeeProvisioning] Failed to save employee:', saveError)
      throw saveError
    }

    // Provision VAPI agent
    const vapiResult = await this.provisionVAPIAgent(savedEmployee, business.name)

    // Update with VAPI info
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('phone_employees')
      .update({
        vapi_assistant_id: vapiResult.assistantId,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', savedEmployee.id)
      .select()
      .single()

    if (updateError) {
      console.error('[EmployeeProvisioning] Failed to update employee with VAPI:', updateError)
      throw updateError
    }

    // Optionally provision phone number
    let phoneNumber: string | undefined
    let vapiPhoneId: string | undefined

    if (params.provisionPhone) {
      try {
        const phoneResult = await this.provisionPhoneNumber(savedEmployee.id, params.businessId)
        phoneNumber = phoneResult.phoneNumber
        vapiPhoneId = phoneResult.phoneId

        // Update with phone info
        await supabase
          .from('phone_employees')
          .update({
            vapi_phone_id: vapiPhoneId,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedEmployee.id)
      } catch (phoneError) {
        console.warn('[EmployeeProvisioning] Phone provisioning failed:', phoneError)
        // Continue without phone - employee can still handle inbound via shared number
      }
    }

    console.log(`[EmployeeProvisioning] Employee created: ${savedEmployee.id}`, {
      vapiAssistantId: vapiResult.assistantId,
      phoneNumber,
    })

    return this.mapToEmployeeConfig({
      ...updatedEmployee,
      vapi_assistant_id: vapiResult.assistantId,
      vapi_phone_id: vapiPhoneId,
      phone_number: phoneNumber,
    })
  }

  // ============================================
  // VAPI INTEGRATION
  // ============================================

  private async provisionVAPIAgent(
    employee: any,
    businessName: string
  ): Promise<{ assistantId: string }> {
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not configured')
    }

    // Generate system prompt based on job type
    let systemPrompt = this.generateSystemPrompt(employee, businessName)

    // Check if business has Google Calendar connected and append context
    const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(employee.business_id)
    if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
      systemPrompt += `\n\n## Calendar Integration\nThis business has a live Google Calendar connected. When checking availability or booking appointments, you have access to real-time calendar data. You can confidently tell callers about available time slots and book appointments that will automatically appear on the business calendar.`
    }

    // Get functions for this job type, filtered by capabilities
    const functions = this.getFunctionsForJobType(employee.job_type, employee.capabilities)

    // Create VAPI assistant
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${employee.name} - ${employee.job_type}`.substring(0, 40),
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
          functions: functions,
        },
        voice: {
          provider: '11labs',
          voiceId: employee.voice?.voiceId || 'sarah',
          speed: employee.voice?.speed || 1.0,
          stability: employee.voice?.stability || 0.8,
        },
        firstMessage: employee.job_config?.greeting || `Hello! This is ${employee.name}. How can I help you today?`,
        serverUrl: `${APP_URL}/api/webhooks/phone-employee`,
        serverUrlSecret: employee.id,
        metadata: {
          employeeId: employee.id,
          businessId: employee.business_id,
          jobType: employee.job_type,
          createdBy: 'phone-employee-system',
          version: '1.0',
        },
        endCallMessage: `Thank you for calling ${businessName}! Have a great day!`,
        endCallPhrases: ['goodbye', 'bye', 'that\'s all', 'nothing else', 'end call'],
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 1800,  // 30 minute max
        backgroundSound: 'off',
        voicemailDetection: {
          provider: 'twilio',
          enabled: true,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[EmployeeProvisioning] VAPI creation failed:', errorData)
      throw new Error(`VAPI error: ${errorData.message || response.statusText}`)
    }

    const assistant = await response.json()

    console.log(`[EmployeeProvisioning] VAPI assistant created: ${assistant.id}`)

    return { assistantId: assistant.id }
  }

  private generateSystemPrompt(employee: any, businessName: string): string {
    const config: EmployeeConfig = {
      id: employee.id,
      businessId: employee.business_id,
      name: employee.name,
      jobType: employee.job_type,
      complexity: employee.complexity,
      voice: employee.voice,
      personality: employee.personality,
      schedule: employee.schedule,
      capabilities: employee.capabilities,
      jobConfig: employee.job_config,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    switch (employee.job_type) {
      case 'receptionist':
        return generateReceptionistPrompt(config, employee.job_config as ReceptionistConfig)

      case 'personal-assistant':
        return generatePersonalAssistantPrompt(config, employee.job_config as PersonalAssistantConfig)

      case 'order-taker':
        return generateOrderTakerPrompt(config, employee.job_config as OrderTakerConfig)

      default:
        return `You are ${employee.name}, an AI assistant for ${businessName}. Be helpful and professional.`
    }
  }

  private getFunctionsForJobType(jobType: EmployeeJobType, capabilities?: string[]): any[] {
    let allFunctions: any[]
    switch (jobType) {
      case 'receptionist':
        allFunctions = RECEPTIONIST_FUNCTIONS
        break
      case 'personal-assistant':
        allFunctions = [...PERSONAL_ASSISTANT_FUNCTIONS, {
          name: 'getCalendarInfo',
          description: 'Get upcoming appointments from the calendar',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Starting date to look from (YYYY-MM-DD). Defaults to today.' },
            },
          },
        }]
        break
      case 'order-taker':
        allFunctions = ORDER_TAKER_FUNCTIONS
        break
      default:
        allFunctions = []
    }

    // Filter functions based on employee capabilities if provided
    if (capabilities?.length) {
      const capabilityToFunctions: Record<string, string[]> = {
        book_appointments: ['scheduleAppointment', 'checkAvailability', 'rescheduleAppointment', 'cancelAppointment', 'getCalendarInfo'],
        take_messages: ['takeMessage'],
        transfer_to_human: ['transferCall'],
        provide_business_info: ['getBusinessInfo'],
        take_orders: ['addToOrder', 'modifyOrderItem', 'removeFromOrder', 'getOrderSummary', 'setOrderType', 'setCustomerInfo', 'confirmOrder', 'getEstimatedTime', 'checkItemAvailability'],
        process_payments: ['processPayment'],
        send_reminders: ['sendReminder'],
      }

      const allowedFunctions = new Set<string>()
      for (const cap of capabilities) {
        const fns = capabilityToFunctions[cap]
        if (fns) fns.forEach(f => allowedFunctions.add(f))
      }

      // If we have a mapping, filter. Otherwise return all (backwards compatible).
      if (allowedFunctions.size > 0) {
        return allFunctions.filter(f => allowedFunctions.has(f.name))
      }
    }

    return allFunctions
  }

  private async provisionPhoneNumber(
    employeeId: string,
    businessId: string
  ): Promise<{ phoneNumber: string; phoneId: string }> {
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not configured')
    }

    // Get employee's VAPI assistant ID
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('vapi_assistant_id')
      .eq('id', employeeId)
      .single()

    if (!employee?.vapi_assistant_id) {
      throw new Error('Employee has no VAPI assistant')
    }

    // Purchase phone number via VAPI
    const purchaseResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'twilio',
        assistantId: employee.vapi_assistant_id,
        name: `Phone Employee - ${employeeId}`,
      }),
    })

    if (!purchaseResponse.ok) {
      const errorData = await purchaseResponse.json()
      throw new Error(`Phone provisioning failed: ${errorData.message || purchaseResponse.statusText}`)
    }

    const phoneData = await purchaseResponse.json()

    console.log(`[EmployeeProvisioning] Phone number provisioned: ${phoneData.number}`)

    return {
      phoneNumber: phoneData.number,
      phoneId: phoneData.id,
    }
  }

  // ============================================
  // EMPLOYEE MANAGEMENT
  // ============================================

  /**
   * Get all employees for a business
   */
  async getEmployees(businessId: string): Promise<EmployeeConfig[]> {
    const { data, error } = await supabase
      .from('phone_employees')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[EmployeeProvisioning] Failed to fetch employees:', error)
      return []
    }

    return data.map(this.mapToEmployeeConfig)
  }

  /**
   * Get a single employee
   */
  async getEmployee(employeeId: string, businessId: string): Promise<EmployeeConfig | null> {
    const { data, error } = await supabase
      .from('phone_employees')
      .select('*')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToEmployeeConfig(data)
  }

  /**
   * Update employee configuration
   */
  async updateEmployee(
    employeeId: string,
    businessId: string,
    updates: Partial<{
      name: string
      personality: EmployeeConfig['personality']
      schedule: EmployeeConfig['schedule']
      jobConfig: EmployeeConfig['jobConfig']
      isActive: boolean
    }>
  ): Promise<EmployeeConfig | null> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateData.name = updates.name
    if (updates.personality) updateData.personality = updates.personality
    if (updates.schedule) updateData.schedule = updates.schedule
    if (updates.jobConfig) updateData.job_config = updates.jobConfig
    if (typeof updates.isActive === 'boolean') updateData.is_active = updates.isActive

    const { data, error } = await supabase
      .from('phone_employees')
      .update(updateData)
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) {
      console.error('[EmployeeProvisioning] Failed to update employee:', error)
      return null
    }

    // If job config or name changed, update VAPI assistant
    if ((updates.jobConfig || updates.name) && data.vapi_assistant_id) {
      await this.updateVAPIAssistant(data)
    }

    return this.mapToEmployeeConfig(data)
  }

  /**
   * Deactivate an employee
   */
  async deactivateEmployee(employeeId: string, businessId: string): Promise<boolean> {
    const { error } = await supabase
      .from('phone_employees')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)
      .eq('business_id', businessId)

    if (error) {
      console.error('[EmployeeProvisioning] Failed to deactivate employee:', error)
      return false
    }

    return true
  }

  /**
   * Delete an employee (and clean up VAPI resources)
   */
  async deleteEmployee(employeeId: string, businessId: string): Promise<boolean> {
    // Get employee first to clean up VAPI
    const employee = await this.getEmployee(employeeId, businessId)
    if (!employee) return false

    // Delete VAPI assistant
    if (employee.vapiAssistantId && VAPI_API_KEY) {
      try {
        await fetch(`https://api.vapi.ai/assistant/${employee.vapiAssistantId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
        })
      } catch (err) {
        console.warn('[EmployeeProvisioning] Failed to delete VAPI assistant:', err)
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('phone_employees')
      .delete()
      .eq('id', employeeId)
      .eq('business_id', businessId)

    if (error) {
      console.error('[EmployeeProvisioning] Failed to delete employee:', error)
      return false
    }

    return true
  }

  private async updateVAPIAssistant(employee: any): Promise<void> {
    if (!VAPI_API_KEY || !employee.vapi_assistant_id) return

    // Get business name
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', employee.business_id)
      .single()

    const systemPrompt = this.generateSystemPrompt(employee, business?.name || 'Business')

    await fetch(`https://api.vapi.ai/assistant/${employee.vapi_assistant_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${employee.name} - ${employee.job_type}`,
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
        },
        firstMessage: employee.job_config?.greeting,
      }),
    })
  }

  // ============================================
  // HELPERS
  // ============================================

  private mapToEmployeeConfig(data: any): EmployeeConfig {
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      jobType: data.job_type,
      complexity: data.complexity,
      voice: data.voice,
      personality: data.personality,
      schedule: data.schedule,
      capabilities: data.capabilities,
      jobConfig: data.job_config,
      vapiAssistantId: data.vapi_assistant_id,
      vapiPhoneId: data.vapi_phone_id,
      phoneNumber: data.phone_number,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const employeeProvisioning = EmployeeProvisioningService.getInstance()
