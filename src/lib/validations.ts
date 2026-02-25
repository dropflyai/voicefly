/**
 * Zod validation schemas for API endpoints
 * Provides input validation and type safety
 */

import { z } from 'zod'

// ============================================
// Common schemas
// ============================================

export const uuidSchema = z.string().uuid('Invalid ID format')

export const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')

export const emailSchema = z.string().email('Invalid email format')

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
})

// ============================================
// Appointments schemas
// ============================================

export const appointmentCreateSchema = z.object({
  organization_id: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  customer_phone: phoneSchema,
  customer_first_name: z.string().min(1, 'First name required').max(100),
  customer_last_name: z.string().max(100).optional(),
  customer_email: emailSchema.optional(),
  service_id: uuidSchema,
  staff_id: uuidSchema.optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  notes: z.string().max(2000).optional(),
  special_requests: z.string().max(500).optional(),
  voice_call_id: uuidSchema.optional(),
  campaign_id: uuidSchema.optional(),
  booking_source: z.enum(['voice_call', 'web', 'phone', 'walk_in', 'manual']).default('voice_call')
})

export const appointmentUpdateSchema = z.object({
  appointment_id: uuidSchema,
  status: z.enum(['pending', 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  payment_status: z.enum(['pending', 'processing', 'paid', 'refunded', 'partially_refunded']).optional(),
  notes: z.string().max(2000).optional()
})

export const appointmentQuerySchema = z.object({
  organization_id: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  business_id: uuidSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  status: z.enum(['pending', 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']).optional()
})

// ============================================
// Leads schemas
// ============================================

export const leadCreateSchema = z.object({
  businessId: uuidSchema.optional(),
  company_name: z.string().max(200).optional(),
  contact_name: z.string().max(200).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  company_size: z.string().max(50).optional(),
  source: z.enum(['manual', 'import', 'web_form', 'voice_call', 'referral', 'linkedin', 'other']).default('manual'),
  notes: z.string().max(5000).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new')
}).refine(
  data => data.email || data.phone,
  { message: 'Either email or phone is required' }
)

export const leadQuerySchema = z.object({
  businessId: uuidSchema.optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  source: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
})

// ============================================
// Voice AI schemas
// ============================================

export const testCallSchema = z.object({
  businessId: uuidSchema,
  phoneNumber: phoneSchema.optional(),
  testType: z.enum(['inbound', 'outbound']).default('outbound')
})

export const provisionAgentSchema = z.object({
  businessId: uuidSchema,
  businessName: z.string().min(1).max(200),
  businessType: z.string().max(100).optional(),
  agentName: z.string().max(100).default('Maya'),
  voiceId: z.string().optional(),
  firstMessage: z.string().max(500).optional(),
  systemPrompt: z.string().max(10000).optional()
})

// ============================================
// Credits schemas
// ============================================

export const creditPurchaseSchema = z.object({
  business_id: uuidSchema,
  pack_id: z.enum(['pack_starter', 'pack_growth', 'pack_pro', 'pack_scale'])
})

export const creditBalanceQuerySchema = z.object({
  business_id: uuidSchema
})

// ============================================
// Research schemas
// ============================================

export const researchRequestSchema = z.object({
  query: z.string().min(1, 'Query required').max(1000, 'Query too long'),
  mode: z.enum(['deep', 'quick', 'prospect', 'competitor', 'market']),
  businessId: uuidSchema.optional(),
  relatedLeadId: uuidSchema.optional(),
  relatedCustomerId: uuidSchema.optional(),
  pageContext: z.string().max(100).optional()
})

// ============================================
// Business schemas
// ============================================

export const businessUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  business_type: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  settings: z.record(z.any()).optional()
})

// ============================================
// Onboarding schemas
// ============================================

export const onboardingCompleteSchema = z.object({
  businessId: uuidSchema,
  step: z.enum(['profile', 'services', 'ai_agent', 'phone', 'complete']),
  data: z.record(z.any()).optional()
})

// ============================================
// Services schemas
// ============================================

export const serviceCreateSchema = z.object({
  organization_id: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().min(5).max(480),
  price_cents: z.number().int().min(0),
  category: z.string().max(100).optional(),
  active: z.boolean().default(true)
})

export const serviceUpdateSchema = serviceCreateSchema.partial()

// ============================================
// Staff schemas
// ============================================

export const staffCreateSchema = z.object({
  organization_id: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.string().max(100).optional(),
  specialties: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional(),
  active: z.boolean().default(true)
})

export const staffUpdateSchema = staffCreateSchema.partial()

// ============================================
// Campaign schemas
// ============================================

export const campaignCreateSchema = z.object({
  businessId: uuidSchema.optional(),
  name: z.string().min(1).max(200),
  type: z.enum(['voice', 'sms', 'email', 'multi']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).default('draft'),
  target_audience: z.record(z.any()).optional(),
  schedule: z.record(z.any()).optional(),
  content: z.record(z.any()).optional(),
  budget_cents: z.number().int().min(0).optional(),
  goals: z.record(z.any()).optional()
})

export const campaignUpdateSchema = campaignCreateSchema.partial()

// ============================================
// Validation helper
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: z.ZodError['errors'] }

/**
 * Validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  // Format error message
  const errors = result.error.errors
  const errorMessage = errors.map(e => {
    const path = e.path.join('.')
    return path ? `${path}: ${e.message}` : e.message
  }).join('; ')

  return {
    success: false,
    error: errorMessage,
    details: errors
  }
}

/**
 * Validate query parameters from URL
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const data: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    data[key] = value
  })
  return validate(schema, data)
}
