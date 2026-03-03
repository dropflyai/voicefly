'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { supabase } from '../../../lib/supabase-client'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
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

function getStatusStyle(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'scheduled': return 'bg-green-100 text-green-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    case 'no_show': return 'bg-gray-100 text-gray-800'
    case 'in_progress': return 'bg-indigo-100 text-indigo-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getSourceLabel(source: string | null) {
  switch (source) {
    case 'phone_employee': return { label: 'Phone', color: 'bg-blue-50 text-blue-700' }
    case 'sms': return { label: 'SMS', color: 'bg-purple-50 text-purple-700' }
    case 'web': return { label: 'Web', color: 'bg-green-50 text-green-700' }
    default: return { label: source || 'Unknown', color: 'bg-gray-50 text-gray-600' }
  }
}

function formatAppointmentDate(dateStr: string) {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

function formatTime(time: string | null) {
  if (!time) return ''
  const parts = time.split(':')
  const h = parseInt(parts[0])
  const m = parts[1]
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [updating, setUpdating] = useState(false)

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
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError(err.message || 'Failed to load appointments.')
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

  // Client-side filtering
  const filtered = appointments.filter(apt => {
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false
    if (selectedDate && apt.appointment_date !== selectedDate) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        apt.customer_name?.toLowerCase().includes(term) ||
        apt.customer_phone?.includes(term) ||
        apt.service?.toLowerCase().includes(term)
      )
    }
    return true
  })

  // Sort by date/time ascending
  const sorted = [...filtered].sort((a, b) => {
    const dateA = `${a.appointment_date}T${a.start_time || '00:00'}`
    const dateB = `${b.appointment_date}T${b.start_time || '00:00'}`
    return dateA.localeCompare(dateB)
  })

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

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">
              {appointments.length === 0
                ? 'No appointments yet — they will appear here when booked via phone or SMS.'
                : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, phone, or service..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status */}
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>

            {/* Date */}
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg text-sm"
                  title="Clear date filter"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">No appointments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {appointments.length === 0
                  ? 'Appointments booked by your AI phone employees will appear here.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sorted.map((apt) => {
                const source = getSourceLabel(apt.source)
                return (
                  <div
                    key={apt.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {apt.customer_name || 'Unknown Customer'}
                            </p>
                            <span className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              getStatusStyle(apt.status)
                            )}>
                              {apt.status}
                            </span>
                            <span className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              source.color
                            )}>
                              {source.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{apt.service || 'General'}</span>
                            <span className="text-gray-300">|</span>
                            <span>{formatAppointmentDate(apt.appointment_date)}</span>
                            {apt.start_time && (
                              <>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="h-3.5 w-3.5" />
                                  {formatTime(apt.start_time)}
                                  {apt.end_time && ` - ${formatTime(apt.end_time)}`}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {(apt.status === 'pending' || apt.status === 'scheduled') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'confirmed') }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirm"
                            disabled={updating}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'completed') }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark Complete"
                            disabled={updating}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'cancelled') }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                            disabled={updating}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedAppointment(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Customer</h4>
                    <p className="text-base font-medium text-gray-900">
                      {selectedAppointment.customer_name || 'Unknown'}
                    </p>
                    {selectedAppointment.customer_phone && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${selectedAppointment.customer_phone}`} className="hover:text-blue-600">
                          {selectedAppointment.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedAppointment.customer_email && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${selectedAppointment.customer_email}`} className="hover:text-blue-600">
                          {selectedAppointment.customer_email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Appointment Info */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Service</span>
                        <p className="font-medium text-gray-900">{selectedAppointment.service || 'General'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date</span>
                        <p className="font-medium text-gray-900">
                          {formatAppointmentDate(selectedAppointment.appointment_date)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time</span>
                        <p className="font-medium text-gray-900">
                          {formatTime(selectedAppointment.start_time)}
                          {selectedAppointment.end_time && ` - ${formatTime(selectedAppointment.end_time)}`}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Source</span>
                        <p className="font-medium text-gray-900">
                          {getSourceLabel(selectedAppointment.source).label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {/* Status + Actions */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusStyle(selectedAppointment.status)
                      )}>
                        {selectedAppointment.status}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'scheduled') && (
                        <button
                          onClick={() => updateStatus(selectedAppointment.id, 'confirmed')}
                          disabled={updating}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      )}
                      {selectedAppointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(selectedAppointment.id, 'completed')}
                          disabled={updating}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      )}
                      {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                          disabled={updating}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAppointment(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
