/**
 * Session Management with Timeout and Refresh
 * Implements automatic session timeout for security
 */

import { supabase } from './supabase-client'
import AuditLogger, { AuditEventType } from './audit-logger'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes of inactivity
const SESSION_WARNING = 5 * 60 * 1000 // Warn 5 minutes before timeout
const REFRESH_INTERVAL = 5 * 60 * 1000 // Refresh token every 5 minutes

interface SessionState {
  lastActivity: number
  warningShown: boolean
  timeoutId?: NodeJS.Timeout
  refreshIntervalId?: NodeJS.Timeout
}

class SessionManager {
  private static state: SessionState = {
    lastActivity: Date.now(),
    warningShown: false
  }

  /**
   * Initialize session management
   * Call this on app mount
   */
  static async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    // Check if user is authenticated before starting session management
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        // No active session - don't start session management
        // This is normal for public pages (homepage, pricing, etc.)
        return
      }

      // User is authenticated - start session management
      this.setupActivityListeners()
      this.startTimeoutMonitor()
      this.startTokenRefresh()

      console.log('✅ Session manager initialized')
    } catch (error) {
      // Silently fail - user is not authenticated
      // This is expected on public pages
      return
    }
  }

  /**
   * Setup event listeners for user activity
   */
  private static setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), { passive: true })
    })
  }

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    this.state.lastActivity = Date.now()
    this.state.warningShown = false
  }

  /**
   * Start monitoring for session timeout
   */
  private static startTimeoutMonitor(): void {
    // Check every minute
    this.state.timeoutId = setInterval(() => {
      this.checkTimeout()
    }, 60 * 1000)
  }

  /**
   * Check if session should timeout
   */
  private static async checkTimeout(): Promise<void> {
    const now = Date.now()
    const timeSinceActivity = now - this.state.lastActivity
    const timeUntilTimeout = SESSION_TIMEOUT - timeSinceActivity

    // Show warning 5 minutes before timeout
    if (timeUntilTimeout <= SESSION_WARNING && !this.state.warningShown) {
      this.showTimeoutWarning(timeUntilTimeout)
      this.state.warningShown = true
    }

    // Timeout reached
    if (timeSinceActivity >= SESSION_TIMEOUT) {
      await this.timeoutSession()
    }
  }

  /**
   * Show timeout warning to user
   */
  private static showTimeoutWarning(timeLeft: number): void {
    const minutes = Math.ceil(timeLeft / 60000)

    // Custom event for UI to listen to
    window.dispatchEvent(new CustomEvent('session-timeout-warning', {
      detail: { minutesLeft: minutes }
    }))

    console.warn(`⚠️  Session will timeout in ${minutes} minute(s)`)

    // You can show a toast/modal here
    if (typeof window !== 'undefined' && window.confirm) {
      const extend = window.confirm(
        `Your session will expire in ${minutes} minute(s) due to inactivity. Click OK to stay logged in.`
      )

      if (extend) {
        this.updateActivity()
        this.refreshSession()
      }
    }
  }

  /**
   * Timeout the session
   */
  private static async timeoutSession(): Promise<void> {
    console.log('🔒 Session timed out due to inactivity')

    try {
      // Get current user before logout
      const { data: { user } } = await supabase.auth.getUser()

      // Log timeout event
      if (user) {
        await AuditLogger.log({
          event_type: AuditEventType.LOGOUT,
          user_id: user.id,
          metadata: { reason: 'session_timeout' },
          severity: 'low'
        })
      }

      // Sign out
      await supabase.auth.signOut()
    } catch (error) {
      // Handle error gracefully
      console.error('Error during session timeout:', error)
    }

    // Clear intervals
    this.cleanup()

    // Redirect to login
    window.location.href = '/login?reason=timeout'
  }

  /**
   * Manually refresh the session
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Session refresh failed:', error)
        return false
      }

      this.updateActivity()
      console.log('✅ Session refreshed')
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      return false
    }
  }

  /**
   * Start automatic token refresh
   */
  private static startTokenRefresh(): void {
    this.state.refreshIntervalId = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          // No active session - stop token refresh
          this.cleanup()
          return
        }

        await this.refreshSession()
      } catch (error) {
        // Handle error gracefully
        console.error('Token refresh check failed:', error)
      }
    }, REFRESH_INTERVAL)
  }

  /**
   * Extend session (call on important user actions)
   */
  static async extendSession(): Promise<void> {
    this.updateActivity()
    await this.refreshSession()
  }

  /**
   * Clean up timers
   */
  static cleanup(): void {
    if (this.state.timeoutId) {
      clearInterval(this.state.timeoutId)
    }
    if (this.state.refreshIntervalId) {
      clearInterval(this.state.refreshIntervalId)
    }
  }

  /**
   * Get time until session timeout
   */
  static getTimeUntilTimeout(): number {
    const timeSinceActivity = Date.now() - this.state.lastActivity
    return Math.max(0, SESSION_TIMEOUT - timeSinceActivity)
  }

  /**
   * Check if session is active
   */
  static isSessionActive(): boolean {
    return this.getTimeUntilTimeout() > 0
  }

  /**
   * Get session configuration
   */
  static getConfig(): {
    timeoutMinutes: number
    warningMinutes: number
    refreshMinutes: number
  } {
    return {
      timeoutMinutes: SESSION_TIMEOUT / 60000,
      warningMinutes: SESSION_WARNING / 60000,
      refreshMinutes: REFRESH_INTERVAL / 60000
    }
  }
}

export default SessionManager

// Export for use in _app.tsx or layout.tsx
export const initializeSessionManager = async () => {
  if (typeof window !== 'undefined') {
    await SessionManager.initialize()
  }
}
