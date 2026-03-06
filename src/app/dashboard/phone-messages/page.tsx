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
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-400',
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
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <EnvelopeIcon className="h-7 w-7 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900">Phone Messages</h1>
              {newCount > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-blue-600 text-white text-xs font-medium">
                  {newCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Messages taken by your AI employees during calls
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
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
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.key
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-pulse text-gray-400">Loading messages...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No messages</h3>
            <p className="text-xs text-gray-500">
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
                className={`bg-white rounded-lg border transition-colors ${
                  msg.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                }`}
              >
                {/* Message Header */}
                <button
                  onClick={() => {
                    setExpandedId(expandedId === msg.id ? null : msg.id)
                    if (msg.status === 'new') updateStatus(msg.id, 'read')
                  }}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                        <PhoneIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {msg.caller_name || msg.caller_phone}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColors[msg.urgency] || urgencyColors.normal}`}>
                            {msg.urgency}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[msg.status] || statusColors.new}`}>
                            {msg.status.replace('_', ' ')}
                          </span>
                          {msg.callback_requested && !msg.callback_completed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" /> callback needed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{msg.reason}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                          {msg.for_person && <span>For: {msg.for_person}</span>}
                          {msg.caller_phone && msg.caller_name && <span>{msg.caller_phone}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === msg.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 ml-[52px]">
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.full_message}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                      {msg.caller_phone && (
                        <a href={`tel:${msg.caller_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <PhoneIcon className="h-3.5 w-3.5" /> {msg.caller_phone}
                        </a>
                      )}
                      {msg.caller_email && <span>Email: {msg.caller_email}</span>}
                      {msg.caller_company && <span>Company: {msg.caller_company}</span>}
                      {msg.department && <span>Dept: {msg.department}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'resolved')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" /> Mark Resolved
                        </button>
                      )}
                      {msg.status !== 'in_progress' && msg.status !== 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'in_progress')}
                          className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                        >
                          In Progress
                        </button>
                      )}
                      {msg.callback_requested && !msg.callback_completed && (
                        <button
                          onClick={() => markCallbackComplete(msg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <PhoneIcon className="h-4 w-4" /> Callback Done
                        </button>
                      )}
                      {msg.status === 'resolved' && (
                        <button
                          onClick={() => updateStatus(msg.id, 'archived')}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
