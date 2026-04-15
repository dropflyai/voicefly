'use client'

import { useEffect, useState, useCallback } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '@/lib/multi-tenant-auth'
import { BusinessAPI, type Business } from '@/lib/supabase'
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

type RegistrationStatus =
  | 'draft'
  | 'customer_profile_pending'
  | 'customer_profile_approved'
  | 'customer_profile_rejected'
  | 'brand_pending'
  | 'brand_approved'
  | 'brand_rejected'
  | 'campaign_pending'
  | 'campaign_approved'
  | 'campaign_rejected'
  | 'active'

interface Registration {
  id: string
  status: RegistrationStatus
  business_legal_info: any
  failure_reason: string | null
  failure_field: string | null
  created_at: string
  submitted_at: string | null
  brand_approved_at: string | null
  campaign_approved_at: string | null
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const INDUSTRIES = [
  'HEALTHCARE', 'TECHNOLOGY', 'RETAIL', 'REAL_ESTATE', 'PROFESSIONAL_SERVICES',
  'EDUCATION', 'FINANCE', 'HOSPITALITY', 'MANUFACTURING', 'AGRICULTURE',
  'ENERGY', 'GOVERNMENT', 'INSURANCE', 'MEDIA_AND_ENTERTAINMENT', 'NON_PROFIT',
  'POLITICAL', 'TELECOMMUNICATIONS', 'TRANSPORTATION', 'OTHER',
]

const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Corporation',
  'Co-operative',
  'Limited Liability Corporation',
  'Non-profit Corporation',
]

const JOB_POSITIONS = [
  'Director', 'GM', 'VP', 'CEO', 'CFO', 'General Counsel', 'Other',
]

export default function SmsSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    legal_name: '',
    ein: '',
    business_type: 'Limited Liability Corporation',
    business_registration_identifier: 'EIN',
    industry: 'PROFESSIONAL_SERVICES',
    website: '',
    regions_of_operation: ['USA_AND_CANADA'],
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'US',
    phone: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    contact_title: '',
    contact_job_position: 'Director',
  })

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }, [])

  const loadStatus = useCallback(async (bid: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/sms-registration/status?businessId=${bid}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setRegistration(data.registration)
        if (data.registration?.business_legal_info) {
          setForm(f => ({ ...f, ...data.registration.business_legal_info }))
        }
      }
    } catch (err) {
      console.error('Failed to load SMS registration', err)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    const init = async () => {
      if (redirectToLoginIfUnauthenticated()) return
      const bid = getSecureBusinessId()
      if (!bid) { setError('Authentication required'); setLoading(false); return }

      const biz = await BusinessAPI.getBusiness(bid)
      setBusiness(biz)

      // Prefill form with what we know about the business (from signup + onboarding)
      const b = biz as any
      setForm(f => ({
        ...f,
        legal_name: f.legal_name || biz?.name || '',
        phone: f.phone || biz?.phone || '',
        website: f.website || b?.website || '',
        address_street: f.address_street || b?.address_line1 || '',
        address_city: f.address_city || b?.city || '',
        address_state: f.address_state || b?.state || '',
        address_zip: f.address_zip || b?.postal_code || '',
      }))

      await loadStatus(bid)
      setLoading(false)
    }
    init()
  }, [loadStatus])

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const bid = getSecureBusinessId()
      if (!bid) throw new Error('Authentication required')
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch('/api/sms-registration/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId: bid, info: form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start registration')
      setRegistration(data.registration)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAdvance = async () => {
    setPolling(true)
    try {
      const bid = getSecureBusinessId()
      if (!bid) return
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch('/api/sms-registration/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId: bid }),
      })
      const data = await res.json()
      if (res.ok) setRegistration(data.registration)
      else setError(data.error)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPolling(false)
    }
  }

  if (loading) {
    return (
      <Layout business={business || undefined}>
        <div className="p-8">
          <div className="h-6 w-48 bg-surface-high rounded animate-pulse mb-4" />
          <div className="h-40 bg-surface-low rounded-xl animate-pulse" />
        </div>
      </Layout>
    )
  }

  const isActive = registration?.status === 'active'
  const isInReview = registration && ['customer_profile_pending', 'customer_profile_approved', 'brand_pending', 'brand_approved', 'campaign_pending'].includes(registration.status)
  const isRejected = registration && ['customer_profile_rejected', 'brand_rejected', 'campaign_rejected'].includes(registration.status)
  const showForm = !registration || registration.status === 'draft' || isRejected

  return (
    <Layout business={business || undefined}>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <ChatBubbleLeftRightIcon className="h-7 w-7 text-brand-primary" />
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">SMS Registration</h1>
        </div>
        <p className="text-text-secondary mb-8">
          Enable SMS for your business. We handle the A2P 10DLC registration with US carriers — no Twilio account needed.
        </p>

        {isActive && (
          <>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-500">SMS is live</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Your business is registered and your AI can send SMS to customers. Approved {registration.campaign_approved_at && new Date(registration.campaign_approved_at).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>

            <TestSendCard businessId={getSecureBusinessId() || ''} />
          </>
        )}

        {isInReview && (
          <StatusTimeline registration={registration} onRefresh={handleAdvance} polling={polling} />
        )}

        {isRejected && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-accent">Registration was not approved</p>
                {registration?.failure_reason && (
                  <p className="text-sm text-text-secondary mt-1">{registration.failure_reason}</p>
                )}
                {registration?.failure_field && (
                  <p className="text-xs text-text-muted mt-1">Rejected field: {registration.failure_field}</p>
                )}
                <p className="text-sm text-text-secondary mt-3">
                  Update your business info below and resubmit. A new brand registration fee (~$4) will apply on resubmission.
                </p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <IntakeForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
            isRetry={!!isRejected}
          />
        )}
      </div>
    </Layout>
  )
}

