/**
 * Error Tracking & Monitoring System
 * Production-ready error handling and monitoring infrastructure
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Configuration
const MONITORING_CONFIG = {
  // Enable/disable monitoring features
  errorTracking: isProduction,
  performanceMonitoring: isProduction,
  userAnalytics: isProduction,
  debugLogging: isDevelopment,
  
  // Error reporting thresholds
  criticalErrorThreshold: 5, // errors per minute
  warningThreshold: 10, // errors per hour
  
  // Performance thresholds
  slowQueryThreshold: 1000, // milliseconds
  slowPageLoadThreshold: 3000, // milliseconds
}

// Error categories for better organization
export enum ErrorCategory {
  DATABASE = 'database',
  API = 'api', 
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  VAPI_INTEGRATION = 'vapi_integration',
  WEBHOOK = 'webhook',
  ONBOARDING = 'onboarding',
  DASHBOARD = 'dashboard',
  MAYA_JOB = 'maya_job',
  AGENT_PROVISIONING = 'agent_provisioning'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error context interface
export interface ErrorContext {
  userId?: string
  businessId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  referrer?: string
  timestamp?: string
  metadata?: Record<string, any>
}

// Error tracking class
export class ErrorTracker {
  private static instance: ErrorTracker
  private errorQueue: Array<any> = []
  private performanceQueue: Array<any> = []

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  /**
   * Track application errors with context
   */
  trackError(
    error: Error | string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {}
  ) {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      category,
      severity,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }
    }

    // Log to console in development
    if (MONITORING_CONFIG.debugLogging) {
      console.error(`[${severity.toUpperCase()}] ${category}:`, errorData)
    }

    // Queue for batch sending in production
    if (MONITORING_CONFIG.errorTracking) {
      this.errorQueue.push(errorData)
      
      // Send immediately for critical errors
      if (severity === ErrorSeverity.CRITICAL) {
        this.flushErrors()
      }
    }

    // Send to external monitoring service (Sentry, LogRocket, etc.)
    this.sendToMonitoringService(errorData)
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    metric: string,
    value: number,
    unit: 'ms' | 'count' | 'bytes' = 'ms',
    context: ErrorContext = {}
  ) {
    const performanceData = {
      metric,
      value,
      unit,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      }
    }

    if (MONITORING_CONFIG.performanceMonitoring) {
      this.performanceQueue.push(performanceData)

      // Log slow operations
      if (metric.includes('query') && value > MONITORING_CONFIG.slowQueryThreshold) {
        this.trackError(
          `Slow ${metric}: ${value}ms`,
          ErrorCategory.DATABASE,
          ErrorSeverity.MEDIUM,
          context
        )
      }
    }

    if (MONITORING_CONFIG.debugLogging) {
      console.log(`[PERF] ${metric}: ${value}${unit}`)
    }
  }

  /**
   * Track user actions and events
   */
  trackEvent(
    event: string,
    properties: Record<string, any> = {},
    context: ErrorContext = {}
  ) {
    if (!MONITORING_CONFIG.userAnalytics) return

    const eventData = {
      event,
      properties,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      }
    }

    // Log important events in development
    if (MONITORING_CONFIG.debugLogging && event.includes('error')) {
      console.log(`[EVENT] ${event}:`, eventData)
    }

    // Send to analytics service
    this.sendToAnalyticsService(eventData)
  }

  /**
   * Flush queued errors to monitoring service
   */
  private async flushErrors() {
    if (this.errorQueue.length === 0) return

    try {
      // Send to monitoring endpoint
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: this.errorQueue,
          timestamp: new Date().toISOString(),
        }),
      })

      // Clear queue after successful send
      this.errorQueue = []
    } catch (error) {
      console.error('Failed to flush errors to monitoring service:', error)
    }
  }

  /**
   * Send to external monitoring service (implement your service here)
   */
  private sendToMonitoringService(errorData: any) {
    // Implement Sentry, LogRocket, or other monitoring service integration
    // Example for Sentry:
    // Sentry.captureException(new Error(errorData.message), {
    //   tags: {
    //     category: errorData.category,
    //     severity: errorData.severity,
    //   },
    //   extra: errorData.context,
    // })
  }

  /**
   * Send to analytics service
   */
  private sendToAnalyticsService(eventData: any) {
    // Implement analytics service integration
    // Example: Mixpanel, Segment, Google Analytics
  }
}

// Convenience functions for common error tracking
export const errorTracker = ErrorTracker.getInstance()

// Database error tracking
export const trackDatabaseError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.DATABASE, ErrorSeverity.HIGH, context)
}

// API error tracking
export const trackAPIError = (error: Error, endpoint: string, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.API, ErrorSeverity.MEDIUM, {
    ...context,
    metadata: {
      ...context.metadata,
      endpoint,
    },
  })
}

// Authentication error tracking
export const trackAuthError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context)
}

// Payment error tracking
export const trackPaymentError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.PAYMENT, ErrorSeverity.CRITICAL, context)
}

// VAPI integration error tracking
export const trackVAPIError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.VAPI_INTEGRATION, ErrorSeverity.HIGH, context)
}

// Maya job system error tracking
export const trackMayaJobError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.trackError(error, ErrorCategory.MAYA_JOB, ErrorSeverity.HIGH, context)
}

// Performance tracking helpers
export const trackPageLoad = (loadTime: number, page: string) => {
  errorTracker.trackPerformance(`page_load_${page}`, loadTime, 'ms', { 
    metadata: { page } 
  })
}

export const trackDatabaseQuery = (queryTime: number, query: string) => {
  errorTracker.trackPerformance(`database_query`, queryTime, 'ms', { 
    metadata: { query } 
  })
}

export const trackAPICall = (responseTime: number, endpoint: string) => {
  errorTracker.trackPerformance(`api_call_${endpoint}`, responseTime, 'ms', { 
    metadata: { endpoint } 
  })
}

// Event tracking helpers
export const trackUserAction = (action: string, properties: Record<string, any> = {}) => {
  errorTracker.trackEvent(`user_${action}`, properties)
}

export const trackBusinessAction = (action: string, businessId: string, properties: Record<string, any> = {}) => {
  errorTracker.trackEvent(`business_${action}`, properties, { businessId })
}

// Health check monitoring
export const trackHealthCheck = (service: string, status: 'healthy' | 'degraded' | 'down', responseTime?: number) => {
  errorTracker.trackEvent(`health_check_${service}`, {
    status,
    responseTime,
  })

  if (status === 'down') {
    errorTracker.trackError(
      `Service ${service} is down`,
      ErrorCategory.API,
      ErrorSeverity.CRITICAL,
      { 
        metadata: { service }
      }
    )
  }
}

// Initialize error tracking
if (typeof window !== 'undefined') {
  // Browser-side initialization
  window.addEventListener('error', (event) => {
    errorTracker.trackError(
      event.error || event.message,
      ErrorCategory.DASHBOARD,
      ErrorSeverity.MEDIUM,
      {
        metadata: {
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString(),
        }
      }
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(
      event.reason,
      ErrorCategory.DASHBOARD,
      ErrorSeverity.HIGH,
      {
        metadata: {
          type: 'unhandled_promise_rejection',
        }
      }
    )
  })

  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        trackPageLoad(navigation.loadEventEnd - navigation.fetchStart, window.location.pathname)
      }
    })
  }
}

export default ErrorTracker