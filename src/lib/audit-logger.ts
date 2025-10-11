/**
 * Audit Logging System
 * Tracks all security-critical events for compliance and threat detection
 */

import { supabase } from './supabase-client'

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  SIGNUP = 'auth.signup',
  PASSWORD_RESET_REQUEST = 'auth.password_reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password_reset.complete',

  // Authorization events
  PERMISSION_DENIED = 'authz.permission.denied',
  ROLE_CHANGED = 'authz.role.changed',

  // Data access events
  SENSITIVE_DATA_ACCESSED = 'data.sensitive.accessed',
  BULK_EXPORT = 'data.bulk.export',

  // Security events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  WEBHOOK_VERIFICATION_FAILED = 'security.webhook.verification_failed',

  // Account management
  ACCOUNT_DELETED = 'account.deleted',
  BUSINESS_CREATED = 'business.created',
  USER_INVITED = 'user.invited',

  // API events
  API_KEY_CREATED = 'api.key.created',
  API_KEY_REVOKED = 'api.key.revoked',

  // Credit/Billing events
  CREDIT_DEDUCTED = 'billing.credit.deducted',
  CREDIT_PURCHASED = 'billing.credit.purchased',
  CREDIT_RESET = 'billing.credit.reset'
}

export interface AuditLog {
  event_type: AuditEventType
  user_id?: string
  business_id?: string
  ip_address?: string
  user_agent?: string
  resource_type?: string
  resource_id?: string
  metadata?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

class AuditLogger {
  /**
   * Log a security audit event
   */
  static async log(event: Omit<AuditLog, 'timestamp'>): Promise<void> {
    try {
      const logEntry: AuditLog = {
        ...event,
        timestamp: new Date().toISOString()
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 AUDIT LOG:', logEntry)
      }

      // Store in database (create audit_logs table in Supabase)
      const { error } = await supabase
        .from('audit_logs')
        .insert(logEntry)

      if (error && error.code !== '42P01') { // Ignore table doesn't exist error
        console.error('Failed to write audit log:', error)
      }

      // For critical events, trigger alerts
      if (event.severity === 'critical') {
        await this.triggerAlert(logEntry)
      }
    } catch (error) {
      // Never let logging errors break the application
      console.error('Audit logging error:', error)
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    eventType: AuditEventType,
    userId: string | undefined,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      event_type: eventType,
      user_id: userId,
      metadata,
      severity: eventType.includes('failed') ? 'high' : 'medium'
    })
  }

  /**
   * Log failed login attempts (potential brute force)
   */
  static async logFailedLogin(
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.LOGIN_FAILED,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { email, reason: 'invalid_credentials' },
      severity: 'high'
    })

    // Check for brute force attack
    await this.checkBruteForce(ipAddress, email)
  }

  /**
   * Log rate limit violations
   */
  static async logRateLimitExceeded(
    ipAddress: string,
    endpoint: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.RATE_LIMIT_EXCEEDED,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { endpoint },
      severity: 'medium'
    })
  }

  /**
   * Log webhook verification failures
   */
  static async logWebhookVerificationFailed(
    source: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.WEBHOOK_VERIFICATION_FAILED,
      ip_address: ipAddress,
      metadata: { source },
      severity: 'critical'
    })
  }

  /**
   * Log permission denied events
   */
  static async logPermissionDenied(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.PERMISSION_DENIED,
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: { action },
      severity: 'medium'
    })
  }

  /**
   * Detect brute force attacks
   */
  private static async checkBruteForce(
    ipAddress: string,
    email: string
  ): Promise<void> {
    // Query failed logins in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    try {
      const { data: recentFailures } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', AuditEventType.LOGIN_FAILED)
        .eq('ip_address', ipAddress)
        .gte('timestamp', fiveMinutesAgo)

      // More than 5 failures in 5 minutes = brute force
      if (recentFailures && recentFailures.length >= 5) {
        await this.log({
          event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
          ip_address: ipAddress,
          metadata: {
            reason: 'brute_force_detected',
            failed_attempts: recentFailures.length,
            target_email: email
          },
          severity: 'critical'
        })
      }
    } catch (error) {
      console.error('Brute force check error:', error)
    }
  }

  /**
   * Trigger alerts for critical events
   */
  private static async triggerAlert(logEntry: AuditLog): Promise<void> {
    // In production, send to Sentry, PagerDuty, Slack, etc.
    console.error('🚨 CRITICAL SECURITY EVENT:', logEntry)

    // TODO: Integrate with alerting system
    // - Send to Sentry
    // - Post to Slack security channel
    // - Trigger PagerDuty incident
    // - Send email to security team
  }

  /**
   * Get audit logs for a user (for compliance/GDPR)
   */
  static async getUserAuditLog(userId: string, limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }

    return data as AuditLog[]
  }

  /**
   * Get recent security events (for security dashboard)
   */
  static async getSecurityEvents(
    businessId: string,
    hoursAgo = 24
  ): Promise<AuditLog[]> {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .in('severity', ['high', 'critical'])
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Failed to fetch security events:', error)
      return []
    }

    return data as AuditLog[]
  }
}

// Convenience export for named imports
export const logAuditEvent = AuditLogger.log

export default AuditLogger
