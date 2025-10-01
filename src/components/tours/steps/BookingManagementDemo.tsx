'use client'

import React, { useState } from 'react'
import { CalendarIcon, ClockIcon, UserGroupIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface BookingManagementDemoProps {
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

export default function BookingManagementDemo({
  planTier,
  businessName,
  onStepComplete
}: BookingManagementDemoProps) {
  const [selectedFeature, setSelectedFeature] = useState<string>('calendar')
  
  // Sample appointments for demo
  const sampleAppointments = [
    {
      id: '1',
      customer: 'Sarah Johnson',
      service: 'Gel Manicure',
      time: '10:00 AM',
      status: 'confirmed',
      duration: 45,
      notes: 'First-time customer'
    },
    {
      id: '2', 
      customer: 'Mike Chen',
      service: 'Classic Pedicure',
      time: '11:30 AM',
      status: 'pending',
      duration: 60,
      notes: 'Requested male technician'
    },
    {
      id: '3',
      customer: 'Emma Williams',
      service: 'Nail Art Design',
      time: '2:00 PM', 
      status: 'confirmed',
      duration: 90,
      notes: 'Regular customer, floral design'
    }
  ]

  const tierFeatures = {
    starter: [
      'View all appointments in calendar format',
      'Confirm or reschedule bookings easily',
      'Add manual appointments when needed',
      'Basic customer contact information',
      'SMS notifications to customers'
    ],
    professional: [
      'Advanced calendar with staff assignments',
      'Automated reminder sequences',
      'Customer history and preferences',
      'Revenue tracking per appointment',
      'Email marketing integration',
      'Loyalty program point tracking'
    ],
    business: [
      'Multi-location calendar management',
      'Staff scheduling and availability',
      'Advanced reporting and analytics',
      'Customer lifetime value tracking',
      'Automated waitlist management',
      'Enterprise calendar integrations'
    ]
  }

  const handleContinue = () => {
    onStepComplete()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <CalendarIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {planTier === 'business' ? 'Enterprise' : planTier === 'professional' ? 'Advanced' : 'Smart'} Booking Management
        </h3>
        <p className="text-gray-600">
          Your {planTier} plan includes powerful tools to manage appointments effortlessly.
        </p>
      </div>

      {/* Feature Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectedFeature('calendar')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedFeature === 'calendar' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Calendar View
        </button>
        <button
          onClick={() => setSelectedFeature('management')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedFeature === 'management' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ⚡ Quick Actions
        </button>
        <button
          onClick={() => setSelectedFeature('analytics')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedFeature === 'analytics' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Insights
        </button>
      </div>

      {/* Calendar View */}
      {selectedFeature === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Today's Schedule</h4>
              <span className="text-sm text-gray-600">3 appointments</span>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            {sampleAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{apt.customer}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {apt.service} • {apt.time} • {apt.duration} min
                  </div>
                  {apt.notes && (
                    <div className="text-xs text-gray-500 mt-1">📝 {apt.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Management Actions */}
      {selectedFeature === 'management' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <CheckCircleIcon className="w-8 h-8 text-blue-600 mb-2" />
            <h5 className="font-semibold text-gray-900 mb-1">Confirm Booking</h5>
            <p className="text-sm text-gray-600">Instantly confirm pending appointments with one click</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <CalendarIcon className="w-8 h-8 text-green-600 mb-2" />
            <h5 className="font-semibold text-gray-900 mb-1">Reschedule</h5>
            <p className="text-sm text-gray-600">Drag and drop to reschedule appointments easily</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <UserGroupIcon className="w-8 h-8 text-purple-600 mb-2" />
            <h5 className="font-semibold text-gray-900 mb-1">Customer Notes</h5>
            <p className="text-sm text-gray-600">Add preferences and history for personalized service</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ClockIcon className="w-8 h-8 text-yellow-600 mb-2" />
            <h5 className="font-semibold text-gray-900 mb-1">Manual Booking</h5>
            <p className="text-sm text-gray-600">Add walk-ins or phone bookings manually</p>
          </div>
        </div>
      )}

      {/* Analytics */}
      {selectedFeature === 'analytics' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h5 className="font-semibold text-gray-900 mb-4">📈 Today's Performance</h5>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-xs text-gray-600">Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$285</div>
              <div className="text-xs text-gray-600">Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">95m</div>
              <div className="text-xs text-gray-600">Avg Duration</div>
            </div>
          </div>
          
          {planTier !== 'starter' && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                🎯 <strong>Insight:</strong> Your busiest time is 2-4 PM. Consider adding staff during peak hours.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plan Features */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Includes:
        </h4>
        <ul className="text-green-800 text-sm space-y-1">
          {tierFeatures[planTier].map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>

      {/* Pro Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Pro Tip:</h5>
        <p className="text-blue-800 text-sm">
          {planTier === 'starter' 
            ? 'Set up SMS notifications to reduce no-shows and keep customers informed.'
            : planTier === 'professional'
            ? 'Use the customer history feature to remember preferences and provide personalized service.'
            : 'Enable automated waitlist management to maximize bookings during busy periods.'
          }
        </p>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Perfect! Show Me More Features
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          All these features are available in your dashboard right now!
        </p>
      </div>
    </div>
  )
}