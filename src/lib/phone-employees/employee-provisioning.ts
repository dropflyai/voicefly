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
const VAPI_SHARED_ASSISTANT_ID = process.env.VAPI_SHARED_ASSISTANT_ID

// Tiers that use the shared VAPI assistant (no dedicated assistant created)
const SHARED_ASSISTANT_TIERS = ['trial', 'starter']

// Twilio master credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
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

    // Determine if this tier uses the shared assistant or gets a dedicated one
    const tier = business.subscription_tier || 'trial'
    const useSharedAssistant = SHARED_ASSISTANT_TIERS.includes(tier)

    let vapiAssistantId: string | null = null
    let updatedEmployee: any

    if (useSharedAssistant) {
      // Trial/Starter: No dedicated VAPI assistant. The webhook dynamically
      // builds the config via handleAssistantRequest + buildAssistantConfig.
      vapiAssistantId = VAPI_SHARED_ASSISTANT_ID || null
      console.log(`[EmployeeProvisioning] ${tier} tier — using shared assistant (no dedicated VAPI assistant created)`)

      const { data, error: updateError } = await supabase
        .from('phone_employees')
        .update({
          vapi_assistant_id: vapiAssistantId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedEmployee.id)
        .select()
        .single()

      if (updateError) {
        console.error('[EmployeeProvisioning] Failed to activate employee:', updateError)
        throw updateError
      }
      updatedEmployee = data
    } else {
      // Pro/Business/Enterprise: Create a dedicated VAPI assistant with personalized config
      const vapiResult = await this.provisionVAPIAgent(savedEmployee, business.name)
      vapiAssistantId = vapiResult.assistantId

      const { data, error: updateError } = await supabase
        .from('phone_employees')
        .update({
          vapi_assistant_id: vapiAssistantId,
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
      updatedEmployee = data
    }

    // Optionally provision phone number
    let phoneNumber: string | undefined
    let vapiPhoneId: string | undefined
    let twilioPhoneSid: string | undefined
    let phoneError: string | undefined
    const phoneMode: PhoneMode = params.phoneMode || 'twilio-vapi'

    if (params.provisionPhone) {
      // Mark provisioning as started
      await supabase
        .from('phone_employees')
        .update({
          provisioning_status: 'provisioning',
          provisioning_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedEmployee.id)

      try {
        if (phoneMode === 'twilio-vapi') {
          // Twilio purchases + owns the number; VAPI imports it for calls; SMS stays with Twilio
          // For shared tiers, bind to the shared assistant; for pro, bind to the dedicated one
          const assistantForPhone = useSharedAssistant
            ? (VAPI_SHARED_ASSISTANT_ID || vapiAssistantId!)
            : vapiAssistantId!
          const phoneResult = await this.provisionTwilioVAPINumber(
            savedEmployee.id,
            assistantForPhone,
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

        // Update with phone info + mark as active
        await supabase
          .from('phone_employees')
          .update({
            vapi_phone_id: vapiPhoneId,
            phone_number: phoneNumber,
            phone_provider: phoneMode,
            twilio_phone_sid: twilioPhoneSid || null,
            provisioning_status: 'active',
            provisioning_error: null,
            provisioning_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedEmployee.id)
      } catch (err: any) {
        phoneError = err.message || 'Phone provisioning failed'
        console.warn('[EmployeeProvisioning] Phone provisioning failed:', err)
        // Record the failure — employee still exists but phone setup needs retry
        await supabase
          .from('phone_employees')
          .update({
            provisioning_status: 'failed',
            provisioning_error: phoneError,
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedEmployee.id)
      }
    } else {
      // User chose not to provision a phone
      await supabase
        .from('phone_employees')
        .update({
          provisioning_status: 'no_phone',
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedEmployee.id)
    }

    console.log(`[EmployeeProvisioning] Employee created: ${savedEmployee.id}`, {
      vapiAssistantId,
      useSharedAssistant,
      phoneNumber,
      phoneError,
    })

    const employeeConfig = this.mapToEmployeeConfig({
      ...updatedEmployee,
      vapi_assistant_id: vapiAssistantId,
      vapi_phone_id: vapiPhoneId,
      phone_number: phoneNumber,
    })

    // Attach phoneError so API callers can surface it
    return Object.assign(employeeConfig, { phoneError })
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

    // Build native VAPI transferCall tool if destinations are configured
    const transferDests: any[] = employee.job_config?.transferDestinations || []
    const nativeTools: any[] = []
    if (transferDests.length > 0) {
      const vapiDestinations = transferDests
        .filter((d: any) => d.phoneNumber)
        .map((d: any) => ({
          type: 'number',
          number: d.phoneNumber,
          message: `Please hold while I connect you to ${d.label || 'the team'}.`,
          description: d.label || 'Transfer destination',
        }))
      if (vapiDestinations.length > 0) {
        nativeTools.push({ type: 'transferCall', destinations: vapiDestinations })
      }
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
        ...(nativeTools.length > 0 ? { tools: nativeTools } : {}),
        voice: {
          provider: '11labs',
          voiceId: employee.voice?.voiceId || 'aVR2rUXJY4MTezzJjPyQ',
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

    let basePrompt: string
    switch (employee.job_type) {
      case 'receptionist':
        basePrompt = generateReceptionistPrompt(config, employee.job_config as ReceptionistConfig, businessName)
        break
      case 'personal-assistant':
        basePrompt = generatePersonalAssistantPrompt(config, employee.job_config as PersonalAssistantConfig)
        break
      case 'order-taker':
        basePrompt = generateOrderTakerPrompt(config, employee.job_config as OrderTakerConfig, businessName)
        break
      case 'appointment-scheduler':
        basePrompt = generateAppointmentSchedulerPrompt(config, employee.job_config as AppointmentSchedulerConfig, businessName)
        break
      case 'customer-service':
        basePrompt = generateCustomerServicePrompt(config, employee.job_config as CustomerServiceConfig, businessName)
        break
      case 'after-hours-emergency':
        basePrompt = generateAfterHoursEmergencyPrompt(config, employee.job_config as AfterHoursEmergencyConfig, businessName)
        break
      case 'restaurant-host':
        basePrompt = generateRestaurantHostPrompt(config, employee.job_config as RestaurantHostConfig)
        break
      case 'survey-caller':
        basePrompt = generateSurveyCallerPrompt(config, employee.job_config as SurveyCallerConfig)
        break
      case 'lead-qualifier':
        basePrompt = generateLeadQualifierPrompt(config, employee.job_config as LeadQualifierConfig)
        break
      case 'appointment-reminder':
        basePrompt = generateAppointmentReminderPrompt(config, employee.job_config as AppointmentReminderConfig)
        break
      case 'collections':
        basePrompt = generateCollectionsPrompt(config, employee.job_config as CollectionsConfig)
        break
      default:
        basePrompt = `You are ${employee.name}, an AI assistant for ${businessName}. Be helpful and professional.`
    }

    // Append extra knowledge from website scrape if available
    const extraKnowledge = employee.job_config?.extraKnowledge
    if (extraKnowledge && typeof extraKnowledge === 'string' && extraKnowledge.trim()) {
      basePrompt += `\n\n## Additional Business Knowledge\nUse the following information to answer caller questions accurately:\n\n${extraKnowledge}`
    }

    // Append custom training fields (user-provided via chat or form)
    const customInstructions = employee.job_config?.customInstructions
    if (customInstructions && typeof customInstructions === 'string' && customInstructions.trim()) {
      basePrompt += `\n\n## Custom Business Context\n${customInstructions}`
    }

    const callHandlingRules = employee.job_config?.callHandlingRules
    if (callHandlingRules && typeof callHandlingRules === 'string' && callHandlingRules.trim()) {
      basePrompt += `\n\n## Call Handling Rules\n${callHandlingRules}`
    }

    const restrictions = employee.job_config?.restrictions
    if (restrictions && typeof restrictions === 'string' && restrictions.trim()) {
      basePrompt += `\n\n## Rules & Restrictions\nYou MUST follow these rules:\n${restrictions}`
    }

    // Inject universal business context from the businesses table
    const biz = employee.businesses
    if (biz) {
      const contextLines: string[] = []
      if (biz.phone) contextLines.push(`- Phone: ${biz.phone}`)
      if (biz.email) contextLines.push(`- Email: ${biz.email}`)
      if (biz.address) contextLines.push(`- Address: ${biz.address}`)
      if (biz.website) contextLines.push(`- Website: ${biz.website}`)

      const ctx = biz.business_context
      if (ctx) {
        if (ctx.owner_name) contextLines.push(`- Owner/Manager: ${ctx.owner_name}`)
        if (ctx.address_display) contextLines.push(`- Location: ${ctx.address_display}`)
        if (ctx.hours_summary) contextLines.push(`- Hours: ${ctx.hours_summary}`)
        if (ctx.payment_methods) contextLines.push(`- Payment methods: ${ctx.payment_methods}`)
        if (ctx.parking_info) contextLines.push(`- Parking: ${ctx.parking_info}`)
        if (ctx.languages) contextLines.push(`- Languages spoken: ${ctx.languages}`)
        if (ctx.policies) contextLines.push(`- Policies: ${ctx.policies}`)
        if (ctx.special_notes) contextLines.push(`- Note: ${ctx.special_notes}`)
      }

      if (contextLines.length > 0) {
        basePrompt += `\n\n## Business Contact & Details\nUse this information when callers ask about the business:\n${contextLines.join('\n')}`
      }
    }

    // Universal safety & edge case rules (appended to ALL employee types)
    basePrompt += `\n\n## Universal Call Handling Rules

### Silence Handling
- If the caller goes silent for more than 5 seconds, gently prompt them: "Are you still there?" or "I'm still here if you have any questions."
- If they remain silent after your prompt, say: "It seems like we may have lost the connection. Feel free to call back anytime. Goodbye!" and end the call.

### One Thing at a Time
- If the caller asks multiple questions at once, address them one at a time in order. Say: "Great questions! Let me go through those one by one." Then answer each before moving to the next.

### Language
- Always respond in the same language the caller is speaking. If they switch languages mid-call, switch with them naturally.
- If you cannot understand the caller's language, politely say: "I'm sorry, I'm having trouble understanding. Could you please repeat that?" If the issue persists, offer to take a message or suggest they call back.

### Transfer & "Real Person" Requests
- If the caller asks to speak to a real person, a manager, or a human, acknowledge their request politely: "I understand you'd like to speak with someone directly." Then take a message with their name, number, and reason so the team can call them back. Do NOT argue or try to convince them to stay on the line.

### Wrong Number
- If the caller says they have the wrong number or asks for a business/person you don't represent, politely let them know: "It sounds like you may have reached the wrong number. This is [business name]. Is there anything I can help you with here?" If not, wish them well and end the call.

### Sensitive Information Protection
- NEVER ask for or accept credit card numbers, Social Security numbers, passwords, or other sensitive financial/personal data over the phone.
- If a caller tries to give you sensitive information, immediately stop them: "For your security, I'm not able to take that information over the phone. Please provide that through our secure online system or in person."

### Abusive or Inappropriate Callers
- If a caller becomes verbally abusive, remain calm and professional. Say: "I want to help you, but I need our conversation to remain respectful." If they continue, say: "I'm going to end this call now. Please feel free to call back when you're ready. Goodbye." and end the call.

### Information Accuracy
- NEVER make up information. If you don't know the answer to something, say so honestly and offer to take a message or have someone follow up.
- Always confirm important details (names, phone numbers, times, orders) by repeating them back to the caller before finalizing.`

    return basePrompt
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
   * Build a full VAPI assistant config for a given employee.
   * Used by the webhook's assistant-request handler to dynamically
   * configure the shared trial assistant per-call.
   */
  async buildAssistantConfig(employee: any, businessName: string): Promise<{
    model: any
    voice: any
    firstMessage: string
    endCallMessage?: string
    endCallPhrases?: string[]
    voicemailDetection?: any
    maxDurationSeconds?: number
    backgroundSound?: string
    tools?: any[]
  }> {
    let systemPrompt = this.generateSystemPrompt(employee, businessName)
    const functions = this.getFunctionsForJobType(employee.job_type, employee.capabilities)

    // Check if business has Google Calendar connected (same as dedicated path)
    const calendarConfig = await GoogleCalendarService.getBusinessCalendarConfig(employee.business_id)
    if (calendarConfig.calendarId && calendarConfig.provider === 'google') {
      systemPrompt += `\n\n## Calendar Integration\nThis business has a live Google Calendar connected. When checking availability or booking appointments, you have access to real-time calendar data. You can confidently tell callers about available time slots and book appointments that will automatically appear on the business calendar.`
    }

    // Inject lookupCaller if a data source is configured (same as dedicated path)
    if (employee.data_source) {
      functions.push(LOOKUP_CALLER_FUNCTION)
      systemPrompt += `\n\n## Live Caller Lookup\nAt the very start of every call, use the lookupCaller function with the caller's phone number to retrieve their account information. Use this data to personalize the conversation from the first word.`
    }

    // Build VAPI native transferCall tool from job_config.transferDestinations
    // This replaces the custom server function — VAPI executes transfers natively
    const tools: any[] = []
    const transferDests: any[] = employee.job_config?.transferDestinations || []
    if (transferDests.length > 0) {
      const vapiDestinations = transferDests
        .filter((d: any) => d.phoneNumber)
        .map((d: any) => ({
          type: 'number',
          number: d.phoneNumber,
          message: `Please hold while I connect you to ${d.label || 'the team'}.`,
          description: d.label || 'Transfer destination',
        }))

      if (vapiDestinations.length > 0) {
        tools.push({ type: 'transferCall', destinations: vapiDestinations })
      }
    }

    // Use the employee's configured voice, falling back to defaults
    const employeeVoice = employee.voice || {}

    return {
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }],
        functions,
      },
      voice: {
        provider: '11labs',
        voiceId: employeeVoice.voiceId || 'aVR2rUXJY4MTezzJjPyQ',
        model: 'eleven_flash_v2_5',
        stability: employeeVoice.stability ?? 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
        speed: employeeVoice.speed ?? 1.0,
      },
      firstMessage: employee.job_config?.greeting
        || `Thank you for calling ${businessName}! How can I help you today?`,
      endCallMessage: 'Thank you for calling! Have a great day.',
      endCallPhrases: ['goodbye', 'bye', 'have a good day', 'that will be all', 'nothing else', 'no thank you'],
      voicemailDetection: {
        provider: 'twilio',
        enabled: true,
      },
      // Order takers need longer silence tolerance — callers frequently pause or say "hold on"
      silenceTimeoutSeconds: employee.job_type === 'order-taker' ? 60 : 30,
      maxDurationSeconds: 1800,
      backgroundSound: 'off',
      ...(tools.length > 0 ? { tools } : {}),
    }
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
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN')
    }
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not configured')
    }

    // Master client — uses account SID + auth token
    const masterClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    // 1. Search for an available US local number on the master account
    const searchParams: { limit: number; areaCode?: number } = { limit: 1 }
    if (areaCode) searchParams.areaCode = Number(areaCode)

    const available = await masterClient
      .availablePhoneNumbers('US')
      .local.list(searchParams)

    if (!available.length) {
      const hint = areaCode ? ` in area code ${areaCode}` : ''
      throw new Error(`No available Twilio phone numbers found${hint}`)
    }

    const numberToPurchase = available[0].phoneNumber

    // 2. Purchase the number with SMS webhook set
    const purchased = await masterClient.incomingPhoneNumbers.create({
      phoneNumber: numberToPurchase,
      smsUrl: `${APP_URL}/api/webhooks/sms`,
      smsMethod: 'POST',
      friendlyName: `VoiceFly Employee - ${employeeId}`,
    })

    console.log(`[EmployeeProvisioning] Twilio number purchased: ${purchased.phoneNumber} (master account)`)

    // 4. Import the number into VAPI using subaccount credentials (not master token)
    // For shared-assistant employees (trial/starter), use serverUrl mode so our webhook
    // receives assistant-request events and can dynamically build per-employee config.
    // For dedicated-assistant employees (pro), bind directly to their VAPI assistant.
    const isSharedAssistant = vapiAssistantId === VAPI_SHARED_ASSISTANT_ID
    const vapiImportBody: Record<string, any> = {
      provider: 'twilio',
      twilioAccountSid: TWILIO_ACCOUNT_SID,
      twilioAuthToken: TWILIO_AUTH_TOKEN,
      number: purchased.phoneNumber,
      name: `VF-${employeeId.slice(0, 34)}`,
    }

    if (isSharedAssistant) {
      // Webhook mode: VAPI sends assistant-request → our webhook builds config dynamically
      vapiImportBody.serverUrl = `${APP_URL}/api/webhooks/phone-employee`
      vapiImportBody.serverUrlSecret = employeeId
    } else {
      // Direct mode: VAPI uses the dedicated assistant
      vapiImportBody.assistantId = vapiAssistantId
    }

    const vapiResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiImportBody),
    })

    if (!vapiResponse.ok) {
      // VAPI import failed — release the number so we don't leak it
      await masterClient.incomingPhoneNumbers(purchased.sid).remove().catch(() => {})
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

    // If job config, name, or voice changed, update the dedicated VAPI assistant (pro tier only).
    // Shared assistant employees (trial/starter) don't have a dedicated assistant to update —
    // their config is built dynamically by the webhook on each call.
    const isSharedEmployee = !data.vapi_assistant_id
      || data.vapi_assistant_id === VAPI_SHARED_ASSISTANT_ID
    if ((updates.jobConfig || updates.name || updates.voice) && data.vapi_assistant_id && !isSharedEmployee) {
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
    if (employee.phone_number) throw new Error('Employee already has a phone number')

    // For shared-assistant employees (trial/starter), use the shared assistant ID for phone binding.
    // For dedicated-assistant employees (pro), use their own assistant ID.
    const assistantIdForPhone = employee.vapi_assistant_id
      && employee.vapi_assistant_id !== VAPI_SHARED_ASSISTANT_ID
      ? employee.vapi_assistant_id
      : VAPI_SHARED_ASSISTANT_ID

    if (!assistantIdForPhone) throw new Error('No VAPI assistant available — set VAPI_SHARED_ASSISTANT_ID or provision a dedicated assistant')

    // Mark provisioning as started
    await supabase
      .from('phone_employees')
      .update({
        provisioning_status: 'provisioning',
        provisioning_error: null,
        provisioning_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)
      .eq('business_id', businessId)

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

    try {
      if (phoneMode === 'twilio-vapi') {
        const result = await this.provisionTwilioVAPINumber(
          employeeId,
          assistantIdForPhone,
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
    } catch (err: any) {
      // Record the failure persistently
      await supabase
        .from('phone_employees')
        .update({
          provisioning_status: 'failed',
          provisioning_error: err.message || 'Phone provisioning failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .eq('business_id', businessId)
      throw err
    }

    // Persist phone info + mark as active
    await supabase
      .from('phone_employees')
      .update({
        phone_number: phoneNumber,
        vapi_phone_id: vapiPhoneId ?? null,
        phone_provider: phoneProvider,
        twilio_phone_sid: twilioPhoneSid ?? null,
        provisioning_status: 'active',
        provisioning_error: null,
        provisioning_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)
      .eq('business_id', businessId)

    console.log(`[EmployeeProvisioning] Phone provisioned for employee ${employeeId}: ${phoneNumber} (${phoneProvider})`)
    return { phoneNumber, phoneProvider }
  }

  /**
   * Upgrade an employee's phone from vapi-only to twilio-vapi.
   * Used when a trial business converts to a paid plan.
   * Keeps the same VAPI assistant — just swaps the phone number.
   */
  async upgradePhoneToTwilioVapi(
    employeeId: string,
    businessId: string,
    areaCode?: string
  ): Promise<{ phoneNumber: string; phoneProvider: string } | null> {
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('id, name, vapi_assistant_id, phone_number, vapi_phone_id, phone_provider, business_id')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (!employee || !employee.vapi_assistant_id) return null
    if (employee.phone_provider === 'twilio-vapi') return null // Already upgraded

    // Release old VAPI-only number
    if (employee.vapi_phone_id && VAPI_API_KEY) {
      await fetch(`https://api.vapi.ai/phone-number/${employee.vapi_phone_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      }).catch(err => console.error('[EmployeeProvisioning] Failed to release VAPI number:', err))
    }

    // Clear existing phone fields so provisionPhoneForEmployee doesn't reject
    await supabase
      .from('phone_employees')
      .update({
        phone_number: null,
        vapi_phone_id: null,
        phone_provider: null,
        twilio_phone_sid: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    // Provision new Twilio-VAPI number
    try {
      const result = await this.provisionPhoneForEmployee(
        employeeId,
        businessId,
        'twilio-vapi',
        areaCode
      )
      console.log(`[EmployeeProvisioning] Upgraded employee ${employeeId} to twilio-vapi: ${result.phoneNumber}`)
      return result
    } catch (err) {
      console.error(`[EmployeeProvisioning] Failed to upgrade employee ${employeeId}:`, err)
      return null
    }
  }

  /**
   * Upgrade all vapi-only employees for a business to twilio-vapi.
   * Called when a business converts from trial to paid.
   */
  async upgradeAllPhonesToTwilioVapi(businessId: string): Promise<number> {
    const { data: employees } = await supabase
      .from('phone_employees')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone_provider', 'vapi-only')
      .eq('is_active', true)

    if (!employees || employees.length === 0) return 0

    let upgraded = 0
    for (const emp of employees) {
      const result = await this.upgradePhoneToTwilioVapi(emp.id, businessId)
      if (result) upgraded++
    }

    console.log(`[EmployeeProvisioning] Upgraded ${upgraded}/${employees.length} employees for business ${businessId}`)
    return upgraded
  }

  /**
   * Provision a dedicated Twilio number for a Starter-tier employee.
   * Uses the shared VAPI assistant — no dedicated assistant created.
   * The number is imported to VAPI with serverUrl + serverUrlSecret for webhook routing.
   */
  private async provisionStarterTwilioNumber(
    employeeId: string,
    businessId: string,
    areaCode?: string | number,
  ): Promise<{ phoneNumber: string; vapiPhoneId: string; twilioPhoneSid: string }> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured')
    }
    if (!VAPI_API_KEY) {
      throw new Error('VAPI API key not configured')
    }

    const masterClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    // 1. Search for an available number
    const searchParams: { limit: number; areaCode?: number } = { limit: 1 }
    if (areaCode) searchParams.areaCode = Number(areaCode)

    const available = await masterClient
      .availablePhoneNumbers('US')
      .local.list(searchParams)

    if (!available.length) {
      const hint = areaCode ? ` in area code ${areaCode}` : ''
      throw new Error(`No available Twilio phone numbers found${hint}`)
    }

    const numberToPurchase = available[0].phoneNumber

    // 2. Purchase the number with SMS webhook
    const purchased = await masterClient.incomingPhoneNumbers.create({
      phoneNumber: numberToPurchase,
      smsUrl: `${APP_URL}/api/webhooks/sms`,
      smsMethod: 'POST',
      friendlyName: `VoiceFly Starter - ${employeeId}`,
    })

    console.log(`[EmployeeProvisioning] Starter number purchased: ${purchased.phoneNumber} (master account)`)

    // 3. Import into VAPI with serverUrl + serverUrlSecret (NOT assistantId)
    //    This makes VAPI send webhook requests with x-vapi-secret header
    const vapiResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'twilio',
        twilioAccountSid: TWILIO_ACCOUNT_SID,
        twilioAuthToken: TWILIO_AUTH_TOKEN,
        number: purchased.phoneNumber,
        serverUrl: `${APP_URL}/api/webhooks/phone-employee`,
        serverUrlSecret: employeeId,
        name: `VF-${employeeId.slice(0, 34)}`,
      }),
    })

    if (!vapiResponse.ok) {
      await masterClient.incomingPhoneNumbers(purchased.sid).remove().catch(() => {})
      const errorData = await vapiResponse.json()
      throw new Error(`VAPI import failed: ${errorData.message || vapiResponse.statusText}`)
    }

    const vapiPhoneData = await vapiResponse.json()
    console.log(`[EmployeeProvisioning] Starter number ready: ${purchased.phoneNumber}`)

    // Record in phone_numbers for SMS routing
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
   * Provision a Starter-tier business after Stripe checkout.
   * Finds the existing trial employee, buys a dedicated number,
   * and upgrades capabilities (transfer, SMS).
   */
  async provisionStarterForBusiness(businessId: string): Promise<void> {
    const sharedAssistantId = process.env.VAPI_SHARED_ASSISTANT_ID

    // Find existing trial employee
    const { data: employee } = await supabase
      .from('phone_employees')
      .select('id, name, capabilities, vapi_assistant_id, phone_number, vapi_phone_id, phone_provider')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!employee) {
      console.error(`[EmployeeProvisioning] No active employee found for Starter business ${businessId}`)
      return
    }

    // Release old phone if it was the shared trial number
    if (employee.vapi_phone_id && employee.phone_provider === 'vapi-only' && VAPI_API_KEY) {
      await fetch(`https://api.vapi.ai/phone-number/${employee.vapi_phone_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
      }).catch(() => {})
    }

    // Clear old phone fields
    await supabase
      .from('phone_employees')
      .update({
        phone_number: null,
        vapi_phone_id: null,
        phone_provider: null,
        twilio_phone_sid: null,
        provisioning_status: 'provisioning',
        provisioning_error: null,
        provisioning_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', employee.id)

    try {
      // Provision dedicated Twilio number (no dedicated VAPI assistant)
      const result = await this.provisionStarterTwilioNumber(
        employee.id,
        businessId,
      )

      // Upgrade capabilities: add transfer and SMS
      const currentCapabilities: string[] = employee.capabilities || []
      const starterCapabilities = [...new Set([
        ...currentCapabilities,
        'transfer_to_human',
        'send_sms',
      ])]

      // Update employee with new phone and capabilities
      await supabase
        .from('phone_employees')
        .update({
          phone_number: result.phoneNumber,
          vapi_phone_id: result.vapiPhoneId,
          twilio_phone_sid: result.twilioPhoneSid,
          phone_provider: 'twilio-vapi',
          capabilities: starterCapabilities,
          vapi_assistant_id: sharedAssistantId || employee.vapi_assistant_id,
          provisioning_status: 'active',
          provisioning_error: null,
          provisioning_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)

      // Update business phone number
      await supabase
        .from('businesses')
        .update({
          ai_phone_number: result.phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      console.log(`[EmployeeProvisioning] Starter provisioning complete for business ${businessId}: ${result.phoneNumber}`)
    } catch (err: any) {
      await supabase
        .from('phone_employees')
        .update({
          provisioning_status: 'failed',
          provisioning_error: err.message || 'Starter provisioning failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)
      throw err
    }
  }

  // ============================================
  // TIER MIGRATION
  // ============================================

  /**
   * Migrate a business between tiers.
   * Handles VAPI assistant creation/deletion and phone number rebinding.
   *
   * Trial/Starter: shared VAPI assistant, config built dynamically per call
   * Pro: dedicated VAPI assistant per employee, config baked in
   */
  async migrateBusinessTier(
    businessId: string,
    toTier: 'trial' | 'starter' | 'pro'
  ): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = []
    let migrated = 0

    // Get current business state
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('name, subscription_tier, subscription_status')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return { migrated: 0, errors: ['Business not found'] }
    }

    const fromTier = business.subscription_tier || 'trial'
    const businessName = business.name || 'Business'

    if (fromTier === toTier) {
      return { migrated: 0, errors: [`Business is already on ${toTier} tier`] }
    }

    console.log(`[TierMigration] Migrating business ${businessId} from ${fromTier} → ${toTier}`)

    // Get all active employees
    const { data: employees } = await supabase
      .from('phone_employees')
      .select('*, businesses(name, phone, email, address, website, timezone, settings, business_context)')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (!employees || employees.length === 0) {
      // No employees — just update the tier
      await supabase
        .from('businesses')
        .update({
          subscription_tier: toTier,
          subscription_status: toTier === 'trial' ? 'trial' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)

      console.log(`[TierMigration] No employees found. Tier updated to ${toTier}.`)
      return { migrated: 0, errors: [] }
    }

    const sharedAssistantId = VAPI_SHARED_ASSISTANT_ID || ''

    if (toTier === 'pro') {
      // ---- UPGRADE TO PRO: Create dedicated VAPI assistants ----
      for (const employee of employees) {
        const isShared = !employee.vapi_assistant_id
          || employee.vapi_assistant_id === sharedAssistantId

        if (!isShared) {
          // Already has a dedicated assistant — skip
          console.log(`[TierMigration] ${employee.name} already has dedicated assistant, skipping`)
          migrated++
          continue
        }

        try {
          // Create dedicated VAPI assistant
          const vapiResult = await this.provisionVAPIAgent(employee, businessName)

          // Update employee record
          await supabase
            .from('phone_employees')
            .update({
              vapi_assistant_id: vapiResult.assistantId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', employee.id)

          // Rebind phone number to dedicated assistant if one exists
          if (employee.vapi_phone_id) {
            await this.rebindVapiPhoneToAssistant(
              employee.vapi_phone_id,
              vapiResult.assistantId,
            )
          }

          console.log(`[TierMigration] ${employee.name} → dedicated assistant ${vapiResult.assistantId}`)
          migrated++
        } catch (err: any) {
          const msg = `Failed to upgrade ${employee.name}: ${err.message}`
          console.error(`[TierMigration] ${msg}`)
          errors.push(msg)
        }
      }
    } else if (toTier === 'starter' || toTier === 'trial') {
      // ---- DOWNGRADE TO STARTER/TRIAL: Delete dedicated assistants, revert to shared ----
      for (const employee of employees) {
        const isShared = !employee.vapi_assistant_id
          || employee.vapi_assistant_id === sharedAssistantId

        if (isShared) {
          // Already on shared — skip
          migrated++
          continue
        }

        try {
          const oldAssistantId = employee.vapi_assistant_id

          // Rebind phone number to shared assistant (webhook-based routing)
          if (employee.vapi_phone_id) {
            await this.rebindVapiPhoneToAssistant(
              employee.vapi_phone_id,
              null, // null = shared mode (serverUrl routing)
              employee.id,
            )
          }

          // Update employee to shared assistant
          await supabase
            .from('phone_employees')
            .update({
              vapi_assistant_id: sharedAssistantId || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', employee.id)

          // Delete the dedicated VAPI assistant
          if (oldAssistantId && VAPI_API_KEY) {
            await fetch(`https://api.vapi.ai/assistant/${oldAssistantId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` },
            }).catch(err => {
              console.warn(`[TierMigration] Failed to delete VAPI assistant ${oldAssistantId}:`, err)
            })
          }

          console.log(`[TierMigration] ${employee.name} → shared assistant (deleted ${oldAssistantId})`)
          migrated++
        } catch (err: any) {
          const msg = `Failed to downgrade ${employee.name}: ${err.message}`
          console.error(`[TierMigration] ${msg}`)
          errors.push(msg)
        }
      }
    }

    // Update business tier
    await supabase
      .from('businesses')
      .update({
        subscription_tier: toTier,
        subscription_status: toTier === 'trial' ? 'trial' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    console.log(`[TierMigration] Complete: ${migrated}/${employees.length} employees migrated, ${errors.length} errors`)
    return { migrated, errors }
  }

  /**
   * Rebind a VAPI phone number to a different assistant.
   * - assistantId provided: binds directly to that assistant (pro mode)
   * - assistantId null: uses serverUrl + serverUrlSecret for webhook routing (shared mode)
   */
  private async rebindVapiPhoneToAssistant(
    vapiPhoneId: string,
    assistantId: string | null,
    employeeId?: string,
  ): Promise<boolean> {
    if (!VAPI_API_KEY) {
      console.warn('[TierMigration] No VAPI API key — cannot rebind phone')
      return false
    }

    const body: Record<string, any> = assistantId
      ? { assistantId }
      : {
          assistantId: null,
          serverUrl: `${APP_URL}/api/webhooks/phone-employee`,
          serverUrlSecret: employeeId || '',
        }

    const response = await fetch(`https://api.vapi.ai/phone-number/${vapiPhoneId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[TierMigration] Failed to rebind phone ${vapiPhoneId}:`, errorData)
      return false
    }

    console.log(`[TierMigration] Phone ${vapiPhoneId} rebound to ${assistantId || 'shared (webhook)'}`)
    return true
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

    // Delete VAPI assistant (only if it's a dedicated one, never the shared assistant)
    const isDedicatedAssistant = employee.vapiAssistantId
      && employee.vapiAssistantId !== VAPI_SHARED_ASSISTANT_ID
    if (isDedicatedAssistant && VAPI_API_KEY) {
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
    // Don't update the shared assistant — it's managed centrally
    if (employee.vapi_assistant_id === VAPI_SHARED_ASSISTANT_ID) return
    await this.updateVAPIAssistant(employee)
  }

  private async updateVAPIAssistant(employee: any, voiceOverride?: EmployeeConfig['voice']): Promise<void> {
    if (!VAPI_API_KEY || !employee.vapi_assistant_id) return
    // Never patch the shared assistant from individual employee updates
    if (employee.vapi_assistant_id === VAPI_SHARED_ASSISTANT_ID) return

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
      provisioningStatus: data.provisioning_status || 'pending',
      provisioningError: data.provisioning_error || null,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const employeeProvisioning = EmployeeProvisioningService.getInstance()
