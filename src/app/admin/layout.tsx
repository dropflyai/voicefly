import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

async function getAdminUser() {
  try {
    const cookieStore = await cookies()
    // Try to get the session from Supabase cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Look for auth token in cookies
    const allCookies = cookieStore.getAll()
    let token: string | null = null

    for (const cookie of allCookies) {
      if (cookie.name.includes('auth-token') || cookie.name.includes('access-token')) {
        try {
          const parsed = JSON.parse(cookie.value)
          if (Array.isArray(parsed) && parsed[0]) { token = parsed[0]; break }
        } catch {
          token = cookie.value; break
        }
      }
    }

    if (!token) return null

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return null
    if (user.email !== process.env.ADMIN_EMAIL) return null
    return user
  } catch {
    return null
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg">VoiceFly Admin</span>
        <a href="/admin" className="text-sm text-gray-300 hover:text-white transition-colors">Stats</a>
        <a href="/admin/conversations" className="text-sm text-gray-300 hover:text-white transition-colors">Conversations</a>
        <a href="/admin/insights" className="text-sm text-gray-300 hover:text-white transition-colors">Insights</a>
        <span className="ml-auto text-xs text-gray-500">{user.email}</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
