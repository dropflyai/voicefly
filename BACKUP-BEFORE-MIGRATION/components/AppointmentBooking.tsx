"use client"

import { useState, useEffect } from 'react'
import { Calendar, Clock, Phone, User, DollarSign, CheckCircle } from 'lucide-react'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price_cents: number
  category: string
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  specialties: string[]
}

interface AppointmentBookingProps {
  organizationId: string
  onBookingComplete?: (appointment: any) => void
  voiceCallId?: string
  campaignId?: string
  leadData?: {
    phone: string
    first_name?: string
    last_name?: string
    email?: string
  }
}

export default function AppointmentBooking({
  organizationId,
  onBookingComplete,
  voiceCallId,
  campaignId,
  leadData
}: AppointmentBookingProps) {
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    customer_first_name: leadData?.first_name || '',
    customer_last_name: leadData?.last_name || '',
    customer_phone: leadData?.phone || '',
    customer_email: leadData?.email || '',
    service_id: '',
    staff_id: '',
    appointment_date: '',
    start_time: '',
    notes: '',
    special_requests: ''
  })

  useEffect(() => {
    fetchServices()
    fetchStaff()
  }, [organizationId])

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?organization_id=${organizationId}`)
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff?organization_id=${organizationId}`)
      const data = await response.json()
      setStaff(data.staff || [])
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          ...formData,
          voice_call_id: voiceCallId,
          campaign_id: campaignId,
          booking_source: voiceCallId ? 'voice_call' : 'web_form'
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        onBookingComplete?.(data.appointment)
      } else {
        alert('Failed to book appointment: ' + data.error)
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.service_id)

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Appointment Booked! 🎉</h2>
        <p className="text-green-700 mb-4">
          Your appointment has been successfully scheduled for{' '}
          <strong>{formData.appointment_date}</strong> at{' '}
          <strong>{formData.start_time}</strong>
        </p>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">
            We'll send you a reminder 24 hours before your appointment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h2>
        <p className="text-gray-600">Schedule your service with our AI-powered booking system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.customer_first_name}
              onChange={(e) => setFormData({...formData, customer_first_name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.customer_last_name}
              onChange={(e) => setFormData({...formData, customer_last_name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service *
          </label>
          <select
            required
            value={formData.service_id}
            onChange={(e) => setFormData({...formData, service_id: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a service...</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - ${(service.price_cents / 100).toFixed(2)} ({service.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>

        {/* Staff Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider (Optional)
          </label>
          <select
            value={formData.staff_id}
            onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any available provider</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
                {member.specialties.length > 0 && ` (${member.specialties.join(', ')})`}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.appointment_date}
              onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Time *
            </label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests or Notes
          </label>
          <textarea
            value={formData.special_requests}
            onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requests or additional information..."
          />
        </div>

        {/* Price Summary */}
        {selectedService && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{selectedService.name}</h3>
                <p className="text-sm text-blue-700">Duration: {selectedService.duration_minutes} minutes</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  <DollarSign className="h-6 w-6 inline" />
                  {(selectedService.price_cents / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Booking Appointment...' : 'Book Appointment'}
        </button>
      </form>

      {voiceCallId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm text-green-700">
            🤖 This appointment was initiated by your AI voice agent!
          </p>
        </div>
      )}
    </div>
  )
}