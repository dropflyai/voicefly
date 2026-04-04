'use client'

import { useEffect, useState, Suspense, Fragment } from 'react'
import Layout from '../../components/Layout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../lib/supabase'
import { supabase } from '../../lib/supabase-client'
import {
  getSecureBusinessId,
  redirectToLoginIfUnauthenticated,
} from '../../lib/multi-tenant-auth'
import {
  PhoneIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  XMarkIcon,
  ShoppingBagIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { formatDistanceToNow } from 'date-fns'

interface PhoneEmployee {
  id: string
  name: string
  jobType: string
  isActive: boolean
  phoneNumber?: string
  vapiAssistantId?: string
  createdAt: Date
}

interface EmployeeCall {
  call_id: string
  business_id: string
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

interface PhoneMessage {
  id: string
  caller_name?: string
  caller_phone?: string
  reason?: string
  full_message?: string
  urgency?: string
  status?: string
  created_at: string
}

interface DashboardData {
  employees: PhoneEmployee[]
  recentCalls: EmployeeCall[]
  recentMessages: PhoneMessage[]
  totalCalls: number
  totalMessages: number
  callsToday: number
  messagesToday: number
  avgCallDuration: number
  totalOrders: number
  ordersToday: number
  creditsRemaining: number
  creditsUsed: number
  isTrial: boolean
}

function formatJobType(jobType: string): string {
  return jobType.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function formatPhoneNumber(phone?: string): string {
  if (!phone) return 'No number assigned'
  return phone
}

function getCallOutcome(call: EmployeeCall): { label: string; color: string; dotColor: string } {
  if (call.status === 'in-progress') return { label: 'Live', color: 'text-blue-400 bg-blue-400/10', dotColor: 'bg-blue-400' }
  if (call.status === 'completed' && call.duration && call.duration > 30) return { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10', dotColor: 'bg-emerald-500' }
  if (call.status === 'completed' && (!call.duration || call.duration <= 30)) return { label: 'Short', color: 'text-accent bg-accent/10', dotColor: 'bg-accent' }
  return { label: call.status || 'Unknown', color: 'text-text-muted bg-surface-high', dotColor: 'bg-text-muted' }
}

function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [data, setData] = useState<DashboardData>({
    employees: [], recentCalls: [], recentMessages: [],
    totalCalls: 0, totalMessages: 0, callsToday: 0, messagesToday: 0,
    avgCallDuration: 0, totalOrders: 0, ordersToday: 0,
    creditsRemaining: 0, creditsUsed: 0, isTrial: false,
  })
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [selectedCall, setSelectedCall] = useState<EmployeeCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadDashboardData() }, [])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return null
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      if (redirectToLoginIfUnauthenticated()) return

      const businessId = getSecureBusinessId()
      if (!businessId) { setError('Authentication required. Please log in.'); setLoading(false); return }

      const businessData = await BusinessAPI.getBusiness(businessId)
      if (!businessData) { setError('Business not found.'); return }
      setBusiness(businessData)

      const headers = await getAuthHeaders()
      let employees: PhoneEmployee[] = []
      try {
        const empRes = await fetch(`/api/phone-employees?businessId=${businessId}`, { headers: headers || {} })
        if (empRes.ok) { const empData = await empRes.json(); employees = empData.employees || [] }
      } catch (e) { console.error('Failed to fetch employees:', e) }

      setEmployeeCount(employees.length)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayISO = todayStart.toISOString()

      const [
        { data: callsData, count: callsCount },
        { count: callsTodayCount },
        { data: messagesData, count: messagesCount },
        { count: messagesTodayCount },
        { count: ordersCount },
        { count: ordersTodayCount },
      ] = await Promise.all([
        supabase.from('employee_calls').select('*', { count: 'exact' }).eq('business_id', businessId).order('started_at', { ascending: false }).limit(10),
        supabase.from('employee_calls').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('started_at', todayISO),
        supabase.from('phone_messages').select('*', { count: 'exact' }).eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
        supabase.from('phone_messages').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', todayISO),
        supabase.from('phone_orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('phone_orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', todayISO),
      ])

      const creditData = businessData
      const completedCalls = (callsData || []).filter(c => c.status === 'completed' && c.duration)
      const avgDuration = completedCalls.length > 0 ? Math.round(completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length) : 0
      const monthly = creditData?.monthly_credits || 0
      const purchased = creditData?.purchased_credits || 0
      const used = creditData?.credits_used_this_month || 0
      const isTrial = creditData?.subscription_status === 'trial'

      setData({
        employees, recentCalls: callsData || [], recentMessages: messagesData || [],
        totalCalls: callsCount || 0, totalMessages: messagesCount || 0,
        callsToday: callsTodayCount || 0, messagesToday: messagesTodayCount || 0,
        avgCallDuration: avgDuration, totalOrders: ordersCount || 0, ordersToday: ordersTodayCount || 0,
        creditsRemaining: Math.max(0, monthly + purchased - used), creditsUsed: used, isTrial,
      })
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <Layout business={business || undefined}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-high rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (<div key={i} className="h-28 bg-surface-low rounded-2xl"></div>))}
            </div>
            <div className="h-40 bg-surface-lowest rounded-3xl mb-8"></div>
            <div className="h-64 bg-surface-low rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    )
  }

  // Error
  if (error) {
    return (
      <Layout business={business || undefined}>
        <div className="p-8 text-center">
          <div className="text-[#ffb4ab] text-lg font-medium mb-4">{error}</div>
          <button onClick={() => loadDashboardData()} className="bg-brand-primary text-brand-on px-6 py-2 rounded-md font-medium hover:bg-[#0060d0] transition-colors">Try Again</button>
        </div>
      </Layout>
    )
  }

  // Empty state
  if (employeeCount === 0) {
    return (
      <Layout business={business || undefined}>
        <div className="min-h-screen bg-surface p-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-primary/10 mb-6">
              <PhoneIcon className="h-10 w-10 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Welcome to VoiceFly!
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Let&apos;s create your first AI employee and start capturing calls 24/7
            </p>
            <a href="/dashboard/employees" className="inline-flex items-center px-8 py-4 text-lg font-semibold text-brand-on bg-brand-primary rounded-lg hover:bg-[#0060d0] transition-all">
              Create Your First Employee <ArrowRightIcon className="ml-3 h-6 w-6" />
            </a>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-12 max-w-3xl mx-auto">
              {[
                { step: '1', title: 'Pick a Type', desc: 'Receptionist, Order Taker, Customer Service, and more' },
                { step: '2', title: 'Configure', desc: 'Set up name, voice, and capabilities in minutes' },
                { step: '3', title: 'Go Live', desc: 'Get a phone number and start answering calls' },
              ].map(s => (
                <div key={s.step} className="bg-surface-low rounded-xl p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-xl mb-4 font-[family-name:var(--font-manrope)]">{s.step}</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{s.title}</h3>
                  <p className="text-text-secondary text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Main dashboard
  const activeEmployees = data.employees.filter((e) => e.isActive)
  const totalCredits = data.creditsRemaining + data.creditsUsed
  const creditWarning = totalCredits > 0 && data.creditsUsed >= totalCredits * 0.8

  return (
    <Layout business={business || undefined}>
      <div className="p-8 space-y-10">
        {/* Low credit warning */}
        {creditWarning && (
          <div className="bg-accent/10 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-accent flex-shrink-0" />
              <p className="text-sm text-accent"><strong>Running low on minutes</strong> — {data.creditsRemaining} minutes remaining this month.</p>
            </div>
            <a href="/dashboard/billing" className="text-xs font-medium text-accent underline whitespace-nowrap ml-4">Add more</a>
          </div>
        )}

        {/* Welcome Header */}
        <section className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-manrope)] font-extrabold tracking-tight text-text-primary">
            Welcome back, <span className="text-brand-primary">{business?.name || 'there'}</span>!
          </h2>
          <p className="text-text-secondary font-medium text-lg">
            {activeEmployees.length} active employee{activeEmployees.length !== 1 ? 's' : ''} ready to take calls.
            <span className="text-text-primary font-bold ml-1">{data.totalCalls} total calls</span> handled.
          </p>
        </section>

        {/* Metric Cards — Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard icon={PhoneIcon} label="Calls Today" value={data.callsToday} trend={data.totalCalls > 0 ? `${data.totalCalls} all time` : undefined} />
          <MetricCard icon={ChatBubbleLeftIcon} label="Messages Sent" value={data.messagesToday} trend={data.totalMessages > 0 ? `${data.totalMessages} all time` : undefined} />
          <MetricCard icon={ShoppingBagIcon} label="Orders" value={data.ordersToday} trend={data.totalOrders > 0 ? `${data.totalOrders} all time` : undefined} />
          <MetricCard icon={StarIcon} label="Avg Duration" value={formatDuration(data.avgCallDuration)} trend="per completed call" />
        </section>

        {/* Sonic Health Overview */}
        <section className="bg-surface-lowest rounded-3xl p-10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-lg">
              <h4 className="text-2xl font-[family-name:var(--font-manrope)] font-bold text-text-primary">Sonic Health Overview</h4>
              <p className="text-text-secondary">
                {activeEmployees.length > 0
                  ? `Your AI employees are operating normally. ${data.callsToday > 0 ? `${data.callsToday} calls handled today so far.` : 'Waiting for incoming calls.'}`
                  : 'No active employees. Create one to get started.'}
              </p>
              <div className="flex gap-4">
                <a href="/dashboard/voice-ai" className="px-6 py-2 bg-text-primary text-surface font-bold rounded-lg hover:bg-text-secondary transition-colors text-sm">View Deep Insights</a>
                <a href="/dashboard/employees" className="px-6 py-2 border border-[rgba(65,71,84,0.3)] text-text-primary font-bold rounded-lg hover:bg-surface-low transition-colors text-sm">Manage Employees</a>
              </div>
            </div>
            {/* Waveform visualization */}
            <div className="w-full md:w-1/2 h-32 flex items-center justify-center gap-1">
              {[8, 16, 24, 32, 20, 28, 12, 24, 32, 16, 8, 20].map((h, i) => (
                <div key={i} className="w-1 bg-brand-primary rounded-full" style={{ height: `${h * 4}px`, opacity: 0.3 + (h / 32) * 0.7 }} />
              ))}
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full" />
        </section>

        {/* Recent Conversations Table */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-[family-name:var(--font-manrope)] font-bold text-text-primary">Recent Conversations</h3>
              <p className="text-text-secondary text-sm">Real-time logs of your AI&apos;s interactions.</p>
            </div>
            <a href="/dashboard/voice-ai" className="text-brand-light font-bold flex items-center gap-2 text-sm hover:underline">
              View All
            </a>
          </div>

          <div className="bg-surface-low rounded-2xl overflow-hidden">
            {data.recentCalls.length === 0 ? (
              <div className="p-12 text-center">
                <PhoneIcon className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No calls yet</p>
                <p className="text-text-muted text-sm mt-1">Your AI employees are ready and waiting!</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-highest/30">
                      <th className="px-8 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Caller</th>
                      <th className="px-8 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Duration</th>
                      <th className="px-8 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">Outcome</th>
                      <th className="px-8 py-4 text-xs uppercase tracking-widest text-text-muted font-bold">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(65,71,84,0.1)]">
                    {data.recentCalls.map((call) => {
                      const outcome = getCallOutcome(call)
                      const initials = (call.customer_phone || '??').slice(-2).toUpperCase()
                      return (
                        <tr key={call.call_id} onClick={() => setSelectedCall(call)} className="hover:bg-surface-med transition-colors cursor-pointer group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-surface-highest flex items-center justify-center text-xs font-bold text-brand-primary">{initials}</div>
                              <span className="font-bold text-text-primary">{call.customer_phone || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-text-secondary font-medium">{formatDuration(call.duration)}</td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${outcome.color}`}>
                              <span className={`w-1 h-1 ${outcome.dotColor} rounded-full mr-2`}></span>
                              {outcome.label}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-text-secondary text-sm">
                            {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="px-8 py-4 bg-surface-highest/20 flex justify-center">
                  <a href="/dashboard/voice-ai" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">View All Conversation History</a>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Call Detail Slide-over */}
      <Transition.Root show={!!selectedCall} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedCall(null)}>
          <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-surface-med sonic-shadow">
                      <div className="px-6 py-5 border-b border-[rgba(65,71,84,0.15)]">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)]">Call Details</Dialog.Title>
                          <button onClick={() => setSelectedCall(null)} className="rounded-md text-text-muted hover:text-text-primary"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                      </div>
                      {selectedCall && (() => {
                        const outcome = getCallOutcome(selectedCall)
                        return (
                          <div className="flex-1 px-6 py-5 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-xs font-medium text-text-muted uppercase">Caller</p><p className="mt-1 text-sm font-medium text-text-primary">{selectedCall.customer_phone || 'Unknown'}</p></div>
                              <div><p className="text-xs font-medium text-text-muted uppercase">Direction</p><p className="mt-1 text-sm font-medium text-text-primary capitalize">{selectedCall.direction || 'inbound'}</p></div>
                              <div><p className="text-xs font-medium text-text-muted uppercase">Status</p><span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${outcome.color}`}>{outcome.label}</span></div>
                              <div><p className="text-xs font-medium text-text-muted uppercase">Duration</p><p className="mt-1 text-sm font-medium text-text-primary">{formatDuration(selectedCall.duration)}</p></div>
                              <div><p className="text-xs font-medium text-text-muted uppercase">When</p><p className="mt-1 text-sm text-text-primary">{selectedCall.started_at ? new Date(selectedCall.started_at).toLocaleString() : '--'}</p></div>
                              {selectedCall.cost != null && (<div><p className="text-xs font-medium text-text-muted uppercase">Cost</p><p className="mt-1 text-sm font-medium text-text-primary">${selectedCall.cost.toFixed(2)}</p></div>)}
                            </div>
                            {selectedCall.recording_url && (
                              <div><p className="text-xs font-medium text-text-muted uppercase mb-2">Recording</p><a href={selectedCall.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 text-sm font-medium text-brand-light bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition-colors">Listen to Recording</a></div>
                            )}
                            {selectedCall.summary && (
                              <div><p className="text-xs font-medium text-text-muted uppercase mb-2">Summary</p><div className="bg-surface-low rounded-lg p-4"><p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedCall.summary}</p></div></div>
                            )}
                            {selectedCall.transcript ? (
                              <div><p className="text-xs font-medium text-text-muted uppercase mb-2">Transcript</p><div className="bg-surface-low rounded-lg p-4 max-h-96 overflow-y-auto"><p className="text-sm text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">{selectedCall.transcript}</p></div></div>
                            ) : (
                              <div><p className="text-xs font-medium text-text-muted uppercase mb-2">Transcript</p><div className="bg-surface-low rounded-lg p-4 text-center"><p className="text-sm text-text-muted">No transcript available</p></div></div>
                            )}
                          </div>
                        )
                      })()}
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

function MetricCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string | number; trend?: string }) {
  return (
    <div className="bg-surface-low p-8 rounded-2xl space-y-4 hover:bg-surface-med transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-brand-primary/10 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-brand-primary" />
        </div>
      </div>
      <div>
        <p className="text-text-secondary text-sm font-medium">{label}</p>
        <h3 className="text-4xl font-[family-name:var(--font-manrope)] font-extrabold text-text-primary">{value}</h3>
        {trend && <p className="text-xs text-text-muted mt-1">{trend}</p>}
      </div>
    </div>
  )
}

function ProtectedDashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-surface-highest border-t-brand-primary rounded-full animate-spin" />
        </div>
      }>
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  )
}

export default ProtectedDashboardPage
