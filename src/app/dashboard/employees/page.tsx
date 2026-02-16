'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import {
  PhoneIcon,
  UserCircleIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import VoiceInterview from '../../../components/VoiceInterview'

interface PhoneEmployee {
  id: string
  name: string
  jobType: string
  isActive: boolean
  phoneNumber?: string
  personality: {
    tone: string
    enthusiasm: string
  }
  createdAt: string
}

const JOB_TYPE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
  'receptionist': {
    label: 'Receptionist',
    icon: PhoneIcon,
    color: 'blue',
    description: 'Answers calls, takes messages, schedules appointments',
  },
  'personal-assistant': {
    label: 'Personal Assistant',
    icon: CalendarDaysIcon,
    color: 'purple',
    description: 'Manages schedules, takes messages, handles callbacks',
  },
  'order-taker': {
    label: 'Order Taker',
    icon: ShoppingCartIcon,
    color: 'green',
    description: 'Takes orders, handles modifications, processes payments',
  },
  'appointment-scheduler': {
    label: 'Appointment Scheduler',
    icon: CalendarDaysIcon,
    color: 'indigo',
    description: 'Focused on booking and managing appointments',
  },
  'customer-service': {
    label: 'Customer Service',
    icon: ChatBubbleLeftRightIcon,
    color: 'amber',
    description: 'Handles inquiries, complaints, and support',
  },
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'warm', label: 'Warm', description: 'Caring and empathetic' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
]

const VOICE_OPTIONS = [
  { value: 'sarah', label: 'Sarah', description: 'Warm and professional female voice' },
  { value: 'emma', label: 'Emma', description: 'Friendly and upbeat female voice' },
  { value: 'michael', label: 'Michael', description: 'Confident and clear male voice' },
  { value: 'james', label: 'James', description: 'Deep and authoritative male voice' },
]

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DEFAULT_BUSINESS_HOURS: Record<string, { start: string; end: string } | null> = {
  monday: { start: '09:00', end: '17:00' },
  tuesday: { start: '09:00', end: '17:00' },
  wednesday: { start: '09:00', end: '17:00' },
  thursday: { start: '09:00', end: '17:00' },
  friday: { start: '09:00', end: '17:00' },
  saturday: null,
  sunday: null,
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  }
}

// ============================================
// WIZARD SUB-COMPONENTS
// ============================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const stepLabels = ['Role & Voice', 'Business Info', 'Review Config', 'Confirm']
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {stepLabels.map((label, idx) => {
          const step = idx + 1
          const isCompleted = currentStep > step
          const isCurrent = currentStep === step
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : step}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {step < totalSteps && (
                <div className={`h-0.5 w-full mx-1 mb-5 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BusinessHoursEditor({
  hours,
  onChange,
}: {
  hours: Record<string, { start: string; end: string } | null>
  onChange: (hours: Record<string, { start: string; end: string } | null>) => void
}) {
  const toggleDay = (day: string) => {
    if (hours[day] === null) {
      onChange({ ...hours, [day]: { start: '09:00', end: '17:00' } })
    } else {
      onChange({ ...hours, [day]: null })
    }
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    const current = hours[day]
    if (!current) return
    onChange({ ...hours, [day]: { ...current, [field]: value } })
  }

  return (
    <div className="space-y-2">
      {DAYS_OF_WEEK.map(day => {
        const dayHours = hours[day]
        const isClosed = dayHours === null
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium text-gray-700 capitalize">{day}</span>
            <button
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                isClosed
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isClosed ? 'Closed' : 'Open'}
            </button>
            {!isClosed && (
              <>
                <input
                  type="time"
                  value={dayHours.start}
                  onChange={e => updateTime(day, 'start', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time"
                  value={dayHours.end}
                  onChange={e => updateTime(day, 'end', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// STEP 1: Role + Name + Voice
// ============================================

function WizardStep1({
  wizardData,
  setWizardData,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
}) {
  const hireableRoles = ['receptionist', 'personal-assistant', 'order-taker']

  return (
    <div className="space-y-6">
      {/* Job Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">What role should this employee fill?</label>
        <div className="grid grid-cols-1 gap-3">
          {hireableRoles.map(type => {
            const info = JOB_TYPE_INFO[type]
            const Icon = info.icon
            const isSelected = wizardData.jobType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setWizardData(prev => ({ ...prev, jobType: type }))}
                className={`flex items-center p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? `bg-blue-100` : `bg-gray-100`
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{info.label}</p>
                  <p className={`text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>{info.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Employee Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
        <input
          type="text"
          value={wizardData.name}
          onChange={e => setWizardData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Maya"
        />
        <p className="mt-1 text-xs text-gray-400">This is the name your employee will use when answering calls.</p>
      </div>

      {/* Tone Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Personality Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map(tone => {
            const isSelected = wizardData.tone === tone.value
            return (
              <button
                key={tone.value}
                type="button"
                onClick={() => setWizardData(prev => ({ ...prev, tone: tone.value }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tone.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {TONE_OPTIONS.find(t => t.value === wizardData.tone)?.description}
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Voice</label>
        <div className="flex flex-wrap gap-2">
          {VOICE_OPTIONS.map(voice => {
            const isSelected = wizardData.voiceId === voice.value
            return (
              <button
                key={voice.value}
                type="button"
                onClick={() => setWizardData(prev => ({ ...prev, voiceId: voice.value }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {voice.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {VOICE_OPTIONS.find(v => v.value === wizardData.voiceId)?.description}
        </p>
      </div>
    </div>
  )
}

// ============================================
// STEP 2: Business Description + AI Generation
// ============================================

function WizardStep2({
  wizardData,
  setWizardData,
  onGenerate,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
  onGenerate: () => Promise<void>
}) {
  const [interviewConfig, setInterviewConfig] = useState<Record<string, any> | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)

  const inputMode = wizardData.inputMode || 'text'

  // Load interview config when switching to voice mode
  useEffect(() => {
    if (inputMode === 'voice' && !interviewConfig && !isLoadingConfig) {
      loadInterviewConfig()
    }
  }, [inputMode])

  const loadInterviewConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const headers = await getAuthHeaders()
      const businessId = getSecureBusinessId()
      const res = await fetch('/api/phone-employees/interview-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          employeeName: wizardData.name,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInterviewConfig(data.assistantConfig)
      } else {
        setWizardData(prev => ({ ...prev, generateError: data.error || 'Failed to load voice interview', inputMode: 'text' }))
      }
    } catch (err: any) {
      console.error('Failed to load interview config:', err)
      setWizardData(prev => ({ ...prev, generateError: 'Voice interview unavailable. Please use text mode.', inputMode: 'text' }))
    } finally {
      setIsLoadingConfig(false)
    }
  }

  const handleCallEnd = (transcript: string) => {
    setWizardData(prev => ({ ...prev, businessDescription: transcript }))
    // Auto-trigger config generation after a brief delay
    setTimeout(() => onGenerate(), 500)
  }

  const handleVoiceError = (error: string) => {
    console.error('Voice interview error:', error)
    // Don't auto-switch - let user see the error and choose
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        <button
          type="button"
          onClick={() => setWizardData(prev => ({ ...prev, inputMode: 'text' }))}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'text'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Type Description
        </button>
        <button
          type="button"
          onClick={() => setWizardData(prev => ({ ...prev, inputMode: 'voice' }))}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'voice'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Voice Interview
        </button>
      </div>

      {/* Text Mode */}
      {inputMode === 'text' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your business
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Include what you do, services you offer, hours, location, and anything else your phone employee should know.
            </p>
            <textarea
              value={wizardData.businessDescription}
              onChange={e => setWizardData(prev => ({ ...prev, businessDescription: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="e.g., We are a family-owned Italian restaurant in downtown Portland. We offer dine-in, takeout, and delivery. Our hours are Tuesday through Sunday, 11am to 10pm. We specialize in handmade pasta, wood-fired pizza, and seasonal Italian dishes..."
            />
          </div>

          {wizardData.generateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{wizardData.generateError}</p>
            </div>
          )}

          {wizardData.isGenerating ? (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <SparklesIcon className="h-5 w-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-700">AI is configuring your employee...</p>
              <p className="text-xs text-gray-400 mt-1">This usually takes 5-10 seconds</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!wizardData.businessDescription.trim()}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate Configuration
            </button>
          )}
        </>
      )}

      {/* Voice Mode */}
      {inputMode === 'voice' && (
        <>
          {isLoadingConfig ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-3 text-sm text-gray-500">Preparing voice interview...</p>
            </div>
          ) : interviewConfig ? (
            <>
              {wizardData.isGenerating ? (
                <div className="flex flex-col items-center py-8">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                    <SparklesIcon className="h-5 w-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">AI is configuring your employee from the interview...</p>
                  <p className="text-xs text-gray-400 mt-1">This usually takes 5-10 seconds</p>
                </div>
              ) : (
                <VoiceInterview
                  assistantConfig={interviewConfig}
                  onCallEnd={handleCallEnd}
                  onError={handleVoiceError}
                />
              )}
            </>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Voice interview could not be loaded.{' '}
                <button
                  type="button"
                  onClick={() => setWizardData(prev => ({ ...prev, inputMode: 'text' }))}
                  className="underline font-medium"
                >
                  Switch to text mode
                </button>
              </p>
            </div>
          )}

          {wizardData.generateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{wizardData.generateError}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================
// STEP 3: Review & Edit Config
// ============================================

function WizardStep3({
  wizardData,
  setWizardData,
}: {
  wizardData: WizardData
  setWizardData: React.Dispatch<React.SetStateAction<WizardData>>
}) {
  const config = wizardData.generatedConfig
  if (!config) return <p className="text-gray-500">No configuration generated yet.</p>

  const updateConfig = (path: string, value: any) => {
    setWizardData(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev.generatedConfig))
      const keys = path.split('.')
      let obj = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return { ...prev, generatedConfig: newConfig }
    })
  }

  const jobType = wizardData.jobType

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Review and customize the AI-generated configuration. All fields are editable.
      </p>

      {/* Greeting - common to all types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Greeting</label>
        <textarea
          value={config.greeting || ''}
          onChange={e => updateConfig('greeting', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
        />
      </div>

      {/* Receptionist-specific fields */}
      {jobType === 'receptionist' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
            <textarea
              value={config.businessDescription || ''}
              onChange={e => updateConfig('businessDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Services</label>
              <button
                type="button"
                onClick={() => {
                  const services = [...(config.services || [])]
                  services.push({ name: '', duration: 30 })
                  updateConfig('services', services)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Service
              </button>
            </div>
            {(config.services || []).map((service: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={service.name}
                  onChange={e => {
                    const services = [...config.services]
                    services[idx] = { ...services[idx], name: e.target.value }
                    updateConfig('services', services)
                  }}
                  placeholder="Service name"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  value={service.duration}
                  onChange={e => {
                    const services = [...config.services]
                    services[idx] = { ...services[idx], duration: parseInt(e.target.value) || 0 }
                    updateConfig('services', services)
                  }}
                  placeholder="Min"
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-xs text-gray-400">min</span>
                <button
                  type="button"
                  onClick={() => {
                    const services = config.services.filter((_: any, i: number) => i !== idx)
                    updateConfig('services', services)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">FAQs</label>
              <button
                type="button"
                onClick={() => {
                  const faqs = [...(config.faqs || [])]
                  faqs.push({ question: '', answer: '', keywords: [] })
                  updateConfig('faqs', faqs)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add FAQ
              </button>
            </div>
            {(config.faqs || []).map((faq: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={e => {
                        const faqs = [...config.faqs]
                        faqs[idx] = { ...faqs[idx], question: e.target.value }
                        updateConfig('faqs', faqs)
                      }}
                      placeholder="Question"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => {
                        const faqs = [...config.faqs]
                        faqs[idx] = { ...faqs[idx], answer: e.target.value }
                        updateConfig('faqs', faqs)
                      }}
                      placeholder="Answer"
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const faqs = config.faqs.filter((_: any, i: number) => i !== idx)
                      updateConfig('faqs', faqs)
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Taker-specific fields */}
      {jobType === 'order-taker' && (
        <>
          {/* Menu Categories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Menu Categories</label>
              <button
                type="button"
                onClick={() => {
                  const categories = [...(config.menu?.categories || [])]
                  categories.push({ name: '', items: [] })
                  updateConfig('menu', { ...config.menu, categories })
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Category
              </button>
            </div>
            {(config.menu?.categories || []).map((category: any, catIdx: number) => (
              <div key={catIdx} className="p-3 bg-gray-50 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={category.name}
                    onChange={e => {
                      const categories = [...config.menu.categories]
                      categories[catIdx] = { ...categories[catIdx], name: e.target.value }
                      updateConfig('menu', { ...config.menu, categories })
                    }}
                    placeholder="Category name (e.g., Appetizers)"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const categories = config.menu.categories.filter((_: any, i: number) => i !== catIdx)
                      updateConfig('menu', { ...config.menu, categories })
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                {/* Items in category */}
                {(category.items || []).map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="flex items-center gap-2 mb-1 ml-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items[itemIdx].name = e.target.value
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      placeholder="Item name"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-1">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={e => {
                          const categories = JSON.parse(JSON.stringify(config.menu.categories))
                          categories[catIdx].items[itemIdx].price = parseFloat(e.target.value) || 0
                          updateConfig('menu', { ...config.menu, categories })
                        }}
                        placeholder="0.00"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={e => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items[itemIdx].description = e.target.value
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      placeholder="Description (optional)"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const categories = JSON.parse(JSON.stringify(config.menu.categories))
                        categories[catIdx].items.splice(itemIdx, 1)
                        updateConfig('menu', { ...config.menu, categories })
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const categories = JSON.parse(JSON.stringify(config.menu.categories))
                    categories[catIdx].items.push({ name: '', price: 0, description: '' })
                    updateConfig('menu', { ...config.menu, categories })
                  }}
                  className="ml-4 mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Item
                </button>
              </div>
            ))}
          </div>

          {/* Order Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Settings</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Order ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.orderSettings?.minimumOrder || 0}
                  onChange={e => updateConfig('orderSettings', { ...config.orderSettings, minimumOrder: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.orderSettings?.deliveryFee || 0}
                  onChange={e => updateConfig('orderSettings', { ...config.orderSettings, deliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pickup Time (min)</label>
                <input
                  type="number"
                  value={config.orderSettings?.estimatedTime?.pickup || 20}
                  onChange={e => updateConfig('orderSettings', {
                    ...config.orderSettings,
                    estimatedTime: { ...config.orderSettings?.estimatedTime, pickup: parseInt(e.target.value) || 0 },
                  })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery Time (min)</label>
                <input
                  type="number"
                  value={config.orderSettings?.estimatedTime?.delivery || 45}
                  onChange={e => updateConfig('orderSettings', {
                    ...config.orderSettings,
                    estimatedTime: { ...config.orderSettings?.estimatedTime, delivery: parseInt(e.target.value) || 0 },
                  })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Personal Assistant-specific fields */}
      {jobType === 'personal-assistant' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <input
              type="text"
              value={config.ownerName || ''}
              onChange={e => updateConfig('ownerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling Rules</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Notice (min)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.minNotice || 60}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, minNotice: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Advance (days)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.maxAdvance || 30}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, maxAdvance: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Buffer (min)</label>
                <input
                  type="number"
                  value={config.schedulingRules?.bufferBetween || 15}
                  onChange={e => updateConfig('schedulingRules', { ...config.schedulingRules, bufferBetween: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Business Hours - common to all types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
        <BusinessHoursEditor
          hours={config.businessHours || DEFAULT_BUSINESS_HOURS}
          onChange={hours => updateConfig('businessHours', hours)}
        />
      </div>
    </div>
  )
}

// ============================================
// STEP 4: Confirm & Create
// ============================================

function WizardStep4({
  wizardData,
  isCreating,
  createError,
  createSuccess,
  onConfirm,
}: {
  wizardData: WizardData
  isCreating: boolean
  createError: string | null
  createSuccess: boolean
  onConfirm: () => void
}) {
  const jobInfo = JOB_TYPE_INFO[wizardData.jobType] || JOB_TYPE_INFO['receptionist']
  const Icon = jobInfo.icon
  const config = wizardData.generatedConfig

  if (createSuccess) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckIcon className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Employee Created!</h3>
        <p className="text-sm text-gray-500 text-center">
          {wizardData.name} is ready to start handling calls as your {jobInfo.label.toLowerCase()}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Review the summary below and create your new employee.</p>

      {/* Summary Card */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="font-semibold text-gray-900">{wizardData.name}</p>
            <p className="text-sm text-blue-600">{jobInfo.label}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tone</span>
            <span className="text-gray-900 capitalize">{wizardData.tone}</span>
          </div>

          {config?.greeting && (
            <div className="text-sm">
              <span className="text-gray-500">Greeting:</span>
              <p className="text-gray-700 mt-1 italic text-xs">"{config.greeting}"</p>
            </div>
          )}

          {wizardData.jobType === 'receptionist' && config?.services?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Services</span>
              <span className="text-gray-900">{config.services.length} configured</span>
            </div>
          )}

          {wizardData.jobType === 'receptionist' && config?.faqs?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">FAQs</span>
              <span className="text-gray-900">{config.faqs.length} configured</span>
            </div>
          )}

          {wizardData.jobType === 'order-taker' && config?.menu?.categories?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Menu Categories</span>
              <span className="text-gray-900">{config.menu.categories.length} categories</span>
            </div>
          )}

          {wizardData.jobType === 'personal-assistant' && config?.ownerName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Assistant for</span>
              <span className="text-gray-900">{config.ownerName}</span>
            </div>
          )}
        </div>
      </div>

      {createError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{createError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={isCreating}
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
      >
        {isCreating ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Creating Employee...
          </>
        ) : (
          <>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Employee
          </>
        )}
      </button>
    </div>
  )
}

// ============================================
// WIZARD DATA TYPE
// ============================================

interface WizardData {
  name: string
  jobType: string
  tone: string
  voiceId: string
  inputMode: 'text' | 'voice'
  businessDescription: string
  generatedConfig: any | null
  isGenerating: boolean
  generateError: string | null
}

// ============================================
// MAIN COMPONENT
// ============================================

function EmployeesDashboard() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [employees, setEmployees] = useState<PhoneEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    name: 'Maya',
    jobType: 'receptionist',
    tone: 'professional',
    voiceId: 'sarah',
    inputMode: 'text',
    businessDescription: '',
    generatedConfig: null,
    isGenerating: false,
    generateError: null,
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const resetWizard = () => {
    setWizardStep(1)
    setWizardData({
      name: 'Maya',
      jobType: 'receptionist',
      tone: 'professional',
      inputMode: 'text',
      businessDescription: '',
      generatedConfig: null,
      isGenerating: false,
      generateError: null,
    })
    setCreating(false)
    setCreateError(null)
    setCreateSuccess(false)
  }

  const openWizard = () => {
    resetWizard()
    setShowCreateModal(true)
  }

  const closeWizard = () => {
    setShowCreateModal(false)
    resetWizard()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (redirectToLoginIfUnauthenticated()) return

      const businessId = getSecureBusinessId()
      if (!businessId) {
        setError('Authentication required')
        return
      }

      // Load business
      const businessData = await BusinessAPI.getBusiness(businessId)
      setBusiness(businessData)

      // Load employees
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees?businessId=${businessId}`, { headers })
      const data = await response.json()

      if (data.employees) {
        setEmployees(data.employees)
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateConfig = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setWizardData(prev => ({ ...prev, isGenerating: true, generateError: null }))

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/phone-employees/generate-config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          businessDescription: wizardData.businessDescription,
          employeeName: wizardData.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate configuration')
      }

      // Merge business hours into the config for the editor
      const config = data.config || data
      if (!config.businessHours) {
        config.businessHours = { ...DEFAULT_BUSINESS_HOURS }
      }

      setWizardData(prev => ({
        ...prev,
        isGenerating: false,
        generatedConfig: config,
      }))
      setWizardStep(3)
    } catch (err: any) {
      console.error('Generate config error:', err)
      setWizardData(prev => ({
        ...prev,
        isGenerating: false,
        generateError: err.message || 'Failed to generate configuration. Please try again.',
      }))
    }
  }

  const createEmployee = async () => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    setCreating(true)
    setCreateError(null)

    try {
      const headers = await getAuthHeaders()

      // Build the config object to send, extracting schedule-related fields
      const { businessHours, timezone, afterHoursMessage, ...jobConfig } = wizardData.generatedConfig || {}

      const response = await fetch('/api/phone-employees', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          jobType: wizardData.jobType,
          name: wizardData.name,
          voice: {
            provider: 'elevenlabs',
            voiceId: wizardData.voiceId || 'sarah',
            speed: 1.0,
            stability: 0.8,
          },
          personality: {
            tone: wizardData.tone,
            enthusiasm: wizardData.tone === 'casual' || wizardData.tone === 'friendly' ? 'high' : 'medium',
            formality: wizardData.tone === 'professional' || wizardData.tone === 'luxury' ? 'formal' : wizardData.tone === 'casual' ? 'casual' : 'semi-formal',
          },
          config: {
            ...jobConfig,
            type: wizardData.jobType,
          },
          schedule: businessHours ? {
            timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
            businessHours,
            afterHoursMessage: afterHoursMessage || undefined,
          } : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmployees(prev => [data.employee, ...prev])
        setCreateSuccess(true)
      } else {
        setCreateError(data.error || 'Failed to create employee')
      }
    } catch (err: any) {
      setCreateError(err.message || 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const toggleEmployeeStatus = async (employee: PhoneEmployee) => {
    const businessId = getSecureBusinessId()
    if (!businessId) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees/${employee.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          businessId,
          isActive: !employee.isActive,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setEmployees(employees.map(e =>
          e.id === employee.id ? { ...e, isActive: !e.isActive } : e
        ))
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const deleteEmployee = async (employee: PhoneEmployee) => {
    if (!confirm(`Are you sure you want to delete ${employee.name}? This cannot be undone.`)) {
      return
    }

    const businessId = getSecureBusinessId()
    if (!businessId) return

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phone-employees/${employee.id}?businessId=${businessId}`, {
        method: 'DELETE',
        headers,
      })

      const data = await response.json()
      if (data.success) {
        setEmployees(employees.filter(e => e.id !== employee.id))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Wizard navigation
  const canGoNext = () => {
    switch (wizardStep) {
      case 1:
        return wizardData.name.trim() !== '' && wizardData.jobType !== ''
      case 2:
        return false // Step 2 advances via generate button
      case 3:
        return wizardData.generatedConfig !== null
      case 4:
        return false // Step 4 creates via confirm button
      default:
        return false
    }
  }

  const goNext = () => {
    if (wizardStep < 4) {
      setWizardStep(wizardStep + 1)
    }
  }

  const goBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1)
    }
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phone Employees</h1>
            <p className="text-gray-600 mt-1">
              AI-powered phone staff that work 24/7
            </p>
          </div>
          <button
            onClick={openWizard}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Hire Employee
          </button>
        </div>

        {/* Employee Grid */}
        {employees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
            <p className="text-gray-600 mb-6">
              Hire your first AI phone employee to start handling calls automatically.
            </p>
            <button
              onClick={openWizard}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Hire Your First Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(employee => {
              const jobInfo = JOB_TYPE_INFO[employee.jobType] || JOB_TYPE_INFO['receptionist']
              const Icon = jobInfo.icon

              return (
                <div
                  key={employee.id}
                  className={`bg-white rounded-xl border ${employee.isActive ? 'border-green-200' : 'border-gray-200'} overflow-hidden`}
                >
                  {/* Header */}
                  <div className={`p-4 bg-${jobInfo.color}-50 border-b border-${jobInfo.color}-100`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 bg-${jobInfo.color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 text-${jobInfo.color}-600`} />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                          <p className={`text-sm text-${jobInfo.color}-600`}>{jobInfo.label}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">{jobInfo.description}</p>

                    {employee.phoneNumber && (
                      <div className="flex items-center text-sm text-gray-700 mb-3">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {employee.phoneNumber}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500">
                      <span className="capitalize">Tone: {employee.personality?.tone || 'Professional'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleEmployeeStatus(employee)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        employee.isActive
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {employee.isActive ? (
                        <>
                          <PauseIcon className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => deleteEmployee(employee)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Job Types Info */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(JOB_TYPE_INFO).slice(0, 3).map(([type, info]) => {
              const Icon = info.icon
              return (
                <div key={type} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Icon className={`h-5 w-5 text-${info.color}-600 mr-2`} />
                    <span className="font-medium text-gray-900">{info.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Create Employee Wizard Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className={`bg-white rounded-xl p-6 w-full mx-4 max-h-[90vh] overflow-y-auto transition-all ${
                wizardStep >= 3 || (wizardStep === 2 && wizardData.inputMode === 'voice') ? 'max-w-2xl' : 'max-w-md'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Hire New Employee</h2>
                <button
                  onClick={closeWizard}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <StepIndicator currentStep={wizardStep} totalSteps={4} />

              {/* Step Content */}
              {wizardStep === 1 && (
                <WizardStep1 wizardData={wizardData} setWizardData={setWizardData} />
              )}
              {wizardStep === 2 && (
                <WizardStep2
                  wizardData={wizardData}
                  setWizardData={setWizardData}
                  onGenerate={generateConfig}
                />
              )}
              {wizardStep === 3 && (
                <WizardStep3 wizardData={wizardData} setWizardData={setWizardData} />
              )}
              {wizardStep === 4 && (
                <WizardStep4
                  wizardData={wizardData}
                  isCreating={creating}
                  createError={createError}
                  createSuccess={createSuccess}
                  onConfirm={createEmployee}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                {/* Left side: Back or Cancel */}
                <div>
                  {wizardStep > 1 && !createSuccess ? (
                    <button
                      onClick={goBack}
                      disabled={wizardData.isGenerating || creating}
                      className="inline-flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Back
                    </button>
                  ) : (
                    <button
                      onClick={closeWizard}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {createSuccess ? 'Done' : 'Cancel'}
                    </button>
                  )}
                </div>

                {/* Right side: Next (only for steps 1 and 3) */}
                <div>
                  {createSuccess && (
                    <button
                      onClick={closeWizard}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  )}
                  {wizardStep === 1 && (
                    <button
                      onClick={goNext}
                      disabled={!canGoNext()}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                  {wizardStep === 3 && (
                    <button
                      onClick={goNext}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Review & Create
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function ProtectedEmployeesDashboard() {
  return (
    <ProtectedRoute>
      <EmployeesDashboard />
    </ProtectedRoute>
  )
}
