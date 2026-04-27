'use client'

/**
 * Insurance Verifications Queue
 *
 * Staff workflow:
 *   1. AI captured insurance info during a call → record appears here as "pending"
 *   2. Staff calls the carrier to verify coverage
 *   3. Staff opens the record, fills in coverage details + estimated cost,
 *      changes status to verified/denied/needs_more_info
 *   4. On status change, the patient gets an SMS automatically (if SMS enabled)
 *
 * Urgency badges (computed from days until linked appointment):
 *   - Red:    appt is today or tomorrow → verify immediately
 *   - Yellow: appt is 2-5 days out      → verify soon
 *   - Green:  appt is 6+ days out       → no rush
 *   - Gray:   no appointment linked     → needs more context
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '@/lib/multi-tenant-auth'
import { BusinessAPI, type Business } from '@/lib/supabase'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type Status = 'pending' | 'verified' | 'denied' | 'needs_more_info' | 'archived'

interface AppointmentLink {
  id: string
  customer_name: string
  appointment_date: string
  appointment_time?: string
  service?: string
  status?: string
}

interface InsuranceRecord {
  id: string
  business_id: string
  appointment_id: string | null
  call_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_dob: string | null
  carrier_name: string
  member_id: string
  group_number: string | null
  subscriber_name: string | null
  subscriber_relationship: string | null
  subscriber_dob: string | null
  procedure_inquired: string | null
  status: Status
  verified_at: string | null
  coverage_notes: string | null
  estimated_patient_responsibility: number | null
  estimated_insurance_pays: number | null
  patient_notified_at: string | null
  patient_notification_status: string | null
  created_at: string
  updated_at: string
  appointment?: AppointmentLink | null
}

type Urgency = 'red' | 'yellow' | 'green' | 'no_appointment'

function computeUrgency(record: InsuranceRecord): Urgency {
  if (!record.appointment) return 'no_appointment'
  const appt = new Date(record.appointment.appointment_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.floor((appt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil <= 1) return 'red'
  if (daysUntil <= 5) return 'yellow'
  return 'green'
}

const URGENCY_RANK: Record<Urgency, number> = { red: 0, yellow: 1, green: 2, no_appointment: 3 }

function urgencyBadge(urgency: Urgency, appt?: AppointmentLink | null) {
  if (urgency === 'red') {
    const isToday = appt && new Date(appt.appointment_date).toDateString() === new Date().toDateString()
    return { label: isToday ? 'Verify TODAY' : 'Verify by tomorrow', cls: 'bg-red-500/15 text-red-500 border-red-500/30' }
  }
  if (urgency === 'yellow') return { label: `Verify by ${formatShortDate(appt?.appointment_date)}`, cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30' }
  if (urgency === 'green') return { label: 'Not urgent', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
  return { label: 'No appointment linked', cls: 'bg-surface-high text-text-muted border-[rgba(65,71,84,0.15)]' }
}

function formatShortDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(time?: string) {
  if (!time) return ''
  return time.slice(0, 5)
}

export default function InsuranceVerificationsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [records, setRecords] = useState<InsuranceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<Status>('pending')
  const [selected, setSelected] = useState<InsuranceRecord | null>(null)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }, [])

  const loadRecords = useCallback(async (bid: string, status?: Status) => {
    const headers = await getAuthHeaders()
    const url = `/api/insurance-records?businessId=${bid}${status ? `&status=${status}` : ''}`
    const res = await fetch(url, { headers })
    const data = await res.json()
    if (res.ok) setRecords(data.records || [])
  }, [getAuthHeaders])

  useEffect(() => {
    const init = async () => {
      if (redirectToLoginIfUnauthenticated()) return
      const bid = getSecureBusinessId()
      if (!bid) { setLoading(false); return }
      const biz = await BusinessAPI.getBusiness(bid)
      setBusiness(biz)
      await loadRecords(bid, activeStatus)
      setLoading(false)
    }
    init()
  }, [loadRecords, activeStatus])

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const ua = computeUrgency(a)
      const ub = computeUrgency(b)
      if (URGENCY_RANK[ua] !== URGENCY_RANK[ub]) return URGENCY_RANK[ua] - URGENCY_RANK[ub]
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [records])

  const counts = useMemo(() => {
    const c = { pending: 0, verified: 0, denied: 0, needs_more_info: 0 }
    for (const r of records) {
      if (r.status in c) (c as any)[r.status]++
    }
    return c
  }, [records])

  const handleRecordUpdated = (updated: InsuranceRecord) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
    setSelected(null)
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

  return (
    <Layout business={business || undefined}>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-7 w-7 text-brand-primary" />
            <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">Insurance Verifications</h1>
          </div>
        </div>
        <p className="text-text-secondary mb-8">
          Records captured by your AI during calls — verify coverage with the carrier, then update the record. Patient gets an SMS automatically.
        </p>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-surface-low rounded-full p-1 w-fit mb-6">
          {([
            { id: 'pending', label: 'Pending', count: counts.pending, icon: ClockIcon },
            { id: 'verified', label: 'Verified', count: counts.verified, icon: CheckCircleIcon },
            { id: 'denied', label: 'Denied', count: counts.denied, icon: XCircleIcon },
            { id: 'needs_more_info', label: 'More info', count: counts.needs_more_info, icon: ExclamationCircleIcon },
          ] as { id: Status; label: string; count: number; icon: any }[]).map(tab => {
            const Icon = tab.icon
            const active = activeStatus === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active ? 'bg-brand-primary text-brand-on' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeStatus === tab.id && tab.count > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-on/20 text-xs font-medium">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Records list */}
        {sortedRecords.length === 0 ? (
          <div className="bg-surface-low rounded-xl p-12 text-center">
            <ShieldCheckIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">
              {activeStatus === 'pending' ? 'No pending verifications' : `No ${activeStatus.replace('_', ' ')} records`}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {activeStatus === 'pending'
                ? 'When your AI captures insurance info during a call, it will appear here.'
                : 'Records will show here once their status changes.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sortedRecords.map(record => {
              const urgency = computeUrgency(record)
              const badge = urgencyBadge(urgency, record.appointment)
              const apt = record.appointment
              return (
                <li
                  key={record.id}
                  className={`bg-surface-low rounded-xl p-5 border-l-4 cursor-pointer hover:bg-surface-med transition-colors ${
                    urgency === 'red' ? 'border-red-500'
                    : urgency === 'yellow' ? 'border-amber-500'
                    : urgency === 'green' ? 'border-emerald-500'
                    : 'border-text-muted/30'
                  }`}
                  onClick={() => setSelected(record)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-text-primary truncate">
                          {record.customer_name || 'Unknown caller'}
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {record.carrier_name} · <span className="font-mono text-xs">#{record.member_id}</span>
                        {record.group_number && <span className="text-text-muted"> · Group {record.group_number}</span>}
                      </p>
                      {record.procedure_inquired && (
                        <p className="text-xs text-text-muted mt-1">
                          For: {record.procedure_inquired}
                          {apt && (
                            <span> · Appt: {formatShortDate(apt.appointment_date)}{apt.appointment_time && ` at ${formatTime(apt.appointment_time)}`}</span>
                          )}
                        </p>
                      )}
                      {!record.procedure_inquired && apt && (
                        <p className="text-xs text-text-muted mt-1">
                          Appt: {formatShortDate(apt.appointment_date)}{apt.appointment_time && ` at ${formatTime(apt.appointment_time)}`}
                          {apt.service && ` · ${apt.service}`}
                        </p>
                      )}
                      {record.status !== 'pending' && record.patient_notification_status && (
                        <p className="text-xs mt-2">
                          {record.patient_notification_status === 'sent' ? (
                            <span className="text-emerald-500">✓ Patient notified by SMS</span>
                          ) : record.patient_notification_status === 'blocked_no_sms' ? (
                            <span className="text-amber-500">⚠ SMS not active — call patient manually</span>
                          ) : record.patient_notification_status === 'blocked_quota' ? (
                            <span className="text-amber-500">⚠ SMS quota exceeded — call patient manually</span>
                          ) : record.patient_notification_status === 'no_phone' ? (
                            <span className="text-text-muted">⚠ No callback phone — please call manually</span>
                          ) : (
                            <span className="text-amber-500">⚠ SMS failed — call patient manually</span>
                          )}
                        </p>
                      )}
                    </div>
                    {record.customer_phone && (
                      <a
                        href={`tel:${record.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-brand-light hover:text-brand-primary"
                      >
                        <PhoneIcon className="h-3.5 w-3.5" />
                        {record.customer_phone}
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Verify modal */}
      {selected && (
        <VerifyModal
          record={selected}
          getAuthHeaders={getAuthHeaders}
          onClose={() => setSelected(null)}
          onUpdated={handleRecordUpdated}
        />
      )}
    </Layout>
  )
}

// ─── Verify Modal ───────────────────────────────────────────────────────────

function VerifyModal({
  record,
  getAuthHeaders,
  onClose,
  onUpdated,
}: {
  record: InsuranceRecord
  getAuthHeaders: () => Promise<Record<string, string>>
  onClose: () => void
  onUpdated: (r: InsuranceRecord) => void
}) {
  const [status, setStatus] = useState<Status>(record.status)
  const [coverageNotes, setCoverageNotes] = useState(record.coverage_notes || '')
  const [patientCost, setPatientCost] = useState<string>(
    record.estimated_patient_responsibility?.toString() || ''
  )
  const [insurancePays, setInsurancePays] = useState<string>(
    record.estimated_insurance_pays?.toString() || ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ sent: boolean; reason?: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' }
      const res = await fetch(`/api/insurance-records/${record.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          coverage_notes: coverageNotes || null,
          estimated_patient_responsibility: patientCost ? parseFloat(patientCost) : null,
          estimated_insurance_pays: insurancePays ? parseFloat(insurancePays) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setNotification(data.notification)
      // Brief delay so the user sees the SMS-sent confirmation
      setTimeout(() => onUpdated(data.record), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[rgba(65,71,84,0.15)] flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">
              {record.customer_name || 'Unknown caller'}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Captured {new Date(record.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Captured info */}
          <div className="bg-surface-low rounded-lg p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Carrier" value={record.carrier_name} />
              <Field label="Member ID" value={record.member_id} mono />
              {record.group_number && <Field label="Group" value={record.group_number} mono />}
              {record.subscriber_name && <Field label="Subscriber" value={`${record.subscriber_name}${record.subscriber_relationship ? ` (${record.subscriber_relationship})` : ''}`} />}
              {record.customer_phone && <Field label="Callback" value={record.customer_phone} />}
              {record.customer_dob && <Field label="DOB" value={record.customer_dob} />}
              {record.procedure_inquired && <Field label="Procedure" value={record.procedure_inquired} />}
              {record.appointment && (
                <Field label="Appointment" value={`${formatShortDate(record.appointment.appointment_date)}${record.appointment.appointment_time ? ` at ${formatTime(record.appointment.appointment_time)}` : ''}`} />
              )}
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              After verifying with carrier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'verified', label: 'Verified', icon: CheckCircleIcon, color: 'emerald' },
                { id: 'denied', label: 'Denied', icon: XCircleIcon, color: 'red' },
                { id: 'needs_more_info', label: 'More info', icon: ExclamationCircleIcon, color: 'amber' },
              ] as { id: Status; label: string; icon: any; color: string }[]).map(opt => {
                const Icon = opt.icon
                const active = status === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setStatus(opt.id)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? `bg-${opt.color}-500/10 text-${opt.color}-500 border-${opt.color}-500/30`
                        : 'bg-surface-low text-text-secondary border-transparent hover:bg-surface-med'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cost estimates (only if verified) */}
          {status === 'verified' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-text-secondary mb-1 block">Patient cost ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={patientCost}
                  onChange={e => setPatientCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-text-secondary mb-1 block">Insurance pays ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={insurancePays}
                  onChange={e => setInsurancePays(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm"
                />
              </label>
            </div>
          )}

          {/* Coverage notes */}
          <label className="block">
            <span className="text-xs font-medium text-text-secondary mb-1 block">Coverage notes (internal)</span>
            <textarea
              value={coverageNotes}
              onChange={e => setCoverageNotes(e.target.value)}
              placeholder="e.g. Cleaning covered 100%, X-rays 80%, deductible met for the year"
              rows={3}
              className="w-full px-3 py-2 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none text-sm resize-none"
            />
          </label>

          {/* SMS preview */}
          {status !== 'pending' && status !== 'archived' && record.customer_phone && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-text-primary mb-1">Patient will receive SMS:</p>
              <p className="text-text-secondary italic text-xs leading-relaxed">
                {smsPreview(status, record, patientCost)}
              </p>
              <p className="text-xs text-text-muted mt-2">
                Sent automatically when you save (counts against your monthly SMS quota).
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {notification && (
            <div className={`rounded-lg p-3 text-sm ${
              notification.sent
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
            }`}>
              {notification.sent
                ? '✓ Patient notified by SMS'
                : notification.reason === 'blocked_no_sms'
                  ? 'Saved. SMS not active for this business — please call the patient manually.'
                  : notification.reason === 'blocked_quota'
                    ? 'Saved. SMS quota exceeded — please call the patient manually.'
                    : notification.reason === 'no_phone'
                      ? 'Saved. No callback phone on file — please call the patient manually.'
                      : 'Saved. SMS failed to send — please call the patient manually.'}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[rgba(65,71,84,0.15)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || status === record.status && coverageNotes === (record.coverage_notes || '')}
            className="px-5 py-2 bg-brand-primary hover:bg-[#0060d0] text-brand-on text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & notify patient'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function smsPreview(status: Status, record: InsuranceRecord, patientCost: string): string {
  const customerFirst = (record.customer_name || '').split(' ')[0] || 'there'
  const apt = record.appointment
  const apptInfo = apt
    ? ` for your appointment ${formatShortDate(apt.appointment_date)}${apt.appointment_time ? ` at ${formatTime(apt.appointment_time)}` : ''}`
    : ''
  const costInfo = patientCost ? ` Estimated cost: $${patientCost} out of pocket.` : ''

  if (status === 'verified') {
    return `Hi ${customerFirst}, your ${record.carrier_name} coverage is confirmed${apptInfo}.${costInfo} Reply STOP to opt out. — [your business]`
  }
  if (status === 'denied') {
    return `Hi ${customerFirst}, we weren't able to verify your ${record.carrier_name} coverage. Please call us so we can help. Reply STOP to opt out. — [your business]`
  }
  return `Hi ${customerFirst}, we need a bit more info to verify your ${record.carrier_name} coverage. Please call us when you have a moment. Reply STOP to opt out. — [your business]`
}
