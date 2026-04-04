"use client"

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Bot, CheckCircle, Circle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

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

const ONBOARDING_STEPS = [
  { step: 1, label: 'Create employee' },
  { step: 2, label: 'Get a number' },
  { step: 3, label: 'Test call' },
]

function detectConfigGaps(employee: EmployeeInfo): ConfigGap[] {
  const gaps: ConfigGap[] = []
  const config = employee.jobConfig || {}

  if (!config.greeting) {
    gaps.push({ field: 'greeting', label: 'Custom greeting', description: 'Personalize how callers are welcomed' })
  }
  if (!config.businessHours && !config.hoursNote) {
    gaps.push({ field: 'businessHours', label: 'Business hours', description: 'Let callers know when you\'re open' })
  }
  if (!config.address) {
    gaps.push({ field: 'address', label: 'Business address', description: 'Help callers find your location' })
  }
  if (!config.transferNumber) {
    gaps.push({ field: 'transferNumber', label: 'Escalation phone', description: 'Where to transfer calls needing a human' })
  }

  switch (employee.jobType) {
    case 'receptionist':
      if (!config.commonQuestions?.length) {
        gaps.push({ field: 'commonQuestions', label: 'Common Q&A', description: 'Add FAQs so callers get instant answers' })
      }
      break
    case 'order-taker':
      if (!config.menuItems?.length) {
        gaps.push({ field: 'menuItems', label: 'Menu items', description: 'Add your menu so callers can place orders' })
      }
      break
    case 'appointment-scheduler':
      if (!config.services?.length) {
        gaps.push({ field: 'services', label: 'Services offered', description: 'List appointment types you offer' })
      }
      break
    case 'customer-service':
      if (!config.commonIssues?.length) {
        gaps.push({ field: 'commonIssues', label: 'Common issues', description: 'Add known issues and resolutions' })
      }
      break
  }

  return gaps
}

function getPostOnboardingGreeting(employee: EmployeeInfo, gaps: ConfigGap[]): string {
  const phonePart = employee.phoneNumber ? ` on **${employee.phoneNumber}**` : ''
  let message = `**${employee.name} is live${phonePart}!**\n\n`

  if (gaps.length > 0) {
    message += `Here's what would make ${employee.name} even more effective:\n\n`
    gaps.forEach(gap => {
      message += `- **${gap.label}**: ${gap.description}\n`
    })
    message += `\nWant help adding any of these? Just ask!`
  } else {
    message += `${employee.name} is fully configured and ready to go. Try calling ${employee.phoneNumber || 'your number'} to hear them in action!`
  }

  return message
}

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

