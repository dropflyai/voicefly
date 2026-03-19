'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function setupDashboardSession(userId: string, email: string) {
  // Look up the user's business (same logic as AuthService.login)
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

  // Set the localStorage keys the dashboard expects
  localStorage.setItem('authenticated_business_id', primary.id)
  localStorage.setItem('authenticated_user_email', email)
  localStorage.setItem('authenticated_business_name', primary.name)

  return true
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error || !data.session) {
          console.error('[AuthCallback] Error exchanging code:', error?.message)
          router.replace('/login?error=auth_failed')
          return
        }

        const user = data.session.user
        const ok = await setupDashboardSession(user.id, user.email || '')

        if (!ok) {
          // No business found — send to onboarding
          router.replace('/onboarding')
        } else {
          router.replace('/dashboard')
        }
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/dashboard' : '/login')
      })
    }
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
