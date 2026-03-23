'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

async function setupDashboardSession(userId: string, email: string): Promise<boolean> {
  const { data: businessUsers } = await supabase
    .from('business_users')
    .select('business_id, role, businesses:business_id(id, name)')
    .eq('user_id', userId)

  if (!businessUsers || businessUsers.length === 0) return false

  const businesses = businessUsers.map((bu: any) => ({
    id: bu.businesses.id,
    name: bu.businesses.name,
    role: bu.role,
  }))

  const primary = businesses.find((b: any) => b.role === 'owner') || businesses[0]

  localStorage.setItem('authenticated_business_id', primary.id)
  localStorage.setItem('authenticated_user_email', email)
  localStorage.setItem('authenticated_business_name', primary.name)

  return true
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    // Log what we received for debugging
    console.log('[AuthCallback] URL:', window.location.href)
    console.log('[AuthCallback] Search:', window.location.search)
    console.log('[AuthCallback] Hash:', window.location.hash ? '(has hash)' : '(no hash)')

    // Supabase auto-detects tokens in URL (hash for implicit, code for PKCE).
    // Poll getSession() until the session is available.
    let attempts = 0
    const maxAttempts = 30 // 7.5 seconds max

    const interval = setInterval(async () => {
      if (handled.current) return
      attempts++

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        handled.current = true
        clearInterval(interval)
        console.log('[AuthCallback] Session found for:', session.user.email)
        const ok = await setupDashboardSession(session.user.id, session.user.email || '')
        router.replace(ok ? '/dashboard' : '/onboarding')
      } else if (attempts >= maxAttempts) {
        handled.current = true
        clearInterval(interval)
        console.error('[AuthCallback] Timed out waiting for session')
        router.replace('/login?error=auth_timeout')
      }
    }, 250)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
