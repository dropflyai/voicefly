'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentCustomization from '../../../components/AgentCustomization'

interface TestCallState {
  isOpen: boolean
  phoneNumber: string
  loading: boolean
  callId: string | null
  status: string | null
  error: string | null
}

interface BusinessData {
  name: string
  phone: string | null
  agent_id: string | null
  phone_number: string | null
}

export default function AgentConfigPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testCall, setTestCall] = useState<TestCallState>({
    isOpen: false,
    phoneNumber: '',
    loading: false,
    callId: null,
    status: null,
    error: null
  })

  useEffect(() => {
    // Get business ID from authentication or local storage
    const loadBusinessData = async () => {
      // Try multiple sources for business ID
      const storedBusinessId =
        localStorage.getItem('authenticated_business_id') ||
        localStorage.getItem('current_business_id') ||
        localStorage.getItem('business_id')

      if (storedBusinessId) {
        setBusinessId(storedBusinessId)

        // Fetch business data
        try {
          const response = await fetch(`/api/businesses/${storedBusinessId}`)
          if (response.ok) {
            const data = await response.json()
            setBusinessData(data)
            // Pre-fill phone number for test calls
            if (data.phone) {
              setTestCall(prev => ({ ...prev, phoneNumber: data.phone }))
            }
          }
        } catch (error) {
          console.error('Error fetching business data:', error)
        }
      } else {
        // If no business ID, redirect to login or dashboard
        console.warn('No business ID found, redirecting to dashboard')
        router.push('/dashboard')
      }
      setLoading(false)
    }

    loadBusinessData()
  }, [router])

  // Function to initiate test call
  const initiateTestCall = async () => {
    if (!businessId || !testCall.phoneNumber) return

    setTestCall(prev => ({ ...prev, loading: true, error: null, status: 'Initiating call...' }))

    try {
      const response = await fetch('/api/voice-ai/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          phoneNumber: testCall.phoneNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to initiate call')
      }

      setTestCall(prev => ({
        ...prev,
        loading: false,
        callId: data.callId,
        status: 'Call initiated! Your phone should ring shortly.'
      }))

      // Poll for call status
      if (data.callId) {
        pollCallStatus(data.callId)
      }
    } catch (error: any) {
      setTestCall(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to initiate test call'
      }))
    }
  }

  // Function to poll call status
  const pollCallStatus = async (callId: string) => {
    let attempts = 0
    const maxAttempts = 60 // Poll for up to 5 minutes (60 * 5 seconds)

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setTestCall(prev => ({ ...prev, status: 'Call completed or timed out' }))
        return
      }

      try {
        const response = await fetch(`/api/voice-ai/test-call?callId=${callId}`)
        const data = await response.json()

        if (response.ok) {
          const statusText = data.status || 'Unknown'
          setTestCall(prev => ({ ...prev, status: statusText }))

          // Stop polling if call ended
          if (data.rawStatus === 'ended' || statusText === 'Completed') {
            const duration = data.duration ? ` (${data.duration}s)` : ''
            setTestCall(prev => ({
              ...prev,
              status: `Call completed${duration}. Check your call history for the full transcript.`
            }))
            return
          }
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling call status:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    // Start polling after a short delay
    setTimeout(poll, 3000)
  }

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
                {!testCall.isOpen ? (
                  <button
                    onClick={() => setTestCall(prev => ({ ...prev, isOpen: true, error: null, status: null }))}
                    disabled={!businessData?.agent_id}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      businessData?.agent_id
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {businessData?.agent_id ? 'Make Test Call' : 'Agent Not Configured'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number to Call
                      </label>
                      <input
                        type="tel"
                        value={testCall.phoneNumber}
                        onChange={(e) => setTestCall(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        disabled={testCall.loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your AI agent will call this number
                      </p>
                    </div>

                    {testCall.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{testCall.error}</p>
                      </div>
                    )}

                    {testCall.status && !testCall.error && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">{testCall.status}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={initiateTestCall}
                        disabled={testCall.loading || !testCall.phoneNumber}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          testCall.loading || !testCall.phoneNumber
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {testCall.loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Calling...
                          </span>
                        ) : (
                          'Call Now'
                        )}
                      </button>
                      <button
                        onClick={() => setTestCall(prev => ({ ...prev, isOpen: false, status: null, error: null }))}
                        disabled={testCall.loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
                  <div className={`w-3 h-3 rounded-full mr-3 ${businessData?.agent_id ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">VAPI Integration</p>
                    <p className="text-sm text-gray-500">
                      {businessData?.agent_id ? 'AI agent connected and active' : 'AI agent not yet provisioned'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${businessData?.agent_id ? 'text-green-600' : 'text-yellow-600'}`}>
                  {businessData?.agent_id ? 'Connected' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${businessData?.phone_number ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">Phone Number</p>
                    <p className="text-sm text-gray-500">
                      {businessData?.phone_number
                        ? `Dedicated AI phone line: ${businessData.phone_number}`
                        : 'Phone line not yet provisioned'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${businessData?.phone_number ? 'text-green-600' : 'text-yellow-600'}`}>
                  {businessData?.phone_number ? 'Active' : 'Pending'}
                </span>
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

            {(!businessData?.agent_id || !businessData?.phone_number) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Action Required:</strong> Complete the onboarding process to provision your AI agent and phone number.
                </p>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="mt-2 text-sm text-yellow-700 font-medium hover:text-yellow-800 underline"
                >
                  Complete Onboarding &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}