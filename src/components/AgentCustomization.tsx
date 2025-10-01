'use client'

import React, { useState, useEffect } from 'react'
import { 
  CogIcon, 
  PhoneIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface BusinessData {
  id: string
  name: string
  maya_job_id: string
  agent_id?: string
  agent_type?: string
  phone_number?: string
  brand_personality?: string
  business_description?: string
  unique_selling_points?: string[]
  target_customer?: string
  price_range?: string
  subscription_tier: string
}

interface AgentCustomizationProps {
  businessId: string
}

const MAYA_JOB_LABELS: Record<string, { name: string, icon: string }> = {
  'nail-salon-receptionist': { name: 'Nail Salon Receptionist', icon: '💅' },
  'hair-salon-coordinator': { name: 'Hair Salon Coordinator', icon: '💇‍♀️' },
  'spa-wellness-assistant': { name: 'Spa Wellness Assistant', icon: '🧘‍♀️' },
  'massage-therapy-scheduler': { name: 'Massage Therapy Scheduler', icon: '💆‍♀️' },
  'beauty-salon-assistant': { name: 'Beauty Salon Assistant', icon: '✨' },
  'barbershop-coordinator': { name: 'Barbershop Coordinator', icon: '💈' },
  'medical-scheduler': { name: 'Medical Scheduler', icon: '🏥' },
  'dental-coordinator': { name: 'Dental Coordinator', icon: '🦷' },
  'fitness-coordinator': { name: 'Fitness Coordinator', icon: '🏃‍♂️' }
}

const PERSONALITY_STYLES: Record<string, { label: string, description: string, color: string }> = {
  professional: { 
    label: 'Professional', 
    description: 'Formal, knowledgeable, and reliable',
    color: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  warm: { 
    label: 'Warm', 
    description: 'Friendly, caring, and personal',
    color: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  luxury: { 
    label: 'Luxury', 
    description: 'Elegant, sophisticated, and exclusive',
    color: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  casual: { 
    label: 'Casual', 
    description: 'Relaxed, friendly, and approachable',
    color: 'bg-green-50 text-green-800 border-green-200'
  }
}

export default function AgentCustomization({ businessId }: AgentCustomizationProps) {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessData()
  }, [businessId])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch business data')
      }
      const data = await response.json()
      setBusinessData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
        <div className="flex items-center text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Error Loading Agent Configuration</h3>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!businessData) {
    return null
  }

  const mayaJob = MAYA_JOB_LABELS[businessData.maya_job_id] || { name: businessData.maya_job_id, icon: '🤖' }
  const personality = PERSONALITY_STYLES[businessData.brand_personality || 'professional']
  const isBusinessTier = businessData.subscription_tier === 'business'
  const hasCustomAgent = businessData.agent_type === 'custom-business'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CogIcon className="w-6 h-6 text-gray-400 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Maya AI Agent Configuration</h2>
              <p className="text-sm text-gray-500">Manage your AI assistant settings and customization</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasCustomAgent ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <SparklesIcon className="w-3 h-3 mr-1" />
                Custom Agent
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Shared Agent
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Maya Job Role */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Maya's Role</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{mayaJob.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{mayaJob.name}</p>
                  <p className="text-sm text-gray-500">Specialized AI assistant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Phone Number */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Phone Number</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <PhoneIcon className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{businessData.phone_number || 'Not assigned'}</p>
                  <p className="text-sm text-gray-500">24/7 AI booking line</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Tier Customization */}
        {isBusinessTier && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Tier Customization</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brand Personality */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Brand Personality</label>
                <div className={`border rounded-lg p-3 ${personality.color}`}>
                  <p className="font-medium">{personality.label}</p>
                  <p className="text-sm">{personality.description}</p>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="font-medium capitalize">{businessData.price_range || 'Mid-range'}</p>
                  <p className="text-sm text-gray-500">Service pricing tier</p>
                </div>
              </div>
            </div>

            {/* Business Description */}
            {businessData.business_description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Business Description</label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-900">{businessData.business_description}</p>
                </div>
              </div>
            )}

            {/* Unique Selling Points */}
            {businessData.unique_selling_points && businessData.unique_selling_points.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Unique Selling Points</label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {businessData.unique_selling_points.map((point, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Target Customer */}
            {businessData.target_customer && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Target Customer</label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-900">{businessData.target_customer}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agent Status */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent Status</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">AI agent is live</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <PhoneIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Connected</p>
              <p className="text-xs text-gray-500">Phone number linked</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Optimized</p>
              <p className="text-xs text-gray-500">Role-specific AI</p>
            </div>
          </div>
        </div>

        {/* Upgrade Notice for Non-Business Tiers */}
        {!isBusinessTier && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <SparklesIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-sm font-medium text-yellow-800">
                Upgrade to Business Tier for full agent customization, custom branding, and personalized AI responses.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}