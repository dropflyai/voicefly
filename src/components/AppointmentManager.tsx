'use client'

import { useState } from 'react'
import { 
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  service?: { name: string; duration_minutes: number }
  staff?: { first_name: string; last_name: string }
  total_amount?: number
}

interface AppointmentManagerProps {
  appointment: Appointment
  onClose: () => void
  onRescheduleComplete: () => void
  onCancelComplete: () => void
  initialMode?: 'reschedule' | 'cancel'
}

export default function AppointmentManager({ 
  appointment, 
  onClose, 
  onRescheduleComplete,
  onCancelComplete,
  initialMode = 'reschedule'
}: AppointmentManagerProps) {
  const [mode, setMode] = useState<'reschedule' | 'cancel'>(initialMode)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [availableSlots] = useState<string[]>([
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ])

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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return

    setIsLoading(true)
    try {
      // Mock API call - in production this would update the appointment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onRescheduleComplete()
    } catch (error) {
      console.error('Reschedule failed:', error)
      alert('Failed to reschedule appointment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      // Mock API call - in production this would cancel the appointment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onCancelComplete()
    } catch (error) {
      console.error('Cancellation failed:', error)
      alert('Failed to cancel appointment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'reschedule' ? 'Reschedule' : 'Cancel'} Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Appointment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Current Appointment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{appointment.start_time} - {appointment.end_time}</span>
              </div>
              {appointment.service && (
                <div className="text-gray-600">
                  Service: {appointment.service.name}
                </div>
              )}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setMode('reschedule')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'reschedule'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reschedule
            </button>
            <button
              onClick={() => setMode('cancel')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'cancel'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Reschedule Interface */}
          {mode === 'reschedule' && (
            <div>
              <h4 className="font-medium mb-3">Select New Date</h4>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {getNextFiveDays().map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDate(day.value)}
                    className={`p-2 text-center border rounded-lg transition-colors text-sm ${
                      selectedDate === day.value
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Select New Time</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-center border rounded-lg transition-colors text-sm ${
                          selectedTime === time
                            ? 'border-purple-600 bg-purple-600 text-white'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || isLoading}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rescheduling...</span>
                  </div>
                ) : (
                  'Confirm Reschedule'
                )}
              </button>
            </div>
          )}

          {/* Cancel Interface */}
          {mode === 'cancel' && (
            <div>
              <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg mb-6">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Cancel Appointment</h4>
                  <p className="text-sm text-red-700">
                    This action cannot be undone. You will need to book a new appointment if you change your mind.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </div>
                  ) : (
                    'Yes, Cancel Appointment'
                  )}
                </button>
                
                <button
                  onClick={() => setMode('reschedule')}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reschedule Instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}