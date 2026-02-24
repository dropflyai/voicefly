/**
 * Employee Provisioning Service
 *
 * Handles creating, configuring, and managing phone employees.
 * Integrates with VAPI for voice AI capabilities.
 */

import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import {
  EmployeeConfig,
  EmployeeJobType,
  ReceptionistConfig,
  PersonalAssistantConfig,
  OrderTakerConfig,
  AppointmentSchedulerConfig,
  CustomerServiceConfig,
  DEFAULT_CAPABILITIES_BY_JOB,
} from './types'

// Phone provisioning mode:
// 'vapi-only'   - VAPI manages the number via their Twilio sub-account. Calls only. Simpler setup.
// 'twilio-vapi' - Platform purchases number in our Twilio account. VAPI imports it for calls.
//                 Enables SMS via Twilio webhooks on the same number.
export type PhoneMode = 'vapi-only' | 'twilio-vapi'

// VAPI function injected when an employee has a data_source configured
const LOOKUP_CALLER_FUNCTION = {
  name: 'lookupCaller',
  description: "Look up the caller's account information. Call this immediately at the start of every call using the caller's phone number.",
  parameters: {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', description: "The caller's phone number in E.164 format (e.g. +15551234567)" },
    },
    required: ['phoneNumber'],
  },
}

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
import {
  createAppointmentSchedulerEmployee,
  generateAppointmentSchedulerPrompt,
  APPOINTMENT_SCHEDULER_FUNCTIONS,
} from './templates/appointment-scheduler'
import {
  createCustomerServiceEmployee,
  generateCustomerServicePrompt,
  CUSTOMER_SERVICE_FUNCTIONS,
} from './templates/customer-service'
import {
  createAfterHoursEmergencyEmployee,
  generateAfterHoursEmergencyPrompt,
  AFTER_HOURS_EMERGENCY_FUNCTIONS,
} from './templates/after-hours-emergency'
import { AfterHoursEmergencyConfig, RestaurantHostConfig, SurveyCallerConfig, AppointmentReminderConfig, CollectionsConfig } from './types'
import {
  createRestaurantHostEmployee,
  generateRestaurantHostPrompt,
  RESTAURANT_HOST_FUNCTIONS,
} from './templates/restaurant-host'
import {
  createSurveyCallerEmployee,
  generateSurveyCallerPrompt,
  SURVEY_CALLER_FUNCTIONS,
} from './templates/survey-caller'
import {
  createLeadQualifierEmployee,
  generateLeadQualifierPrompt,
  LEAD_QUALIFIER_FUNCTIONS,
} from './templates/lead-qualifier'
import { LeadQualifierConfig } from './types'
import {
  createAppointmentReminderEmployee,
  generateAppointmentReminderPrompt,
  APPOINTMENT_REMINDER_FUNCTIONS,
} from './templates/appointment-reminder'
import {
  createCollectionsEmployee,
  generateCollectionsPrompt,
  COLLECTIONS_FUNCTIONS,
} from './templates/collections'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const VAPI_API_KEY = process.env.VAPI_API_KEY

