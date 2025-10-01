'use client'

import { ReactNode, useState } from 'react'
import { 
  LockClosedIcon, 
  SparklesIcon,
  ArrowUpIcon 
} from '@heroicons/react/24/outline'
import PlanUpgradePrompt from './PlanUpgradePrompt'

interface FeatureLockProps {
  currentPlan: 'starter' | 'professional' | 'business'
  requiredPlan: 'professional' | 'business'
  featureName: string
  featureDescription: string
  children?: ReactNode
  variant?: 'card' | 'overlay' | 'inline' | 'page'
  showUpgradePrompt?: boolean
}

const PLAN_COLORS = {
  professional: 'blue',
  business: 'purple'
}

export default function FeatureLock({
  currentPlan,
  requiredPlan, 
  featureName,
  featureDescription,
  children,
  variant = 'card',
  showUpgradePrompt = true
}: FeatureLockProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  
  const planColor = PLAN_COLORS[requiredPlan]
  const planName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)

  // Check if upgrade is needed
  const planLevels = { starter: 1, professional: 2, business: 3 }
  const needsUpgrade = planLevels[currentPlan] < planLevels[requiredPlan]

  if (!needsUpgrade) {
    return <>{children}</>
  }

  const handleUpgradeClick = () => {
    if (showUpgradePrompt) {
      setShowPrompt(true)
    } else {
      window.location.href = `/dashboard/settings/billing?upgrade=${requiredPlan}`
    }
  }

  // Card variant - displays a locked card
  if (variant === 'card') {
    return (
      <>
        <div className="relative bg-white rounded-xl border-2 border-gray-200 p-6 opacity-75">
          {/* Lock Overlay */}
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className={`w-16 h-16 bg-${planColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <LockClosedIcon className={`w-8 h-8 text-${planColor}-600`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{featureName}</h3>
              <p className="text-sm text-gray-600 mb-4">{featureDescription}</p>
              <button
                onClick={handleUpgradeClick}
                className={`inline-flex items-center px-4 py-2 bg-${planColor}-600 text-white font-medium rounded-lg hover:bg-${planColor}-700 transition-colors text-sm`}
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Upgrade to {planName}
              </button>
            </div>
          </div>
          
          {/* Blurred Content */}
          <div className="filter blur-sm pointer-events-none">
            {children || (
              <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
            )}
          </div>
        </div>

        {showPrompt && (
          <PlanUpgradePrompt
            currentPlan={currentPlan}
            requiredPlan={requiredPlan}
            featureName={featureName}
            featureDescription={featureDescription}
            onClose={() => setShowPrompt(false)}
          />
        )}
      </>
    )
  }

  // Overlay variant - displays over existing content
  if (variant === 'overlay') {
    return (
      <>
        <div className="relative">
          <div className="filter blur-sm pointer-events-none">
            {children}
          </div>
          
          <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg">
            <div className="text-center p-6">
              <div className={`w-12 h-12 bg-${planColor}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <LockClosedIcon className={`w-6 h-6 text-${planColor}-600`} />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{featureName}</h4>
              <p className="text-sm text-gray-600 mb-3">{featureDescription}</p>
              <button
                onClick={handleUpgradeClick}
                className={`inline-flex items-center px-3 py-2 bg-${planColor}-600 text-white font-medium rounded-md hover:bg-${planColor}-700 transition-colors text-xs`}
              >
                <ArrowUpIcon className="w-3 h-3 mr-1" />
                Upgrade
              </button>
            </div>
          </div>
        </div>

        {showPrompt && (
          <PlanUpgradePrompt
            currentPlan={currentPlan}
            requiredPlan={requiredPlan}
            featureName={featureName}
            featureDescription={featureDescription}
            onClose={() => setShowPrompt(false)}
          />
        )}
      </>
    )
  }

  // Inline variant - displays as a banner
  if (variant === 'inline') {
    return (
      <>
        <div className={`bg-${planColor}-50 border border-${planColor}-200 rounded-lg p-4 mb-4`}>
          <div className="flex items-center space-x-3">
            <LockClosedIcon className={`w-5 h-5 text-${planColor}-600 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className={`font-medium text-${planColor}-900`}>{featureName}</h4>
              <p className={`text-sm text-${planColor}-700 mt-1`}>{featureDescription}</p>
            </div>
            <button
              onClick={handleUpgradeClick}
              className={`px-4 py-2 bg-${planColor}-600 text-white font-medium rounded-md hover:bg-${planColor}-700 transition-colors text-sm whitespace-nowrap`}
            >
              Upgrade to {planName}
            </button>
          </div>
        </div>

        {showPrompt && (
          <PlanUpgradePrompt
            currentPlan={currentPlan}
            requiredPlan={requiredPlan}
            featureName={featureName}
            featureDescription={featureDescription}
            onClose={() => setShowPrompt(false)}
          />
        )}
      </>
    )
  }

  // Page variant - displays a full page lock
  if (variant === 'page') {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className={`w-20 h-20 bg-${planColor}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
              <LockClosedIcon className={`w-10 h-10 text-${planColor}-600`} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{featureName}</h1>
            <p className="text-gray-600 mb-6">{featureDescription}</p>
            
            <div className={`bg-${planColor}-50 rounded-lg p-4 mb-6`}>
              <p className={`text-sm text-${planColor}-800`}>
                <strong>Upgrade to {planName} Plan</strong> to unlock this feature and many more advanced tools for your business.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleUpgradeClick}
                className={`w-full px-6 py-3 bg-${planColor}-600 text-white font-semibold rounded-lg hover:bg-${planColor}-700 transition-colors`}
              >
                Upgrade to {planName}
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>

        {showPrompt && (
          <PlanUpgradePrompt
            currentPlan={currentPlan}
            requiredPlan={requiredPlan}
            featureName={featureName}
            featureDescription={featureDescription}
            onClose={() => setShowPrompt(false)}
          />
        )}
      </>
    )
  }

  return null
}