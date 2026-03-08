"use client"

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Bot, CheckCircle, Circle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type OnboardingStep = 1 | 2 | 3 | 'done'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ONBOARDING_STEPS = [
  { step: 1, label: 'Create employee' },
  { step: 2, label: 'Get a number' },
  { step: 3, label: 'Test call' },
]

function getGreeting(onboardingStep: OnboardingStep): string {
  switch (onboardingStep) {
    case 1:
      return "Hi! I'm Maya. Let's get your first AI employee set up. What type of business do you run?"
    case 2:
      return "Nice work — your first employee is created! Next step is giving them a phone number so they can start taking calls.\n\nWant me to walk you through provisioning a number?"
    case 3:
      return "Almost there — your employee has a phone number! Now let's make a test call to hear them in action.\n\nReady to dial in?"
    default:
      return "Hi! I'm Maya, your VoiceFly assistant. I can help you manage employees, check calls and messages, update settings, or troubleshoot anything.\n\nWhat can I help you with?"
  }
}

function getQuickActions(onboardingStep: OnboardingStep): string[] {
  switch (onboardingStep) {
    case 1:
      return ["I run a restaurant", "I run a salon/spa", "I run a medical practice", "Other business type"]
    case 2:
      return ["How do I add a phone number?", "What's the difference between call-only and calls+SMS?", "How much does a number cost?"]
    case 3:
      return ["What should I test on the call?", "How do I fix the greeting?", "What happens after the test?"]
    default:
      return ["View my call log", "Check my messages", "Update business hours", "Manage employees"]
  }
}

interface DashboardAssistantProps {
  autoOpenForNewUser?: boolean
}

