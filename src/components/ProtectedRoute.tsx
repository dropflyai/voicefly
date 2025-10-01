'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getAuthenticatedUser } from '../lib/auth-utils'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      
      if (!authenticated) {
        console.log('❌ Not authenticated, redirecting to login')
        router.push('/login')
        return
      }
      
      const user = getAuthenticatedUser()
      console.log('✅ Authenticated user:', user?.businessName)
      setIsAuthed(true)
      setIsLoading(false)
    }

    // Small delay to prevent flash
    setTimeout(checkAuth, 100)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return null // Will redirect to login
  }

  return <>{children}</>
}