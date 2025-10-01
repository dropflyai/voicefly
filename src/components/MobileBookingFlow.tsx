'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CreditCardIcon,
  CheckCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

interface Service {
  id: string
  name: string
  duration: number
  price: number
  description: string
}

interface TimeSlot {
  time: string
  available: boolean
  staff_member?: string
}

interface BookingData {
  service_id?: string
  date?: string
  time?: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  notes?: string
}

interface MobileBookingFlowProps {
  businessId: string
  services: Service[]
  onComplete: (booking: BookingData) => Promise<void>
  onCancel: () => void
}

export default function MobileBookingFlow({ 
  businessId, 
  services, 
  onComplete, 
  onCancel 
}: MobileBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [booking, setBooking] = useState<BookingData>({})
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [
    { number: 1, name: 'Service', icon: UserIcon },
    { number: 2, name: 'Date & Time', icon: CalendarIcon },
    { number: 3, name: 'Details', icon: PhoneIcon },
    { number: 4, name: 'Confirm', icon: CheckCircleIcon }
  ]

  const selectedService = services.find(s => s.id === booking.service_id)

  useEffect(() => {
    if (currentStep === 2 && booking.service_id && booking.date) {
      loadAvailableSlots()
    }
  }, [currentStep, booking.service_id, booking.date])

  const loadAvailableSlots = async () => {
    if (!booking.service_id || !booking.date) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/check-availability?businessId=${businessId}&date=${booking.date}&serviceId=${booking.service_id}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableSlots(data.slots || [])
      } else {
        setError('Failed to load available times')
        // Mock data for development
        setAvailableSlots([
          { time: '09:00', available: true, staff_member: 'Sarah' },
          { time: '10:30', available: true, staff_member: 'Maria' },
          { time: '12:00', available: false },
          { time: '13:30', available: true, staff_member: 'Jennifer' },
          { time: '15:00', available: true, staff_member: 'Sarah' },
          { time: '16:30', available: false },
        ])
      }
    } catch (error) {
      setError('Failed to load available times')
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!booking.service_id
      case 2:
        return !!booking.date && !!booking.time
      case 3:
        return !!booking.customer_name && !!booking.customer_phone
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (!canProceed()) return
    
    setLoading(true)
    try {
      await onComplete(booking)
    } catch (error) {
      console.error('Booking error:', error)
      setError('Failed to complete booking')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Choose a Service</h2>
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setBooking(prev => ({ ...prev, service_id: service.id }))}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                  booking.service_id === service.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {service.duration} minutes
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${service.price}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pick Date & Time</h2>
              
              {/* Selected Service Summary */}
              {selectedService && (
                <div className="bg-purple-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-purple-900">{selectedService.name}</h3>
                      <p className="text-sm text-purple-700">{selectedService.duration} minutes</p>
                    </div>
                    <div className="text-lg font-bold text-purple-900">
                      ${selectedService.price}
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={booking.date || ''}
                  onChange={(e) => setBooking(prev => ({ ...prev, date: e.target.value, time: undefined }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                />
              </div>

              {/* Time Selection */}
              {booking.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Times
                  </label>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading times...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setBooking(prev => ({ ...prev, time: slot.time }))}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg text-center transition-all ${
                            !slot.available
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : booking.time === slot.time
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <div className="font-medium">{slot.time}</div>
                          {slot.available && slot.staff_member && (
                            <div className="text-xs mt-1 opacity-75">
                              with {slot.staff_member}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={booking.customer_name || ''}
                onChange={(e) => setBooking(prev => ({ ...prev, customer_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={booking.customer_phone || ''}
                onChange={(e) => setBooking(prev => ({ ...prev, customer_phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={booking.customer_email || ''}
                onChange={(e) => setBooking(prev => ({ ...prev, customer_email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={booking.notes || ''}
                onChange={(e) => setBooking(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Booking</h2>
              <p className="text-gray-600">Please review your appointment details</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{selectedService?.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {booking.date ? new Date(booking.date).toLocaleDateString() : ''}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">{booking.time}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{selectedService?.duration} minutes</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{booking.customer_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium text-gray-900">{booking.customer_phone}</span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${selectedService?.price}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                📱 You'll receive SMS and email confirmations once your booking is confirmed.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={currentStep === 1 ? onCancel : prevStep}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Book Appointment</h1>
            <p className="text-sm text-gray-500">Step {currentStep} of 4</p>
          </div>
          
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 font-medium text-sm"
          >
            Cancel
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step.number <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {renderStepContent()}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          
          <button
            onClick={currentStep === 4 ? handleComplete : nextStep}
            disabled={!canProceed() || loading}
            className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {currentStep === 4 ? 'Confirm Booking' : 'Continue'}
                {currentStep < 4 && <ArrowRightIcon className="w-5 h-5 ml-2" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}