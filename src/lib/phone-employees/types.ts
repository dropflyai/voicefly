/**
 * Phone Employee System - Core Types
 *
 * Defines the structure for AI phone employees that can:
 * - Answer calls and take messages
 * - Schedule appointments
 * - Take orders
 * - Handle customer inquiries
 * - Execute follow-up actions
 */

// ============================================
// EMPLOYEE JOB TYPES
// ============================================

export type EmployeeJobType =
  | 'receptionist'           // Answer calls, route, take messages, schedule
  | 'personal-assistant'     // Scheduling, reminders, message management
  | 'order-taker'            // Take orders, upsell, confirm, process
  | 'appointment-scheduler'  // Focused on booking appointments
  | 'customer-service'       // Handle inquiries, complaints, support
  | 'outbound-sales'         // Proactive sales calls (Phase 2)
  | 'collections'            // Payment reminders (Phase 2)
  | 'survey-caller'          // Customer feedback (Phase 2)

export type EmployeeComplexity = 'simple' | 'moderate' | 'complex'

// ============================================
// EMPLOYEE CONFIGURATION
// ============================================

export interface EmployeeConfig {
  id: string
  businessId: string
  name: string                    // "Maya", "Sarah", custom name
  jobType: EmployeeJobType
  complexity: EmployeeComplexity

  // Voice settings
  voice: {
    provider: 'elevenlabs' | 'openai'
    voiceId: string               // sarah, michael, emma, etc.
    speed: number                 // 0.8 - 1.2
    stability: number             // 0.5 - 1.0
  }

  // Personality
  personality: {
    tone: 'professional' | 'friendly' | 'warm' | 'casual' | 'luxury'
    enthusiasm: 'low' | 'medium' | 'high'
    formality: 'formal' | 'semi-formal' | 'casual'
  }

  // Working hours
  schedule: {
    timezone: string
    businessHours: {
      [day: string]: { start: string; end: string } | null  // null = closed
    }
    afterHoursMessage?: string
    holidayDates?: string[]
  }

  // Capabilities enabled for this employee
  capabilities: EmployeeCapability[]

  // Job-specific configuration
  jobConfig: ReceptionistConfig | PersonalAssistantConfig | OrderTakerConfig | GenericJobConfig

  // VAPI integration
  vapiAssistantId?: string
  vapiPhoneId?: string
  phoneNumber?: string

  // Status
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// EMPLOYEE CAPABILITIES
// ============================================

export type EmployeeCapability =
  // Communication
  | 'answer_calls'
  | 'make_outbound_calls'
  | 'send_sms'
  | 'send_email'
  | 'transfer_to_human'

  // Information
  | 'take_messages'
  | 'provide_business_info'
  | 'answer_faqs'
  | 'check_availability'

  // Scheduling
  | 'book_appointments'
  | 'reschedule_appointments'
  | 'cancel_appointments'
  | 'send_reminders'

  // Orders
  | 'take_orders'
  | 'modify_orders'
  | 'process_payments'
  | 'upsell_products'

  // Customer Management
  | 'capture_lead_info'
  | 'update_customer_records'
  | 'log_interactions'

  // Advanced
  | 'schedule_callbacks'
  | 'escalate_to_manager'
  | 'handle_complaints'

// ============================================
// JOB-SPECIFIC CONFIGURATIONS
// ============================================

export interface ReceptionistConfig {
  type: 'receptionist'
  greeting: string
  businessDescription: string

  // Routing rules
  transferRules: {
    keywords: string[]
    destination: 'manager' | 'sales' | 'support' | 'specific_person'
    personName?: string
    phoneNumber?: string
  }[]

  // Message taking
  messagePrompt: string  // "Can I take a message for them?"
  messageFields: ('name' | 'phone' | 'email' | 'company' | 'reason' | 'urgency')[]

  // FAQs
  faqs: {
    question: string
    answer: string
    keywords: string[]
  }[]

  // Services offered (for appointment booking)
  services?: {
    name: string
    duration: number
    description?: string
  }[]
}

export interface PersonalAssistantConfig {
  type: 'personal-assistant'
  ownerName: string
  greeting: string

  // Calendar integration
  calendarProvider?: 'google' | 'outlook' | 'calendly' | 'cal.com'
  calendarId?: string

