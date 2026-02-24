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
  | 'receptionist'              // Answer calls, route, take messages, schedule
  | 'personal-assistant'        // Scheduling, reminders, message management
  | 'order-taker'               // Take orders, upsell, confirm, process
  | 'appointment-scheduler'     // Focused on booking appointments
  | 'customer-service'          // Handle inquiries, complaints, support
  | 'after-hours-emergency'     // Triage emergencies, notify on-call staff
  | 'restaurant-host'           // Reservations, waitlist, dining inquiries
  | 'lead-qualifier'            // Screen inbound prospects, score leads, book discovery calls
  | 'outbound-sales'            // Proactive sales calls (Phase 2)
  | 'collections'               // Payment collection outbound caller
  | 'survey-caller'             // Customer feedback (Phase 2)
  | 'appointment-reminder'      // Outbound appointment confirmation caller

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
    provider: '11labs' | 'elevenlabs' | 'openai'
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
  jobConfig: ReceptionistConfig | PersonalAssistantConfig | OrderTakerConfig | AppointmentSchedulerConfig | CustomerServiceConfig | AfterHoursEmergencyConfig | RestaurantHostConfig | LeadQualifierConfig | SurveyCallerConfig | AppointmentReminderConfig | CollectionsConfig | GenericJobConfig

  // VAPI integration
  vapiAssistantId?: string
  vapiPhoneId?: string
  phoneNumber?: string
  phoneProvider?: 'vapi' | 'twilio-vapi'
  twilioPhoneSid?: string

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
  | 'screen_callers'
  | 'lookup_contacts'
  | 'create_tasks'

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
  ownerRole?: 'general' | 'medical' | 'legal' | 'real-estate' | 'executive' | 'consultant' | 'financial'

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

export interface AppointmentSchedulerConfig {
  type: 'appointment-scheduler'
  greeting: string
  businessDescription: string

  // Appointment types offered
  appointmentTypes: {
    name: string
    duration: number
    description?: string
    price?: number
  }[]

  // Booking constraints
  bookingRules: {
    minNoticeHours: number
    maxAdvanceDays: number
    bufferMinutes: number
    sameDayBooking: boolean
  }

  // Optional staff roster
  staffMembers?: {
    name: string
    specialties?: string[]
  }[]

  cancellationPolicy?: string

  // FAQs
  faqs: {
    question: string
    answer: string
    keywords: string[]
  }[]
}

export interface CustomerServiceConfig {
  type: 'customer-service'
  greeting: string
  businessDescription: string
  supportedProducts: string[]
  commonIssues: { issue: string; resolution: string }[]
  returnPolicy?: string
  warrantyPolicy?: string
  escalationTriggers: string[]
  resolutionAuthority: {
    canRefund: boolean
    maxRefundAmount?: number
    canOfferDiscount: boolean
    canScheduleCallback: boolean
  }
  faqs: { question: string; answer: string; keywords: string[] }[]
}

export interface AfterHoursEmergencyConfig {
  type: 'after-hours-emergency'
  greeting: string
  businessType: 'property-management' | 'medical' | 'hvac-contractor' | 'legal' | 'general'

  // Emergency detection
  emergencyKeywords: string[]        // triggers immediate escalation
  urgentKeywords: string[]           // triggers high-priority message

  // On-call contacts (ordered — try #1 first, then #2, etc.)
  onCallContacts: {
    name: string
    phone: string
    role?: string
  }[]

  // After-hours response
  nonEmergencyResponse: string       // what to say for non-urgent calls
  emergencyInstructions?: string     // any special handling notes
}

export interface RestaurantHostConfig {
  type: 'restaurant-host'
  restaurantName: string
  greeting: string

  // Capacity
  tableCapacity: number             // total seats
  partyMaxSize: number              // largest party accepted

  // Reservation slots (which days and times are bookable)
  reservationSlots: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    openTime: string               // '17:00'
    closeTime: string              // '22:00'
    slotIntervalMinutes: number    // 15, 30 or 60
  }[]

  // Features
  waitlistEnabled: boolean
  specialOccasionsEnabled: boolean  // birthday, anniversary handling
  depositRequired?: {
    partySize: number               // require deposit for parties >= this size
    amount: number                  // deposit amount in dollars
  }

  // Cross-sell
  orderTakerTransferPhone?: string  // if set, offer to transfer callers who want to order

  // Policies
  cancellationPolicy?: string
  noShowPolicy?: string
  dressCode?: string

  // Menu/Special info the AI should know
  specialties?: string[]           // signature dishes, specials
  parkingInfo?: string
}

export interface GenericJobConfig {
  type: 'generic'
  greeting: string
  systemPrompt: string
  customInstructions?: string
}

