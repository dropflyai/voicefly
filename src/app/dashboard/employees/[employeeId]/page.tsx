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
  const [transferRules, setTransferRules] = useState<{ keywords: string[]; destination: string; personName?: string; phoneNumber?: string }[]>([])

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

  // Training chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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
      JSON.stringify(transferRules) !== JSON.stringify(jc.transferRules || [])
    )
  }, [original, name, greeting, voiceId, tone, enthusiasm, formality, customInstructions, callHandlingRules, restrictions, businessDescription, timezone, businessHours, faqs, services, transferRules])

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

        // Fetch subscription status for feature gating
        const { data: bizData } = await supabase
          .from('businesses')
          .select('subscription_status, subscription_tier')
          .eq('id', businessId)
          .single()
        if (bizData) {
          setSubscriptionStatus(bizData.subscription_status || '')
          setSubscriptionTier(bizData.subscription_tier || '')
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
    setTransferRules(jc.transferRules || [])
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

      const updatedJobConfig = {
        ...jc,
        greeting,
        customInstructions: customInstructions || undefined,
        callHandlingRules: callHandlingRules || undefined,
        restrictions: restrictions || undefined,
        businessDescription: businessDescription || undefined,
        faqs,
        services,
        transferRules,
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

  const sendTrainingMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const message = chatInput.trim()
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
            transferRules,
          },
          jobType: original?.jobType || 'receptionist',
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

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.summary || 'Here are the changes I suggest:',
        changes,
      }])
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
            setTransferRules(prev => [...prev, { keywords: change.data.keywords || [], destination: change.data.destination || 'specific_person', personName: change.data.personName, phoneNumber: change.data.phoneNumber }])
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

          {/* Training Chat */}
          {isStarterOrTrial ? (
            <div className="mb-6 border border-yellow-200 bg-yellow-50 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-5 w-5 text-yellow-600" />
                <h2 className="text-base font-semibold text-yellow-900">Train Your {jobLabel}</h2>
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{isTrial ? 'Upgrade to unlock' : 'Pro feature'}</span>
              </div>
              <p className="text-sm text-yellow-800 mb-3">
                {isTrial
                  ? "Customize your AI's responses, add FAQs, set business rules, and more with conversational training."
                  : "Upgrade to Pro to train your AI with custom FAQs, business rules, and personalized responses."}
              </p>
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                {isTrial ? 'Upgrade Now' : 'Upgrade to Pro'}
              </button>
            </div>
          ) : (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Train Your {jobLabel}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Describe how you want your {jobLabel.toLowerCase()} to behave — I&apos;ll turn it into configuration.
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
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-lg px-3 py-2`}>
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
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-400">Thinking...</p>
                    </div>
                  </div>
                )}
                {analyzing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
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
                    placeholder={`Tell me about your business...`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={chatLoading || analyzing}
                  />
                  <button
                    type="button"
                    onClick={sendTrainingMessage}
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
          )}

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

            {/* Transfer Rules */}
            {(original?.jobType === 'receptionist' || original?.jobType === 'customer-service') && (
              <Section title="Transfer Rules" badge={transferRules.length > 0 ? `${transferRules.length}` : undefined} locked={isTrial} lockedMessage="Upgrade to set up call transfers to your team.">
                <div className="pt-3 space-y-3">
                  {transferRules.map((rule, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={rule.keywords.join(', ')}
                            onChange={e => {
                              const updated = [...transferRules]
                              updated[i] = { ...updated[i], keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) }
                              setTransferRules(updated)
                            }}
                            placeholder="Keywords (comma-separated)"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex gap-2">
                            <select
                              value={rule.destination}
                              onChange={e => {
                                const updated = [...transferRules]
                                updated[i] = { ...updated[i], destination: e.target.value }
                                setTransferRules(updated)
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="manager">Manager</option>
                              <option value="sales">Sales</option>
                              <option value="support">Support</option>
                              <option value="specific_person">Specific Person</option>
                            </select>
                            {rule.destination === 'specific_person' && (
                              <>
                                <input
                                  type="text"
                                  value={rule.personName || ''}
                                  onChange={e => {
                                    const updated = [...transferRules]
                                    updated[i] = { ...updated[i], personName: e.target.value }
                                    setTransferRules(updated)
                                  }}
                                  placeholder="Name"
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  value={rule.phoneNumber || ''}
                                  onChange={e => {
                                    const updated = [...transferRules]
                                    updated[i] = { ...updated[i], phoneNumber: e.target.value }
                                    setTransferRules(updated)
                                  }}
                                  placeholder="Phone"
                                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTransferRules(transferRules.filter((_, j) => j !== i))}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferRules([...transferRules, { keywords: [], destination: 'manager' }])}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PlusIcon className="h-4 w-4" /> Add Transfer Rule
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
