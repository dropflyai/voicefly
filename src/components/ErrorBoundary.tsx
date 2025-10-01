'use client'

import React from 'react'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../lib/error-tracking'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorId: string; retry: () => void }>
  category?: string
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorTracker = ErrorTracker.getInstance()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = Math.random().toString(36).substr(2, 9)
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // Track the error
    this.errorTracker.trackError(
      error,
      ErrorCategory.DASHBOARD,
      ErrorSeverity.HIGH,
      {
        businessId: this.getBusinessId(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        metadata: {
          errorId,
          component: this.props.category || 'unknown',
          errorInfo: errorInfo.componentStack,
        }
      }
    )

    console.error('Error Boundary caught error:', error, errorInfo)
  }

  private getBusinessId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    return localStorage.getItem('authenticated_business_id') || undefined
  }

  private retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props
      
      if (Fallback && this.state.error && this.state.errorId) {
        return <Fallback error={this.state.error} errorId={this.state.errorId} retry={this.retry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We've been notified of this error. Please try refreshing the page.
            </p>
            <div className="space-x-4">
              <button
                onClick={this.retry}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}