// Twilio master credentials — used only to create/manage subaccounts
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_API_KEY = process.env.TWILIO_API_KEY
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET
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
    config: ReceptionistConfig | PersonalAssistantConfig | OrderTakerConfig | AppointmentSchedulerConfig | CustomerServiceConfig | AfterHoursEmergencyConfig | RestaurantHostConfig | SurveyCallerConfig | LeadQualifierConfig | AppointmentReminderConfig | CollectionsConfig
    voice?: EmployeeConfig['voice']
    personality?: EmployeeConfig['personality']
    schedule?: EmployeeConfig['schedule']
    provisionPhone?: boolean
    phoneMode?: PhoneMode
    areaCode?: string | number  // e.g. '415' or 415 — only applies to twilio-vapi mode
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
          ownerRole: (params.config as PersonalAssistantConfig).ownerRole,
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

      case 'appointment-scheduler':
        employeeData = createAppointmentSchedulerEmployee({
          businessId: params.businessId,
          businessName: business.name,
          name: params.name,
          customConfig: params.config as Partial<AppointmentSchedulerConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'customer-service':
        employeeData = createCustomerServiceEmployee({
          businessId: params.businessId,
          businessName: business.name,
          name: params.name,
          customConfig: params.config as Partial<CustomerServiceConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'after-hours-emergency':
        employeeData = createAfterHoursEmergencyEmployee({
          businessId: params.businessId,
          businessName: business.name,
          name: params.name,
          customConfig: params.config as Partial<AfterHoursEmergencyConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'restaurant-host':
        employeeData = createRestaurantHostEmployee({
          businessId: params.businessId,
          restaurantName: (params.config as RestaurantHostConfig)?.restaurantName || business.name,
          name: params.name,
          customConfig: params.config as Partial<RestaurantHostConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'survey-caller':
        employeeData = createSurveyCallerEmployee({
          businessId: params.businessId,
          name: params.name,
          customConfig: params.config as Partial<SurveyCallerConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'lead-qualifier':
        employeeData = createLeadQualifierEmployee({
          businessId: params.businessId,
          businessName: business.name,
          businessDescription: (params.config as LeadQualifierConfig)?.businessDescription || business.name,
          name: params.name,
          customConfig: params.config as Partial<LeadQualifierConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'appointment-reminder':
        employeeData = createAppointmentReminderEmployee({
          businessId: params.businessId,
          name: params.name,
          customConfig: params.config as Partial<AppointmentReminderConfig>,
          voice: params.voice,
          personality: params.personality,
        })
        break

      case 'collections':
        employeeData = createCollectionsEmployee({
          businessId: params.businessId,
          name: params.name,
          customConfig: params.config as Partial<CollectionsConfig>,
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
    let twilioPhoneSid: string | undefined
    const phoneMode: PhoneMode = params.phoneMode || 'twilio-vapi'

    if (params.provisionPhone) {
      try {
        if (phoneMode === 'twilio-vapi') {
          // Twilio purchases + owns the number; VAPI imports it for calls; SMS stays with Twilio
          const phoneResult = await this.provisionTwilioVAPINumber(
            savedEmployee.id,
            vapiResult.assistantId,
            params.businessId,
            business.name,
            params.areaCode,
          )
          phoneNumber = phoneResult.phoneNumber
          vapiPhoneId = phoneResult.vapiPhoneId
          twilioPhoneSid = phoneResult.twilioPhoneSid
        } else {
          // VAPI-only: VAPI purchases number via their Twilio sub-account (calls only)
          const phoneResult = await this.provisionVAPIOnlyNumber(savedEmployee.id, params.businessId)
          phoneNumber = phoneResult.phoneNumber
          vapiPhoneId = phoneResult.phoneId
        }

        // Update with phone info
        await supabase
          .from('phone_employees')
          .update({
            vapi_phone_id: vapiPhoneId,
            phone_number: phoneNumber,
            phone_provider: phoneMode,
            twilio_phone_sid: twilioPhoneSid || null,
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

    // Inject lookupCaller if a data source is configured
    if (employee.data_source) {
      functions.push(LOOKUP_CALLER_FUNCTION)
      systemPrompt += `\n\n## Live Caller Lookup\nAt the very start of every call, use the lookupCaller function with the caller's phone number to retrieve their account information. Use this data to personalize the conversation from the first word.`
    }

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

      case 'appointment-scheduler':
        return generateAppointmentSchedulerPrompt(config, employee.job_config as AppointmentSchedulerConfig)

      case 'customer-service':
        return generateCustomerServicePrompt(config, employee.job_config as CustomerServiceConfig)

      case 'after-hours-emergency':
        return generateAfterHoursEmergencyPrompt(config, employee.job_config as AfterHoursEmergencyConfig)

      case 'restaurant-host':
        return generateRestaurantHostPrompt(config, employee.job_config as RestaurantHostConfig)

      case 'survey-caller':
        return generateSurveyCallerPrompt(config, employee.job_config as SurveyCallerConfig)

      case 'lead-qualifier':
        return generateLeadQualifierPrompt(config, employee.job_config as LeadQualifierConfig)

      case 'appointment-reminder':
        return generateAppointmentReminderPrompt(config, employee.job_config as AppointmentReminderConfig)

      case 'collections':
        return generateCollectionsPrompt(config, employee.job_config as CollectionsConfig)

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
      case 'appointment-scheduler':
        allFunctions = APPOINTMENT_SCHEDULER_FUNCTIONS
        break
      case 'customer-service':
        allFunctions = CUSTOMER_SERVICE_FUNCTIONS
        break
      case 'after-hours-emergency':
        allFunctions = AFTER_HOURS_EMERGENCY_FUNCTIONS
        break
      case 'restaurant-host':
        allFunctions = RESTAURANT_HOST_FUNCTIONS
        break
      case 'survey-caller':
        allFunctions = SURVEY_CALLER_FUNCTIONS
        break
      case 'lead-qualifier':
        allFunctions = LEAD_QUALIFIER_FUNCTIONS
        break
      case 'appointment-reminder':
        allFunctions = APPOINTMENT_REMINDER_FUNCTIONS
        break
      case 'collections':
        allFunctions = COLLECTIONS_FUNCTIONS
        break
      default:
        allFunctions = []
    }

    // Filter functions based on employee capabilities if provided
    if (capabilities?.length) {
      const capabilityToFunctions: Record<string, string[]> = {
        book_appointments: ['scheduleAppointment', 'checkAvailability', 'rescheduleAppointment', 'cancelAppointment', 'getCalendarInfo'],
        reschedule_appointments: ['rescheduleAppointment'],
        cancel_appointments: ['cancelAppointment'],
        capture_lead_info: ['captureLeadInfo'],
        take_messages: ['takeMessage'],
        transfer_to_human: ['transferCall'],
        provide_business_info: ['getBusinessInfo'],
        take_orders: ['addToOrder', 'modifyOrderItem', 'removeFromOrder', 'getOrderSummary', 'setOrderType', 'setCustomerInfo', 'confirmOrder', 'getEstimatedTime', 'checkItemAvailability'],
        process_payments: ['processPayment'],
        send_reminders: ['sendReminder'],
        handle_complaints: ['logComplaint'],
        escalate_to_manager: ['escalateToManager'],
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

  /**
   * VAPI-only: VAPI purchases a number via their Twilio sub-account.
   * Calls are handled by VAPI. No SMS capability.
   */
  private async provisionVAPIOnlyNumber(
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

    // Let VAPI purchase and manage the number
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
      throw new Error(`VAPI phone provisioning failed: ${errorData.message || purchaseResponse.statusText}`)
    }

    const phoneData = await purchaseResponse.json()
    console.log(`[EmployeeProvisioning] VAPI-only number provisioned: ${phoneData.number}`)

    // Record in phone_numbers so SMS resolveFromPhone() can find it
    await supabase.from('phone_numbers').upsert({
      business_id: businessId,
      vapi_phone_id: phoneData.id,
      phone_number: phoneData.number,
      vapi_phone_number_id: phoneData.id,
      is_active: true,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vapi_phone_id' })

    return {
      phoneNumber: phoneData.number,
      phoneId: phoneData.id,
    }
  }

  /**
   * Twilio-VAPI: Each business gets their own Twilio subaccount.
   * - Numbers are isolated per business (easy to monitor/suspend in Twilio console)
   * - VAPI gets the subaccount's auth token — master token is never exposed
   * - SMS webhook stays on Twilio; calls route through VAPI
   */
  private async provisionTwilioVAPINumber(
    employeeId: string,
    vapiAssistantId: string,
    businessId: string,
    businessName: string,
    areaCode?: string | number,
  ): Promise<{ phoneNumber: string; vapiPhoneId: string; twilioPhoneSid: string }> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
      throw new Error('Twilio credentials not configured — set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET')
    }
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not configured')
    }

    // Master client — uses API key (not auth token) for our own operations
    const masterClient = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, { accountSid: TWILIO_ACCOUNT_SID })

    // 1. Get or create a Twilio subaccount for this business
    const subaccount = await this.getOrCreateTwilioSubaccount(masterClient, businessId, businessName)
    const subClient = twilio(subaccount.sid, subaccount.authToken)

    // 2. Search for an available US local number (optionally filter by area code)
    const searchParams: { limit: number; areaCode?: number } = { limit: 1 }
    if (areaCode) searchParams.areaCode = Number(areaCode)

    const available = await subClient
      .availablePhoneNumbers('US')
      .local.list(searchParams)

    if (!available.length) {
      const hint = areaCode ? ` in area code ${areaCode}` : ''
      throw new Error(`No available Twilio phone numbers found${hint}`)
    }

    const numberToPurchase = available[0].phoneNumber

    // 3. Purchase the number under the subaccount with SMS webhook set
    const purchased = await subClient.incomingPhoneNumbers.create({
      phoneNumber: numberToPurchase,
      smsUrl: `${APP_URL}/api/webhooks/sms`,
      smsMethod: 'POST',
      friendlyName: `VoiceFly Employee - ${employeeId}`,
    })

    console.log(`[EmployeeProvisioning] Twilio number purchased: ${purchased.phoneNumber} (subaccount: ${subaccount.sid})`)

    // 4. Import the number into VAPI using subaccount credentials (not master token)
    const vapiResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'twilio',
        twilioAccountSid: subaccount.sid,
        twilioAuthToken: subaccount.authToken,
        twilioPhoneNumber: purchased.phoneNumber,
        assistantId: vapiAssistantId,
        name: `Phone Employee - ${employeeId}`,
      }),
    })

    if (!vapiResponse.ok) {
      // VAPI import failed — release the number so we don't leak it
      await subClient.incomingPhoneNumbers(purchased.sid).remove().catch(() => {})
      const errorData = await vapiResponse.json()
      throw new Error(`VAPI import failed: ${errorData.message || vapiResponse.statusText}`)
    }

    const vapiPhoneData = await vapiResponse.json()
    console.log(`[EmployeeProvisioning] Twilio-VAPI number ready: ${purchased.phoneNumber}`)

    // Record in phone_numbers so SMS resolveFromPhone() can find it
    await supabase.from('phone_numbers').upsert({
      business_id: businessId,
      vapi_phone_id: vapiPhoneData.id,
      phone_number: purchased.phoneNumber,
      vapi_phone_number_id: vapiPhoneData.id,
      is_active: true,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vapi_phone_id' })

    return {
      phoneNumber: purchased.phoneNumber,
      vapiPhoneId: vapiPhoneData.id,
      twilioPhoneSid: purchased.sid,
    }
  }

  /**
   * Get or create a Twilio subaccount for a business.
   * Subaccount SID + auth token are cached in the businesses table.
   */
  private async getOrCreateTwilioSubaccount(
    masterClient: ReturnType<typeof twilio>,
    businessId: string,
    businessName: string,
  ): Promise<{ sid: string; authToken: string }> {
    // Check if business already has a subaccount
    const { data: biz } = await supabase
      .from('businesses')
      .select('twilio_subaccount_sid, twilio_subaccount_token')
      .eq('id', businessId)
      .single()

    if (biz?.twilio_subaccount_sid && biz?.twilio_subaccount_token) {
      return { sid: biz.twilio_subaccount_sid, authToken: biz.twilio_subaccount_token }
    }

    // Create a new subaccount — visible in Twilio console under master account
    const subaccount = await masterClient.api.accounts.create({
      friendlyName: `VoiceFly - ${businessName}`,
    })

    // Store it on the business row
    await supabase
      .from('businesses')
      .update({
        twilio_subaccount_sid: subaccount.sid,
        twilio_subaccount_token: subaccount.authToken,
      })
      .eq('id', businessId)

    console.log(`[EmployeeProvisioning] Twilio subaccount created for "${businessName}": ${subaccount.sid}`)

    return { sid: subaccount.sid, authToken: subaccount.authToken }
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
      voice: EmployeeConfig['voice']
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
    if (updates.voice) updateData.voice = updates.voice

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

    // If job config, name, or voice changed, update VAPI assistant
    if ((updates.jobConfig || updates.name || updates.voice) && data.vapi_assistant_id) {
      await this.updateVAPIAssistant(data, updates.voice)
    }

    return this.mapToEmployeeConfig(data)
  }

  /**
   * Provision a phone number for an existing employee (post-creation).
   * Called from /api/phone-employees/[id]/provision-phone
   */
  async provisionPhoneForEmployee(
    employeeId: string,
    businessId: string,
    phoneMode: PhoneMode,
    areaCode?: string | number
  ): Promise<{ phoneNumber: string; phoneProvider: string }> {
    // Fetch employee — verify ownership and get VAPI assistant ID
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('id, name, vapi_assistant_id, phone_number, business_id')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (!employee) throw new Error('Employee not found')
    if (!employee.vapi_assistant_id) throw new Error('Employee has no VAPI assistant — cannot provision phone')
    if (employee.phone_number) throw new Error('Employee already has a phone number')

    // Fetch business name for Twilio subaccount label
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    const businessName = business?.name ?? 'Business'

    let phoneNumber: string
    let vapiPhoneId: string | undefined
    let twilioPhoneSid: string | undefined
    let phoneProvider: string

    if (phoneMode === 'twilio-vapi') {
      const result = await this.provisionTwilioVAPINumber(
        employeeId,
        employee.vapi_assistant_id,
        businessId,
        businessName,
        areaCode
      )
      phoneNumber = result.phoneNumber
      vapiPhoneId = result.vapiPhoneId
      twilioPhoneSid = result.twilioPhoneSid
      phoneProvider = 'twilio-vapi'
    } else {
      const result = await this.provisionVAPIOnlyNumber(employeeId, businessId)
      phoneNumber = result.phoneNumber
      vapiPhoneId = result.phoneId
      phoneProvider = 'vapi-only'
    }

    // Persist phone info
    await supabase
      .from('phone_employees')
      .update({
        phone_number: phoneNumber,
        vapi_phone_id: vapiPhoneId ?? null,
        phone_provider: phoneProvider,
        twilio_phone_sid: twilioPhoneSid ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)
      .eq('business_id', businessId)

    console.log(`[EmployeeProvisioning] Phone provisioned for employee ${employeeId}: ${phoneNumber} (${phoneProvider})`)
    return { phoneNumber, phoneProvider }
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

    // Release phone resources
    if (VAPI_API_KEY) {
      // Delete VAPI phone number if present
      if (employee.vapiPhoneId) {
        try {
          await fetch(`https://api.vapi.ai/phone-number/${employee.vapiPhoneId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
          })
        } catch (err) {
          console.warn('[EmployeeProvisioning] Failed to delete VAPI phone number:', err)
        }
      }

      // For twilio-vapi mode, release the number from the business's subaccount
      if ((employee as any).twilioPhoneSid) {
        try {
          const { data: biz } = await supabase
            .from('businesses')
            .select('twilio_subaccount_sid, twilio_subaccount_token')
            .eq('id', employee.businessId)
            .single()

          if (biz?.twilio_subaccount_sid && biz?.twilio_subaccount_token) {
            const subClient = twilio(biz.twilio_subaccount_sid, biz.twilio_subaccount_token)
            await subClient.incomingPhoneNumbers((employee as any).twilioPhoneSid).remove()
            console.log(`[EmployeeProvisioning] Twilio number released: ${(employee as any).twilioPhoneSid}`)
          }
        } catch (err) {
          console.warn('[EmployeeProvisioning] Failed to release Twilio number:', err)
        }
      }
    }

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

  /**
   * Re-provision the VAPI assistant for an employee.
   * Fetches the latest employee record (including data_source) then patches VAPI.
   * Called after data_source changes to inject/remove lookupCaller.
   */
  async updateEmployeeAssistant(employeeId: string, businessId: string): Promise<void> {
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('*')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (!employee?.vapi_assistant_id) return
    await this.updateVAPIAssistant(employee)
  }

  private async updateVAPIAssistant(employee: any, voiceOverride?: EmployeeConfig['voice']): Promise<void> {
    if (!VAPI_API_KEY || !employee.vapi_assistant_id) return

    // Get business name
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', employee.business_id)
      .single()

    let systemPrompt = this.generateSystemPrompt(employee, business?.name || 'Business')
    const voice = voiceOverride ?? employee.voice

    const functions = this.getFunctionsForJobType(employee.job_type, employee.capabilities)

    // Inject lookupCaller if a data source is configured
    if (employee.data_source) {
      functions.push(LOOKUP_CALLER_FUNCTION)
      systemPrompt += `\n\n## Live Caller Lookup\nAt the very start of every call, use the lookupCaller function with the caller's phone number to retrieve their account information. Use this data to personalize the conversation from the first word.`
    }

    const patchBody: any = {
      name: `${employee.name} - ${employee.job_type}`,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        functions,
      },
      firstMessage: employee.job_config?.greeting,
    }

    if (voice?.voiceId) {
      patchBody.voice = {
        provider: '11labs',
        voiceId: voice.voiceId,
        speed: voice.speed ?? 1.0,
        stability: voice.stability ?? 0.8,
      }
    }

    await fetch(`https://api.vapi.ai/assistant/${employee.vapi_assistant_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
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
      phoneProvider: data.phone_provider || 'vapi',
      twilioPhoneSid: data.twilio_phone_sid,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const employeeProvisioning = EmployeeProvisioningService.getInstance()