export interface SurveyCallerConfig {
  type: 'survey-caller'
  greeting: string
  surveyName: string

  // Questions to ask (in order)
  questions: {
    id: string
    question: string
    type: 'rating'        // 1-10 scale
         | 'yes_no'       // Yes or No
         | 'nps'          // Net Promoter Score 0-10
         | 'open'         // Open-ended response
    required: boolean
  }[]

  // When to trigger this caller (set during config, used by Maya to schedule)
  callTrigger: 'post_appointment' | 'post_order' | 'manual'
  triggerDelayHours: number    // hours after trigger event to call (e.g. 2)

  // Optional incentive offer
  offerIncentive?: string      // e.g. "10% off your next visit"

  // Outro
  positiveOutro: string        // what to say when avg rating >= 4
  negativeOutro: string        // what to say when avg rating < 3
}

export interface AppointmentReminderConfig {
  type: 'appointment-reminder'
  greeting: string

  // Timing
  reminderLeadTimeHours: number    // hours before appointment to call (default: 24)

  // Call behavior
  confirmationRequired: boolean    // if true, ask them to confirm; if false, just remind
  rescheduleEnabled: boolean       // if true, offer to reschedule if they can't make it

  // After-call follow-up
  sendConfirmationSms: boolean     // send SMS after successful call

  // Content
  cancellationPolicy?: string      // mention during call if they want to cancel
}

export interface CollectionsConfig {
  type: 'collections'
  greeting: string

  // Compliance
  complianceDisclaimer: string     // FDCPA required: "This is an attempt to collect a debt"

  // Payment options offered
  paymentOptions: ('full' | 'payment-plan' | 'settlement')[]
  maxPaymentPlanMonths: number     // max months for a payment plan
  settlementPercentage?: number    // e.g. 70 means "settle for 70% of balance"

  // Tone
  escalationPolicy: 'firm' | 'empathetic' | 'neutral'

  // What to do if disputed
  disputeContact: string           // who to direct disputes to
}

export interface LeadQualifierConfig {
  type: 'lead-qualifier'
  greeting: string
  businessDescription: string   // brief description of what the business offers

  // Qualifying questions (asked in order)
  qualifyingQuestions: {
    id: string
    question: string
    field: string               // 'interest' | 'timeline' | 'budget' | 'authority' | 'custom'
    required: boolean
  }[]

  // What makes a lead "hot" — any of these being true makes it hot
  hotLeadCriteria: string[]     // e.g. ["timeline < 30 days", "budget > 5000", "decision maker"]

  // What to do with hot leads
  hotLeadAction: 'transfer' | 'book' | 'callback'
  transferNumber?: string       // if hotLeadAction === 'transfer'

  // Responses
  coldLeadResponse: string      // what to say to unqualified leads
  warmLeadResponse: string      // what to say to warm leads (interested but not ready)

  // Optional disqualification
  disqualifyingAnswers?: {
    questionId: string
    answer: string              // if caller says this, immediately mark cold
  }[]
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
  'customer-service',
  'after-hours-emergency',
  'restaurant-host',
  'lead-qualifier',
  'survey-caller',
  'appointment-reminder',
  'collections',
]

export const COMPLEX_EMPLOYEE_JOBS: EmployeeJobType[] = [
  'outbound-sales',
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
    'transfer_to_human',
    'send_sms',
    'send_email',
    'check_availability',
    'capture_lead_info',
    'log_interactions',
    'screen_callers',
    'lookup_contacts',
    'create_tasks',
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

  'after-hours-emergency': [
    'answer_calls',
    'take_messages',
    'transfer_to_human',
    'screen_callers',
    'send_sms',
    'escalate_to_manager',
  ],

  'restaurant-host': [
    'answer_calls',
    'book_appointments',
    'reschedule_appointments',
    'cancel_appointments',
    'check_availability',
    'take_messages',
    'provide_business_info',
    'transfer_to_human',
    'send_sms',
    'capture_lead_info',
    'log_interactions',
  ],

  'lead-qualifier': [
    'answer_calls',
    'screen_callers',
    'capture_lead_info',
    'book_appointments',
    'transfer_to_human',
    'send_sms',
    'schedule_callbacks',
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
    'process_payments',
    'schedule_callbacks',
    'send_sms',
    'log_interactions',
  ],

  'appointment-reminder': [
    'make_outbound_calls',
    'reschedule_appointments',
    'cancel_appointments',
    'send_sms',
    'log_interactions',
  ],

  'survey-caller': [
    'make_outbound_calls',
    'log_interactions',
    'send_sms',
    'schedule_callbacks',
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
