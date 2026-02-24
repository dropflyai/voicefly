"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { X, Send, ChevronRight, Loader2, Users, Volume2, VolumeX } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isDemo?: boolean
}

export interface AIChatbotRef {
  openWithMessage: (message: string) => void
}

// Maya's avatar with optional speaking glow animation
function MayaAvatar({ size = 'md', speaking = false }: { size?: 'sm' | 'md' | 'lg', speaking?: boolean }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  return (
    <div className={`relative flex-shrink-0 ${sizes[size]}`}>
      {/* Pulsing glow ring when speaking */}
      {speaking && (
        <>
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
          <span className="absolute inset-0 rounded-full ring-2 ring-blue-400 opacity-60" />
        </>
      )}
      <img
        src="/maya-avatars/holo-d1.png"
        alt="Maya"
        className="w-full h-full rounded-full object-cover object-top border-2 border-blue-400/50"
      />
      {/* Online dot */}
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white" />
    </div>
  )
}

const AIChatbot = forwardRef<AIChatbotRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Maya, VoiceFly's AI assistant — and a live demo of what an AI employee feels like.\n\nWhat kind of business do you run?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', businessType: '' })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [trialUrl, setTrialUrl] = useState<string | null>(null)
  const [showIntroNotification, setShowIntroNotification] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionId = useRef<string>(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36)
  )

  const isSpeaking = playingAudioId !== null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showLeadCapture])

  useImperativeHandle(ref, () => ({
    openWithMessage: (message: string) => {
      setIsOpen(true)
      setTimeout(() => { sendMessage(message) }, 100)
    }
  }))

  useEffect(() => {
    const showTimer = setTimeout(() => {
      if (!isOpen) setShowIntroNotification(true)
    }, 5000)
    const hideTimer = setTimeout(() => {
      setShowIntroNotification(false)
    }, 13000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setShowIntroNotification(false)
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    const lowerText = text.toLowerCase()
    if (lowerText.includes('demo') || lowerText.includes('show me') || lowerText.includes('example')) {
      setIsDemoMode(true)
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, context: 'public', sessionId: sessionId.current }),
      })
      const data = await res.json()

      if (data.showLeadCapture && !leadSubmitted) setShowLeadCapture(true)

      const responseText = data.response || "Sorry, I ran into an issue. Please try again."
      const isDemo = isDemoMode ||
        responseText.toLowerCase().includes("i'll step into") ||
        responseText.toLowerCase().includes("i'll act as") ||
        responseText.toLowerCase().includes("calling in")

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isDemo,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date(),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const extractContextFromMessages = (msgs: Message[]): { businessType?: string; employeeInterest?: string } => {
    const text = msgs.map(m => m.content).join(' ').toLowerCase()
    let businessType: string | undefined
    if (text.match(/restaurant|food\b|cafe|diner|pizza|\bbar\b/)) businessType = 'Restaurant / Food'
    else if (text.match(/dental|dentist/)) businessType = 'Dental'
    else if (text.match(/medical|doctor|clinic|healthcare/)) businessType = 'Medical / Healthcare'
    else if (text.match(/real estate|realty|realtor|mortgage/)) businessType = 'Real Estate'
    else if (text.match(/salon|spa|beauty|hair\b|nail\b/)) businessType = 'Beauty / Salon / Spa'
    else if (text.match(/fitness|gym|yoga|wellness/)) businessType = 'Fitness & Wellness'
    else if (text.match(/law firm|attorney|lawyer|legal/)) businessType = 'Law Firm'
    else if (text.match(/plumb|hvac|contractor|roofing|landscap/)) businessType = 'Home Services'
    else if (text.match(/retail|store\b|boutique/)) businessType = 'Retail'

    let employeeInterest: string | undefined
    if (text.match(/appointment.scheduler|schedule appointment/)) employeeInterest = 'appointment-scheduler'
    else if (text.match(/order.taker|take orders|restaurant.host/)) employeeInterest = 'order-taker'
    else if (text.match(/customer.service/)) employeeInterest = 'customer-service'
    else if (text.match(/receptionist/)) employeeInterest = 'receptionist'

    return { businessType, employeeInterest }
  }

  const submitLead = async () => {
    if (!leadForm.email.trim()) return
    setLeadSubmitting(true)
    try {
      await fetch('/api/chatbot-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadForm.email,
          name: leadForm.name,
          businessType: leadForm.businessType,
          sessionId: sessionId.current,
        }),
      })
    } catch {
      // fail silently
    } finally {
      setLeadSubmitting(false)
      setLeadSubmitted(true)
      setShowLeadCapture(false)

      // Extract conversation context and write to localStorage for onboarding pre-fill
      const { businessType, employeeInterest } = extractContextFromMessages(messages)
      const firstName = leadForm.name?.split(' ')[0] || ''
      const context = {
        email: leadForm.email,
        name: leadForm.name,
        firstName,
        businessType,
        employeeInterest,
      }
      try {
        localStorage.setItem('voicefly_lead_context', JSON.stringify(context))
      } catch {
        // localStorage may be unavailable
      }

      // Build pre-filled signup URL
      const params = new URLSearchParams()
      params.set('email', leadForm.email)
      if (leadForm.name) params.set('name', leadForm.name)
      const url = `/signup?${params.toString()}`
      setTrialUrl(url)

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Perfect${firstName ? `, ${firstName}` : ''}! Your trial is ready — I've pre-filled your signup so it only takes 30 seconds. First employee can be live in under 10 minutes.`,
        timestamp: new Date(),
      }])
    }
  }

  const playAudio = async (messageId: string, text: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      if (playingAudioId === messageId) {
        setPlayingAudioId(null)
        return
      }
    }

    setAudioLoading(messageId)
    setPlayingAudioId(null)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('TTS failed')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onended = () => { setPlayingAudioId(null); URL.revokeObjectURL(audioUrl) }
      audio.onerror = () => { setPlayingAudioId(null); setAudioLoading(null); URL.revokeObjectURL(audioUrl) }

      audioRef.current = audio
      setAudioLoading(null)
      setPlayingAudioId(messageId)
      await audio.play()
    } catch (error) {
      console.error('Audio playback error:', error)
      setAudioLoading(null)
      setPlayingAudioId(null)
    }
  }

  const quickQuestions = [
    "What employee types are available?",
    "Show me a demo",
    "How much does it cost?",
    "How does setup work?",
  ]

  return (
    <>
      {/* Floating badge */}
      {!isOpen && !showIntroNotification && (
        <div className="fixed bottom-28 right-6 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-medium">Talk to Maya — Our AI sales agent!</span>
            <span className="animate-pulse">👋</span>
          </div>
        </div>
      )}

      {/* Intro notification */}
      {showIntroNotification && !isOpen && (
        <div className="fixed bottom-28 right-6 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-xl border border-purple-200 p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <MayaAvatar size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">Hi, I'm Maya!</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The AI employee this page is about. Ask me anything!
                </p>
              </div>
              <button
                onClick={() => setShowIntroNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button — Maya's avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
      >
        {isOpen ? (
          <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
            <X className="h-6 w-6 text-gray-700" />
          </div>
        ) : (
          <div className="relative h-14 w-14">
            <img
              src="/maya-avatars/holo-d1.png"
              alt="Chat with Maya"
              className="h-14 w-14 rounded-full object-cover object-top border-2 border-blue-400 ring-2 ring-purple-500/50"
            />
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200" style={{ height: '580px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <MayaAvatar size="md" speaking={isSpeaking} />
              <div>
                <h3 className="font-semibold text-base">Maya</h3>
                <p className="text-xs text-blue-200">
                  {isSpeaking ? 'Speaking...' : isDemoMode ? 'Live Demo Active' : 'VoiceFly AI Assistant'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 bg-green-400 rounded-full" />
                <span>Online 24/7</span>
              </span>
              {isDemoMode && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">DEMO</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>

                {/* Maya avatar on left for assistant messages */}
                {msg.role === 'assistant' && (
                  <MayaAvatar size="sm" speaking={playingAudioId === msg.id} />
                )}

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : msg.isDemo
                      ? 'bg-purple-50 text-gray-900 shadow-sm border border-purple-200 rounded-bl-sm'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.isDemo && msg.role === 'assistant' && (
                    <div className="text-[10px] font-semibold text-purple-500 mb-1 uppercase tracking-wide">
                      Demo Mode
                    </div>
                  )}
                  <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                  <div className={`flex items-center justify-between mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    <div className="text-[10px]">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Voice button for assistant messages */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => playAudio(msg.id, msg.content)}
                    disabled={audioLoading === msg.id}
                    className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
                      playingAudioId === msg.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                    } ${audioLoading === msg.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Hear Maya speak"
                  >
                    {audioLoading === msg.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : playingAudioId === msg.id ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <MayaAvatar size="sm" />
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2 mt-2">Common questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trial CTA — shown after lead capture */}
          {trialUrl && leadSubmitted && (
            <div className="mx-3 mb-3 flex-shrink-0">
              <a
                href={trialUrl}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                Activate Free Trial
                <ChevronRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-gray-400 text-center mt-1.5">Takes 30 seconds • No credit card needed</p>
            </div>
          )}

          {/* Lead Capture */}
          {showLeadCapture && !leadSubmitted && (
            <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Start your free 14-day trial</p>
                  <p className="text-xs text-gray-500 mt-0.5">First employee live in &lt; 10 minutes</p>
                </div>
                <button onClick={() => setShowLeadCapture(false)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={leadForm.name}
                  onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Work email *"
                  value={leadForm.email}
                  onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={e => { if (e.key === 'Enter') submitLead() }}
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
                  <Users className="h-3 w-3 mr-1" /> Join 500+ businesses • No credit card needed
                </p>
                <button
                  onClick={submitLead}
                  disabled={!leadForm.email.trim() || leadSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {leadSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Get Started Free <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder={isDemoMode ? "Interact as a customer calling in..." : "Ask me anything..."}
                rows={1}
                disabled={isTyping}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {isDemoMode && (
              <button
                onClick={() => setIsDemoMode(false)}
                className="mt-1.5 text-[11px] text-purple-600 hover:text-purple-800 transition-colors"
              >
                Exit demo mode
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
})

AIChatbot.displayName = 'AIChatbot'

export default AIChatbot
