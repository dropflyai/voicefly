'use client'

import { ReactNode } from 'react'
import { FeatureAccess, SubscriptionTier } from '../lib/feature-access'
import { PLAN_TIER_LIMITS } from '../lib/supabase'
import { SparklesIcon, ChartBarIcon, CurrencyDollarIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface TierGateProps {
  feature: string
  tier: SubscriptionTier
  children: ReactNode
  fallback?: 'preview' | 'upgrade' | 'hidden'
  previewData?: any
  className?: string
}

interface UpgradePromptProps {
  feature: string
  tier: SubscriptionTier
  requiredTier: SubscriptionTier
  previewData?: any
}

export function TierGate({ 
  feature, 
  tier, 
  children, 
  fallback = 'upgrade',
  previewData,
  className = ''
}: TierGateProps) {
  const access = FeatureAccess.checkAccess(tier, feature)
  
  if (access.hasAccess) {
    return <div className={className}>{children}</div>
  }
  
  if (fallback === 'hidden') {
    return null
  }
  
  if (fallback === 'preview' && previewData) {
    return (
      <div className={className}>
        <PreviewMode 
          feature={feature}
          tier={tier}
          requiredTier={access.upgradeRequired!}
          previewData={previewData}
        />
      </div>
    )
  }
  
  return (
    <div className={className}>
      <UpgradePrompt 
        feature={feature}
        tier={tier}
        requiredTier={access.upgradeRequired!}
        previewData={previewData}
      />
    </div>
  )
}

function PreviewMode({ feature, tier, requiredTier, previewData }: UpgradePromptProps) {
  return (
    <div className="relative">
      {/* Blurred content in background */}
      <div className="filter blur-sm opacity-50 pointer-events-none">
        <div className="bg-gray-100 rounded-lg p-6 min-h-[300px]">
          {previewData && (
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                <div className="h-3 bg-gray-300 rounded w-4/6"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Centered upgrade prompt */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-4 border-2 border-purple-200">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              {getFeatureIcon(feature)}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getFeatureTitle(feature)} Available
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Upgrade to {getTierName(requiredTier)} to unlock {getFeatureDescription(feature)}
            </p>
            
            {previewData && (
              <div className="bg-purple-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-purple-700 font-medium">
                  📊 Your data is ready: {getPreviewStats(feature, previewData)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Link href="/dashboard/settings?tab=billing" className="block">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium">
                  Upgrade to {getTierName(requiredTier)} - ${PLAN_TIER_LIMITS[requiredTier].monthly_price}/mo
                </button>
              </Link>
              
              <button 
                onClick={() => showFullPreview(feature, previewData)}
                className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Preview for 5 seconds →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpgradePrompt({ feature, tier, requiredTier, previewData }: UpgradePromptProps) {
  const benefits = FeatureAccess.getUpgradeBenefits(tier, requiredTier)
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            {getFeatureIcon(feature)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {getFeatureTitle(feature)} Not Available
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {getFeatureDescription(feature)} is available in the {getTierName(requiredTier)} plan.
          </p>
          
          {previewData && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">📊 Your data is collecting:</h4>
              <p className="text-xs text-gray-600">
                {getPreviewStats(feature, previewData)}
              </p>
            </div>
          )}
          
          {benefits.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">What you'll unlock:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Link href="/dashboard/settings?tab=billing">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium">
                Upgrade Now - ${PLAN_TIER_LIMITS[requiredTier].monthly_price}/mo
              </button>
            </Link>
            
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getFeatureIcon(feature: string) {
  const icons: Record<string, ReactNode> = {
    analytics: <ChartBarIcon className="w-8 h-8 text-white" />,
    marketing: <SparklesIcon className="w-8 h-8 text-white" />,
    payments: <CurrencyDollarIcon className="w-8 h-8 text-white" />,
    multi_location: <BuildingStorefrontIcon className="w-8 h-8 text-white" />,
  }
  
  return icons[feature] || <SparklesIcon className="w-8 h-8 text-white" />
}

function getFeatureTitle(feature: string): string {
  const titles: Record<string, string> = {
    analytics: 'Analytics Dashboard',
    marketing: 'Marketing Tools', 
    payments: 'Payment Processing',
    multi_location: 'Multi-Location',
    loyalty: 'Loyalty Program',
    branding: 'Custom Branding'
  }
  
  return titles[feature] || 'Premium Feature'
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    analytics: 'Advanced analytics, revenue tracking, and performance insights',
    marketing: 'Email campaigns, SMS marketing, and customer segmentation',
    payments: 'Square and Stripe integration with automated processing',
    multi_location: 'Manage multiple business locations with cross-location analytics',
    loyalty: 'Points-based rewards system with automatic tier progression',
    branding: 'Custom logo, colors, and branded customer communications'
  }
  
  return descriptions[feature] || 'Advanced business features'
}

function getTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    starter: 'AI Starter',
    professional: 'AI Professional', 
    business: 'AI Business',
    enterprise: 'Enterprise'
  }
  
  return names[tier]
}

function getPreviewStats(feature: string, previewData: any): string {
  if (!previewData) return 'Data collecting in the background'
  
  switch (feature) {
    case 'analytics':
      return `${previewData.totalRevenue || '$2,400'} revenue, ${previewData.totalAppointments || '24'} appointments this month`
    case 'marketing':
      return `${previewData.emailSignups || '143'} email subscribers, ${previewData.campaignReach || '85%'} open rate`
    case 'loyalty':
      return `${previewData.loyaltyMembers || '67'} loyalty members, ${previewData.pointsIssued || '2,340'} points issued`
    default:
      return 'Ready to unlock when you upgrade'
  }
}

function showFullPreview(feature: string, previewData: any) {
  // This would temporarily show the full feature for 5 seconds
  // Implementation would depend on your state management
  console.log(`Showing full preview of ${feature}`, previewData)
}

export default TierGate