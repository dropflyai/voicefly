'use client'

import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'

interface PaymentStatusBadgeProps {
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function PaymentStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true 
}: PaymentStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      icon: ClockIcon,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    processing: {
      label: 'Processing',
      icon: ArrowPathIcon,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    paid: {
      label: 'Paid',
      icon: CheckCircleIcon,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    failed: {
      label: 'Failed',
      icon: XCircleIcon,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    refunded: {
      label: 'Refunded',
      icon: ArrowPathIcon,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-600'
    },
    partially_refunded: {
      label: 'Partial Refund',
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600'
    }
  }

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      container: 'px-2.5 py-0.5 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      container: 'px-3 py-1 text-sm',
      icon: 'h-5 w-5'
    }
  }

  const statusConfig = config[status]
  const sizeConfig = sizeClasses[size]
  const Icon = statusConfig.icon

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${sizeConfig.container}`}>
      {showIcon && (
        <Icon className={`mr-1 ${statusConfig.iconColor} ${sizeConfig.icon}`} />
      )}
      {statusConfig.label}
    </span>
  )
}