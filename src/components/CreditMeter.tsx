'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'

interface MinutesBalance {
  monthly_minutes: number
  purchased_minutes: number
  minutes_used_this_month: number
  minutes_remaining: number
  total_allocation: number
}

interface CreditMeterProps {
  businessId: string
  compact?: boolean
  showPurchaseButton?: boolean
}

export default function CreditMeter({
  businessId,
  compact = false,
  showPurchaseButton = true
}: CreditMeterProps) {
  const [balance, setBalance] = useState<MinutesBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [businessId])

  const fetchBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(`/api/credits/balance?business_id=${businessId}`, { headers })
      if (!res.ok) return

      const data = await res.json()
      if (data.success && data.balance) {
        setBalance({
          monthly_minutes: data.balance.monthly_minutes ?? data.balance.monthly_credits ?? 0,
          purchased_minutes: data.balance.purchased_minutes ?? data.balance.purchased_credits ?? 0,
          minutes_used_this_month: data.balance.minutes_used_this_month ?? data.balance.credits_used_this_month ?? 0,
          minutes_remaining: data.balance.minutes_remaining ?? data.balance.total_credits ?? 0,
          total_allocation: data.balance.total_allocation ?? ((data.balance.monthly_credits ?? 0) + (data.balance.purchased_credits ?? 0)),
        })
      }
    } catch (err) {
      console.error('Failed to fetch minutes balance:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !balance) {
    return (
      <div className="bg-surface-low rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-surface-highest rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-surface-highest rounded w-1/2"></div>
      </div>
    )
  }

  const { monthly_minutes, purchased_minutes, minutes_used_this_month, minutes_remaining, total_allocation } = balance
  const percentUsed = total_allocation > 0 ? Math.min(100, (minutes_used_this_month / total_allocation) * 100) : 0
  const isLow = percentUsed >= 80
  const isDepleted = minutes_remaining <= 0

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-text-muted" />
        <span className={`font-medium ${isDepleted ? 'text-[#ffb4ab]' : isLow ? 'text-accent' : 'text-text-primary'}`}>
          {minutes_remaining} min remaining
        </span>
      </div>
    )
  }

  return (
    <div className="bg-surface-low rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary font-[family-name:var(--font-manrope)] flex items-center gap-2">
          <Clock className="h-4 w-4 text-text-muted" />
          Voice Minutes
        </h3>
        <span className="text-sm text-text-muted">
          {minutes_used_this_month} / {total_allocation} used
        </span>
      </div>

      {/* Usage bar */}
      <div className="w-full h-2.5 bg-surface-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDepleted ? 'bg-[#ffb4ab]' : isLow ? 'bg-accent' : 'bg-brand-primary'
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{minutes_remaining} minutes remaining</span>
        {purchased_minutes > 0 && (
          <span>({purchased_minutes} purchased)</span>
        )}
      </div>

      {isDepleted && (
        <p className="text-xs text-[#ffb4ab] font-medium">
          You&apos;ve used all your minutes this month. Upgrade or purchase more to continue receiving calls.
        </p>
      )}

      {isLow && !isDepleted && (
        <p className="text-xs text-accent">
          Running low on minutes. Consider upgrading your plan.
        </p>
      )}

      {showPurchaseButton && (
        <Link
          href="/dashboard/billing"
          className="block text-center text-sm font-medium text-text-primary bg-surface-high hover:bg-surface-highest rounded-lg py-2 transition-colors"
        >
          {isDepleted ? 'Upgrade Plan' : 'Manage Plan'}
        </Link>
      )}
    </div>
  )
}
