'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface HealthDimension {
  score: number
  trend: 'improving' | 'stable' | 'declining'
  alerts: number
  topIssue?: string
}

interface BusinessHealthData {
  overall: number
  revenue: HealthDimension
  customer: HealthDimension
  operations: HealthDimension
  compliance: HealthDimension
  system: HealthDimension
  lastUpdated: string
}

interface BusinessHealthCardProps {
  businessId: string
  className?: string
}

export function BusinessHealthCard({ businessId, className }: BusinessHealthCardProps) {
  const [health, setHealth] = useState<BusinessHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
  }, [businessId])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents/status')
      if (!response.ok) throw new Error('Failed to fetch health')
      const data = await response.json()
      setHealth(data.businessHealth)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )
      case 'declining':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !health) {
    return (
      <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <p className="text-red-600 text-sm">{error || 'No health data available'}</p>
        <button
          onClick={fetchHealth}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    )
  }

  const dimensions = [
    { key: 'revenue', label: 'Revenue', data: health.revenue },
    { key: 'customer', label: 'Customer', data: health.customer },
    { key: 'operations', label: 'Operations', data: health.operations },
    { key: 'system', label: 'System', data: health.system },
  ]

  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Business Health</h3>
        <span className="text-xs text-gray-500">
          Updated {new Date(health.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(health.overall / 100) * 251.2} 251.2`}
              className={getScoreColor(health.overall)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={clsx('text-2xl font-bold', getScoreColor(health.overall))}>
              {health.overall}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className={clsx('text-lg font-medium', getScoreColor(health.overall))}>
            {health.overall >= 80 ? 'Excellent' :
             health.overall >= 60 ? 'Good' :
             health.overall >= 40 ? 'Fair' : 'Needs Attention'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {health.overall >= 80 ? 'Your business is performing well across all dimensions.' :
             health.overall >= 60 ? 'Some areas could use improvement.' :
             'Several areas need attention.'}
          </p>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        {dimensions.map(({ key, label, data }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-600">{label}</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', getScoreBg(data.score))}
                style={{ width: `${data.score}%` }}
              />
            </div>
            <div className="flex items-center gap-1 w-16">
              {getTrendIcon(data.trend)}
              <span className="text-sm font-medium text-gray-900">{data.score}</span>
            </div>
            {data.alerts > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {data.alerts}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Top Issues */}
      {dimensions.some(d => d.data.topIssue) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Top Issues</p>
          <div className="space-y-1">
            {dimensions
              .filter(d => d.data.topIssue)
              .map(({ key, label, data }) => (
                <p key={key} className="text-sm text-gray-600">
                  <span className="font-medium">{label}:</span> {data.topIssue}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessHealthCard
