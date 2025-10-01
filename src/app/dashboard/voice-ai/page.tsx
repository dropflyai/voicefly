'use client'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import {
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CogIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface CallLog {
  id: string
  timestamp: string
  duration: number
  outcome: 'booking' | 'inquiry' | 'missed' | 'hung_up'
  customerPhone: string
  customerName?: string
  serviceRequested?: string
  appointmentBooked?: boolean
  transcript?: string
}

// Mock call logs for demonstration - in production these would come from Vapi API
const mockCallLogs: CallLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    duration: 240,
    outcome: 'booking',
    customerPhone: '+1-555-123-4567',
    customerName: 'Sarah Johnson',
    serviceRequested: 'Gel Manicure',
    appointmentBooked: true,
    transcript: 'Customer called to book a gel manicure appointment for Friday afternoon. Successfully scheduled for 2:00 PM with Maya.'
  },
  {
    id: '2', 
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    duration: 120,
    outcome: 'inquiry',
    customerPhone: '+1-555-234-5678',
    customerName: 'Maria Rodriguez',
    serviceRequested: 'Pricing information',
    appointmentBooked: false,
    transcript: 'Customer inquired about pricing for pedicure services and asked about availability for next week.'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago  
    duration: 180,
    outcome: 'booking',
    customerPhone: '+1-555-345-6789',
    customerName: 'Jennifer Chen',
    serviceRequested: 'Full Set Acrylics',
    appointmentBooked: true,
    transcript: 'Returning customer booked full set acrylic nails for Saturday morning. Requested nail art add-on.'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), // 3+ hours ago
    duration: 45,
    outcome: 'hung_up',
    customerPhone: '+1-555-456-7890',
    appointmentBooked: false,
    transcript: 'Call disconnected early, customer may have been unsure or had connection issues.'
  }
]

