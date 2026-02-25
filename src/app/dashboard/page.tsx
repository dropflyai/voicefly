'use client'

import { useEffect, useState, Suspense } from 'react'
import Layout from '../../components/Layout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../lib/supabase'
import { supabase } from '../../lib/supabase-client'
import {
  getSecureBusinessId,
  redirectToLoginIfUnauthenticated,
} from '../../lib/multi-tenant-auth'
import {
  PhoneIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================

interface PhoneEmployee {
  id: string
  name: string
  jobType: string
  isActive: boolean
  phoneNumber?: string
  vapiAssistantId?: string
  createdAt: Date
}

interface EmployeeCall {
  call_id: string
  business_id: string
  employee_id: string
  customer_phone: string
  status: string
  direction: string
  started_at: string
  ended_at?: string
  duration?: number
  transcript?: string
  summary?: string
  cost?: number
}

interface PhoneMessage {
  id: string
  caller_name?: string
  caller_phone?: string
  reason?: string
  full_message?: string
  urgency?: string
  status?: string
  created_at: string
}

interface DashboardData {
  employees: PhoneEmployee[]
  recentCalls: EmployeeCall[]
  recentMessages: PhoneMessage[]
  totalCalls: number
  totalMessages: number
}

// ============================================
// HELPERS
// ============================================

function formatJobType(jobType: string): string {
  return jobType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function formatPhoneNumber(phone?: string): string {
  if (!phone) return 'No number assigned'
  return phone
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [data, setData] = useState<DashboardData>({
    employees: [],
    recentCalls: [],
    recentMessages: [],
    totalCalls: 0,
    totalMessages: 0,
  })
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) return null
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const loadDashboardData = async () => {
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

      // Fetch business
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (!businessData) {
        setError('Business not found. Please check your configuration.')
        return
      }
      setBusiness(businessData)

      // Fetch employees via API
      const headers = await getAuthHeaders()
      let employees: PhoneEmployee[] = []

      if (headers) {
        try {
          const empRes = await fetch(
            `/api/phone-employees?businessId=${businessId}`,
            { headers }
          )
          if (empRes.ok) {
            const empData = await empRes.json()
            employees = empData.employees || []
          }
        } catch (e) {
          console.error('Failed to fetch employees:', e)
        }
      }

      setEmployeeCount(employees.length)

      // Fetch recent calls from employee_calls
      const { data: callsData, count: callsCount } = await supabase
        .from('employee_calls')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('started_at', { ascending: false })
        .limit(10)

      // Fetch recent messages from phone_messages
      const { data: messagesData, count: messagesCount } = await supabase
        .from('phone_messages')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10)

      setData({
        employees,
        recentCalls: callsData || [],
        recentMessages: messagesData || [],
        totalCalls: callsCount || 0,
        totalMessages: messagesCount || 0,
      })
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <Layout business={business || undefined}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <Layout business={business || undefined}>
        <div className="p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-4">
              {error}
            </div>
            <button
              onClick={() => loadDashboardData()}
              className="btn-primary"
            >
              Try Again
            </button>
            <div className="mt-4 text-sm text-gray-500">
              Make sure you have configured your Supabase credentials in
              .env.local
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ============================================
  // EMPTY STATE: No employees yet
  // ============================================

  if (employeeCount === 0) {
    return (
      <Layout business={business || undefined}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <PhoneIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome to VoiceFly!
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Let's create your first AI employee and start capturing calls
                24/7
              </p>

              <a
                href="/dashboard/employees"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Your First Employee
                <ArrowRightIcon className="ml-3 h-6 w-6" />
              </a>
            </div>

            {/* 3-Step Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pick a Type
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose from Receptionist, Order Taker, Customer Service, and
                  more
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configure
                </h3>
                <p className="text-gray-600 text-sm">
                  Set up your employee's name, voice, and capabilities in
                  minutes
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Go Live
                </h3>
                <p className="text-gray-600 text-sm">
                  Get a phone number and start answering calls immediately
                </p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">Ready to get started?</p>
              <a
                href="/dashboard/employees"
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Create Your First Employee
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ============================================
  // MAIN DASHBOARD (has employees)
  // ============================================

  const activeEmployees = data.employees.filter((e) => e.isActive)

  return (
    <Layout business={business || undefined}>
      <div className="p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{business?.name ? `, ${business.name}` : ''}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeEmployees.length} active employee
            {activeEmployees.length !== 1 ? 's' : ''} ready to take calls
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <PhoneIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Calls
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.totalCalls}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Messages
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.totalMessages}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Employees
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeEmployees.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Employees
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.employees.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Employees + Calls + Messages */}
          <div className="lg:col-span-2 space-y-8">
            {/* Employee Cards */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Employees
                </h2>
                <a
                  href="/dashboard/employees"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage
                </a>
              </div>
              <div className="divide-y divide-gray-100">
                {data.employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          employee.isActive
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <PhoneIcon
                          className={`h-5 w-5 ${
                            employee.isActive
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              employee.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatJobType(employee.jobType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right ml-4">
                      <p className="text-sm text-gray-700">
                        {formatPhoneNumber(employee.phoneNumber)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Calls */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Calls
                </h2>
              </div>
              <div>
                {data.recentCalls.length === 0 ? (
                  <div className="p-8 text-center">
                    <PhoneIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No calls yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Your AI employee is ready and waiting!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.recentCalls.map((call) => (
                      <div
                        key={call.call_id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                call.direction === 'inbound'
                                  ? 'bg-blue-100'
                                  : 'bg-purple-100'
                              }`}
                            >
                              <PhoneIcon
                                className={`h-4 w-4 ${
                                  call.direction === 'inbound'
                                    ? 'text-blue-600'
                                    : 'text-purple-600'
                                }`}
                              />
                            </div>
                            <div className="ml-3 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {call.customer_phone || 'Unknown caller'}
                              </p>
                              {call.summary && (
                                <p className="text-sm text-gray-500 truncate">
                                  {call.summary}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right ml-4">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(call.started_at), {
                                addSuffix: true,
                              })}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDuration(call.duration)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Messages
                </h2>
              </div>
              <div>
                {data.recentMessages.length === 0 ? (
                  <div className="p-8 text-center">
                    <ChatBubbleLeftIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No messages yet
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Messages from callers will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.recentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {msg.caller_name || msg.caller_phone || 'Unknown'}
                              </p>
                              {msg.urgency && (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    msg.urgency === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : msg.urgency === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {msg.urgency}
                                </span>
                              )}
                            </div>
                            {msg.reason && (
                              <p className="text-sm text-gray-600 mt-0.5">
                                {msg.reason}
                              </p>
                            )}
                            {msg.full_message && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {msg.full_message}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right ml-4">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(msg.created_at),
                                { addSuffix: true }
                              )}
                            </p>
                            {msg.status && (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs mt-1 ${
                                  msg.status === 'read'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {msg.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <a
                  href="/dashboard/employees"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                    Manage Employees
                  </span>
                </a>

                <a
                  href="/dashboard/settings"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <Cog6ToothIcon className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800">
                    Settings
                  </span>
                </a>

                <a
                  href="/dashboard/billing"
                  className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <CreditCardIcon className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                    Billing
                  </span>
                </a>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Business Info
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {business?.subscription_tier || 'Starter'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-medium capitalize ${
                      business?.subscription_status === 'active'
                        ? 'text-green-600'
                        : business?.subscription_status === 'trial'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {business?.subscription_status || 'Unknown'}
                  </span>
                </div>
                {business?.subscription_status === 'trial' &&
                  business?.trial_ends_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Trial Ends</span>
                      <span className="font-medium text-gray-900">
                        {new Date(business.trial_ends_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                {business?.business_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {business.business_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ============================================
// WRAPPED EXPORT
// ============================================

function ProtectedDashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  )
}

export default ProtectedDashboardPage
