'use client'

import { useState, useEffect, Fragment } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  PhoneIcon,
  XMarkIcon,
  FunnelIcon,
  PhoneArrowDownLeftIcon,
  PhoneArrowUpRightIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { formatDistanceToNow } from 'date-fns'

interface PhoneEmployee {
  id: string
  name: string
  jobType: string
  isActive: boolean
  phoneNumber?: string
}

interface EmployeeCall {
  id: string
  call_id: string
  employee_id: string
  customer_phone: string
  status: string
  direction: string
  started_at: string
  ended_at?: string
  duration?: number
  transcript?: string
  recording_url?: string
  summary?: string
  cost?: number
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getCallOutcome(call: EmployeeCall): { label: string; color: string; bg: string } {
  if (call.status === 'in-progress') {
    return { label: 'Live', color: 'text-blue-700', bg: 'bg-blue-100' }
  }
  if (call.status === 'completed' && call.duration && call.duration > 30) {
    return { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100' }
  }
  if (call.status === 'completed' && (!call.duration || call.duration <= 30)) {
    return { label: 'Short', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  }
  return { label: call.status || 'Unknown', color: 'text-gray-700', bg: 'bg-gray-100' }
}

function CallLogPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [employees, setEmployees] = useState<PhoneEmployee[]>([])
  const [calls, setCalls] = useState<EmployeeCall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<EmployeeCall | null>(null)
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (redirectToLoginIfUnauthenticated()) return

      const businessId = getSecureBusinessId()
      if (!businessId) {
        setError('Authentication required. Please log in.')
        return
      }

      const businessData = await BusinessAPI.getBusiness(businessId)
      if (!businessData) {
        setError('Business not found.')
        return
      }
      setBusiness(businessData)

      const { data: { session } } = await supabase.auth.getSession()

      // Load employees and calls in parallel
      const [employeesResult, callsResult] = await Promise.all([
        session?.access_token
          ? fetch(`/api/phone-employees?businessId=${businessId}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).then(r => r.ok ? r.json() : { employees: [] }).catch(() => ({ employees: [] }))
          : Promise.resolve({ employees: [] }),
        supabase
          .from('employee_calls')
          .select('*')
          .eq('business_id', businessId)
          .order('started_at', { ascending: false })
          .limit(100),
      ])

      setEmployees(employeesResult.employees || [])
      setCalls(callsResult.data || [])
    } catch (err) {
      console.error('Error loading call log:', err)
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = filterEmployeeId === 'all'
    ? calls
    : calls.filter(c => c.employee_id === filterEmployeeId)

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp?.name || 'Unknown Employee'
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout business={business}>
        <div className="p-8 text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Try Again
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Log</h1>
            <p className="text-gray-600 mt-1">
              {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''} recorded
            </p>
          </div>

          {/* Employee filter */}
          {employees.length > 0 && (
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Call list */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredCalls.length === 0 ? (
            <div className="p-12 text-center">
              <PhoneIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No calls yet</p>
              <p className="text-gray-400 text-sm mt-1">
                {filterEmployeeId !== 'all'
                  ? 'No calls for this employee. Try selecting a different filter.'
                  : 'Once someone calls your AI employee, call details will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCalls.map(call => {
                const outcome = getCallOutcome(call)
                return (
                  <button
                    key={call.id || call.call_id}
                    onClick={() => setSelectedCall(call)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    {/* Direction icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      call.direction === 'outbound' ? 'bg-purple-50' : 'bg-blue-50'
                    }`}>
                      {call.direction === 'outbound' ? (
                        <PhoneArrowUpRightIcon className="h-4 w-4 text-purple-600" />
                      ) : (
                        <PhoneArrowDownLeftIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>

                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {call.customer_phone || 'Unknown Caller'}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${outcome.bg} ${outcome.color}`}>
                          {outcome.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {getEmployeeName(call.employee_id)}
                        {call.summary ? ` — ${call.summary}` : ''}
                      </p>
                    </div>

                    {/* Duration & time */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-gray-900">{formatDuration(call.duration)}</p>
                      <p className="text-xs text-gray-500">
                        {call.started_at
                          ? formatDistanceToNow(new Date(call.started_at), { addSuffix: true })
                          : '--'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Slide-over */}
      <Transition.Root show={!!selectedCall} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedCall(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                      {/* Header */}
                      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Call Details
                          </Dialog.Title>
                          <button
                            onClick={() => setSelectedCall(null)}
                            className="rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      {selectedCall && (
                        <div className="flex-1 px-6 py-5 space-y-5">
                          {/* Caller */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Caller</p>
                            <p className="mt-1 text-sm text-gray-900 font-medium">
                              {selectedCall.customer_phone || 'Unknown'}
                            </p>
                          </div>

                          {/* Employee */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Handled By</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {getEmployeeName(selectedCall.employee_id)}
                            </p>
                          </div>

                          {/* Meta row */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Direction</p>
                              <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                selectedCall.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {selectedCall.direction || 'inbound'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                              {(() => {
                                const o = getCallOutcome(selectedCall)
                                return (
                                  <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${o.bg} ${o.color}`}>
                                    {o.label}
                                  </span>
                                )
                              })()}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</p>
                              <p className="mt-1 text-sm text-gray-900">{formatDuration(selectedCall.duration)}</p>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">When</p>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedCall.started_at
                                ? new Date(selectedCall.started_at).toLocaleString()
                                : '--'}
                            </p>
                          </div>

                          {/* Cost */}
                          {selectedCall.cost != null && selectedCall.cost > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</p>
                              <p className="mt-1 text-sm text-gray-900">${selectedCall.cost.toFixed(4)}</p>
                            </div>
                          )}

                          {/* Recording */}
                          {selectedCall.recording_url && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recording</p>
                              <a
                                href={selectedCall.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Listen to recording &rarr;
                              </a>
                            </div>
                          )}

                          {/* Summary */}
                          {selectedCall.summary && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Summary</p>
                              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{selectedCall.summary}</p>
                            </div>
                          )}

                          {/* Transcript */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transcript</p>
                            {selectedCall.transcript ? (
                              <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed">
                                {selectedCall.transcript}
                              </pre>
                            ) : (
                              <p className="mt-1 text-sm text-gray-400 italic">No transcript available</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </Layout>
  )
}

export default function ProtectedCallLogPage() {
  return (
    <ProtectedRoute>
      <CallLogPage />
    </ProtectedRoute>
  )
}