// ─── Status Timeline ────────────────────────────────────────────────────────

function StatusTimeline({
  registration,
  onRefresh,
  polling,
}: {
  registration: Registration
  onRefresh: () => void
  polling: boolean
}) {
  const steps = [
    { key: 'customer_profile', label: 'Business identity verified', weight: 1 },
    { key: 'brand', label: 'Brand registered with carriers', weight: 2 },
    { key: 'campaign', label: 'Campaign approved — SMS live', weight: 3 },
  ]

  let currentStep = 0
  if (registration.status === 'customer_profile_pending') currentStep = 0
  else if (['customer_profile_approved', 'brand_pending'].includes(registration.status)) currentStep = 1
  else if (['brand_approved', 'campaign_pending'].includes(registration.status)) currentStep = 2
  else if (registration.status === 'active') currentStep = 3

  return (
    <div className="bg-surface-low rounded-xl p-6 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="font-semibold text-text-primary">Registration in progress</p>
          <p className="text-sm text-text-secondary mt-1">
            Typical timeline: 1-2 days for identity verification, 2-3 weeks for carrier campaign approval.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={polling}
          className="text-sm text-brand-light hover:text-brand-primary flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${polling ? 'animate-spin' : ''}`} />
          {polling ? 'Checking...' : 'Check status'}
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const isDone = currentStep > i
          const isCurrent = currentStep === i
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-brand-primary text-brand-on' : 'bg-surface-high text-text-muted'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDone || isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-text-muted mt-0.5">In progress with Twilio / carriers</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Intake Form ────────────────────────────────────────────────────────────

function IntakeForm({
  form, setForm, onSubmit, saving, error, isRetry,
}: {
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
  onSubmit: () => void
  saving: boolean
  error: string | null
  isRetry: boolean
}) {
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="bg-surface-low rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Business identity</h2>
        <p className="text-sm text-text-muted">
          Required by US carriers (AT&amp;T, T-Mobile, Verizon) to verify your business is legitimate. This info is sent to Twilio and the Campaign Registry — nothing you enter is shared with us beyond what&apos;s needed to register.
        </p>
      </div>

      <Section title="Legal business info">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Legal business name" value={form.legal_name} onChange={update('legal_name')} required />
          <Field label="EIN (9 digits, no dashes)" value={form.ein} onChange={update('ein')} required maxLength={9} placeholder="123456789" />
          <SelectField label="Business type" value={form.business_type} onChange={update('business_type')} options={BUSINESS_TYPES.map(b => ({ value: b, label: b }))} />
          <SelectField label="Industry" value={form.industry} onChange={update('industry')} options={INDUSTRIES.map(i => ({ value: i, label: i.replace(/_/g, ' ') }))} />
          <Field label="Website" value={form.website} onChange={update('website')} type="url" required placeholder="https://example.com" />
          <Field label="Business phone" value={form.phone} onChange={update('phone')} type="tel" required placeholder="+14155551234" />
        </div>
      </Section>

      <Section title="Business address">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Street" value={form.address_street} onChange={update('address_street')} required className="sm:col-span-2" />
          <Field label="City" value={form.address_city} onChange={update('address_city')} required />
          <SelectField label="State" value={form.address_state} onChange={update('address_state')} options={[{ value: '', label: 'Select…' }, ...US_STATES.map(s => ({ value: s, label: s }))]} />
          <Field label="ZIP code" value={form.address_zip} onChange={update('address_zip')} required />
          <Field label="Country" value={form.address_country} onChange={update('address_country')} readOnly />
        </div>
      </Section>

      <Section title="Authorized representative">
        <p className="text-xs text-text-muted mb-4">
          Must be an officer, owner, or authorized employee. Carriers may contact this person to verify the registration.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" value={form.contact_first_name} onChange={update('contact_first_name')} required />
          <Field label="Last name" value={form.contact_last_name} onChange={update('contact_last_name')} required />
          <Field label="Email" value={form.contact_email} onChange={update('contact_email')} type="email" required />
          <Field label="Phone (E.164, e.g. +14155551234)" value={form.contact_phone} onChange={update('contact_phone')} type="tel" required />
          <Field label="Job title" value={form.contact_title} onChange={update('contact_title')} required placeholder="Owner" />
          <SelectField label="Job position" value={form.contact_job_position} onChange={update('contact_job_position')} options={JOB_POSITIONS.map(p => ({ value: p, label: p }))} />
        </div>
      </Section>

      {error && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-text-muted max-w-md">
          By submitting, you authorize VoiceFly to register your business with US wireless carriers via The Campaign Registry. Registration fees are included in your plan.
        </p>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="bg-brand-primary hover:bg-[#0060d0] text-brand-on font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Submitting…' : isRetry ? 'Resubmit' : 'Submit for registration'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', required, placeholder, maxLength, readOnly, className,
}: any) {
  return (
    <label className={`block ${className || ''}`}>
      <span className="text-xs font-medium text-text-secondary mb-1 block">{label}{required && <span className="text-accent ml-0.5">*</span>}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        className={`w-full px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm ${readOnly ? 'opacity-50' : ''}`}
      />
    </label>
  )
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: any
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-secondary mb-1 block">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// ─── Test Send Card ─────────────────────────────────────────────────────────

function TestSendCard({ businessId }: { businessId: string }) {
  const [toPhone, setToPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; from?: string } | null>(null)

  const send = async () => {
    if (!toPhone.trim() || !businessId) return
    setSending(true)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      }
      const res = await fetch('/api/sms-registration/test-send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId, toPhone }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: `Sent from ${data.from} to ${data.to}. Check your phone.`, from: data.from })
      } else {
        setResult({ ok: false, message: data.error || 'Send failed' })
      }
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Send failed' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-surface-low rounded-xl p-6 mb-6">
      <h3 className="font-semibold text-text-primary mb-1">Send a test SMS</h3>
      <p className="text-sm text-text-muted mb-4">
        Verify SMS is working by sending a one-time test to your phone. Counts against your monthly quota.
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={toPhone}
          onChange={e => setToPhone(e.target.value)}
          placeholder="+14155551234"
          className="flex-1 px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm"
        />
        <button
          onClick={send}
          disabled={!toPhone.trim() || sending}
          className="bg-brand-primary hover:bg-[#0060d0] text-brand-on font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          {sending ? 'Sending…' : 'Send test'}
        </button>
      </div>
      {result && (
        <p className={`text-sm mt-3 ${result.ok ? 'text-green-500' : 'text-accent'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