export default function VoiceAIPage() {
  const [isActive, setIsActive] = useState(true)
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [showCallModal, setShowCallModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // For demo, assume professional tier (shared agent) - could be loaded from API in real app
  const [subscriptionTier] = useState<'starter' | 'professional' | 'business'>('professional')

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'booking': return 'bg-green-100 text-green-800'
      case 'inquiry': return 'bg-blue-100 text-blue-800'
      case 'missed': return 'bg-yellow-100 text-yellow-800'
      case 'hung_up': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'booking': return <CheckCircleIcon className="h-4 w-4" />
      case 'inquiry': return <PhoneIcon className="h-4 w-4" />
      case 'missed': return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'hung_up': return <StopIcon className="h-4 w-4" />
      default: return <PhoneIcon className="h-4 w-4" />
    }
  }

  // Calculate stats
  const totalCalls = mockCallLogs.length
  const successfulBookings = mockCallLogs.filter(call => call.appointmentBooked).length
  const conversionRate = totalCalls > 0 ? (successfulBookings / totalCalls * 100).toFixed(1) : '0.0'
  const avgCallDuration = totalCalls > 0 ? Math.round(mockCallLogs.reduce((sum, call) => sum + call.duration, 0) / totalCalls) : 0

  return (
    <Layout business={{ name: 'Bella Nails & Spa', subscription_tier: 'professional' }}>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice AI Assistant</h1>
            <p className="text-gray-600 mt-1">
              Manage your AI receptionist and call analytics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className={clsx(
                'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md',
                isActive 
                  ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                  : 'text-green-700 bg-green-100 hover:bg-green-200'
              )}
            >
              {isActive ? (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause AI
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Activate AI
                </>
              )}
            </button>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="btn-secondary"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={clsx(
          'rounded-lg p-4 mb-8',
          isActive 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        )}>
          <div className="flex items-center">
            <div className={clsx(
              'flex-shrink-0',
              isActive ? 'text-green-400' : 'text-red-400'
            )}>
              <SignalIcon className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className={clsx(
                'text-sm font-medium',
                isActive ? 'text-green-800' : 'text-red-800'
              )}>
                Voice AI Status: {isActive ? 'Active' : 'Inactive'}
              </h3>
              <p className={clsx(
                'text-sm mt-1',
                isActive ? 'text-green-700' : 'text-red-700'
              )}>
                {isActive 
                  ? 'Your AI receptionist is answering calls and booking appointments.' 
                  : 'Your AI receptionist is currently paused. Calls will go to voicemail.'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-8 w-8 text-brand-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Calls Today
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">{totalCalls}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bookings Made
                    </dt>
                    <dd className="text-2xl font-bold text-green-600">{successfulBookings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-beauty-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversion Rate
                    </dt>
                    <dd className="text-2xl font-bold text-beauty-600">{conversionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Call Duration
                    </dt>
                    <dd className="text-2xl font-bold text-purple-600">{formatDuration(avgCallDuration)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card relative">
            {subscriptionTier !== 'business' && (
              <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                    <CogIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Custom AI Configuration</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    You're currently using our shared AI assistant. Upgrade to Business tier to customize voice, personality, and greeting.
                  </p>
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                  >
                    Upgrade to Business ($297/mo)
                  </button>
                </div>
              </div>
            )}
            <div className="p-6 opacity-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Voice Style</label>
                  <select className="input-field">
                    <option>Professional Female (Sarah)</option>
                    <option>Warm Female (Maya)</option>
                    <option>Professional Male (David)</option>
                    <option>Friendly Female (Emma)</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Response Speed</label>
                  <select className="input-field">
                    <option>Fast (0.5s delay)</option>
                    <option>Natural (1.0s delay)</option>
                    <option>Thoughtful (1.5s delay)</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Greeting Message</label>
                  <textarea 
                    className="input-field" 
                    rows={3}
                    defaultValue="Hi! Welcome to Bella Nails & Spa! I'm Maya, your virtual receptionist. I'm here to help you book appointments, check availability, or answer any questions. How can I assist you today?"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card relative">
            {subscriptionTier !== 'business' && (
              <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                    <SpeakerWaveIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Custom Call Rules</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure auto-booking, call duration, and custom workflows with Business tier.
                  </p>
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                  >
                    Upgrade to Business ($297/mo)
                  </button>
                </div>
              </div>
            )}
            <div className="p-6 opacity-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Call Handling Rules</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Auto-booking</div>
                    <div className="text-sm text-gray-500">Allow AI to book appointments automatically</div>
                  </div>
                  <button className="bg-green-500 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                    <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Collect customer info</div>
                    <div className="text-sm text-gray-500">Ask for name, phone, and email</div>
                  </div>
                  <button className="bg-green-500 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                    <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Reschedule capability</div>
                    <div className="text-sm text-gray-500">Allow customers to reschedule existing appointments</div>
                  </div>
                  <button className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                    <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
                
                <div>
                  <label className="label">Maximum call duration</label>
                  <select className="input-field">
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                    <option>No limit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Calls</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {mockCallLogs.map((call) => (
              <div 
                key={call.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedCall(call)
                  setShowCallModal(true)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <PhoneIcon className="h-5 w-5 text-brand-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900">
                          {call.customerName || call.customerPhone}
                        </p>
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getOutcomeColor(call.outcome)
                        )}>
                          {getOutcomeIcon(call.outcome)}
                          <span className="ml-1 capitalize">{call.outcome.replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                        <span>{call.customerPhone}</span>
                        {call.serviceRequested && (
                          <>
                            <span>•</span>
                            <span>{call.serviceRequested}</span>
                          </>
                        )}
                        <span>•</span>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDuration(call.duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(call.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {call.appointmentBooked && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUpgradeModal(false)} />
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                      <PhoneIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Upgrade to Business Tier
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Get your own custom AI assistant with full control and personalization
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-purple-900 mb-4">🎯 What You Get with Business Tier:</h4>
                    <ul className="space-y-3 text-left">
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Custom AI Assistant</span>
                          <p className="text-sm text-gray-600">Your own dedicated AI with custom personality and branding</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Voice Customization</span>
                          <p className="text-sm text-gray-600">Choose voice style, speed, language, and accent</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Custom Greeting & Scripts</span>
                          <p className="text-sm text-gray-600">Personalized greeting messages and conversation flows</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Advanced Call Rules</span>
                          <p className="text-sm text-gray-600">Configure auto-booking, call routing, and escalation</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">Multi-Location Support</span>
                          <p className="text-sm text-gray-600">Manage up to 3 locations with location-aware routing</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-900">White Label Options</span>
                          <p className="text-sm text-gray-600">Remove all third-party branding</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Current Plan</span>
                      <span className="font-medium">Professional - $147/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Business Plan</span>
                      <span className="text-2xl font-bold text-purple-600">$297/month</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      That's only $150 more for complete AI customization
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        alert('Upgrade feature coming soon! Contact support to upgrade your plan.')
                        setShowUpgradeModal(false)
                      }}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                    >
                      Upgrade Now
                    </button>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call Detail Modal */}
        {showCallModal && selectedCall && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Call Details</h3>
                    <button
                      onClick={() => setShowCallModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <p className="font-medium">{selectedCall.customerName || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">{selectedCall.customerPhone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="font-medium">{formatDuration(selectedCall.duration)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Outcome:</span>
                        <span className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getOutcomeColor(selectedCall.outcome)
                        )}>
                          {selectedCall.outcome.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Service:</span>
                        <p className="font-medium">{selectedCall.serviceRequested || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Booked:</span>
                        <p className="font-medium">{selectedCall.appointmentBooked ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    {selectedCall.transcript && (
                      <div className="border-t pt-4">
                        <span className="text-gray-500 text-sm">Call Summary:</span>
                        <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                          {selectedCall.transcript}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                    onClick={() => setShowCallModal(false)}
                  >
                    Close
                  </button>
                  {selectedCall.appointmentBooked && (
                    <button
                      type="button"
                      className="btn-secondary mt-3 sm:mt-0"
                    >
                      View Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}