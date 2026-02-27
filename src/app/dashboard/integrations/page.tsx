'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import { supabase } from '../../../lib/supabase-client'
import { PuzzlePieceIcon } from '@heroicons/react/24/outline'

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  'order-taker': 'Order Taker',
  'receptionist': 'Receptionist',
  'appointment-scheduler': 'Appointment Scheduler',
  'personal-assistant': 'Personal Assistant',
  'customer-service': 'Customer Service',
}

interface IntegrationDef {
  id: string
  name: string
  description: string
  category: string
  employeeTypes: string[]
  color: string
  comingSoon: boolean
  connectType: 'oauth' | 'apikey' | 'calendar-id' | 'none'
}

const AVAILABLE_INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Let your AI employees check real availability and book appointments on your Google Calendar.',
    category: 'Scheduling',
    employeeTypes: ['receptionist', 'appointment-scheduler', 'personal-assistant'],
    color: 'blue',
    comingSoon: false,
    connectType: 'calendar-id',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Let your phone employee check real availability and book appointments via Calendly.',
    category: 'Scheduling',
    employeeTypes: ['receptionist', 'appointment-scheduler', 'personal-assistant'],
    color: 'blue',
    comingSoon: false,
    connectType: 'oauth',
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Sync your menu and accept orders directly through Square POS.',
    category: 'Restaurant & Retail',
    employeeTypes: ['order-taker'],
    color: 'green',
    comingSoon: false,
    connectType: 'oauth',
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Pull your full menu, modifiers, and 86 list from Toast POS.',
    category: 'Restaurant',
    employeeTypes: ['order-taker'],
    color: 'red',
    comingSoon: true,
    connectType: 'none',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Look up orders, check status, and initiate returns during calls.',
    category: 'E-commerce',
    employeeTypes: ['customer-service'],
    color: 'purple',
    comingSoon: true,
    connectType: 'none',
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', iconBg: 'bg-green-100' },
  red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', iconBg: 'bg-red-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', iconBg: 'bg-purple-100' },
}

interface ConnectedIntegration {
  id: string
  platform: string
  status: string
  config: Record<string, any>
  lastSyncedAt: string | null
  syncError: string | null
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function IntegrationsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [integrations, setIntegrations] = useState<Record<string, ConnectedIntegration>>({})
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Square state
  const [squareConnecting, setSquareConnecting] = useState(false)
  const [squareSyncing, setSquareSyncing] = useState(false)
  const [syncEmployeeId, setSyncEmployeeId] = useState('')

  // Google Calendar state
  const [calendarId, setCalendarId] = useState('')
  const [calendarConnecting, setCalendarConnecting] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const loadData = useCallback(async () => {
    try {
      if (redirectToLoginIfUnauthenticated()) return

      const businessId = getSecureBusinessId()
      if (!businessId) { setLoading(false); return }

      const headers = await getAuthHeaders()

      const [businessData, intRes, empRes] = await Promise.all([
        BusinessAPI.getBusiness(businessId),
        fetch(`/api/integrations?businessId=${businessId}`, { headers }),
        fetch(`/api/phone-employees?businessId=${businessId}`, { headers }),
      ])

      if (businessData) setBusiness(businessData)

      if (intRes.ok) {
        const data = await intRes.json()
        const list = data.integrations ?? []
        // Convert array to Record keyed by platform
        const map: Record<string, ConnectedIntegration> = {}
        for (const item of list) {
          const platform = item.platform ?? item.id
          map[platform] = {
            id: item.id,
            platform,
            status: item.status,
            config: item.config ?? {},
            lastSyncedAt: item.lastSyncedAt ?? item.last_synced_at ?? null,
            syncError: item.syncError ?? item.sync_error ?? null,
          }
        }
        setIntegrations(map)
      }

      if (empRes.ok) {
        const data = await empRes.json()
        setEmployees(data.employees ?? [])
      }
    } catch (err) {
      console.error('Error loading integrations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const showFeedback = (type: 'error' | 'success', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // --- Google Calendar ---
  const handleGoogleCalendarConnect = async () => {
    if (!calendarId.trim()) {
      showFeedback('error', 'Please enter your Google Calendar ID.')
      return
    }
    setCalendarConnecting(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/google-calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, calendarId: calendarId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback('error', data.error ?? 'Failed to connect Google Calendar.')
      } else {
        showFeedback('success', 'Google Calendar connected successfully.')
        setCalendarId('')
        setExpandedCard(null)
        loadData()
      }
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setCalendarConnecting(false)
  }

  // --- Calendly ---
  const handleCalendlyConnect = async () => {
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()
    // Redirect to OAuth flow
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const url = `/api/integrations/calendly/oauth?businessId=${businessId}${token ? `&token=${token}` : ''}&from=/dashboard/integrations`
    window.location.href = url
  }

  // --- Square ---
  const handleSquareConnect = async () => {
    setSquareConnecting(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/square/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId }),
      })
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
        return
      }
      showFeedback('error', data.error ?? 'Failed to start Square authorization.')
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setSquareConnecting(false)
  }

  const handleSquareSync = async (employeeId: string) => {
    setSquareSyncing(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/square/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, employeeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback('error', data.error ?? 'Sync failed.')
      } else {
        const emp = employees.find(e => e.id === employeeId)
        showFeedback('success', data.message ?? `Synced menu to ${emp?.name ?? 'employee'}.`)
        loadData()
      }
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setSquareSyncing(false)
  }

