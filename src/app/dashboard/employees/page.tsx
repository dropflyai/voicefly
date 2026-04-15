'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import {
  PhoneIcon,
  UserCircleIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  DocumentArrowUpIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import VoiceInterview from '../../../components/VoiceInterview'
import VoicePicker from '../../../components/VoicePicker'
import { formatDistanceToNow } from 'date-fns'

interface PhoneEmployee {
  id: string
  name: string
  jobType: string
  isActive: boolean
  phoneNumber?: string
  phoneProvider?: string
  provisioningStatus?: 'pending' | 'provisioning' | 'active' | 'failed' | 'no_phone'
  provisioningError?: string | null
  personality: {
    tone: string
    enthusiasm: string
  }
  createdAt: string
}

const JOB_TYPE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
  'receptionist': {
    label: 'Receptionist',
    icon: PhoneIcon,
    color: 'blue',
    description: 'Answers calls, takes messages, schedules appointments',
  },
  'personal-assistant': {
    label: 'Personal Assistant',
    icon: CalendarDaysIcon,
    color: 'purple',
    description: 'Manages schedules, takes messages, handles callbacks',
  },
  'order-taker': {
    label: 'Order Taker',
    icon: ShoppingCartIcon,
    color: 'green',
    description: 'Takes orders, handles modifications, processes payments',
  },
  'appointment-scheduler': {
    label: 'Appointment Scheduler',
    icon: CalendarDaysIcon,
    color: 'indigo',
    description: 'Focused on booking and managing appointments',
  },
  'customer-service': {
    label: 'Customer Service',
    icon: ChatBubbleLeftRightIcon,
    color: 'amber',
    description: 'Handles inquiries, complaints, and support',
  },
  'after-hours-emergency': {
    label: 'After-Hours Emergency',
    icon: ExclamationTriangleIcon,
    color: 'red',
    description: 'Triage urgent calls, notify on-call staff, and handle emergencies',
  },
  'restaurant-host': {
    label: 'Restaurant Host',
    icon: ClipboardDocumentListIcon,
    color: 'orange',
    description: 'Handle reservations, waitlist, and dining inquiries',
  },
  'survey-caller': {
    label: 'Survey Caller',
    icon: SparklesIcon,
    color: 'teal',
    description: 'Call customers after visits to collect feedback and NPS scores',
  },
  'lead-qualifier': {
    label: 'Lead Qualifier',
    icon: MagnifyingGlassIcon,
    color: 'violet',
    description: 'Screen inbound prospects, score leads, and book discovery calls',
  },
  'appointment-reminder': {
    label: 'Appointment Reminder',
    icon: CalendarDaysIcon,
    color: 'sky',
    description: 'Call customers before appointments to confirm and reduce no-shows',
  },
  'collections': {
    label: 'Collections',
    icon: ClipboardDocumentListIcon,
    color: 'rose',
    description: 'Outbound payment collection with FDCPA-compliant scripts',
  },
  'trial-receptionist': {
    label: 'Trial Receptionist',
    icon: PhoneIcon,
    color: 'yellow',
    description: 'Shared AI receptionist that takes messages during your trial',
  },
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'warm', label: 'Warm', description: 'Caring and empathetic' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
]

const TIMEZONE_OPTIONS = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'America/Montreal',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Bogota',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Amsterdam', 'Europe/Zurich', 'Europe/Stockholm',
  'Europe/Helsinki', 'Europe/Warsaw', 'Europe/Istanbul', 'Europe/Moscow',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Colombo', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Jakarta', 'Asia/Manila', 'Asia/Karachi',
  'Asia/Riyadh', 'Asia/Tehran',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane',
  'Australia/Perth', 'Pacific/Auckland', 'Pacific/Fiji',
]

function friendlyProvisioningError(error: string | null | undefined): string {
  if (!error) return 'Phone setup failed'
  if (error.includes('No available Twilio phone numbers')) return 'No numbers available in that area code'
  if (error.includes('VAPI import failed')) return 'Voice setup failed — retry to try again'
  if (error.includes('Twilio credentials not configured')) return 'SMS requires platform setup — contact support'
  if (error.includes('VAPI API key not configured')) return 'Voice platform not configured — contact support'
  if (error.includes('already has a phone number')) return 'Phone already assigned'
  if (error.includes('no VAPI assistant')) return 'Voice assistant missing — recreate employee'
  if (error.length > 60) return error.slice(0, 57) + '...'
  return error
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_BUSINESS_HOURS: Record<string, { start: string; end: string } | null> = {
  monday: { start: '09:00', end: '17:00' },
  tuesday: { start: '09:00', end: '17:00' },
  wednesday: { start: '09:00', end: '17:00' },
  thursday: { start: '09:00', end: '17:00' },
  friday: { start: '09:00', end: '17:00' },
  saturday: null,
  sunday: null,
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  }
}

// ============================================
// INTEGRATION CATALOG
// ============================================

const INTEGRATIONS_BY_JOB: Record<string, string[]> = {
  'receptionist':           ['google-calendar', 'calendly'],
  'personal-assistant':     ['google-calendar', 'calendly'],
  'order-taker':            ['toast', 'square', 'clover', 'shopify'],
  'appointment-scheduler':  ['google-calendar', 'calendly'],
  'restaurant-host':        ['google-calendar', 'opentable', 'resy'],
  'lead-qualifier':         ['hubspot', 'gohighlevel'],
  'customer-service':       ['hubspot', 'shopify'],
  'appointment-reminder':   ['google-calendar', 'calendly'],
  'survey-caller':          [],
  'collections':            ['stripe'],
  'after-hours-emergency':  [],
  'trial-receptionist':     [],
}

const VOICEFLY_BUILTIN: Record<string, { name: string; description: string }> = {
  'receptionist':           { name: 'VoiceFly Calendar',     description: 'Appointments stored in VoiceFly — no external calendar needed' },
  'personal-assistant':     { name: 'VoiceFly Calendar',     description: 'Calendar and tasks stored in VoiceFly' },
  'order-taker':            { name: 'VoiceFly Menu Builder', description: 'Enter your menu in the next step — no POS connection needed' },
  'appointment-scheduler':  { name: 'VoiceFly Calendar',     description: 'Appointments stored in VoiceFly — no external calendar needed' },
  'restaurant-host':        { name: 'VoiceFly Reservations', description: 'Reservations stored and managed entirely in VoiceFly' },
  'lead-qualifier':         { name: 'VoiceFly Contacts',     description: 'Leads stored in VoiceFly — no external CRM needed' },
  'customer-service':       { name: 'VoiceFly Contacts',     description: 'Customer data stored in VoiceFly' },
  'appointment-reminder':   { name: 'VoiceFly Calendar',     description: 'Uses your existing VoiceFly appointments — no setup needed' },
  'survey-caller':          { name: 'VoiceFly Built-in',     description: 'Uses your VoiceFly appointment history — no setup needed' },
  'collections':            { name: 'VoiceFly Receivables',  description: 'Manage accounts receivable directly in VoiceFly' },
  'after-hours-emergency':  { name: 'VoiceFly Built-in',     description: 'No external integrations needed for this employee type' },
  'trial-receptionist':     { name: 'VoiceFly Trial',        description: 'Shared trial receptionist -- upgrade for full features' },
}

interface IntegrationFieldDef {
  name: string
  label: string
  placeholder: string
  type?: string
  hint?: string
  optional?: boolean
}

interface IntegrationDef {
  name: string
  description: string
  category: string
  abbrev: string
  color: string
  fields: IntegrationFieldDef[]
  connectUrl: string
  syncUrl: string | null
  importField: 'menu' | 'appointmentTypes' | null
  comingSoon?: boolean
}

