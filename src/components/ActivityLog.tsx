'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
import { getCurrentBusinessId } from '../lib/auth-utils'
import {
  ClockIcon,
  UserCircleIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'

interface AuditLog {
  id: string
  user_name: string
  user_email: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  entity_type: string
  entity_name: string
  created_at: string
  changes?: any
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'create':
      return <PlusCircleIcon className="h-5 w-5 text-green-500" />
    case 'update':
      return <PencilSquareIcon className="h-5 w-5 text-blue-500" />
    case 'delete':
      return <TrashIcon className="h-5 w-5 text-red-500" />
    case 'login':
      return <ArrowRightOnRectangleIcon className="h-5 w-5 text-purple-500" />
    case 'logout':
      return <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-500" />
    default:
      return <ClockIcon className="h-5 w-5 text-gray-400" />
  }
}

const getActionText = (action: string) => {
  switch (action) {
    case 'create':
      return 'created'
    case 'update':
      return 'updated'
    case 'delete':
      return 'deleted'
    case 'login':
      return 'logged in'
    case 'logout':
      return 'logged out'
    default:
      return action
  }
}

const getEntityTypeLabel = (type: string) => {
  switch (type) {
    case 'service':
      return 'service'
    case 'customer':
      return 'customer'
    case 'appointment':
      return 'appointment'
    case 'staff':
      return 'staff member'
    case 'payment':
      return 'payment'
    default:
      return type
  }
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMins < 1) return 'Just now'
  if (diffInMins < 60) return `${diffInMins}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function ActivityLog({ limit = 10 }: { limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivityLogs()
  }, [])

  const loadActivityLogs = async () => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error loading activity logs:', error)
        return
      }

      setLogs(data || [])
    } catch (error) {
      console.error('Error loading activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getActionIcon(log.action)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{log.user_name}</span>
                {' '}
                <span className="text-gray-600">{getActionText(log.action)}</span>
                {' '}
                {log.entity_name && (
                  <>
                    <span className="text-gray-600">{getEntityTypeLabel(log.entity_type)}</span>
                    {' '}
                    <span className="font-medium">"{log.entity_name}"</span>
                  </>
                )}
              </p>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {formatTimestamp(log.created_at)}
              </span>
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <UserCircleIcon className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{log.user_email}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