  // --- Disconnect any ---
  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    await fetch(`/api/integrations/${platform}?businessId=${businessId}`, {
      method: 'DELETE',
      headers,
    })
    loadData()
  }

  const compatibleEmployees = (types: string[]) =>
    employees.filter(e => types.some(t => e.job_type === t || e.job_type === t.replace('-', '_')))

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-1.5">
            <PuzzlePieceIcon className="h-7 w-7 text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          </div>
          <p className="text-sm text-gray-500">
            Connect your business tools to power your phone employees.
          </p>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Integration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_INTEGRATIONS.map(integration => {
            const colors = COLOR_MAP[integration.color] ?? COLOR_MAP.blue
            const connected = integrations[integration.id]
            const isConnected = !!connected
            const isExpanded = expandedCard === integration.id

            return (
              <div
                key={integration.id}
                className={`rounded-xl border overflow-hidden ${
                  integration.comingSoon
                    ? 'border-gray-200 bg-gray-50 opacity-75'
                    : isConnected && connected.syncError
                      ? 'border-yellow-200 bg-white'
                      : isConnected
                        ? 'border-green-200 bg-white'
                        : 'border-gray-200 bg-white'
                }`}
              >
                <div className="p-5">
                  {/* Top row: icon + name + badges */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-lg ${colors.iconBg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {integration.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[15px] text-gray-900">{integration.name}</span>
                        {integration.comingSoon && (
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                        {isConnected && !connected.syncError && (
                          <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Healthy
                          </span>
                        )}
                        {isConnected && connected.syncError && (
                          <span className="text-[11px] font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                            Issue
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${colors.text} ${colors.bg} px-1.5 py-0.5 rounded inline-block mt-1`}>
                        {integration.category}
                      </span>
                    </div>
                  </div>

                  {/* Sync error warning */}
                  {isConnected && connected.syncError && (
                    <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <span className="font-medium">Sync issue:</span> {connected.syncError}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                    {integration.description}
                  </p>

                  {/* Compatible employee types */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {integration.employeeTypes.map(type => (
                      <span key={type} className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {EMPLOYEE_TYPE_LABELS[type] ?? type}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {!integration.comingSoon && (
                    <div className="flex gap-2 flex-wrap items-center">
                      {isConnected ? (
                        <>
                          {connected.lastSyncedAt && (
                            <span className="text-xs text-gray-500 mr-auto">
                              Last synced {new Date(connected.lastSyncedAt).toLocaleDateString()}
                            </span>
                          )}
                          {integration.id === 'square' && (
                            <button
                              onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                              Sync Now
                            </button>
                          )}
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                          className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          {isExpanded ? 'Cancel' : 'Connect'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded connect/sync panel */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-5">
                    {/* Google Calendar connect */}
                    {integration.id === 'google-calendar' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-gray-900 mb-1">Connect Google Calendar</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Share your calendar with <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">voicefly-calendar@voice-fly.iam.gserviceaccount.com</span>, then enter your Calendar ID below.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={calendarId}
                            onChange={e => setCalendarId(e.target.value)}
                            placeholder="your-email@gmail.com or calendar ID"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            onClick={handleGoogleCalendarConnect}
                            disabled={calendarConnecting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                              calendarConnecting ? 'bg-indigo-300 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {calendarConnecting ? 'Connecting...' : 'Connect'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Calendly connect */}
                    {integration.id === 'calendly' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-gray-900 mb-1">Connect Calendly</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Authorize VoiceFly to access your Calendly account to check availability and book appointments.
                        </p>
                        <button
                          onClick={handleCalendlyConnect}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          Authorize with Calendly
                        </button>
                      </>
                    )}

                    {/* Square connect */}
                    {integration.id === 'square' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-gray-900 mb-1">Connect Square</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Authorize VoiceFly with your Square account to sync your menu.
                        </p>
                        <button
                          onClick={handleSquareConnect}
                          disabled={squareConnecting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                            squareConnecting ? 'bg-indigo-300 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {squareConnecting ? 'Redirecting...' : 'Authorize with Square'}
                        </button>
                      </>
                    )}

                    {/* Square sync (when already connected) */}
                    {integration.id === 'square' && isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-gray-900 mb-3">Sync to Employee</p>
                        {(() => {
                          const compat = compatibleEmployees(integration.employeeTypes)
                          if (compat.length === 0) {
                            return (
                              <p className="text-[13px] text-gray-500">
                                No order-taker employees found.{' '}
                                <a href="/dashboard/employees" className="text-indigo-600 hover:text-indigo-700">Create one first.</a>
                              </p>
                            )
                          }
                          return (
                            <div className="flex gap-2 items-center flex-wrap">
                              <select
                                value={syncEmployeeId}
                                onChange={e => setSyncEmployeeId(e.target.value)}
                                className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select employee...</option>
                                {compat.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSquareSync(syncEmployeeId)}
                                disabled={squareSyncing || !syncEmployeeId}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                                  squareSyncing || !syncEmployeeId ? 'bg-indigo-300 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                              >
                                {squareSyncing ? 'Syncing...' : 'Sync Menu'}
                              </button>
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export default function ProtectedIntegrationsPage() {
  return (
    <ProtectedRoute>
      <IntegrationsPage />
    </ProtectedRoute>
  )
}
