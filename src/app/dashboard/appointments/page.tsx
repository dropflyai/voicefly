'use client'

import { useState, useEffect, useRef } from 'react'
import Layout from '../../../components/Layout'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import {
  format,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  getHours,
  getMinutes,
} from 'date-fns'
import { clsx } from 'clsx'

interface Appointment {
  id: string
  business_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  service: string
  appointment_date: string
  start_time: string
  end_time: string | null
  notes: string | null
  status: string
  source: string | null
  created_at: string
  updated_at: string | null
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatusCardColor(status: string): string {
  switch (status) {
    case 'confirmed':   return 'bg-blue-500'
    case 'scheduled':   return 'bg-blue-500'
    case 'pending':     return 'bg-amber-400'
    case 'completed':   return 'bg-green-500'
    case 'cancelled':   return 'bg-gray-400'
    case 'no_show':     return 'bg-red-400'
    case 'in_progress': return 'bg-indigo-500'
    default:            return 'bg-gray-400'
  }
}

function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'confirmed':   return 'bg-blue-100 text-blue-800'
    case 'scheduled':   return 'bg-blue-100 text-blue-800'
    case 'pending':     return 'bg-yellow-100 text-yellow-800'
    case 'completed':   return 'bg-green-100 text-green-800'
    case 'cancelled':   return 'bg-red-100 text-red-800'
    case 'no_show':     return 'bg-gray-100 text-gray-800'
    case 'in_progress': return 'bg-indigo-100 text-indigo-800'
    default:            return 'bg-gray-100 text-gray-800'
  }
}

function getSourceDotColor(source: string | null): string {
  switch (source) {
    case 'phone_employee': return 'bg-blue-400'
    case 'sms':            return 'bg-purple-400'
    case 'web':            return 'bg-green-400'
    default:               return 'bg-gray-300'
  }
}

function getSourceLabel(source: string | null): { label: string; color: string } {
  switch (source) {
    case 'phone_employee': return { label: 'Phone', color: 'bg-blue-50 text-blue-700' }
    case 'sms':            return { label: 'SMS',   color: 'bg-purple-50 text-purple-700' }
    case 'web':            return { label: 'Web',   color: 'bg-green-50 text-green-700' }
    default:               return { label: source || 'Unknown', color: 'bg-gray-50 text-gray-600' }
  }
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const parts = time.split(':')
  const h = parseInt(parts[0])
  const m = parts[1]
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
}

function parseTimeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

/** Returns duration in minutes. Defaults to 60 if no end_time. */
function getDurationMinutes(start: string, end: string | null): number {
  if (!end) return 60
  const s = parseTimeToMinutes(start)
  const e = parseTimeToMinutes(end)
  const diff = e - s
  return diff > 0 ? diff : 60
}

const GRID_START_HOUR = 8   // 8 am
const GRID_END_HOUR   = 19  // 7 pm (last label, content ends at 7pm)
const PX_PER_HOUR     = 60
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i)

// ─── sub-components ──────────────────────────────────────────────────────────

interface ApptCardProps {
  apt: Appointment
  onClick: () => void
}

