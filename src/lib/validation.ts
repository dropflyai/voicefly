import { z } from 'zod'

/**
 * Comprehensive validation schemas for VoiceFly app
 * Uses Zod for type-safe runtime validation
 */

// ============================================================================
// Common Schemas
// ============================================================================

export const businessIdSchema = z.string().min(1, 'Business ID is required')

export const emailSchema = z.string().email('Invalid email address')

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number. Use E.164 format (e.g., +14155552671)'
)

export const urlSchema = z.string().url('Invalid URL')

export const uuidSchema = z.string().uuid('Invalid UUID')

// ============================================================================
// Stripe / Payment Schemas
// ============================================================================

export const checkoutCreateSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  businessId: z.string().optional(),
  planName: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
})

// ============================================================================
// SMS Schemas
// ============================================================================

export const smsSendSchema = z.object({
  to: phoneSchema,
  message: z.string().min(1).max(1600, 'Message too long (max 1600 characters)'),
  businessId: businessIdSchema,
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.string()).optional(),
})

export const smsWebhookSchema = z.object({
  From: phoneSchema.optional(),
  To: phoneSchema.optional(),
  Body: z.string().optional(),
  MessageSid: z.string().optional(),
  AccountSid: z.string().optional(),
})

// ============================================================================
// Lead Schemas
// ============================================================================

export const leadCaptureSchema = z.object({
  businessId: businessIdSchema,
  name: z.string().min(1, 'Name is required'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string()).optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone must be provided',
    path: ['email'],
  }
)

export const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string()).optional(),
})

export const leadNotesSchema = z.object({
  leadId: uuidSchema,
  note: z.string().min(1, 'Note cannot be empty'),
  userId: z.string().optional(),
})

// ============================================================================
// Appointment Schemas
// ============================================================================

export const appointmentCreateSchema = z.object({
  businessId: businessIdSchema,
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: emailSchema.optional(),
  customerPhone: phoneSchema.optional(),
  appointmentTime: z.string().datetime('Invalid appointment time'),
  duration: z.number().int().min(15).max(480).default(60), // 15 min to 8 hours
  service: z.string().min(1, 'Service type is required'),
  notes: z.string().optional(),
  metadata: z.record(z.string()).optional(),
})

export const appointmentUpdateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: emailSchema.optional(),
  customerPhone: phoneSchema.optional(),
  appointmentTime: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().optional(),
})

// ============================================================================
// Voice Call Schemas
// ============================================================================

export const voiceCallSchema = z.object({
  businessId: businessIdSchema,
  phoneNumber: phoneSchema,
  assistantId: z.string().min(1, 'Assistant ID is required'),
  metadata: z.record(z.string()).optional(),
})

export const vapiWebhookSchema = z.object({
  type: z.string(),
  call: z.object({
    id: z.string(),
    status: z.string(),
    phoneNumber: z.string().optional(),
    transcript: z.string().optional(),
  }).optional(),
})

// ============================================================================
// Auth Schemas
// ============================================================================

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  phone: phoneSchema.optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// ============================================================================
// Business / Settings Schemas
// ============================================================================

export const businessUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  website: urlSchema.optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.record(z.any()).optional(),
})

// ============================================================================
// Webhook Schemas (Generic)
// ============================================================================

export const webhookSchema = z.object({
  event: z.string(),
  timestamp: z.string().datetime().optional(),
  data: z.any(),
  signature: z.string().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate and parse request body with a Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; errors: z.ZodError }
> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return { success: false, errors: result.error }
    }
  } catch (error) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: [],
          message: 'Invalid JSON in request body',
        },
      ]),
    }
  }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  message: string
  errors: Record<string, string[]>
} {
  const errors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'general'
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })

  return {
    message: 'Validation failed',
    errors,
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const params = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(params)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}
