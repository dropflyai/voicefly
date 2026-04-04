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
    return { label: 'Live', color: 'text-brand-primary', bg: 'bg-brand-primary/10' }
  }
  if (call.status === 'completed' && call.duration && call.duration > 30) {
    return { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  }
  if (call.status === 'completed' && (!call.duration || call.duration <= 30)) {
    return { label: 'Short', color: 'text-accent', bg: 'bg-accent/10' }
  }
  return { label: call.status || 'Unknown', color: 'text-text-primary', bg: 'bg-surface-high' }
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
            <div className="h-8 bg-surface-highest rounded w-1/4 mb-6"></div>
            <div className="h-10 bg-surface-highest rounded w-48 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-surface-highest rounded-lg"></div>
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
          <p className="text-[#ffb4ab] font-medium mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors text-sm font-medium">
            Try Again
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">Call Log</h1>
            <p className="text-text-secondary mt-1">
              Real-time logs of all AI-handled conversations.
            </p>
          </div>

          {employees.length > 0 && (
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="text-sm px-3 py-2 bg-surface-low text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats Bar */}
        {(() => {
          const completed = calls.filter(c => c.status === 'completed')
          const missed = calls.filter(c => c.status === 'missed' || c.status === 'no-answer')
          const avgDur = completed.length > 0 ? Math.round(completed.reduce((s, c) => s + (c.duration || 0), 0) / completed.length) : 0
          const completionRate = calls.length > 0 ? Math.round((completed.length / calls.length) * 100) : 0
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-low p-6 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Total Calls</p>
                <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{calls.length.toLocaleString()}</p>
              </div>
              <div className="bg-surface-low p-6 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Avg Duration</p>
                <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{avgDur > 0 ? `${Math.floor(avgDur/60)}m ${avgDur%60}s` : '--'}</p>
              </div>
              <div className="bg-surface-low p-6 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Completion</p>
                <p className="text-3xl font-extrabold text-text-primary font-[family-name:var(--font-manrope)]">{completionRate}%</p>
              </div>
              <div className="bg-surface-low p-6 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-text-muted mb-1">Missed</p>
                <p className="text-3xl font-extrabold text-[#ffb4ab] font-[family-name:var(--font-manrope)]">{missed.length}</p>
              </div>
            </div>
          )
        })()}

        {/* Call Table — Stitch Style */}
        <div className="bg-surface-low rounded-2xl overflow-hidden">
          {filteredCalls.length === 0 ? (
            <div className="p-12 text-center">
              <PhoneIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary font-medium">No calls yet</p>
              <p className="text-text-muted text-sm mt-1">
                {filterEmployeeId !== 'all'
                  ? 'No calls for this employee. Try selecting a different filter.'
                  : 'Once someone calls your AI employee, call details will appear here.'}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-highest/30">
                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Caller</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Employee</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Duration</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Outcome</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(65,71,84,0.1)]">
                  {filteredCalls.map(call => {
                    const outcome = getCallOutcome(call)
                    const initials = (call.customer_phone || '??').slice(-2).toUpperCase()
                    return (
                      <tr
                        key={call.id || call.call_id}
                        onClick={() => setSelectedCall(call)}
                        className="hover:bg-surface-med transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-highest flex items-center justify-center text-xs font-bold text-brand-primary">{initials}</div>
                            <div>
                              <span className="font-medium text-text-primary text-sm">{call.customer_phone || 'Unknown'}</span>
                              {call.summary && <p className="text-xs text-text-muted truncate max-w-[200px]">{call.summary}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{getEmployeeName(call.employee_id)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary font-medium">{formatDuration(call.duration)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${outcome.bg} ${outcome.color}`}>
                            <span className={`w-1 h-1 rounded-full mr-2 ${outcome.color.replace('text-', 'bg-')}`}></span>
                            {outcome.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {call.started_at ? formatDistanceToNow(new Date(call.started_at), { addSuffix: true }) : '--'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-surface-highest/20 text-center">
                <span className="text-xs text-text-muted">Showing {filteredCalls.length} of {calls.length} calls</span>
              </div>
            </>
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
            <div className="fixed inset-0 bg-surface0 bg-opacity-50 transition-opacity" />
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
                    <div className="flex h-full flex-col overflow-y-auto bg-surface-low shadow-xl">
                      {/* Header */}
                      <div className="sticky top-0 bg-surface-low border-b border-[rgba(65,71,84,0.15)] px-6 py-4 z-10">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-text-primary">
                            Call Details
                          </Dialog.Title>
                          <button
                            onClick={() => setSelectedCall(null)}
                            className="rounded-md text-text-muted hover:text-text-secondary transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      {selectedCall && (
                        <div className="flex-1 px-6 py-5 space-y-5">
                          {/* Caller */}
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Caller</p>
                            <p className="mt-1 text-sm text-text-primary font-medium">
                              {selectedCall.customer_phone || 'Unknown'}
                            </p>
                          </div>

                          {/* Employee */}
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Handled By</p>
                            <p className="mt-1 text-sm text-text-primary">
                              {getEmployeeName(selectedCall.employee_id)}
                            </p>
                          </div>

                          {/* Meta row */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Direction</p>
                              <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                selectedCall.direction === 'inbound' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {selectedCall.direction || 'inbound'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Status</p>
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
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Duration</p>
                              <p className="mt-1 text-sm text-text-primary">{formatDuration(selectedCall.duration)}</p>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">When</p>
                            <p className="mt-1 text-sm text-text-primary">
                              {selectedCall.started_at
                                ? new Date(selectedCall.started_at).toLocaleString()
                                : '--'}
                            </p>
                          </div>

                          {/* Cost */}
                          {selectedCall.cost != null && selectedCall.cost > 0 && (
                            <div>
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Cost</p>
                              <p className="mt-1 text-sm text-text-primary">${selectedCall.cost.toFixed(4)}</p>
                            </div>
                          )}

                          {/* Recording */}
                          {selectedCall.recording_url && (
                            <div>
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Recording</p>
                              <a
                                href={selectedCall.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center text-sm text-brand-primary hover:text-brand-primary font-medium"
                              >
                                Listen to recording &rarr;
                              </a>
                            </div>
                          )}

                          {/* Summary */}
                          {selectedCall.summary && (
                            <div>
                              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Summary</p>
                              <p className="mt-1 text-sm text-text-primary leading-relaxed">{selectedCall.summary}</p>
                            </div>
                          )}

                          {/* Transcript */}
                          <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Transcript</p>
                            {selectedCall.transcript ? (
                              <pre className="mt-2 text-sm text-text-primary whitespace-pre-wrap font-mono bg-surface rounded-lg p-4 max-h-96 overflow-y-auto leading-relaxed">
                                {selectedCall.transcript}
                              </pre>
                            ) : (
                              <p className="mt-1 text-sm text-text-muted italic">No transcript available</p>
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
