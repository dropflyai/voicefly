'use client'

import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ServerIcon 
} from '@heroicons/react/24/outline'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  responseTime: number
  checks: Record<string, any>
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/health')
      const data = await response.json()
      setHealthStatus(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch health status:', error)
      setHealthStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: 0,
        checks: {
          api: { status: 'unhealthy', error: 'Failed to connect' }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="w-5 h-5" />
      case 'degraded': return <ExclamationTriangleIcon className="w-5 h-5" />
      case 'unhealthy': return <ExclamationTriangleIcon className="w-5 h-5" />
      default: return <ClockIcon className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          <button
            onClick={fetchHealthStatus}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {healthStatus && (
          <div className="space-y-4">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                {getStatusIcon(healthStatus.status)}
                <span className="ml-2 capitalize">{healthStatus.status}</span>
              </span>
              <span className="ml-4 text-sm text-gray-500">
                Response time: {healthStatus.responseTime}ms
              </span>
            </div>

            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Service Checks */}
      {healthStatus?.checks && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Health Checks</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(healthStatus.checks).map(([service, check]: [string, any]) => (
              <div key={service} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {service === 'database' && <ServerIcon className="w-4 h-4 mr-2 text-gray-400" />}
                    {service === 'vapi' && <CpuChipIcon className="w-4 h-4 mr-2 text-gray-400" />}
                    {service === 'webhook' && <ServerIcon className="w-4 h-4 mr-2 text-gray-400" />}
                    <span className="font-medium text-gray-900 capitalize">{service}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                </div>

                {check.responseTime && (
                  <p className="text-sm text-gray-500">
                    Response time: {check.responseTime}ms
                  </p>
                )}

                {check.error && (
                  <p className="text-sm text-red-600 mt-1">
                    {check.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}