'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, ChevronRightIcon, SparklesIcon, ExclamationTriangleIcon, TrophyIcon, CurrencyDollarIcon, StarIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: 'activation' | 'warning' | 'success' | 'roi'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  cta?: {
    text: string
    action: string
  }
  dismissible: boolean
  icon?: React.ReactNode
  color?: string
}

interface DashboardNotificationsProps {
  businessId: string
  planTier: 'starter' | 'professional' | 'business'
  billingStartDate?: Date
  onNotificationClick?: (action: string) => void
}

export default function DashboardNotifications({
  businessId,
  planTier,
  billingStartDate,
  onNotificationClick
}: DashboardNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Load notifications based on billing status and feature usage
    loadNotifications()
  }, [businessId, planTier, billingStartDate])

  const loadNotifications = async () => {
    // In production, this would fetch from the database
    const mockNotifications = generateNotifications(planTier, billingStartDate)
    
    // Filter out dismissed notifications
    const activeNotifications = mockNotifications.filter(n => !dismissedIds.includes(n.id))
    
    // Sort by priority
    const sorted = activeNotifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    setNotifications(sorted)
  }

  const generateNotifications = (tier: string, billingDate?: Date): Notification[] => {
    const notifications: Notification[] = []
    const daysSinceBilling = billingDate 
      ? Math.floor((Date.now() - billingDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Day 1: Activation celebration
    if (daysSinceBilling === 1) {
      notifications.push({
        id: 'billing-activated',
        type: 'success',
        priority: 'high',
        title: '🎉 Your Subscription is Active!',
        message: `Welcome to the ${tier} plan! Your AI assistant is ready to start taking bookings 24/7.`,
        cta: {
          text: 'Make Your First Test Call',
          action: 'test-call'
        },
        dismissible: false,
        icon: <TrophyIcon className="w-5 h-5" />,
        color: 'bg-green-50 border-green-500'
      })
    }

    // Day 3-7: Feature discovery based on tier
    if (daysSinceBilling >= 3 && daysSinceBilling <= 7) {
      if (tier === 'starter') {
        notifications.push({
          id: 'forward-phone',
          type: 'activation',
          priority: 'high',
          title: 'Ready to Forward Your Business Number?',
          message: 'You\'ve tested your AI - now start capturing real bookings by forwarding your business line.',
          cta: {
            text: 'Setup Phone Forwarding',
            action: 'phone-forwarding'
          },
          dismissible: false,
          icon: <SparklesIcon className="w-5 h-5" />,
          color: 'bg-blue-50 border-blue-500'
        })
      }

      if (tier === 'professional' || tier === 'business') {
        notifications.push({
          id: 'payment-processing',
          type: 'activation',
          priority: 'high',
          title: '💳 Payment Processing Available',
          message: 'Reduce no-shows by 70% with automatic payment collection. You\'re already paying for it!',
          cta: {
            text: 'Activate Payments',
            action: 'payment-setup'
          },
          dismissible: false,
          icon: <CurrencyDollarIcon className="w-5 h-5" />,
          color: 'bg-purple-50 border-purple-500'
        })

        notifications.push({
          id: 'loyalty-program',
          type: 'activation',
          priority: 'medium',
          title: '🎁 Launch Your Loyalty Program',
          message: 'Turn customers into regulars with automated rewards. Increases visit frequency by 35%.',
          cta: {
            text: 'Setup Loyalty Program',
            action: 'loyalty-setup'
          },
          dismissible: true,
          icon: <StarIcon className="w-5 h-5" />,
          color: 'bg-yellow-50 border-yellow-500'
        })
      }

      if (tier === 'business') {
        notifications.push({
          id: 'multi-location',
          type: 'activation',
          priority: 'medium',
          title: '📍 Add Your Other Locations',
          message: 'You have 3 locations included. Centralize management and scale your success.',
          cta: {
            text: 'Add Location',
            action: 'add-location'
          },
          dismissible: true,
          icon: <BuildingOffice2Icon className="w-5 h-5" />,
          color: 'bg-indigo-50 border-indigo-500'
        })
      }
    }

    // Day 14+: Unused feature warnings
    if (daysSinceBilling >= 14) {
      notifications.push({
        id: 'unused-features-warning',
        type: 'warning',
        priority: 'high',
        title: '⚠️ You\'re Paying for Unused Features',
        message: `You\'ve invested $${tier === 'starter' ? 67 : tier === 'professional' ? 147 : 297}/month but haven\'t activated key features.`,
        cta: {
          text: 'Get Setup Help',
          action: 'request-help'
        },
        dismissible: false,
        icon: <ExclamationTriangleIcon className="w-5 h-5" />,
        color: 'bg-red-50 border-red-500'
      })
    }

    // ROI demonstration (always show)
    if (daysSinceBilling >= 7) {
      const roiAmount = tier === 'starter' ? 800 : tier === 'professional' ? 2000 : 5000
      notifications.push({
        id: 'roi-potential',
        type: 'roi',
        priority: 'medium',
        title: `💰 Potential Revenue: $${roiAmount}/month`,
        message: 'Based on similar businesses using all features. Let us show you how.',
        cta: {
          text: 'See ROI Breakdown',
          action: 'roi-calculator'
        },
        dismissible: true,
        icon: <CurrencyDollarIcon className="w-5 h-5" />,
        color: 'bg-green-50 border-green-500'
      })
    }

    return notifications
  }

  const handleNotificationClick = (action: string) => {
    // Route to appropriate setup page
    const routes: Record<string, string> = {
      'test-call': '/dashboard/test-call',
      'phone-forwarding': '/dashboard/settings/phone',
      'payment-setup': '/dashboard/payments/processors',
      'loyalty-setup': '/dashboard/loyalty',
      'add-location': '/dashboard/locations',
      'request-help': '/dashboard/support',
      'roi-calculator': '/dashboard/analytics/roi'
    }

    if (routes[action]) {
      router.push(routes[action])
    } else if (onNotificationClick) {
      onNotificationClick(action)
    }
  }

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id])
    setNotifications(notifications.filter(n => n.id !== id))
    
    // Save to localStorage or database
    localStorage.setItem(`dismissed-notifications-${businessId}`, JSON.stringify([...dismissedIds, id]))
  }

  if (notifications.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {/* High priority notification banner */}
      {notifications.filter(n => n.priority === 'high').map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border-2 p-4 ${notification.color || 'bg-blue-50 border-blue-500'}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-grow">
              <div className={`flex-shrink-0 ${
                notification.type === 'warning' ? 'text-red-600' :
                notification.type === 'success' ? 'text-green-600' :
                notification.type === 'roi' ? 'text-green-600' :
                'text-blue-600'
              }`}>
                {notification.icon || <SparklesIcon className="w-5 h-5" />}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  {notification.message}
                </p>
                {notification.cta && (
                  <button
                    onClick={() => handleNotificationClick(notification.cta!.action)}
                    className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      notification.type === 'warning' 
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : notification.type === 'success'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {notification.cta.text}
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
            {notification.dismissible && (
              <button
                onClick={() => handleDismiss(notification.id)}
                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Medium/Low priority notifications (collapsed) */}
      {notifications.filter(n => n.priority !== 'high').length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">
            📋 Recommended Actions ({notifications.filter(n => n.priority !== 'high').length})
          </h5>
          <div className="space-y-2">
            {notifications.filter(n => n.priority !== 'high').map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500">
                    {notification.icon || <SparklesIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.cta && (
                    <button
                      onClick={() => handleNotificationClick(notification.cta!.action)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {notification.cta.text}
                    </button>
                  )}
                  {notification.dismissible && (
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Import for missing icon
