'use client'

import React, { useState, useEffect } from 'react'
import { PhoneIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid'

interface TestAppointmentViewProps {
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  phoneNumber: string
  showTestCall?: boolean
  customMessage?: string
  onStepComplete: () => void
}

export default function TestAppointmentView({
  planTier,
  businessName,
  phoneNumber,
  showTestCall = true,
  customMessage,
  onStepComplete
}: TestAppointmentViewProps) {
  const [hasSeenAppointment, setHasSeenAppointment] = useState(false)
  const [showCallButton, setShowCallButton] = useState(showTestCall)
  
  // Sample appointment data (would come from API in real implementation)
  const sampleAppointment = {
    id: '1',
    customer: {
      name: 'Sarah Johnson',
      phone: '(555) 123-4567',
      email: 'sarah@example.com'
    },
    service: 'Gel Manicure',
    date: new Date().toLocaleDateString(),
    time: '2:00 PM',
    duration: 45,
    status: 'confirmed',
    notes: 'First-time customer, requested nail art',
    createdAt: 'Just now',
    source: 'AI Voice Assistant'
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.substring(1)
      return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`
    }
    return phone
  }

  const handleTestCall = () => {
    setShowCallButton(false)
    setHasSeenAppointment(true)
    
    // Simulate appointment appearing after a call
    setTimeout(() => {
      setHasSeenAppointment(true)
    }, 1000)
  }

  const handleContinue = () => {
    onStepComplete()
  }

  const tierMessages = {
    starter: 'This is how appointments appear when customers call your AI assistant!',
    professional: 'Your AI assistant captured all the details and the appointment is ready for confirmation.',
    business: customMessage || 'Your custom AI assistant is specifically trained for your business and captures detailed customer information.'
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          🎯 See Your AI Assistant in Action
        </h4>
        <p className="text-blue-800 text-sm">
          {tierMessages[planTier]}
        </p>
      </div>

      {/* Test Call Section */}
      {showCallButton && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <PhoneIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Try It Right Now!
          </h3>
          <p className="text-gray-600 mb-4">
            Call your AI assistant and book a test appointment to see how it appears in your dashboard.
          </p>
          <div className="text-2xl font-bold text-green-600 mb-4">
            {formatPhoneNumber(phoneNumber)}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Say: "I'd like to book a manicure for today at 2 PM"
          </p>
          <button
            onClick={handleTestCall}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            I Made the Test Call
          </button>
        </div>
      )}

      {/* Appointment Display */}
      {(hasSeenAppointment || !showTestCall) && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Appointments
              </h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Live Update
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {sampleAppointment.customer.name}
                  </h4>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {sampleAppointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Service:</span>
                    <div className="font-medium">{sampleAppointment.service}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date & Time:</span>
                    <div className="font-medium">{sampleAppointment.date} at {sampleAppointment.time}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <div className="font-medium">{sampleAppointment.customer.phone}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="font-medium">{sampleAppointment.duration} minutes</div>
                  </div>
                </div>

                {sampleAppointment.notes && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <span className="text-gray-500 text-sm">Notes:</span>
                    <div className="font-medium text-sm">{sampleAppointment.notes}</div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Booked {sampleAppointment.createdAt} via {sampleAppointment.source}
                  </div>
                  {planTier === 'business' && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      Custom AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Points */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-3">
          🎉 What Just Happened?
        </h4>
        <ul className="text-yellow-800 text-sm space-y-2">
          <li>✅ Customer called your AI assistant</li>
          <li>✅ AI collected all necessary booking information</li>
          <li>✅ Appointment appeared instantly in your dashboard</li>
          <li>✅ Customer received SMS confirmation automatically</li>
          {planTier === 'professional' && (
            <>
              <li>✅ Analytics tracking started for business insights</li>
              <li>✅ Customer added to your marketing database</li>
            </>
          )}
          {planTier === 'business' && (
            <>
              <li>✅ Custom AI used your business-specific training</li>
              <li>✅ Advanced reporting data captured</li>
              <li>✅ Multi-location routing ready</li>
            </>
          )}
        </ul>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Great! Show Me More Features
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This is just the beginning - let's explore what else your {planTier} plan can do!
        </p>
      </div>
    </div>
  )
}