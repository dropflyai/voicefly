/**
 * API Authentication Middleware
 *
 * Provides server-side authentication for API routes using Supabase Auth.
 * Validates JWT tokens from cookies or Authorization header.
 * Includes rate limiting with Upstash Redis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit as checkRateLimitUpstash, getClientIp, RateLimitTier, RateLimitResult } from './rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a server client with service role for validating sessions
const getServerClient = () => createClient(supabaseUrl, supabaseServiceKey)

export interface AuthenticatedUser {
  id: string
  email: string
  businessId: string
  businessIds: string[]  // All businesses user has access to
  role: 'owner' | 'admin' | 'manager' | 'member'
}

export interface AuthResult {
  success: boolean
  user?: AuthenticatedUser
  error?: string
}

/**
 * Extract access token from request
 * Checks Authorization header first, then cookies
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookies for Supabase session
  const cookies = request.cookies
  const accessToken = cookies.get('sb-access-token')?.value ||
                      cookies.get('supabase-auth-token')?.value

  if (accessToken) {
    // Handle the JSON array format that Supabase sometimes uses
    try {
      const parsed = JSON.parse(accessToken)
      if (Array.isArray(parsed) && parsed[0]) {
        return parsed[0]
      }
    } catch {
      return accessToken
    }
  }

  return null
}

/**
 * Validate authentication and get user info
 * Returns user details including their business access
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request)

  if (!token) {
    return { success: false, error: 'No authentication token provided' }
  }

  const supabase = getServerClient()

  try {
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Get user's business associations
    const { data: businessUsers, error: businessError } = await supabase
      .from('business_users')
      .select('business_id, role')
      .eq('user_id', user.id)

    if (businessError || !businessUsers || businessUsers.length === 0) {
      return { success: false, error: 'No business access found' }
    }

    // Get primary business (owner role or first one)
    const primaryBusiness = businessUsers.find(bu => bu.role === 'owner') || businessUsers[0]

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        businessId: primaryBusiness.business_id,
        businessIds: businessUsers.map(bu => bu.business_id),
        role: primaryBusiness.role
      }
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Check if user has access to a specific business
 */
export async function validateBusinessAccess(
  request: NextRequest,
  businessId: string
): Promise<AuthResult> {
  const authResult = await validateAuth(request)

  if (!authResult.success || !authResult.user) {
    return authResult
  }

  // Check if user has access to this business
  if (!authResult.user.businessIds.includes(businessId)) {
    return { success: false, error: 'Access denied to this business' }
  }

  // Update the businessId to the one being accessed
  return {
    success: true,
    user: {
      ...authResult.user,
      businessId
    }
  }
}

/**
 * Wrapper function for protected API routes
 * Automatically handles authentication and returns 401/403 on failure
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await validateAuth(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, authResult.user)
  }
}

/**
 * Wrapper function for routes that need business-specific access
 * Validates that the user can access the business specified in the request
 */
export function withBusinessAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, businessId: string) => Promise<NextResponse>,
  getBusinessId: (request: NextRequest) => string | null
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const businessId = getBusinessId(request)

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      )
    }

    const authResult = await validateBusinessAccess(request, businessId)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    return handler(request, authResult.user, businessId)
  }
}

/**
 * Helper to extract businessId from common locations in requests
 */
export function getBusinessIdFromRequest(request: NextRequest): string | null {
  // Check URL params
  const url = new URL(request.url)

  // Check query parameter
  const queryBusinessId = url.searchParams.get('businessId') ||
                          url.searchParams.get('business_id')
  if (queryBusinessId) return queryBusinessId

  // Check path parameter (e.g., /api/businesses/[businessId])
  const pathMatch = url.pathname.match(/\/businesses\/([a-f0-9-]+)/i)
  if (pathMatch) return pathMatch[1]

  return null
}

/**
 * Helper to extract businessId from request body (for POST/PATCH requests)
 */
export async function getBusinessIdFromBody(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.clone().json()
    return body.businessId || body.business_id || null
  } catch {
    return null
  }
}

/**
 * Unauthenticated response helper
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toString())
  return headers
}

/**
 * Rate limited response
 */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

/**
 * Check rate limit for a request
 * Uses IP address and optional user ID for identification
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier = 'standard',
  userId?: string
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  const ip = getClientIp(request.headers)
  const identifier = userId ? `${userId}:${ip}` : ip

  const result = await checkRateLimitUpstash(identifier, tier)

  return {
    allowed: result.success,
    result
  }
}

/**
 * Wrapper that adds rate limiting to authentication
 */
export function withRateLimitedAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  tier: RateLimitTier = 'standard'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit first (using IP before auth)
    const ip = getClientIp(request.headers)
    const rateLimitResult = await checkRateLimitUpstash(ip, tier)

    if (!rateLimitResult.success) {
      return rateLimitedResponse(rateLimitResult)
    }

    // Then check authentication
    const authResult = await validateAuth(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        {
          status: 401,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    // Execute handler with rate limit headers
    const response = await handler(request, authResult.user)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    return response
  }
}

/**
 * Wrapper that adds rate limiting to business auth
 */
export function withRateLimitedBusinessAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, businessId: string) => Promise<NextResponse>,
  getBusinessId: (request: NextRequest) => string | null,
  tier: RateLimitTier = 'standard'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit first
    const ip = getClientIp(request.headers)
    const rateLimitResult = await checkRateLimitUpstash(ip, tier)

    if (!rateLimitResult.success) {
      return rateLimitedResponse(rateLimitResult)
    }

    const businessId = getBusinessId(request)

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      )
    }

    const authResult = await validateBusinessAccess(request, businessId)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        {
          status: authResult.error === 'Access denied to this business' ? 403 : 401,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      )
    }

    const response = await handler(request, authResult.user, businessId)

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    return response
  }
}

// Re-export rate limit types and functions for convenience
export type { RateLimitTier } from './rate-limit'
export type { RateLimitResult } from './rate-limit'
export { getClientIp } from './rate-limit'
