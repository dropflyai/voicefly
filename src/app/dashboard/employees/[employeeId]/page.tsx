'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../../../components/Layout'
import ProtectedRoute from '../../../../components/ProtectedRoute'
import VoicePicker from '../../../../components/VoicePicker'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../../lib/multi-tenant-auth'
import { supabase } from '../../../../lib/supabase-client'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhoneArrowDownLeftIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'

// ============================================
// TYPES
// ============================================

interface TrainingChange {
  id: string
  type: string
  action: string
  data: any
  accepted: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  changes?: TrainingChange[]
}

// ============================================
// HELPERS
// ============================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  }
}

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
  'Pacific/Auckland',
]

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ============================================
// COLLAPSIBLE SECTION
// ============================================

function Section({ title, defaultOpen = false, children, badge, locked, lockedMessage }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string
  locked?: boolean
  lockedMessage?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`border rounded-lg ${locked ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => !locked && setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${locked ? 'cursor-not-allowed' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{badge}</span>
          )}
          {locked && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Upgrade to unlock</span>
          )}
        </div>
        {locked ? (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
        ) : open ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {locked && (
        <div className="px-4 pb-3 text-xs text-gray-500">{lockedMessage || 'Available on paid plans.'}</div>
      )}
      {open && !locked && <div className="px-4 pb-4 space-y-4 border-t border-gray-100">{children}</div>}
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function EmployeeEditPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  // Loading state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Employee data (the "clean" copy from server)
  const [original, setOriginal] = useState<any>(null)

  // Editable fields
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [voiceName, setVoiceName] = useState('')
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null)
  const [voiceSpeed, setVoiceSpeed] = useState(1.0)
  const [voiceStability, setVoiceStability] = useState(0.8)
  const [tone, setTone] = useState<string>('professional')
  const [enthusiasm, setEnthusiasm] = useState<string>('medium')
  const [formality, setFormality] = useState<string>('semi-formal')
  const [customInstructions, setCustomInstructions] = useState('')
  const [callHandlingRules, setCallHandlingRules] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [businessHours, setBusinessHours] = useState<Record<string, { start: string; end: string } | null>>({
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: null,
    sunday: null,
  })
  const [faqs, setFaqs] = useState<{ question: string; answer: string; keywords: string[] }[]>([])
  const [services, setServices] = useState<{ name: string; duration: number; description?: string }[]>([])
  const [transferDestinations, setTransferDestinations] = useState<{
    id: string
    label: string
    phoneNumber: string
    extension: string
    keywords: string[]
    isDefault: boolean
  }[]>([])

  // Lead qualifier specific state
  const [qualifyingQuestions, setQualifyingQuestions] = useState<{ id: string; question: string; field: string; required: boolean }[]>([])
  const [hotLeadCriteria, setHotLeadCriteria] = useState<string[]>([])
  const [hotLeadAction, setHotLeadAction] = useState<'transfer' | 'book' | 'callback'>('book')
  const [hotLeadTransferNumber, setHotLeadTransferNumber] = useState('')
  const [discoveryCallLabel, setDiscoveryCallLabel] = useState('')
  const [warmLeadResponse, setWarmLeadResponse] = useState('')
  const [coldLeadResponse, setColdLeadResponse] = useState('')
  const [disqualifyingAnswers, setDisqualifyingAnswers] = useState<{ questionId: string; answer: string }[]>([])

  // Appointment scheduler specific state
  const [apptTypes, setApptTypes] = useState<{ id: string; name: string; duration: number; price?: number; description?: string }[]>([])
  const [bookingRules, setBookingRules] = useState({ minNoticeHours: 2, maxAdvanceDays: 60, bufferMinutes: 0, sameDayBooking: true })
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string; specialties: string[] }[]>([])
  const [cancellationPolicy, setCancellationPolicy] = useState('')

  // Business / subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
  const [subscriptionTier, setSubscriptionTier] = useState<string>('')
  const isTrial = subscriptionStatus === 'trial'
  const isStarter = subscriptionTier === 'starter' && subscriptionStatus === 'active'
  const isStarterOrTrial = isTrial || isStarter

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Hub tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'configure' | 'calls' | 'messages'>('overview')
  const [calls, setCalls] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [integrations, setIntegrations] = useState<any[]>([])
  const [callStats, setCallStats] = useState({ total: 0, today: 0, avgDuration: 0, missed: 0 })
  const [configGaps, setConfigGaps] = useState<string[]>([])
  const [testCallPhone, setTestCallPhone] = useState('')
  const [testCallStatus, setTestCallStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle')
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)
  const [copiedPhone, setCopiedPhone] = useState(false)

  // Training chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatListening, setChatListening] = useState(false)
  const [chatSpeakerOn, setChatSpeakerOn] = useState(false)
  const [chatSpeaking, setChatSpeaking] = useState(false)
  const chatRecognitionRef = useRef<any>(null)
  const chatAudioRef = useRef<HTMLAudioElement | null>(null)

  // Dirty tracking
  const isDirty = useCallback(() => {
    if (!original) return false
    const jc = original.jobConfig || {}
    return (
      name !== (original.name || '') ||
      greeting !== (jc.greeting || '') ||
      voiceId !== (original.voice?.voiceId || '') ||
      tone !== (original.personality?.tone || 'professional') ||
      enthusiasm !== (original.personality?.enthusiasm || 'medium') ||
      formality !== (original.personality?.formality || 'semi-formal') ||
      customInstructions !== (jc.customInstructions || '') ||
      callHandlingRules !== (jc.callHandlingRules || '') ||
      restrictions !== (jc.restrictions || '') ||
      businessDescription !== (jc.businessDescription || '') ||
      timezone !== (original.schedule?.timezone || '') ||
      JSON.stringify(businessHours) !== JSON.stringify(original.schedule?.businessHours || {}) ||
      JSON.stringify(faqs) !== JSON.stringify(jc.faqs || []) ||
      JSON.stringify(services) !== JSON.stringify(jc.services || []) ||
      JSON.stringify(transferDestinations) !== JSON.stringify(jc.transferDestinations || []) ||
      JSON.stringify(qualifyingQuestions) !== JSON.stringify(jc.qualifyingQuestions || []) ||
      JSON.stringify(hotLeadCriteria) !== JSON.stringify(jc.hotLeadCriteria || []) ||
      hotLeadAction !== (jc.hotLeadAction || 'book') ||
      hotLeadTransferNumber !== (jc.transferNumber || '') ||
      discoveryCallLabel !== (jc.discoveryCallLabel || '') ||
      warmLeadResponse !== (jc.warmLeadResponse || '') ||
      coldLeadResponse !== (jc.coldLeadResponse || '') ||
      JSON.stringify(disqualifyingAnswers) !== JSON.stringify(jc.disqualifyingAnswers || []) ||
      JSON.stringify(apptTypes) !== JSON.stringify(jc.apptTypes || []) ||
      JSON.stringify(bookingRules) !== JSON.stringify(jc.bookingRules || { minNoticeHours: 2, maxAdvanceDays: 60, bufferMinutes: 0, sameDayBooking: true }) ||
      JSON.stringify(staffMembers) !== JSON.stringify(jc.staffMembers || []) ||
      cancellationPolicy !== (jc.cancellationPolicy || '')
    )
  }, [original, name, greeting, voiceId, tone, enthusiasm, formality, customInstructions, callHandlingRules, restrictions, businessDescription, timezone, businessHours, faqs, services, transferDestinations, qualifyingQuestions, hotLeadCriteria, hotLeadAction, hotLeadTransferNumber, discoveryCallLabel, warmLeadResponse, coldLeadResponse, disqualifyingAnswers, apptTypes, bookingRules, staffMembers, cancellationPolicy])

  function detectConfigGaps(emp: any): string[] {
    const jc = emp.jobConfig || {}
    const gaps: string[] = []
    if (!emp.phoneNumber) gaps.push('Phone number not assigned')
    if (!jc.greeting) gaps.push('Custom greeting not set')
    if (!jc.businessDescription) gaps.push('Business description missing')
    if (!emp.schedule?.businessHours) gaps.push('Business hours not configured')
    if (emp.jobType === 'receptionist' && (!jc.services || jc.services.length === 0)) gaps.push('No services listed')
    if (emp.jobType === 'lead-qualifier' && (!jc.qualifyingQuestions || jc.qualifyingQuestions.length === 0)) gaps.push('No qualifying questions')
    if (emp.jobType === 'appointment-scheduler' && (!jc.apptTypes || jc.apptTypes.length === 0)) gaps.push('No appointment types')
    return gaps
  }

  // ============================================
  // LOAD EMPLOYEE
  // ============================================

  useEffect(() => {
    async function load() {
      const businessId = getSecureBusinessId()
      if (!businessId) {
        redirectToLoginIfUnauthenticated()
        return
      }
      try {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/phone-employees/${employeeId}?businessId=${businessId}`, { headers })
        if (!res.ok) {
          setError('Failed to load employee')
          return
        }
        const data = await res.json()
        const emp = data.employee
        if (!emp) {
          setError('Employee not found')
          return
        }
        setOriginal(emp)
        populateForm(emp)

        // Config gaps
        setConfigGaps(detectConfigGaps(emp))

        // Fetch calls for this employee
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const [callsRes, messagesRes] = await Promise.all([
          supabase.from('employee_calls').select('*').eq('employee_id', employeeId).order('started_at', { ascending: false }).limit(50),
          supabase.from('phone_messages').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),
        ])
        const empCalls = callsRes.data || []
        setCalls(empCalls)
        setMessages(messagesRes.data || [])
        // Compute stats
        const today = empCalls.filter((c: any) => new Date(c.started_at) >= todayStart).length
        const durations = empCalls.filter((c: any) => c.duration).map((c: any) => c.duration as number)
        const avgDuration = durations.length ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0
        const missed = empCalls.filter((c: any) => c.status === 'missed' || c.status === 'no-answer').length
        setCallStats({ total: empCalls.length, today, avgDuration, missed })

        // Fetch integrations
        try {
          const intRes = await fetch(`/api/integrations?businessId=${businessId}`, { headers })
          if (intRes.ok) {
            const intData = await intRes.json()
            setIntegrations(intData.integrations || [])
          }
        } catch { /* ignore */ }

        // Fetch subscription status for feature gating
        const { data: { session } } = await supabase.auth.getSession()
        const bizRes = await fetch(`/api/business?businessId=${businessId}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        if (bizRes.ok) {
          const { business: bizData } = await bizRes.json()
          if (bizData) {
            setSubscriptionStatus(bizData.subscription_status || '')
            setSubscriptionTier(bizData.subscription_tier || '')
          }
        }
      } catch {
        setError('Failed to load employee')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [employeeId])

  function populateForm(emp: any) {
    const jc = emp.jobConfig || {}
    setName(emp.name || '')
    setGreeting(jc.greeting || '')
    setVoiceId(emp.voice?.voiceId || '')
    setVoiceName(emp.voice?.voiceId || '')
    setVoicePreviewUrl(null)
    setVoiceSpeed(emp.voice?.speed ?? 1.0)
    setVoiceStability(emp.voice?.stability ?? 0.8)
    setTone(emp.personality?.tone || 'professional')
    setEnthusiasm(emp.personality?.enthusiasm || 'medium')
    setFormality(emp.personality?.formality || 'semi-formal')
    setCustomInstructions(jc.customInstructions || '')
    setCallHandlingRules(jc.callHandlingRules || '')
    setRestrictions(jc.restrictions || '')
    setBusinessDescription(jc.businessDescription || '')
    setTimezone(emp.schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
    setBusinessHours(emp.schedule?.businessHours || {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: null,
      sunday: null,
    })
    setFaqs(jc.faqs || [])
    setServices(jc.services || [])

    // Lead qualifier fields
    if (emp.jobType === 'lead-qualifier') {
      setQualifyingQuestions(jc.qualifyingQuestions || [
        { id: 'interest', question: 'What brings you to us today — what are you looking to accomplish?', field: 'interest', required: true },
        { id: 'timeline', question: 'What does your timeline look like?', field: 'timeline', required: true },
        { id: 'budget', question: 'Do you have a rough budget in mind?', field: 'budget', required: false },
      ])
      setHotLeadCriteria(jc.hotLeadCriteria || ['Ready to move forward within 30 days', 'Has a defined budget', 'Is the decision maker'])
      setHotLeadAction(jc.hotLeadAction || 'book')
      setHotLeadTransferNumber(jc.transferNumber || '')
      setDiscoveryCallLabel(jc.discoveryCallLabel || '')
      setWarmLeadResponse(jc.warmLeadResponse || '')
      setColdLeadResponse(jc.coldLeadResponse || '')
      setDisqualifyingAnswers(jc.disqualifyingAnswers || [])
    }

    // Appointment scheduler fields
    if (emp.jobType === 'appointment-scheduler') {
      setApptTypes(jc.apptTypes || [])
      setBookingRules(jc.bookingRules || { minNoticeHours: 2, maxAdvanceDays: 60, bufferMinutes: 0, sameDayBooking: true })
      setStaffMembers(jc.staffMembers || [])
      setCancellationPolicy(jc.cancellationPolicy || '')
    }

    // Load new transferDestinations format, or migrate old transferRules format
    if (jc.transferDestinations?.length) {
      setTransferDestinations(jc.transferDestinations)
    } else if (jc.transferRules?.length) {
      // Migrate old format
      setTransferDestinations(jc.transferRules.map((r: any, i: number) => ({
        id: `migrated-${i}`,
        label: r.destination === 'specific_person' ? (r.personName || 'Contact') : r.destination,
        phoneNumber: r.phoneNumber || '',
        extension: '',
        keywords: r.keywords || [],
        isDefault: false,
      })))
    } else {
      setTransferDestinations([])
    }
  }

  // ============================================
  // SAVE
  // ============================================

  const handleSave = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const headers = await getAuthHeaders()
      const jc = original?.jobConfig || {}

      const isLeadQualifier = original?.jobType === 'lead-qualifier'
      const isApptScheduler = original?.jobType === 'appointment-scheduler'
      const updatedJobConfig = {
        ...jc,
        greeting,
        customInstructions: customInstructions || undefined,
        callHandlingRules: callHandlingRules || undefined,
        restrictions: restrictions || undefined,
        businessDescription: businessDescription || undefined,
        faqs,
        services,
        transferDestinations,
        // Lead qualifier fields
        ...(isLeadQualifier && {
          qualifyingQuestions,
          hotLeadCriteria,
          hotLeadAction,
          transferNumber: hotLeadTransferNumber || undefined,
          discoveryCallLabel: discoveryCallLabel || undefined,
          warmLeadResponse: warmLeadResponse || undefined,
          coldLeadResponse: coldLeadResponse || undefined,
          disqualifyingAnswers,
        }),
        // Appointment scheduler fields
        ...(isApptScheduler && {
          apptTypes,
          bookingRules,
          staffMembers,
          cancellationPolicy: cancellationPolicy || undefined,
        }),
      }

      const updatedSchedule = {
        ...(original?.schedule || {}),
        timezone,
        businessHours,
      }

      const body: any = {
        businessId,
        jobConfig: updatedJobConfig,
        schedule: updatedSchedule,
        personality: { tone, enthusiasm, formality },
      }

      if (name !== original?.name) body.name = name
      if (voiceId !== original?.voice?.voiceId) {
        body.voice = {
          provider: '11labs',
          voiceId,
          speed: voiceSpeed,
          stability: voiceStability,
        }
      }

      const res = await fetch(`/api/phone-employees/${employeeId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success || data.employee) {
        setSaveSuccess(true)
        // Update original to new state
        const refreshHeaders = await getAuthHeaders()
        const refreshRes = await fetch(`/api/phone-employees/${employeeId}?businessId=${businessId}`, { headers: refreshHeaders })
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.employee) {
            setOriginal(refreshData.employee)
            populateForm(refreshData.employee)
          }
        }
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(data.error || 'Failed to save')
      }
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // TRAINING CHAT
  // ============================================

  const toggleChatListening = () => {
    if (chatListening) {
      chatRecognitionRef.current?.stop()
      setChatListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    chatRecognitionRef.current = recognition
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setChatInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setChatListening(false)
        if (transcript.trim()) sendTrainingMessage(transcript.trim())
      }
    }
    recognition.onerror = () => setChatListening(false)
    recognition.onend = () => setChatListening(false)
    recognition.start()
    setChatListening(true)
  }

  const speakChatResponse = async (text: string) => {
    if (chatAudioRef.current) { chatAudioRef.current.pause(); chatAudioRef.current = null }
    try {
      setChatSpeaking(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) { setChatSpeaking(false); return }
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      chatAudioRef.current = audio
      audio.onended = () => { setChatSpeaking(false); URL.revokeObjectURL(audioUrl); chatAudioRef.current = null }
      audio.onerror = () => { setChatSpeaking(false); URL.revokeObjectURL(audioUrl); chatAudioRef.current = null }
      await audio.play()
    } catch { setChatSpeaking(false) }
  }

  const sendTrainingMessage = async (overrideMessage?: string) => {
    const message = (overrideMessage || chatInput).trim()
    if (!message || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setChatLoading(true)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/ai/parse-training', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          currentConfig: {
            greeting,
            businessDescription,
            customInstructions,
            callHandlingRules,
            restrictions,
            faqs,
            services,
            transferDestinations,
          },
          jobType: original?.jobType || 'receptionist',
          context: {
            employeeName: name,
            industry: businessDescription || undefined,
            services: Array.isArray(services) ? services.map((s: any) => s.name).join(', ') : undefined,
          },
        }),
      })

      if (!res.ok) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Try again or edit the fields below directly.',
        }])
        return
      }

      const data = await res.json()
      const changes: TrainingChange[] = (data.changes || []).map((c: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        type: c.type,
        action: c.action,
        data: c.data,
        accepted: true,
      }))

      const reply = data.summary || 'Here are the changes I suggest:'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply, changes }])
      if (chatSpeakerOn) speakChatResponse(reply)
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Try editing the fields below directly.',
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const applyChanges = (changes: TrainingChange[]) => {
    const accepted = changes.filter(c => c.accepted)
    for (const change of accepted) {
      switch (change.type) {
        case 'faq':
          if (change.action === 'add' && change.data) {
            setFaqs(prev => [...prev, { question: change.data.question, answer: change.data.answer, keywords: change.data.keywords || [] }])
          }
          break
        case 'service':
          if (change.action === 'add' && change.data) {
            setServices(prev => [...prev, { name: change.data.name, duration: change.data.duration || 60, description: change.data.description }])
          }
          break
        case 'transferRule':
          if (change.action === 'add' && change.data) {
            setTransferDestinations(prev => [...prev, {
              id: `dest-${Date.now()}`,
              label: change.data.personName || change.data.destination || 'Contact',
              phoneNumber: change.data.phoneNumber || '',
              extension: '',
              keywords: change.data.keywords || [],
              isDefault: false,
            }])
          }
          break
        case 'customInstructions':
          if (change.action === 'append') {
            setCustomInstructions(prev => prev ? `${prev}\n${change.data.text}` : change.data.text)
          } else if (change.action === 'set') {
            setCustomInstructions(change.data.text)
          }
          break
        case 'callHandlingRules':
          if (change.action === 'append') {
            setCallHandlingRules(prev => prev ? `${prev}\n${change.data.text}` : change.data.text)
          } else if (change.action === 'set') {
            setCallHandlingRules(change.data.text)
          }
          break
        case 'restriction':
          if (change.action === 'add') {
            setRestrictions(prev => prev ? `${prev}\n${change.data.text}` : change.data.text)
          }
          break
        case 'greeting':
          if (change.action === 'set') {
            setGreeting(change.data.text)
          }
          break
        case 'businessDescription':
          if (change.action === 'set') {
            setBusinessDescription(change.data.text)
          } else if (change.action === 'append') {
            setBusinessDescription(prev => prev ? `${prev}\n${change.data.text}` : change.data.text)
          }
          break
      }
    }
  }

  // ============================================
  // ANALYZE CALL TRANSCRIPTS
  // ============================================

  const analyzeTranscripts = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId || analyzing) return
    setAnalyzing(true)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/ai/analyze-transcripts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to analyze transcripts' }))
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: errData.error === 'AI service not configured'
            ? 'AI analysis is not available right now. Please try again later.'
            : `Could not analyze transcripts: ${errData.error || 'Unknown error'}`,
        }])
        return
      }

      const data = await res.json()

      if (!data.suggestions || data.suggestions.length === 0) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.summary || 'No call transcripts found to analyze.',
        }])
        return
      }

      // Map API suggestions to TrainingChange[] format
      const changes: TrainingChange[] = data.suggestions.map((s: any, i: number) => ({
        id: `transcript-${Date.now()}-${i}`,
        type: s.type,
        action: s.action,
        data: s.data,
        accepted: true,
      }))

      // Build a descriptive message with insights
      const insights = data.insights || {}
      let content = data.summary || `Analyzed ${insights.totalCallsAnalyzed || 0} call transcripts.`
      if (insights.totalCallsAnalyzed) {
        content += `\n\nCalls analyzed: ${insights.totalCallsAnalyzed}`
      }
      if (insights.topTopics && insights.topTopics.length > 0) {
        content += `\nTop topics: ${insights.topTopics.join(', ')}`
      }
      if (insights.commonQuestions && insights.commonQuestions.length > 0) {
        content += `\nCommon questions: ${insights.commonQuestions.slice(0, 5).join('; ')}`
      }
      content += `\n\nI found ${changes.length} suggested change${changes.length === 1 ? '' : 's'}. Review and apply the ones you want:`

      // Add confidence/evidence info to change descriptions by enriching the data
      const enrichedChanges: TrainingChange[] = changes.map((c: TrainingChange, i: number) => {
        const suggestion = data.suggestions[i]
        const enrichedData = { ...c.data }
        if (suggestion.confidence) enrichedData._confidence = suggestion.confidence
        if (suggestion.evidence) enrichedData._evidence = suggestion.evidence
        return { ...c, data: enrichedData }
      })

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content,
        changes: enrichedChanges,
      }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong while analyzing transcripts. Please try again.',
      }])
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">Loading employee...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error || !original) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="text-red-600">{error || 'Employee not found'}</div>
            <button onClick={() => router.push('/dashboard/employees')} className="text-sm text-blue-600 hover:text-blue-800">
              Back to Employees
            </button>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  const jobLabel = original.jobType?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Employee'

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/dashboard/employees')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{original.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-gray-500 capitalize">{jobLabel}</span>
                {original.phoneNumber && (
                  <span className="text-xs text-gray-400">{original.phoneNumber}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {original.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            {([
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'configure', label: 'Configure', icon: Cog6ToothIcon },
              { id: 'calls', label: `Calls${callStats.total > 0 ? ` (${callStats.total})` : ''}`, icon: PhoneIcon },
              { id: 'messages', label: `Messages${messages.length > 0 ? ` (${messages.length})` : ''}`, icon: ChatBubbleLeftRightIcon },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'configure' && (<>
          {/* Training Chat */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  {isStarterOrTrial
                    ? `What do you need to train ${name} today?`
                    : `How can Maya help you train ${name} today?`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (chatSpeaking) { chatAudioRef.current?.pause(); chatAudioRef.current = null; setChatSpeaking(false) }
                  setChatSpeakerOn(v => !v)
                }}
                title={chatSpeakerOn ? 'Mute Maya' : 'Hear Maya speak'}
                className={`p-1.5 rounded-lg transition-colors ${chatSpeakerOn ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {chatSpeakerOn ? <SpeakerWaveIcon className="h-4 w-4" /> : <SpeakerXMarkIcon className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {isStarterOrTrial
                ? "Tell me about your business and I'll configure your employee for you."
                : "Describe what you want your employee to handle and I'll update their configuration."}
            </p>

            <div className="border border-gray-200 rounded-lg bg-gray-50">
              {/* Chat messages */}
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-gray-400">
                      Try: &quot;We&apos;re a dental office open 8-6. Never quote prices over the phone.&quot;
                    </p>
                    <button
                      type="button"
                      onClick={analyzeTranscripts}
                      disabled={analyzing || chatLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      {analyzing ? 'Analyzing transcripts...' : 'Analyze Call Transcripts'}
                    </button>
                    <p className="text-xs text-gray-400">
                      Auto-suggest configuration from your recent call recordings
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                    {msg.role === 'assistant' && (
                      <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                    )}
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-lg px-3 py-2`}>
                      {msg.role === 'assistant' && <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {/* Change confirmation cards */}
                      {msg.changes && msg.changes.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.changes.map((change) => (
                            <div key={change.id} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium text-gray-500 uppercase">{change.type}</span>
                                  <p className="text-sm text-gray-800 truncate">
                                    {formatChangeDescription(change)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatMessages(prev => prev.map((m, mi) => {
                                      if (mi !== i || !m.changes) return m
                                      return {
                                        ...m,
                                        changes: m.changes.map(c =>
                                          c.id === change.id ? { ...c, accepted: !c.accepted } : c
                                        ),
                                      }
                                    }))
                                  }}
                                  className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                                    change.accepted
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-400'
                                  }`}
                                >
                                  <CheckIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const msgChanges = msg.changes
                              if (msgChanges) applyChanges(msgChanges)
                            }}
                            className="w-full mt-1 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            Apply Selected Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start gap-2">
                    <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>
                      <p className="text-sm text-gray-400">Thinking...</p>
                    </div>
                  </div>
                )}
                {analyzing && (
                  <div className="flex justify-start gap-2">
                    <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>
                      <p className="text-sm text-gray-400">Analyzing call transcripts... This may take a moment.</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTrainingMessage() } }}
                    placeholder={chatListening ? 'Listening...' : isStarterOrTrial ? `Tell me about your business...` : `Tell me how you want ${name} to behave...`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={chatLoading || analyzing}
                  />
                  <button
                    type="button"
                    onClick={toggleChatListening}
                    disabled={chatLoading || analyzing}
                    title={chatListening ? 'Stop listening' : 'Speak to Maya'}
                    className={`px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chatListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <MicrophoneIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sendTrainingMessage()}
                    disabled={chatLoading || analyzing || !chatInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={analyzeTranscripts}
                  disabled={analyzing || chatLoading}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                  {analyzing ? 'Analyzing transcripts...' : 'Analyze Call Transcripts'}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Sections */}
          <div className="space-y-3 mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Configuration</h2>

            {/* Basic Info */}
            <Section title="Basic Info" defaultOpen={true}>
              <div className="pt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={40}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Greeting</label>
                  <textarea
                    value={greeting}
                    onChange={e => setGreeting(e.target.value)}
                    rows={2}
                    placeholder="Hello, thank you for calling..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </Section>

            {/* Voice */}
            <Section title="Voice" badge={voiceName || voiceId || undefined} locked={isStarterOrTrial} lockedMessage={isTrial ? "Upgrade to choose a custom voice for your AI employee." : "Upgrade to Pro to customize your AI's voice."}>
              <div className="pt-3">
                <VoicePicker
                  voiceId={voiceId}
                  voiceName={voiceName || voiceId}
                  voicePreviewUrl={voicePreviewUrl}
                  onSelect={v => {
                    setVoiceId(v.voiceId)
                    setVoiceName(v.voiceName)
                    setVoicePreviewUrl(v.voicePreviewUrl)
                  }}
                />
              </div>
            </Section>

            {/* Personality */}
            <Section title="Personality">
              <div className="pt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="warm">Warm</option>
                    <option value="casual">Casual</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enthusiasm</label>
                  <select
                    value={enthusiasm}
                    onChange={e => setEnthusiasm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formality</label>
                  <select
                    value={formality}
                    onChange={e => setFormality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="formal">Formal</option>
                    <option value="semi-formal">Semi-Formal</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Business Context */}
            <Section title="Business Context" badge={customInstructions ? 'Configured' : undefined}>
              <div className="pt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Your Business</label>
                  <p className="text-xs text-gray-500 mb-1">What should your employee know about your business? Services, specialties, location, etc.</p>
                  <textarea
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    rows={4}
                    placeholder="We are a family dental practice in downtown Austin specializing in cosmetic dentistry..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                {(original?.jobType === 'receptionist' || original?.jobType === 'customer-service' || original?.jobType === 'appointment-scheduler') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                    <textarea
                      value={businessDescription}
                      onChange={e => setBusinessDescription(e.target.value)}
                      rows={2}
                      placeholder="Short description used in the AI's system prompt..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Call Handling */}
            <Section title="Call Handling" badge={callHandlingRules ? 'Configured' : undefined}>
              <div className="pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Handling Rules</label>
                <p className="text-xs text-gray-500 mb-1">How should calls be handled? What should the employee prioritize?</p>
                <textarea
                  value={callHandlingRules}
                  onChange={e => setCallHandlingRules(e.target.value)}
                  rows={4}
                  placeholder="Always ask for the caller's name first. If someone asks for pricing, offer to schedule a consultation instead..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </Section>

            {/* Rules & Restrictions */}
            <Section title="Rules & Restrictions" badge={restrictions ? 'Configured' : undefined}>
              <div className="pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Things to Never Do</label>
                <p className="text-xs text-gray-500 mb-1">Hard rules your employee must follow. One per line.</p>
                <textarea
                  value={restrictions}
                  onChange={e => setRestrictions(e.target.value)}
                  rows={4}
                  placeholder="Never quote prices over the phone&#10;Never schedule appointments before 10am&#10;Never discuss competitor services"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </Section>

            {/* Services */}
            {(original?.jobType === 'receptionist' || original?.jobType === 'appointment-scheduler') && (
              <Section title="Services" badge={services.length > 0 ? `${services.length}` : undefined} locked={isStarterOrTrial} lockedMessage={isTrial ? "Upgrade to add custom services." : "Upgrade to Pro to add custom services."}>
                <div className="pt-3 space-y-3">
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={svc.name}
                          onChange={e => {
                            const updated = [...services]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setServices(updated)
                          }}
                          placeholder="Service name"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={svc.duration}
                            onChange={e => {
                              const updated = [...services]
                              updated[i] = { ...updated[i], duration: parseInt(e.target.value) || 30 }
                              setServices(updated)
                            }}
                            placeholder="Duration (min)"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-xs text-gray-500 self-center">minutes</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setServices(services.filter((_, j) => j !== i))}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setServices([...services, { name: '', duration: 60 }])}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PlusIcon className="h-4 w-4" /> Add Service
                  </button>
                </div>
              </Section>
            )}

            {/* FAQs */}
            <Section title="FAQs" badge={faqs.length > 0 ? `${faqs.length}` : undefined} locked={isStarterOrTrial} lockedMessage={isTrial ? "Upgrade to add custom FAQs." : "Upgrade to Pro to add custom FAQs."}>
              <div className="pt-3 space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={e => {
                            const updated = [...faqs]
                            updated[i] = { ...updated[i], question: e.target.value }
                            setFaqs(updated)
                          }}
                          placeholder="Question"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={e => {
                            const updated = [...faqs]
                            updated[i] = { ...updated[i], answer: e.target.value }
                            setFaqs(updated)
                          }}
                          placeholder="Answer"
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqs([...faqs, { question: '', answer: '', keywords: [] }])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Add FAQ
                </button>
              </div>
            </Section>

            {/* ===== LEAD QUALIFIER SECTIONS ===== */}
            {original?.jobType === 'lead-qualifier' && (<>

            {/* Qualifying Questions */}
            <Section title="Qualifying Questions" badge={qualifyingQuestions.length > 0 ? `${qualifyingQuestions.length}` : undefined}>
              <div className="pt-3 space-y-3">
                <p className="text-xs text-gray-500">These are the questions your AI weaves into the conversation to score each lead. Ask them in order of importance — the AI won't fire them mechanically but will gather the answers naturally.</p>
                {qualifyingQuestions.map((q, i) => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center mt-1">{i + 1}</span>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={q.question}
                          onChange={e => {
                            const updated = [...qualifyingQuestions]
                            updated[i] = { ...updated[i], question: e.target.value }
                            setQualifyingQuestions(updated)
                          }}
                          rows={2}
                          placeholder="e.g. What brings you to us today?"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                        <div className="flex items-center gap-3">
                          <select
                            value={q.field}
                            onChange={e => {
                              const updated = [...qualifyingQuestions]
                              updated[i] = { ...updated[i], field: e.target.value }
                              setQualifyingQuestions(updated)
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="interest">Interest / Need</option>
                            <option value="timeline">Timeline</option>
                            <option value="budget">Budget</option>
                            <option value="authority">Decision Maker</option>
                            <option value="pain_point">Pain Point</option>
                            <option value="company">Company / Industry</option>
                            <option value="location">Location</option>
                            <option value="custom">Custom</option>
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={e => {
                                const updated = [...qualifyingQuestions]
                                updated[i] = { ...updated[i], required: e.target.checked }
                                setQualifyingQuestions(updated)
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Required
                          </label>
                          <div className="flex gap-1 ml-auto">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => {
                                const updated = [...qualifyingQuestions]
                                ;[updated[i - 1], updated[i]] = [updated[i], updated[i - 1]]
                                setQualifyingQuestions(updated)
                              }}
                              className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >↑</button>
                            <button
                              type="button"
                              disabled={i === qualifyingQuestions.length - 1}
                              onClick={() => {
                                const updated = [...qualifyingQuestions]
                                ;[updated[i], updated[i + 1]] = [updated[i + 1], updated[i]]
                                setQualifyingQuestions(updated)
                              }}
                              className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >↓</button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQualifyingQuestions(qualifyingQuestions.filter((_, j) => j !== i))}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setQualifyingQuestions([...qualifyingQuestions, { id: `q-${Date.now()}`, question: '', field: 'custom', required: false }])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Add Question
                </button>
              </div>
            </Section>

            {/* Hot Lead Settings */}
            <Section title="Hot Lead Settings" badge={hotLeadCriteria.length > 0 ? 'Configured' : undefined}>
              <div className="pt-3 space-y-5">

                {/* Criteria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hot Lead Criteria</label>
                  <p className="text-xs text-gray-500 mb-2">A lead is "hot" if ANY of these apply. The AI scores the lead against these after the conversation.</p>
                  <div className="space-y-2">
                    {hotLeadCriteria.map((criterion, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-green-600 flex-shrink-0">✓</span>
                        <input
                          type="text"
                          value={criterion}
                          onChange={e => {
                            const updated = [...hotLeadCriteria]
                            updated[i] = e.target.value
                            setHotLeadCriteria(updated)
                          }}
                          placeholder="e.g. Ready to move forward within 30 days"
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setHotLeadCriteria(hotLeadCriteria.filter((_, j) => j !== i))}
                          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHotLeadCriteria([...hotLeadCriteria, ''])}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon className="h-4 w-4" /> Add Criterion
                    </button>
                  </div>
                </div>

                {/* Hot lead action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">When a Hot Lead is Identified</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'book', label: 'Book a Call', desc: 'Schedule a discovery call on the spot' },
                      { value: 'transfer', label: 'Transfer Now', desc: 'Live transfer to your sales team' },
                      { value: 'callback', label: 'Schedule Callback', desc: 'Pick a time for your team to call them' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setHotLeadAction(opt.value)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          hotLeadAction === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-sm font-medium mb-0.5 ${hotLeadAction === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transfer number — shown only when action = transfer */}
                {hotLeadAction === 'transfer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Transfer Number</label>
                    <p className="text-xs text-gray-500 mb-1">Hot leads will be live-transferred to this number.</p>
                    <input
                      type="tel"
                      value={hotLeadTransferNumber}
                      onChange={e => setHotLeadTransferNumber(e.target.value)}
                      placeholder="+15551234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Discovery call label — shown when action = book */}
                {hotLeadAction === 'book' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What to Call the Next Step</label>
                    <input
                      type="text"
                      value={discoveryCallLabel}
                      onChange={e => setDiscoveryCallLabel(e.target.value)}
                      placeholder="e.g. Free consultation, 15-min intro call, Strategy session"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">The AI will invite hot leads to book a &quot;{discoveryCallLabel || 'discovery call'}&quot;.</p>
                  </div>
                )}
              </div>
            </Section>

            {/* Lead Responses */}
            <Section title="Lead Response Scripts" badge={warmLeadResponse || coldLeadResponse ? 'Customized' : undefined}>
              <div className="pt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warm Lead Response</label>
                  <p className="text-xs text-gray-500 mb-1">What the AI says when a lead is interested but not quite ready. Should acknowledge their interest and set up a follow-up.</p>
                  <textarea
                    value={warmLeadResponse}
                    onChange={e => setWarmLeadResponse(e.target.value)}
                    rows={3}
                    placeholder="That sounds like a great fit for what we offer! I'll make sure someone from our team follows up with you soon..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cold Lead Response</label>
                  <p className="text-xs text-gray-500 mb-1">What the AI says when a lead isn't a fit right now. Should be kind, not dismissive — they may become a fit later.</p>
                  <textarea
                    value={coldLeadResponse}
                    onChange={e => setColdLeadResponse(e.target.value)}
                    rows={3}
                    placeholder="I appreciate you reaching out! Based on what you've shared, the timing might not be quite right yet. Feel free to reach back out when things change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </Section>

            {/* Disqualifying Answers */}
            <Section title="Instant Disqualifiers" badge={disqualifyingAnswers.length > 0 ? `${disqualifyingAnswers.length}` : undefined}>
              <div className="pt-3 space-y-3">
                <p className="text-xs text-gray-500">If a caller says something that immediately rules them out, the AI will score them cold and exit gracefully — without continuing to probe. Useful for budget floors, geography, or product fit issues.</p>
                {disqualifyingAnswers.map((dq, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Question topic</label>
                          <select
                            value={dq.questionId}
                            onChange={e => {
                              const updated = [...disqualifyingAnswers]
                              updated[i] = { ...updated[i], questionId: e.target.value }
                              setDisqualifyingAnswers(updated)
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a question</option>
                            {qualifyingQuestions.map(q => (
                              <option key={q.id} value={q.id}>{q.question.slice(0, 50)}{q.question.length > 50 ? '…' : ''}</option>
                            ))}
                            <option value="budget">Budget</option>
                            <option value="timeline">Timeline</option>
                            <option value="location">Location</option>
                            <option value="any">Any point in conversation</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDisqualifyingAnswers(disqualifyingAnswers.filter((_, j) => j !== i))}
                          className="p-1 text-gray-400 hover:text-red-500 mt-4 flex-shrink-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">If caller indicates...</label>
                        <input
                          type="text"
                          value={dq.answer}
                          onChange={e => {
                            const updated = [...disqualifyingAnswers]
                            updated[i] = { ...updated[i], answer: e.target.value }
                            setDisqualifyingAnswers(updated)
                          }}
                          placeholder="e.g. budget under $500, outside the US, just browsing"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDisqualifyingAnswers([...disqualifyingAnswers, { questionId: '', answer: '' }])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Add Disqualifier
                </button>
              </div>
            </Section>

            </>)}

            {/* ===== APPOINTMENT SCHEDULER SECTIONS ===== */}
            {original?.jobType === 'appointment-scheduler' && (<>

            {/* Appointment Types */}
            <Section title="Appointment Types" badge={apptTypes.length > 0 ? `${apptTypes.length}` : undefined}>
              <div className="pt-3 space-y-3">
                <p className="text-xs text-gray-500">Define the types of appointments your AI can book. The AI will present these as options during the call.</p>
                {apptTypes.map((apt, i) => (
                  <div key={apt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={apt.name}
                          onChange={e => {
                            const updated = [...apptTypes]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setApptTypes(updated)
                          }}
                          placeholder="e.g. Initial Consultation, Follow-up, Deep Clean"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                            <input
                              type="number"
                              min={5}
                              step={5}
                              value={apt.duration}
                              onChange={e => {
                                const updated = [...apptTypes]
                                updated[i] = { ...updated[i], duration: parseInt(e.target.value) || 30 }
                                setApptTypes(updated)
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Price (optional)</label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={apt.price ?? ''}
                              onChange={e => {
                                const updated = [...apptTypes]
                                updated[i] = { ...updated[i], price: e.target.value ? parseFloat(e.target.value) : undefined }
                                setApptTypes(updated)
                              }}
                              placeholder="$"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={apt.description || ''}
                          onChange={e => {
                            const updated = [...apptTypes]
                            updated[i] = { ...updated[i], description: e.target.value || undefined }
                            setApptTypes(updated)
                          }}
                          placeholder="Short description (optional)"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setApptTypes(apptTypes.filter((_, j) => j !== i))}
                        className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setApptTypes([...apptTypes, { id: `apt-${Date.now()}`, name: '', duration: 60 }])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Add Appointment Type
                </button>
              </div>
            </Section>

            {/* Booking Rules */}
            <Section title="Booking Rules" badge="Configured">
              <div className="pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Notice (hours)</label>
                    <p className="text-xs text-gray-500 mb-1">How far in advance must appointments be booked?</p>
                    <input
                      type="number"
                      min={0}
                      value={bookingRules.minNoticeHours}
                      onChange={e => setBookingRules(prev => ({ ...prev, minNoticeHours: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance (days)</label>
                    <p className="text-xs text-gray-500 mb-1">How far ahead can appointments be scheduled?</p>
                    <input
                      type="number"
                      min={1}
                      value={bookingRules.maxAdvanceDays}
                      onChange={e => setBookingRules(prev => ({ ...prev, maxAdvanceDays: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time (minutes)</label>
                    <p className="text-xs text-gray-500 mb-1">Gap between consecutive appointments.</p>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={bookingRules.bufferMinutes}
                      onChange={e => setBookingRules(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-start pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingRules.sameDayBooking}
                        onChange={e => setBookingRules(prev => ({ ...prev, sameDayBooking: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Allow same-day booking</span>
                        <p className="text-xs text-gray-500">Callers can book for today</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </Section>

            {/* Staff Members */}
            <Section title="Staff Members" badge={staffMembers.length > 0 ? `${staffMembers.length}` : undefined}>
              <div className="pt-3 space-y-3">
                <p className="text-xs text-gray-500">If callers can request a specific staff member, add them here. The AI will ask about preferences and note them in the booking.</p>
                {staffMembers.map((staff, i) => (
                  <div key={staff.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={staff.name}
                        onChange={e => {
                          const updated = [...staffMembers]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setStaffMembers(updated)
                        }}
                        placeholder="Staff member name"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={staff.specialties.join(', ')}
                        onChange={e => {
                          const updated = [...staffMembers]
                          updated[i] = { ...updated[i], specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                          setStaffMembers(updated)
                        }}
                        placeholder="Specialties (comma-separated, optional)"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffMembers(staffMembers.filter((_, j) => j !== i))}
                      className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStaffMembers([...staffMembers, { id: `staff-${Date.now()}`, name: '', specialties: [] }])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Add Staff Member
                </button>
              </div>
            </Section>

            {/* Cancellation Policy */}
            <Section title="Cancellation Policy" badge={cancellationPolicy ? 'Set' : undefined}>
              <div className="pt-3">
                <p className="text-xs text-gray-500 mb-2">The AI will relay this to callers who ask about cancellations or reschedules.</p>
                <textarea
                  value={cancellationPolicy}
                  onChange={e => setCancellationPolicy(e.target.value)}
                  rows={3}
                  placeholder="e.g. Cancellations must be made at least 24 hours in advance. Late cancellations may be subject to a $25 fee."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </Section>

            </>)}

            {/* Call Routing */}
            {(original?.jobType === 'receptionist' || original?.jobType === 'customer-service' || original?.jobType === 'appointment-scheduler') && (
              <Section title="Call Routing" badge={transferDestinations.length > 0 ? `${transferDestinations.length} destination${transferDestinations.length !== 1 ? 's' : ''}` : undefined} locked={isTrial} lockedMessage="Upgrade to configure call routing and live transfers.">
                <div className="pt-3 space-y-4">
                  <p className="text-xs text-gray-500">
                    Set up where calls get transferred. Each destination has a label your AI uses (e.g. "Sales", "Dr. Smith"), a phone number, and optional extension. Keywords tell the AI when to route there — or mark one as Default to catch all transfer requests.
                  </p>

                  {transferDestinations.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-400">No transfer destinations yet.</p>
                      <p className="text-xs text-gray-400 mt-0.5">Add one below so your receptionist can transfer callers to a real person.</p>
                    </div>
                  )}

                  {transferDestinations.map((dest, i) => (
                    <div key={dest.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      {/* Row 1: Label + Default toggle + Delete */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Label <span className="text-gray-400">(what callers & AI call this destination)</span></label>
                          <input
                            type="text"
                            value={dest.label}
                            onChange={e => {
                              const updated = [...transferDestinations]
                              updated[i] = { ...updated[i], label: e.target.value }
                              setTransferDestinations(updated)
                            }}
                            placeholder="e.g. Front Desk, Sales, Dr. Smith"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-4 flex-shrink-0">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={dest.isDefault}
                              onChange={e => {
                                const updated = transferDestinations.map((d, j) => ({
                                  ...d,
                                  isDefault: j === i ? e.target.checked : (e.target.checked ? false : d.isDefault),
                                }))
                                setTransferDestinations(updated)
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Default
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTransferDestinations(transferDestinations.filter((_, j) => j !== i))}
                          className="p-1 text-gray-400 hover:text-red-500 mt-4 flex-shrink-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Row 2: Phone + Extension */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={dest.phoneNumber}
                            onChange={e => {
                              const updated = [...transferDestinations]
                              updated[i] = { ...updated[i], phoneNumber: e.target.value }
                              setTransferDestinations(updated)
                            }}
                            placeholder="+15551234567"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-gray-500 mb-1">Extension <span className="text-gray-400">(optional)</span></label>
                          <input
                            type="text"
                            value={dest.extension}
                            onChange={e => {
                              const updated = [...transferDestinations]
                              updated[i] = { ...updated[i], extension: e.target.value }
                              setTransferDestinations(updated)
                            }}
                            placeholder="e.g. 102"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 3: Keywords */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Trigger Keywords <span className="text-gray-400">(comma-separated — caller says these to reach this destination)</span>
                        </label>
                        <input
                          type="text"
                          value={dest.keywords.join(', ')}
                          onChange={e => {
                            const updated = [...transferDestinations]
                            updated[i] = { ...updated[i], keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) }
                            setTransferDestinations(updated)
                          }}
                          placeholder="e.g. sales, pricing, buy, upgrade"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {dest.isDefault && (
                        <p className="text-xs text-blue-600">This destination will be used for any transfer request that doesn&apos;t match a specific keyword.</p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setTransferDestinations([...transferDestinations, {
                      id: `dest-${Date.now()}`,
                      label: '',
                      phoneNumber: '',
                      extension: '',
                      keywords: [],
                      isDefault: transferDestinations.length === 0,
                    }])}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PlusIcon className="h-4 w-4" /> Add Destination
                  </button>
                </div>
              </Section>
            )}

            {/* Schedule */}
            <Section title="Schedule">
              <div className="pt-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Business Hours</label>
                  {DAYS_OF_WEEK.map(day => {
                    const hours = businessHours[day]
                    const isOpen = hours !== null
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 w-28">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={e => {
                              setBusinessHours(prev => ({
                                ...prev,
                                [day]: e.target.checked ? { start: '09:00', end: '17:00' } : null,
                              }))
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{day.slice(0, 3)}</span>
                        </label>
                        {isOpen && (
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={hours.start}
                              onChange={e => {
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day]!, start: e.target.value },
                                }))
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                              type="time"
                              value={hours.end}
                              onChange={e => {
                                setBusinessHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day]!, end: e.target.value },
                                }))
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                        {!isOpen && <span className="text-xs text-gray-400">Closed</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Section>

            {/* Phone Status */}
            <Section title="Phone">
              <div className="pt-3">
                {original.phoneNumber ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{original.phoneNumber}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      {original.phoneProvider || 'vapi'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No phone number assigned. Provision one from the employees list.</p>
                )}
              </div>
            </Section>
          </div>

          {/* Save Bar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {saveError && (
                  <p className="text-sm text-red-600 truncate">{saveError}</p>
                )}
                {saveSuccess && (
                  <p className="text-sm text-green-600">Saved successfully</p>
                )}
                {!saveError && !saveSuccess && isDirty() && (
                  <p className="text-sm text-amber-600">You have unsaved changes</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty()}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          </>)}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Config Gaps */}
              {configGaps.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-amber-800">Setup incomplete — {configGaps.length} item{configGaps.length !== 1 ? 's' : ''} need attention</h3>
                  </div>
                  <ul className="space-y-1 ml-7">
                    {configGaps.map(gap => (
                      <li key={gap} className="text-sm text-amber-700 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setActiveTab('configure')}
                    className="mt-3 ml-7 text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    Go to Configure →
                  </button>
                </div>
              )}
              {configGaps.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">Employee fully configured and ready</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Calls', value: callStats.total, icon: PhoneIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Today', value: callStats.today, icon: PhoneArrowDownLeftIcon, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Avg Duration', value: callStats.avgDuration > 0 ? `${callStats.avgDuration}s` : '—', icon: ClockIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Missed', value: callStats.missed, icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Test Call */}
              {original.phoneNumber && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-500" />
                    Test This Employee
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-700">{original.phoneNumber}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(original.phoneNumber); setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000) }}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        title="Copy number"
                      >
                        {copiedPhone ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <a
                      href={`tel:${original.phoneNumber}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Call
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Call this number from any phone to test {original.name}&apos;s responses</p>
                </div>
              )}

              {/* Integrations */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
                  <a href="/dashboard/integrations" className="text-xs text-blue-600 hover:text-blue-800">Manage →</a>
                </div>
                {integrations.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No integrations connected</div>
                ) : (
                  <div className="space-y-2">
                    {integrations.map((intg: any) => (
                      <div key={intg.id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-700 capitalize">{intg.platform?.replace(/-/g, ' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          intg.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{intg.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Calls Preview */}
              {calls.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Calls</h3>
                    <button onClick={() => setActiveTab('calls')} className="text-xs text-blue-600 hover:text-blue-800">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {calls.slice(0, 3).map((call: any) => (
                      <div key={call.call_id || call.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <PhoneArrowDownLeftIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{call.customer_phone || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {call.duration && <span className="text-xs text-gray-400">{call.duration}s</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            call.status === 'completed' ? 'bg-green-100 text-green-700' :
                            call.status === 'missed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{call.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CALLS TAB */}
          {activeTab === 'calls' && (
            <div className="space-y-3">
              {calls.length === 0 ? (
                <div className="text-center py-16">
                  <PhoneIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No calls recorded yet</p>
                  <p className="text-gray-400 text-xs mt-1">Calls will appear here once {original.name} starts handling them</p>
                </div>
              ) : (
                calls.map((call: any) => {
                  const callId = call.call_id || call.id
                  const isExpanded = expandedCallId === callId
                  const duration = call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : null
                  const startedAt = call.started_at ? new Date(call.started_at) : null
                  return (
                    <div key={callId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCallId(isExpanded ? null : callId)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PhoneArrowDownLeftIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 text-left">
                            <div className="text-sm font-medium text-gray-900">{call.customer_phone || 'Unknown caller'}</div>
                            <div className="text-xs text-gray-400">
                              {startedAt ? startedAt.toLocaleString() : ''}{duration ? ` · ${duration}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            call.status === 'completed' ? 'bg-green-100 text-green-700' :
                            call.status === 'missed' || call.status === 'no-answer' ? 'bg-red-100 text-red-700' :
                            call.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{call.status || 'unknown'}</span>
                          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {call.summary && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-500 mb-1">Summary</div>
                              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{call.summary}</p>
                            </div>
                          )}
                          {call.transcript && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <DocumentTextIcon className="h-3.5 w-3.5" />
                                Transcript
                              </div>
                              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap font-sans">{call.transcript}</pre>
                            </div>
                          )}
                          {!call.summary && !call.transcript && (
                            <p className="text-sm text-gray-400 mt-3 text-center">No transcript available for this call</p>
                          )}
                          {call.recording_url && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-500 mb-1">Recording</div>
                              <audio controls src={call.recording_url} className="w-full h-8" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">SMS messages and voicemails will appear here</p>
                </div>
              ) : (
                messages.map((msg: any) => (
                  <div key={msg.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{msg.caller_name || msg.caller_phone || 'Unknown'}</span>
                          {msg.urgency && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              msg.urgency === 'high' ? 'bg-red-100 text-red-700' :
                              msg.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>{msg.urgency}</span>
                          )}
                        </div>
                        {msg.reason && <p className="text-xs text-gray-500 mb-1">{msg.reason}</p>}
                        {msg.full_message && <p className="text-sm text-gray-700">{msg.full_message}</p>}
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

// ============================================
// HELPERS
// ============================================

function formatChangeDescription(change: TrainingChange): string {
  let desc: string
  switch (change.type) {
    case 'faq':
      desc = `FAQ: "${change.data?.question || ''}"`
      break
    case 'service':
      desc = `Service: ${change.data?.name || ''} (${change.data?.duration || 60}min)`
      break
    case 'transferRule':
      desc = `Transfer: "${(change.data?.keywords || []).join(', ')}" -> ${change.data?.destination || 'manager'}`
      break
    case 'customInstructions':
      desc = `Business context: ${(change.data?.text || '').slice(0, 60)}...`
      break
    case 'callHandlingRules':
      desc = `Call rule: ${(change.data?.text || '').slice(0, 60)}...`
      break
    case 'restriction':
      desc = `Restriction: ${(change.data?.text || '').slice(0, 60)}...`
      break
    case 'greeting':
      desc = `Greeting: ${(change.data?.text || '').slice(0, 60)}...`
      break
    case 'businessDescription':
      desc = `Description: ${(change.data?.text || '').slice(0, 60)}...`
      break
    default:
      desc = change.type
  }
  // Append confidence/evidence if present (from transcript analysis)
  const confidence = change.data?._confidence
  const evidence = change.data?._evidence
  if (confidence || evidence) {
    const parts: string[] = []
    if (confidence) parts.push(confidence)
    if (evidence) parts.push(evidence)
    desc += ` [${parts.join(' - ')}]`
  }
  return desc
}