function getQuickActions(onboardingStep: OnboardingStep, justOnboarded: boolean, gaps: ConfigGap[]): string[] {
  if (justOnboarded && gaps.length > 0) {
    const gapActions = gaps.slice(0, 3).map(g => `Help me add ${g.label.toLowerCase()}`)
    return [...gapActions, 'How do I make a test call?']
  }
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
  const [justOnboarded, setJustOnboarded] = useState(false)
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [configGaps, setConfigGaps] = useState<ConfigGap[]>([])
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

  // Load businessId, check just-onboarded flag, fetch onboarding state on mount
  useEffect(() => {
    const id = localStorage.getItem('authenticated_business_id')
    setBusinessId(id)

    // Check if user just completed onboarding
    const onboardedEmployeeId = localStorage.getItem('voicefly_just_onboarded')
    if (onboardedEmployeeId) {
      localStorage.removeItem('voicefly_just_onboarded')
      setJustOnboarded(true)
    }

    if (!id) {
      setOnboardingStep('done')
      setOnboardingLoaded(true)
      return
    }

    // Ensure session is restored before RLS-guarded queries
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

      // Load the first employee's details for Maya context
      if (emps.length > 0) {
        const emp = emps[0] as any
        const info: EmployeeInfo = {
          id: emp.id,
          name: emp.name,
          jobType: emp.job_type,
          phoneNumber: emp.phone_number || null,
          jobConfig: emp.job_config || {},
        }
        setEmployeeInfo(info)
        setConfigGaps(detectConfigGaps(info))
      }

      setOnboardingLoaded(true)
    }).catch(() => {
      setOnboardingStep('done')
      setOnboardingLoaded(true)
    })
  }, [])

  // Set initial greeting once onboarding state is known
  useEffect(() => {
    if (!onboardingLoaded) return
    let greeting: string
    if (justOnboarded && employeeInfo) {
      greeting = getPostOnboardingGreeting(employeeInfo, configGaps)
    } else {
      greeting = getGreeting(onboardingStep)
    }
    setMessages([{
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }])
  }, [onboardingLoaded, onboardingStep, justOnboarded, employeeInfo, configGaps])

  // Auto-open for new users
  useEffect(() => {
    if (!onboardingLoaded || hasAutoOpened.current) return

    const shouldAutoOpen =
      justOnboarded ||
      (onboardingStep === 1 && (autoOpenForNewUser || !hasSeenWelcomeRecently()))

    if (shouldAutoOpen) {
      hasAutoOpened.current = true
      const timer = setTimeout(() => {
        setIsOpen(true)
        markWelcomeSeen()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [onboardingLoaded, onboardingStep, justOnboarded, autoOpenForNewUser])

  const hasSeenWelcomeRecently = (): boolean => {
    const lastSeen = localStorage.getItem('maya_welcome_seen')
    if (!lastSeen) return false
    const hoursSince = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60)
    return hoursSince < 24
  }

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
          context: justOnboarded ? 'post-onboarding' : 'dashboard',
          businessId,
          currentPage: pathname,
          employeeContext: employeeInfo ? {
            name: employeeInfo.name,
            jobType: employeeInfo.jobType,
            phoneNumber: employeeInfo.phoneNumber,
            configGaps: configGaps.map(g => g.label),
          } : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        console.error('[Maya] API error:', res.status, data.error)
      }

      if (data.onboardingStep !== undefined && data.onboardingStep !== onboardingStep) {
        setOnboardingStep(data.onboardingStep as OnboardingStep)
      }

      // Handle executed actions — show inline confirmations
      if (data.actions?.length > 0) {
        for (const action of data.actions) {
          if (action.result?.success) {
            const actionMsg = action.tool === 'create_employee'
              ? `Created **${action.result.name}** (${action.result.job_type?.replace(/-/g, ' ')})`
              : action.tool === 'provision_phone_number'
              ? `Provisioned phone number: **${action.result.phone_number}**`
              : action.tool === 'update_employee_config'
              ? `Updated employee configuration`
              : action.result.message || `Action completed`

            setMessages(prev => [
              ...prev,
              {
                id: `action-${Date.now()}-${action.tool}`,
                role: 'assistant',
                content: `[ACTION] ${actionMsg}`,
                timestamp: new Date(),
              },
            ])
          }
        }

        // Refresh onboarding state after actions
        const id = localStorage.getItem('authenticated_business_id')
        if (id) {
          supabase.auth.getSession().then(() =>
            supabase.from('phone_employees').select('id, phone_number').eq('business_id', id).eq('is_active', true)
          ).then(({ data: emps }) => {
            if (emps && emps.length > 0 && onboardingStep === 1) setOnboardingStep(2)
            if (emps?.some((e: any) => e.phone_number) && onboardingStep === 2) setOnboardingStep(3)
          }).catch(() => {})
        }
      }

      // Handle navigation
      if (data.navigate) {
        const { push } = await import('next/navigation').then(m => ({ push: m.useRouter })).catch(() => ({ push: null }))
        // Use window.location for navigation since we can't use hooks here
        setTimeout(() => {
          window.location.href = data.navigate
        }, 1500)
      }

      const responseText = data.response || data.error || "Sorry, I ran into an issue. Please try again."
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        },
      ])

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

  const isOnboarding = onboardingStep !== 'done' && !justOnboarded
  const quickActions = getQuickActions(onboardingStep, justOnboarded, configGaps)

  // Post-onboarding checklist items
  const postOnboardingChecklist = justOnboarded && employeeInfo ? [
    { label: 'Employee created', done: true },
    { label: 'Phone number assigned', done: !!employeeInfo.phoneNumber },
    { label: 'Test call made', done: false },
    { label: 'Profile complete', done: configGaps.length === 0 },
  ] : null

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
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 ${
              justOnboarded ? 'bg-blue-400 animate-pulse' : isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
            }`} />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: (isOnboarding || postOnboardingChecklist) ? '620px' : '560px' }}
        >
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Maya</h3>
                <p className="text-xs text-gray-400">
                  {justOnboarded ? 'Setup Complete' : isOnboarding ? 'Setup Guide' : 'Your VoiceFly Assistant'}
                </p>
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
                <span className={`h-2 w-2 rounded-full ${
                  isSpeaking ? 'bg-blue-400 animate-pulse' : justOnboarded ? 'bg-green-400' : isOnboarding ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
                }`} />
                <span>{isSpeaking ? 'Speaking' : justOnboarded ? 'Live' : isOnboarding ? 'Onboarding' : 'Online'}</span>
              </span>
            </div>
          </div>

          {/* Post-Onboarding Checklist */}
          {postOnboardingChecklist && (
            <div className="bg-gray-800 px-4 py-3 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Your progress</p>
              <div className="space-y-1">
                {postOnboardingChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.done ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] ${item.done ? 'text-green-400' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Progress Bar (only for pre-live onboarding) */}
          {isOnboarding && !postOnboardingChecklist && (
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
            {messages.map(msg => {
              const isAction = msg.content.startsWith('[ACTION]')
              const displayContent = isAction ? msg.content.replace('[ACTION] ', '') : msg.content

              if (isAction) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[82%] rounded-xl px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <div className="prose prose-sm max-w-none prose-strong:text-emerald-400 leading-relaxed">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-primary text-brand-on'
                        : 'bg-surface-low text-text-primary'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-text-primary leading-relaxed prose-invert">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line leading-relaxed">{displayContent}</div>
                    )}
                    <div className="text-[10px] mt-1 text-text-muted">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-low rounded-2xl px-4 py-3">
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
          {messages.length <= 1 && (
            <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2 mt-2">
                {justOnboarded ? 'Next steps:' : isOnboarding ? 'Quick actions:' : 'Quick help:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                      justOnboarded || isOnboarding
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
                placeholder={isListening ? "Listening..." : isOnboarding || justOnboarded ? "Ask Maya anything about setup..." : "Ask me anything..."}
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
