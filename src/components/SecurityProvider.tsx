'use client'

import { useEffect } from 'react'
import { initializeSessionManager } from '@/lib/session-manager'
import SessionTimeoutWarning from './SessionTimeoutWarning'

interface SecurityProviderProps {
  children: React.ReactNode
}

/**
 * Security Provider Component
 * Initializes all security features:
 * - Session timeout monitoring
 * - Auto token refresh
 * - Activity tracking
 */
export default function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Initialize session manager on mount (async)
    initializeSessionManager().then(() => {
      // Only log if session was actually initialized (user is logged in)
      // If user is not logged in, session manager won't start
    }).catch((error) => {
      // Silently handle errors - expected on public pages
      console.debug('Session manager initialization skipped (no active session)')
    })
  }, [])

  return (
    <>
      {/* Session timeout warning UI */}
      <SessionTimeoutWarning />

      {/* App content */}
      {children}
    </>
  )
}
