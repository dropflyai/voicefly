'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentCustomization from '../../../components/AgentCustomization'

export default function AgentConfigPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get business ID from authentication or local storage
    const loadBusinessData = () => {
      // Try multiple sources for business ID
      const storedBusinessId = 
        localStorage.getItem('authenticated_business_id') ||
        localStorage.getItem('current_business_id') ||
        localStorage.getItem('business_id')

      if (storedBusinessId) {
        setBusinessId(storedBusinessId)
      } else {
        // If no business ID, redirect to login or dashboard
        console.warn('No business ID found, redirecting to dashboard')
        router.push('/dashboard')
      }
      setLoading(false)
    }

    loadBusinessData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent configuration...</p>
        </div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load agent configuration.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Maya Agent Configuration</h1>
          <p className="mt-2 text-gray-600">
            Manage your Maya AI assistant settings, role configuration, and Business tier customization options.
          </p>
        </div>

        {/* Agent Customization Component */}
        <div className="space-y-6">
          <AgentCustomization businessId={businessId} />
          
          {/* Additional Agent Management Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Management</h3>
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Test Agent */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Test Your Agent</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Make a test call to verify your Maya AI agent is working correctly with your current configuration.
                </p>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  Make Test Call
                </button>
              </div>

              {/* Performance Metrics */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                <p className="text-sm text-gray-600 mb-4">
                  View detailed analytics about your Maya AI agent's performance and booking success rate.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/analytics')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  View Analytics
                </button>
              </div>

              {/* Agent Training */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Agent Training</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Provide additional context and training to improve your Maya AI agent's responses.
                </p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  Coming Soon
                </button>
              </div>

              {/* Business Tier Upgrade */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Custom Agent Features</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Unlock custom branding, personality, and advanced agent configuration with Business tier.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/settings?tab=billing')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm"
                >
                  Upgrade to Business
                </button>
              </div>

            </div>
          </div>

          {/* Integration Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">VAPI Integration</p>
                    <p className="text-sm text-gray-500">AI agent connected and active</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Phone Number</p>
                    <p className="text-sm text-gray-500">Dedicated AI phone line provisioned</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Webhook Configuration</p>
                    <p className="text-sm text-gray-500">Multi-tenant routing configured</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Configured</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Database Integration</p>
                    <p className="text-sm text-gray-500">Customer and appointment data synced</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}