'use client'

import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon, 
  XMarkIcon, 
  ArrowUpIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { SubscriptionManager } from '../lib/subscription-manager'
import UpgradeFlow from './UpgradeFlow'

interface UsageAlertsProps {
  businessId: string
  currentPlan: string
}

interface Alert {
  type: 'warning' | 'limit' | 'overage'
  message: string
  action?: string
}

export default function UsageAlerts({ businessId, currentPlan }: UsageAlertsProps) {
  const [subscriptionManager] = useState(new SubscriptionManager(businessId))
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
    
    // Check for alerts every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [businessId])

  const loadAlerts = async () => {
    try {
      const alerts = await subscriptionManager.getUsageAlerts()
      setAlerts(alerts)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading usage alerts:', error)
      setIsLoading(false)
    }
  }

  const dismissAlert = (alertMessage: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertMessage)))
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      case 'limit':
        return <ChartBarIcon className="h-5 w-5 text-orange-400" />
      case 'overage':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'limit':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'overage':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.message))

  if (isLoading || visibleAlerts.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-3 mb-6">
        {visibleAlerts.map((alert, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${getAlertStyles(alert.type)}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="ml-3 flex-1">
                <p className="font-medium">{alert.message}</p>
                
                {alert.action === 'upgrade' && (
                  <div className="mt-3 flex items-center space-x-3">
                    <button
                      onClick={() => setShowUpgradeFlow(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      Upgrade Plan
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.message)}
                      className="text-sm font-medium underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={() => dismissAlert(alert.message)}
                  className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUpgradeFlow && (
        <UpgradeFlow
          businessId={businessId}
          currentPlan={currentPlan}
          onUpgradeComplete={() => {
            setShowUpgradeFlow(false)
            loadAlerts() // Refresh alerts after upgrade
          }}
          onClose={() => setShowUpgradeFlow(false)}
        />
      )}
    </>
  )
}

// Trial Expiration Banner Component
export function TrialExpirationBanner({ 
  businessId, 
  trialDaysRemaining 
}: { 
  businessId: string
  trialDaysRemaining: number 
}) {
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || trialDaysRemaining <= 0) {
    return null
  }

  const getUrgencyColor = () => {
    if (trialDaysRemaining <= 1) return 'bg-red-600'
    if (trialDaysRemaining <= 3) return 'bg-orange-600'
    return 'bg-blue-600'
  }

  const getUrgencyMessage = () => {
    if (trialDaysRemaining === 0) return 'Your trial expires today!'
    if (trialDaysRemaining === 1) return 'Your trial expires tomorrow!'
    return `Your trial expires in ${trialDaysRemaining} days`
  }

  return (
    <>
      <div className={`${getUrgencyColor()} text-white`}>
        <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-white bg-opacity-20">
                <ClockIcon className="h-5 w-5" />
              </span>
              <p className="ml-3 font-medium">
                {getUrgencyMessage()} - Keep all your features with a paid plan.
              </p>
            </div>
            
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={() => setShowUpgradeFlow(true)}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
              >
                Upgrade Now
              </button>
            </div>
            
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-md hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUpgradeFlow && (
        <UpgradeFlow
          businessId={businessId}
          currentPlan="professional" // Assuming trial is for professional
          onUpgradeComplete={() => setShowUpgradeFlow(false)}
          onClose={() => setShowUpgradeFlow(false)}
        />
      )}
    </>
  )
}

// Feature Gate Component - shows upgrade prompt when trying to use locked features
export function FeatureGate({ 
  children, 
  feature, 
  currentPlan, 
  businessId 
}: {
  children: React.ReactNode
  feature: string
  currentPlan: string
  businessId: string
}) {
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [subscriptionManager] = useState(new SubscriptionManager(businessId))

  useEffect(() => {
    checkAccess()
  }, [feature, currentPlan])

  const checkAccess = async () => {
    const access = await subscriptionManager.canUseFeature(feature)
    setHasAccess(access)
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center p-6 max-w-sm">
            <div className="p-3 bg-purple-100 rounded-full inline-flex mb-4">
              <ArrowUpIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upgrade Required
            </h3>
            <p className="text-gray-600 mb-4">
              This feature requires a higher plan. Upgrade to unlock {feature.replace('_', ' ')}.
            </p>
            <button
              onClick={() => setShowUpgradeFlow(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>

      {showUpgradeFlow && (
        <UpgradeFlow
          businessId={businessId}
          currentPlan={currentPlan}
          onUpgradeComplete={() => {
            setShowUpgradeFlow(false)
            checkAccess()
          }}
          onClose={() => setShowUpgradeFlow(false)}
        />
      )}
    </>
  )
}