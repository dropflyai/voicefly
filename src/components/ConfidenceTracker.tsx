'use client'

import React, { useState, useEffect } from 'react'
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  TrophyIcon,
  StarIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/solid'

interface ConfidenceTrackerProps {
  businessId: string
  businessName: string
  aiPhoneNumber: string
  onConfidenceReached?: (level: 'ready' | 'confident' | 'expert') => void
}

interface TestCall {
  id: string
  timestamp: Date
  scenario: string
  rating: number
  feedback: string
  duration: number
}

interface ConfidenceLevel {
  level: 'building' | 'ready' | 'confident' | 'expert'
  title: string
  description: string
  callsNeeded: number
  color: string
  icon: React.ReactNode
  benefits: string[]
}

export default function ConfidenceTracker({
  businessId,
  businessName,
  aiPhoneNumber,
  onConfidenceReached
}: ConfidenceTrackerProps) {
  const [testCalls, setTestCalls] = useState<TestCall[]>([])
  const [currentLevel, setCurrentLevel] = useState<ConfidenceLevel['level']>('building')
  const [showCallLogger, setShowCallLogger] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)

  const confidenceLevels: Record<ConfidenceLevel['level'], ConfidenceLevel> = {
    building: {
      level: 'building',
      title: '🌱 Building Confidence',
      description: 'Start with a few test calls to see how your AI performs',
      callsNeeded: 1,
      color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      icon: <SparklesIcon className="w-6 h-6" />,
      benefits: [
        'Hear your AI in action',
        'Test basic booking scenarios',
        'Get familiar with the flow'
      ]
    },
    ready: {
      level: 'ready',
      title: '👍 Getting Ready',
      description: 'You\'ve seen it work - make a few more calls to feel secure',
      callsNeeded: 3,
      color: 'bg-blue-50 border-blue-300 text-blue-800',
      icon: <PlayCircleIcon className="w-6 h-6" />,
      benefits: [
        'Test different scenarios',
        'Build trust in the system',
        'Fine-tune any details'
      ]
    },
    confident: {
      level: 'confident',
      title: '✨ Confident & Ready',
      description: 'Multiple successful calls - you\'re ready to forward!',
      callsNeeded: 5,
      color: 'bg-green-50 border-green-300 text-green-800',
      icon: <CheckCircleIcon className="w-6 h-6" />,
      benefits: [
        'Proven AI performance',
        'Ready for real customers',
        'Forwarding recommended'
      ]
    },
    expert: {
      level: 'expert',
      title: '🏆 Expert Level',
      description: 'You\'re an AI booking expert - help others learn!',
      callsNeeded: 8,
      color: 'bg-purple-50 border-purple-300 text-purple-800',
      icon: <TrophyIcon className="w-6 h-6" />,
      benefits: [
        'Master-level confidence',
        'Help onboard other businesses',
        'Beta test new features'
      ]
    }
  }

  const testScenarios = [
    {
      id: 'basic-booking',
      title: 'Basic Appointment Booking',
      script: '"Hi, I\'d like to book a manicure for tomorrow afternoon around 2 PM"',
      difficulty: 'Easy',
      focus: 'Basic scheduling and availability',
      tips: 'Let the AI handle the conversation naturally. Don\'t rush.'
    },
    {
      id: 'pricing-questions',
      title: 'Pricing & Service Questions',
      script: '"How much do you charge for gel nails and how long does it take?"',
      difficulty: 'Easy',
      focus: 'Service information and pricing',
      tips: 'Your AI knows all your services and prices automatically.'
    },
    {
      id: 'complex-booking',
      title: 'Multiple Services',
      script: '"I need a full set removal and new acrylics with nail art, what\'s available this week?"',
      difficulty: 'Medium',
      focus: 'Complex service combinations and scheduling',
      tips: 'The AI can handle multiple services in one booking.'
    },
    {
      id: 'change-reschedule',
      title: 'Changes & Rescheduling',
      script: '"I have an appointment tomorrow but need to move it to Friday instead"',
      difficulty: 'Medium',
      focus: 'Appointment modifications',
      tips: 'Test how the AI handles existing appointment changes.'
    },
    {
      id: 'special-requests',
      title: 'Special Requests',
      script: '"I\'m coming for my wedding next week, I need something really special and elegant"',
      difficulty: 'Medium',
      focus: 'Personalized service and upselling',
      tips: 'See how the AI handles special occasions and recommendations.'
    },
    {
      id: 'difficult-customer',
      title: 'Challenging Customer',
      script: '"Your prices are too high, and I need an appointment right now or I\'m going somewhere else"',
      difficulty: 'Hard',
      focus: 'Customer service and conflict resolution',
      tips: 'Test how the AI handles difficult situations professionally.'
    }
  ]

  useEffect(() => {
    // Update confidence level based on test calls
    const newLevel = determineConfidenceLevel(testCalls.length)
    if (newLevel !== currentLevel) {
      setCurrentLevel(newLevel)
      if (newLevel !== 'building') {
        onConfidenceReached?.(newLevel)
      }
    }
  }, [testCalls, currentLevel, onConfidenceReached])

  const determineConfidenceLevel = (callCount: number): ConfidenceLevel['level'] => {
    if (callCount >= 8) return 'expert'
    if (callCount >= 5) return 'confident'
    if (callCount >= 3) return 'ready'
    return 'building'
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

  const addTestCall = (scenario: string, rating: number, feedback: string) => {
    const newCall: TestCall = {
      id: Date.now().toString(),
      timestamp: new Date(),
      scenario,
      rating,
      feedback,
      duration: Math.floor(Math.random() * 180) + 60 // 1-4 minutes
    }
    
    setTestCalls(prev => [newCall, ...prev])
    setShowCallLogger(false)
  }

  const currentLevelInfo = confidenceLevels[currentLevel]
  const progressPercentage = Math.min((testCalls.length / currentLevelInfo.callsNeeded) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Current Level Display */}
      <div className={`rounded-lg border-2 p-6 ${currentLevelInfo.color}`}>
        <div className="flex items-center space-x-4 mb-4">
          {currentLevelInfo.icon}
          <div>
            <h2 className="text-xl font-bold">{currentLevelInfo.title}</h2>
            <p className="text-sm opacity-90">{currentLevelInfo.description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Test Calls Made: {testCalls.length}</span>
            <span>
              {currentLevel === 'expert' ? 'Maximum Level!' : 
               `${Math.max(0, currentLevelInfo.callsNeeded - testCalls.length)} more for next level`}
            </span>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
            <div 
              className="bg-current h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-2">
          {currentLevelInfo.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 opacity-75" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Test Call Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            📞 Test Your AI Assistant
          </h3>
          <div className="text-2xl font-bold text-blue-600">
            {formatPhoneNumber(aiPhoneNumber)}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Call Actions */}
          <div className="space-y-4">
            <button
              onClick={() => setShowCallLogger(true)}
              className="w-full bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>I Made a Test Call</span>
            </button>

            <button
              onClick={() => setShowScenarios(!showScenarios)}
              className="w-full bg-blue-100 text-blue-700 p-4 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>View Test Scenarios</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{testCalls.length}</div>
                <div className="text-sm text-blue-800">Test Calls</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testCalls.length > 0 ? (testCalls.reduce((sum, call) => sum + call.rating, 0) / testCalls.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-green-800">Avg Rating</div>
              </div>
            </div>
            
            {testCalls.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-800">
                  <strong>Last Call:</strong> {testCalls[0].timestamp.toLocaleString()}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < testCalls[0].rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      {showScenarios && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            🎭 Test Scenarios to Try
          </h4>
          <div className="grid gap-4">
            {testScenarios.map((scenario, index) => (
              <div key={scenario.id} className="bg-white rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{scenario.title}</h5>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      scenario.difficulty === 'Easy' 
                        ? 'bg-green-100 text-green-800'
                        : scenario.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">
                    {index + 1}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-blue-800 italic text-sm">
                    <strong>Say this:</strong> {scenario.script}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Focus:</strong> {scenario.focus}
                  </div>
                  <div className="text-gray-600">
                    💡 {scenario.tips}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call History */}
      {testCalls.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="font-semibold text-gray-900 mb-4">📋 Your Test Call History</h4>
          <div className="space-y-3">
            {testCalls.slice(0, 5).map((call) => (
              <div key={call.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-grow">
                  <div className="font-medium text-gray-900">{call.scenario}</div>
                  <div className="text-sm text-gray-600">{call.feedback}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {call.timestamp.toLocaleString()} • {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < call.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {testCalls.length > 5 && (
            <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All {testCalls.length} Test Calls →
            </button>
          )}
        </div>
      )}

      {/* Call Logger Modal */}
      {showCallLogger && (
        <CallLoggerModal
          onSave={addTestCall}
          onCancel={() => setShowCallLogger(false)}
          scenarios={testScenarios}
        />
      )}

      {/* Encouragement based on level */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-2">
          {currentLevel === 'building' ? '🌟 You\'re Just Getting Started!' :
           currentLevel === 'ready' ? '🎯 You\'re Making Great Progress!' :
           currentLevel === 'confident' ? '🚀 You\'re Ready to Go Live!' :
           '🏆 You\'re an AI Expert!'}
        </h4>
        <p className="text-gray-700 text-sm">
          {currentLevel === 'building' ? 
            'Every successful business started with their first test call. Make yours today!' :
           currentLevel === 'ready' ? 
            'Your confidence is building! A few more calls and you\'ll be completely ready.' :
           currentLevel === 'confident' ? 
            'You\'ve proven your AI works perfectly. Time to start capturing real bookings!' :
           'You\'ve mastered AI phone booking! Consider sharing your success story.'}
        </p>
      </div>
    </div>
  )
}

// Call Logger Modal Component
function CallLoggerModal({ 
  onSave, 
  onCancel, 
  scenarios 
}: {
  onSave: (scenario: string, rating: number, feedback: string) => void
  onCancel: () => void
  scenarios: any[]
}) {
  const [selectedScenario, setSelectedScenario] = useState('')
  const [customScenario, setCustomScenario] = useState('')
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  const handleSave = () => {
    const scenario = selectedScenario || customScenario
    if (scenario && feedback) {
      onSave(scenario, rating, feedback)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          📞 Log Your Test Call
        </h3>
        
        <div className="space-y-4">
          {/* Scenario Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What did you test?
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a scenario...</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.title}>
                  {scenario.title}
                </option>
              ))}
              <option value="custom">Custom scenario</option>
            </select>
            
            {selectedScenario === 'custom' && (
              <input
                type="text"
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe what you tested..."
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did it go?
            </label>
            <div className="flex items-center space-x-2">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`text-2xl ${
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  <StarIcon className="w-6 h-6" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating === 5 ? 'Perfect!' :
                 rating === 4 ? 'Great!' :
                 rating === 3 ? 'Good' :
                 rating === 2 ? 'Okay' : 'Needs work'}
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What happened? How did the AI perform?
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="The AI answered quickly and professionally, collected all the right information, and confirmed the appointment perfectly..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!feedback || !(selectedScenario || customScenario)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Test Call
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}