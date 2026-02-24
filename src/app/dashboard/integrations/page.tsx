'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { getSecureBusinessId } from '../../../lib/multi-tenant-auth'
import { supabase } from '../../../lib/supabase-client'
import { PuzzlePieceIcon } from '@heroicons/react/24/outline'

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  'order-taker': 'Order Taker',
  'receptionist': 'Receptionist',
  'appointment-scheduler': 'Appointment Scheduler',
  'personal-assistant': 'Personal Assistant',
  'customer-service': 'Customer Service',
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'square',
    name: 'Square',
    description: 'Sync your menu and accept orders directly through Square POS.',
    category: 'Restaurant & Retail',
    employeeTypes: ['order-taker'],
    color: 'green',
    comingSoon: false,
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Pull your full menu, modifiers, and 86 list from Toast POS.',
    category: 'Restaurant',
    employeeTypes: ['order-taker'],
    color: 'red',
    comingSoon: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Let your phone employee check real availability and book appointments.',
    category: 'Scheduling',
    employeeTypes: ['receptionist', 'appointment-scheduler', 'personal-assistant'],
    color: 'blue',
    comingSoon: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Look up orders, check status, and initiate returns during calls.',
    category: 'E-commerce',
    employeeTypes: ['customer-service'],
    color: 'purple',
    comingSoon: true,
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  red: { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
  blue: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  purple: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [squareToken, setSquareToken] = useState('')
  const [squareLocationId, setSquareLocationId] = useState('')
  const [connectingSquare, setConnectingSquare] = useState(false)
  const [syncingSquare, setSyncingSquare] = useState(false)
  const [squareError, setSquareError] = useState<string | null>(null)
  const [squareSuccess, setSquareSuccess] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [syncEmployeeId, setSyncEmployeeId] = useState('')

  const loadData = useCallback(async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) { setLoading(false); return }

    const headers = await getAuthHeaders()

    const [intRes, empRes] = await Promise.all([
      fetch(`/api/integrations?businessId=${businessId}`, { headers }),
      fetch(`/api/phone-employees?businessId=${businessId}`, { headers }),
    ])

    if (intRes.ok) {
      const data = await intRes.json()
      setIntegrations(data.integrations ?? data ?? {})
    }

    if (empRes.ok) {
      const data = await empRes.json()
      setEmployees(data.employees ?? data ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSquareConnect = async () => {
    setConnectingSquare(true)
    setSquareError(null)
    setSquareSuccess(null)

    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      // Prefer OAuth flow if no manual token entered
      if (!squareToken.trim()) {
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
        setSquareError(data.error ?? 'Failed to start Square authorization.')
        setConnectingSquare(false)
        return
      }

      // API key fallback
      const res = await fetch('/api/integrations/square/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          businessId,
          accessToken: squareToken,
          ...(squareLocationId ? { locationId: squareLocationId } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSquareError(data.error ?? 'Failed to connect Square.')
      } else {
        setSquareSuccess('Square connected successfully.')
        setSquareToken('')
        setSquareLocationId('')
        loadData()
      }
    } catch {
      setSquareError('Network error. Please try again.')
    }

    setConnectingSquare(false)
  }

  const handleSquareSync = async (employeeId: string) => {
    setSyncingSquare(true)
    setSquareError(null)
    setSquareSuccess(null)

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
        setSquareError(data.error ?? 'Sync failed.')
      } else {
        const emp = employees.find(e => e.id === employeeId)
        const empName = emp?.name ?? 'your employee'
        setSquareSuccess(
          data.message ?? `Synced ${data.itemCount ?? ''} items across ${data.categoryCount ?? ''} categories to ${empName}.`
        )
        loadData()
      }
    } catch {
      setSquareError('Network error. Please try again.')
    }

    setSyncingSquare(false)
  }

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

  const squareIntegration = integrations['square']
  const isSquareConnected = !!squareIntegration
  const compatibleEmployees = employees.filter(e =>
    ['order-taker', 'order_taker'].includes(e.job_type)
  )

  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <PuzzlePieceIcon style={{ width: 28, height: 28, color: '#6366f1' }} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Integrations</h1>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Connect your business tools to power your phone employees.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading integrations…</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {AVAILABLE_INTEGRATIONS.map(integration => {
                const colors = COLOR_MAP[integration.color] ?? COLOR_MAP.blue
                const isConnected = !!integrations[integration.id]
                const connectedData = integrations[integration.id]
                const isExpanded = expandedCard === integration.id

                return (
                  <div
                    key={integration.id}
                    style={{
                      border: `1px solid ${integration.comingSoon ? '#e5e7eb' : isConnected ? '#bbf7d0' : '#e5e7eb'}`,
                      borderRadius: 12,
                      background: integration.comingSoon ? '#fafafa' : '#fff',
                      overflow: 'hidden',
                      opacity: integration.comingSoon ? 0.75 : 1,
                    }}
                  >
                    <div style={{ padding: '18px 18px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, fontWeight: 700, color: colors.text,
                          flexShrink: 0,
                        }}>
                          {integration.name.charAt(0)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{integration.name}</span>
                            {integration.comingSoon && (
                              <span style={{
                                fontSize: 11, fontWeight: 600,
                                background: '#f3f4f6', color: '#6b7280',
                                padding: '2px 7px', borderRadius: 20,
                              }}>
                                Coming Soon
                              </span>
                            )}
                            {isConnected && (
                              <span style={{
                                fontSize: 11, fontWeight: 600,
                                background: '#dcfce7', color: '#166534',
                                padding: '2px 7px', borderRadius: 20,
                              }}>
                                Connected
                              </span>
                            )}
                          </div>
                          <span style={{
                            fontSize: 11, color: colors.text,
                            background: colors.bg, padding: '1px 6px', borderRadius: 4,
                            display: 'inline-block', marginTop: 3,
                          }}>
                            {integration.category}
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                        {integration.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                        {integration.employeeTypes.map(type => (
                          <span key={type} style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                          }}>
                            {EMPLOYEE_TYPE_LABELS[type] ?? type}
                          </span>
                        ))}
                      </div>

                      {!integration.comingSoon && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {isConnected ? (
                            <>
                              {connectedData?.last_synced && (
                                <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                                  Last synced {new Date(connectedData.last_synced).toLocaleDateString()}
                                </span>
                              )}
                              <button
                                onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                                style={{
                                  padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                  background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer',
                                }}
                              >
                                Sync Now
                              </button>
                              <button
                                onClick={() => handleDisconnect(integration.id)}
                                style={{
                                  padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                  background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', cursor: 'pointer',
                                }}
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                              style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer',
                              }}
                            >
                              {isExpanded ? 'Cancel' : 'Connect'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && integration.id === 'square' && (
                      <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 18px', background: '#f9fafb' }}>
                        {!isSquareConnected ? (
                          <>
                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                              Connect Square
                            </p>
                            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
                              Click below to authorize VoiceFly with your Square account.
                            </p>

                            <button
                              onClick={handleSquareConnect}
                              disabled={connectingSquare}
                              style={{
                                padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                background: connectingSquare ? '#c7d2fe' : '#6366f1',
                                color: '#fff', border: 'none',
                                cursor: connectingSquare ? 'default' : 'pointer',
                              }}
                            >
                              {connectingSquare ? 'Redirecting…' : 'Authorize with Square'}
                            </button>
                          </>
                        ) : (
                          <>
                            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                              Sync to Employee
                            </p>

                            {compatibleEmployees.length === 0 ? (
                              <p style={{ fontSize: 13, color: '#6b7280' }}>
                                No order-taker employees found.{' '}
                                <a href="/dashboard/employees" style={{ color: '#6366f1' }}>Create one first.</a>
                              </p>
                            ) : (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                  value={syncEmployeeId}
                                  onChange={e => setSyncEmployeeId(e.target.value)}
                                  style={{
                                    flex: 1, minWidth: 160, padding: '7px 10px', borderRadius: 7,
                                    border: '1px solid #d1d5db', fontSize: 13,
                                  }}
                                >
                                  <option value="">Select employee…</option>
                                  {compatibleEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSquareSync(syncEmployeeId)}
                                  disabled={syncingSquare || !syncEmployeeId}
                                  style={{
                                    padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                    background: syncingSquare || !syncEmployeeId ? '#c7d2fe' : '#6366f1',
                                    color: '#fff', border: 'none',
                                    cursor: syncingSquare || !syncEmployeeId ? 'default' : 'pointer',
                                  }}
                                >
                                  {syncingSquare ? 'Syncing…' : 'Sync Menu'}
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {squareError && (
                          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#dc2626' }}>{squareError}</p>
                        )}
                        {squareSuccess && (
                          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#16a34a' }}>{squareSuccess}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
