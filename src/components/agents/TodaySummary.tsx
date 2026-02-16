'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface SummaryMetrics {
  totalCalls: number
  totalRevenue: number
  appointmentsBooked: number
  leadsGenerated: number
  conversionRate: number
  customerSatisfaction: number
}

interface AgentExecutions {
  total: number
  successful: number
  failed: number
  insights: number
  actions: number
}

interface Summary {
  date: string
  metrics: SummaryMetrics
  highlights: string[]
  concerns: string[]
  opportunities: any[]
  recommendedActions: any[]
  agentExecutions: AgentExecutions
}

interface TodaySummaryProps {
  businessId: string
  className?: string
}

export function TodaySummary({ businessId, className }: TodaySummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [businessId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents/summary')
      if (!response.ok) throw new Error('Failed to fetch summary')
      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <p className="text-red-600 text-sm">{error || 'No summary available'}</p>
        <button
          onClick={fetchSummary}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Calls Handled',
      value: summary.metrics.totalCalls,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Revenue',
      value: `$${summary.metrics.totalRevenue.toLocaleString()}`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Appointments',
      value: summary.metrics.appointmentsBooked,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Conversion',
      value: `${summary.metrics.conversionRate.toFixed(1)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: summary.metrics.conversionRate >= 20 ? 'text-green-600' : 'text-amber-600',
      bgColor: summary.metrics.conversionRate >= 20 ? 'bg-green-50' : 'bg-amber-50',
    },
  ]

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200', className)}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Summary</h3>
            <p className="text-sm text-gray-500">
              {new Date(summary.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {summary.agentExecutions.insights} insights
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className={clsx(
              'w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center',
              metric.bgColor,
              metric.color
            )}>
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Highlights & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">
        {summary.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Highlights
            </h4>
            <ul className="space-y-1">
              {summary.highlights.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needs Attention
            </h4>
            <ul className="space-y-1">
              {summary.concerns.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Agent Activity */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Agent Activity</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-900">
                {summary.agentExecutions.total} executions
              </span>
              <span className="text-green-600">
                {summary.agentExecutions.successful} successful
              </span>
              {summary.agentExecutions.failed > 0 && (
                <span className="text-red-600">
                  {summary.agentExecutions.failed} failed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodaySummary
