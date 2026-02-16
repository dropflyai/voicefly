'use client'

import { clsx } from 'clsx'

interface StateDisplayProps {
  type: 'empty' | 'error' | 'success' | 'info' | 'warning'
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Professional State Display Component
 *
 * Used to show empty states, error states, success messages, etc.
 * Follows enterprise design principles.
 */
export function StateDisplay({
  type,
  title,
  description,
  icon,
  action,
  className,
  size = 'md'
}: StateDisplayProps) {
  const sizeClasses = {
    sm: 'py-6 px-4',
    md: 'py-12 px-6',
    lg: 'py-16 px-8'
  }

  const iconSizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const typeConfig = {
    empty: {
      bgColor: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-400',
      titleColor: 'text-gray-900',
      descColor: 'text-gray-500',
      defaultIcon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      descColor: 'text-red-700',
      defaultIcon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      descColor: 'text-green-700',
      defaultIcon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      descColor: 'text-blue-700',
      defaultIcon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      descColor: 'text-amber-700',
      defaultIcon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    }
  }

  const config = typeConfig[type]

  return (
    <div
      className={clsx(
        'rounded-lg border text-center',
        config.bgColor,
        type === 'empty' ? 'border-gray-200' : 'border-transparent',
        sizeClasses[size],
        className
      )}
    >
      <div
        className={clsx(
          'mx-auto rounded-full flex items-center justify-center',
          config.iconBg,
          config.iconColor,
          iconSizeClasses[size]
        )}
      >
        {icon || config.defaultIcon}
      </div>

      <h3
        className={clsx(
          'mt-4 font-medium',
          config.titleColor,
          titleSizeClasses[size]
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={clsx(
            'mt-1.5',
            config.descColor,
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          <button
            onClick={action.onClick}
            className={clsx(
              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              action.variant === 'secondary'
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                : type === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Empty state for tables/lists
 */
export function EmptyState({
  title = 'No data found',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
  icon
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}) {
  return (
    <StateDisplay
      type="empty"
      title={title}
      description={description}
      icon={icon}
      action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined}
    />
  )
}

/**
 * Inline error state
 */
export function InlineError({
  title = 'Error loading data',
  description,
  onRetry
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <StateDisplay
      type="error"
      title={title}
      description={description || 'Please try again or contact support if the problem persists.'}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
      size="sm"
    />
  )
}

/**
 * Loading state with message
 */
export function LoadingState({
  message = 'Loading...',
  description
}: {
  message?: string
  description?: string
}) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto h-12 w-12 relative">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <h3 className="mt-4 text-base font-medium text-gray-900">{message}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}

/**
 * Success toast/banner
 */
export function SuccessBanner({
  message,
  onDismiss
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Error banner
 */
export function ErrorBanner({
  message,
  onDismiss,
  onRetry
}: {
  message: string
  onDismiss?: () => void
  onRetry?: () => void
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-800">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default StateDisplay