export default function DashboardAssistant({ autoOpenForNewUser = false }: DashboardAssistantProps = {}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('done')
  const [onboardingLoaded, setOnboardingLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAutoOpened = useRef(false)

  // Load businessId and fetch onboarding state on mount
  useEffect(() => {
    const id = localStorage.getItem('authenticated_business_id')
    setBusinessId(id)
    if (!id) {
      setOnboardingStep('done')
      setOnboardingLoaded(true)
      return
    }

    // Fetch employee count + phone status to determine onboarding step
    Promise.all([
      supabase.from('phone_employees').select('name, phone_number').eq('business_id', id),
      supabase.from('employee_calls').select('*', { count: 'exact', head: true }).eq('business_id', id),
    ]).then(([{ data: employees }, { count: callCount }]) => {
      const emps = employees || []
      const hasPhone = emps.some((e: any) => e.phone_number)
      const hasCalls = (callCount ?? 0) > 0

      let step: OnboardingStep
      if (emps.length === 0) step = 1
      else if (!hasPhone) step = 2
      else if (!hasCalls) step = 3
      else step = 'done'

      setOnboardingStep(step)
      setOnboardingLoaded(true)
    }).catch(() => {
      setOnboardingStep('done')
      setOnboardingLoaded(true)
    })
  }, [])

  // Set initial greeting once onboarding state is known
  useEffect(() => {
    if (!onboardingLoaded) return
    setMessages([{
      id: '1',
      role: 'assistant',
      content: getGreeting(onboardingStep),
      timestamp: new Date(),
    }])
  }, [onboardingLoaded, onboardingStep])

  // Auto-open for new users (onboarding step 1 only)
  useEffect(() => {
    if (!onboardingLoaded || hasAutoOpened.current) return

    // Only auto-open if:
    // 1. User is on step 1 (no employees)
    // 2. autoOpenForNewUser prop is true OR hasn't seen welcome in last 24 hours
    const shouldAutoOpen = onboardingStep === 1 && (
      autoOpenForNewUser || !hasSeenWelcomeRecently()
    )

    if (shouldAutoOpen) {
      hasAutoOpened.current = true
      // Wait 3 seconds before auto-opening
      const timer = setTimeout(() => {
        setIsOpen(true)
        markWelcomeSeen()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [onboardingLoaded, onboardingStep, autoOpenForNewUser])

  // Check if user has seen welcome in last 24 hours
  const hasSeenWelcomeRecently = (): boolean => {
    const lastSeen = localStorage.getItem('maya_welcome_seen')
    if (!lastSeen) return false

    const lastSeenTime = new Date(lastSeen).getTime()
    const now = new Date().getTime()
    const hoursSince = (now - lastSeenTime) / (1000 * 60 * 60)

    return hoursSince < 24
  }

  // Mark welcome as seen
  const markWelcomeSeen = () => {
    localStorage.setItem('maya_welcome_seen', new Date().toISOString())
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setInput(transcript)

      // Auto-send on final result
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false)
        if (transcript.trim()) {
          sendMessage(transcript.trim())
        }
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }

  const speakResponse = async (text: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      setIsSpeaking(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        setIsSpeaking(false)
        return
      }
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      await audio.play()
    } catch {
      setIsSpeaking(false)
    }
  }

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
          message: text,
          history,
          context: 'dashboard',
          businessId,
          currentPage: pathname,
        }),
      })
      const data = await res.json()

      // Update onboarding step if API returned a fresher value
      if (data.onboardingStep !== undefined && data.onboardingStep !== onboardingStep) {
        setOnboardingStep(data.onboardingStep as OnboardingStep)
      }

      const responseText = data.response || "Sorry, I ran into an issue. Please try again."
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        },
      ])

      // Speak the response if speaker is on
      if (isSpeakerOn && responseText) {
        speakResponse(responseText)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const isOnboarding = onboardingStep !== 'done'
  const quickActions = getQuickActions(onboardingStep)

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Bot className="h-6 w-6" />
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 ${isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200" style={{ height: isOnboarding ? '620px' : '560px' }}>
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Maya</h3>
                <p className="text-xs text-gray-400">{isOnboarding ? 'Setup Guide' : 'Your VoiceFly Assistant'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsSpeakerOn(!isSpeakerOn)
                  if (isSpeakerOn && audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current = null
                    setIsSpeaking(false)
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors ${isSpeakerOn ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title={isSpeakerOn ? 'Mute Maya' : 'Enable voice responses'}
              >
                {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <span className="flex items-center space-x-1.5 text-xs text-gray-400">
                <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-blue-400 animate-pulse' : isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
                <span>{isSpeaking ? 'Speaking' : isOnboarding ? 'Onboarding' : 'Online'}</span>
              </span>
            </div>
          </div>

          {/* Onboarding Progress Bar */}
          {isOnboarding && (
            <div className="bg-gray-800 px-4 py-3 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Getting started</p>
              <div className="flex items-center gap-2">
                {ONBOARDING_STEPS.map((s, i) => {
                  const isDone = typeof onboardingStep === 'number' && onboardingStep > s.step
                  const isCurrent = onboardingStep === s.step
                  return (
                    <div key={s.step} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-1.5 ${isCurrent ? 'opacity-100' : isDone ? 'opacity-100' : 'opacity-40'}`}>
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <div className={`h-4 w-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${isCurrent ? 'border-blue-400 text-blue-400' : 'border-gray-500 text-gray-500'}`}>
                            {s.step}
                          </div>
                        )}
                        <span className={`text-[10px] whitespace-nowrap ${isCurrent ? 'text-blue-400 font-medium' : isDone ? 'text-green-400' : 'text-gray-500'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < ONBOARDING_STEPS.length - 1 && (
                        <div className={`h-px flex-1 ${isDone ? 'bg-green-400/50' : 'bg-gray-600'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                  <div className="text-[10px] mt-1 text-gray-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
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

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2 mt-2">{isOnboarding ? 'Quick actions:' : 'Quick help:'}</p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                      isOnboarding
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
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
                placeholder={isListening ? "Listening..." : isOnboarding ? "Ask Maya anything about setup..." : "Ask me anything..."}
                rows={1}
                disabled={isTyping || isListening}
                className={`flex-1 resize-none border rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm disabled:opacity-50 ${isListening ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
              <button
                onClick={toggleListening}
                disabled={isTyping}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-gray-900 text-white p-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
