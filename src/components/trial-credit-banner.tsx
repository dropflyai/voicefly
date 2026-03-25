'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface TrialBannerState {
  show: boolean
  level: 'info' | 'warning' | 'danger' | 'exhausted'
  minutesUsed: number
  minutesTotal: number
  minutesRemaining: number
  usagePercent: number
  isPaused: boolean
}

export default function TrialCreditBanner({ businessId }: { businessId: string }) {
  const [state, setState] = useState<TrialBannerState | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkTrial() {
      const { data: business } = await supabase
        .from('businesses')
        .select('subscription_tier, monthly_credits, purchased_credits, credits_used_this_month, trial_paused')
        .eq('id', businessId)
        .single()

      if (!business || business.subscription_tier !== 'trial') {
        setState(null)
        return
      }

      const total = (business.monthly_credits || 0) + (business.purchased_credits || 0)
      const used = business.credits_used_this_month || 0
      const remaining = Math.max(0, total - used)
      const percent = total > 0 ? Math.round((used / total) * 100) : 0
      const minutesTotal = Math.floor(total / 5)
      const minutesUsed = Math.floor(used / 5)
      const minutesRemaining = Math.floor(remaining / 5)

      let level: TrialBannerState['level'] = 'info'
      let show = false

      if (percent >= 100 || business.trial_paused) {
        level = 'exhausted'
        show = true
      } else if (percent >= 80) {
        level = 'danger'
        show = true
      } else if (percent >= 50) {
        level = 'warning'
        show = true
      }

      setState({
        show,
        level,
        minutesUsed,
        minutesTotal,
        minutesRemaining,
        usagePercent: Math.min(percent, 100),
        isPaused: business.trial_paused || false,
      })
    }

    checkTrial()
  }, [businessId, supabase])

  if (!state || !state.show) return null

  const styles = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      bar: 'bg-blue-500',
      icon: 'ℹ️',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-300',
      text: 'text-yellow-800',
      bar: 'bg-yellow-500',
      icon: '⚡',
    },
    danger: {
      bg: 'bg-orange-50 border-orange-300',
      text: 'text-orange-800',
      bar: 'bg-orange-500',
      icon: '🔥',
    },
    exhausted: {
      bg: 'bg-red-50 border-red-300',
      text: 'text-red-800',
      bar: 'bg-red-600',
      icon: '🚫',
    },
  }

  const s = styles[state.level]

  return (
    <div className={`${s.bg} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span>{s.icon}</span>
            <span className={`font-semibold ${s.text}`}>
              {state.level === 'exhausted'
                ? 'Trial minutes used up — your AI employee is paused'
                : state.level === 'danger'
                ? `Only ${state.minutesRemaining} trial minutes left!`
                : `${state.minutesRemaining} trial minutes remaining`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-2">
            <div
              className={`${s.bar} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${state.usagePercent}%` }}
            />
          </div>

          <p className={`text-sm ${s.text} opacity-75`}>
            {state.minutesUsed} of {state.minutesTotal} minutes used
            {state.isPaused && ' — Upgrade to reactivate your AI employee'}
          </p>
        </div>

        <Link
          href="/dashboard/billing"
          className={`ml-4 px-4 py-2 rounded-md font-semibold text-white text-sm whitespace-nowrap ${
            state.level === 'exhausted'
              ? 'bg-red-600 hover:bg-red-700'
              : state.level === 'danger'
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {state.isPaused ? 'Reactivate Now' : 'Upgrade'}
        </Link>
      </div>
    </div>
  )
}
