'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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

export default function SettingsPage() {
  const supabase = createClientComponentClient()
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

  const tabs = [
    { id: 'business', name: 'Business Profile', icon: BuildingOfficeIcon },
    { id: 'ai-context', name: 'AI Knowledge', icon: ChatBubbleLeftRightIcon },
    { id: 'hours', name: 'Business Hours', icon: ClockIcon },
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: membership } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', session.user.id)
        .single()
      if (!membership) return
      setBusinessId(membership.business_id)
      const { data: bizData } = await supabase
        .from('businesses')
        .select('name, subscription_tier, business_type, phone, email, address, website, timezone, settings, business_context')
        .eq('id', membership.business_id)
        .single()
      if (bizData) {
        setBusiness({ name: bizData.name, subscription_tier: bizData.subscription_tier })
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
        if (bizData.business_context) {
          setBusinessContext(bizData.business_context)
        }
      }

      // Load business hours
      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('business_id', membership.business_id)
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
              isOpen: !row.is_closed,
            }
          }
        }
        setBusinessHours(loaded)
      }
    }
    loadBusinessData()
  }, [supabase])

  const saveBusinessContext = async () => {
    if (!businessId) return
    setContextSaving(true)
    await supabase
      .from('businesses')
      .update({ business_context: businessContext })
      .eq('id', businessId)
    setContextSaving(false)
    setContextSaved(true)
    setTimeout(() => setContextSaved(false), 3000)
  }

  const updateContext = (key: string, value: string) => {
    setBusinessContext(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    if (!businessId) return
    setProfileSaving(true)
    await supabase
      .from('businesses')
      .update({
        name: profile.name,
        business_type: profile.business_type,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        website: profile.website,
        timezone: profile.timezone,
      })
      .eq('id', businessId)
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
      is_closed: !businessHours[key].isOpen,
    }))
    await supabase
      .from('business_hours')
      .upsert(rows, { onConflict: 'business_id,day_of_week' })
    // Auto-sync hours_summary to business_context
    const summary = generateHoursSummary(businessHours)
    const updatedContext = { ...businessContext, hours_summary: summary }
    await supabase
      .from('businesses')
      .update({ business_context: updatedContext })
      .eq('id', businessId)
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
    setOwnerPhoneSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setOwnerPhoneSaving(false); return }
    const { data: membership } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', session.user.id)
      .single()
    if (!membership) { setOwnerPhoneSaving(false); return }
    const { data: bizSettings } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', membership.business_id)
      .single()
    await supabase
      .from('businesses')
      .update({ settings: { ...(bizSettings?.settings || {}), owner_phone: ownerPhone } })
      .eq('id', membership.business_id)
    setOwnerPhoneSaving(false)
    setOwnerPhoneSaved(true)
    setTimeout(() => setOwnerPhoneSaved(false), 3000)
  }

  return (
    <Layout business={business}>
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
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                        <span className="flex items-center gap-1 text-sm text-green-600">
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
              <div className="card">
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">AI Knowledge</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      This information is automatically shared with Maya on every call so she can answer caller questions accurately.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="label">Owner / Manager Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Dr. Sarah Johnson"
                        value={businessContext.owner_name || ''}
                        onChange={e => updateContext('owner_name', e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">When a caller asks to speak with the owner or manager</p>
                    </div>

                    <div>
                      <label className="label">Location / Address (as you want it spoken)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 123 Main Street, Suite 200, downtown Los Angeles"
                        value={businessContext.address_display || ''}
                        onChange={e => updateContext('address_display', e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">How Maya should describe your location to callers</p>
                    </div>

                    <div>
                      <label className="label">Business Hours Summary</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Monday through Friday 9am to 5pm, Saturday 10am to 2pm, closed Sunday"
                        value={businessContext.hours_summary || ''}
                        onChange={e => updateContext('hours_summary', e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">A natural-language summary Maya can read to callers</p>
                    </div>

                    <div>
                      <label className="label">Payment Methods</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Cash, all major credit cards, Apple Pay, Venmo"
                        value={businessContext.payment_methods || ''}
                        onChange={e => updateContext('payment_methods', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Parking Information</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Free parking in the rear lot, street parking available"
                        value={businessContext.parking_info || ''}
                        onChange={e => updateContext('parking_info', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Languages Spoken</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. English, Spanish, Vietnamese"
                        value={businessContext.languages || ''}
                        onChange={e => updateContext('languages', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">Policies</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="e.g. 24-hour cancellation policy. No refunds on completed services. Walk-ins welcome but appointments preferred."
                        value={businessContext.policies || ''}
                        onChange={e => updateContext('policies', e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Cancellation, refund, walk-in policies, etc.</p>
                    </div>

                    <div>
                      <label className="label">Additional Notes for Maya</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="e.g. We're running a 20% off special this month. We're closed for renovation March 15-20."
                        value={businessContext.special_notes || ''}
                        onChange={e => updateContext('special_notes', e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Anything else Maya should know — promos, closures, special instructions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                    {contextSaved && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckIcon className="h-4 w-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={saveBusinessContext}
                      disabled={contextSaving}
                      className="btn-primary"
                    >
                      {contextSaving ? 'Saving...' : 'Save AI Knowledge'}
                    </button>
                  </div>
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
                      <button onClick={copyMondayToWeekdays} className="text-sm text-blue-600 hover:text-blue-700">
                        Copy Monday hours to all weekdays
                      </button>
                      <br />
                      <button onClick={setWeekendHours} className="text-sm text-blue-600 hover:text-blue-700">
                        Set weekend hours (9 AM - 4 PM)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    {hoursSaved && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
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

          </div>
        </div>
      </div>
    </Layout>
  )
}