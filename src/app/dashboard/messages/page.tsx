'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  FunnelIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { formatDistanceToNow } from 'date-fns'

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

interface Message {
  id: string
  direction: string
  content: string
  created_at: string
  read: boolean
}

interface Employee {
  id: string
  name: string
}

function MessagesPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
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
  }, [messages])

  async function loadData() {
    const businessId = getSecureBusinessId()
    if (!businessId) {
      redirectToLoginIfUnauthenticated()
      return
    }

    const b = await BusinessAPI.getBusiness(businessId)
    if (b) setBusiness(b)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''

    // Fetch employees for filter
    if (token) {
      const empRes = await fetch(`/api/phone-employees?businessId=${businessId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (empRes.ok) {
        const empData = await empRes.json()
        setEmployees(empData.employees || [])
      }
    }

    await loadConversations(businessId, token)
    setLoading(false)
  }

  async function loadConversations(businessId?: string, token?: string) {
    const bId = businessId || getSecureBusinessId()
    if (!bId) return

    if (!token) {
      const { data: { session } } = await supabase.auth.getSession()
      token = session?.access_token || ''
    }

    let url = `/api/conversations?businessId=${bId}`
    if (filterEmployee !== 'all') {
      url += `&employeeId=${filterEmployee}`
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations || [])
    }
  }

  async function openConversation(conv: Conversation) {
    setSelectedConversation(conv)
    setLoadingThread(true)
    setMessages([])
    setReplyText('')

    const businessId = getSecureBusinessId()
    if (!businessId) return

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''

    const res = await fetch(
      `/api/conversations/${encodeURIComponent(conv.customerPhone)}?businessId=${businessId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }

    setLoadingThread(false)

    // Update unread count in local state
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

    const businessId = getSecureBusinessId()
    if (!businessId) return

    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
      // Add to local messages
      setMessages(prev => [
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

      // Update conversation list
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
    const bId = getSecureBusinessId()
    if (bId) loadConversations(bId)
  }, [filterEmployee])

  const filteredConversations = conversations

  return (
    <Layout business={business}>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            <p className="text-sm text-gray-500">
              SMS conversations with your customers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversation List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-pulse text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-xs text-gray-500">SMS conversations will appear here when customers text your phone employees.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="divide-y divide-gray-100">
              {filteredConversations.map(conv => (
                <button
                  key={conv.customerPhone}
                  onClick={() => openConversation(conv)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                  {/* Avatar circle */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {conv.customerPhone}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate max-w-[300px]">
                        {conv.lastDirection === 'outbound' ? 'You: ' : ''}
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {conv.employeeName && (
                          <span className="text-xs text-gray-400">{conv.employeeName}</span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">
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
      </div>

      {/* Conversation Detail Slide-over */}
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50" />
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
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-base font-semibold text-gray-900">
                            {selectedConversation?.customerPhone}
                          </Dialog.Title>
                          {selectedConversation?.employeeName && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Handled by {selectedConversation.employeeName}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="rounded-md text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
                      {loadingThread ? (
                        <div className="text-center text-gray-400 text-sm py-8">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">No messages in this conversation.</div>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                                msg.direction === 'outbound'
                                  ? 'bg-blue-600 text-white rounded-lg rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-lg rounded-bl-none border border-gray-200'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p
                                className={`text-[10px] mt-1.5 ${
                                  msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'
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

                    {/* Reply Input */}
                    <div className="border-t border-gray-200 px-4 py-3 bg-white">
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
                          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sending}
                          className="flex-shrink-0 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