function AppointmentCard({ apt, onClick }: ApptCardProps) {
  const startParts = apt.start_time?.split(':') ?? ['8', '00']
  const startHour  = Math.max(GRID_START_HOUR, Math.min(parseInt(startParts[0]), GRID_END_HOUR))
  const startMin   = parseInt(startParts[1] ?? '0')
  const duration   = getDurationMinutes(apt.start_time, apt.end_time)

  const top    = (startHour - GRID_START_HOUR) * PX_PER_HOUR + startMin
  const height = Math.max(28, Math.min(duration, (GRID_END_HOUR - startHour) * 60 - startMin))
  const color  = getStatusCardColor(apt.status)

  return (
    <div
      className={clsx(
        'absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 cursor-pointer overflow-hidden',
        color,
        'hover:brightness-90 transition-all'
      )}
      style={{ top, height }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={`${apt.customer_name} — ${apt.service}`}
    >
      {/* source dot */}
      <span className={clsx('absolute top-1 right-1 w-1.5 h-1.5 rounded-full', getSourceDotColor(apt.source))} />
      <p className="text-white text-xs font-semibold leading-tight truncate pr-2">{apt.customer_name || 'Unknown'}</p>
      {height >= 44 && (
        <p className="text-white/80 text-[10px] leading-tight truncate">{apt.service}</p>
      )}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [appointments, setAppointments]           = useState<Appointment[]>([])
  const [business, setBusiness]                   = useState<Business | null>(null)
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [updating, setUpdating]                   = useState(false)
  const [viewMode, setViewMode]                   = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate]             = useState<Date>(new Date())
  const scrollRef                                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Scroll to 8am on mount / view change
  useEffect(() => {
    if (viewMode === 'week' && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [viewMode])

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
      if (businessData) setBusiness(businessData)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Session expired. Please log in again.')
        return
      }

      const res = await fetch(`/api/appointments?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to load appointments (${res.status})`)
      }

      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch (err: unknown) {
      console.error('Error loading appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load appointments.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setUpdating(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointment_id: appointmentId, status: newStatus }),
      })

      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a)
        )
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null)
        }
      }
    } catch (err) {
      console.error('Error updating appointment:', err)
    } finally {
      setUpdating(false)
    }
  }

  // ── derived dates ──────────────────────────────────────────────────────────

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays  = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const monthStart  = startOfMonth(currentDate)
  const monthEnd    = endOfMonth(currentDate)
  // Pad to full weeks (Mon start)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd   = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays  = eachDayOfInterval({ start: calStart, end: calEnd })

  // ── header label ──────────────────────────────────────────────────────────

  const headerLabel =
    viewMode === 'week'
      ? `${format(weekStart, 'MMMM d')} – ${isSameDay(weekStart, weekEnd) || weekStart.getMonth() === weekEnd.getMonth() ? format(weekEnd, 'd, yyyy') : format(weekEnd, 'MMM d, yyyy')}`
      : format(currentDate, 'MMMM yyyy')

  // ── navigation ─────────────────────────────────────────────────────────────

  function navPrev() {
    setCurrentDate(d => viewMode === 'week' ? subWeeks(d, 1) : subMonths(d, 1))
  }
  function navNext() {
    setCurrentDate(d => viewMode === 'week' ? addWeeks(d, 1) : addMonths(d, 1))
  }

  // ── appointment lookup helpers ────────────────────────────────────────────

  function apptsForDay(day: Date): Appointment[] {
    const dateStr = format(day, 'yyyy-MM-dd')
    return appointments.filter(a => a.appointment_date === dateStr)
  }

  // ── current time indicator ────────────────────────────────────────────────

  const now         = new Date()
  const nowHour     = getHours(now)
  const nowMin      = getMinutes(now)
  const nowTop      = (nowHour - GRID_START_HOUR) * PX_PER_HOUR + nowMin
  const showNowLine = nowHour >= GRID_START_HOUR && nowHour < GRID_END_HOUR
  const todayInWeek = weekDays.some(d => isToday(d))

  // ── loading / error screens ────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
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
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </Layout>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <Layout business={business}>
      <div className="flex flex-col h-full p-6 gap-4">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between flex-shrink-0">
          {/* Left: nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={navPrev}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-900 min-w-[200px] text-center select-none">
              {headerLabel}
            </h2>
            <button
              onClick={navNext}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Center: view toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {(['week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                  viewMode === v
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Right: refresh */}
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden min-h-0">
            {/* Day header row */}
            <div className="grid flex-shrink-0 border-b border-gray-200" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              <div className="border-r border-gray-100" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="py-2 text-center border-r border-gray-100 last:border-r-0"
                >
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{format(day, 'EEE')}</p>
                  <div className="flex items-center justify-center mt-0.5">
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold',
                        isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-800'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scrollable time grid */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="relative" style={{ height: (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR }}>
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: (hour - GRID_START_HOUR) * PX_PER_HOUR }}
                  />
                ))}

                {/* Time labels + columns */}
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                  {/* Time labels */}
                  <div className="relative border-r border-gray-100">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="absolute right-2 text-[10px] text-gray-400 -translate-y-2"
                        style={{ top: (hour - GRID_START_HOUR) * PX_PER_HOUR }}
                      >
                        {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day) => {
                    const dayApts = apptsForDay(day)
                    return (
                      <div
                        key={day.toISOString()}
                        className="relative border-r border-gray-100 last:border-r-0"
                      >
                        {dayApts.map((apt) => (
                          <AppointmentCard
                            key={apt.id}
                            apt={apt}
                            onClick={() => setSelectedAppointment(apt)}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>

                {/* Current time indicator */}
                {showNowLine && todayInWeek && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    {/* offset to align with columns (past the 56px time label) */}
                    <div className="relative ml-14">
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                      <div className="border-t-2 border-red-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {viewMode === 'month' && (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-100 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
              {calDays.map((day) => {
                const inMonth   = day.getMonth() === currentDate.getMonth()
                const dayApts   = apptsForDay(day)
                const visible   = dayApts.slice(0, 3)
                const overflow  = dayApts.length - 3

                return (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      'p-1.5 min-h-[96px] cursor-pointer hover:bg-gray-50 transition-colors',
                      !inMonth && 'bg-gray-50/50'
                    )}
                    onClick={() => {
                      setCurrentDate(day)
                      setViewMode('week')
                    }}
                  >
                    <div className="flex items-center justify-start mb-1">
                      <span
                        className={clsx(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                          isToday(day)  ? 'bg-blue-600 text-white' :
                          inMonth       ? 'text-gray-800' :
                                          'text-gray-300'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {visible.map(apt => (
                        <div
                          key={apt.id}
                          className={clsx(
                            'rounded px-1 py-0.5 text-[10px] text-white font-medium truncate',
                            getStatusCardColor(apt.status)
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(apt)
                          }}
                        >
                          {apt.customer_name || 'Appt'}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <p className="text-[10px] text-gray-500 pl-1">+{overflow} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Appointment Detail Panel (slide-in from right) ── */}
      {selectedAppointment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedAppointment(null)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-96 z-50 bg-white shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedAppointment.customer_name || 'Unknown'}
                </h3>
                <span className={clsx(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  getStatusBadgeStyle(selectedAppointment.status)
                )}>
                  {selectedAppointment.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Service */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Service</p>
                <p className="text-sm font-medium text-gray-900">{selectedAppointment.service || 'General'}</p>
              </div>

              {/* Date & Time */}
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</p>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">
                      {format(parseISO(selectedAppointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Time</p>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(selectedAppointment.start_time)}
                      {selectedAppointment.end_time && ` – ${formatTime(selectedAppointment.end_time)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                {selectedAppointment.customer_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                    <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${selectedAppointment.customer_phone}`} className="hover:text-blue-600 transition-colors">
                      {selectedAppointment.customer_phone}
                    </a>
                  </div>
                )}
                {selectedAppointment.customer_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${selectedAppointment.customer_email}`} className="hover:text-blue-600 transition-colors truncate">
                      {selectedAppointment.customer_email}
                    </a>
                  </div>
                )}
              </div>

              {/* Source */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Source</p>
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getSourceLabel(selectedAppointment.source).color
                )}>
                  {getSourceLabel(selectedAppointment.source).label}
                </span>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-6 py-4 border-t border-gray-200 space-y-2">
              {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'scheduled') && (
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'confirmed')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Confirm Appointment
                </button>
              )}
              {selectedAppointment.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'completed')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Mark Complete
                </button>
              )}
              {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                  disabled={updating}
                  className="w-full px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancel Appointment
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
