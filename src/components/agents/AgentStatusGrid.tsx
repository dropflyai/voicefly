'use client'

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface Agent {
  id: string
  name: string
  description: string
  cluster: string
  enabled: boolean
  status: 'idle' | 'running' | 'completed' | 'failed' | 'queued'
  lastExecution?: string
  executionCount: number
  errorCount: number
  errorRate: number
}

interface AgentStatusGridProps {
  businessId: string
  className?: string
  onTriggerAgent?: (agentId: string) => void
}

const clusterConfig: Record<string, { color: string; label: string }> = {
  customer: { color: 'bg-blue-100 text-blue-700', label: 'Customer' },
  revenue: { color: 'bg-green-100 text-green-700', label: 'Revenue' },
  operations: { color: 'bg-purple-100 text-purple-700', label: 'Operations' },
  marketing: { color: 'bg-pink-100 text-pink-700', label: 'Marketing' },
  system: { color: 'bg-gray-100 text-gray-700', label: 'System' },
}

const statusConfig: Record<string, { color: string; pulse?: boolean }> = {
  idle: { color: 'bg-gray-400' },
  running: { color: 'bg-blue-500', pulse: true },
  completed: { color: 'bg-green-500' },
  failed: { color: 'bg-red-500' },
  queued: { color: 'bg-yellow-500', pulse: true },
}

export function AgentStatusGrid({ businessId, className, onTriggerAgent }: AgentStatusGridProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
    // Poll for updates
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [businessId])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents/status')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data.agents)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async (agentId: string) => {
    if (triggering) return

    setTriggering(agentId)
    try {
      const response = await fetch('/api/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) throw new Error('Failed to trigger agent')

      // Refresh status
      await fetchAgents()
      onTriggerAgent?.(agentId)
    } catch (err) {
      console.error('Error triggering agent:', err)
    } finally {
      setTriggering(null)
    }
  }

  const formatLastRun = (dateStr?: string) => {
    if (!dateStr) return 'Never'
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

  if (loading) {
    return (
      <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={clsx('bg-red-50 border border-red-200 rounded-xl p-4', className)}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAgents}
          className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Agents</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {agents.filter(a => a.enabled).length} Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            {agents.filter(a => a.status === 'running').length} Running
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const cluster = clusterConfig[agent.cluster] || clusterConfig.system
          const status = statusConfig[agent.status] || statusConfig.idle

          return (
            <div
              key={agent.id}
              className={clsx(
                'bg-white rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md',
                !agent.enabled && 'opacity-60'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'w-2.5 h-2.5 rounded-full',
                    status.color,
                    status.pulse && 'animate-pulse'
                  )} />
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                </div>
                <span className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  cluster.color
                )}>
                  {cluster.label}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Last run: {formatLastRun(agent.lastExecution)}</span>
                <span>
                  {agent.executionCount} runs
                  {agent.errorRate > 10 && (
                    <span className="text-red-600 ml-1">({agent.errorRate}% errors)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTrigger(agent.id)}
                  disabled={!agent.enabled || triggering === agent.id || agent.status === 'running'}
                  className={clsx(
                    'flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    agent.enabled && agent.status !== 'running'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {triggering === agent.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Running
                    </span>
                  ) : agent.status === 'running' ? (
                    'Running...'
                  ) : (
                    'Run Now'
                  )}
                </button>

                {!agent.enabled && (
                  <span className="text-xs text-gray-500">Disabled</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentStatusGrid
