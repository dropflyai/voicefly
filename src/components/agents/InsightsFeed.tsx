'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface Insight {
  id: string
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  suggestedActions?: string[]
  agentId: string
  createdAt: string
}

interface InsightsFeedProps {
  businessId: string
  limit?: number
  showFilters?: boolean
  className?: string
}

const typeConfig = {
  opportunity: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Opportunity',
  },
  risk: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Risk',
  },
  trend: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Trend',
  },
  anomaly: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Anomaly',
  },
  recommendation: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Recommendation',
  },
}

const agentNames: Record<string, string> = {
  'call-intelligence': 'Call Intelligence',
  'lead-qualification': 'Lead Qualification',
  'customer-retention': 'Customer Retention',
  'appointment-recovery': 'Appointment Recovery',
  'revenue-intelligence': 'Revenue Intelligence',
}

export function InsightsFeed({
  businessId,
  limit = 10,
  showFilters = true,
  className,
}: InsightsFeedProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [businessId, filter])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: limit.toString() })
      if (filter !== 'all') {
        params.set('type', filter)
      }

      const response = await fetch(`/api/agents/insights?${params}`)
      if (!response.ok) throw new Error('Failed to fetch insights')
      const data = await response.json()
      setInsights(data.insights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700',
    }
    return colors[impact as keyof typeof colors] || colors.low
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (loading && insights.length === 0) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200', className)}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <button
            onClick={fetchInsights}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {['all', 'opportunity', 'risk', 'trend', 'recommendation'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                  filter === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {type === 'all' ? 'All' : typeConfig[type as keyof typeof typeConfig].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {insights.length === 0 && !loading && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No insights yet</p>
          <p className="text-gray-400 text-xs mt-1">AI agents will generate insights as they analyze your data</p>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {insights.map((insight) => {
          const config = typeConfig[insight.type]
          const isExpanded = expandedId === insight.id

          return (
            <div
              key={insight.id}
              className={clsx(
                'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                isExpanded && config.bg
              )}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div className="flex gap-3">
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  config.iconBg,
                  config.iconColor
                )}>
                  {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    <span className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                      getImpactBadge(insight.impact)
                    )}>
                      {insight.impact}
                    </span>
                  </div>

                  <p className={clsx(
                    'text-sm text-gray-600 mt-1',
                    !isExpanded && 'line-clamp-2'
                  )}>
                    {insight.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{agentNames[insight.agentId] || insight.agentId}</span>
                    <span>{formatTime(insight.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>

                  {isExpanded && insight.suggestedActions && insight.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Suggested Actions
                      </p>
                      <ul className="space-y-1">
                        {insight.suggestedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InsightsFeed
