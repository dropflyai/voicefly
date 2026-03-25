'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  CheckCircleIcon,
  BuildingStorefrontIcon,
  UserPlusIcon,
  PhoneIcon,
  PhoneArrowUpRightIcon,
  ShareIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingStep {
  id: number
  title: string
  description: string
  completed: boolean
  actionLabel: string
  actionHref: string
  manual?: boolean
}

interface BusinessRow {
  id: string
  name: string | null
  business_type: string | null
  onboarding_completed: boolean
  onboarding_step: number | null
  onboarding_dismissed_at: string | null
  first_call_at: string | null
}

interface PhoneEmployeeRow {
  id: string
  phone_number: string | null
}

interface OnboardingChecklistProps {
  businessId: string
}

// ---------------------------------------------------------------------------
// Supabase client (browser-side, uses public env vars)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---------------------------------------------------------------------------
// Step icon mapping
// ---------------------------------------------------------------------------

const STEP_ICONS = [
  CheckCircleIcon,
  BuildingStorefrontIcon,
  UserPlusIcon,
  PhoneIcon,
  PhoneArrowUpRightIcon,
  ShareIcon,
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingChecklist({ businessId }: OnboardingChecklistProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [allComplete, setAllComplete] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [shareMarkedDone, setShareMarkedDone] = useState(false)

  // ----- data fetching -----
  const loadOnboardingState = useCallback(async () => {
    try {
      // Parallel queries
      const [businessRes, employeesRes, callsRes, hoursRes] = await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, business_type, onboarding_completed, onboarding_step, onboarding_dismissed_at, first_call_at')
          .eq('id', businessId)
          .single(),
        supabase
          .from('phone_employees')
          .select('id, phone_number')
          .eq('business_id', businessId),
        supabase
          .from('employee_calls')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
        supabase
          .from('business_hours')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
      ])

      const biz = businessRes.data as BusinessRow | null
      if (!biz) {
        setDismissed(true)
        setLoading(false)
        return
      }

      // Already dismissed or completed
      if (biz.onboarding_completed || biz.onboarding_dismissed_at) {
        setDismissed(true)
        setLoading(false)
        return
      }

      const employees = (employeesRes.data || []) as PhoneEmployeeRow[]
      const hasEmployees = employees.length > 0
      const hasPhoneNumber = employees.some((e) => !!e.phone_number)
      const hasCalls = (callsRes.count || 0) > 0
      const hasHours = (hoursRes.count || 0) > 0
      const hasProfile = !!(biz.name && biz.business_type && hasHours)

      // Read share step from localStorage
      const shareKey = `voicefly_onboarding_share_${businessId}`
      const shareDone = typeof window !== 'undefined' && localStorage.getItem(shareKey) === 'true'
      setShareMarkedDone(shareDone)

      const builtSteps: OnboardingStep[] = [
        {
          id: 1,
          title: 'Create your account',
          description: 'Sign up and get access to VoiceFly.',
          completed: true,
          actionLabel: 'Done',
          actionHref: '#',
        },
        {
          id: 2,
          title: 'Set up your business profile',
          description: 'Add your business name, type, and operating hours.',
          completed: hasProfile,
          actionLabel: hasProfile ? 'Done' : 'Set up profile',
          actionHref: '/dashboard/settings',
        },
        {
          id: 3,
          title: 'Hire your first AI employee',
          description: 'Create a virtual receptionist, assistant, or order taker.',
          completed: hasEmployees,
          actionLabel: hasEmployees ? 'Done' : 'Hire employee',
          actionHref: '/dashboard/employees',
        },
        {
          id: 4,
          title: 'Assign a phone number',
          description: 'Give your AI employee a phone number so customers can call.',
          completed: hasPhoneNumber,
          actionLabel: hasPhoneNumber ? 'Done' : 'Assign number',
          actionHref: '/dashboard/employees',
        },
        {
          id: 5,
          title: 'Make a test call',
          description: 'Call your AI employee to hear it in action.',
          completed: hasCalls,
          actionLabel: hasCalls ? 'Done' : 'Test now',
          actionHref: '/dashboard/calls',
        },
        {
          id: 6,
          title: 'Share your new number',
          description: 'Let your customers know they can reach your business 24/7.',
          completed: shareDone,
          actionLabel: shareDone ? 'Done' : 'Mark complete',
          actionHref: '#',
          manual: true,
        },
      ]

      setSteps(builtSteps)

      const completedCount = builtSteps.filter((s) => s.completed).length
      if (completedCount === 6) {
        setAllComplete(true)
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 4000)
      }
    } catch (err) {
      console.error('Onboarding checklist error:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    loadOnboardingState()
  }, [loadOnboardingState])

  // ----- actions -----

  const handleDismiss = async () => {
    setDismissed(true)
    await supabase
      .from('businesses')
      .update({
        onboarding_completed: true,
        onboarding_dismissed_at: new Date().toISOString(),
      })
      .eq('id', businessId)
  }

  const handleManualComplete = (stepId: number) => {
    if (stepId === 6) {
      const shareKey = `voicefly_onboarding_share_${businessId}`
      localStorage.setItem(shareKey, 'true')
      setShareMarkedDone(true)
      setSteps((prev) =>
        prev.map((s) => (s.id === 6 ? { ...s, completed: true, actionLabel: 'Done' } : s))
      )
      // Check if all complete now
      const newCompleted = steps.filter((s) => s.completed).length + 1
      if (newCompleted === 6) {
        setAllComplete(true)
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 4000)
      }
    }
  }

  // ----- render -----

  if (loading || dismissed) return null

  const completedCount = steps.filter((s) => s.completed).length
  const progressPct = Math.round((completedCount / 6) * 100)

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Celebration overlay */}
      {celebrating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center animate-fade-in">
            <SparklesIcon className="mx-auto h-12 w-12 text-yellow-500 animate-bounce" />
            <h3 className="mt-3 text-xl font-bold text-gray-900">You are all set!</h3>
            <p className="mt-1 text-sm text-gray-600">
              Your AI employee is ready to take calls 24/7.
            </p>
            <button
              onClick={handleDismiss}
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Get started with VoiceFly</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {allComplete
              ? 'All steps complete — you are ready to go!'
              : `${completedCount} of 6 steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Dismiss onboarding checklist"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50 px-6 py-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.id - 1]
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 py-3.5 ${
                step.completed ? 'opacity-70' : ''
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircleSolidIcon className="h-7 w-7 text-green-500" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 text-xs font-bold text-gray-500">
                    {step.id}
                  </div>
                )}
              </div>

              {/* Step icon */}
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${
                  step.completed ? 'text-green-500' : 'text-gray-400'
                }`}
              />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{step.description}</p>
              </div>

              {/* Action button */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Done
                  </span>
                ) : step.manual ? (
                  <button
                    onClick={() => handleManualComplete(step.id)}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {step.actionLabel}
                  </button>
                ) : (
                  <Link
                    href={step.actionHref}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {step.actionLabel}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
