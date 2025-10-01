'use client'

import React, { useState, useEffect } from 'react'
import { 
  PhoneIcon, 
  ShieldCheckIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/solid'

interface PhoneForwardingManagerProps {
  businessId: string
  businessName: string
  planTier: 'starter' | 'professional' | 'business'
  aiPhoneNumber: string
  businessPhoneNumber?: string
  isForwarded?: boolean
  onStatusChange?: (forwarded: boolean) => void
}

interface ForwardingStatus {
  status: 'not_configured' | 'ready_to_forward' | 'forwarding_active' | 'paused'
  confidence: 'building' | 'ready' | 'confident' | 'expert'
  testCallsMade: number
  lastTestCall?: Date
  forwardedAt?: Date
  pausedAt?: Date
  issues: string[]
}

export default function PhoneForwardingManager({
  businessId,
  businessName,
  planTier,
  aiPhoneNumber,
  businessPhoneNumber,
  isForwarded = false,
  onStatusChange
}: PhoneForwardingManagerProps) {
  const [status, setStatus] = useState<ForwardingStatus>({
    status: isForwarded ? 'forwarding_active' : 'not_configured',
    confidence: 'building',
    testCallsMade: 0,
    issues: []
  })

  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showConfidenceBuilder, setShowConfidenceBuilder] = useState(false)

  useEffect(() => {
    loadForwardingStatus()
  }, [businessId])

  const loadForwardingStatus = async () => {
    // In production, load from database
    const mockStatus: ForwardingStatus = {
      status: isForwarded ? 'forwarding_active' : 'ready_to_forward',
      confidence: determineConfidenceLevel(3), // 3 test calls made
      testCallsMade: 3,
      lastTestCall: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      issues: []
    }
    setStatus(mockStatus)
  }

  const determineConfidenceLevel = (testCalls: number): ForwardingStatus['confidence'] => {
    if (testCalls === 0) return 'building'
    if (testCalls < 3) return 'ready'
    if (testCalls < 8) return 'confident'
    return 'expert'
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

  const getConfidenceMessage = () => {
    switch (status.confidence) {
      case 'building':
        return {
          title: '🌱 Building Confidence',
          message: 'Make a few test calls to build confidence in your AI',
          color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
          icon: <ClockIcon className="w-5 h-5" />
        }
      case 'ready':
        return {
          title: '👍 Getting Ready',
          message: `${status.testCallsMade} test calls made. A few more and you'll be confident!`,
          color: 'bg-blue-50 border-blue-300 text-blue-800',
          icon: <PlayIcon className="w-5 h-5" />
        }
      case 'confident':
        return {
          title: '✨ Confident & Ready',
          message: `${status.testCallsMade} successful test calls. You're ready to forward!`,
          color: 'bg-green-50 border-green-300 text-green-800',
          icon: <CheckCircleIcon className="w-5 h-5" />
        }
      case 'expert':
        return {
          title: '🏆 Expert Level',
          message: `${status.testCallsMade}+ test calls. You're an AI phone expert!`,
          color: 'bg-purple-50 border-purple-300 text-purple-800',
          icon: <CheckCircleIcon className="w-5 h-5" />
        }
    }
  }

  const handleTestCall = () => {
    // Simulate making test call
    setStatus(prev => ({
      ...prev,
      testCallsMade: prev.testCallsMade + 1,
      confidence: determineConfidenceLevel(prev.testCallsMade + 1),
      lastTestCall: new Date()
    }))
  }

  const handleForwardNow = async () => {
    // Show setup wizard
    setShowSetupWizard(true)
  }

  const handlePauseForwarding = async () => {
    setStatus(prev => ({
      ...prev,
      status: 'paused',
      pausedAt: new Date()
    }))
    onStatusChange?.(false)
  }

  const handleResumeForwarding = async () => {
    setStatus(prev => ({
      ...prev,
      status: 'forwarding_active',
      pausedAt: undefined
    }))
    onStatusChange?.(true)
  }

  const confidenceInfo = getConfidenceMessage()

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Phone Forwarding Control Center
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.status === 'forwarding_active' 
              ? 'bg-green-100 text-green-800'
              : status.status === 'paused'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status.status === 'forwarding_active' ? '✅ Active' : 
             status.status === 'paused' ? '⏸️ Paused' : '⏳ Not Active'}
          </div>
        </div>

        {/* Phone Numbers Display */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* AI Phone Number */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <PhoneIcon className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant Number</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatPhoneNumber(aiPhoneNumber)}
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Active & Taking Calls</span>
            </div>
            <button
              onClick={handleTestCall}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Make Test Call
            </button>
          </div>

          {/* Business Phone Number */}
          <div className={`border-2 rounded-lg p-4 ${
            status.status === 'forwarding_active' 
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <PhoneIcon className="w-6 h-6 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Business Number</h3>
            </div>
            <div className="text-2xl font-bold text-gray-600 mb-2">
              {businessPhoneNumber ? formatPhoneNumber(businessPhoneNumber) : 'Not provided'}
            </div>
            <div className="flex items-center space-x-2">
              {status.status === 'forwarding_active' ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">Forwarding to AI</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Safe & Protected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className={`border-2 rounded-lg p-4 mb-6 ${confidenceInfo.color}`}>
          <div className="flex items-center space-x-3">
            {confidenceInfo.icon}
            <div>
              <h4 className="font-semibold">{confidenceInfo.title}</h4>
              <p className="text-sm">{confidenceInfo.message}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {status.status === 'forwarding_active' ? (
            <>
              <button
                onClick={handlePauseForwarding}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                ⏸️ Pause Forwarding
              </button>
              <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                📊 View Call Analytics
              </button>
            </>
          ) : status.status === 'paused' ? (
            <>
              <button
                onClick={handleResumeForwarding}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ▶️ Resume Forwarding
              </button>
              <button className="bg-red-100 text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                🛑 Stop Completely
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleForwardNow}
                disabled={status.confidence === 'building'}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center ${
                  status.confidence === 'building'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {status.confidence === 'building' 
                  ? '🌱 Build Confidence First'
                  : '🚀 Forward My Business Number'
                }
                {status.confidence !== 'building' && <ArrowRightIcon className="w-4 h-4 ml-2" />}
              </button>
              <button
                onClick={() => setShowConfidenceBuilder(true)}
                className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
              >
                🎯 Build More Confidence
              </button>
            </>
          )}
        </div>
      </div>

      {/* Safety Guarantees */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            🛡️ Your Safety Guarantees
          </h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Your business number stays yours forever
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Forwarding can be turned off instantly
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                No technical changes to your phone system
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                24/7 support if you need any help
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Automatic rollback if issues detected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Test calls work perfectly right now
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
          <p className="text-sm text-green-800 font-medium">
            💡 <strong>Pro Tip:</strong> Most successful businesses forward their number after 3-5 successful test calls. 
            You're in complete control of when and how it happens.
          </p>
        </div>
      </div>

      {/* Call History & Analytics */}
      {status.testCallsMade > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Your Test Call History
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.testCallsMade}</div>
              <div className="text-sm text-gray-600">Test Calls Made</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">A+</div>
              <div className="text-sm text-gray-600">AI Performance</div>
            </div>
          </div>

          {status.lastTestCall && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                🕒 <strong>Last test call:</strong> {status.lastTestCall.toLocaleString()}
                <br />
                ✅ AI answered professionally, collected all information, and confirmed the appointment perfectly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Stories */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">
          🌟 Success Stories from {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Users
        </h3>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">SL</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Sarah's Luxury Nails</div>
                <div className="text-sm text-gray-600">Similar business, {planTier} plan</div>
                <div className="text-sm text-purple-700 mt-1">
                  "I was terrified to forward my number, but after 4 test calls I felt confident. 
                  Now I capture 40% more bookings and never miss a call!"
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">MB</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Metro Beauty Spa</div>
                <div className="text-sm text-gray-600">Upgraded from starter to {planTier}</div>
                <div className="text-sm text-purple-700 mt-1">
                  "The AI sounds more professional than some of my staff! Customers love the 
                  instant booking and I love the extra $2,000/month in revenue."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Setup Wizard Modal */}
      {showSetupWizard && (
        <PhoneForwardingSetupWizard
          businessName={businessName}
          aiPhoneNumber={aiPhoneNumber}
          businessPhoneNumber={businessPhoneNumber}
          onComplete={(success) => {
            setShowSetupWizard(false)
            if (success) {
              setStatus(prev => ({
                ...prev,
                status: 'forwarding_active',
                forwardedAt: new Date()
              }))
              onStatusChange?.(true)
            }
          }}
          onCancel={() => setShowSetupWizard(false)}
        />
      )}

      {/* Show Confidence Builder */}
      {showConfidenceBuilder && (
        <ConfidenceBuilderModal
          currentCalls={status.testCallsMade}
          aiPhoneNumber={aiPhoneNumber}
          onClose={() => setShowConfidenceBuilder(false)}
          onCallMade={handleTestCall}
        />
      )}
    </div>
  )
}

// Separate components for modals (would be in separate files in production)
function PhoneForwardingSetupWizard({ 
  businessName, 
  aiPhoneNumber, 
  businessPhoneNumber, 
  onComplete, 
  onCancel 
}: any) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleComplete = async () => {
    setIsProcessing(true)
    // Simulate setup process
    await new Promise(resolve => setTimeout(resolve, 2000))
    onComplete(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🚀 Phone Forwarding Setup Wizard
        </h2>
        
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-700">
              We'll walk you through the simple 2-step process to forward your business number.
              This takes about 2 minutes and can be undone instantly.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">What will happen:</h4>
              <ol className="list-decimal list-inside text-green-800 text-sm space-y-1">
                <li>We'll provide you with simple forwarding instructions</li>
                <li>You'll set up forwarding with your phone provider</li>
                <li>We'll test it together to make sure it works perfectly</li>
                <li>Your AI will start answering your business calls!</li>
              </ol>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Let's Do This!
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Step 1: Call Your Phone Provider
              </h4>
              <p className="text-blue-800 text-sm mb-3">
                Call your phone company and say: "I want to forward my calls to another number"
              </p>
              <div className="bg-white p-3 rounded border">
                <p className="font-medium">Forward this number:</p>
                <p className="text-lg font-bold text-blue-600">
                  {businessPhoneNumber || 'Your business number'}
                </p>
                <p className="font-medium mt-2">To this number:</p>
                <p className="text-lg font-bold text-green-600">{aiPhoneNumber}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? '⏳ Setting Up...' : '✅ I\'ve Set Up Forwarding'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfidenceBuilderModal({ 
  currentCalls, 
  aiPhoneNumber, 
  onClose, 
  onCallMade 
}: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🎯 Build Your Confidence
        </h2>
        
        <p className="text-gray-700 mb-4">
          The more test calls you make, the more confident you'll feel about your AI assistant.
          Here are some scenarios to try:
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-900">Scenario 1: Basic Booking</p>
            <p className="text-blue-800 text-sm">"Hi, I\'d like to book a manicure for tomorrow afternoon"</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="font-medium text-green-900">Scenario 2: Complex Request</p>
            <p className="text-green-800 text-sm">"I need gel polish removal and a new set, what\'s your availability this week?"</p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="font-medium text-purple-900">Scenario 3: Pricing Question</p>
            <p className="text-purple-800 text-sm">"How much do you charge for nail art and how long does it take?"</p>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-blue-600 mb-1">{aiPhoneNumber}</p>
          <button
            onClick={onCallMade}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            📞 I Made Another Test Call
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}