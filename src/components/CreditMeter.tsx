'use client'

import { useState, useEffect } from 'react'
import { Battery, BatteryLow, BatteryWarning, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface CreditBalance {
  monthly_credits: number
  purchased_credits: number
  total_credits: number
  credits_used_this_month: number
  credits_reset_date: string
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
  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [businessId])

  const fetchBalance = async () => {
    try {
      const response = await fetch(`/api/credits/balance?business_id=${businessId}`)
      if (!response.ok) throw new Error('Failed to fetch balance')

      const data = await response.json()
      setBalance(data.balance)
      setError(null)
    } catch (err) {
      console.error('Error fetching credit balance:', err)
      setError('Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
        <Battery className="h-5 w-5" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (error || !balance) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <BatteryWarning className="h-5 w-5" />
        <span className="text-sm">{error || 'Error'}</span>
      </div>
    )
  }

  const { total_credits, monthly_credits, purchased_credits } = balance
  const percentageRemaining = Math.max(0, Math.min(100, (total_credits / Math.max(monthly_credits + purchased_credits, 1)) * 100))

  // Determine status color
  let statusColor = 'text-green-600'
  let bgColor = 'bg-green-100'
  let Icon = Battery

  if (percentageRemaining <= 10) {
    statusColor = 'text-red-600'
    bgColor = 'bg-red-100'
    Icon = BatteryWarning
  } else if (percentageRemaining <= 20) {
    statusColor = 'text-yellow-600'
    bgColor = 'bg-yellow-100'
    Icon = BatteryLow
  }

  // Compact view (for header)
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${statusColor}`} />
          <span className={`text-sm font-semibold ${statusColor}`}>
            {total_credits.toLocaleString()}
          </span>
        </div>

        {showPurchaseButton && (
          <Link
            href="/dashboard/billing/credits"
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buy</span>
          </Link>
        )}
      </div>
    )
  }

  // Full view (for billing page)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Icon className={`h-5 w-5 mr-2 ${statusColor}`} />
          Credit Balance
        </h3>
        {showPurchaseButton && (
          <Link
            href="/dashboard/billing/credits"
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Purchase Credits</span>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {/* Total Credits */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {total_credits.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              total credits
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                percentageRemaining <= 10 ? 'bg-red-500' :
                percentageRemaining <= 20 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500 mb-1">Monthly Allocation</div>
            <div className="text-xl font-semibold text-gray-900">
              {monthly_credits.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Resets {new Date(balance.credits_reset_date).toLocaleDateString()}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Purchased Credits</div>
            <div className="text-xl font-semibold text-blue-600">
              {purchased_credits.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Never expire
            </div>
          </div>
        </div>

        {/* Usage this month */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Used this month</span>
            <span className="font-semibold text-gray-900">
              {balance.credits_used_this_month.toLocaleString()} credits
            </span>
          </div>
        </div>

        {/* Low credit warning */}
        {percentageRemaining <= 20 && total_credits > 0 && (
          <div className={`${bgColor} border ${percentageRemaining <= 10 ? 'border-red-300' : 'border-yellow-300'} rounded-lg p-4`}>
            <div className="flex items-start">
              <BatteryWarning className={`h-5 w-5 ${statusColor} mt-0.5 mr-3 flex-shrink-0`} />
              <div>
                <h4 className={`font-semibold ${statusColor} mb-1`}>
                  {percentageRemaining <= 10 ? 'Critical: Low Credits' : 'Warning: Low Credits'}
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  You have {total_credits} credits remaining ({percentageRemaining.toFixed(0)}%).
                  {percentageRemaining <= 10 && ' Your account will be limited when you run out.'}
                </p>
                <div className="flex space-x-3">
                  <Link
                    href="/dashboard/billing/credits"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Purchase Credits →
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="text-sm font-medium text-gray-600 hover:text-gray-700"
                  >
                    Upgrade Plan →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Out of credits */}
        {total_credits === 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <div className="flex items-start">
              <BatteryWarning className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-600 mb-1">
                  Out of Credits
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  You've used all your credits. Purchase more to continue using VoiceFly features.
                </p>
                <Link
                  href="/dashboard/billing/credits"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Credits Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
