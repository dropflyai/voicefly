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
  'lead-qualifier': 'Lead Qualifier',
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
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Auto-log calls, create contacts, and push qualified leads into your HubSpot CRM.',
    category: 'CRM',
    employeeTypes: ['receptionist', 'customer-service'],
    color: 'purple',
    comingSoon: false,
    connectType: 'apikey',
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
    comingSoon: false,
    connectType: 'apikey',
  },
  {
    id: 'clover',
    name: 'Clover',
    description: 'Sync your Clover menu and process phone orders through your POS.',
    category: 'Restaurant & Retail',
    employeeTypes: ['order-taker'],
    color: 'green',
    comingSoon: false,
    connectType: 'apikey',
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  green: { bg: 'bg-emerald-500/5', text: 'text-emerald-500', border: 'border-transparent', iconBg: 'bg-emerald-500/10' },
  red: { bg: 'bg-[#93000a]/5', text: 'text-[#ffb4ab]', border: 'border-transparent', iconBg: 'bg-[#93000a]/10' },
  blue: { bg: 'bg-brand-primary/5', text: 'text-brand-light', border: 'border-transparent', iconBg: 'bg-brand-primary/10' },
  purple: { bg: 'bg-purple-500/5', text: 'text-purple-400', border: 'border-transparent', iconBg: 'bg-purple-500/10' },
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

  // HubSpot state
  const [hubspotToken, setHubspotToken] = useState('')
  const [hubspotConnecting, setHubspotConnecting] = useState(false)

  // Shopify state
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')
  const [shopifyConnecting, setShopifyConnecting] = useState(false)

  // Clover state
  const [cloverMerchantId, setCloverMerchantId] = useState('')
  const [cloverToken, setCloverToken] = useState('')
  const [cloverConnecting, setCloverConnecting] = useState(false)

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

  // --- HubSpot ---
  const handleHubSpotConnect = async () => {
    if (!hubspotToken.trim()) {
      showFeedback('error', 'Please enter your HubSpot Private App token.')
      return
    }
    setHubspotConnecting(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/hubspot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, token: hubspotToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback('error', data.error ?? 'Failed to connect HubSpot.')
      } else {
        showFeedback('success', `HubSpot connected successfully${data.portalId ? ` (Portal ${data.portalId})` : ''}.`)
        setHubspotToken('')
        setExpandedCard(null)
        loadData()
      }
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setHubspotConnecting(false)
  }

  // --- Shopify ---
  const handleShopifyConnect = async () => {
    if (!shopifyDomain.trim()) {
      showFeedback('error', 'Please enter your Shopify store domain.')
      return
    }
    if (!shopifyToken.trim()) {
      showFeedback('error', 'Please enter your Shopify access token.')
      return
    }
    setShopifyConnecting(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/shopify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, shopDomain: shopifyDomain.trim(), accessToken: shopifyToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback('error', data.error ?? 'Failed to connect Shopify.')
      } else {
        showFeedback('success', `Shopify connected${data.shopName ? ` (${data.shopName})` : ''}.`)
        setShopifyDomain('')
        setShopifyToken('')
        setExpandedCard(null)
        loadData()
      }
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setShopifyConnecting(false)
  }

  // --- Clover ---
  const handleCloverConnect = async () => {
    if (!cloverMerchantId.trim()) {
      showFeedback('error', 'Please enter your Clover Merchant ID.')
      return
    }
    if (!cloverToken.trim()) {
      showFeedback('error', 'Please enter your Clover API token.')
      return
    }
    setCloverConnecting(true)
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    try {
      const res = await fetch('/api/integrations/clover/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, merchantId: cloverMerchantId.trim(), accessToken: cloverToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        showFeedback('error', data.error ?? 'Failed to connect Clover.')
      } else {
        showFeedback('success', `Clover connected${data.merchantName ? ` (${data.merchantName})` : ''}.`)
        setCloverMerchantId('')
        setCloverToken('')
        setExpandedCard(null)
        loadData()
      }
    } catch {
      showFeedback('error', 'Network error. Please try again.')
    }
    setCloverConnecting(false)
  }

  // --- Disconnect any ---
  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return
    const businessId = getSecureBusinessId()
    const headers = await getAuthHeaders()

    if (platform === 'hubspot') {
      await fetch('/api/integrations/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ businessId, action: 'disconnect' }),
      })
    } else {
      await fetch(`/api/integrations/${platform}?businessId=${businessId}`, {
        method: 'DELETE',
        headers,
      })
    }
    loadData()
  }

  const compatibleEmployees = (types: string[]) =>
    employees.filter(e => types.some(t => e.job_type === t || e.job_type === t.replace('-', '_')))

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-highest rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-surface-highest rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Integrations</h1>
          <p className="text-text-secondary mt-1">
            Connect your business tools to enable seamless, AI-powered workflow synchronization with your existing tools in real-time.
          </p>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${
            feedback.type === 'error'
              ? 'bg-[#93000a]/5 text-[#ffb4ab]'
              : 'bg-emerald-500/5 text-emerald-500'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Integration cards — Stitch 2x3 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_INTEGRATIONS.map(integration => {
            const colors = COLOR_MAP[integration.color] ?? COLOR_MAP.blue
            const connected = integrations[integration.id]
            const isConnected = !!connected
            const isExpanded = expandedCard === integration.id

            return (
              <div
                key={integration.id}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  integration.comingSoon
                    ? 'bg-surface-low opacity-60'
                    : isConnected
                      ? 'bg-surface-low hover:bg-surface-med'
                      : 'bg-surface-low hover:bg-surface-med'
                }`}
              >
                <div className="p-6">
                  {/* Top row: icon + name + badges */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-brand-primary">
                        {integration.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[15px] text-text-primary font-[family-name:var(--font-manrope)]">{integration.name}</span>
                        {integration.comingSoon && (
                          <span className="text-[11px] font-semibold bg-surface-high text-text-secondary px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                        {isConnected && !connected.syncError && (
                          <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Healthy
                          </span>
                        )}
                        {isConnected && connected.syncError && (
                          <span className="text-[11px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
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
                    <div className="mb-3 px-3 py-2 bg-accent/5 rounded-lg">
                      <p className="text-xs text-accent">
                        <span className="font-medium">Sync issue:</span> {connected.syncError}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
                    {integration.description}
                  </p>

                  {/* Compatible employee types */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {integration.employeeTypes.map(type => (
                      <span key={type} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-primary/5 text-brand-light">
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
                            <span className="text-xs text-text-secondary mr-auto">
                              Last synced {new Date(connected.lastSyncedAt).toLocaleDateString()}
                            </span>
                          )}
                          {integration.id === 'square' && (
                            <button
                              onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-brand-primary text-brand-on hover:bg-[#0060d0] transition-colors"
                            >
                              Sync Now
                            </button>
                          )}
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#ffb4ab] bg-[#93000a]/5 hover:bg-[#93000a]/10 transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : integration.id)}
                          className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-brand-primary text-brand-on hover:bg-[#0060d0] transition-colors"
                        >
                          {isExpanded ? 'Cancel' : 'Connect'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded connect/sync panel */}
                {isExpanded && (
                  <div className="border-t border-[rgba(65,71,84,0.15)] bg-surface p-5">
                    {/* Google Calendar connect */}
                    {integration.id === 'google-calendar' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect Google Calendar</p>
                        <p className="text-xs text-text-secondary mb-3">
                          Share your calendar with <span className="font-mono text-xs bg-surface-high px-1 py-0.5 rounded">voicefly-calendar@voice-fly.iam.gserviceaccount.com</span>, then enter your Calendar ID below.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={calendarId}
                            onChange={e => setCalendarId(e.target.value)}
                            placeholder="your-email@gmail.com or calendar ID"
                            className="flex-1 px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                          />
                          <button
                            onClick={handleGoogleCalendarConnect}
                            disabled={calendarConnecting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                              calendarConnecting ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
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
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect Calendly</p>
                        <p className="text-xs text-text-secondary mb-3">
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
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect Square</p>
                        <p className="text-xs text-text-secondary mb-3">
                          Authorize VoiceFly with your Square account to sync your menu.
                        </p>
                        <button
                          onClick={handleSquareConnect}
                          disabled={squareConnecting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                            squareConnecting ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
                          }`}
                        >
                          {squareConnecting ? 'Redirecting...' : 'Authorize with Square'}
                        </button>
                      </>
                    )}

                    {/* HubSpot connect */}
                    {integration.id === 'hubspot' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect HubSpot</p>
                        <p className="text-xs text-text-secondary mb-2">
                          Create a <a href="https://knowledge.hubspot.com/integrations/how-do-i-get-my-hubspot-api-key#create-a-private-app" target="_blank" rel="noopener noreferrer" className="text-brand-light hover:text-brand-primary underline">Private App</a> in your HubSpot account with these scopes:
                        </p>
                        <ul className="text-xs text-text-secondary mb-3 list-disc list-inside space-y-0.5">
                          <li><span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">crm.objects.contacts.read/write</span></li>
                          <li><span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">crm.objects.deals.read/write</span></li>
                        </ul>
                        <p className="text-xs text-text-secondary mb-3">Then paste your Private App token below.</p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={hubspotToken}
                            onChange={e => setHubspotToken(e.target.value)}
                            placeholder="pat-na1-xxxxxxxx-xxxx-xxxx..."
                            className="flex-1 px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                          />
                          <button
                            onClick={handleHubSpotConnect}
                            disabled={hubspotConnecting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                              hubspotConnecting ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
                            }`}
                          >
                            {hubspotConnecting ? 'Connecting...' : 'Connect'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Shopify connect */}
                    {integration.id === 'shopify' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect Shopify</p>
                        <p className="text-xs text-text-secondary mb-3">
                          In your Shopify admin, go to <span className="font-medium">Settings &gt; Apps and sales channels &gt; Develop apps</span>. Create a custom app with <span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">read_products</span>, <span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">read_orders</span> scopes, then paste the details below.
                        </p>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={shopifyDomain}
                            onChange={e => setShopifyDomain(e.target.value)}
                            placeholder="your-store.myshopify.com"
                            className="w-full px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                          />
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={shopifyToken}
                              onChange={e => setShopifyToken(e.target.value)}
                              placeholder="Admin API access token (shpat_...)"
                              className="flex-1 px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                            />
                            <button
                              onClick={handleShopifyConnect}
                              disabled={shopifyConnecting}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                                shopifyConnecting ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
                              }`}
                            >
                              {shopifyConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Clover connect */}
                    {integration.id === 'clover' && !isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-text-primary mb-1">Connect Clover</p>
                        <p className="text-xs text-text-secondary mb-3">
                          In your Clover dashboard, go to <span className="font-medium">Account &amp; Setup &gt; API Tokens</span> to create a token with <span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">Inventory</span> and <span className="font-mono bg-surface-high px-1 py-0.5 rounded text-[11px]">Orders</span> read permissions. Your Merchant ID is in the URL when logged into Clover.
                        </p>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={cloverMerchantId}
                            onChange={e => setCloverMerchantId(e.target.value)}
                            placeholder="Merchant ID"
                            className="w-full px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                          />
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={cloverToken}
                              onChange={e => setCloverToken(e.target.value)}
                              placeholder="API token"
                              className="flex-1 px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                            />
                            <button
                              onClick={handleCloverConnect}
                              disabled={cloverConnecting}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                                cloverConnecting ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
                              }`}
                            >
                              {cloverConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Square sync (when already connected) */}
                    {integration.id === 'square' && isConnected && (
                      <>
                        <p className="text-[13px] font-semibold text-text-primary mb-3">Sync to Employee</p>
                        {(() => {
                          const compat = compatibleEmployees(integration.employeeTypes)
                          if (compat.length === 0) {
                            return (
                              <p className="text-[13px] text-text-secondary">
                                No order-taker employees found.{' '}
                                <a href="/dashboard/employees" className="text-brand-light hover:text-brand-primary">Create one first.</a>
                              </p>
                            )
                          }
                          return (
                            <div className="flex gap-2 items-center flex-wrap">
                              <select
                                value={syncEmployeeId}
                                onChange={e => setSyncEmployeeId(e.target.value)}
                                className="flex-1 min-w-[160px] px-3 py-2 text-sm bg-surface-lowest rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
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
                                  squareSyncing || !syncEmployeeId ? 'bg-surface-highest cursor-default' : 'bg-brand-primary hover:bg-[#0060d0]'
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

        {/* Coming Soon — Waveform Section */}
        <div className="bg-surface-lowest rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)] mb-2">Coming Soon</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
              More integrations are on the way. We&apos;re building connections to the tools your business already uses.
            </p>
            <div className="flex items-center justify-center gap-1 h-16">
              {[6, 12, 20, 28, 16, 24, 10, 20, 28, 14, 6, 16].map((h, i) => (
                <div key={i} className="w-1 bg-brand-primary rounded-full" style={{ height: `${h * 2}px`, opacity: 0.2 + (h / 28) * 0.4 }} />
              ))}
            </div>
          </div>
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
