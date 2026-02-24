'use client'

/**
 * Widget Chat UI — runs inside an iframe embedded on customer websites.
 *
 * Fetches config by token, renders a full chat interface, and supports:
 * - Text chat with the phone employee's AI
 * - Quick reply buttons
 * - Lead capture (name/email before first message)
 * - Voice escalation (dial-back request)
 * - Booking flow placeholder
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

interface WidgetConfig {
  primaryColor: string
  position: string
  displayName: string | null
  logoUrl: string | null
  welcomeMessage: string
  quickReplies: string[]
  autoPopDelay: number
  showOnMobile: boolean
  leadCapture: boolean
  bookingEnabled: boolean
  voiceEscalationEnabled: boolean
  hideBranding: boolean
}

interface WidgetData {
  token: string
  employeeId: string
  employeeName: string
  jobType: string
  businessName: string | null
  config: WidgetConfig
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function WidgetPage() {
  const params = useParams()
  const token = params.token as string

  const [widgetData, setWidgetData] = useState<WidgetData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visitorId] = useState(() => Math.random().toString(36).slice(2))

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [showLeadForm, setShowLeadForm] = useState(false)

  // Escalation state
  const [showEscalate, setShowEscalate] = useState(false)
  const [escalatePhone, setEscalatePhone] = useState('')
  const [escalating, setEscalating] = useState(false)
  const [escalateMessage, setEscalateMessage] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef(`ws_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const sessionStartRef = useRef(new Date().toISOString())
  const messagesRef = useRef<Message[]>([])
  messagesRef.current = messages

  // Send session-end analytics when widget closes or page unloads
  const sendSessionEnd = useCallback((currentMessages: Message[]) => {
    if (currentMessages.length < 2) return
    const stored = sessionStorage.getItem(`vf_lead_${token}`)
    const leadData = stored ? JSON.parse(stored) : {}
    navigator.sendBeacon('/api/widget/session-end', JSON.stringify({
      token,
      sessionId: sessionIdRef.current,
      messages: currentMessages,
      visitorId,
      leadInfo: leadData,
      startedAt: sessionStartRef.current,
    }))
  }, [token, visitorId])

  useEffect(() => {
    const handleUnload = () => sendSessionEnd(messagesRef.current)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [sendSessionEnd])

  // Fetch widget config
  useEffect(() => {
    fetch(`/api/widget/config/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then((data: WidgetData) => {
        setWidgetData(data)
        // Add welcome message
        setMessages([{ role: 'assistant', content: data.config.welcomeMessage }])
        // Show lead form if leadCapture is on and no name stored
        if (data.config.leadCapture) {
          const stored = sessionStorage.getItem(`vf_lead_${token}`)
          if (!stored) setShowLeadForm(true)
          else setLeadCaptured(true)
        }
      })
      .catch(() => setError('Widget not found'))
      .finally(() => setConfigLoading(false))
  }, [token])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading || !widgetData) return

    // If lead capture enabled and not yet captured, prompt form
    if (widgetData.config.leadCapture && !leadCaptured && !showLeadForm) {
      setShowLeadForm(true)
      return
    }

    const userMsg: Message = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          messages: nextMessages,
          visitorId,
          metadata: leadName ? { name: leadName, email: leadEmail } : undefined,
        }),
      })

      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again.",
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const submitLeadForm = () => {
    if (!leadName.trim()) return
    sessionStorage.setItem(`vf_lead_${token}`, JSON.stringify({ name: leadName, email: leadEmail }))
    setLeadCaptured(true)
    setShowLeadForm(false)
  }

  const submitEscalation = async () => {
    if (!escalatePhone.trim() || escalating) return
    setEscalating(true)
    try {
      const res = await fetch('/api/widget/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, visitorPhone: escalatePhone, visitorName: leadName || undefined }),
      })
      const data = await res.json()
      setEscalateMessage(data.message ?? (res.ok ? 'Calling you shortly!' : data.error ?? 'Failed to initiate call'))
    } catch {
      setEscalateMessage('Service unavailable. Please try again.')
    } finally {
      setEscalating(false)
    }
  }

  const closeWidget = () => {
    sendSessionEnd(messagesRef.current)
    window.parent.postMessage({ type: 'vf_widget_close' }, '*')
  }

  if (configLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !widgetData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb', color: '#6b7280', fontSize: 14 }}>
        Widget unavailable
      </div>
    )
  }

  const { config } = widgetData
  const primary = config.primaryColor
  const displayName = config.displayName || widgetData.employeeName

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#ffffff',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: primary,
        color: '#fff',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: '#ffffff40' }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{displayName}</div>
          {widgetData.businessName && (
            <div style={{ fontSize: 12, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {widgetData.businessName}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {config.voiceEscalationEnabled && (
            <button
              onClick={() => { setShowEscalate(!showEscalate); setEscalateMessage(null) }}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 18 }}
              title="Request a callback"
            >
              📞
            </button>
          )}
          <button
            onClick={closeWidget}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Lead capture form */}
      {showLeadForm && (
        <div style={{ padding: '16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#374151', fontWeight: 500 }}>Before we chat, quick intro?</p>
          <input
            type="text"
            placeholder="Your name *"
            value={leadName}
            onChange={e => setLeadName(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={leadEmail}
            onChange={e => setLeadEmail(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
          />
          <button
            onClick={submitLeadForm}
            disabled={!leadName.trim()}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: leadName.trim() ? 'pointer' : 'not-allowed', opacity: leadName.trim() ? 1 : 0.6 }}
          >
            Start chatting
          </button>
        </div>
      )}

      {/* Escalation form */}
      {showEscalate && (
        <div style={{ padding: '14px 16px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', flexShrink: 0 }}>
          {escalateMessage ? (
            <p style={{ margin: 0, fontSize: 13, color: '#0369a1', fontWeight: 500 }}>{escalateMessage}</p>
          ) : (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#0c4a6e', fontWeight: 500 }}>Enter your phone number for a callback:</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={escalatePhone}
                  onChange={e => setEscalatePhone(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #7dd3fc', fontSize: 13 }}
                />
                <button
                  onClick={submitEscalation}
                  disabled={escalating || !escalatePhone.trim()}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0284c7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {escalating ? '...' : 'Call me'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '9px 13px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? primary : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#111827',
              fontSize: 14,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#f3f4f6', borderRadius: '4px 16px 16px 16px', padding: '10px 14px' }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {config.quickReplies.length > 0 && messages.length <= 1 && !loading && (
        <div style={{ padding: '8px 12px 0', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {config.quickReplies.map((qr, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qr)}
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: `1.5px solid ${primary}`, background: '#fff',
                color: primary, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type a message..."
            disabled={loading || (config.leadCapture && !leadCaptured)}
            style={{
              flex: 1,
              padding: '10px 13px',
              borderRadius: 24,
              border: '1.5px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              background: '#f9fafb',
              color: '#111',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || (config.leadCapture && !leadCaptured)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              border: 'none', background: input.trim() && !loading ? primary : '#e5e7eb',
              color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {!config.hideBranding && (
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
            Powered by <a href="https://voicefly.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>VoiceFly</a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
