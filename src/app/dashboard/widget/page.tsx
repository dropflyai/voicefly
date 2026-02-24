'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { getSecureBusinessId } from '../../../lib/multi-tenant-auth'
import { supabase } from '../../../lib/supabase-client'
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PaintBrushIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

interface WidgetConfig {
  primaryColor: string
  position: string
  displayName: string
  logoUrl: string
  welcomeMessage: string
  quickReplies: string[]
  autoPopDelay: number
  showOnMobile: boolean
  leadCapture: boolean
  bookingEnabled: boolean
  voiceEscalationEnabled: boolean
  hideBranding: boolean
}

interface PhoneEmployee {
  id: string
  name: string
  job_type: string
  is_active: boolean
  widget_token: string | null
  widget_config: Partial<WidgetConfig> | null
}

const DEFAULT_CONFIG: WidgetConfig = {
  primaryColor: '#6366f1',
  position: 'bottom-right',
  displayName: '',
  logoUrl: '',
  welcomeMessage: 'Hi! How can I help you today?',
  quickReplies: [],
  autoPopDelay: 0,
  showOnMobile: true,
  leadCapture: false,
  bookingEnabled: false,
  voiceEscalationEnabled: false,
  hideBranding: false,
}

const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left']

function WidgetSettingsPanel({
  employee,
  onSaved,
}: {
  employee: PhoneEmployee
  onSaved: (updated: Partial<PhoneEmployee>) => void
}) {
  const [config, setConfig] = useState<WidgetConfig>({
    ...DEFAULT_CONFIG,
    displayName: employee.name,
    ...(employee.widget_config ?? {}),
  })
  const [quickReplyInput, setQuickReplyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.voicefly.ai'
  const embedCode = employee.widget_token
    ? `<script src="${appUrl}/api/widget/embed.js?token=${employee.widget_token}" defer></script>`
    : null

  const set = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const addQuickReply = () => {
    const text = quickReplyInput.trim()
    if (!text || config.quickReplies.includes(text) || config.quickReplies.length >= 5) return
    set('quickReplies', [...config.quickReplies, text])
    setQuickReplyInput('')
  }

  const removeQuickReply = (i: number) =>
    set('quickReplies', config.quickReplies.filter((_, idx) => idx !== i))

  const saveConfig = async () => {
    setSaving(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) { setSaving(false); return }

    const businessId = getSecureBusinessId()
    const res = await fetch(`/api/phone-employees/${employee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId, widgetConfig: config }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved({ widget_config: config })
    }
  }

  const copyEmbedCode = () => {
    if (!embedCode) return
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Embed code */}
      {embedCode && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Embed Code</span>
            <button
              onClick={copyEmbedCode}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: copied ? '#10b981' : '#6366f1', color: '#fff',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              {copied ? <CheckIcon style={{ width: 14, height: 14 }} /> : <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code style={{
            display: 'block', background: '#111827', color: '#a5f3fc',
            padding: '10px 12px', borderRadius: 6, fontSize: 11, overflowX: 'auto',
            fontFamily: 'monospace', whiteSpace: 'pre',
          }}>
            {embedCode}
          </code>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>
            Paste this snippet just before the closing <code>&lt;/body&gt;</code> tag on any page.
          </p>
        </div>
      )}

      {/* Appearance */}
      <Section icon={<PaintBrushIcon style={{ width: 16, height: 16 }} />} title="Appearance">
        <Row label="Primary color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={config.primaryColor}
              onChange={e => set('primaryColor', e.target.value)}
              style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={e => set('primaryColor', e.target.value)}
              style={{ width: 90, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, fontFamily: 'monospace' }}
            />
          </div>
        </Row>
        <Row label="Widget position">
          <select
            value={config.position}
            onChange={e => set('position', e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          >
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Row>
        <Row label="Display name">
          <input
            type="text"
            value={config.displayName}
            onChange={e => set('displayName', e.target.value)}
            placeholder={employee.name}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </Row>
        <Row label="Logo URL">
          <input
            type="url"
            value={config.logoUrl}
            onChange={e => set('logoUrl', e.target.value)}
            placeholder="https://example.com/logo.png"
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </Row>
      </Section>

      {/* Behavior */}
      <Section icon={<BoltIcon style={{ width: 16, height: 16 }} />} title="Behavior">
        <Row label="Welcome message">
          <textarea
            value={config.welcomeMessage}
            onChange={e => set('welcomeMessage', e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </Row>
        <Row label="Auto-pop delay (sec)">
          <input
            type="number"
            min={0}
            max={300}
            value={config.autoPopDelay}
            onChange={e => set('autoPopDelay', Number(e.target.value))}
            style={{ width: 70, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>0 = no auto-pop</span>
        </Row>
        <Row label="Show on mobile">
          <Toggle checked={config.showOnMobile} onChange={v => set('showOnMobile', v)} />
        </Row>
        <Row label="Capture visitor name/email">
          <Toggle checked={config.leadCapture} onChange={v => set('leadCapture', v)} />
        </Row>
        <Row label="Quick replies">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={quickReplyInput}
                onChange={e => setQuickReplyInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuickReply() } }}
                placeholder="Add a quick reply..."
                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
              />
              <button
                onClick={addQuickReply}
                disabled={!quickReplyInput.trim() || config.quickReplies.length >= 5}
                style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
            {config.quickReplies.map((qr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ flex: 1, fontSize: 12, padding: '4px 8px', background: '#f3f4f6', borderRadius: 6 }}>{qr}</span>
                <button
                  onClick={() => removeQuickReply(i)}
                  style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Row>
      </Section>

      {/* Features (tier-gated in the widget itself) */}
      <Section icon={<EyeIcon style={{ width: 16, height: 16 }} />} title="Features">
        <Row label="Booking flow (Growth+)">
          <Toggle checked={config.bookingEnabled} onChange={v => set('bookingEnabled', v)} />
        </Row>
        <Row label="Voice escalation / callback (Pro+)">
          <Toggle checked={config.voiceEscalationEnabled} onChange={v => set('voiceEscalationEnabled', v)} />
        </Row>
        <Row label="Hide 'Powered by VoiceFly' (Scale)">
          <Toggle checked={config.hideBranding} onChange={v => set('hideBranding', v)} />
        </Row>
      </Section>

      <button
        onClick={saveConfig}
        disabled={saving}
        style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: saved ? '#10b981' : '#6366f1',
          color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          alignSelf: 'flex-start',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {saved ? <><CheckIcon style={{ width: 16, height: 16 }} /> Saved!</> : saving ? 'Saving…' : 'Save Widget Settings'}
      </button>
    </div>
  )
}

// ── Small helper components ───────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#374151' }}>
        {icon} {title}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: '#374151', width: 180, paddingTop: 6, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 120 }}>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: checked ? '#6366f1' : '#d1d5db',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WidgetDashboard() {
  const [employees, setEmployees] = useState<PhoneEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadEmployees = useCallback(async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) { setLoading(false); return }

    const { data } = await supabase
      .from('phone_employees')
      .select('id, name, job_type, is_active, widget_token, widget_config')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    setEmployees(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadEmployees() }, [loadEmployees])

  const handleSaved = (employeeId: string, updates: Partial<PhoneEmployee>) => {
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...updates } : e))
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <ChatBubbleLeftRightIcon style={{ width: 28, height: 28, color: '#6366f1' }} />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Chat Widgets</h1>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Embed an AI chat widget on your website — connected to your phone employee.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading employees…</div>
          ) : employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              No phone employees yet. Create one first on the{' '}
              <a href="/dashboard/employees" style={{ color: '#6366f1' }}>Employees</a> page.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {employees.map(emp => {
                const isExpanded = expandedId === emp.id
                return (
                  <div key={emp.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    {/* Employee row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                      style={{
                        width: '100%', padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        border: 'none', background: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#7c3aed',
                      }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{emp.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {emp.job_type} · {emp.is_active ? '🟢 Active' : '⚫ Inactive'}
                          {emp.widget_token && (
                            <span style={{ marginLeft: 8, color: '#10b981' }}>· Widget enabled</span>
                          )}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUpIcon style={{ width: 18, height: 18, color: '#9ca3af', flexShrink: 0 }} />
                        : <ChevronDownIcon style={{ width: 18, height: 18, color: '#9ca3af', flexShrink: 0 }} />
                      }
                    </button>

                    {/* Settings panel */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #e5e7eb', padding: 16 }}>
                        <WidgetSettingsPanel
                          employee={emp}
                          onSaved={(updates) => handleSaved(emp.id, updates)}
                        />
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
