'use client'
// v2
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Vapi from '@vapi-ai/web'
import Link from 'next/link'

// ============================================
// INDUSTRY CONFIG
// ============================================

const INDUSTRIES = {
  dental: {
    id: 'dental',
    label: 'Dental Office',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_DENTAL || '',
    persona: 'Aria',
    tagline: 'AI Receptionist',
    color: 'blue',
    bgClass: 'from-blue-50 to-sky-50',
    accentClass: 'bg-blue-600 hover:bg-blue-700',
    ringClass: 'ring-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    emoji: '🦷',
    description: 'See how Aria handles appointment scheduling, insurance questions, and patient intake.',
    examples: ['Schedule a cleaning', 'Ask about whitening', 'New patient questions'],
  },
  salon: {
    id: 'salon',
    label: 'Hair Salon',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_SALON || '',
    persona: 'Mia',
    tagline: 'AI Receptionist',
    color: 'pink',
    bgClass: 'from-pink-50 to-rose-50',
    accentClass: 'bg-pink-500 hover:bg-pink-600',
    ringClass: 'ring-pink-500',
    badgeClass: 'bg-pink-100 text-pink-700',
    emoji: '✂️',
    description: 'Mia books appointments, explains services, and matches clients with the right stylist.',
    examples: ['Book a haircut', 'Ask about color services', 'Check availability'],
  },
  auto: {
    id: 'auto',
    label: 'Auto Shop',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_AUTO || '',
    persona: 'Jake',
    tagline: 'AI Service Advisor',
    color: 'orange',
    bgClass: 'from-orange-50 to-amber-50',
    accentClass: 'bg-orange-500 hover:bg-orange-600',
    ringClass: 'ring-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700',
    emoji: '🔧',
    description: 'Jake handles service inquiries, estimates, and scheduling for your auto shop.',
    examples: ['Schedule an oil change', 'Ask about brakes', 'Get an estimate'],
  },
  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_RESTAURANT || '',
    persona: 'Sofia',
    tagline: 'AI Hostess',
    color: 'amber',
    bgClass: 'from-amber-50 to-yellow-50',
    accentClass: 'bg-amber-600 hover:bg-amber-700',
    ringClass: 'ring-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
    emoji: '🍽️',
    description: 'Sofia takes reservations, answers menu questions, and makes guests feel welcome.',
    examples: ['Make a reservation', 'Ask about the menu', 'Party of 8 inquiry'],
  },
  law: {
    id: 'law',
    label: 'Law Firm',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_LAW || '',
    persona: 'Maxwell',
    tagline: 'AI Legal Intake',
    color: 'slate',
    bgClass: 'from-slate-50 to-gray-50',
    accentClass: 'bg-slate-700 hover:bg-slate-800',
    ringClass: 'ring-slate-500',
    badgeClass: 'bg-slate-100 text-slate-700',
    emoji: '⚖️',
    description: 'Maxwell screens potential clients, gathers case info, and schedules consultations.',
    examples: ['Car accident case', 'Divorce inquiry', 'Free consultation'],
  },
  nonprofit: {
    id: 'nonprofit',
    label: 'Nonprofit',
    assistantId: process.env.NEXT_PUBLIC_DEMO_ASSISTANT_NONPROFIT || '1142c85b-3e64-4ccb-b776-ab5515056834',
    persona: 'Maya',
    tagline: 'AI Community Coordinator',
    color: 'emerald',
    bgClass: 'from-emerald-50 to-green-50',
    accentClass: 'bg-emerald-600 hover:bg-emerald-700',
    ringClass: 'ring-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    emoji: '🤝',
    description: 'See how Maya handles donor calls, volunteer signups, program inquiries, and event questions for a community nonprofit.',
    examples: ['Donate to the program', 'Sign up to volunteer', 'Youth program inquiry'],
  },
}

type IndustryKey = keyof typeof INDUSTRIES
type CallStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface TranscriptMessage {
  role: 'user' | 'assistant'
  text: string
}

// ============================================
// INNER PAGE CONTENT (uses useSearchParams)
// ============================================

function DemoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawIndustry = searchParams.get('industry') || 'dental'
  const industryKey: IndustryKey = rawIndustry in INDUSTRIES ? rawIndustry as IndustryKey : 'dental'
  const industry = INDUSTRIES[industryKey]

  const [status, setStatus] = useState<CallStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [callEnded, setCallEnded] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const latestTranscriptRef = useRef<TranscriptMessage[]>([])

  useEffect(() => {
    latestTranscriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Cleanup on unmount or industry change
  useEffect(() => {
    return () => {
      if (vapiRef.current) { try { vapiRef.current.stop() } catch {} }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [industryKey])

  const handleIndustryChange = useCallback((key: IndustryKey) => {
    // Stop any active call before switching
    if (vapiRef.current) { try { vapiRef.current.stop() } catch {} }
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('idle')
    setTranscript([])
    setCallEnded(false)
    setErrorMessage(null)
    setCallDuration(0)
    router.push(`/demo?industry=${key}`)
  }, [router])

  const startCall = useCallback(async () => {
    const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!vapiKey) {
      setErrorMessage('Voice demo not configured. Please try again later.')
      return
    }

    if (!industry.assistantId) {
      setErrorMessage('Demo assistant not configured for this industry.')
      return
    }

    setStatus('connecting')
    setErrorMessage(null)
    setTranscript([])
    setCallEnded(false)

    try {
      const vapi = new Vapi(vapiKey)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setStatus('active')
        setCallDuration(0)
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1)
        }, 1000)
      })

      vapi.on('call-end', () => {
        setStatus('ended')
        setCallEnded(true)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      })

      vapi.on('message', (message: any) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const role = message.role === 'user' ? 'user' : 'assistant'
          setTranscript(prev => [...prev, { role, text: message.transcript }])
        }
      })

      vapi.on('error', (error: any) => {
        const msg = error?.error?.message?.[0] || error?.message || 'Call error'
        if (msg.toLowerCase().includes('microphone') || msg.toLowerCase().includes('notallowed') || msg.toLowerCase().includes('permission')) {
          setErrorMessage('Microphone access is required. Please allow microphone access and try again.')
        } else {
          setErrorMessage('Something went wrong. Please try again.')
        }
        setStatus('error')
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      })

      await vapi.start(industry.assistantId)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect. Please try again.')
      setStatus('error')
    }
  }, [industry.assistantId])

  const endCall = useCallback(() => {
    if (vapiRef.current) { try { vapiRef.current.stop() } catch {} }
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted
      vapiRef.current.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className={`min-h-screen bg-gradient-to-br ${industry.bgClass}`}>
      {/* Header */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">VoiceFly</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Demo</span>
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-gray-500 mb-2">Live Interactive Demo</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Talk to an AI employee. Right now.
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Pick an industry, hit the button, and have a real conversation. No signup needed.
          </p>
        </div>

        {/* Industry Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {Object.values(INDUSTRIES).map(ind => (
            <button
              key={ind.id}
              onClick={() => handleIndustryChange(ind.id as IndustryKey)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                industryKey === ind.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{ind.emoji}</span>
              {ind.label}
            </button>
          ))}
        </div>

        {/* Main Demo Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-2xl mx-auto">
          {/* Persona Header */}
          <div className={`bg-gradient-to-r ${industry.bgClass} px-6 py-5 border-b border-gray-100`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-2xl ring-2 ring-white">
                {industry.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-900 text-lg">{industry.persona}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${industry.badgeClass}`}>
                    {industry.tagline}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{industry.description}</p>
              </div>
            </div>
          </div>

          {/* Call Status / Transcript */}
          <div className="px-6 py-5 min-h-[200px]">
            {/* Idle State */}
            {status === 'idle' && (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-4">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {industry.examples.map(example => (
                    <span
                      key={example}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                    >
                      "{example}"
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Connecting */}
            {status === 'connecting' && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Connecting to {industry.persona}...</p>
              </div>
            )}

            {/* Active call - status bar */}
            {status === 'active' && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500">Live call with {industry.persona}</span>
                <span className="ml-auto text-xs font-mono text-gray-400">{formatTime(callDuration)}</span>
              </div>
            )}

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="block text-xs font-medium mb-0.5 opacity-60">
                        {msg.role === 'user' ? 'You' : industry.persona}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="px-6 pb-5">
            {status === 'idle' || status === 'error' ? (
              <button
                onClick={startCall}
                className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg ${industry.accentClass} flex items-center justify-center gap-2`}
              >
                <PhoneIcon />
                Talk to {industry.persona}
              </button>
            ) : status === 'connecting' ? (
              <div className="w-full py-3.5 rounded-xl bg-gray-200 text-gray-500 font-medium text-sm flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Connecting...
              </div>
            ) : status === 'active' ? (
              <div className="flex gap-3">
                <button
                  onClick={toggleMute}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isMuted
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isMuted ? <MicOffIcon /> : <MicIcon />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  onClick={endCall}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneOffIcon />
                  End Call
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Post-call CTA */}
        {callEnded && (
          <div className="mt-6 max-w-2xl mx-auto bg-gray-900 rounded-2xl p-6 text-center text-white">
            <div className="text-2xl mb-2">That was {industry.persona}.</div>
            <p className="text-gray-300 mb-5 text-sm">
              That exact experience — answering calls, scheduling, routing, qualifying leads —
              is what your business gets from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Get my AI employee — free trial
              </Link>
              <button
                onClick={() => { setCallEnded(false); setStatus('idle'); setTranscript([]) }}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium text-sm hover:bg-gray-600 transition-colors"
              >
                Try another demo
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-500">No credit card. 5 minutes to set up.</p>
          </div>
        )}

        {/* Industry grid - try another */}
        {!callEnded && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {Object.values(INDUSTRIES)
              .filter(ind => ind.id !== industryKey)
              .slice(0, 3)
              .map(ind => (
                <button
                  key={ind.id}
                  onClick={() => handleIndustryChange(ind.id as IndustryKey)}
                  className="bg-white rounded-xl p-4 text-left border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="text-xl mb-1">{ind.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{ind.persona}</div>
                  <div className="text-xs text-gray-500">{ind.label}</div>
                </button>
              ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-12 pb-8">
          <p className="text-sm text-gray-500 mb-3">
            Ready to put an AI employee to work for you?
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
          >
            Start free trial →
          </Link>
          <p className="mt-2 text-xs text-gray-400">14-day trial. No credit card required.</p>
        </div>
      </main>
    </div>
  )
}

// ============================================
// ICONS
// ============================================

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
    </svg>
  )
}

function PhoneOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M15.22 3.22a.75.75 0 011.06 0L18 4.94l1.72-1.72a.75.75 0 111.06 1.06L19.06 6l1.72 1.72a.75.75 0 01-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 11-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 010-1.06zM1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18z" />
      <path d="M8.25 4.5a3.75 3.75 0 017.5 0v4.94l-7.5-7.5V4.5zM6.75 11.25a.75.75 0 00-1.5 0v1.5a6.751 6.751 0 006 6.709v2.291h-3a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-3v-2.291a6.718 6.718 0 003.62-1.474l-1.082-1.082A5.25 5.25 0 016.75 12.75v-1.5z" />
    </svg>
  )
}

// ============================================
// DEFAULT EXPORT (with Suspense for useSearchParams)
// ============================================

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    }>
      <DemoPageContent />
    </Suspense>
  )
}