  // Scheduling preferences
  schedulingRules: {
    minNotice: number           // minutes
    maxAdvance: number          // days
    bufferBetween: number       // minutes
    preferredTimes?: string[]   // "morning", "afternoon", "evening"
  }

  // Message priorities
  messagePriorities: {
    highPriorityKeywords: string[]    // "urgent", "emergency", "asap"
    vipContacts: string[]             // Phone numbers or names
  }

  // Auto-responses
  autoResponses: {
    trigger: string
    response: string
  }[]
}

export interface OrderTakerConfig {
  type: 'order-taker'
  greeting: string

  // Menu/Products
  menu: {
    categories: {
      name: string
      items: {
        name: string
        price: number
        description?: string
        modifiers?: {
          name: string
          options: { name: string; price: number }[]
          required: boolean
        }[]
        allergens?: string[]
      }[]
    }[]
  }

  // Upsell rules
  upsellRules: {
    trigger: string           // Item name or category
    suggestion: string        // "Would you like to add..."
    item: string
    price: number
  }[]

  // Order settings
  orderSettings: {
    minimumOrder?: number
    deliveryFee?: number
    deliveryRadius?: number   // miles
    pickupOnly?: boolean
    estimatedTime: {
      pickup: number          // minutes
      delivery: number
    }
  }

  // Payment
  acceptedPayments: ('cash' | 'card' | 'online')[]
  tipOptions?: number[]       // [15, 18, 20, 25]
}

export interface GenericJobConfig {
  type: 'generic'
  greeting: string
  systemPrompt: string
  customInstructions?: string
}

// ============================================
// MESSAGE SYSTEM
// ============================================

export interface PhoneMessage {
  id: string
  businessId: string
  employeeId: string

  // Caller info
  callerName?: string
  callerPhone: string
  callerEmail?: string
  callerCompany?: string

  // Message content
  reason: string
  fullMessage: string
  urgency: 'low' | 'normal' | 'high' | 'urgent'

  // Routing
  forPerson?: string          // Who the message is for
  department?: string

  // Status
  status: 'new' | 'read' | 'in_progress' | 'resolved' | 'archived'

  // Follow-up
  callbackRequested: boolean
  callbackTime?: Date
  callbackCompleted?: boolean

  // Metadata
  callId?: string             // Related voice call
  transcriptExcerpt?: string

  createdAt: Date
  updatedAt: Date
}

// ============================================
// SCHEDULED TASKS
// ============================================

export interface ScheduledTask {
  id: string
  businessId: string
  employeeId: string

  // Task type
  taskType:
    | 'callback'              // Call customer back
    | 'send_reminder'         // Appointment reminder
    | 'send_confirmation'     // Order/booking confirmation
    | 'follow_up'             // Follow-up call/message
    | 'check_in'              // Customer check-in

  // Target
  targetPhone?: string
  targetEmail?: string
  targetName?: string

  // Scheduling
  scheduledFor: Date
  timezone: string

  // Content
  message?: string
  templateId?: string
  metadata?: Record<string, any>

  // Execution
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  attempts: number
  maxAttempts: number
  lastAttemptAt?: Date
  completedAt?: Date
  failureReason?: string

  // Priority
  priority: 'low' | 'normal' | 'high' | 'critical'

  createdAt: Date
  updatedAt: Date
}

// ============================================
// ORDER SYSTEM
// ============================================

export interface PhoneOrder {
  id: string
  businessId: string
  employeeId: string
  callId?: string

  // Customer
  customerName: string
  customerPhone: string
  customerEmail?: string

  // Order details
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  tip?: number
  total: number

  // Type
  orderType: 'pickup' | 'delivery' | 'dine_in'

  // Delivery info
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zip: string
    instructions?: string
  }

  // Timing
  requestedTime?: Date        // When they want it
  estimatedReady?: Date       // When it'll be ready

  // Status
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'

  // Payment
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  paymentMethod?: 'cash' | 'card' | 'online'

  // Notes
  specialInstructions?: string
  internalNotes?: string

  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  modifiers?: {
    name: string
    option: string
    price: number
  }[]
  specialInstructions?: string
}

// ============================================
// ACTION EXECUTION
// ============================================

export interface ActionRequest {
  id: string
  businessId: string
  employeeId: string

