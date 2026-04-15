'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  XMarkIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  PhoneArrowDownLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================

interface Conversation {
  customerPhone: string
  employeeId: string | null
  employeeName: string | null
  lastMessage: string
  lastMessageAt: string
  lastDirection: string
  messageCount: number
  unreadCount: number
}

interface SmsMessage {
  id: string
  direction: string
  content: string
  created_at: string
  read: boolean
}

interface PhoneMessage {
  id: string
  caller_name: string | null
  caller_phone: string
  caller_email: string | null
  reason: string
  full_message: string
  urgency: string
  for_person: string | null
  status: string
  callback_requested: boolean
  callback_completed: boolean
  call_id: string | null
  created_at: string
}

interface Employee {
  id: string
  name: string
}

// ============================================
// MAIN COMPONENT
// ============================================

function MessagesPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [activeTab, setActiveTab] = useState<'calls' | 'sms'>('calls')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')

  // Phone messages state
  const [phoneMessages, setPhoneMessages] = useState<PhoneMessage[]>([])
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'new' | 'callback'>('all')

  // SMS state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [smsMessages])

  async function loadData() {
    // Force token refresh to ensure we have a valid JWT
    const { data: { session: refreshed } } = await supabase.auth.refreshSession()
    const session = refreshed || (await supabase.auth.getSession()).data.session
    if (!session) {
      redirectToLoginIfUnauthenticated()
      return
    }
    const t = session.access_token
    setToken(t)

    const bId = getSecureBusinessId()
    if (!bId) {
      redirectToLoginIfUnauthenticated()
      return
    }
    setBusinessId(bId)

    const headers = { 'Authorization': `Bearer ${t}` }

    // Fetch all data in parallel via server-side API routes
    const [bizRes, empRes, msgRes, convRes] = await Promise.all([
      fetch(`/api/business?businessId=${bId}`, { headers }).catch(() => null),
      fetch(`/api/phone-employees?businessId=${bId}`, { headers }).catch(() => null),
      fetch(`/api/phone-messages?businessId=${bId}`, { headers }).catch(() => null),
      fetch(`/api/conversations?businessId=${bId}`, { headers }).catch(() => null),
    ])

    if (bizRes?.ok) {
      const data = await bizRes.json()
      if (data.business) setBusiness(data.business)
    }
    if (empRes?.ok) {
      const data = await empRes.json()
      setEmployees(data.employees || [])
    }
    if (msgRes?.ok) {
      const data = await msgRes.json()
      setPhoneMessages(data.messages || [])
    }
    if (convRes?.ok) {
      const data = await convRes.json()
      setConversations(data.conversations || [])
    }

    setLoading(false)
  }

  // ============================================
  // PHONE MESSAGES (from calls)
  // ============================================

  async function loadPhoneMessages(bId?: string, t?: string) {
    const id = bId || businessId
    if (!id) return
    const authToken = t || token

    const res = await fetch(`/api/phone-messages?businessId=${id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    }).catch(() => null)

    if (res?.ok) {
      const data = await res.json()
      setPhoneMessages(data.messages || [])
    }
  }

  async function updateMessageStatus(msgId: string, newStatus: string) {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/phone-messages', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session?.access_token || token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId: msgId, businessId, status: newStatus }),
    })

    setPhoneMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, status: newStatus } : m)
    )
  }

  async function markCallbackCompleted(msgId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/phone-messages', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session?.access_token || token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId: msgId, businessId, status: 'resolved', callback_completed: true }),
    })

    setPhoneMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, callback_completed: true, status: 'resolved' } : m)
    )
  }

  const filteredPhoneMessages = phoneMessages.filter(m => {
    if (phoneFilter === 'new') return m.status === 'new'
    if (phoneFilter === 'callback') return m.callback_requested && !m.callback_completed
    return true
  })

  // ============================================
  // SMS CONVERSATIONS
  // ============================================

  async function loadConversations(bId?: string, t?: string) {
    const id = bId || businessId
    if (!id) return
    const authToken = t || token

    let url = `/api/conversations?businessId=${id}`
    if (filterEmployee !== 'all') url += `&employeeId=${filterEmployee}`

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    })

    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations || [])
    }
  }

  async function openConversation(conv: Conversation) {
    setSelectedConversation(conv)
    setLoadingThread(true)
    setSmsMessages([])
    setReplyText('')

    if (!businessId) return
    const { data: { session } } = await supabase.auth.getSession()
    const t = session?.access_token || ''

    const res = await fetch(
      `/api/conversations/${encodeURIComponent(conv.customerPhone)}?businessId=${businessId}`,
      { headers: { 'Authorization': `Bearer ${t}` } }
    )

    if (res.ok) {
      const data = await res.json()
      setSmsMessages(data.messages || [])
    }

    setLoadingThread(false)

    if (conv.unreadCount > 0) {
      setConversations(prev =>
        prev.map(c =>
          c.customerPhone === conv.customerPhone ? { ...c, unreadCount: 0 } : c
        )
      )
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedConversation || sending) return
    if (!businessId) return

    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    const t = session?.access_token || ''

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId,
        to: selectedConversation.customerPhone,
        message: replyText.trim(),
        employeeId: selectedConversation.employeeId,
      }),
    })

    if (res.ok) {
      setSmsMessages(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          direction: 'outbound',
          content: replyText.trim(),
          created_at: new Date().toISOString(),
          read: true,
        },
      ])
      setReplyText('')
      setConversations(prev =>
        prev.map(c =>
          c.customerPhone === selectedConversation.customerPhone
            ? { ...c, lastMessage: replyText.trim(), lastMessageAt: new Date().toISOString(), lastDirection: 'outbound' }
            : c
        )
      )
    }

    setSending(false)
  }

  useEffect(() => {
    if (businessId) loadConversations(businessId)
  }, [filterEmployee])

  // ============================================
  // RENDER
  // ============================================

  const urgencyColors: Record<string, string> = {
    low: 'bg-surface-high text-text-secondary',
    normal: 'bg-brand-primary/5 text-brand-primary',
    high: 'bg-accent/10 text-accent',
    urgent: 'bg-[#93000a]/10 text-[#ffb4ab]',
  }

  const statusColors: Record<string, string> = {
    new: 'bg-brand-primary/5 text-brand-primary',
    read: 'bg-surface-high text-text-secondary',
    in_progress: 'bg-yellow-50 text-accent',
    resolved: 'bg-green-50 text-emerald-500',
    archived: 'bg-surface text-text-muted',
  }

  return (
    <Layout business={business}>
      <div className="p-8 space-y-6">
        {/* SMS registration banner — shown when SMS isn't active yet */}
        {business && !(business as any).sms_enabled && (
          <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">SMS isn&apos;t active for your business yet</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Register your business with US carriers so your AI can send SMS. Takes 2-3 weeks — we handle the registration for you at no extra cost.
              </p>
            </div>
            <a
              href="/dashboard/settings/sms"
              className="flex-shrink-0 px-4 py-2 bg-brand-primary hover:bg-[#0060d0] text-brand-on text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Start registration
            </a>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">SMS Conversations</h1>
            <p className="text-sm text-text-secondary mt-1">
              Messages taken during calls and SMS conversations
            </p>
          </div>
          <button className="px-4 py-2.5 bg-brand-primary text-brand-on text-sm font-medium rounded-lg hover:bg-[#0060d0] transition-colors">
            New Message
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-low rounded-full p-1 w-fit">
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'calls'
                ? 'bg-brand-primary text-brand-on'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <PhoneArrowDownLeftIcon className="h-4 w-4" />
            Call Messages
            {phoneMessages.filter(m => m.status === 'new').length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-primary text-white text-xs font-medium">
                {phoneMessages.filter(m => m.status === 'new').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'sms'
                ? 'bg-brand-primary text-brand-on'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            SMS Conversations
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-primary text-white text-xs font-medium">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="bg-surface-low rounded-2xl p-12 text-center">
            <div className="animate-pulse text-text-muted">Loading messages...</div>
          </div>
        ) : activeTab === 'calls' ? (
          <>
            {/* Phone Message Filters */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'new', 'callback'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPhoneFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    phoneFilter === f
                      ? 'bg-brand-primary/5 border-blue-200 text-brand-primary font-medium'
                      : 'bg-surface-low border-[rgba(65,71,84,0.15)] text-text-secondary hover:bg-surface'
                  }`}
                >
                  {f === 'all' ? `All (${phoneMessages.length})` :
                   f === 'new' ? `New (${phoneMessages.filter(m => m.status === 'new').length})` :
                   `Callbacks (${phoneMessages.filter(m => m.callback_requested && !m.callback_completed).length})`}
                </button>
              ))}
            </div>

            {/* Phone Messages List */}
            {filteredPhoneMessages.length === 0 ? (
              <div className="bg-surface-low rounded-2xl p-12 text-center">
                <PhoneArrowDownLeftIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-sm font-medium text-text-primary mb-1">No messages yet</h3>
                <p className="text-xs text-text-secondary">
                  When your AI employee takes a message during a call, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPhoneMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`bg-surface-low rounded-lg border p-4 transition-colors ${
                      msg.status === 'new' ? 'border-blue-200 bg-brand-primary/5/30' : 'border-[rgba(65,71,84,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {/* Header row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-text-primary">
                            {msg.caller_name || 'Unknown Caller'}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {msg.caller_phone}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${urgencyColors[msg.urgency] || urgencyColors.normal}`}>
                            {msg.urgency}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[msg.status] || statusColors.new}`}>
                            {msg.status.replace('_', ' ')}
                          </span>
                          {msg.callback_requested && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                              msg.callback_completed
                                ? 'bg-green-50 text-emerald-500'
                                : 'bg-amber-50 text-accent'
                            }`}>
                              <PhoneIcon className="h-3 w-3" />
                              {msg.callback_completed ? 'Called back' : 'Callback requested'}
                            </span>
                          )}
                        </div>

                        {/* For person */}
                        {msg.for_person && (
                          <p className="text-xs text-text-secondary mt-1">
                            For: <span className="font-medium text-text-primary">{msg.for_person}</span>
                          </p>
                        )}

                        {/* Reason */}
                        {msg.reason && (
                          <p className="text-sm text-text-primary mt-2 font-medium">
                            {msg.reason}
                          </p>
                        )}

                        {/* Full message */}
                        {msg.full_message && msg.full_message !== msg.reason && (
                          <p className="text-sm text-text-secondary mt-1">
                            {msg.full_message}
                          </p>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-text-muted mt-2">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          {' '}
                          ({new Date(msg.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })})
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {msg.status === 'new' && (
                          <button
                            onClick={() => updateMessageStatus(msg.id, 'read')}
                            className="text-xs px-2.5 py-1.5 rounded-md border border-[rgba(65,71,84,0.15)] text-text-secondary hover:bg-surface transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        {msg.status !== 'resolved' && (
                          <button
                            onClick={() => updateMessageStatus(msg.id, 'resolved')}
                            className="text-xs px-2.5 py-1.5 rounded-md border border-green-200 text-emerald-500 hover:bg-green-50 transition-colors flex items-center gap-1"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            Resolve
                          </button>
                        )}
                        {msg.callback_requested && !msg.callback_completed && (
                          <button
                            onClick={() => markCallbackCompleted(msg.id)}
                            className="text-xs px-2.5 py-1.5 rounded-md border border-amber-200 text-accent hover:bg-amber-50 transition-colors flex items-center gap-1"
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            Called back
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* SMS Filter */}
            <div className="flex items-center gap-2 mb-4">
              <FunnelIcon className="h-4 w-4 text-text-muted" />
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="text-sm border border-[rgba(65,71,84,0.15)] rounded-lg px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* SMS Conversation List */}
            {conversations.length === 0 ? (
              <div className="bg-surface-low rounded-2xl p-12 text-center">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-sm font-medium text-text-primary mb-1">No conversations yet</h3>
                <p className="text-xs text-text-secondary">SMS conversations will appear here when customers text your phone employees.</p>
              </div>
            ) : (
              <div className="bg-surface-low rounded-2xl">
                <div className="divide-y divide-[rgba(65,71,84,0.1)]">
                  {conversations.map(conv => (
                    <button
                      key={conv.customerPhone}
                      onClick={() => openConversation(conv)}
                      className="w-full text-left p-4 hover:bg-surface transition-colors flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">
                            {conv.customerPhone}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-text-secondary truncate max-w-[300px]">
                            {conv.lastDirection === 'outbound' ? 'You: ' : ''}
                            {conv.lastMessage}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {conv.employeeName && (
                              <span className="text-xs text-text-muted">{conv.employeeName}</span>
                            )}
                            {conv.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand-primary text-white text-xs font-medium">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SMS Conversation Detail Slide-over */}
      <Transition.Root show={!!selectedConversation} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedConversation(null)}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-surface0 bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-surface-low shadow-xl">
                    <div className="sticky top-0 bg-surface-low border-b border-[rgba(65,71,84,0.15)] px-6 py-4 z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-base font-semibold text-text-primary">
                            {selectedConversation?.customerPhone}
                          </Dialog.Title>
                          {selectedConversation?.employeeName && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              Handled by {selectedConversation.employeeName}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="rounded-md text-text-muted hover:text-text-secondary"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-surface">
                      {loadingThread ? (
                        <div className="text-center text-text-muted text-sm py-8">Loading messages...</div>
                      ) : smsMessages.length === 0 ? (
                        <div className="text-center text-text-muted text-sm py-8">No messages in this conversation.</div>
                      ) : (
                        smsMessages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                                msg.direction === 'outbound'
                                  ? 'bg-brand-primary text-white rounded-lg rounded-br-none'
                                  : 'bg-surface-low text-text-primary rounded-lg rounded-bl-none border border-[rgba(65,71,84,0.15)]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p
                                className={`text-[10px] mt-1.5 ${
                                  msg.direction === 'outbound' ? 'text-blue-200' : 'text-text-muted'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-[rgba(65,71,84,0.15)] px-4 py-3 bg-surface-low">
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendReply()
                            }
                          }}
                          placeholder="Type a reply..."
                          rows={1}
                          className="flex-1 resize-none rounded-lg border border-[rgba(65,71,84,0.15)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sending}
                          className="flex-shrink-0 p-2 rounded-lg bg-brand-primary text-white hover:bg-[#0060d0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </Layout>
  )
}

export default function ProtectedMessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  )
}
