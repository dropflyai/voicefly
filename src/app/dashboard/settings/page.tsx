'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '../../../components/Layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  BuildingOfficeIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  LinkIcon,
  StarIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface BusinessHours {
  [key: string]: { open: string; close: string; isOpen: boolean }
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

// ============================================
// GOOGLE CALENDAR INTEGRATION COMPONENT
// ============================================

function GoogleCalendarIntegration() {
  const supabase = createClientComponentClient()
  const [calendarId, setCalendarId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const loadCalendarStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get business ID from user's membership
      const { data: membership } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!membership) return

      const res = await fetch(`/api/settings/google-calendar?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()

      setIsConnected(data.connected || false)
      setCalendarId(data.calendarId || '')
      setServiceAccountEmail(data.serviceAccountEmail || null)
      setIsConfigured(data.configured || false)
    } catch {
      // Silently fail on load
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadCalendarStatus()
  }, [loadCalendarStatus])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const { data: membership } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!membership) {
        setError('Business not found')
        return
      }

      const res = await fetch('/api/settings/google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          businessId: membership.business_id,
          calendarId: calendarId.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save')
        return
      }

      setIsConnected(data.connected)
      setSuccess(data.message)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setCalendarId('')
    setSaving(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: membership } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!membership) return

      const res = await fetch('/api/settings/google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          businessId: membership.business_id,
          calendarId: null,
        }),
      })

      const data = await res.json()
      setIsConnected(false)
      setSuccess('Google Calendar disconnected')
    } catch {
      setError('Failed to disconnect')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    )
  }

  const copyServiceEmail = () => {
    if (serviceAccountEmail) {
      navigator.clipboard.writeText(serviceAccountEmail)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Google Calendar</h2>
              <p className="text-sm text-gray-500">Your AI employee books appointments directly into your calendar</p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          )}
        </div>

        {!isConfigured ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Google Calendar integration is not configured yet. Please contact support.
            </p>
          </div>
        ) : isConnected ? (
          /* Connected state - show current calendar and option to change/disconnect */
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Your calendar is connected.</p>
              <p className="text-sm text-green-700 mt-1">Your AI employee can see your availability and book appointments.</p>
            </div>

            <div>
              <label className="label">Connected Calendar ID</label>
              <input
                type="text"
                className="input-field"
                value={calendarId}
                onChange={(e) => {
                  setCalendarId(e.target.value)
                  setError(null)
                  setSuccess(null)
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !calendarId.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Calendar'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={saving}
                className="btn-secondary text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* Not connected - guided 3-step setup */
          <div className="space-y-5">
            {/* Step 1 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</div>
              <h3 className="text-sm font-semibold text-gray-900">Share your calendar with VoiceFly</h3>
              <p className="text-sm text-gray-600 mt-1">
                Open <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Google Calendar Settings</a>, click on the calendar you want to use, then scroll to <strong>"Share with specific people"</strong> and add this email:
              </p>
              {serviceAccountEmail && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono break-all">
                    {serviceAccountEmail}
                  </code>
                  <button
                    onClick={copyServiceEmail}
                    className="shrink-0 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedEmail ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1.5">Set the permission to <strong>"Make changes to events"</strong></p>
            </div>

            {/* Step 2 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</div>
              <h3 className="text-sm font-semibold text-gray-900">Find your Calendar ID</h3>
              <p className="text-sm text-gray-600 mt-1">
                In the same calendar settings page, scroll down to <strong>"Integrate calendar"</strong> and copy the <strong>Calendar ID</strong>.
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                Tip: For your primary calendar, the Calendar ID is usually your Gmail address (e.g. you@gmail.com)
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</div>
              <h3 className="text-sm font-semibold text-gray-900">Paste your Calendar ID below</h3>
              <div className="mt-2">
                <input
                  type="text"
                  className="input-field"
                  placeholder="you@gmail.com or xxxxxx@group.calendar.google.com"
                  value={calendarId}
                  onChange={(e) => {
                    setCalendarId(e.target.value)
                    setError(null)
                    setSuccess(null)
                  }}
                />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !calendarId.trim()}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Connecting...' : 'Connect Calendar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// CALENDLY INTEGRATION COMPONENT
// ============================================

function CalendlyIntegration() {
  const supabase = createClientComponentClient()
  const [isConnected, setIsConnected] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [eventTypes, setEventTypes] = useState<Array<{ uri: string; name: string }>>([])
  const [selectedEventType, setSelectedEventType] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return
      setBusinessId(membership.business_id)

      const res = await fetch(`/api/settings/calendly?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setIsConnected(data.connected || false)
      setUserName(data.userName || null)
      setEventTypes(data.eventTypes || [])
      setSelectedEventType(data.selectedEventTypeUri || '')

      // Check URL params for OAuth callback result
      const params = new URLSearchParams(window.location.search)
      if (params.get('calendly_connected') === 'true') {
        setIsConnected(true)
        setSuccess('Calendly connected successfully')
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
      if (params.get('calendly_error')) {
        const errorMap: Record<string, string> = {
          authorization_denied: 'You declined the Calendly authorization.',
          token_exchange_failed: 'Failed to complete authorization. Please try again.',
          save_failed: 'Connected but failed to save. Please try again.',
          unexpected: 'Something went wrong. Please try again.',
        }
        setError(errorMap[params.get('calendly_error')!] || 'Authorization failed. Please try again.')
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleConnectOAuth = async () => {
    if (!businessId) { setError('Business not found'); return }
    setConnecting(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }

      // Redirect to our OAuth authorize endpoint which redirects to Calendly
      window.location.href = `/api/integrations/calendly/oauth?businessId=${businessId}`
    } catch (err: any) {
      setError(err.message || 'Failed to start connection')
      setConnecting(false)
    }
  }

  const handleUpdateEventType = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      if (!businessId) return

      const res = await fetch('/api/settings/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId, action: 'update', eventTypeUri: selectedEventType }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Failed to update'); return }
      setSuccess('Event type updated')
    } catch (err: any) { setError(err.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  const handleDisconnect = async () => {
    setSaving(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      if (!businessId) return

      await fetch('/api/settings/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId, action: 'disconnect' }),
      })
      setIsConnected(false); setUserName(null); setEventTypes([]); setSelectedEventType('')
      setSuccess('Calendly disconnected')
    } catch { setError('Failed to disconnect') }
    finally { setSaving(false) }
  }

  if (loading) {
    return <div className="card"><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-full" /></div></div></div>
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Calendly</h2>
              <p className="text-sm text-gray-500">Let your AI employee book appointments via Calendly</p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected{userName ? ` - ${userName}` : ''}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <p className="text-sm text-gray-600">
                Connect your Calendly account so your AI employee can check your availability and book appointments for callers.
              </p>
              <button
                onClick={handleConnectOAuth}
                disabled={connecting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {connecting ? 'Redirecting to Calendly...' : 'Connect Calendly'}
              </button>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Calendly is connected{userName ? ` as ${userName}` : ''}.</p>
                <p className="text-sm text-green-700 mt-1">Your AI employee can check availability and book appointments.</p>
              </div>
              {eventTypes.length > 0 && (
                <div>
                  <label className="label">Default Event Type</label>
                  <select className="input-field" value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)}>
                    <option value="">Select event type...</option>
                    {eventTypes.map(et => <option key={et.uri} value={et.uri}>{et.name}</option>)}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Used for availability checks by your AI employee</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                {eventTypes.length > 0 && (
                  <button onClick={handleUpdateEventType} disabled={saving} className="btn-primary disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Event Type'}
                  </button>
                )}
                <button onClick={handleDisconnect} disabled={saving} className="btn-secondary text-red-600 hover:text-red-700 disabled:opacity-50">
                  Disconnect
                </button>
              </div>
            </>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700">{success}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SQUARE POS INTEGRATION COMPONENT
// ============================================

function SquareIntegration() {
  const supabase = createClientComponentClient()
  const [isConnected, setIsConnected] = useState(false)
  const [merchantName, setMerchantName] = useState<string | null>(null)
  const [locationName, setLocationName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      const res = await fetch(`/api/integrations/square/status?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setIsConnected(data.connected || false)
      setMerchantName(data.merchantName || null)
      setLocationName(data.locationName || null)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleConnect = async () => {
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) { setError('Business not found'); return }

      const res = await fetch('/api/integrations/square/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id }),
      })
      const data = await res.json()
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        setError(data.error || 'Failed to get authorization URL')
      }
    } catch (err: any) { setError(err.message || 'Failed to connect') }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      await fetch('/api/integrations/square/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id }),
      })
      setIsConnected(false); setMerchantName(null); setLocationName(null)
      setSuccess('Square disconnected')
    } catch { setError('Failed to disconnect') }
    finally { setDisconnecting(false) }
  }

  if (loading) {
    return <div className="card"><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-full" /></div></div></div>
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Square POS</h2>
              <p className="text-sm text-gray-500">Sync orders to your Square POS</p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          )}
        </div>

        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {merchantName && <div><span className="text-gray-500">Merchant:</span> <span className="font-medium">{merchantName}</span></div>}
                  {locationName && <div><span className="text-gray-500">Location:</span> <span className="font-medium">{locationName}</span></div>}
                </div>
              </div>
              <p className="text-sm text-gray-500">Phone orders are automatically synced to your Square POS when confirmed.</p>
              <button onClick={handleDisconnect} disabled={disconnecting} className="btn-secondary text-red-600 hover:text-red-700 disabled:opacity-50">
                {disconnecting ? 'Disconnecting...' : 'Disconnect Square'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Connect your Square account to automatically sync phone orders to your POS system.</p>
              <button onClick={handleConnect} className="btn-primary">
                Connect Square Account
              </button>
            </>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700">{success}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ============================================
// HUBSPOT CRM INTEGRATION COMPONENT
// ============================================

function HubSpotIntegration() {
  const supabase = createClientComponentClient()
  const [accessToken, setAccessToken] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [portalId, setPortalId] = useState<string | null>(null)
  const [settings, setSettings] = useState({ syncContacts: true, syncCalls: true, syncDeals: true, createTasks: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      const res = await fetch(`/api/integrations/hubspot?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setIsConnected(data.connected || false)
      setPortalId(data.portalId || null)
      if (data.settings) setSettings(data.settings)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleConnect = async () => {
    if (!accessToken.trim()) { setError('Please enter your HubSpot Private App token'); return }
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) { setError('Business not found'); return }

      const res = await fetch('/api/integrations/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id, action: 'connect', token: accessToken.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Failed to connect'); return }
      setIsConnected(true); setPortalId(data.portalId || null)
      setSuccess('HubSpot connected successfully'); setAccessToken('')
    } catch (err: any) { setError(err.message || 'Failed to connect') }
    finally { setSaving(false) }
  }

  const handleUpdateSettings = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      const res = await fetch('/api/integrations/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id, action: 'update-settings', settings }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Failed to update settings'); return }
      setSuccess('Settings updated')
    } catch (err: any) { setError(err.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  const handleDisconnect = async () => {
    setSaving(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      await fetch('/api/integrations/hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id, action: 'disconnect' }),
      })
      setIsConnected(false); setPortalId(null)
      setSuccess('HubSpot disconnected')
    } catch { setError('Failed to disconnect') }
    finally { setSaving(false) }
  }

  if (loading) {
    return <div className="card"><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-full" /></div></div></div>
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <GlobeAltIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">HubSpot CRM</h2>
              <p className="text-sm text-gray-500">Sync contacts, calls, and deals</p>
            </div>
          </div>
          {isConnected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected{portalId ? ` (${portalId})` : ''}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to HubSpot &gt; Settings &gt; Integrations &gt; Private Apps</li>
                  <li>Create a new Private App with scopes: crm.objects.contacts, crm.objects.deals, crm.objects.owners</li>
                  <li>Copy the access token and paste it below</li>
                </ol>
              </div>
              <div>
                <label className="label">Private App Access Token</label>
                <input type="password" className="input-field" placeholder="pat-na1-..." value={accessToken} onChange={(e) => { setAccessToken(e.target.value); setError(null) }} />
              </div>
              <button onClick={handleConnect} disabled={saving || !accessToken.trim()} className="btn-primary disabled:opacity-50">
                {saving ? 'Connecting...' : 'Connect HubSpot'}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Sync Settings</h3>
                {[
                  { key: 'syncContacts', label: 'Sync Contacts', desc: 'Create/update HubSpot contacts from callers' },
                  { key: 'syncCalls', label: 'Sync Calls', desc: 'Log call engagements in HubSpot' },
                  { key: 'syncDeals', label: 'Sync Deals', desc: 'Create deals from confirmed orders' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start space-x-3">
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={clsx(
                        'mt-1 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                        settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    >
                      <span className={clsx('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200', settings[key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0')} />
                    </button>
                    <div><div className="text-sm font-medium text-gray-900">{label}</div><div className="text-sm text-gray-500">{desc}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleUpdateSettings} disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button onClick={handleDisconnect} disabled={saving} className="btn-secondary text-red-600 hover:text-red-700 disabled:opacity-50">
                  Disconnect
                </button>
              </div>
            </>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700">{error}</p></div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700">{success}</p></div>}
        </div>
      </div>
    </div>
  )
}

// ============================================
// GOOGLE REVIEWS SMS COMPONENT
// ============================================

function GoogleReviewsSettings() {
  const supabase = createClientComponentClient()
  const [config, setConfig] = useState({
    enabled: false,
    placeId: '',
    googleMapsUrl: '',
    messageTemplate: 'Thanks for choosing {business}! We\'d love your feedback. Leave us a review: {link}',
    delayMinutes: 30,
    applyToInteractions: ['orders', 'appointments'] as string[],
  })
  const [stats, setStats] = useState<{ totalSent: number; optedOut: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      const res = await fetch(`/api/settings/google-reviews?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.config) setConfig(prev => ({ ...prev, ...data.config }))
      if (data.stats) setStats(data.stats)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadConfig() }, [loadConfig])

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) { setError('Business not found'); return }

      const res = await fetch('/api/settings/google-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id, config }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Failed to save'); return }
      setSuccess('Google Reviews settings saved')
    } catch (err: any) { setError(err.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) {
    return <div className="card"><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-full" /></div></div></div>
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Google Reviews</h2>
              <p className="text-sm text-gray-500">Auto-send review requests via SMS</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={clsx(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              config.enabled ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span className={clsx('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200', config.enabled ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </div>

        {config.enabled && (
          <div className="space-y-4">
            <div>
              <label className="label">Google Place ID</label>
              <input type="text" className="input-field" placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" value={config.placeId} onChange={(e) => setConfig(prev => ({ ...prev, placeId: e.target.value }))} />
              <p className="text-xs text-gray-500 mt-1">Find at Google Place ID Finder or from your Google Business Profile URL</p>
            </div>

            <div>
              <label className="label">Or Google Maps URL</label>
              <input type="url" className="input-field" placeholder="https://g.page/r/..." value={config.googleMapsUrl} onChange={(e) => setConfig(prev => ({ ...prev, googleMapsUrl: e.target.value }))} />
            </div>

            <div>
              <label className="label">SMS Message Template</label>
              <textarea className="input-field" rows={3} value={config.messageTemplate} onChange={(e) => setConfig(prev => ({ ...prev, messageTemplate: e.target.value }))} />
              <p className="text-xs text-gray-500 mt-1">Use {'{business}'} for business name, {'{link}'} for review link</p>
            </div>

            <div>
              <label className="label">Delay After Interaction (minutes)</label>
              <input type="number" className="input-field w-32" min={5} max={1440} value={config.delayMinutes} onChange={(e) => setConfig(prev => ({ ...prev, delayMinutes: parseInt(e.target.value) || 30 }))} />
            </div>

            <div>
              <label className="label">Send After</label>
              <div className="flex gap-3 mt-1">
                {[
                  { key: 'orders', label: 'Orders' },
                  { key: 'appointments', label: 'Appointments' },
                  { key: 'all_calls', label: 'All Calls' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600"
                      checked={config.applyToInteractions.includes(key)}
                      onChange={(e) => {
                        setConfig(prev => ({
                          ...prev,
                          applyToInteractions: e.target.checked
                            ? [...prev.applyToInteractions, key]
                            : prev.applyToInteractions.filter(i => i !== key),
                        }))
                      }}
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {stats && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <span className="text-gray-600">Last 30 days:</span>{' '}
                <span className="font-medium">{stats.totalSent} sent</span>{' '}
                <span className="text-gray-400">|</span>{' '}
                <span className="font-medium">{stats.optedOut} opted out</span>
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Review Settings'}
            </button>
          </div>
        )}

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4"><p className="text-sm text-red-700">{error}</p></div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg mt-4"><p className="text-sm text-green-700">{success}</p></div>}
      </div>
    </div>
  )
}

// ============================================
// AUTOMATION RULES COMPONENT
// ============================================

function AutomationRules() {
  const supabase = createClientComponentClient()
  const [rules, setRules] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchRules = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: bu } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!bu) return

      const res = await fetch(
        `/api/settings/automation-rules?businessId=${bu.business_id}&templates=true&logs=true`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
        setTemplates(data.templates || [])
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch automation rules:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchRules() }, [fetchRules])

  const enableTemplate = async (templateId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: bu } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!bu) return

      const res = await fetch('/api/settings/automation-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ businessId: bu.business_id, templateId }),
      })

      if (res.ok) {
        fetchRules()
      }
    } catch (err) {
      console.error('Failed to enable template:', err)
    }
  }

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: bu } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!bu) return

      const res = await fetch('/api/settings/automation-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ruleId, businessId: bu.business_id, isActive: !isActive }),
      })

      if (res.ok) {
        fetchRules()
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: bu } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()

      if (!bu) return

      const res = await fetch(
        `/api/settings/automation-rules?ruleId=${ruleId}&businessId=${bu.business_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )

      if (res.ok) {
        fetchRules()
      }
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'universal', label: 'Universal' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'appointment', label: 'Appointment' },
    { id: 'integration', label: 'Integration' },
  ]

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter((t: any) => t.category === selectedCategory)

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BoltIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
              <p className="text-sm text-gray-500">Automate actions when events happen - no Zapier needed</p>
            </div>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn-primary text-sm"
          >
            {showTemplates ? 'View My Rules' : 'Add from Templates'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading automation rules...</div>
        ) : showTemplates ? (
          /* Template Gallery */
          <div>
            {/* Category filter */}
            <div className="flex space-x-2 mb-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTemplates.map((template: any) => (
                <div
                  key={template.id}
                  className={clsx(
                    'border rounded-lg p-4 transition-colors',
                    template.isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-yellow-300'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {template.triggerEvent.replace(/_/g, ' ')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => !template.isEnabled && enableTemplate(template.id)}
                      disabled={template.isEnabled}
                      className={clsx(
                        'ml-3 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                        template.isEnabled
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      )}
                    >
                      {template.isEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Rules List */
          <div>
            {rules.length === 0 ? (
              <div className="text-center py-8">
                <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No automation rules yet.</p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Browse templates to get started
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule: any) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 text-sm">{rule.name}</h3>
                          {rule.is_template && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                              Template
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                          <span>Trigger: {rule.trigger_event?.replace(/_/g, ' ')}</span>
                          <span>{rule.conditions?.length || 0} condition{(rule.conditions?.length || 0) !== 1 ? 's' : ''}</span>
                          <span>{rule.actions?.length || 0} action{(rule.actions?.length || 0) !== 1 ? 's' : ''}</span>
                          {rule.execution_count > 0 && (
                            <span>Ran {rule.execution_count}x</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleRule(rule.id, rule.is_active)}
                          className={clsx(
                            'p-1.5 rounded transition-colors',
                            rule.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          )}
                          title={rule.is_active ? 'Disable' : 'Enable'}
                        >
                          {rule.is_active ? (
                            <PlayIcon className="h-5 w-5" />
                          ) : (
                            <StopIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete rule"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Execution Log */}
            {logs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
                <div className="space-y-1">
                  {logs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className={clsx(
                          'w-2 h-2 rounded-full',
                          log.conditions_met && log.actions_failed === 0 ? 'bg-green-400' :
                          log.conditions_met && log.actions_failed > 0 ? 'bg-yellow-400' :
                          'bg-gray-300'
                        )} />
                        <span className="text-gray-700">{log.rule_name}</span>
                        <span className="text-gray-400">{log.trigger_event?.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(log.executed_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// WEBHOOK CONFIGURATION COMPONENT
// ============================================

function WebhookConfiguration() {
  const supabase = createClientComponentClient()
  const [webhooks, setWebhooks] = useState<Array<{ id: string; url: string; enabled_events: string[]; is_active: boolean; secret: string; created_at: string }>>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newEvents, setNewEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const allEventTypes = [
    { value: 'order_placed', label: 'Order Placed' },
    { value: 'order_confirmed', label: 'Order Confirmed' },
    { value: 'appointment_booked', label: 'Appointment Booked' },
    { value: 'appointment_cancelled', label: 'Appointment Cancelled' },
    { value: 'call_completed', label: 'Call Completed' },
    { value: 'contact_captured', label: 'Contact Captured' },
    { value: 'payment_processed', label: 'Payment Processed' },
    { value: 'message_taken', label: 'Message Taken' },
  ]

  const loadWebhooks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) return

      const res = await fetch(`/api/webhooks/business?businessId=${membership.business_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [supabase])

  useEffect(() => { loadWebhooks() }, [loadWebhooks])

  const handleCreate = async () => {
    if (!newUrl.trim()) { setError('Please enter a webhook URL'); return }
    if (newEvents.length === 0) { setError('Please select at least one event'); return }
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const { data: membership } = await supabase
        .from('business_users').select('business_id').eq('user_id', session.user.id).single()
      if (!membership) { setError('Business not found'); return }

      const res = await fetch('/api/webhooks/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: membership.business_id, url: newUrl.trim(), enabledEvents: newEvents }),
      })
      const data = await res.json()
      if (!res.ok || !data.webhook) { setError(data.error || 'Failed to create webhook'); return }
      setWebhooks(prev => [...prev, data.webhook])
      setShowAddForm(false); setNewUrl(''); setNewEvents([])
      setSuccess('Webhook created. Secret: ' + data.webhook.secret)
    } catch (err: any) { setError(err.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleDelete = async (webhookId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch(`/api/webhooks/business/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
    } catch { setError('Failed to delete webhook') }
  }

  const handleTest = async (webhookId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/webhooks/business/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.success) { setSuccess('Test webhook sent successfully') }
      else { setError(data.error || 'Test delivery failed') }
    } catch { setError('Failed to send test') }
  }

  if (loading) {
    return <div className="card"><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-6 bg-gray-200 rounded w-48" /><div className="h-4 bg-gray-200 rounded w-full" /></div></div></div>
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Webhooks</h2>
              <p className="text-sm text-gray-500">Connect to Zapier, Make, or any webhook endpoint</p>
            </div>
          </div>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Webhook
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <div>
              <label className="label">Webhook URL</label>
              <input type="url" className="input-field" placeholder="https://hooks.zapier.com/..." value={newUrl} onChange={(e) => { setNewUrl(e.target.value); setError(null) }} />
            </div>
            <div>
              <label className="label">Events to subscribe</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {allEventTypes.map(({ value, label }) => (
                  <label key={value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600"
                      checked={newEvents.includes(value)}
                      onChange={(e) => {
                        setNewEvents(prev => e.target.checked ? [...prev, value] : prev.filter(v => v !== value))
                      }}
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Webhook'}
              </button>
              <button onClick={() => { setShowAddForm(false); setNewUrl(''); setNewEvents([]) }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {webhooks.length === 0 && !showAddForm && (
          <p className="text-sm text-gray-500">No webhooks configured. Add a webhook to send real-time events to external services.</p>
        )}

        {webhooks.length > 0 && (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={clsx('h-2 w-2 rounded-full', webhook.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                    <code className="text-sm text-gray-700 truncate max-w-md">{webhook.url}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTest(webhook.id)} className="text-sm text-blue-600 hover:text-blue-700">
                      Test
                    </button>
                    <button onClick={() => handleDelete(webhook.id)} className="text-sm text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {webhook.enabled_events.map(evt => (
                    <span key={evt} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4"><p className="text-sm text-red-700">{error}</p></div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg mt-4"><p className="text-sm text-green-700">{success}</p></div>}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState('business')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerPhoneSaving, setOwnerPhoneSaving] = useState(false)
  const [ownerPhoneSaved, setOwnerPhoneSaved] = useState(false)
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '16:00', isOpen: true },
    sunday: { open: '11:00', close: '15:00', isOpen: false }
  })

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    smsBookings: true,
    emailCancellations: true,
    smsCancellations: false,
    dailyReports: true,
    weeklyReports: true,
    marketingEmails: false
  })

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const tabs = [
    { id: 'business', name: 'Business Profile', icon: BuildingOfficeIcon },
    { id: 'hours', name: 'Business Hours', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'team', name: 'Team Access', icon: UserGroupIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon }
  ]

  const updateBusinessHours = (day: string, field: string, value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const updateNotification = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Load owner phone from business settings
  useEffect(() => {
    async function loadOwnerPhone() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()
      if (!membership) return
      const { data: business } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', membership.business_id)
        .single()
      if (business?.settings?.owner_phone) {
        setOwnerPhone(business.settings.owner_phone)
      }
    }
    loadOwnerPhone()
  }, [supabase])

  const saveOwnerPhone = async () => {
    setOwnerPhoneSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setOwnerPhoneSaving(false); return }
    const { data: membership } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', session.user.id)
      .single()
    if (!membership) { setOwnerPhoneSaving(false); return }
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', membership.business_id)
      .single()
    await supabase
      .from('businesses')
      .update({ settings: { ...(business?.settings || {}), owner_phone: ownerPhone } })
      .eq('id', membership.business_id)
    setOwnerPhoneSaving(false)
    setOwnerPhoneSaved(true)
    setTimeout(() => setOwnerPhoneSaved(false), 3000)
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your business settings and preferences
          </p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 mr-8">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'business' && (
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="btn-secondary"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {isEditingProfile ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Business Name</label>
                      <input
                        type="text"
                        className="input-field"
                        defaultValue="dropfly"
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Business Type</label>
                      <select
                        className="input-field"
                        defaultValue="nail_salon"
                        disabled={!isEditingProfile}
                      >
                        <option value="nail_salon">Nail Salon</option>
                        <option value="spa">Beauty Spa</option>
                        <option value="beauty_clinic">Beauty Clinic</option>
                        <option value="barbershop">Barbershop</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <DevicePhoneMobileIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          className="input-field rounded-l-none"
                          defaultValue="(555) 123-4567"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Email Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <EnvelopeIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          className="input-field rounded-l-none"
                          defaultValue="hello@bellanails.com"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">Business Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <MapPinIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          className="input-field rounded-l-none"
                          defaultValue="123 Beauty Lane, Los Angeles, CA 90210"
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Website</label>
                      <input
                        type="url"
                        className="input-field"
                        defaultValue="https://bellanails.com"
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Timezone</label>
                      <select
                        className="input-field"
                        defaultValue="America/Los_Angeles"
                        disabled={!isEditingProfile}
                      >
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/New_York">Eastern (ET)</option>
                      </select>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Hours</h2>
                  
                  <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateBusinessHours(key, 'isOpen', !businessHours[key].isOpen)}
                            className={clsx(
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                              businessHours[key].isOpen ? 'bg-blue-600' : 'bg-gray-200'
                            )}
                          >
                            <span
                              className={clsx(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                businessHours[key].isOpen ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span className="text-sm text-gray-500">
                            {businessHours[key].isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>

                        {businessHours[key].isOpen && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={businessHours[key].open}
                              onChange={(e) => updateBusinessHours(key, 'open', e.target.value)}
                              className="input-field w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={businessHours[key].close}
                              onChange={(e) => updateBusinessHours(key, 'close', e.target.value)}
                              className="input-field w-32"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Settings</h3>
                    <div className="space-y-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Copy Monday hours to all weekdays
                      </button>
                      <br />
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        Set weekend hours (9 AM - 4 PM)
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="btn-primary">
                      Save Business Hours
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    {/* Owner Notification Phone — functional, saves to DB */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Owner Alert Phone Number</h3>
                      <p className="text-xs text-blue-700 mb-3">
                        Your phone employees will send you a text here whenever a message is taken, a lead is captured, or an appointment is booked.
                      </p>
                      <div className="flex gap-2">
                        <div className="flex flex-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-blue-300 bg-blue-100 text-blue-600">
                            <DevicePhoneMobileIcon className="h-4 w-4" />
                          </span>
                          <input
                            type="tel"
                            className="input-field rounded-l-none flex-1"
                            placeholder="+1 (555) 000-0000"
                            value={ownerPhone}
                            onChange={e => setOwnerPhone(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={saveOwnerPhone}
                          disabled={ownerPhoneSaving}
                          className="btn-primary whitespace-nowrap"
                        >
                          {ownerPhoneSaving ? 'Saving...' : ownerPhoneSaved ? 'Saved!' : 'Save Number'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'emailBookings', label: 'Email notifications for new bookings', description: 'Get notified when customers book appointments' },
                          { key: 'smsBookings', label: 'SMS notifications for new bookings', description: 'Receive text messages for urgent bookings' },
                          { key: 'emailCancellations', label: 'Email notifications for cancellations', description: 'Get notified when customers cancel appointments' },
                          { key: 'smsCancellations', label: 'SMS notifications for cancellations', description: 'Receive text messages for last-minute cancellations' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start space-x-3">
                            <button
                              onClick={() => updateNotification(key, !notifications[key as keyof typeof notifications])}
                              className={clsx(
                                'mt-1 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                notifications[key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Reports</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'dailyReports', label: 'Daily summary reports', description: 'Receive daily summaries of appointments and revenue' },
                          { key: 'weeklyReports', label: 'Weekly analytics reports', description: 'Get weekly insights on business performance' },
                          { key: 'marketingEmails', label: 'Marketing and feature updates', description: 'Stay informed about new features and tips' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start space-x-3">
                            <button
                              onClick={() => updateNotification(key, !notifications[key as keyof typeof notifications])}
                              className={clsx(
                                'mt-1 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                                notifications[key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-500">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button className="btn-primary">
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Password & Security</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="label">Current Password</label>
                        <input type="password" className="input-field" />
                      </div>
                      
                      <div>
                        <label className="label">New Password</label>
                        <input type="password" className="input-field" />
                      </div>
                      
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input type="password" className="input-field" />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button className="btn-primary">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mb-4">
                      Add an extra layer of security to your account with two-factor authentication.
                    </p>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">SMS Authentication</div>
                        <div className="text-sm text-gray-500">Receive codes via text message</div>
                      </div>
                      <button className="btn-secondary">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                {/* Team Pricing Overview */}
                <div className="card">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Seat Pricing</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Current Plan: Professional</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">$446/month</div>
                          <div className="text-sm text-gray-600 mt-1">
                            $397 base + $49 for 1 additional seat
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">Seat Usage</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">4 / 10</div>
                          <div className="text-sm text-gray-600 mt-1">seats used</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-600">Included Seats</div>
                        <div className="font-semibold text-gray-900 mt-1">3 seats</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-600">Additional Seats</div>
                        <div className="font-semibold text-gray-900 mt-1">$49/seat/month</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-gray-600">Max Seats</div>
                        <div className="font-semibold text-gray-900 mt-1">10 seats</div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 text-sm">
                          <p className="font-medium text-yellow-800">Approaching seat limit</p>
                          <p className="text-yellow-700 mt-1">You're using 4 of 10 seats. Upgrade to Business plan for up to 25 seats at $59/seat.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                      <button
                        className="btn-primary"
                        onClick={() => alert('Team invite modal would open here')}
                      >
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Invite Team Member
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">JS</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">John Smith</div>
                            <div className="text-sm text-gray-500">john@voicefly.ai</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Owner
                          </span>
                          <span className="text-xs text-gray-500">Included</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">MR</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Maya Rodriguez</div>
                            <div className="text-sm text-gray-500">maya@voicefly.ai</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Manager
                          </span>
                          <span className="text-xs text-gray-500">Included</span>
                          <button className="text-gray-400 hover:text-red-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">SK</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Sarah Kim</div>
                            <div className="text-sm text-gray-500">sarah@voicefly.ai</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Member
                          </span>
                          <span className="text-xs text-gray-500">Included</span>
                          <button className="text-gray-400 hover:text-red-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">TC</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Tom Chen</div>
                            <div className="text-sm text-gray-500">tom@voicefly.ai</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Member
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            +$49/mo
                          </span>
                          <button className="text-gray-400 hover:text-red-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* Calendar Integrations */}
                <GoogleCalendarIntegration />
                <CalendlyIntegration />

                {/* CRM & POS */}
                <HubSpotIntegration />
                <SquareIntegration />

                {/* Engagement */}
                <GoogleReviewsSettings />

                {/* Automation Rules */}
                <AutomationRules />

                {/* Webhooks (Advanced) */}
                <WebhookConfiguration />

                {/* Core Services */}
                <div className="card">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Core Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <CreditCardIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Stripe</h3>
                              <p className="text-xs text-gray-500">Payments</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <DevicePhoneMobileIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Twilio SMS</h3>
                              <p className="text-xs text-gray-500">Text messages</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">SendGrid</h3>
                              <p className="text-xs text-gray-500">Email</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}