'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface SupportAgentProps {
  businessId: string | null
}

const QUICK_QUESTIONS = [
  'How do I create a phone employee?',
  'My calls aren\'t showing up',
  'How do I connect Google Calendar?',
  'How do I upgrade my plan?',
]

export default function SupportAgent({ businessId }: SupportAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m the VoiceFly support agent. I can help with setup, troubleshooting, or any questions about your account. What can I help you with?',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text.trim(),
          history,
          context: 'support',
          businessId,
        }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I ran into an issue. Please try again.',
      }
      setMessages(prev => [...prev, assistantMsg])

      // Handle ticket escalation
      if (data.createTicket) {
        await createTicket(data.ticketSummary, [...history, { role: 'user', content: text }, { role: 'assistant', content: data.response }])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting. Please try again.',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const createTicket = async (summary: string | null, conversation: { role: string; content: string }[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          summary: summary || 'Support request from help page',
          conversation,
          userEmail: session?.user?.email,
        }),
      })
      setTicketCreated(true)
    } catch {
      console.error('Failed to create support ticket')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Support Agent</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}

        {ticketCreated && (
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Support ticket created — we'll follow up soon
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions (only show if no user messages yet) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
