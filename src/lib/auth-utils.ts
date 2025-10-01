// Simple authentication utilities
'use client'

export interface AuthUser {
  businessId: string
  businessName: string
  email: string
  businessType?: string
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const businessId = localStorage.getItem('authenticated_business_id')
  const email = localStorage.getItem('authenticated_user_email')
  
  return !!(businessId && email)
}

export function getAuthenticatedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  const businessId = localStorage.getItem('authenticated_business_id')
  const businessName = localStorage.getItem('authenticated_business_name')
  const email = localStorage.getItem('authenticated_user_email')
  const businessType = localStorage.getItem('authenticated_business_type')
  
  if (!businessId || !email) return null
  
  return {
    businessId,
    businessName: businessName || 'Your Business',
    email,
    businessType: businessType || undefined
  }
}

export function logout() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('authenticated_business_id')
  localStorage.removeItem('authenticated_business_name')
  localStorage.removeItem('authenticated_user_email')
  localStorage.removeItem('demo_business_id')
  
  window.location.href = '/login'
}

export function getCurrentBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  
  // Check if user is properly authenticated
  const authBusinessId = localStorage.getItem('authenticated_business_id')
  if (authBusinessId) {
    return authBusinessId
  }
  
  // For development/testing only: use neutral demo business
  if (process.env.NODE_ENV === 'development') {
    return localStorage.getItem('demo_business_id') || process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || null
  }
  
  // Production: Force proper authentication, no fallbacks
  return null
}