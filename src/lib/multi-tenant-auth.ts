/**
 * Multi-Tenant Authentication Utilities
 * Production-ready authentication with proper business isolation
 */

import { getCurrentBusinessId, getAuthenticatedUser } from './auth-utils'

export interface BusinessAuthResult {
  isAuthenticated: boolean
  businessId: string | null
  businessName: string | null
  email: string | null
  isDemoMode: boolean
}

/**
 * Get authenticated business with multi-tenant safety checks
 */
export function getAuthenticatedBusiness(): BusinessAuthResult {
  const user = getAuthenticatedUser()
  const businessId = getCurrentBusinessId()
  
  // Check if user is properly authenticated
  if (user && businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    return {
      isAuthenticated: true,
      businessId: user.businessId,
      businessName: user.businessName,
      email: user.email,
      isDemoMode: false
    }
  }
  
  // Check if in demo mode (development only)
  if (process.env.NODE_ENV === 'development' && businessId === '00000000-0000-0000-0000-000000000000') {
    return {
      isAuthenticated: false,
      businessId: businessId,
      businessName: 'Demo Beauty Salon',
      email: 'demo@example.com',
      isDemoMode: true
    }
  }
  
  // Not authenticated
  return {
    isAuthenticated: false,
    businessId: null,
    businessName: null,
    email: null,
    isDemoMode: false
  }
}

/**
 * Require authentication for multi-tenant operations
 * Throws error if not properly authenticated in production
 */
export function requireAuthentication(): BusinessAuthResult {
  const auth = getAuthenticatedBusiness()
  
  // Production: Must be authenticated
  if (process.env.NODE_ENV === 'production' && !auth.isAuthenticated) {
    throw new Error('Authentication required for multi-tenant operation')
  }
  
  // Development: Allow demo mode
  if (process.env.NODE_ENV === 'development' && (auth.isAuthenticated || auth.isDemoMode)) {
    return auth
  }
  
  throw new Error('Authentication required')
}

/**
 * Get business ID with multi-tenant safety
 * Returns null if not properly authenticated (production)
 */
export function getSecureBusinessId(): string | null {
  const auth = getAuthenticatedBusiness()
  
  if (auth.isAuthenticated) {
    return auth.businessId
  }
  
  // Development only: allow demo business
  if (process.env.NODE_ENV === 'development' && auth.isDemoMode) {
    return auth.businessId
  }
  
  return null
}

/**
 * Check if current user has access to specific business ID
 */
export function hasBusinessAccess(businessId: string): boolean {
  const auth = getAuthenticatedBusiness()
  
  // Must be authenticated and business IDs must match
  if (auth.isAuthenticated) {
    return auth.businessId === businessId
  }
  
  // Development: allow demo business access
  if (process.env.NODE_ENV === 'development' && auth.isDemoMode) {
    return businessId === '00000000-0000-0000-0000-000000000000'
  }
  
  return false
}

/**
 * Redirect to login if not authenticated
 */
export function redirectToLoginIfUnauthenticated(): boolean {
  const auth = getAuthenticatedBusiness()
  
  if (!auth.isAuthenticated && !auth.isDemoMode) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return true
  }
  
  return false
}