  // Action type
  actionType:
    | 'send_sms'
    | 'send_email'
    | 'make_call'
    | 'schedule_callback'
    | 'create_appointment'
    | 'update_crm'
    | 'send_webhook'
    | 'escalate'

  // Target
  target: {
    phone?: string
    email?: string
    webhookUrl?: string
  }

  // Content
  content: {
    message?: string
    subject?: string
    templateId?: string
    data?: Record<string, any>
  }

  // Scheduling
  executeAt?: Date            // null = immediately

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: {
    success: boolean
    response?: any
    error?: string
  }

  // Metadata
  triggeredBy: 'call' | 'agent' | 'schedule' | 'manual'
  sourceCallId?: string

  createdAt: Date
  executedAt?: Date
}

// ============================================
// EMPLOYEE ANALYTICS
// ============================================

export interface EmployeeMetrics {
  employeeId: string
  businessId: string
  period: 'daily' | 'weekly' | 'monthly'
  date: Date

  // Call metrics
  totalCalls: number
  answeredCalls: number
  missedCalls: number
  avgCallDuration: number

  // Outcomes
  appointmentsBooked: number
  messagesTaken: number
  ordersTaken: number
  leadsCapture: number
  transfersToHuman: number

  // Quality
  avgSentimentScore: number
  customerSatisfaction?: number
  escalationRate: number

  // Actions
  smsSent: number
  emailsSent: number
  callbacksScheduled: number
  callbacksCompleted: number

  // Revenue (for order takers)
  ordersTotal?: number
  avgOrderValue?: number
}

// ============================================
// BETA CONFIGURATION
// ============================================

export const SIMPLE_EMPLOYEE_JOBS: EmployeeJobType[] = [
  'receptionist',
  'personal-assistant',
  'order-taker',
  'appointment-scheduler',
]

export const COMPLEX_EMPLOYEE_JOBS: EmployeeJobType[] = [
  'outbound-sales',
  'collections',
  'survey-caller',
  'customer-service',
]

export const DEFAULT_CAPABILITIES_BY_JOB: Record<EmployeeJobType, EmployeeCapability[]> = {
  'receptionist': [
    'answer_calls',
    'take_messages',
    'provide_business_info',
    'answer_faqs',
    'transfer_to_human',
    'book_appointments',
    'check_availability',
    'capture_lead_info',
    'log_interactions',
    'send_sms',
  ],

  'personal-assistant': [
    'answer_calls',
    'take_messages',
    'book_appointments',
    'reschedule_appointments',
    'cancel_appointments',
    'send_reminders',
    'schedule_callbacks',
    'send_sms',
    'send_email',
    'check_availability',
    'log_interactions',
  ],

  'order-taker': [
    'answer_calls',
    'take_orders',
    'modify_orders',
    'upsell_products',
    'process_payments',
    'send_sms',
    'provide_business_info',
    'log_interactions',
  ],

  'appointment-scheduler': [
    'answer_calls',
    'book_appointments',
    'reschedule_appointments',
    'cancel_appointments',
    'check_availability',
    'send_reminders',
    'send_sms',
    'capture_lead_info',
  ],

  'customer-service': [
    'answer_calls',
    'provide_business_info',
    'answer_faqs',
    'handle_complaints',
    'escalate_to_manager',
    'transfer_to_human',
    'send_sms',
    'send_email',
    'log_interactions',
  ],

  'outbound-sales': [
    'make_outbound_calls',
    'capture_lead_info',
    'book_appointments',
    'send_sms',
    'send_email',
    'schedule_callbacks',
    'log_interactions',
  ],

  'collections': [
    'make_outbound_calls',
    'send_sms',
    'send_email',
    'schedule_callbacks',
    'process_payments',
    'log_interactions',
  ],

  'survey-caller': [
    'make_outbound_calls',
    'log_interactions',
    'send_sms',
  ],
}

// Credit costs per action
export const ACTION_CREDIT_COSTS: Record<string, number> = {
  'answer_call': 0,           // Included in call minutes
  'send_sms': 1,
  'send_email': 1,
  'make_outbound_call': 5,
  'book_appointment': 0,
  'take_message': 0,
  'take_order': 0,
  'schedule_callback': 1,
}
