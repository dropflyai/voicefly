'use client'

import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import { BusinessAPI, LocationAPIImpl, PaymentAPIImpl, LoyaltyAPIImpl } from '../../../lib/supabase'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import type { Location, PaymentWithDetails, LoyaltyCustomer } from '../../../lib/supabase-types-mvp'
import AppointmentLocationBadge from '../../../components/AppointmentLocationBadge'
import LocationSelector from '../../../components/LocationSelector'
import PaymentStatusModal from '../../../components/PaymentStatusModal'
import LoyaltyPointsEarned from '../../../components/LoyaltyPointsEarned'
import { 
  CalendarIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CreditCardIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow } from 'date-fns'
import { clsx } from 'clsx'

interface Appointment {
  id: string
  booking_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: string
  service_duration: number
  service_price: number
  appointment_date: string
  start_time: string
  end_time: string
  technician_name: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'in_progress'
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded'
  created_at: string
}

// No mock data - show real appointments only

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [business, setBusiness] = useState<any>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Get business ID from demo or localStorage
  const businessId = getCurrentBusinessId() || 'bb18c6ca-7e97-449d-8245-e3c28a6b6971' // Bella's Nails Studio

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload appointments when filters change
  useEffect(() => {
    if (business) {
      loadAppointments()
    }
  }, [selectedLocation, business])

  useEffect(() => {
    filterAppointments()
  }, [searchTerm, statusFilter, selectedDate, appointments])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load business info
      const businessData = await BusinessAPI.getBusiness(businessId)
      setBusiness(businessData)
      
      // Load locations for Business tier
      if (businessData?.subscription_tier === 'business') {
        const locationAPI = new LocationAPIImpl()
        const locationsData = await locationAPI.getLocations(businessId)
        setLocations(locationsData)
        
        // Set primary location as default
        const primaryLocation = locationsData.find(loc => loc.is_primary)
        if (primaryLocation) {
          setSelectedLocation(primaryLocation)
        }
      }
      
      // Load appointments
      await loadAppointments()
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    try {
      const filters: any = {}
      if (selectedLocation) {
        filters.location_id = selectedLocation.id
      }
      
      const realAppointments = await BusinessAPI.getAppointments(businessId, filters)
      
      // Transform and enhance the data
      const transformedAppointments: Appointment[] = realAppointments.map(apt => ({
        id: apt.id,
        booking_id: apt.id.slice(0, 8),
        customer_name: apt.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : 'Unknown Customer',
        customer_email: apt.customer?.email || '',
        customer_phone: apt.customer?.phone || '',
        service_type: apt.service?.name || 'General Service',
        service_duration: apt.service?.duration_minutes || 60,
        service_price: apt.service?.base_price || 55,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time?.slice(0, 5) || '00:00',
        end_time: apt.end_time?.slice(0, 5) || '01:00',
        technician_name: apt.staff?.first_name || 'Staff Member',
        status: apt.status || 'pending',
        payment_status: 'pending' as const, // This would come from payment records
        created_at: apt.created_at,
        // Enhanced fields
        location: locations.find(loc => loc.id === apt.location_id) || null,
        raw_appointment: apt // Keep reference to original data
      }))
      
      setAppointments(transformedAppointments)
      
    } catch (error) {
      console.error('Error loading appointments:', error)
      if (!business) {
        setError('Failed to load appointments')
        setAppointments([])
      }
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(apt => apt.appointment_date === selectedDate)
    }

    setFilteredAppointments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'no_show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'partially_paid': return 'text-blue-600'
      case 'refunded': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const updateAppointmentStatus = async (id: string, newStatus: Appointment['status']) => {
    // Update local state immediately
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: newStatus } : apt
    ))
    
    // Update in database
    try {
      const updatedApt = await BusinessAPI.updateAppointment(id, { status: newStatus })
      
      // If marking as completed, award loyalty points
      if (newStatus === 'completed' && updatedApt) {
        const appointment = appointments.find(apt => apt.id === id)
        if (appointment && (appointment as any).raw_appointment?.customer_id) {
          await BusinessAPI.awardLoyaltyPoints(
            (appointment as any).raw_appointment.customer_id,
            appointment.service_price || 0,
            1
          )
          console.log('Loyalty points awarded for completed appointment')
        }
      }
      
      // Reload appointments to get updated data
      await loadAppointments()
    } catch (error) {
      console.error('Error updating appointment status:', error)
      // Revert local state on error
      await loadAppointments()
    }
  }

  const handleEditAppointment = async () => {
    if (!editingAppointment) return
    
    try {
      const updated = await BusinessAPI.updateAppointment(editingAppointment.id, {
        appointment_date: editingAppointment.appointment_date,
        start_time: editingAppointment.start_time,
        end_time: editingAppointment.end_time,
        service_id: (editingAppointment as any).raw_appointment?.service_id
      })
      
      if (updated) {
        await loadAppointments()
        setShowEditModal(false)
        setEditingAppointment(null)
      }
    } catch (error) {
      console.error('Failed to update appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    
    try {
      const cancelled = await BusinessAPI.cancelAppointment(selectedAppointment.id, cancelReason)
      
      if (cancelled) {
        await loadAppointments()
        setShowCancelModal(false)
        setSelectedAppointment(null)
        setCancelReason('')
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  const handlePaymentProcessed = async (paymentData: any) => {
    if (!selectedAppointment) return
    
    // Update appointment payment status
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id ? { 
        ...apt, 
        payment_status: 'paid' as const,
        status: 'completed' as const
      } : apt
    ))
    
    // Award loyalty points if Professional+ tier
    if (business && ['professional', 'business'].includes(business.subscription_tier)) {
      try {
        const loyaltyAPI = new LoyaltyAPIImpl()
        const loyaltyProgram = await loyaltyAPI.getLoyaltyProgram(businessId)
        
        if (loyaltyProgram && (selectedAppointment as any).raw_appointment?.customer_id) {
          // Award points based on payment amount
          const pointsEarned = Math.floor((paymentData.total_amount / 100) * loyaltyProgram.points_per_dollar)
          
          await loyaltyAPI.awardPoints(
            businessId,
            (selectedAppointment as any).raw_appointment.customer_id,
            selectedAppointment.id,
            pointsEarned
          )
          
          // Get updated customer data for loyalty display
          const loyaltyCustomers = await loyaltyAPI.getLoyaltyCustomers(businessId)
          
          if (loyaltyCustomers.length > 0) {
            setLoyaltyData({
              customer: loyaltyCustomers[0],
              pointsEarned,
              paymentAmount: paymentData.total_amount
            })
            setShowLoyaltyModal(true)
          }
        }
      } catch (error) {
        console.error('Failed to award loyalty points:', error)
      }
    }
    
    setShowPaymentModal(false)
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-4 text-gray-600">Loading appointments...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">
              {appointments.length === 0
                ? '📞 No appointments yet - Call +14243519304 to create your first booking!'
                : `Managing ${appointments.length} appointments (including real phone bookings)`
              }
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button 
              onClick={loadAppointments}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Refresh
            </button>
            <button 
              onClick={() => alert('New Appointment feature coming soon!\n\nFor now, customers can book appointments through:\n• Phone: (424) 351-9304\n• Customer Portal: /customer/login\n• Voice AI Assistant')}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Appointment
            </button>
          </div>
        </div>

        {/* Location Filter for Business Tier */}
        {business?.subscription_tier === 'business' && locations.length > 1 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                Filter by Location
              </h3>
              <div className="max-w-xs">
                <LocationSelector
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  placeholder="All Locations"
                  includeAllOption={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search appointments..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <input
                type="date"
                className="input-field"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Payment Status Filter for Professional+ */}
            {['professional', 'business'].includes(business?.subscription_tier || '') && (
              <div>
                <select className="input-field">
                  <option value="all">All Payments</option>
                  <option value="pending">Payment Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {filteredAppointments.length} Appointments
              {selectedDate && (
                <span className="text-gray-500 font-normal ml-2">
                  on {formatDate(selectedDate)}
                </span>
              )}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(appointment)
                  setShowModal(true)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-brand-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {appointment.customer_name}
                          </p>
                          <span className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(appointment.status)
                          )}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        {/* Location Badge for Business Tier */}
                        {business?.subscription_tier === 'business' && (appointment as any).location && (
                          <AppointmentLocationBadge 
                            location={(appointment as any).location} 
                            size="sm" 
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{appointment.service_type}</span>
                          <span>•</span>
                          <span>{appointment.technician_name}</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {appointment.start_time} - {appointment.end_time}
                          </div>
                        </div>
                        
                        {/* Payment Status for Professional+ */}
                        {['professional', 'business'].includes(business?.subscription_tier || '') && (
                          <div className={clsx(
                            'flex items-center text-xs font-medium',
                            getPaymentStatusColor(appointment.payment_status)
                          )}>
                            <CreditCardIcon className="h-3 w-3 mr-1" />
                            {appointment.payment_status.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${appointment.service_price}
                      </p>
                      <p className={clsx(
                        'text-xs',
                        getPaymentStatusColor(appointment.payment_status)
                      )}>
                        {appointment.payment_status.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateAppointmentStatus(appointment.id, 'confirmed')
                            }}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Confirm"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateAppointmentStatus(appointment.id, 'cancelled')
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateAppointmentStatus(appointment.id, 'completed')
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Mark Complete"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Payment Processing for Professional+ */}
                      {['professional', 'business'].includes(business?.subscription_tier || '') && 
                       appointment.status === 'completed' && 
                       appointment.payment_status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(appointment)
                            setShowPaymentModal(true)
                          }}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Process Payment"
                        >
                          <CreditCardIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Loyalty Points for Professional+ */}
                      {['professional', 'business'].includes(business?.subscription_tier || '') && 
                       appointment.payment_status === 'paid' && (
                        <div className="p-1 text-green-600" title="Points Awarded">
                          <GiftIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>

        {/* Appointment Detail Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Appointment Details
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedAppointment.customer_name}</h4>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          {selectedAppointment.customer_email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {selectedAppointment.customer_phone}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Service:</span>
                          <p className="font-medium">{selectedAppointment.service_type}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Technician:</span>
                          <p className="font-medium">{selectedAppointment.technician_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <p className="font-medium">{formatDate(selectedAppointment.appointment_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <p className="font-medium">{selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <p className="font-medium">{selectedAppointment.service_duration} minutes</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Price:</span>
                          <p className="font-medium">${selectedAppointment.service_price}</p>
                        </div>
                        {business?.subscription_tier === 'business' && (selectedAppointment as any).location && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Location:</span>
                            <div className="mt-1">
                              <AppointmentLocationBadge 
                                location={(selectedAppointment as any).location} 
                                size="sm" 
                                showAddress={true}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-500 text-sm">Status:</span>
                          <span className={clsx(
                            'ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(selectedAppointment.status)
                          )}>
                            {selectedAppointment.status}
                          </span>
                        </div>
                        {['professional', 'business'].includes(business?.subscription_tier || '') && (
                          <div>
                            <span className="text-gray-500 text-sm">Payment:</span>
                            <span className={clsx(
                              'ml-2 text-sm font-medium',
                              getPaymentStatusColor(selectedAppointment.payment_status)
                            )}>
                              {selectedAppointment.payment_status.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  {/* Payment Processing Button for Professional+ */}
                  {['professional', 'business'].includes(business?.subscription_tier || '') && 
                   selectedAppointment.status === 'completed' && 
                   selectedAppointment.payment_status === 'pending' && (
                    <button
                      type="button"
                      className="btn-primary sm:ml-3"
                      onClick={() => {
                        setShowModal(false)
                        setShowPaymentModal(true)
                      }}
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Process Payment
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary mt-3 sm:mt-0"
                        onClick={() => {
                          setEditingAppointment(selectedAppointment)
                          setShowEditModal(true)
                          setShowModal(false)
                        }}
                      >
                        Edit Appointment
                      </button>
                      <button
                        type="button"
                        className="mt-3 sm:mt-0 sm:ml-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        onClick={() => {
                          setShowCancelModal(true)
                          setShowModal(false)
                        }}
                      >
                        Cancel Appointment
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Processing Modal */}
        <PaymentStatusModal
          appointment={selectedAppointment && (selectedAppointment as any).raw_appointment ? (selectedAppointment as any).raw_appointment : selectedAppointment}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentProcessed={handlePaymentProcessed}
        />
        
        {/* Loyalty Points Earned Modal */}
        <LoyaltyPointsEarned
          customer={loyaltyData?.customer || null}
          pointsEarned={loyaltyData?.pointsEarned || 0}
          previousTier={null} // Would be calculated based on loyalty data
          newTier={loyaltyData?.customer?.current_tier || null}
          isOpen={showLoyaltyModal}
          onClose={() => setShowLoyaltyModal(false)}
          paymentAmount={loyaltyData?.paymentAmount || 0}
        />

        {/* Edit Appointment Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Edit Appointment
                    </h3>
                    <button
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingAppointment(null)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editingAppointment.appointment_date}
                        onChange={(e) => setEditingAppointment({
                          ...editingAppointment,
                          appointment_date: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={editingAppointment.start_time}
                          onChange={(e) => setEditingAppointment({
                            ...editingAppointment,
                            start_time: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={editingAppointment.end_time}
                          onChange={(e) => setEditingAppointment({
                            ...editingAppointment,
                            end_time: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                    onClick={handleEditAppointment}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:mt-0"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingAppointment(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Appointment Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Cancel Appointment
                    </h3>
                    <button
                      onClick={() => {
                        setShowCancelModal(false)
                        setCancelReason('')
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to cancel this appointment?
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="font-medium text-gray-900">{selectedAppointment.customer_name}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.service_type}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedAppointment.appointment_date)} at {selectedAppointment.start_time}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cancellation Reason (Optional)
                      </label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Please provide a reason for cancellation..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCancelAppointment}
                  >
                    Cancel Appointment
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:mt-0"
                    onClick={() => {
                      setShowCancelModal(false)
                      setCancelReason('')
                    }}
                  >
                    Keep Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}