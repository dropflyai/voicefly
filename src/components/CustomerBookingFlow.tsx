'use client'

import { useState, useEffect } from 'react'
import { 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price_cents: number
  category: string
}

interface BookingData {
  service?: Service
  date?: string
  time?: string
  customerInfo?: {
    name: string
    phone: string
    email: string
  }
}

interface CustomerBookingFlowProps {
  businessId: string
  customerPhone?: string
  customerName?: string
  customerEmail?: string
  onBookingComplete?: (appointmentId: string) => void
  onClose?: () => void
}

export default function CustomerBookingFlow({ 
  businessId, 
  customerPhone,
  customerName,
  customerEmail,
  onBookingComplete, 
  onClose 
}: CustomerBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<'service' | 'datetime' | 'info' | 'confirmation'>('service')
  const [bookingData, setBookingData] = useState<BookingData>({})
  const [services, setServices] = useState<Service[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  // Load services on component mount
  useEffect(() => {
    loadServices()
  }, [businessId])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      // Mock services data - in production this would fetch from API
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Basic Manicure',
          description: 'Classic nail care and polish',
          duration_minutes: 30,
          price_cents: 2500,
          category: 'manicure'
        },
        {
          id: '2',
          name: 'Gel Manicure',
          description: 'Long-lasting gel polish manicure',
          duration_minutes: 45,
          price_cents: 3500,
          category: 'manicure'
        },
        {
          id: '3',
          name: 'Basic Pedicure',
          description: 'Relaxing foot care and polish',
          duration_minutes: 45,
          price_cents: 3000,
          category: 'pedicure'
        },
        {
          id: '4',
          name: 'Gel Pedicure',
          description: 'Long-lasting gel polish pedicure',
          duration_minutes: 60,
          price_cents: 4000,
          category: 'pedicure'
        },
        {
          id: '5',
          name: 'Nail Art',
          description: 'Custom nail designs',
          duration_minutes: 60,
          price_cents: 5000,
          category: 'nail_art'
        }
      ]
      setServices(mockServices)
    } catch (error) {
      console.error('Failed to load services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableSlots = async (date: string, duration: number) => {
    try {
      setIsLoading(true)
      // Mock availability - in production this would check real availability
      const mockSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
      ]
      setAvailableSlots(mockSlots)
    } catch (error) {
      console.error('Failed to load availability:', error)
      setAvailableSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setBookingData({ ...bookingData, service })
    setCurrentStep('datetime')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setBookingData({ ...bookingData, date })
    if (bookingData.service) {
      loadAvailableSlots(date, bookingData.service.duration_minutes)
    }
  }

  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, time })
  }

  const handleCustomerInfo = (info: { name: string; phone: string; email: string }) => {
    setBookingData({ ...bookingData, customerInfo: info })
    setCurrentStep('confirmation')
  }

  const handleBookingSubmit = async () => {
    try {
      setIsLoading(true)
      
      console.log('Starting booking process...', {
        businessId,
        customerInfo: bookingData.customerInfo,
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time
      })
      
      // Prepare booking data for API
      const bookingPayload = {
        business_id: businessId,
        customer_name: bookingData.customerInfo!.name,
        customer_phone: bookingData.customerInfo!.phone,
        customer_email: bookingData.customerInfo!.email,
        appointment_date: bookingData.date!,
        start_time: `${bookingData.time!}:00`,
        service_duration: bookingData.service!.duration_minutes,
        service_type: bookingData.service!.name,
        booking_source: 'customer_portal'
      }

      console.log('Calling local API with:', bookingPayload)

      // Use our local API with aligned business ID
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      })

      const result = await response.json()
      console.log('Local API response:', result)
      
      if (result.success) {
        onBookingComplete?.(result.booking_id)
      } else {
        throw new Error(result.error || 'Booking failed')
      }
    } catch (error) {
      console.error('Booking failed with detailed error:', error)
      alert(`Failed to book appointment: ${error.message}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getNextFiveDays = () => {
    const days = []
    const today = new Date()
    
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      })
    }
    return days
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {currentStep !== 'service' && (
              <button
                onClick={() => {
                  if (currentStep === 'datetime') setCurrentStep('service')
                  if (currentStep === 'info') setCurrentStep('datetime')
                  if (currentStep === 'confirmation') setCurrentStep('info')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className={currentStep === 'service' ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Service
            </span>
            <span className={currentStep === 'datetime' ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Date & Time
            </span>
            <span className={currentStep === 'info' ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Your Info
            </span>
            <span className={currentStep === 'confirmation' ? 'text-purple-600 font-medium' : 'text-gray-500'}>
              Confirm
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Service Selection */}
          {currentStep === 'service' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Service</h3>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 text-left transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        <p className="text-sm text-gray-500 mt-1">{service.duration_minutes} minutes</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-purple-600">
                          {formatPrice(service.price_cents)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {currentStep === 'datetime' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
              
              {/* Selected Service Summary */}
              {bookingData.service && (
                <div className="bg-purple-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">{bookingData.service.name}</span>
                    <span className="text-sm text-gray-600">
                      ({bookingData.service.duration_minutes} min · {formatPrice(bookingData.service.price_cents)})
                    </span>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Available Dates</h4>
                <div className="grid grid-cols-5 gap-2">
                  {getNextFiveDays().map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleDateSelect(day.value)}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        selectedDate === day.value
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{day.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-3">Available Times</h4>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading available times...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`p-2 text-center border rounded-lg transition-colors ${
                            bookingData.time === time
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {bookingData.time && (
                    <button
                      onClick={() => setCurrentStep('info')}
                      className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Information */}
          {currentStep === 'info' && (
            <CustomerInfoForm
              onSubmit={handleCustomerInfo}
              initialData={bookingData.customerInfo || {
                name: customerName || '',
                phone: customerPhone || '',
                email: customerEmail || ''
              }}
            />
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 'confirmation' && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Confirm Your Appointment</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="w-6 h-6 text-purple-600" />
                  <div>
                    <div className="font-medium">{bookingData.service?.name}</div>
                    <div className="text-sm text-gray-600">
                      {bookingData.service?.duration_minutes} minutes · {formatPrice(bookingData.service?.price_cents || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <div className="font-medium">
                      {new Date(bookingData.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">{bookingData.time}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                  <div>
                    <div className="font-medium">{bookingData.customerInfo?.name}</div>
                    <div className="text-sm text-gray-600">
                      {bookingData.customerInfo?.phone} · {bookingData.customerInfo?.email}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookingSubmit}
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Booking...</span>
                  </div>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Customer Info Form Component
interface CustomerInfoFormProps {
  onSubmit: (info: { name: string; phone: string; email: string }) => void
  initialData?: { name: string; phone: string; email: string }
}

function CustomerInfoForm({ onSubmit, initialData }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.phone) {
      onSubmit(formData)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Your Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Continue to Confirmation
        </button>
      </form>
    </div>
  )
}