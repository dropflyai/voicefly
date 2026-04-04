'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface PhoneMessage {
  id: string
  caller_name: string | null
  caller_phone: string
  caller_email: string | null
  caller_company: string | null
  reason: string
  full_message: string
  urgency: string
  for_person: string | null
  department: string | null
  status: string
  callback_requested: boolean
  callback_completed: boolean
  created_at: string
  employee_id: string | null
}

const urgencyColors: Record<string, string> = {
  low: 'bg-surface-high text-text-secondary',
  normal: 'bg-brand-primary/10 text-brand-primary',
  high: 'bg-accent/10 text-accent',
  urgent: 'bg-[#93000a]/10 text-[#ffb4ab]',
}

const statusColors: Record<string, string> = {
  new: 'bg-brand-primary/10 text-brand-primary',
  read: 'bg-surface-high text-text-secondary',
  in_progress: 'bg-accent/10 text-accent',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  archived: 'bg-surface-high text-text-muted',
}

function PhoneMessagesPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [messages, setMessages] = useState<PhoneMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const businessId = getSecureBusinessId()
    if (!businessId) {
      redirectToLoginIfUnauthenticated()
      return
    }

    const b = await BusinessAPI.getBusiness(businessId)
    if (b) setBusiness(b)

    const { data, error } = await supabase
      .from('phone_messages')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  async function updateStatus(messageId: string, newStatus: string) {
    const { error } = await supabase
      .from('phone_messages')
      .update({ status: newStatus })
      .eq('id', messageId)

    if (!error) {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, status: newStatus } : m)
      )
    }
  }

  async function markCallbackComplete(messageId: string) {
    const { error } = await supabase
      .from('phone_messages')
      .update({ callback_completed: true, status: 'resolved' })
      .eq('id', messageId)

    if (!error) {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, callback_completed: true, status: 'resolved' } : m)
      )
    }
  }

  const filtered = filter === 'all'
    ? messages
    : filter === 'callback'
      ? messages.filter(m => m.callback_requested && !m.callback_completed)
      : messages.filter(m => m.status === filter)

  const newCount = messages.filter(m => m.status === 'new').length
  const callbackCount = messages.filter(m => m.callback_requested && !m.callback_completed).length

  return (
    <Layout business={business}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Phone Messages</h1>
            <p className="text-sm text-text-secondary mt-1">
              Messages taken by your AI employees during calls
            </p>
          </div>
          {newCount > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-light text-sm font-medium">
              {newCount} new
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'callback', label: `Callbacks (${callbackCount})` },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                filter === f.key
                  ? 'bg-purple-500/10 text-purple-400 font-medium'
                  : 'text-text-secondary hover:bg-surface-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="bg-surface-low rounded-2xl p-12 text-center">
            <div className="animate-pulse text-text-muted">Loading messages...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-low rounded-2xl p-12 text-center">
            <EnvelopeIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-medium text-text-primary mb-1">No messages</h3>
            <p className="text-xs text-text-secondary">
              {filter === 'all'
                ? 'Messages taken during calls will appear here.'
                : 'No messages match this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => (
              <div
                key={msg.id}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  msg.status === 'new'
                    ? 'bg-surface-low ring-1 ring-brand-primary/20'
                    : expandedId === msg.id
                      ? 'bg-surface-med'
                      : 'bg-surface-low hover:bg-surface-med'
                }`}
              >
                {/* Message Header */}
                <button
                  onClick={() => {
                    setExpandedId(expandedId === msg.id ? null : msg.id)
                    if (msg.status === 'new') updateStatus(msg.id, 'read')
                  }}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mt-0.5">
                      <PhoneIcon className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-text-primary">
                          {msg.caller_name || msg.caller_phone}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${urgencyColors[msg.urgency] || urgencyColors.normal}`}>
                          {msg.urgency}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[msg.status] || statusColors.new}`}>
                          {msg.status.replace('_', ' ')}
                        </span>
                        {msg.callback_requested && !msg.callback_completed && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1 font-medium">
                            <ClockIcon className="h-3 w-3" /> callback
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{msg.reason}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                        <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                        {msg.for_person && <span>For: {msg.for_person}</span>}
                        {msg.caller_phone && msg.caller_name && <span className="font-mono">{msg.caller_phone}</span>}
                      </div>
                    </div>
                    {/* Expand indicator */}
                    <div className={`flex-shrink-0 mt-1 transition-transform ${expandedId === msg.id ? 'rotate-180' : ''}`}>
                      <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === msg.id && (
                  <div className="px-5 pb-5 pt-0 ml-[52px] space-y-4">
                    {/* Full message */}
                    <div className="bg-surface-lowest rounded-xl p-4">
                      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{msg.full_message}</p>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                      {msg.caller_phone && (
                        <a href={`tel:${msg.caller_phone}`} className="flex items-center gap-1.5 text-brand-light hover:text-brand-primary transition-colors">
                          <PhoneIcon className="h-3.5 w-3.5" /> {msg.caller_phone}
                        </a>
                      )}
                      {msg.caller_email && <span>Email: {msg.caller_email}</span>}
                      {msg.caller_company && <span>Company: {msg.caller_company}</span>}
                      {msg.department && <span>Dept: {msg.department}</span>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" /> Mark Resolved
                        </button>
                      )}
                      {msg.status !== 'in_progress' && msg.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'in_progress')}
                          className="px-3 py-1.5 text-xs font-medium text-accent bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
                        >
                          In Progress
                        </button>
                      )}
                      {msg.callback_requested && !msg.callback_completed && (
                        <button
                          onClick={() => markCallbackComplete(msg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
                        >
                          <PhoneIcon className="h-4 w-4" /> Callback Done
                        </button>
                      )}
                      {msg.status === 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'archived')}
                          className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-high rounded-lg hover:bg-surface-highest transition-colors"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function ProtectedPhoneMessagesPage() {
  return (
    <ProtectedRoute>
      <PhoneMessagesPage />
    </ProtectedRoute>
  )
}
