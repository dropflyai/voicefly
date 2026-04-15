'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { supabase } from '../../../lib/supabase-client'
import {
  BuildingOfficeIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  DocumentTextIcon,
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

async function fetchBusiness(businessId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/business?businessId=${businessId}`, {
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  })
  if (!res.ok) return null
  return (await res.json()).business
}

async function patchBusiness(businessId: string, updates: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession()
  await fetch(`/api/business?businessId=${businessId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ updates }),
  })
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [business, setBusiness] = useState<{ name: string; subscription_tier: string } | null>(null)
  const [profile, setProfile] = useState({
    name: '', business_type: '', phone: '', email: '',
    address: '', website: '', timezone: 'America/Los_Angeles',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerPhoneSaving, setOwnerPhoneSaving] = useState(false)
  const [ownerPhoneSaved, setOwnerPhoneSaved] = useState(false)
  const [hoursSaving, setHoursSaving] = useState(false)
  const [hoursSaved, setHoursSaved] = useState(false)
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
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessContext, setBusinessContext] = useState<{
    owner_name?: string
    address_display?: string
    hours_summary?: string
    payment_methods?: string
    parking_info?: string
    languages?: string
    policies?: string
    special_notes?: string
  }>({})
  const [contextSaving, setContextSaving] = useState(false)
  const [contextSaved, setContextSaved] = useState(false)
  const [quickFillMode, setQuickFillMode] = useState<'text' | 'url' | null>(null)
  const [quickFillInput, setQuickFillInput] = useState('')
  const [quickFillParsing, setQuickFillParsing] = useState(false)
  const [quickFillError, setQuickFillError] = useState('')
  const [quickFillResult, setQuickFillResult] = useState<Record<string, string> | null>(null)
  const [storedSettings, setStoredSettings] = useState<Record<string, any>>({})
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; role: string; user_id: string }[]>([])
  const [teamLoading, setTeamLoading] = useState(false)

  const tabs = [
    { id: 'business', name: 'Business Profile', icon: BuildingOfficeIcon },
    { id: 'ai-context', name: 'AI Knowledge', icon: ChatBubbleLeftRightIcon },
    { id: 'hours', name: 'Business Hours', icon: ClockIcon },
    { id: 'sms-registration', name: 'SMS Registration', icon: DevicePhoneMobileIcon, href: '/dashboard/settings/sms' },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'team', name: 'Team Access', icon: UserGroupIcon },
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

  // Load business data and owner phone from settings
  useEffect(() => {
    async function loadBusinessData() {
      const id = localStorage.getItem('authenticated_business_id')
      if (!id) return
      setBusinessId(id)
      const bizData = await fetchBusiness(id)
      if (bizData) {
        setBusiness({ name: bizData.name, subscription_tier: bizData.subscription_tier })
        setStoredSettings(bizData.settings || {})
        setProfile({
          name: bizData.name || '',
          business_type: bizData.business_type || '',
          phone: bizData.phone || '',
          email: bizData.email || '',
          address: bizData.address || '',
          website: bizData.website || '',
          timezone: bizData.timezone || 'America/Los_Angeles',
        })
        if (bizData.settings?.owner_phone) {
          setOwnerPhone(bizData.settings.owner_phone)
        }
        if (bizData.settings?.notifications) {
          setNotifications(prev => ({ ...prev, ...bizData.settings.notifications }))
        }
        if (bizData.business_context) {
          setBusinessContext(bizData.business_context)
        }
      }

      // Load team members
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const { data: members } = await supabase
        .from('business_users')
        .select('id, user_id, role')
        .eq('business_id', id)
      if (members) {
        // Get emails from auth — we can't query auth.users directly,
        // so we store what we have (user_id + role)
        setTeamMembers(members.map(m => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          email: m.user_id === currentSession?.user.id ? currentSession?.user.email || '' : '',
        })))
      }

      // Load business hours
      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_open')
        .eq('business_id', id)
      if (hoursData && hoursData.length > 0) {
        const dayMap: Record<number, string> = {
          0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
          4: 'thursday', 5: 'friday', 6: 'saturday',
        }
        const loaded: BusinessHours = { ...businessHours }
        for (const row of hoursData) {
          const dayKey = dayMap[row.day_of_week]
          if (dayKey) {
            loaded[dayKey] = {
              open: row.open_time?.slice(0, 5) || '09:00',
              close: row.close_time?.slice(0, 5) || '18:00',
              isOpen: row.is_open !== false,
            }
          }
        }
        setBusinessHours(loaded)
      }
    }
    loadBusinessData()
  }, [])

  const saveBusinessContext = async () => {
    if (!businessId) return
    setContextSaving(true)
    await patchBusiness(businessId, { business_context: businessContext })
    setContextSaving(false)
    setContextSaved(true)
    setTimeout(() => setContextSaved(false), 3000)
  }

  const updateContext = (key: string, value: string) => {
    setBusinessContext(prev => ({ ...prev, [key]: value }))
  }

  const handleQuickFill = async () => {
    if (!quickFillInput.trim()) return
    setQuickFillParsing(true)
    setQuickFillError('')
    setQuickFillResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setQuickFillError('Not authenticated')
        setQuickFillParsing(false)
        return
      }
      const payload = quickFillMode === 'url'
        ? { url: quickFillInput.trim() }
        : { text: quickFillInput.trim() }
      const res = await fetch('/api/ai/parse-business-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuickFillError(data.error || 'Failed to parse')
        setQuickFillParsing(false)
        return
      }
      if (data.context && Object.keys(data.context).length > 0) {
        setQuickFillResult(data.context)
        // Merge into form — only fill empty fields
        setBusinessContext(prev => {
          const merged = { ...prev }
          for (const [key, value] of Object.entries(data.context)) {
            if (!merged[key as keyof typeof merged] || !merged[key as keyof typeof merged]?.trim()) {
              (merged as Record<string, string>)[key] = value as string
            }
          }
          return merged
        })
      } else {
        setQuickFillError('No business information found in the content. Try adding more details.')
      }
    } catch {
      setQuickFillError('Something went wrong. Please try again.')
    }
    setQuickFillParsing(false)
  }

  const applyQuickFillField = (key: string, value: string) => {
    setBusinessContext(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    if (!businessId) return
    setProfileSaving(true)
    await patchBusiness(businessId, {
      name: profile.name,
      business_type: profile.business_type,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      website: profile.website,
      timezone: profile.timezone,
    })
    setBusiness(prev => prev ? { ...prev, name: profile.name } : prev)
    setProfileSaving(false)
    setProfileSaved(true)
    setIsEditingProfile(false)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const generateHoursSummary = (hours: BusinessHours): string => {
    const parts: string[] = []
    const formatTime = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      const suffix = h >= 12 ? 'pm' : 'am'
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return m === 0 ? `${hour12}${suffix}` : `${hour12}:${m.toString().padStart(2, '0')}${suffix}`
    }
    for (const { key, label } of daysOfWeek) {
      const day = hours[key]
      if (day.isOpen) {
        parts.push(`${label} ${formatTime(day.open)}-${formatTime(day.close)}`)
      } else {
        parts.push(`${label} Closed`)
      }
    }
    return parts.join(', ')
  }

  const saveBusinessHours = async () => {
    if (!businessId) return
    setHoursSaving(true)
    const dayKeyToNum: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    }
    const rows = daysOfWeek.map(({ key }) => ({
      business_id: businessId,
      day_of_week: dayKeyToNum[key],
      open_time: businessHours[key].open + ':00',
      close_time: businessHours[key].close + ':00',
      is_open: businessHours[key].isOpen,
    }))
    await supabase
      .from('business_hours')
      .upsert(rows, { onConflict: 'business_id,day_of_week' })
    // Auto-sync hours_summary to business_context
    const summary = generateHoursSummary(businessHours)
    const updatedContext = { ...businessContext, hours_summary: summary }
    await patchBusiness(businessId, { business_context: updatedContext })
    setBusinessContext(updatedContext)
    setHoursSaving(false)
    setHoursSaved(true)
    setTimeout(() => setHoursSaved(false), 3000)
  }

  const copyMondayToWeekdays = () => {
    const monday = businessHours.monday
    setBusinessHours(prev => ({
      ...prev,
      tuesday: { ...monday },
      wednesday: { ...monday },
      thursday: { ...monday },
      friday: { ...monday },
    }))
  }

  const setWeekendHours = () => {
    setBusinessHours(prev => ({
      ...prev,
      saturday: { open: '09:00', close: '16:00', isOpen: true },
      sunday: { open: '09:00', close: '16:00', isOpen: true },
    }))
  }

  const saveOwnerPhone = async () => {
    if (!businessId) return
    setOwnerPhoneSaving(true)
    await patchBusiness(businessId, { settings: { ...storedSettings, owner_phone: ownerPhone } })
    setOwnerPhoneSaving(false)
    setOwnerPhoneSaved(true)
    setTimeout(() => setOwnerPhoneSaved(false), 3000)
  }

  const saveNotifications = async () => {
    if (!businessId) return
    setNotifSaving(true)
    await patchBusiness(businessId, { settings: { ...storedSettings, notifications } })
    setNotifSaving(false)
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 3000)
  }

  const changePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 5000)
    }
  }

  return (
    <Layout business={business}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your business settings and preferences</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 mr-8">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const classes = clsx(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab.id
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )
                if ((tab as any).href) {
                  return (
                    <Link key={tab.id} href={(tab as any).href} className={classes}>
                      <tab.icon className="mr-3 h-5 w-5" />
                      {tab.name}
                    </Link>
                  )
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classes}
                  >
                    <tab.icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'business' && (
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text-primary">Business Profile</h2>
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
                        value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Business Type</label>
                      <select
                        className="input-field"
                        value={profile.business_type}
                        onChange={e => setProfile(p => ({ ...p, business_type: e.target.value }))}
                        disabled={!isEditingProfile}
                      >
                        <option value="">Select type...</option>
                        <option value="nail_salon">Nail Salon</option>
                        <option value="spa">Beauty Spa</option>
                        <option value="beauty_clinic">Beauty Clinic</option>
                        <option value="barbershop">Barbershop</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="medical">Medical Office</option>
                        <option value="legal">Legal Office</option>
                        <option value="hvac">HVAC / Contractor</option>
                        <option value="consulting">Consulting</option>
                        <option value="real_estate">Real Estate</option>
                        <option value="general">General Business</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[rgba(65,71,84,0.2)] bg-surface text-text-secondary">
                          <DevicePhoneMobileIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          className="input-field rounded-l-none"
                          placeholder="(555) 123-4567"
                          value={profile.phone}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Email Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[rgba(65,71,84,0.2)] bg-surface text-text-secondary">
                          <EnvelopeIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          className="input-field rounded-l-none"
                          placeholder="hello@yourbusiness.com"
                          value={profile.email}
                          onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">Business Address</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[rgba(65,71,84,0.2)] bg-surface text-text-secondary">
                          <MapPinIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          className="input-field rounded-l-none"
                          placeholder="123 Main St, City, State ZIP"
                          value={profile.address}
                          onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Website</label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://yourbusiness.com"
                        value={profile.website}
                        onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                        disabled={!isEditingProfile}
                      />
                    </div>

                    <div>
                      <label className="label">Timezone</label>
                      <select
                        className="input-field"
                        value={profile.timezone}
                        onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                        disabled={!isEditingProfile}
                      >
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/New_York">Eastern (ET)</option>
                        <option value="America/Anchorage">Alaska (AKT)</option>
                        <option value="Pacific/Honolulu">Hawaii (HT)</option>
                      </select>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                      {profileSaved && (
                        <span className="flex items-center gap-1 text-sm text-emerald-500">
                          <CheckIcon className="h-4 w-4" /> Saved
                        </span>
                      )}
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={profileSaving}
                        className="btn-primary"
                      >
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai-context' && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-semibold text-text-primary font-[family-name:var(--font-manrope)]">AI Knowledge</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    This information is shared with your AI employees on every call so they can answer questions accurately.
                  </p>
                </div>

                {/* Quick Fill — Stitch recessed card */}
                <div className="bg-surface-lowest rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary/10 blur-[50px] rounded-full pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="h-5 w-5 text-brand-primary" />
                      <h3 className="text-sm font-bold text-text-primary">Quick Fill with AI</h3>
                    </div>
                    <p className="text-xs text-text-secondary mb-4">
                      Paste any text about your business or enter your website URL. AI will extract the relevant details.
                    </p>

                    {!quickFillMode ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQuickFillMode('text')}
                          className="flex items-center gap-2 px-4 py-2 bg-surface-high rounded-lg text-sm font-medium text-text-primary hover:bg-surface-highest transition-colors"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                          Paste Text
                        </button>
                        <button
                          onClick={() => setQuickFillMode('url')}
                          className="flex items-center gap-2 px-4 py-2 bg-surface-high rounded-lg text-sm font-medium text-text-primary hover:bg-surface-highest transition-colors"
                        >
                          <GlobeAltIcon className="h-4 w-4" />
                          Import from Website
                        </button>
                      </div>
                    ) : (
                      <div>
                        {quickFillMode === 'text' ? (
                          <textarea
                            className="input-field mb-3"
                            rows={5}
                            placeholder="Paste anything about your business here — website text, Google listing info, bullet points..."
                            value={quickFillInput}
                            onChange={e => setQuickFillInput(e.target.value)}
                            disabled={quickFillParsing}
                          />
                        ) : (
                          <input
                            type="url"
                            className="input-field mb-3"
                            placeholder="https://yourbusiness.com"
                            value={quickFillInput}
                            onChange={e => setQuickFillInput(e.target.value)}
                            disabled={quickFillParsing}
                          />
                        )}

                        <div className="flex items-center gap-2">
                          <button onClick={handleQuickFill} disabled={quickFillParsing || !quickFillInput.trim()} className="btn-primary">
                            {quickFillParsing ? (
                              <><span className="animate-spin inline-block h-4 w-4 border-2 border-surface border-t-transparent rounded-full mr-2" />Analyzing...</>
                            ) : (
                              <><SparklesIcon className="h-4 w-4 mr-1" />Extract & Fill</>
                            )}
                          </button>
                          <button
                            onClick={() => { setQuickFillMode(null); setQuickFillInput(''); setQuickFillError(''); setQuickFillResult(null) }}
                            className="btn-secondary" disabled={quickFillParsing}
                          >Cancel</button>
                        </div>

                        {quickFillError && <p className="text-sm text-[#ffb4ab] mt-2">{quickFillError}</p>}

                        {quickFillResult && (
                          <div className="mt-3 p-3 bg-emerald-500/5 rounded-lg">
                            <p className="text-sm font-medium text-emerald-500 mb-1">
                              Found {Object.keys(quickFillResult).length} field{Object.keys(quickFillResult).length !== 1 ? 's' : ''}! Empty fields have been filled in below.
                            </p>
                            <p className="text-xs text-text-muted">
                              Fields that already had values were kept. Review below, then save.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Location Card */}
                <div className="bg-surface-low rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-manrope)]">Contact & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Owner / Manager Name</label>
                      <input type="text" className="input-field" placeholder="e.g. Dr. Sarah Johnson"
                        value={businessContext.owner_name || ''} onChange={e => updateContext('owner_name', e.target.value)} />
                      <p className="text-xs text-text-muted mt-1">When a caller asks for the owner</p>
                    </div>
                    <div>
                      <label className="label">Languages Spoken</label>
                      <input type="text" className="input-field" placeholder="e.g. English, Spanish, Vietnamese"
                        value={businessContext.languages || ''} onChange={e => updateContext('languages', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Location / Address</label>
                    <input type="text" className="input-field" placeholder="e.g. 123 Main Street, Suite 200, downtown Los Angeles"
                      value={businessContext.address_display || ''} onChange={e => updateContext('address_display', e.target.value)} />
                    <p className="text-xs text-text-muted mt-1">How your AI should describe the location to callers</p>
                  </div>
                  <div>
                    <label className="label">Business Hours Summary</label>
                    <input type="text" className="input-field" placeholder="e.g. Monday through Friday 9am to 5pm, Saturday 10am to 2pm"
                      value={businessContext.hours_summary || ''} onChange={e => updateContext('hours_summary', e.target.value)} />
                    <p className="text-xs text-text-muted mt-1">A natural-language summary your AI can read to callers</p>
                  </div>
                </div>

                {/* Business Details Card */}
                <div className="bg-surface-low rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-manrope)]">Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Payment Methods</label>
                      <input type="text" className="input-field" placeholder="e.g. Cash, credit cards, Apple Pay"
                        value={businessContext.payment_methods || ''} onChange={e => updateContext('payment_methods', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Parking Information</label>
                      <input type="text" className="input-field" placeholder="e.g. Free parking in the rear lot"
                        value={businessContext.parking_info || ''} onChange={e => updateContext('parking_info', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Policies & Notes Card */}
                <div className="bg-surface-low rounded-2xl p-6 space-y-5">
                  <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-manrope)]">Policies & Notes</h3>
                  <div>
                    <label className="label">Policies</label>
                    <textarea className="input-field" rows={3}
                      placeholder="e.g. 24-hour cancellation policy. No refunds on completed services. Walk-ins welcome."
                      value={businessContext.policies || ''} onChange={e => updateContext('policies', e.target.value)} />
                    <p className="text-xs text-text-muted mt-1">Cancellation, refund, walk-in policies</p>
                  </div>
                  <div>
                    <label className="label">Additional Notes</label>
                    <textarea className="input-field" rows={3}
                      placeholder="e.g. Running a 20% off special this month. Closed for renovation March 15-20."
                      value={businessContext.special_notes || ''} onChange={e => updateContext('special_notes', e.target.value)} />
                    <p className="text-xs text-text-muted mt-1">Promos, closures, special instructions</p>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-end gap-3">
                  {contextSaved && (
                    <span className="flex items-center gap-1 text-sm text-emerald-500">
                      <CheckIcon className="h-4 w-4" /> Saved
                    </span>
                  )}
                  <button onClick={saveBusinessContext} disabled={contextSaving} className="btn-primary">
                    {contextSaving ? 'Saving...' : 'Save AI Knowledge'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Business Hours</h2>
                  
                  <div className="space-y-4">
                    {daysOfWeek.map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-text-primary">{label}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateBusinessHours(key, 'isOpen', !businessHours[key].isOpen)}
                            className={clsx(
                              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                              businessHours[key].isOpen ? 'bg-brand-primary' : 'bg-surface-highest'
                            )}
                          >
                            <span
                              className={clsx(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-low shadow ring-0 transition duration-200 ease-in-out',
                                businessHours[key].isOpen ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span className="text-sm text-text-secondary">
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
                            <span className="text-text-secondary">to</span>
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
                    <h3 className="text-sm font-medium text-text-primary mb-4">Quick Settings</h3>
                    <div className="space-y-2">
                      <button onClick={copyMondayToWeekdays} className="text-sm text-brand-primary hover:text-brand-primary">
                        Copy Monday hours to all weekdays
                      </button>
                      <br />
                      <button onClick={setWeekendHours} className="text-sm text-brand-primary hover:text-brand-primary">
                        Set weekend hours (9 AM - 4 PM)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    {hoursSaved && (
                      <span className="flex items-center gap-1 text-sm text-emerald-500">
                        <CheckIcon className="h-4 w-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={saveBusinessHours}
                      disabled={hoursSaving}
                      className="btn-primary"
                    >
                      {hoursSaving ? 'Saving...' : 'Save Business Hours'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    {/* Owner Notification Phone — functional, saves to DB */}
                    <div className="p-4 bg-brand-primary/5 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Owner Alert Phone Number</h3>
                      <p className="text-xs text-brand-primary mb-3">
                        Your phone employees will send you a text here whenever a message is taken, a lead is captured, or an appointment is booked.
                      </p>
                      <div className="flex gap-2">
                        <div className="flex flex-1">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-blue-300 bg-brand-primary/10 text-brand-primary">
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
                      <h3 className="text-lg font-medium text-text-primary mb-4">Appointment Notifications</h3>
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
                                notifications[key as keyof typeof notifications] ? 'bg-brand-primary' : 'bg-surface-highest'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-low shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{label}</div>
                              <div className="text-sm text-text-secondary">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-text-primary mb-4">Business Reports</h3>
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
                                notifications[key as keyof typeof notifications] ? 'bg-brand-primary' : 'bg-surface-highest'
                              )}
                            >
                              <span
                                className={clsx(
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-low shadow ring-0 transition duration-200 ease-in-out',
                                  notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{label}</div>
                              <div className="text-sm text-text-secondary">{description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                    {notifSaved && (
                      <span className="flex items-center gap-1 text-sm text-emerald-500">
                        <CheckIcon className="h-4 w-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={saveNotifications}
                      disabled={notifSaving}
                      className="btn-primary"
                    >
                      {notifSaving ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-6">Change Password</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="label">New Password</label>
                        <input
                          type="password"
                          className="input-field"
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="label">Confirm New Password</label>
                        <input
                          type="password"
                          className="input-field"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <p className="text-sm text-[#ffb4ab] mt-3">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-emerald-500 mt-3">Password updated successfully.</p>
                    )}

                    <div className="flex justify-end mt-6 pt-6 border-t">
                      <button
                        onClick={changePassword}
                        disabled={passwordSaving}
                        className="btn-primary"
                      >
                        {passwordSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-text-primary mb-4">Two-Factor Authentication</h3>
                    <p className="text-text-secondary mb-4">
                      Two-factor authentication adds an extra layer of security. This feature is coming soon.
                    </p>

                    <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                      <div>
                        <div className="font-medium text-text-primary">SMS Authentication</div>
                        <div className="text-sm text-text-secondary">Receive codes via text message</div>
                      </div>
                      <span className="text-sm text-text-muted font-medium">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text-primary">Team Members</h2>
                  </div>

                  {teamMembers.length === 0 ? (
                    <p className="text-text-secondary text-sm">No team members found.</p>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map(member => {
                        const initials = member.email
                          ? member.email.slice(0, 2).toUpperCase()
                          : member.user_id.slice(0, 2).toUpperCase()
                        const colors = ['bg-brand-primary', 'bg-purple-600', 'bg-emerald-500', 'bg-orange-600', 'bg-pink-600']
                        const colorIndex = member.user_id.charCodeAt(0) % colors.length
                        return (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`h-10 w-10 ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
                                <span className="text-white font-medium text-sm">{initials}</span>
                              </div>
                              <div>
                                <div className="font-medium text-text-primary">
                                  {member.email || `User ${member.user_id.slice(0, 8)}...`}
                                </div>
                                <div className="text-sm text-text-secondary">
                                  {member.role}
                                </div>
                              </div>
                            </div>
                            <span className={clsx(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              member.role === 'owner' ? 'bg-emerald-500/10 text-green-800' : 'bg-brand-primary/10 text-blue-800'
                            )}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-text-secondary">
                      Team invitations and role management are coming soon.
                    </p>
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