const INTEGRATION_CATALOG: Record<string, IntegrationDef> = {
  'google-calendar': {
    name: 'Google Calendar',
    description: 'Live availability checks and booking during calls',
    category: 'Calendar',
    abbrev: 'GC',
    color: 'bg-brand-primary/10 text-brand-primary',
    fields: [
      { name: 'calendarId', label: 'Calendar ID', placeholder: 'your-email@gmail.com', hint: 'Share your calendar with our service account first, then paste your Google Calendar ID here.' },
    ],
    connectUrl: '/api/integrations/google-calendar/connect',
    syncUrl: null,
    importField: null,
  },
  'calendly': {
    name: 'Calendly',
    description: 'Import your event types as appointment types',
    category: 'Scheduling',
    abbrev: 'CL',
    color: 'bg-indigo-500/10 text-indigo-400',
    fields: [
      { name: 'accessToken', label: 'Personal Access Token', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' },
    ],
    connectUrl: '/api/integrations/calendly/connect',
    syncUrl: '/api/integrations/calendly/sync',
    importField: 'appointmentTypes',
  },
  'toast': {
    name: 'Toast POS',
    description: 'Auto-import your menu (categories, items, prices, modifiers)',
    category: 'POS',
    abbrev: 'TP',
    color: 'bg-accent/10 text-accent',
    fields: [
      { name: 'clientId', label: 'Client ID', placeholder: '' },
      { name: 'clientSecret', label: 'Client Secret', placeholder: '', type: 'password' },
      { name: 'restaurantGuid', label: 'Restaurant GUID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    ],
    connectUrl: '/api/integrations/toast/connect',
    syncUrl: '/api/integrations/toast/sync',
    importField: 'menu',
  },
  'square': {
    name: 'Square',
    description: 'Auto-import your catalog and items',
    category: 'POS',
    abbrev: 'SQ',
    color: 'bg-surface-high text-text-primary',
    fields: [
      { name: 'accessToken', label: 'Access Token', placeholder: 'EAAAxxxxxxxx', type: 'password' },
      { name: 'locationId', label: 'Location ID', placeholder: 'Lxxxxxxxxxx', optional: true },
    ],
    connectUrl: '/api/integrations/square/connect',
    syncUrl: '/api/integrations/square/sync',
    importField: 'menu',
  },
  'clover': {
    name: 'Clover',
    description: 'Auto-import your menu from Clover',
    category: 'POS',
    abbrev: 'CV',
    color: 'bg-emerald-500/10 text-emerald-500',
    fields: [
      { name: 'accessToken', label: 'Access Token', placeholder: '', type: 'password' },
      { name: 'merchantId', label: 'Merchant ID', placeholder: '' },
    ],
    connectUrl: '/api/integrations/clover/connect',
    syncUrl: '/api/integrations/clover/sync',
    importField: 'menu',
  },
  'shopify': {
    name: 'Shopify',
    description: 'Sync your product catalog as menu items',
    category: 'E-commerce',
    abbrev: 'SH',
    color: 'bg-emerald-500/10 text-green-800',
    fields: [
      { name: 'shopDomain', label: 'Store Domain', placeholder: 'your-store.myshopify.com' },
      { name: 'accessToken', label: 'Admin API Access Token', placeholder: 'shpat_xxxxxxxx', type: 'password' },
    ],
    connectUrl: '/api/integrations/shopify/connect',
    syncUrl: '/api/integrations/shopify/sync',
    importField: 'menu',
  },
  'hubspot': {
    name: 'HubSpot',
    description: 'Push leads and contacts to your CRM after calls',
    category: 'CRM',
    abbrev: 'HS',
    color: 'bg-accent/10 text-orange-800',
    fields: [
      { name: 'token', label: 'Private App Token', placeholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' },
    ],
    connectUrl: '/api/integrations/hubspot/connect',
    syncUrl: null,
    importField: null,
  },
  'opentable': {
    name: 'OpenTable',
    description: 'Live reservation management through OpenTable',
    category: 'Reservations',
    abbrev: 'OT',
    color: 'bg-[#93000a]/10 text-[#ffb4ab]',
    fields: [],
    connectUrl: '',
    syncUrl: null,
    importField: null,
    comingSoon: true,
  },
  'resy': {
    name: 'Resy',
    description: 'Live reservation management through Resy',
    category: 'Reservations',
    abbrev: 'RS',
    color: 'bg-purple-500/10 text-purple-400',
    fields: [],
    connectUrl: '',
    syncUrl: null,
    importField: null,
    comingSoon: true,
  },
  'gohighlevel': {
    name: 'GoHighLevel',
    description: 'Push leads to your GHL account after calls',
    category: 'CRM',
    abbrev: 'GHL',
    color: 'bg-brand-primary/10 text-brand-primary',
    fields: [],
    connectUrl: '',
    syncUrl: null,
    importField: null,
    comingSoon: true,
  },
  'stripe': {
    name: 'Stripe',
    description: 'Look up account balances during collection calls',
    category: 'Payments',
    abbrev: 'ST',
    color: 'bg-purple-500/10 text-purple-400',
    fields: [],
    connectUrl: '',
    syncUrl: null,
    importField: null,
    comingSoon: true,
  },
}

// ============================================
// WIZARD SUB-COMPONENTS
// ============================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const stepLabels = ['Role & Voice', 'Business Info', 'Integrations', 'Data Sources', 'Review Config', 'Confirm']
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {stepLabels.map((label, idx) => {
          const step = idx + 1
          const isCompleted = currentStep > step
          const isCurrent = currentStep === step
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-brand-primary text-white'
                      : isCurrent
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface-highest text-text-secondary'
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : step}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-brand-primary font-medium' : 'text-text-muted'}`}>
                  {label}
                </span>
              </div>
              {step < totalSteps && (
                <div className={`h-0.5 w-full mx-1 mb-5 ${isCompleted ? 'bg-brand-primary' : 'bg-surface-highest'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BusinessHoursEditor({
  hours,
  onChange,
}: {
  hours: Record<string, { start: string; end: string } | null>
  onChange: (hours: Record<string, { start: string; end: string } | null>) => void
}) {
  const toggleDay = (day: string) => {
    if (hours[day] === null) {
      onChange({ ...hours, [day]: { start: '09:00', end: '17:00' } })
    } else {
      onChange({ ...hours, [day]: null })
    }
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    const current = hours[day]
    if (!current) return
    onChange({ ...hours, [day]: { ...current, [field]: value } })
  }

  return (
    <div className="space-y-2">
      {DAYS_OF_WEEK.map(day => {
        const dayHours = hours[day]
        const isClosed = dayHours === null
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium text-text-primary capitalize">{day}</span>
            <button
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                isClosed
                  ? 'bg-[#93000a]/10 text-[#ffb4ab] hover:bg-red-200'
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-green-200'
              }`}
            >
              {isClosed ? 'Closed' : 'Open'}
            </button>
            {!isClosed && (
              <>
                <input
                  type="time"
                  value={dayHours.start}
                  onChange={e => updateTime(day, 'start', e.target.value)}
                  className="px-2 py-1 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <span className="text-text-muted text-sm">to</span>
                <input
                  type="time"
                  value={dayHours.end}
                  onChange={e => updateTime(day, 'end', e.target.value)}
                  className="px-2 py-1 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// STEP 1: Role + Name + Voice
// ============================================

function WizardStep1({
  wizardData,
  setWizardData,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
}) {
  const hireableRoles = ['receptionist', 'personal-assistant', 'order-taker', 'after-hours-emergency', 'restaurant-host', 'lead-qualifier', 'survey-caller', 'appointment-reminder', 'collections']

  return (
    <div className="space-y-6">
      {/* Job Type Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">What role should this employee fill?</label>
        <div className="grid grid-cols-1 gap-3">
          {hireableRoles.map(type => {
            const info = JOB_TYPE_INFO[type]
            const Icon = info.icon
            const isSelected = wizardData.jobType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setWizardData(prev => ({ ...prev, jobType: type }))}
                className={`flex items-center p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-brand-primary/5 ring-1 ring-brand-primary/50'
                    : 'border-[rgba(65,71,84,0.15)] hover:border-[rgba(65,71,84,0.2)] bg-surface-low'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? `bg-brand-primary/10` : `bg-surface-high`
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-primary' : 'text-text-secondary'}`} />
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-text-primary'}`}>{info.label}</p>
                  <p className={`text-sm ${isSelected ? 'text-brand-primary' : 'text-text-secondary'}`}>{info.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Personal Assistant — Owner Role */}
      {wizardData.jobType === 'personal-assistant' && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">What type of professional is this assistant for?</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'general', label: 'General', description: 'Scheduling & messages' },
              { value: 'medical', label: 'Medical', description: 'HIPAA-aware, clinical triage' },
              { value: 'legal', label: 'Legal', description: 'Confidentiality, case handling' },
              { value: 'real-estate', label: 'Real Estate', description: 'Listings, leads, showings' },
              { value: 'executive', label: 'Executive', description: 'Board-level screening' },
              { value: 'consultant', label: 'Consultant', description: 'Lead qualification' },
              { value: 'financial', label: 'Financial', description: 'Advisor compliance' },
            ].map(role => {
              const isSelected = wizardData.ownerRole === role.value
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setWizardData(prev => ({ ...prev, ownerRole: role.value }))}
                  className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-brand-primary/5'
                      : 'border-[rgba(65,71,84,0.15)] hover:border-[rgba(65,71,84,0.2)] bg-surface-low'
                  }`}
                >
                  <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-text-primary'}`}>{role.label}</span>
                  <span className={`text-xs mt-0.5 ${isSelected ? 'text-brand-primary' : 'text-text-secondary'}`}>{role.description}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            This adds industry-specific guidance to your assistant so it handles calls appropriately for your field.
          </p>
        </div>
      )}

      {/* Employee Name */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Employee Name</label>
        <input
          type="text"
          value={wizardData.name}
          onChange={e => setWizardData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
          placeholder="Maya"
        />
        <p className="mt-1 text-xs text-text-muted">This is the name your employee will use when answering calls.</p>
      </div>

      {/* Tone Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">Personality Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map(tone => {
            const isSelected = wizardData.tone === tone.value
            return (
              <button
                key={tone.value}
                type="button"
                onClick={() => setWizardData(prev => ({ ...prev, tone: tone.value }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-surface-high text-text-primary hover:bg-surface-highest'
                }`}
              >
                {tone.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {TONE_OPTIONS.find(t => t.value === wizardData.tone)?.description}
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Voice</label>
        <VoicePicker
          voiceId={wizardData.voiceId}
          voiceName={wizardData.voiceName || wizardData.voiceId}
          voicePreviewUrl={wizardData.voicePreviewUrl || null}
          onSelect={({ voiceId, voiceName, voicePreviewUrl }) =>
            setWizardData(prev => ({ ...prev, voiceId, voiceName, voicePreviewUrl: voicePreviewUrl ?? null }))
          }
        />
        <p className="mt-1 text-xs text-text-muted">Browse ElevenLabs voices — click ▶ to preview before selecting.</p>
      </div>
    </div>
  )
}

// ============================================
// STEP 2: Business Description + AI Generation
// ============================================

function WizardStep2({
  wizardData,
  setWizardData,
  onGenerate,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
  onGenerate: () => Promise<void>
}) {
  const [interviewConfig, setInterviewConfig] = useState<Record<string, any> | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null)

  const inputMode = wizardData.inputMode || 'website'

  // Load interview config when switching to voice mode
  useEffect(() => {
    if (inputMode === 'voice' && !interviewConfig && !isLoadingConfig) {
      loadInterviewConfig()
    }
  }, [inputMode])

  const loadInterviewConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const headers = await getAuthHeaders()
      const businessId = getSecureBusinessId()
      const res = await fetch('/api/phone-employees/interview-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          employeeName: wizardData.name,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInterviewConfig(data.assistantConfig)
      } else {
        setWizardData(prev => ({ ...prev, generateError: data.error || 'Failed to load voice interview', inputMode: 'text' }))
      }
    } catch (err: any) {
      console.error('Failed to load interview config:', err)
      setWizardData(prev => ({ ...prev, generateError: 'Voice interview unavailable. Please use text mode.', inputMode: 'text' }))
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleCallEnd = (transcript: string) => {
    setWizardData(prev => ({ ...prev, businessDescription: transcript }))
    // Auto-trigger config generation after a brief delay
    setTimeout(() => onGenerate(), 500)
  }

  const handleVoiceError = (error: string) => {
    console.error('Voice interview error:', error)
    // Don't auto-switch - let user see the error and choose
  }

  const applyExtractedData = (extracted: any, source: 'website' | 'document') => {
    const parts: string[] = []
    if (extracted.businessDescription) parts.push('business description')
    if (extracted.faqs?.length) parts.push(`${extracted.faqs.length} FAQs`)
    if (extracted.services?.length) parts.push(`${extracted.services.length} services`)
    if (extracted.appointmentTypes?.length) parts.push(`${extracted.appointmentTypes.length} appointment types`)
    if (extracted.menu?.categories?.length) parts.push('menu items')
    if (extracted.hours) parts.push('business hours')
    if (extracted.supportedProducts?.length) parts.push('supported products')

    const summary = parts.length
      ? `Found: ${parts.join(', ')}. Review and edit in the next step.`
      : 'Extracted some info. Review in the next step.'

    setExtractSuccess(summary)

    setWizardData(prev => ({
      ...prev,
      businessDescription: extracted.businessDescription || prev.businessDescription,
      extractedData: extracted,
      extractedFrom: source,
    }))

    setTimeout(() => onGenerate(), 800)
  }

  const handleWebsiteExtract = async () => {
    if (!wizardData.websiteUrl) return
    setIsExtracting(true)
    setExtractError(null)
    setExtractSuccess(null)
    try {
      const headers = await getAuthHeaders()
      const businessId = getSecureBusinessId()
      const res = await fetch('/api/phone-employees/extract-from-website', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: wizardData.websiteUrl,
          jobType: wizardData.jobType,
          businessId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setExtractError(data.error || 'Could not extract info from that URL.')
        return
      }
      applyExtractedData(data.extracted, 'website')
    } catch {
      setExtractError('Something went wrong. Try a different URL or upload a document instead.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDocumentExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)
    setExtractError(null)
    setExtractSuccess(null)
    try {
      const businessId = getSecureBusinessId()
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token ?? ''
      const form = new FormData()
      form.append('file', file)
      form.append('jobType', wizardData.jobType)
      form.append('businessId', businessId ?? '')
      const res = await fetch('/api/phone-employees/extract-from-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setExtractError(data.error || 'Could not extract info from that file.')
        return
      }
      applyExtractedData(data.extracted, 'document')
    } catch {
      setExtractError('Something went wrong. Try a different file or use the website option.')
    } finally {
      setIsExtracting(false)
      e.target.value = ''
    }
  }

  const switchMode = (mode: WizardData['inputMode']) => {
    setWizardData(prev => ({ ...prev, inputMode: mode }))
    setExtractError(null)
    setExtractSuccess(null)
  }

  const MODE_CARDS: {
    mode: WizardData['inputMode']
    icon: React.ElementType
    title: string
    subtitle: string
  }[] = [
    { mode: 'website', icon: GlobeAltIcon, title: 'From your website', subtitle: 'Paste your URL' },
    { mode: 'document', icon: DocumentArrowUpIcon, title: 'Upload a document', subtitle: 'PDF, Word, or text' },
    { mode: 'voice', icon: MicrophoneIcon, title: 'Voice interview', subtitle: 'Talk to our AI' },
    { mode: 'text', icon: PencilSquareIcon, title: 'Type it yourself', subtitle: 'Manual entry' },
  ]

  return (
    <div className="space-y-5">
      {/* Mode selector — 4 cards in a 2x2 grid */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          How would you like to set up {wizardData.name || 'this employee'}?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MODE_CARDS.map(({ mode, icon: Icon, title, subtitle }) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                inputMode === mode
                  ? 'border-blue-500 bg-brand-primary/5 ring-1 ring-brand-primary/50'
                  : 'border-[rgba(65,71,84,0.15)] bg-surface-low hover:border-[rgba(65,71,84,0.2)]'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${inputMode === mode ? 'text-brand-primary' : 'text-text-muted'}`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${inputMode === mode ? 'text-blue-900' : 'text-text-primary'}`}>
                  {title}
                </p>
                <p className="text-xs text-text-muted truncate">{subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Website panel */}
      {inputMode === 'website' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={wizardData.websiteUrl}
              onChange={e => setWizardData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://yourbusiness.com"
              className="flex-1 px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
            <button
              type="button"
              onClick={handleWebsiteExtract}
              disabled={!wizardData.websiteUrl || isExtracting}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
            >
              {isExtracting ? 'Extracting...' : 'Pull Info'}
            </button>
          </div>
          {extractError && <p className="text-sm text-[#ffb4ab]">{extractError}</p>}
          {extractSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-500">{extractSuccess}</p>
            </div>
          )}
          <p className="text-xs text-text-muted">We'll read your website and pre-fill your employee's knowledge base.</p>
        </div>
      )}

      {/* Document panel */}
      {inputMode === 'document' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-[rgba(65,71,84,0.2)] rounded-lg p-6 text-center">
            <input
              type="file"
              id="doc-upload"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleDocumentExtract}
              className="hidden"
              disabled={isExtracting}
            />
            <label htmlFor="doc-upload" className="cursor-pointer">
              <DocumentArrowUpIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary">
                {isExtracting ? 'Extracting...' : 'Click to upload'}
              </p>
              <p className="text-xs text-text-muted mt-1">PDF, Word (.docx), or text file — max 10MB</p>
            </label>
          </div>
          {extractError && <p className="text-sm text-[#ffb4ab]">{extractError}</p>}
          {extractSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-500">{extractSuccess}</p>
            </div>
          )}
        </div>
      )}

      {/* Voice panel */}
      {inputMode === 'voice' && (
        <>
          {isLoadingConfig ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-3 text-sm text-text-secondary">Preparing voice interview...</p>
            </div>
          ) : interviewConfig ? (
            <>
              {wizardData.isGenerating ? (
                <div className="flex flex-col items-center py-8">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                    <SparklesIcon className="h-5 w-5 text-brand-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-text-primary">AI is configuring your employee from the interview...</p>
                  <p className="text-xs text-text-muted mt-1">This usually takes 5-10 seconds</p>
                </div>
              ) : (
                <VoiceInterview
                  assistantConfig={interviewConfig}
                  onCallEnd={handleCallEnd}
                  onError={handleVoiceError}
                />
              )}
            </>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-accent">
                Voice interview could not be loaded.{' '}
                <button
                  type="button"
                  onClick={() => switchMode('text')}
                  className="underline font-medium"
                >
                  Switch to text mode
                </button>
              </p>
            </div>
          )}

          {wizardData.generateError && (
            <div className="p-3 bg-[#93000a]/5 border border-red-200 rounded-lg">
              <p className="text-sm text-[#ffb4ab]">{wizardData.generateError}</p>
            </div>
          )}
        </>
      )}

      {/* Text panel */}
      {inputMode === 'text' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Describe your business
            </label>
            <p className="text-sm text-text-secondary mb-3">
              Include what you do, services you offer, hours, location, and anything else your phone employee should know.
            </p>
            <textarea
              value={wizardData.businessDescription}
              onChange={e => setWizardData(prev => ({ ...prev, businessDescription: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none"
              placeholder="e.g., We are a family-owned Italian restaurant in downtown Portland. We offer dine-in, takeout, and delivery. Our hours are Tuesday through Sunday, 11am to 10pm. We specialize in handmade pasta, wood-fired pizza, and seasonal Italian dishes..."
            />
          </div>

          {wizardData.generateError && (
            <div className="p-3 bg-[#93000a]/5 border border-red-200 rounded-lg">
              <p className="text-sm text-[#ffb4ab]">{wizardData.generateError}</p>
            </div>
          )}

          {wizardData.isGenerating ? (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <SparklesIcon className="h-5 w-5 text-brand-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-4 text-sm font-medium text-text-primary">AI is configuring your employee...</p>
              <p className="text-xs text-text-muted mt-1">This usually takes 5-10 seconds</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!wizardData.businessDescription.trim()}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate Configuration
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ============================================
// STEP 3: Review & Edit Config
// ============================================

function WizardStep3({
  wizardData,
  setWizardData,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
}) {
  const config = wizardData.generatedConfig
  if (!config) return <p className="text-text-secondary">No configuration generated yet.</p>

  const updateConfig = (path: string, value: any) => {
    setWizardData(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev.generatedConfig))
      const keys = path.split('.')
      let obj = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return { ...prev, generatedConfig: newConfig }
    })
  }

  const jobType = wizardData.jobType

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Review and customize the AI-generated configuration. All fields are editable.
      </p>

      {/* Greeting - common to all types */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Greeting</label>
        <textarea
          value={config.greeting || ''}
          onChange={e => updateConfig('greeting', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none text-sm"
        />
      </div>

      {/* Receptionist-specific fields */}
      {jobType === 'receptionist' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Description</label>
            <textarea
              value={config.businessDescription || ''}
              onChange={e => updateConfig('businessDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none text-sm"
            />
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">Services</label>
              <button
                type="button"
                onClick={() => {
                  const services = [...(config.services || [])]
                  services.push({ name: '', duration: 30 })
                  updateConfig('services', services)
                }}
                className="text-xs text-brand-primary hover:text-brand-primary font-medium"
              >
                + Add Service
              </button>
            </div>
            {(config.services || []).map((service: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={service.name}
                  onChange={e => {
                    const services = [...config.services]
                    services[idx] = { ...services[idx], name: e.target.value }
                    updateConfig('services', services)
                  }}
                  placeholder="Service name"
                  className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <input
                  type="number"
                  value={service.duration}
                  onChange={e => {
                    const services = [...config.services]
                    services[idx] = { ...services[idx], duration: parseInt(e.target.value) || 0 }
                    updateConfig('services', services)
                  }}
                  placeholder="Min"
                  className="w-20 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <span className="text-xs text-text-muted">min</span>
                <button
                  type="button"
                  onClick={() => {
                    const services = config.services.filter((_: any, i: number) => i !== idx)
                    updateConfig('services', services)
                  }}
                  className="p-1 text-text-muted hover:text-[#ffb4ab]"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">FAQs</label>
              <button
                type="button"
                onClick={() => {
                  const faqs = [...(config.faqs || [])]
                  faqs.push({ question: '', answer: '', keywords: [] })
                  updateConfig('faqs', faqs)
                }}
                className="text-xs text-brand-primary hover:text-brand-primary font-medium"
              >
                + Add FAQ
              </button>
            </div>
            {(config.faqs || []).map((faq: any, idx: number) => (
              <div key={idx} className="p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => {
                        const faqs = [...config.faqs]
                        faqs[idx] = { ...faqs[idx], question: e.target.value }
                        updateConfig('faqs', faqs)
                      }}
                      placeholder="Question"
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => {
                        const faqs = [...config.faqs]
                        faqs[idx] = { ...faqs[idx], answer: e.target.value }
                        updateConfig('faqs', faqs)
                      }}
                      placeholder="Answer"
                      rows={2}
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const faqs = config.faqs.filter((_: any, i: number) => i !== idx)
                      updateConfig('faqs', faqs)
                    }}
                    className="ml-2 p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Taker-specific fields */}
      {jobType === 'order-taker' && (
        <>
          {/* Menu Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">Menu Categories</label>
              <button
                type="button"
                onClick={() => {
                  const categories = [...(config.menu?.categories || [])]
                  categories.push({ name: '', items: [] })
                  updateConfig('menu', { ...config.menu, categories })
                }}
                className="text-xs text-brand-primary hover:text-brand-primary font-medium"
              >
                + Add Category
              </button>
            </div>
            {(config.menu?.categories || []).map((category: any, catIdx: number) => (
              <div key={catIdx} className="p-3 bg-surface rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={category.name}
                    onChange={e => {
                      const categories = [...config.menu.categories]
                      categories[catIdx] = { ...categories[catIdx], name: e.target.value }
                      updateConfig('menu', { ...config.menu, categories })
                    }}
                    placeholder="Category name (e.g., Appetizers)"
                    className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const categories = config.menu.categories.filter((_: any, i: number) => i !== catIdx)
                      updateConfig('menu', { ...config.menu, categories })
                    }}
                    className="p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                {/* Items in category */}
                {(category.items || []).map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="flex items-center gap-2 mb-1 ml-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items[itemIdx].name = e.target.value
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      placeholder="Item name"
                      className="flex-1 px-2 py-1 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <div className="flex items-center">
                      <span className="text-sm text-text-muted mr-1">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={e => {
                          const categories = JSON.parse(JSON.stringify(config.menu.categories))
                          categories[catIdx].items[itemIdx].price = parseFloat(e.target.value) || 0
                          updateConfig('menu', { ...config.menu, categories })
                        }}
                        placeholder="0.00"
                        className="w-20 px-2 py-1 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={e => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items[itemIdx].description = e.target.value
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      placeholder="Description (optional)"
                      className="flex-1 px-2 py-1 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items.splice(itemIdx, 1)
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      className="p-1 text-text-muted hover:text-[#ffb4ab]"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const categories = JSON.parse(JSON.stringify(config.menu.categories))
                    categories[catIdx].items.push({ name: '', price: 0, description: '' })
                    updateConfig('menu', { ...config.menu, categories })
                  }}
                  className="ml-4 mt-1 text-xs text-brand-primary hover:text-brand-primary font-medium"
                >
                  + Add Item
                </button>
              </div>
            ))}
          </div>

          {/* Order Settings */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Order Settings</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Min Order ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.orderSettings?.minimumOrder || 0}
                  onChange={e => updateConfig('orderSettings', { ...config.orderSettings, minimumOrder: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Delivery Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.orderSettings?.deliveryFee || 0}
                  onChange={e => updateConfig('orderSettings', { ...config.orderSettings, deliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Pickup Time (min)</label>
                <input
                  type="number"
                  value={config.orderSettings?.estimatedTime?.pickup || 20}
                  onChange={e => updateConfig('orderSettings', {
                    ...config.orderSettings,
                    estimatedTime: { ...config.orderSettings?.estimatedTime, pickup: parseInt(e.target.value) || 0 },
                  })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Delivery Time (min)</label>
                <input
                  type="number"
                  value={config.orderSettings?.estimatedTime?.delivery || 45}
                  onChange={e => updateConfig('orderSettings', {
                    ...config.orderSettings,
                    estimatedTime: { ...config.orderSettings?.estimatedTime, delivery: parseInt(e.target.value) || 0 },
                  })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Personal Assistant-specific fields */}
      {jobType === 'personal-assistant' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Owner Name</label>
            <input
              type="text"
              value={config.ownerName || ''}
              onChange={e => updateConfig('ownerName', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Scheduling Rules</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Min Notice (min)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.minNotice || 60}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, minNotice: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Max Advance (days)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.maxAdvance || 30}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, maxAdvance: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Buffer (min)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.bufferBetween || 15}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, bufferBetween: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {jobType === 'appointment-scheduler' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Business Description</label>
            <textarea
              rows={3}
              value={config.businessDescription || ''}
              onChange={e => updateConfig('businessDescription', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Appointment Types</label>
            {(config.appointmentTypes || []).map((appt: { name: string; duration: number; price: number }, idx: number) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={appt.name}
                  onChange={e => {
                    const updated = [...(config.appointmentTypes || [])];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    updateConfig('appointmentTypes', updated);
                  }}
                  placeholder="Appointment name"
                  className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <input
                  type="number"
                  value={appt.duration}
                  onChange={e => {
                    const updated = [...(config.appointmentTypes || [])];
                    updated[idx] = { ...updated[idx], duration: parseInt(e.target.value) || 0 };
                    updateConfig('appointmentTypes', updated);
                  }}
                  className="w-20 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <span className="text-xs text-text-secondary">min</span>
                <span className="text-xs text-text-secondary">$</span>
                <input
                  type="number"
                  value={appt.price}
                  onChange={e => {
                    const updated = [...(config.appointmentTypes || [])];
                    updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                    updateConfig('appointmentTypes', updated);
                  }}
                  placeholder="0"
                  className="w-24 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <button
                  onClick={() => {
                    const updated = [...(config.appointmentTypes || [])];
                    updated.splice(idx, 1);
                    updateConfig('appointmentTypes', updated);
                  }}
                  className="p-1 text-text-muted hover:text-[#ffb4ab]"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateConfig('appointmentTypes', [...(config.appointmentTypes || []), { name: '', duration: 30, price: 0 }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Type
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Booking Rules</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Min Notice (hours)</label>
                <input
                  type="number"
                  value={config.bookingRules?.minNoticeHours ?? 2}
                  onChange={e => updateConfig('bookingRules', { ...config.bookingRules, minNoticeHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Max Advance (days)</label>
                <input
                  type="number"
                  value={config.bookingRules?.maxAdvanceDays ?? 30}
                  onChange={e => updateConfig('bookingRules', { ...config.bookingRules, maxAdvanceDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Buffer Between (min)</label>
                <input
                  type="number"
                  value={config.bookingRules?.bufferMinutes ?? 15}
                  onChange={e => updateConfig('bookingRules', { ...config.bookingRules, bufferMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={!!config.bookingRules?.sameDayBooking}
                  onChange={e => updateConfig('bookingRules', { ...config.bookingRules, sameDayBooking: e.target.checked })}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Same-Day Booking</label>
              </div>
            </div>
          </div>
        </>
      )}

      {jobType === 'customer-service' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Business Description</label>
            <textarea
              rows={3}
              value={config.businessDescription || ''}
              onChange={e => updateConfig('businessDescription', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Return Policy</label>
            <textarea
              rows={2}
              value={config.returnPolicy || ''}
              onChange={e => updateConfig('returnPolicy', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Common Issues</label>
            {(config.commonIssues || []).map((item: { issue: string; resolution: string }, idx: number) => (
              <div key={idx} className="p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.issue}
                      onChange={e => {
                        const updated = [...(config.commonIssues || [])];
                        updated[idx] = { ...updated[idx], issue: e.target.value };
                        updateConfig('commonIssues', updated);
                      }}
                      placeholder="Issue / complaint"
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <textarea
                      rows={2}
                      value={item.resolution}
                      onChange={e => {
                        const updated = [...(config.commonIssues || [])];
                        updated[idx] = { ...updated[idx], resolution: e.target.value };
                        updateConfig('commonIssues', updated);
                      }}
                      placeholder="Resolution / response"
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...(config.commonIssues || [])];
                      updated.splice(idx, 1);
                      updateConfig('commonIssues', updated);
                    }}
                    className="p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => updateConfig('commonIssues', [...(config.commonIssues || []), { issue: '', resolution: '' }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Issue
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Resolution Authority</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.resolutionAuthority?.canRefund}
                  onChange={e => updateConfig('resolutionAuthority', { ...config.resolutionAuthority, canRefund: e.target.checked })}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Can issue refunds</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.resolutionAuthority?.canOfferDiscount}
                  onChange={e => updateConfig('resolutionAuthority', { ...config.resolutionAuthority, canOfferDiscount: e.target.checked })}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Can offer discounts</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.resolutionAuthority?.canScheduleCallback}
                  onChange={e => updateConfig('resolutionAuthority', { ...config.resolutionAuthority, canScheduleCallback: e.target.checked })}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Can schedule callbacks</label>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Max Refund Amount ($)</label>
                <input
                  type="number"
                  value={config.resolutionAuthority?.maxRefundAmount ?? 0}
                  onChange={e => updateConfig('resolutionAuthority', { ...config.resolutionAuthority, maxRefundAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {jobType === 'after-hours-emergency' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Type</label>
            <select
              value={config.businessType || 'general'}
              onChange={e => updateConfig('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            >
              <option value="property-management">Property Management</option>
              <option value="medical">Medical / Healthcare</option>
              <option value="hvac-contractor">HVAC / Contractor</option>
              <option value="legal">Legal</option>
              <option value="general">General Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">On-Call Contacts</label>
            {(config.onCallContacts || []).map((contact: { name: string; phone: string; role: string }, idx: number) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={contact.name}
                  onChange={e => {
                    const updated = [...(config.onCallContacts || [])];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    updateConfig('onCallContacts', updated);
                  }}
                  placeholder="Name"
                  className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <input
                  type="text"
                  value={contact.phone}
                  onChange={e => {
                    const updated = [...(config.onCallContacts || [])];
                    updated[idx] = { ...updated[idx], phone: e.target.value };
                    updateConfig('onCallContacts', updated);
                  }}
                  placeholder="+1 555-000-0000"
                  className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <input
                  type="text"
                  value={contact.role}
                  onChange={e => {
                    const updated = [...(config.onCallContacts || [])];
                    updated[idx] = { ...updated[idx], role: e.target.value };
                    updateConfig('onCallContacts', updated);
                  }}
                  placeholder="Role (optional)"
                  className="w-32 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <button
                  onClick={() => {
                    const updated = [...(config.onCallContacts || [])];
                    updated.splice(idx, 1);
                    updateConfig('onCallContacts', updated);
                  }}
                  className="p-1 text-text-muted hover:text-[#ffb4ab]"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateConfig('onCallContacts', [...(config.onCallContacts || []), { name: '', phone: '', role: '' }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Contact
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Emergency Keywords</label>
            <textarea
              rows={2}
              value={(config.emergencyKeywords || []).join(', ')}
              onChange={e => updateConfig('emergencyKeywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">Comma-separated (e.g. fire, flood, gas leak)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Urgent Keywords</label>
            <textarea
              rows={2}
              value={(config.urgentKeywords || []).join(', ')}
              onChange={e => updateConfig('urgentKeywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">Comma-separated (e.g. fire, flood, gas leak)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Non-Emergency Response</label>
            <textarea
              rows={2}
              value={config.nonEmergencyResponse || ''}
              onChange={e => updateConfig('nonEmergencyResponse', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>
        </>
      )}

      {jobType === 'restaurant-host' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Restaurant Name</label>
            <input
              type="text"
              value={config.restaurantName || ''}
              onChange={e => updateConfig('restaurantName', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Capacity</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Total Seats</label>
                <input
                  type="number"
                  value={config.tableCapacity ?? 50}
                  onChange={e => updateConfig('tableCapacity', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Max Party Size</label>
                <input
                  type="number"
                  value={config.partyMaxSize ?? 8}
                  onChange={e => updateConfig('partyMaxSize', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!config.waitlistEnabled}
                onChange={e => updateConfig('waitlistEnabled', e.target.checked)}
                className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
              />
              <label className="text-sm text-text-primary">Waitlist enabled</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!config.specialOccasionsEnabled}
                onChange={e => updateConfig('specialOccasionsEnabled', e.target.checked)}
                className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
              />
              <label className="text-sm text-text-primary">Special occasions</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Reservation Slots</label>
            {(config.reservationSlots || []).map((slot: { day: string; openTime: string; closeTime: string; slotIntervalMinutes: number }, idx: number) => (
              <div key={idx} className="p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <select
                    value={slot.day}
                    onChange={e => {
                      const updated = [...(config.reservationSlots || [])];
                      updated[idx] = { ...updated[idx], day: e.target.value };
                      updateConfig('reservationSlots', updated);
                    }}
                    className="px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  >
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={slot.openTime}
                    onChange={e => {
                      const updated = [...(config.reservationSlots || [])];
                      updated[idx] = { ...updated[idx], openTime: e.target.value };
                      updateConfig('reservationSlots', updated);
                    }}
                    placeholder="17:00"
                    className="w-20 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                  <span className="text-xs text-text-secondary">to</span>
                  <input
                    type="text"
                    value={slot.closeTime}
                    onChange={e => {
                      const updated = [...(config.reservationSlots || [])];
                      updated[idx] = { ...updated[idx], closeTime: e.target.value };
                      updateConfig('reservationSlots', updated);
                    }}
                    placeholder="22:00"
                    className="w-20 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                  <select
                    value={slot.slotIntervalMinutes}
                    onChange={e => {
                      const updated = [...(config.reservationSlots || [])];
                      updated[idx] = { ...updated[idx], slotIntervalMinutes: parseInt(e.target.value) };
                      updateConfig('reservationSlots', updated);
                    }}
                    className="px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                  <button
                    onClick={() => {
                      const updated = [...(config.reservationSlots || [])];
                      updated.splice(idx, 1);
                      updateConfig('reservationSlots', updated);
                    }}
                    className="p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => updateConfig('reservationSlots', [...(config.reservationSlots || []), { day: 'monday', openTime: '17:00', closeTime: '22:00', slotIntervalMinutes: 30 }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Slot
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={!!config.depositRequired}
                onChange={e => updateConfig('depositRequired', e.target.checked ? { partySize: 6, amount: 25 } : undefined)}
                className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
              />
              <label className="text-sm text-text-primary">Require deposit for large parties</label>
            </div>
            {config.depositRequired && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Party Size &ge;</label>
                  <input
                    type="number"
                    value={config.depositRequired.partySize ?? 6}
                    onChange={e => updateConfig('depositRequired', { ...config.depositRequired, partySize: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Deposit Amount ($)</label>
                  <input
                    type="number"
                    value={config.depositRequired.amount ?? 25}
                    onChange={e => updateConfig('depositRequired', { ...config.depositRequired, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {jobType === 'survey-caller' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Survey Name</label>
            <input
              type="text"
              value={config.surveyName || ''}
              onChange={e => updateConfig('surveyName', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Call Trigger</label>
            <select
              value={config.callTrigger || 'post_appointment'}
              onChange={e => updateConfig('callTrigger', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            >
              <option value="post_appointment">After Appointment</option>
              <option value="post_order">After Order</option>
              <option value="manual">Manual / Scheduled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Hours after trigger to call</label>
            <input
              type="number"
              value={config.triggerDelayHours ?? 2}
              onChange={e => updateConfig('triggerDelayHours', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Questions</label>
            {(config.questions || []).map((q: { id: string; question: string; type: string; required: boolean }, idx: number) => (
              <div key={q.id || idx} className="p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={1}
                      value={q.question}
                      onChange={e => {
                        const updated = [...(config.questions || [])];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        updateConfig('questions', updated);
                      }}
                      placeholder="Question text"
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={q.type}
                        onChange={e => {
                          const updated = [...(config.questions || [])];
                          updated[idx] = { ...updated[idx], type: e.target.value };
                          updateConfig('questions', updated);
                        }}
                        className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                      >
                        <option value="rating">1–10 Rating</option>
                        <option value="yes_no">Yes / No</option>
                        <option value="nps">Net Promoter Score</option>
                        <option value="open">Open-ended</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!q.required}
                          onChange={e => {
                            const updated = [...(config.questions || [])];
                            updated[idx] = { ...updated[idx], required: e.target.checked };
                            updateConfig('questions', updated);
                          }}
                          className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                        />
                        <label className="text-sm text-text-primary">Required</label>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...(config.questions || [])];
                      updated.splice(idx, 1);
                      updateConfig('questions', updated);
                    }}
                    className="p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => updateConfig('questions', [...(config.questions || []), { id: Date.now().toString(), question: '', type: 'rating', required: true }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Question
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Incentive Offer (optional)</label>
            <input
              type="text"
              value={config.offerIncentive || ''}
              onChange={e => updateConfig('offerIncentive', e.target.value)}
              placeholder="e.g. 10% off your next visit (leave blank for none)"
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Closing (positive response)</label>
            <textarea
              rows={1}
              value={config.positiveOutro || ''}
              onChange={e => updateConfig('positiveOutro', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Closing (needs improvement)</label>
            <textarea
              rows={1}
              value={config.negativeOutro || ''}
              onChange={e => updateConfig('negativeOutro', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>
        </>
      )}

      {jobType === 'lead-qualifier' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Business Description</label>
            <textarea
              rows={3}
              value={config.businessDescription || ''}
              onChange={e => updateConfig('businessDescription', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Qualifying Questions</label>
            {(config.qualifyingQuestions || []).map((q: { id: string; question: string; field: string; required: boolean }, idx: number) => (
              <div key={q.id || idx} className="p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={1}
                      value={q.question}
                      onChange={e => {
                        const updated = [...(config.qualifyingQuestions || [])];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        updateConfig('qualifyingQuestions', updated);
                      }}
                      placeholder="Question text"
                      className="w-full px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={q.field}
                        onChange={e => {
                          const updated = [...(config.qualifyingQuestions || [])];
                          updated[idx] = { ...updated[idx], field: e.target.value };
                          updateConfig('qualifyingQuestions', updated);
                        }}
                        className="flex-1 px-2 py-1.5 border border-[rgba(65,71,84,0.2)] rounded text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                      >
                        <option value="interest">Interest Level</option>
                        <option value="timeline">Timeline</option>
                        <option value="budget">Budget</option>
                        <option value="authority">Decision Maker</option>
                        <option value="custom">Custom</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!q.required}
                          onChange={e => {
                            const updated = [...(config.qualifyingQuestions || [])];
                            updated[idx] = { ...updated[idx], required: e.target.checked };
                            updateConfig('qualifyingQuestions', updated);
                          }}
                          className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                        />
                        <label className="text-sm text-text-primary">Required</label>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...(config.qualifyingQuestions || [])];
                      updated.splice(idx, 1);
                      updateConfig('qualifyingQuestions', updated);
                    }}
                    className="p-1 text-text-muted hover:text-[#ffb4ab]"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => updateConfig('qualifyingQuestions', [...(config.qualifyingQuestions || []), { id: Date.now().toString(), question: '', field: 'interest', required: true }])}
              className="text-xs text-brand-primary hover:text-brand-primary font-medium"
            >
              + Add Question
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">When a hot lead is identified...</label>
            <select
              value={config.hotLeadAction || 'callback'}
              onChange={e => updateConfig('hotLeadAction', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            >
              <option value="transfer">Transfer to Human</option>
              <option value="book">Book a Meeting</option>
              <option value="callback">Schedule Callback</option>
            </select>
          </div>

          {config.hotLeadAction === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Transfer Number</label>
              <input
                type="text"
                value={config.transferNumber || ''}
                onChange={e => updateConfig('transferNumber', e.target.value)}
                placeholder="Transfer phone number"
                className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Response for warm leads</label>
            <textarea
              rows={2}
              value={config.warmLeadResponse || ''}
              onChange={e => updateConfig('warmLeadResponse', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Response for cold/unqualified leads</label>
            <textarea
              rows={2}
              value={config.coldLeadResponse || ''}
              onChange={e => updateConfig('coldLeadResponse', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>
        </>
      )}

      {jobType === 'appointment-reminder' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Hours before appointment to call</label>
            <input
              type="number"
              value={config.reminderLeadTimeHours ?? 24}
              onChange={e => updateConfig('reminderLeadTimeHours', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">e.g. 24 = call the day before</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.confirmationRequired}
                  onChange={e => updateConfig('confirmationRequired', e.target.checked)}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Ask for confirmation</label>
              </div>
              <p className="mt-1 text-xs text-text-muted ml-6">If enabled, ask caller to confirm they&apos;ll attend.</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.rescheduleEnabled}
                  onChange={e => updateConfig('rescheduleEnabled', e.target.checked)}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Offer rescheduling</label>
              </div>
              <p className="mt-1 text-xs text-text-muted ml-6">If they can&apos;t make it, offer to reschedule.</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!config.sendConfirmationSms}
                  onChange={e => updateConfig('sendConfirmationSms', e.target.checked)}
                  className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                />
                <label className="text-sm text-text-primary">Send SMS after call</label>
              </div>
              <p className="mt-1 text-xs text-text-muted ml-6">Send a text summary after the reminder call.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Cancellation Policy (read to caller if they want to cancel)</label>
            <textarea
              rows={2}
              value={config.cancellationPolicy || ''}
              onChange={e => updateConfig('cancellationPolicy', e.target.value)}
              placeholder="e.g. Cancellations within 24 hours incur a $25 fee"
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>
        </>
      )}

      {jobType === 'collections' && (
        <>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">FDCPA Compliance Disclaimer</label>
            <textarea
              rows={2}
              value={config.complianceDisclaimer || ''}
              onChange={e => updateConfig('complianceDisclaimer', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">Read at the start of every call. Required by law.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Payment Options</label>
            <div className="flex gap-4">
              {[
                { value: 'full', label: 'Full Payment' },
                { value: 'payment-plan', label: 'Payment Plan' },
                { value: 'settlement', label: 'Settlement' },
              ].map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(config.paymentOptions || []).includes(opt.value)}
                    onChange={e => {
                      const current: string[] = config.paymentOptions || [];
                      const updated = e.target.checked
                        ? [...current, opt.value]
                        : current.filter((v: string) => v !== opt.value);
                      updateConfig('paymentOptions', updated);
                    }}
                    className="rounded border-[rgba(65,71,84,0.2)] text-brand-primary focus:ring-brand-primary/50"
                  />
                  <label className="text-sm text-text-primary">{opt.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Max Payment Plan Length (months)</label>
            <input
              type="number"
              value={config.maxPaymentPlanMonths ?? 6}
              onChange={e => updateConfig('maxPaymentPlanMonths', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>

          {(config.paymentOptions || []).includes('settlement') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Settlement Percentage (%)</label>
              <input
                type="number"
                value={config.settlementPercentage ?? 70}
                onChange={e => updateConfig('settlementPercentage', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Communication Tone</label>
            <select
              value={config.escalationPolicy || 'empathetic'}
              onChange={e => updateConfig('escalationPolicy', e.target.value)}
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            >
              <option value="empathetic">Empathetic</option>
              <option value="neutral">Neutral</option>
              <option value="firm">Firm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Dispute Contact</label>
            <input
              type="text"
              value={config.disputeContact || ''}
              onChange={e => updateConfig('disputeContact', e.target.value)}
              placeholder="Phone number or email for disputes"
              className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
            />
          </div>
        </>
      )}

      {/* Business Hours - common to all types */}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Business Hours</label>
        <BusinessHoursEditor
          hours={config.businessHours || DEFAULT_BUSINESS_HOURS}
          onChange={hours => updateConfig('businessHours', hours)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Timezone</label>
        <select
          value={config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={e => updateConfig('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary text-sm"
        >
          {TIMEZONE_OPTIONS.map(tz => (
            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-muted">Used to determine when your employee is "after hours".</p>
      </div>
    </div>
  )
}

// ============================================
// STEP 4: Confirm & Create
// ============================================

function WizardStep4({
  wizardData,
  isCreating,
  createError,
  createSuccess,
  onConfirm,
  phoneStep,
  setPhoneStep,
  onProvisionPhone,
  isTrial,
  createdEmployeeId,
  onTrainEmployee,
}: {
  wizardData: WizardData
  isCreating: boolean
  createError: string | null
  createSuccess: boolean
  onConfirm: () => void
  phoneStep: {
    status: string
    wantsPhone: boolean
    phoneMode: 'vapi-only' | 'twilio-vapi'
    areaCode: string
    provisionedNumber: string | null
    error: string | null
  }
  isTrial: boolean
  setPhoneStep: React.Dispatch<React.SetStateAction<any>>
  onProvisionPhone: () => void
  createdEmployeeId?: string | null
  onTrainEmployee?: () => void
}) {
  const jobInfo = JOB_TYPE_INFO[wizardData.jobType] || JOB_TYPE_INFO['receptionist']
  const Icon = jobInfo.icon
  const config = wizardData.generatedConfig

  // Force vapi-only until per-tenant A2P SMS registration flow is built
  useEffect(() => {
    if (phoneStep.phoneMode !== 'vapi-only') {
      setPhoneStep((prev: any) => ({ ...prev, phoneMode: 'vapi-only' }))
    }
  }, [phoneStep.phoneMode, setPhoneStep])

  if (createSuccess) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center py-4">
          <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
            <CheckIcon className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Employee Created!</h3>
          <p className="text-sm text-text-secondary text-center">
            {wizardData.name} is ready to start handling calls as your {jobInfo.label.toLowerCase()}.
          </p>
        </div>

        {/* Phone result */}
        {phoneStep.provisionedNumber ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Phone number assigned</p>
              <p className="text-sm text-emerald-500">{phoneStep.provisionedNumber}</p>
            </div>
          </div>
        ) : phoneStep.error ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Phone setup needs attention</p>
                <p className="text-xs text-accent mt-1">{friendlyProvisioningError(phoneStep.error)}</p>
                <p className="text-xs text-text-secondary mt-1">You can retry from the employee card on the main page.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Train button */}
        {onTrainEmployee && (
          <button
            onClick={onTrainEmployee}
            className="w-full py-3 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-[#0060d0] transition-colors flex items-center justify-center gap-2"
          >
            <SparklesIcon className="h-4 w-4" />
            Train Your Employee
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">Review the summary below and create your new employee.</p>

      {/* Summary Card */}
      <div className="bg-surface rounded-lg p-4 space-y-3">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="ml-3">
            <p className="font-semibold text-text-primary">{wizardData.name}</p>
            <p className="text-sm text-brand-primary">{jobInfo.label}</p>
          </div>
        </div>

        <div className="border-t border-[rgba(65,71,84,0.15)] pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tone</span>
            <span className="text-text-primary capitalize">{wizardData.tone}</span>
          </div>

          {config?.greeting && (
            <div className="text-sm">
              <span className="text-text-secondary">Greeting:</span>
              <p className="text-text-primary mt-1 italic text-xs">"{config.greeting}"</p>
            </div>
          )}

          {wizardData.jobType === 'receptionist' && config?.services?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Services</span>
              <span className="text-text-primary">{config.services.length} configured</span>
            </div>
          )}

          {wizardData.jobType === 'receptionist' && config?.faqs?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">FAQs</span>
              <span className="text-text-primary">{config.faqs.length} configured</span>
            </div>
          )}

          {wizardData.jobType === 'order-taker' && config?.menu?.categories?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Menu Categories</span>
              <span className="text-text-primary">{config.menu.categories.length} categories</span>
            </div>
          )}

          {wizardData.jobType === 'personal-assistant' && config?.ownerName && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Assistant for</span>
              <span className="text-text-primary">{config.ownerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Phone provisioning options (before creation) */}
      <div className="border border-[rgba(65,71,84,0.15)] rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Add a dedicated phone number?</p>
            <p className="text-xs text-text-secondary mt-0.5">Customers can call this employee directly</p>
          </div>
          <button
            type="button"
            onClick={() => setPhoneStep((prev: any) => ({ ...prev, wantsPhone: !prev.wantsPhone }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              phoneStep.wantsPhone ? 'bg-brand-primary' : 'bg-surface-highest'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-low transition-transform ${
              phoneStep.wantsPhone ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {phoneStep.wantsPhone && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-blue-400 bg-brand-primary/5">
              <p className="text-sm font-medium text-text-primary">Voice calls</p>
              <p className="text-xs text-text-secondary mt-0.5">AI answers every call 24/7. SMS is available as a separate add-on once your business is A2P-registered (coming soon).</p>
            </div>

            <div>
              <label className="text-xs font-medium text-text-primary">Area code (optional)</label>
              <input
                type="text"
                value={phoneStep.areaCode}
                onChange={e => setPhoneStep((prev: any) => ({ ...prev, areaCode: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                placeholder="e.g. 415"
                className="mt-1 w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                maxLength={3}
              />
            </div>
          </div>
        )}
      </div>

      {createError && (
        <div className="p-3 bg-[#93000a]/5 border border-red-200 rounded-lg">
          <p className="text-sm text-[#ffb4ab]">{createError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={isCreating}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] disabled:opacity-50 transition-colors font-medium"
      >
        {isCreating ? (
          <>
            <div className="h-4 w-4 border-2 border-surface border-t-transparent rounded-full animate-spin mr-2" />
            {phoneStep.wantsPhone ? 'Creating Employee & Setting Up Phone...' : 'Creating Employee...'}
          </>
        ) : (
          <>
            <PlusIcon className="h-5 w-5 mr-2" />
            {phoneStep.wantsPhone ? 'Create Employee & Provision Phone' : 'Create Employee'}
          </>
        )}
      </button>
    </div>
  )
}

// ============================================
// STEP 4: DATA SOURCES
// ============================================

function WizardStepDataSources({
  wizardData,
  setWizardData,
  businessId,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
  businessId: string
}) {
  const [webhookUrl, setWebhookUrl] = useState(wizardData.dataSource?.type === 'custom-webhook' ? (wizardData.dataSource.webhookUrl || '') : '')
  const [webhookSecret, setWebhookSecret] = useState(wizardData.dataSource?.type === 'custom-webhook' ? (wizardData.dataSource.webhookSecret || '') : '')
  const [testPhone, setTestPhone] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const selected = wizardData.dataSource?.type ?? null

  const hubspotConnected = wizardData.connectedIntegrations.includes('hubspot')

  const select = (type: string | null) => {
    if (type === null) {
      setWizardData(prev => ({ ...prev, dataSource: null }))
      return
    }
    if (type === 'custom-webhook') {
      setWizardData(prev => ({
        ...prev,
        dataSource: { type, webhookUrl: webhookUrl || undefined, webhookSecret: webhookSecret || undefined },
      }))
    } else {
      setWizardData(prev => ({ ...prev, dataSource: { type } }))
    }
  }

  const handleWebhookChange = (url: string, secret: string) => {
    setWebhookUrl(url)
    setWebhookSecret(secret)
    setWizardData(prev => ({
      ...prev,
      dataSource: { type: 'custom-webhook', webhookUrl: url || undefined, webhookSecret: secret || undefined },
    }))
  }

  const handleTest = async () => {
    if (!testPhone.trim() || !webhookUrl.trim()) return
    setIsTesting(true)
    setTestResult(null)
    try {
      // Test the custom webhook directly
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret.trim() ? { 'X-Webhook-Secret': webhookSecret.trim() } : {}),
        },
        body: JSON.stringify({ phone: testPhone.trim() }),
      })
      const data = await res.json().catch(() => null)
      setTestResult({ httpStatus: res.status, success: res.ok, result: data })
    } catch (err: any) {
      setTestResult({ error: err.message || 'Request failed — check the URL and CORS settings' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Live Caller Lookup</h3>
        <p className="text-sm text-text-secondary mt-1">
          Give this employee real-time access to caller account data at the start of every call.
          This is optional — skip if you don&apos;t need caller lookup.
        </p>
      </div>

      <div className="space-y-3">
        {/* No lookup */}
        <button
          type="button"
          onClick={() => select(null)}
          className={`w-full flex items-start p-4 rounded-lg border-2 text-left transition-all ${
            selected === null
              ? 'border-blue-500 bg-brand-primary/5'
              : 'border-[rgba(65,71,84,0.15)] hover:border-[rgba(65,71,84,0.2)]'
          }`}
        >
          <div className="flex-1">
            <div className="font-medium text-text-primary">No lookup</div>
            <div className="text-sm text-text-secondary mt-0.5">Employee starts fresh on every call</div>
          </div>
          {selected === null && <div className="w-4 h-4 rounded-full bg-brand-primary mt-1 flex-shrink-0" />}
        </button>

        {/* VoiceFly Contacts */}
        <button
          type="button"
          onClick={() => select('voicefly-contacts')}
          className={`w-full flex items-start p-4 rounded-lg border-2 text-left transition-all ${
            selected === 'voicefly-contacts'
              ? 'border-blue-500 bg-brand-primary/5'
              : 'border-[rgba(65,71,84,0.15)] hover:border-[rgba(65,71,84,0.2)]'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">VoiceFly Contacts</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">Built-in</span>
            </div>
            <div className="text-sm text-text-secondary mt-0.5">Look up callers in your VoiceFly contacts / customer list</div>
          </div>
          {selected === 'voicefly-contacts' && <div className="w-4 h-4 rounded-full bg-brand-primary mt-1 flex-shrink-0" />}
        </button>

        {/* HubSpot */}
        <button
          type="button"
          onClick={() => hubspotConnected ? select('hubspot') : undefined}
          disabled={!hubspotConnected}
          className={`w-full flex items-start p-4 rounded-lg border-2 text-left transition-all ${
            !hubspotConnected
              ? 'border-[rgba(65,71,84,0.15)] opacity-50 cursor-not-allowed'
              : selected === 'hubspot'
              ? 'border-blue-500 bg-brand-primary/5'
              : 'border-[rgba(65,71,84,0.15)] hover:border-[rgba(65,71,84,0.2)]'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">HubSpot CRM</span>
              {!hubspotConnected && (
                <span className="text-xs px-2 py-0.5 bg-surface-high text-text-secondary rounded-full">Not connected</span>
              )}
            </div>
            <div className="text-sm text-text-secondary mt-0.5">
              {hubspotConnected
                ? 'Search HubSpot contacts by phone number at call start'
                : 'Connect HubSpot in the previous Integrations step to enable'}
            </div>
          </div>
          {selected === 'hubspot' && <div className="w-4 h-4 rounded-full bg-brand-primary mt-1 flex-shrink-0" />}
        </button>

        {/* Custom Webhook */}
        <div
          className={`rounded-lg border-2 transition-all ${
            selected === 'custom-webhook' ? 'border-blue-500 bg-brand-primary/5' : 'border-[rgba(65,71,84,0.15)]'
          }`}
        >
          <button
            type="button"
            onClick={() => select('custom-webhook')}
            className="w-full flex items-start p-4 text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">Custom Webhook</span>
                <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">Any system</span>
              </div>
              <div className="text-sm text-text-secondary mt-0.5">
                POST the caller&apos;s phone number to your own API — returns any JSON data
              </div>
            </div>
            {selected === 'custom-webhook' && <div className="w-4 h-4 rounded-full bg-brand-primary mt-1 flex-shrink-0" />}
          </button>

          {selected === 'custom-webhook' && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Webhook URL <span className="text-[#ffb4ab]">*</span></label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => handleWebhookChange(e.target.value, webhookSecret)}
                  placeholder="https://your-api.com/caller-lookup"
                  className="w-full px-3 py-2 text-sm border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <p className="text-xs text-text-muted mt-1">VoiceFly will POST <code className="bg-surface-high px-1 rounded">{'{"phone": "+15551234567"}'}</code> to this URL</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Secret header (optional)</label>
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={e => handleWebhookChange(webhookUrl, e.target.value)}
                  placeholder="my-secret-key"
                  className="w-full px-3 py-2 text-sm border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                />
                <p className="text-xs text-text-muted mt-1">Sent as <code className="bg-surface-high px-1 rounded">X-Webhook-Secret</code> header</p>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-primary mb-1">Test with phone number</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+15551234567"
                    className="w-full px-3 py-2 text-sm border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !webhookUrl.trim()}
                  className="px-3 py-2 text-sm bg-surface-lowest text-white rounded-lg hover:bg-surface-high disabled:opacity-50 transition-colors"
                >
                  {isTesting ? 'Testing...' : 'Test'}
                </button>
              </div>
              {testResult && (
                <div className={`text-xs rounded-lg p-3 font-mono overflow-auto max-h-32 ${testResult.error ? 'bg-[#93000a]/5 text-[#ffb4ab]' : 'bg-surface text-text-primary'}`}>
                  {JSON.stringify(testResult, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// STEP 3: INTEGRATIONS
// ============================================

function WizardStepIntegrations({
  wizardData,
  setWizardData,
  businessId,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
  businessId: string
}) {
  const [existingIntegrations, setExistingIntegrations] = useState<Record<string, any>>({})
  const [loadingIntegrations, setLoadingIntegrations] = useState(true)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const [connectFields, setConnectFields] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncSummary, setSyncSummary] = useState<Record<string, string>>({})

  const relevantPlatforms = INTEGRATIONS_BY_JOB[wizardData.jobType] || []
  const builtin = VOICEFLY_BUILTIN[wizardData.jobType]

  useEffect(() => {
    if (!businessId) return
    fetchIntegrations()
  }, [businessId])

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/integrations?businessId=${businessId}`, { headers })
      if (!res.ok) return
      const data = await res.json()
      const byPlatform: Record<string, any> = {}
      for (const integ of (data.integrations || [])) {
        byPlatform[integ.platform] = integ
      }
      setExistingIntegrations(byPlatform)
    } catch {}
    finally { setLoadingIntegrations(false) }
  }

  const handleExpand = (platform: string) => {
    if (expandedPlatform === platform) {
      setExpandedPlatform(null)
      setConnectFields({})
      setConnectError(null)
    } else {
      setExpandedPlatform(platform)
      setConnectFields({})
      setConnectError(null)
    }
  }

  const triggerSync = async (platform: string) => {
    const def = INTEGRATION_CATALOG[platform]
    if (!def?.syncUrl || !def.importField) return
    setSyncing(platform)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(def.syncUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId }),
      })
      const data = await res.json()
      if (!res.ok) return
      if (def.importField === 'menu' && data.menu) {
        setWizardData(prev => ({
          ...prev,
          generatedConfig: { ...(prev.generatedConfig || {}), menu: data.menu },
        }))
        const cats = data.menu?.categories?.length || 0
        const items = data.menu?.categories?.reduce((sum: number, c: any) => sum + (c.items?.length || 0), 0) || 0
        setSyncSummary(prev => ({ ...prev, [platform]: `${items} items across ${cats} categories imported` }))
      } else if (def.importField === 'appointmentTypes' && data.eventTypes) {
        const apptTypes = data.eventTypes.map((et: any) => ({
          name: et.name, duration: et.duration, description: et.description,
        }))
        setWizardData(prev => ({
          ...prev,
          generatedConfig: { ...(prev.generatedConfig || {}), appointmentTypes: apptTypes },
        }))
        setSyncSummary(prev => ({ ...prev, [platform]: `${apptTypes.length} appointment types imported` }))
      }
    } catch {}
    finally { setSyncing(null) }
  }

  const handleConnect = async (platform: string) => {
    const def = INTEGRATION_CATALOG[platform]
    if (!def) return
    setConnecting(true)
    setConnectError(null)
    try {
      const headers = await getAuthHeaders()
      const body: Record<string, any> = { businessId, ...connectFields }
      const res = await fetch(def.connectUrl, { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setConnectError(data.error || 'Failed to connect. Check your credentials and try again.')
        return
      }
      setExistingIntegrations(prev => ({
        ...prev,
        [platform]: { platform, status: 'connected', config: data },
      }))
      setWizardData(prev => ({
        ...prev,
        connectedIntegrations: [...(prev.connectedIntegrations || []).filter(p => p !== platform), platform],
      }))
      setExpandedPlatform(null)
      setConnectFields({})
      if (def.syncUrl && def.importField) {
        await triggerSync(platform)
      }
    } catch (err: any) {
      setConnectError(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  if (relevantPlatforms.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {wizardData.name} works with VoiceFly's built-in system — no external connections are needed.
        </p>
        {builtin && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">{builtin.name}</p>
              <p className="text-xs text-emerald-500 mt-0.5">{builtin.description}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* VoiceFly built-in — always default */}
      {builtin && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Default (no setup required)</p>
          <div className="flex items-center gap-3 p-3 bg-brand-primary/5 border border-blue-200 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">VF</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900">{builtin.name}</span>
                <span className="text-xs bg-brand-primary text-white px-2 py-0.5 rounded-full">Active by default</span>
              </div>
              <p className="text-xs text-brand-primary mt-0.5">{builtin.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Third-party integrations */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Connect external platforms (optional)</p>
        {loadingIntegrations ? (
          <p className="text-xs text-text-muted py-2">Loading...</p>
        ) : (
          <div className="space-y-2">
            {relevantPlatforms.map(platform => {
              const def = INTEGRATION_CATALOG[platform]
              if (!def) return null
              const existing = existingIntegrations[platform]
              const isConnected = existing?.status === 'connected'
              const isExpanded = expandedPlatform === platform
              const summary = syncSummary[platform]

              if (def.comingSoon) {
                return (
                  <div key={platform} className="flex items-center gap-3 p-3 border border-[rgba(65,71,84,0.1)] rounded-lg bg-surface opacity-60">
                    <div className={`w-8 h-8 rounded-lg ${def.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{def.abbrev}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{def.name}</span>
                        <span className="text-xs bg-surface-highest text-text-secondary px-2 py-0.5 rounded-full">Partnership coming soon</span>
                      </div>
                      <p className="text-xs text-text-secondary">{def.description}</p>
                    </div>
                  </div>
                )
              }

              return (
                <div key={platform} className={`border rounded-lg overflow-hidden transition-all ${isConnected ? 'border-green-200 bg-green-50' : 'border-[rgba(65,71,84,0.15)] bg-surface-low'}`}>
                  {/* Card header row */}
                  <div className="flex items-center gap-3 p-3">
                    <div className={`w-8 h-8 rounded-lg ${def.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{def.abbrev}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary">{def.name}</span>
                        <span className="text-xs text-text-muted">{def.category}</span>
                        {isConnected && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">Connected</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{def.description}</p>
                      {isConnected && summary && (
                        <p className="text-xs text-emerald-500 font-medium mt-1">✓ {summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isConnected && def.syncUrl && (
                        <button
                          type="button"
                          onClick={() => triggerSync(platform)}
                          disabled={syncing === platform}
                          className="text-xs text-brand-primary hover:text-brand-primary disabled:opacity-50 transition-colors"
                        >
                          {syncing === platform ? 'Syncing…' : 'Re-sync'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExpand(platform)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          isConnected
                            ? 'text-text-muted hover:text-text-secondary hover:bg-surface-high'
                            : isExpanded
                            ? 'bg-surface-high text-text-primary hover:bg-surface-highest'
                            : 'bg-brand-primary text-white hover:bg-[#0060d0]'
                        }`}
                      >
                        {isExpanded ? 'Cancel' : isConnected ? '···' : 'Connect'}
                      </button>
                    </div>
                  </div>

                  {/* Inline connect form */}
                  {isExpanded && (
                    <div className="px-3 pb-4 pt-3 border-t border-[rgba(65,71,84,0.1)] bg-surface">
                      {platform === 'google-calendar' && (
                        <div className="mb-3 p-2.5 bg-brand-primary/5 border border-blue-100 rounded-lg text-xs text-brand-primary">
                          First share your Google Calendar with our service account:<br />
                          <span className="font-mono font-semibold select-all">calendar@voicefly-ai.iam.gserviceaccount.com</span>
                        </div>
                      )}
                      <div className="space-y-3">
                        {def.fields.map(field => (
                          <div key={field.name}>
                            <label className="block text-xs font-medium text-text-primary mb-1">
                              {field.label}
                              {field.optional && <span className="text-text-muted font-normal"> (optional)</span>}
                            </label>
                            <input
                              type={field.type || 'text'}
                              value={connectFields[field.name] || ''}
                              onChange={e => setConnectFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 text-sm border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary"
                            />
                            {field.hint && <p className="text-xs text-text-secondary mt-1">{field.hint}</p>}
                          </div>
                        ))}
                      </div>
                      {connectError && (
                        <p className="text-xs text-[#ffb4ab] mt-2 flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0" />
                          {connectError}
                        </p>
                      )}
                      <div className="flex justify-end mt-3">
                        <button
                          type="button"
                          onClick={() => handleConnect(platform)}
                          disabled={
                            connecting ||
                            def.fields.filter(f => !f.optional).some(f => !connectFields[f.name]?.trim())
                          }
                          className="px-4 py-2 text-xs bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] disabled:opacity-50 transition-colors font-medium"
                        >
                          {connecting ? 'Connecting…' : syncing === platform ? 'Importing data…' : `Connect ${def.name}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// WIZARD DATA TYPE
// ============================================

interface WizardData {
  name: string
  jobType: string
  ownerRole: string
  tone: string
  voiceId: string
  voiceName: string
  voiceProvider: string
  voicePreviewUrl: string | null
  inputMode: 'website' | 'document' | 'text' | 'voice'
  businessDescription: string
  websiteUrl: string
  extractedFrom: string | null
  extractedData: any | null
  generatedConfig: any | null
  isGenerating: boolean
  generateError: string | null
  connectedIntegrations: string[]
  dataSource: { type: string; webhookUrl?: string; webhookSecret?: string } | null
}

// ============================================
// MAIN COMPONENT
// ============================================

function EmployeesDashboard() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [employees, setEmployees] = useState<PhoneEmployee[]>([])
  const [employeeStats, setEmployeeStats] = useState<Record<string, { totalCalls: number; lastCallAt: string | null }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    name: 'Maya',
    jobType: 'receptionist',
    ownerRole: 'general',
    tone: 'professional',
    voiceId: 'sarah',
    voiceName: 'Sarah',
    voiceProvider: '11labs',
    voicePreviewUrl: null,
    inputMode: 'website',
    businessDescription: '',
    websiteUrl: '',
    extractedFrom: null,
    extractedData: null,
    generatedConfig: null,
    isGenerating: false,
    generateError: null,
    connectedIntegrations: [],
    dataSource: null,
  })
  const [trialAssigning, setTrialAssigning] = useState(false)
  const [trialPhoneNumber, setTrialPhoneNumber] = useState<string | null>(null)
  const [trialJobType, setTrialJobType] = useState('receptionist')
  const [trialUsage, setTrialUsage] = useState<{
    callsUsed: number
    callsRemaining: number
    limitReached: boolean
    totalMinutes: number
    completedCalls: number
    appointmentsBooked: number
    messagesTaken: number
    daysRemaining: number
    isExpired: boolean
  } | null>(null)
  const [starterUsage, setStarterUsage] = useState<{
    creditsUsed: number
    creditsTotal: number
    minutesUsed: number
    minutesTotal: number
  } | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null)
  const [phoneStep, setPhoneStep] = useState<{
    status: 'idle' | 'choosing' | 'provisioning' | 'done' | 'error'
    wantsPhone: boolean
    phoneMode: 'vapi-only' | 'twilio-vapi'
    areaCode: string
    provisionedNumber: string | null
    error: string | null
  }>({ status: 'idle', wantsPhone: false, phoneMode: 'vapi-only', areaCode: '', provisionedNumber: null, error: null })


  useEffect(() => {
    loadData()
  }, [])

  const resetWizard = () => {
    setWizardStep(1)
    setWizardData({
      name: 'Maya',
      jobType: 'receptionist',
      ownerRole: 'general',
      tone: 'professional',
      voiceId: 'sarah',
      voiceName: 'Sarah',
      voiceProvider: '11labs',
      voicePreviewUrl: null,
      inputMode: 'website',
      businessDescription: '',
      websiteUrl: '',
      extractedFrom: null,
      extractedData: null,
      generatedConfig: null,
      isGenerating: false,
      generateError: null,
      connectedIntegrations: [],
      dataSource: null,
    })
    setCreating(false)
    setCreateError(null)
    setCreateSuccess(false)
    setPhoneStep({ status: 'idle', wantsPhone: false, phoneMode: 'vapi-only', areaCode: '', provisionedNumber: null, error: null })
    setCreatedEmployeeId(null)
  }

  const openWizard = () => {
    resetWizard()
    setShowCreateModal(true)
  }

  const closeWizard = () => {
    setShowCreateModal(false)
    resetWizard()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (redirectToLoginIfUnauthenticated()) return

      const businessId = getSecureBusinessId()
      if (!businessId) {
        setError('Authentication required')
        return
      }

      // Load business
      const businessData = await BusinessAPI.getBusiness(businessId)
      setBusiness(businessData)

      // Load employees
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees?businessId=${businessId}`, { headers })
      const data = await response.json()

      if (data.employees) {
        setEmployees(data.employees)

        // Fetch per-employee call stats
        const empIds = data.employees.map((e: PhoneEmployee) => e.id)
        if (empIds.length > 0) {
          const { data: callRows } = await supabase
            .from('employee_calls')
            .select('employee_id, started_at')
            .eq('business_id', businessId)
            .in('employee_id', empIds)
            .order('started_at', { ascending: false })

          const stats: Record<string, { totalCalls: number; lastCallAt: string | null }> = {}
          for (const id of empIds) {
            stats[id] = { totalCalls: 0, lastCallAt: null }
          }
          if (callRows) {
            for (const row of callRows) {
              if (!stats[row.employee_id]) {
                stats[row.employee_id] = { totalCalls: 0, lastCallAt: null }
              }
              stats[row.employee_id].totalCalls++
              if (!stats[row.employee_id].lastCallAt) {
                stats[row.employee_id].lastCallAt = row.started_at
              }
            }
          }
          setEmployeeStats(stats)
        }
      }

      // Fetch Starter credit usage (reuse already-fetched businessData)
      if (businessData?.subscription_status === 'active' && businessData?.subscription_tier === 'starter') {
        try {
          const creditData = businessData
          if (creditData) {
            const creditsTotal = creditData.monthly_credits || 500
            const creditsUsed = creditData.credits_used_this_month || 0
            setStarterUsage({
              creditsUsed,
              creditsTotal,
              minutesUsed: Math.floor(creditsUsed / 5),
              minutesTotal: Math.floor(creditsTotal / 5),
            })
          }
        } catch (e) {
          console.error('Failed to fetch starter usage:', e)
        }
      }

      // Check for trial phone number and fetch usage
      if (businessData?.subscription_status === 'trial') {
        if (data?.employees) {
          const trialEmp = data.employees.find((e: PhoneEmployee) => e.phoneNumber)
          if (trialEmp?.phoneNumber) {
            setTrialPhoneNumber(trialEmp.phoneNumber)
          }
        }

        // Fetch trial usage stats
        try {
          const usageHeaders = await getAuthHeaders()
          const usageRes = await fetch(`/api/trial/usage?businessId=${businessId}`, { headers: usageHeaders })
          const usageData = await usageRes.json()
          if (usageData.isTrial && usageData.usage) {
            setTrialUsage({
              ...usageData.usage,
              daysRemaining: usageData.trial.daysRemaining,
              isExpired: usageData.trial.isExpired,
            })
          }
        } catch (e) {
          console.error('Failed to fetch trial usage:', e)
        }
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const assignTrialPhone = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setTrialAssigning(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/trial/assign-phone', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId, jobType: trialJobType }),
      })
      const data = await response.json()
      if (response.ok && data.phoneNumber) {
        setTrialPhoneNumber(data.phoneNumber)
        // Reload to show the trial employee in the list
        await loadData()
      } else {
        console.error('Failed to assign trial phone:', data.error)
        setError(data.error || 'Failed to assign trial phone number')
      }
    } catch (err: any) {
      console.error('Trial phone assignment error:', err)
      setError(err.message)
    } finally {
      setTrialAssigning(false)
    }
  }

  const generateConfig = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setWizardData(prev => ({ ...prev, isGenerating: true, generateError: null }))

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/phone-employees/generate-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          businessDescription: wizardData.businessDescription,
          employeeName: wizardData.name,
          ...(wizardData.extractedData ? { extractedData: wizardData.extractedData } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate configuration')
      }

      // Merge business hours into the config for the editor
      const config = data.config || data
      if (!config.businessHours) {
        config.businessHours = { ...DEFAULT_BUSINESS_HOURS }
      }

      setWizardData(prev => ({
        ...prev,
        isGenerating: false,
        generatedConfig: config,
      }))
      setWizardStep(3)
    } catch (err: any) {
      console.error('Generate config error:', err)
      setWizardData(prev => ({
        ...prev,
        isGenerating: false,
        generateError: err.message || 'Failed to generate configuration. Please try again.',
      }))
    }
  }

  const createEmployee = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setCreating(true)
    setCreateError(null)

    try {
      const headers = await getAuthHeaders()

      // Build the config object to send, extracting schedule-related fields
      const { businessHours, timezone, afterHoursMessage, ...jobConfig } = wizardData.generatedConfig || {}

      const response = await fetch('/api/phone-employees', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          name: wizardData.name,
          voice: {
            provider: wizardData.voiceProvider || '11labs',
            voiceId: wizardData.voiceId || 'sarah',
            speed: 1.0,
            stability: 0.8,
          },
          personality: {
            tone: wizardData.tone,
            enthusiasm: wizardData.tone === 'casual' || wizardData.tone === 'friendly' ? 'high' : 'medium',
            formality: wizardData.tone === 'professional' || wizardData.tone === 'luxury' ? 'formal' : wizardData.tone === 'casual' ? 'casual' : 'semi-formal',
          },
          config: {
            ...jobConfig,
            type: wizardData.jobType,
            ...(wizardData.jobType === 'personal-assistant' && wizardData.ownerRole
              ? { ownerRole: wizardData.ownerRole }
              : {}),
          },
          schedule: businessHours ? {
            timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
            businessHours,
            afterHoursMessage: afterHoursMessage || undefined,
          } : undefined,
          provisionPhone: phoneStep.wantsPhone,
          phoneMode: phoneStep.wantsPhone ? phoneStep.phoneMode : undefined,
          areaCode: phoneStep.wantsPhone && phoneStep.areaCode ? phoneStep.areaCode : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmployees(prev => [data.employee, ...prev])
        setCreatedEmployeeId(data.employee.id)

        // Save data source config if one was selected
        if (wizardData.dataSource) {
          fetch(`/api/phone-employees/${data.employee.id}/data-source`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              businessId,
              ...wizardData.dataSource,
            }),
          }).catch(err => console.error('[wizard] Failed to save data source:', err))
        }

        // Update phone step with result
        if (data.employee.phoneNumber) {
          setPhoneStep(prev => ({ ...prev, status: 'done', provisionedNumber: data.employee.phoneNumber }))
        } else if (data.phoneError) {
          setPhoneStep(prev => ({ ...prev, status: 'error', error: data.phoneError }))
        }

        setCreateSuccess(true)
      } else {
        setCreateError(data.error || 'Failed to create employee')
      }
    } catch (err: any) {
      setCreateError(err.message || 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const provisionPhone = async () => {
    if (!createdEmployeeId) return
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setPhoneStep(prev => ({ ...prev, status: 'provisioning', error: null }))
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/phone-employees/${createdEmployeeId}/provision-phone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          phoneMode: phoneStep.phoneMode,
          areaCode: phoneStep.areaCode || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPhoneStep(prev => ({ ...prev, status: 'done', provisionedNumber: data.phoneNumber }))
        // Update employee in list
        setEmployees(prev => prev.map(e =>
          e.id === createdEmployeeId ? { ...e, phoneNumber: data.phoneNumber } : e
        ))
      } else {
        setPhoneStep(prev => ({ ...prev, status: 'error', error: data.error || 'Failed to provision phone number' }))
      }
    } catch (err: any) {
      setPhoneStep(prev => ({ ...prev, status: 'error', error: err.message }))
    }
  }

  const retryPhoneProvisioning = async (employee: PhoneEmployee) => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    // Optimistically update to provisioning state
    setEmployees(prev => prev.map(e =>
      e.id === employee.id ? { ...e, provisioningStatus: 'provisioning', provisioningError: null } : e
    ))

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/phone-employees/${employee.id}/provision-phone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          phoneMode: employee.phoneProvider || 'twilio-vapi',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEmployees(prev => prev.map(e =>
          e.id === employee.id
            ? { ...e, phoneNumber: data.phoneNumber, phoneProvider: data.phoneProvider, provisioningStatus: 'active', provisioningError: null }
            : e
        ))
      } else {
        setEmployees(prev => prev.map(e =>
          e.id === employee.id
            ? { ...e, provisioningStatus: 'failed', provisioningError: data.error || 'Failed to provision phone number' }
            : e
        ))
      }
    } catch (err: any) {
      setEmployees(prev => prev.map(e =>
        e.id === employee.id
          ? { ...e, provisioningStatus: 'failed', provisioningError: err.message }
          : e
      ))
    }
  }

  const toggleEmployeeStatus = async (employee: PhoneEmployee) => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees/${employee.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          businessId,
          isActive: !employee.isActive,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setEmployees(employees.map(e =>
          e.id === employee.id ? { ...e, isActive: !e.isActive } : e
        ))
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const deleteEmployee = async (employee: PhoneEmployee) => {
    if (!confirm(`Are you sure you want to delete ${employee.name}? This cannot be undone.`)) {
      return
    }

    const businessId = getSecureBusinessId()
    if (!businessId) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees/${employee.id}?businessId=${businessId}`, {
        method: 'DELETE',
        headers,
      })

      const data = await response.json()
      if (data.success) {
        setEmployees(employees.filter(e => e.id !== employee.id))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Wizard navigation
  const canGoNext = () => {
    switch (wizardStep) {
      case 1:
        return wizardData.name.trim() !== '' && wizardData.jobType !== ''
      case 2:
        return false // Step 2 advances via generate button
      case 3:
        return true  // Integrations are optional — always can proceed
      case 4:
        return true  // Data Sources are optional — always can proceed
      case 5:
        return wizardData.generatedConfig !== null
      case 6:
        return false // Step 6 creates via confirm button
      default:
        return false
    }
  }

  const goNext = () => {
    if (wizardStep < 6) {
      setWizardStep(wizardStep + 1)
    }
  }

  const goBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1)
    }
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-highest rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-surface-highest rounded-lg"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Dashboard &gt; Phone Employees</p>
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Phone Employees</h1>
            <p className="text-text-secondary mt-1">
              Manage your autonomous AI voice agents and monitor their active shifts across all departments.
            </p>
          </div>
          <button
            onClick={openWizard}
            className="inline-flex items-center px-5 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Employee
          </button>
        </div>

        {/* Stats Bar — Stitch Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Total Agents</p>
            <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{employees.length}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Active Now</p>
            <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{employees.filter(e => e.isActive).length.toString().padStart(2, '0')}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">With Phone</p>
            <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{employees.filter(e => e.phoneNumber).length}</p>
          </div>
          <div className="bg-surface-low p-6 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Total Calls</p>
            <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{Object.values(employeeStats).reduce((sum, s) => sum + s.totalCalls, 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Trial Banner */}
        {business?.subscription_status === 'trial' && (
          <div className="bg-accent/5 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <SparklesIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-900">Trial Mode</h3>
                  {trialUsage && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                      {trialUsage.daysRemaining} day{trialUsage.daysRemaining !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>
                <p className="text-sm text-yellow-800 mb-3">
                  Try your AI employee for free. Pick a role, activate, and start receiving calls.
                  Your AI can book appointments, take orders, and answer questions — all stored in your VoiceFly dashboard.
                </p>

                {/* Usage Meter */}
                {trialUsage && (
                  <div className="mb-4 p-3 bg-surface-low border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Calls Used</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {trialUsage.callsUsed} / 10
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          trialUsage.limitReached ? 'bg-[#93000a]/50' : trialUsage.callsUsed >= 7 ? 'bg-yellow-500' : 'bg-brand-primary'
                        }`}
                        style={{ width: `${Math.min(100, (trialUsage.callsUsed / 10) * 100)}%` }}
                      />
                    </div>
                    {trialUsage.limitReached && (
                      <p className="mt-2 text-xs text-[#ffb4ab] font-medium">
                        You&apos;ve used all 10 trial calls. Upgrade to continue receiving calls.
                      </p>
                    )}
                    {!trialUsage.limitReached && trialUsage.callsUsed >= 7 && (
                      <p className="mt-2 text-xs text-accent">
                        {trialUsage.callsRemaining} call{trialUsage.callsRemaining !== 1 ? 's' : ''} remaining — upgrade anytime for unlimited calls.
                      </p>
                    )}

                    {/* Value highlights */}
                    {(trialUsage.completedCalls > 0 || trialUsage.appointmentsBooked > 0 || trialUsage.messagesTaken > 0) && (
                      <div className="mt-3 pt-3 border-t border-yellow-100 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-text-primary">{trialUsage.completedCalls}</p>
                          <p className="text-xs text-text-secondary">Calls Handled</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-text-primary">{trialUsage.appointmentsBooked}</p>
                          <p className="text-xs text-text-secondary">Appointments</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-text-primary">{trialUsage.messagesTaken}</p>
                          <p className="text-xs text-text-secondary">Messages</p>
                        </div>
                      </div>
                    )}

                    {/* Upgrade hooks based on value */}
                    {trialUsage.appointmentsBooked > 0 && (
                      <p className="mt-2 text-xs text-brand-primary bg-brand-primary/5 px-2 py-1.5 rounded">
                        {trialUsage.appointmentsBooked} appointment{trialUsage.appointmentsBooked !== 1 ? 's' : ''} booked — connect Google Calendar to auto-sync with your schedule.
                      </p>
                    )}
                    {trialUsage.messagesTaken >= 3 && (
                      <p className="mt-2 text-xs text-brand-primary bg-brand-primary/5 px-2 py-1.5 rounded">
                        {trialUsage.messagesTaken} messages taken — upgrade to get SMS notifications and custom training.
                      </p>
                    )}
                    {trialUsage.totalMinutes >= 5 && !trialUsage.appointmentsBooked && !trialUsage.messagesTaken && (
                      <p className="mt-2 text-xs text-brand-primary bg-brand-primary/5 px-2 py-1.5 rounded">
                        {trialUsage.totalMinutes} minutes of calls handled — upgrade for a custom voice, dedicated number, and unlimited calls.
                      </p>
                    )}
                  </div>
                )}

                {trialPhoneNumber ? (
                  <div className="flex items-center text-sm text-yellow-900 bg-accent/10 px-3 py-2 rounded-lg inline-block mb-3">
                    <PhoneIcon className="h-4 w-4 mr-2 text-accent" />
                    <span className="font-medium">Trial Number:</span>
                    <span className="ml-1 font-mono">{trialPhoneNumber}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={trialJobType}
                      onChange={(e) => setTrialJobType(e.target.value)}
                      className="px-3 py-2 text-sm border border-yellow-300 bg-surface-low text-yellow-900 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="appointment-scheduler">Appointment Scheduler</option>
                      <option value="order-taker">Order Taker</option>
                      <option value="customer-service">Customer Service</option>
                      <option value="restaurant-host">Restaurant Host</option>
                      <option value="after-hours-emergency">After Hours</option>
                    </select>
                    <button
                      onClick={assignTrialPhone}
                      disabled={trialAssigning}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium bg-yellow-200 text-yellow-900 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                    >
                      {trialAssigning ? (
                        <>
                          <div className="h-4 w-4 mr-2 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          Activate Trial
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="text-xs text-accent">
                  Upgrade to Starter ($49/mo) for 60 minutes, a dedicated phone number, call transfers, and SMS notifications.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="ml-4 inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex-shrink-0"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Starter Banner */}
        {business?.subscription_status === 'active' && business?.subscription_tier === 'starter' && (
          <div className="mb-6 bg-brand-primary/5 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <SparklesIcon className="h-5 w-5 text-brand-primary mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Starter Plan</h3>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">Maya AI</span>
                </div>
                <p className="text-sm text-brand-primary mb-3">
                  Your AI receptionist Maya is answering calls with a standard script. Upgrade to Pro for custom training, voice, and FAQs.
                </p>

                {starterUsage && (
                  <div className="mb-3 p-3 bg-surface-low border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Minutes Used</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {starterUsage.minutesUsed} / {starterUsage.minutesTotal}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          starterUsage.minutesUsed >= starterUsage.minutesTotal ? 'bg-[#93000a]/50' :
                          starterUsage.minutesUsed >= starterUsage.minutesTotal * 0.8 ? 'bg-yellow-500' : 'bg-brand-primary'
                        }`}
                        style={{ width: `${Math.min(100, (starterUsage.minutesUsed / starterUsage.minutesTotal) * 100)}%` }}
                      />
                    </div>
                    {starterUsage.minutesUsed >= starterUsage.minutesTotal && (
                      <p className="mt-2 text-xs text-[#ffb4ab] font-medium">
                        You&apos;ve used all included minutes. Overage at $0.25/min or upgrade to Growth ($129/mo) for 250 min.
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-brand-primary">
                  Upgrade to Pro ($249/mo) for custom AI training, voice customization, calendar integrations, and 750 minutes/month.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="ml-4 inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors text-sm font-medium flex-shrink-0"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        {/* Employee Grid — Stitch Card Style */}
        {employees.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-surface-lowest rounded-3xl p-12 max-w-lg mx-auto relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-brand-primary/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <UserCircleIcon className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)] mb-2">No employees yet</h3>
                <p className="text-text-secondary mb-6">
                  Hire your first AI phone employee to start handling calls automatically.
                </p>
                <button
                  onClick={openWizard}
                  className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] font-medium"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add your first employee
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(employee => {
              const jobInfo = JOB_TYPE_INFO[employee.jobType] || JOB_TYPE_INFO['receptionist']
              const Icon = jobInfo.icon
              const stats = employeeStats[employee.id]

              return (
                <div
                  key={employee.id}
                  className="bg-surface-low rounded-2xl overflow-hidden hover:bg-surface-med transition-all duration-300 group cursor-pointer"
                  onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-brand-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary font-[family-name:var(--font-manrope)]">{employee.name}</h3>
                          <span className="text-xs text-text-muted">{jobInfo.label}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        employee.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-surface-high text-text-muted'
                      }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Phone Number */}
                    {employee.provisioningStatus === 'active' && employee.phoneNumber ? (
                      <div className="text-sm font-mono text-text-secondary mb-3">
                        Phone Number {employee.phoneNumber}
                      </div>
                    ) : employee.provisioningStatus === 'provisioning' ? (
                      <div className="flex items-center text-sm text-brand-primary mb-3">
                        <div className="h-3 w-3 mr-2 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        Setting up phone...
                      </div>
                    ) : employee.provisioningStatus === 'failed' ? (
                      <div className="flex items-center justify-between text-xs text-[#ffb4ab] bg-[#93000a]/5 px-2 py-1.5 rounded-lg mb-3">
                        <div className="flex items-center min-w-0">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{friendlyProvisioningError(employee.provisioningError)}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); retryPhoneProvisioning(employee) }}
                          className="ml-2 px-2 py-0.5 text-xs font-medium hover:bg-[#93000a]/10 rounded transition-colors flex-shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    ) : employee.phoneNumber ? (
                      <div className="text-sm font-mono text-text-muted mb-3">{employee.phoneNumber}</div>
                    ) : null}

                    {/* Stats row */}
                    <div className="text-xs text-text-muted">
                      Last Call &middot; {stats?.lastCallAt
                        ? formatDistanceToNow(new Date(stats.lastCallAt), { addSuffix: true })
                        : 'No calls yet'}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-surface-lowest/50 flex items-center justify-between">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employees/${employee.id}`) }}
                      className="text-sm font-medium text-brand-light hover:text-brand-primary transition-colors"
                    >
                      Edit Agent
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleEmployeeStatus(employee) }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          employee.isActive ? 'text-accent hover:bg-accent/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={employee.isActive ? 'Pause' : 'Activate'}
                      >
                        {employee.isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEmployee(employee) }}
                        className="p-1.5 text-text-muted hover:text-[#ffb4ab] hover:bg-[#93000a]/5 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Employee Wizard Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className={`bg-surface-low rounded-xl p-6 w-full mx-4 max-h-[90vh] overflow-y-auto transition-all ${
                wizardStep >= 3 || (wizardStep === 2 && (wizardData.inputMode === 'voice' || wizardData.inputMode === 'document')) ? 'max-w-2xl' : 'max-w-md'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Hire New Employee</h2>
                <button
                  onClick={closeWizard}
                  className="p-1 text-text-muted hover:text-text-secondary transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <StepIndicator currentStep={wizardStep} totalSteps={6} />

              {/* Step Content */}
              {wizardStep === 1 && (
                <WizardStep1 wizardData={wizardData} setWizardData={setWizardData} />
              )}
              {wizardStep === 2 && (
                <WizardStep2
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  onGenerate={generateConfig}
                />
              )}
              {wizardStep === 3 && (
                <WizardStepIntegrations
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  businessId={business?.id || ''}
                />
              )}
              {wizardStep === 4 && (
                <WizardStepDataSources
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  businessId={business?.id || ''}
                />
              )}
              {wizardStep === 5 && (
                <WizardStep3 wizardData={wizardData} setWizardData={setWizardData} />
              )}
              {wizardStep === 6 && (
                <WizardStep4
                  wizardData={wizardData}
                  isCreating={creating}
                  createError={createError}
                  createSuccess={createSuccess}
                  onConfirm={createEmployee}
                  phoneStep={phoneStep}
                  setPhoneStep={setPhoneStep}
                  onProvisionPhone={provisionPhone}
                  isTrial={business?.subscription_status === 'trial'}
                  createdEmployeeId={createdEmployeeId}
                  onTrainEmployee={createdEmployeeId ? () => {
                    closeWizard()
                    router.push(`/dashboard/employees/${createdEmployeeId}`)
                  } : undefined}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-[rgba(65,71,84,0.15)]">
                {/* Left side: Back or Cancel */}
                <div>
                  {wizardStep > 1 && !createSuccess ? (
                    <button
                      onClick={goBack}
                      disabled={wizardData.isGenerating || creating}
                      className="inline-flex items-center px-4 py-2 text-text-primary hover:bg-surface-high rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Back
                    </button>
                  ) : (
                    <button
                      onClick={closeWizard}
                      className="px-4 py-2 text-text-primary hover:bg-surface-high rounded-lg transition-colors"
                    >
                      {createSuccess ? 'Done' : 'Cancel'}
                    </button>
                  )}
                </div>

                {/* Right side: Next (only for steps 1 and 3) */}
                <div>
                  {createSuccess && (
                    <button
                      onClick={closeWizard}
                      className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors"
                    >
                      Done
                    </button>
                  )}
                  {wizardStep === 1 && (
                    <button
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] disabled:opacity-50 transition-colors"
                    >
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                  {wizardStep === 3 && (
                    <button
                      onClick={goNext}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors"
                    >
                      Continue
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                  {wizardStep === 4 && (
                    <button
                      onClick={goNext}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors"
                    >
                      Continue
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                  {wizardStep === 5 && (
                    <button
                      onClick={goNext}
                      className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors"
                    >
                      Review & Create
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function ProtectedEmployeesDashboard() {
  return (
    <ProtectedRoute>
      <EmployeesDashboard />
    </ProtectedRoute>
  )
}
