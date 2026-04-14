'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useChat, type UseChatOptions } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart } from 'ai'
import { X, Send, ChevronRight, Loader2, Volume2, VolumeX, Mic, MicOff, CheckCircle, Circle, Bot } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import ReactMarkdown from 'react-markdown'

// ─── Types ──────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2 | 3 | 'done'

interface EmployeeInfo {
  id: string
  name: string
  jobType: string
  phoneNumber: string | null
  jobConfig: Record<string, any>
}

interface ConfigGap {
  field: string
  label: string
  description: string
}

export interface MayaChatRef {
  openWithMessage: (message: string) => void
}

interface MayaChatProps {
  mode: 'public' | 'dashboard'
  autoOpenForNewUser?: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  { step: 1, label: 'Create employee' },
  { step: 2, label: 'Forward your calls' },
  { step: 3, label: 'Test call' },
]

const PUBLIC_QUICK_QUESTIONS = [
  'What employee types are available?',
  'Show me a demo',
  'How much does it cost?',
  'How does setup work?',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function detectConfigGaps(employee: EmployeeInfo): ConfigGap[] {
  const gaps: ConfigGap[] = []
  const config = employee.jobConfig || {}
  if (!config.greeting) gaps.push({ field: 'greeting', label: 'Custom greeting', description: 'Personalize how callers are welcomed' })
  if (!config.businessHours && !config.hoursNote) gaps.push({ field: 'businessHours', label: 'Business hours', description: "Let callers know when you're open" })
  if (!config.address) gaps.push({ field: 'address', label: 'Business address', description: 'Help callers find your location' })
  if (!config.transferNumber) gaps.push({ field: 'transferNumber', label: 'Escalation phone', description: 'Where to transfer calls needing a human' })
  switch (employee.jobType) {
    case 'receptionist':
      if (!config.commonQuestions?.length) gaps.push({ field: 'commonQuestions', label: 'Common Q&A', description: 'Add FAQs so callers get instant answers' }); break
    case 'order-taker':
      if (!config.menuItems?.length) gaps.push({ field: 'menuItems', label: 'Menu items', description: 'Add your menu so callers can place orders' }); break
    case 'appointment-scheduler':
      if (!config.services?.length) gaps.push({ field: 'services', label: 'Services offered', description: 'List appointment types you offer' }); break
    case 'customer-service':
      if (!config.commonIssues?.length) gaps.push({ field: 'commonIssues', label: 'Common issues', description: 'Add known issues and resolutions' }); break
  }
  return gaps
}

function getPostOnboardingGreeting(employee: EmployeeInfo, gaps: ConfigGap[]): string {
  const phonePart = employee.phoneNumber ? ` on **${employee.phoneNumber}**` : ''
  let message = `**${employee.name} is live${phonePart}!**\n\n`
  if (gaps.length > 0) {
    message += `Here's what would make ${employee.name} even more effective:\n\n`
    gaps.forEach(gap => { message += `- **${gap.label}**: ${gap.description}\n` })
    message += `\nWant help adding any of these? Just ask!`
  } else {
    message += `${employee.name} is fully configured and ready to go. Try calling ${employee.phoneNumber || 'your number'} to hear them in action!`
  }
  return message
}

function getDashboardGreeting(onboardingStep: OnboardingStep): string {
  switch (onboardingStep) {
    case 1: return "Hi! I'm Maya. Let's set up your AI employee so you can forward your calls and see how it does. What type of business do you run?"
    case 2: return "Nice work — your AI employee is ready! Now let's connect your business phone. You'll forward your existing number to your AI — your customers won't notice any change.\n\nWant me to walk you through it?"
    case 3: return "Almost there — your calls are forwarding! Now let's make a test call to hear your AI in action.\n\nReady to dial in?"
    default: return "Hi! I'm Maya, your VoiceFly assistant. I can help you manage employees, check calls and messages, update settings, or troubleshoot anything.\n\nWhat can I help you with?"
  }
}

function getDashboardQuickActions(onboardingStep: OnboardingStep, justOnboarded: boolean, gaps: ConfigGap[]): string[] {
  if (justOnboarded && gaps.length > 0) {
    const gapActions = gaps.slice(0, 3).map(g => `Help me add ${g.label.toLowerCase()}`)
    return [...gapActions, 'How do I make a test call?']
  }
  switch (onboardingStep) {
    case 1: return ['I run a restaurant', 'I run a salon/spa', 'I run a medical practice', 'Other business type']
    case 2: return ['How do I forward my calls?', 'Will my customers see a different number?', 'How long does forwarding take?']
    case 3: return ['What should I test on the call?', 'How do I fix the greeting?', 'What happens after the test?']
    default: return ['View my call log', 'Check my messages', 'Update business hours', 'Manage employees']
  }
}

// ─── Maya Avatar ────────────────────────────────────────────────────────────

function MayaAvatar({ size = 'md', speaking = false }: { size?: 'sm' | 'md' | 'lg'; speaking?: boolean }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  return (
    <div className={`relative flex-shrink-0 ${sizes[size]}`}>
      {speaking && (
        <>
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
          <span className="absolute inset-0 rounded-full ring-2 ring-blue-400 opacity-60" />
        </>
      )}
      <img src="/maya-avatars/holo-d1.png" alt="Maya" className="w-full h-full rounded-full object-cover object-top border-2 border-blue-400/50" />
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-[#0f131d]" />
    </div>
  )
}

// ─── Unified MayaChat Component ─────────────────────────────────────────────

const MayaChat = forwardRef<MayaChatRef, MayaChatProps>(({ mode, autoOpenForNewUser = false }, ref) => {
  const pathname = usePathname()
  const isDashboard = mode === 'dashboard'

  // ── UI state ──
  const [isOpen, setIsOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── Public mode state ──
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', businessType: '' })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [trialUrl, setTrialUrl] = useState<string | null>(null)
  const [showIntroNotification, setShowIntroNotification] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)
  const chatSessionId = useRef<string>(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36)
  )

  // ── Dashboard mode state ──
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('done')
  const [onboardingLoaded, setOnboardingLoaded] = useState(false)
  const [justOnboarded, setJustOnboarded] = useState(false)
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [configGaps, setConfigGaps] = useState<ConfigGap[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const hasAutoOpened = useRef(false)
  const [initialGreetingSet, setInitialGreetingSet] = useState(false)

  // ── Derived ──
  const isOnboarding = isDashboard && onboardingStep !== 'done' && !justOnboarded
  const isSpeakingAny = isDashboard ? isSpeaking : playingAudioId !== null

  // ══════════════════════════════════════════════════════════════════════════
  // useChat HOOK — handles streaming, messages, and status
  // ══════════════════════════════════════════════════════════════════════════

  const getAuthHeaders = useCallback(async () => {
    if (!isDashboard) return {}
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }, [isDashboard])

  const { messages, setMessages, sendMessage: chatSendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: async () => await getAuthHeaders(),
      body: {
        context: isDashboard ? 'dashboard' : 'public',
        ...(isDashboard ? { businessId, currentPage: pathname } : { sessionId: chatSessionId.current }),
      },
    }),
    onFinish: ({ message }) => {
      // Check for lead capture signal in public mode
      if (!isDashboard && message.parts) {
        const textContent = message.parts.filter(p => p.type === 'text').map(p => p.text).join('')
        if (textContent.includes('[SUGGEST_TRIAL]') && !leadSubmitted) {
          setShowLeadCapture(true)
        }
      }

      // Check metadata for onboarding step updates
      const metadata = message.metadata as any
      if (metadata?.onboardingStep !== undefined && metadata.onboardingStep !== onboardingStep) {
        setOnboardingStep(metadata.onboardingStep as OnboardingStep)
      }

      // Dashboard: auto-speak responses
      if (isDashboard && isSpeakerOn && message.parts) {
        const text = message.parts.filter(p => p.type === 'text').map(p => p.text).join('')
        if (text) speakResponse(text)
      }
    },
  } as UseChatOptions)

  const isTyping = status === 'streaming' || status === 'submitted'

  // ── Ref API ──
  useImperativeHandle(ref, () => ({
    openWithMessage: (text: string) => {
      setIsOpen(true)
      setTimeout(() => handleSend(text), 100)
    },
  }))

  // ── Send wrapper ──
  const handleSend = useCallback((text: string) => {
    if (!text.trim() || isTyping) return

    // Public demo mode detection
    if (!isDashboard) {
      const lower = text.toLowerCase()
      if (lower.includes('demo') || lower.includes('show me') || lower.includes('example')) setIsDemoMode(true)
    }

    chatSendMessage({ text })
  }, [isDashboard, isTyping, chatSendMessage])

  // ── Input state (separate from useChat which manages messages) ──
  const [input, setInput] = useState('')

  // ── Auto-scroll ──
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showLeadCapture])

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC MODE INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isDashboard || initialGreetingSet) return
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      parts: [{ type: 'text', text: "Hi! I'm Maya, VoiceFly's AI assistant — and a live demo of what an AI employee feels like.\n\nWhat kind of business do you run?" }],
      createdAt: new Date(),
    } as any])
    setInitialGreetingSet(true)
  }, [isDashboard, initialGreetingSet, setMessages])

  // Public intro notification
  useEffect(() => {
    if (isDashboard) return
    const showTimer = setTimeout(() => { if (!isOpen) setShowIntroNotification(true) }, 5000)
    const hideTimer = setTimeout(() => setShowIntroNotification(false), 13000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [isDashboard, isOpen])

  useEffect(() => {
    if (!isDashboard && isOpen) setShowIntroNotification(false)
  }, [isDashboard, isOpen])

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD MODE INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isDashboard) return

    const id = localStorage.getItem('authenticated_business_id')
    setBusinessId(id)

    const onboardedEmployeeId = localStorage.getItem('voicefly_just_onboarded')
    if (onboardedEmployeeId) {
      localStorage.removeItem('voicefly_just_onboarded')
      setJustOnboarded(true)
    }

    if (!id) { setOnboardingStep('done'); setOnboardingLoaded(true); return }

    supabase.auth.getSession().then(() => Promise.all([
      supabase.from('phone_employees').select('id, name, phone_number, job_type, job_config').eq('business_id', id).eq('is_active', true),
      supabase.from('employee_calls').select('*', { count: 'exact', head: true }).eq('business_id', id),
    ])).then(([{ data: employees }, { count: callCount }]) => {
      const emps = employees || []
      const hasPhone = emps.some((e: any) => e.phone_number)
      const hasCalls = (callCount ?? 0) > 0
      let step: OnboardingStep
      if (emps.length === 0) step = 1
      else if (!hasPhone) step = 2
      else if (!hasCalls) step = 3
      else step = 'done'
      setOnboardingStep(step)

      if (emps.length > 0) {
        const emp = emps[0] as any
        const info: EmployeeInfo = { id: emp.id, name: emp.name, jobType: emp.job_type, phoneNumber: emp.phone_number || null, jobConfig: emp.job_config || {} }
        setEmployeeInfo(info)
        setConfigGaps(detectConfigGaps(info))
      }
      setOnboardingLoaded(true)
    }).catch(() => { setOnboardingStep('done'); setOnboardingLoaded(true) })
  }, [isDashboard])

  // Dashboard greeting
  useEffect(() => {
    if (!isDashboard || !onboardingLoaded || initialGreetingSet) return
    let greeting: string
    if (justOnboarded && employeeInfo) greeting = getPostOnboardingGreeting(employeeInfo, configGaps)
    else greeting = getDashboardGreeting(onboardingStep)
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      parts: [{ type: 'text', text: greeting }],
      createdAt: new Date(),
    } as any])
    setInitialGreetingSet(true)
  }, [isDashboard, onboardingLoaded, onboardingStep, justOnboarded, employeeInfo, configGaps, setMessages, initialGreetingSet])

  // Dashboard auto-open
  useEffect(() => {
    if (!isDashboard || !onboardingLoaded || hasAutoOpened.current) return
    const hasSeenRecently = (() => {
      const lastSeen = localStorage.getItem('maya_welcome_seen')
      if (!lastSeen) return false
      return (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60) < 24
    })()
    const shouldAutoOpen = justOnboarded || (onboardingStep === 1 && (autoOpenForNewUser || !hasSeenRecently))
    if (shouldAutoOpen) {
      hasAutoOpened.current = true
      const timer = setTimeout(() => { setIsOpen(true); localStorage.setItem('maya_welcome_seen', new Date().toISOString()) }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isDashboard, onboardingLoaded, onboardingStep, justOnboarded, autoOpenForNewUser])

  // ══════════════════════════════════════════════════════════════════════════
  // VOICE I/O
  // ══════════════════════════════════════════════════════════════════════════

  const toggleListening = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'; recognition.interimResults = true; recognition.continuous = false
    recognitionRef.current = recognition
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false)
        if (transcript.trim()) handleSend(transcript.trim())
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start(); setIsListening(true)
  }, [isListening, handleSend])

  const speakResponse = useCallback(async (text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    try {
      setIsSpeaking(true)
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) { setIsSpeaking(false); return }
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); audioRef.current = null }
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(audioUrl); audioRef.current = null }
      await audio.play()
    } catch { setIsSpeaking(false) }
  }, [])

  const playAudio = useCallback(async (messageId: string, text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; if (playingAudioId === messageId) { setPlayingAudioId(null); return } }
    setAudioLoading(messageId); setPlayingAudioId(null)
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) throw new Error('TTS failed')
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.onended = () => { setPlayingAudioId(null); URL.revokeObjectURL(audioUrl) }
      audio.onerror = () => { setPlayingAudioId(null); setAudioLoading(null); URL.revokeObjectURL(audioUrl) }
      audioRef.current = audio; setAudioLoading(null); setPlayingAudioId(messageId); await audio.play()
    } catch { setAudioLoading(null); setPlayingAudioId(null) }
  }, [playingAudioId])

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC LEAD CAPTURE
  // ══════════════════════════════════════════════════════════════════════════

  const submitLead = async () => {
    if (!leadForm.email.trim()) return
    setLeadSubmitting(true)
    try {
      await fetch('/api/chatbot-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadForm.email, name: leadForm.name, businessType: leadForm.businessType, sessionId: chatSessionId.current }) })
    } catch { /* fail silently */ }
    setLeadSubmitting(false); setLeadSubmitted(true); setShowLeadCapture(false)

    const firstName = leadForm.name?.split(' ')[0] || ''
    try { localStorage.setItem('voicefly_lead_context', JSON.stringify({ email: leadForm.email, name: leadForm.name, firstName })) } catch {}

    const params = new URLSearchParams()
    params.set('email', leadForm.email)
    if (leadForm.name) params.set('name', leadForm.name)
    setTrialUrl(`/signup?${params.toString()}`)
  }

  // ── Helper: extract text from message parts ──
  const getMessageText = (msg: any): string => {
    if (typeof msg.content === 'string') return msg.content
    if (msg.parts) return msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
    return ''
  }

  // ── Helper: check for tool parts in message (AI SDK v6: type is 'tool-<toolName>') ──
  const getToolParts = (msg: any) => {
    if (!msg.parts) return []
    return msg.parts.filter((p: any) => isToolUIPart(p))
  }

  // ── Derived ──
  const quickActions = isDashboard ? getDashboardQuickActions(onboardingStep, justOnboarded, configGaps) : PUBLIC_QUICK_QUESTIONS
  const postOnboardingChecklist = isDashboard && justOnboarded && employeeInfo ? [
    { label: 'Employee created', done: true },
    { label: 'Phone number assigned', done: !!employeeInfo.phoneNumber },
    { label: 'Test call made', done: false },
    { label: 'Profile complete', done: configGaps.length === 0 },
  ] : null

  const userMessageCount = messages.filter(m => m.role === 'user').length

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* Public: floating badge */}
      {!isDashboard && !isOpen && !showIntroNotification && (
        <div className="fixed bottom-28 right-6 z-50 animate-bounce">
          <div className="bg-brand-primary text-brand-on px-4 py-2.5 rounded-full sonic-shadow flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-medium">Talk to Maya — Our AI sales agent!</span>
          </div>
        </div>
      )}

      {/* Public: intro notification */}
      {!isDashboard && showIntroNotification && !isOpen && (
        <div className="fixed bottom-28 right-6 z-50 animate-slide-up">
          <div className="bg-surface-high rounded-xl sonic-shadow p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <MayaAvatar size="md" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary mb-0.5">Hi, I&apos;m Maya!</p>
                <p className="text-xs text-text-muted leading-relaxed">The AI employee this page is about. Ask me anything!</p>
              </div>
              <button onClick={() => setShowIntroNotification(false)} className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 rounded-full transition-all duration-300 ${isDashboard ? 'p-4 shadow-lg' : 'sonic-shadow hover:scale-105'}`}
      >
        {isOpen ? (
          isDashboard ? (
            <div className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full p-0"><X className="h-6 w-6" /></div>
          ) : (
            <div className="h-14 w-14 rounded-full bg-surface-high flex items-center justify-center hover:bg-surface-highest transition-colors"><X className="h-6 w-6 text-text-secondary" /></div>
          )
        ) : isDashboard ? (
          <div className="relative bg-gray-900 text-white hover:bg-gray-800 rounded-full p-0">
            <Bot className="h-6 w-6" />
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 ${justOnboarded || isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
          </div>
        ) : (
          <div className="relative h-14 w-14">
            <img src="/maya-avatars/holo-d1.png" alt="Chat with Maya" className="h-14 w-14 rounded-full object-cover object-top border-2 border-blue-400 ring-2 ring-brand-primary/50" />
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-[#0f131d]" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-40 w-96 flex flex-col overflow-hidden ${
            isDashboard ? 'bg-white rounded-2xl shadow-2xl border border-gray-200' : 'bg-surface-med rounded-xl sonic-shadow'
          }`}
          style={{ height: isDashboard && (isOnboarding || postOnboardingChecklist) ? '620px' : isDashboard ? '560px' : '580px' }}
        >
          {/* Header */}
          {isDashboard ? (
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg"><Bot className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-sm">Maya</h3>
                  <p className="text-xs text-gray-400">{justOnboarded ? 'Setup Complete' : isOnboarding ? 'Setup Guide' : 'Your VoiceFly Assistant'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => { setIsSpeakerOn(!isSpeakerOn); if (isSpeakerOn && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsSpeaking(false) } }}
                  className={`p-1.5 rounded-lg transition-colors ${isSpeakerOn ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title={isSpeakerOn ? 'Mute Maya' : 'Enable voice responses'}>
                  {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <span className="flex items-center space-x-1.5 text-xs text-gray-400">
                  <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-pulse' : justOnboarded || isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
                  <span>{isSpeaking ? 'Speaking' : justOnboarded ? 'Live' : isOnboarding ? 'Onboarding' : 'Online'}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-low p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <MayaAvatar size="md" speaking={isSpeakingAny} />
                <div>
                  <h3 className="font-semibold text-base text-text-primary font-[family-name:var(--font-manrope)]">Maya</h3>
                  <p className="text-xs text-text-muted">{isSpeakingAny ? 'Speaking...' : isDemoMode ? 'Live Demo Active' : 'VoiceFly AI Assistant'}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="h-2 w-2 bg-green-400 rounded-full" /><span>Online 24/7</span></span>
                {isDemoMode && <span className="text-[10px] bg-brand-primary/20 text-brand-light px-2 py-0.5 rounded-full font-medium">DEMO</span>}
              </div>
            </div>
          )}

          {/* Dashboard: post-onboarding checklist */}
          {isDashboard && postOnboardingChecklist && (
            <div className="bg-gray-800 px-4 py-3 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Your progress</p>
              <div className="space-y-1">
                {postOnboardingChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.done ? <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" /> : <Circle className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />}
                    <span className={`text-[11px] ${item.done ? 'text-green-400' : 'text-gray-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard: onboarding progress bar */}
          {isDashboard && isOnboarding && !postOnboardingChecklist && (
            <div className="bg-gray-800 px-4 py-3 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Getting started</p>
              <div className="flex items-center gap-2">
                {ONBOARDING_STEPS.map((s, i) => {
                  const isDone = typeof onboardingStep === 'number' && onboardingStep > s.step
                  const isCurrent = onboardingStep === s.step
                  return (
                    <div key={s.step} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-1.5 ${isCurrent || isDone ? 'opacity-100' : 'opacity-40'}`}>
                        {isDone ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" /> :
                          <div className={`h-4 w-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${isCurrent ? 'border-blue-400 text-blue-400' : 'border-gray-500 text-gray-500'}`}>{s.step}</div>}
                        <span className={`text-[10px] whitespace-nowrap ${isCurrent ? 'text-blue-400 font-medium' : isDone ? 'text-green-400' : 'text-gray-500'}`}>{s.label}</span>
                      </div>
                      {i < ONBOARDING_STEPS.length - 1 && <div className={`h-px flex-1 ${isDone ? 'bg-green-400/50' : 'bg-gray-600'}`} />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDashboard ? 'bg-gray-50' : 'bg-surface'}`}>
            {messages.map(msg => {
              const text = getMessageText(msg)
              const toolParts = getToolParts(msg)

              // Render tool invocations as action confirmations (dashboard)
              if (isDashboard && toolParts.length > 0) {
                return (
                  <div key={msg.id}>
                    {toolParts.map((tp: any, i: number) => {
                      if (tp.state !== 'output-available' || !tp.output?.success) return null
                      return (
                        <div key={`${msg.id}-tool-${i}`} className="flex justify-start mb-2">
                          <div className="max-w-[82%] rounded-xl px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{tp.output.message || 'Action completed'}</span>
                          </div>
                        </div>
                      )
                    })}
                    {text && (
                      <div className="flex justify-start">
                        <div className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm bg-surface-low text-text-primary">
                          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-text-primary leading-relaxed prose-invert">
                            <ReactMarkdown>{text.replace('[SUGGEST_TRIAL]', '').trim()}</ReactMarkdown>
                          </div>
                          <div className="text-[10px] mt-1 text-text-muted">{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!isDashboard && msg.role === 'assistant' && <MayaAvatar size="sm" speaking={playingAudioId === msg.id} />}

                  <div className={`max-w-[${isDashboard ? '82' : '78'}%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-brand-on' + (!isDashboard ? ' rounded-br-sm' : '')
                      : isDashboard
                      ? 'bg-surface-low text-text-primary'
                      : 'bg-surface-low text-text-primary rounded-bl-sm'
                  }`}>
                    {isDashboard && msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-text-primary leading-relaxed prose-invert">
                        <ReactMarkdown>{text.replace('[SUGGEST_TRIAL]', '').trim()}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="leading-relaxed whitespace-pre-line">{text.replace('[SUGGEST_TRIAL]', '').trim()}</div>
                    )}
                    <div className={`text-[10px] mt-1 ${msg.role === 'user' && !isDashboard ? 'text-white/60' : 'text-text-muted'}`}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {!isDashboard && msg.role === 'assistant' && (
                    <button onClick={() => playAudio(msg.id, text)} disabled={audioLoading === msg.id}
                      className={`flex-shrink-0 p-1.5 rounded-full transition-all ${playingAudioId === msg.id ? 'bg-brand-primary text-brand-on' : 'bg-surface-high text-text-muted hover:bg-surface-highest hover:text-brand-light'} ${audioLoading === msg.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Hear Maya speak">
                      {audioLoading === msg.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playingAudioId === msg.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                {!isDashboard && <MayaAvatar size="sm" />}
                <div className={`bg-surface-low rounded-2xl ${!isDashboard ? 'rounded-bl-sm' : ''} px-4 py-3`}>
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {userMessageCount === 0 && (
            <div className={`px-4 pb-2 flex-shrink-0 ${isDashboard ? 'bg-gray-50 border-t border-gray-100' : 'bg-surface border-t border-[rgba(65,71,84,0.15)]'}`}>
              <p className={`text-xs mb-2 mt-2 ${isDashboard ? 'text-gray-400' : 'text-text-muted'}`}>
                {isDashboard ? (justOnboarded ? 'Next steps:' : isOnboarding ? 'Quick actions:' : 'Quick help:') : 'Common questions:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((q, i) => (
                  <button key={i} onClick={() => { handleSend(q); setInput('') }} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    isDashboard
                      ? justOnboarded || isOnboarding ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      : 'bg-surface-high text-brand-light hover:bg-surface-highest'
                  }`}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {/* Public: trial CTA */}
          {!isDashboard && trialUrl && leadSubmitted && (
            <div className="mx-3 mb-3 flex-shrink-0">
              <a href={trialUrl} className="flex items-center justify-center gap-2 w-full bg-brand-primary hover:bg-[#0060d0] text-brand-on text-sm font-semibold py-3 rounded-lg transition-all">
                Forward Your Calls to AI <ChevronRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-text-muted text-center mt-1.5">Your number stays the same - No credit card needed</p>
            </div>
          )}

          {/* Public: lead capture */}
          {!isDashboard && showLeadCapture && !leadSubmitted && (
            <div className="mx-3 mb-3 p-4 bg-surface-high rounded-lg flex-shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Forward your calls to AI</p>
                  <p className="text-xs text-text-muted mt-0.5">Free for 14 days — live in 2 minutes</p>
                </div>
                <button onClick={() => setShowLeadCapture(false)} className="text-text-muted hover:text-text-primary mt-0.5"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2">
                <input type="text" placeholder="Your name" value={leadForm.name} onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full text-sm bg-surface-highest text-text-primary placeholder-text-muted rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none" />
                <input type="email" placeholder="Work email *" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full text-sm bg-surface-highest text-text-primary placeholder-text-muted rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                  onKeyDown={e => { if (e.key === 'Enter') submitLead() }} />
                <button onClick={submitLead} disabled={!leadForm.email.trim() || leadSubmitting}
                  className="w-full bg-brand-primary hover:bg-[#0060d0] text-brand-on text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {leadSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Started Free <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-3 flex-shrink-0 ${isDashboard ? 'border-t border-gray-200 bg-white' : 'border-t border-[rgba(65,71,84,0.15)] bg-surface-low'}`}>
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); setInput('') } }}
                placeholder={
                  isListening ? 'Listening...' :
                  isDashboard && (isOnboarding || justOnboarded) ? 'Ask Maya anything about setup...' :
                  isDashboard ? 'Ask me anything...' :
                  isDemoMode ? 'Interact as a customer calling in...' :
                  'Ask me anything...'
                }
                rows={1}
                disabled={isTyping || isListening}
                className={isDashboard
                  ? `flex-1 resize-none border rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm disabled:opacity-50 ${isListening ? 'border-red-300 bg-red-50' : 'border-gray-300'}`
                  : 'flex-1 resize-none bg-surface-highest text-text-primary placeholder-text-muted rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 text-sm disabled:opacity-50 border-none'
                }
              />
              {isDashboard && (
                <button onClick={toggleListening} disabled={isTyping}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${isListening ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={isListening ? 'Stop listening' : 'Voice input'}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              <button onClick={() => { handleSend(input); setInput('') }} disabled={!input.trim() || isTyping}
                className={`p-2 rounded-${isDashboard ? 'xl' : 'lg'} transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${
                  isDashboard ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-brand-primary text-brand-on hover:bg-[#0060d0]'
                }`}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            {!isDashboard && isDemoMode && (
              <button onClick={() => setIsDemoMode(false)} className="mt-1.5 text-[11px] text-brand-light hover:text-brand-primary transition-colors">Exit demo mode</button>
            )}
          </div>
        </div>
      )}
    </>
  )
})

MayaChat.displayName = 'MayaChat'
export default MayaChat
export type { MayaChatRef }
