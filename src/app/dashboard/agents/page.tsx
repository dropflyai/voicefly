'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import {
  BusinessHealthCard,
  InsightsFeed,
  AgentStatusGrid,
  TodaySummary,
} from '../../../components/agents'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import {
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

function AgentsDashboardPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadBusinessData()
  }, [])

  const loadBusinessData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (redirectToLoginIfUnauthenticated()) {
        return
      }

      const businessId = getSecureBusinessId()
      if (!businessId) {
        setError('Authentication required. Please log in.')
        setLoading(false)
        return
      }

      const businessData = await BusinessAPI.getBusiness(businessId)
      if (!businessData) {
        setError('Business not found.')
        return
      }

      setBusiness(businessData)
    } catch (err) {
      console.error('Error loading business data:', err)
      setError('Failed to load business data.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button onClick={loadBusinessData} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const businessId = getSecureBusinessId()

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Maya AI Agents
                  </h1>
                  <p className="text-sm text-gray-600">
                    Autonomous business intelligence powered by AI
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <BoltIcon className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Real-time Analysis
                </p>
                <p className="text-xs text-purple-600">Always monitoring</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Predictive Insights
                </p>
                <p className="text-xs text-blue-600">Data-driven decisions</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Churn Prevention
                </p>
                <p className="text-xs text-green-600">Proactive retention</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-amber-50 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Revenue Optimization
                </p>
                <p className="text-xs text-amber-600">Maximize earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Business Health & Summary */}
          <div className="space-y-6">
            {businessId && (
              <>
                <BusinessHealthCard businessId={businessId} key={`health-${refreshKey}`} />
                <TodaySummary businessId={businessId} key={`summary-${refreshKey}`} />
              </>
            )}
          </div>

          {/* Right Column - Agent Status & Insights */}
          <div className="lg:col-span-2 space-y-6">
            {businessId && (
              <>
                <AgentStatusGrid businessId={businessId} key={`agents-${refreshKey}`} />
                <InsightsFeed businessId={businessId} limit={10} key={`insights-${refreshKey}`} />
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agent Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => router.push('/dashboard/leads')}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-900">
                Qualified Leads
              </span>
              <span className="text-xs text-blue-600">View hot prospects</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/customers')}
              className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-red-900">
                At-Risk Customers
              </span>
              <span className="text-xs text-red-600">Prevent churn</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-purple-900">
                Slot Recovery
              </span>
              <span className="text-xs text-purple-600">Fill cancellations</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/analytics')}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-900">
                Revenue Intel
              </span>
              <span className="text-xs text-green-600">Track performance</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/voice-ai')}
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <svg
                  className="h-5 w-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-indigo-900">
                Call Intelligence
              </span>
              <span className="text-xs text-indigo-600">Analyze calls</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function ProtectedAgentsDashboardPage() {
  return (
    <ProtectedRoute>
      <AgentsDashboardPage />
    </ProtectedRoute>
  )
}
