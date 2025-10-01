'use client'

import React, { useState } from 'react'
import { 
  DevicePhoneMobileIcon, 
  BuildingOffice2Icon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  PhoneIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid'

interface PhoneForwardingGuideProps {
  businessPhoneNumber: string
  aiPhoneNumber: string
  onComplete?: () => void
  onNeedHelp?: () => void
}

interface CarrierInstructions {
  name: string
  logo: string
  phoneNumber: string
  instructions: string[]
  timeEstimate: string
  difficulty: 'easy' | 'medium'
}

export default function PhoneForwardingGuide({
  businessPhoneNumber,
  aiPhoneNumber,
  onComplete,
  onNeedHelp
}: PhoneForwardingGuideProps) {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

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

  const carriers: CarrierInstructions[] = [
    {
      name: 'Verizon',
      logo: '🔴',
      phoneNumber: '*72',
      instructions: [
        'Pick up your business phone',
        'Dial *72 (star-seven-two)',
        'When you hear the dial tone, dial your AI number',
        'Hang up when you hear the confirmation tone'
      ],
      timeEstimate: '2 minutes',
      difficulty: 'easy'
    },
    {
      name: 'AT&T',
      logo: '🔵',
      phoneNumber: '*72',
      instructions: [
        'Pick up your business phone',
        'Dial *72 (star-seven-two)',
        'Wait for the dial tone',
        'Dial your AI assistant number',
        'Wait for confirmation beep and hang up'
      ],
      timeEstimate: '2 minutes',
      difficulty: 'easy'
    },
    {
      name: 'T-Mobile',
      logo: '🟣',
      phoneNumber: '*21*',
      instructions: [
        'Pick up your business phone',
        'Dial *21* (star-two-one-star)',
        'Immediately dial your AI number',
        'Press # (pound key)',
        'Wait for confirmation message'
      ],
      timeEstimate: '2 minutes',
      difficulty: 'easy'
    },
    {
      name: 'Sprint',
      logo: '🟡',
      phoneNumber: '*72',
      instructions: [
        'Pick up your business phone',
        'Dial *72 (star-seven-two)',
        'Listen for dial tone',
        'Dial your AI assistant number',
        'Hang up after confirmation tone'
      ],
      timeEstimate: '2 minutes',
      difficulty: 'easy'
    },
    {
      name: 'Comcast/Xfinity',
      logo: '⚫',
      phoneNumber: '*72',
      instructions: [
        'Pick up your business phone',
        'Dial *72 (star-seven-two)',
        'Wait for dial tone (about 3 seconds)',
        'Dial your AI number',
        'Hang up when you hear 3 short beeps'
      ],
      timeEstimate: '3 minutes',
      difficulty: 'easy'
    },
    {
      name: 'Other/Not Sure',
      logo: '❓',
      phoneNumber: 'Contact Support',
      instructions: [
        'Call your phone company customer service',
        'Say: "I want to forward my calls"',
        'Give them your AI number to forward to',
        'They will walk you through the process',
        'Test by calling your business number'
      ],
      timeEstimate: '5-10 minutes',
      difficulty: 'medium'
    }
  ]

  const selectedCarrierInfo = carriers.find(c => c.name === selectedCarrier)

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex])
    }
  }

  const handleAllComplete = () => {
    onComplete?.()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📞 Simple Phone Forwarding Setup
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Forward your business calls to your AI assistant in just 2-3 minutes. 
          Don't worry - you can undo this anytime!
        </p>
      </div>

      {/* Safety Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-3">
          <ShieldCheckIcon className="w-8 h-8 text-green-600" />
          <h2 className="text-xl font-semibold text-green-900">
            🛡️ 100% Safe & Reversible
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-green-800">Your number stays yours</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-green-800">Turn off anytime instantly</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-green-800">No permanent changes</span>
          </div>
        </div>
      </div>

      {/* Phone Numbers Overview */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">📋 What We're Setting Up:</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
            <h4 className="font-semibold text-gray-900 mb-2">Your Business Number</h4>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatPhoneNumber(businessPhoneNumber)}
            </div>
            <p className="text-sm text-gray-600">
              Customers will still call this number - nothing changes for them!
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border-2 border-green-300">
            <h4 className="font-semibold text-gray-900 mb-2">AI Assistant Number</h4>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatPhoneNumber(aiPhoneNumber)}
            </div>
            <p className="text-sm text-gray-600">
              Your business number will forward calls here automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Carrier Selection */}
      {!selectedCarrier && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Step 1: Choose Your Phone Company
          </h3>
          <p className="text-gray-600 mb-6">
            Select your phone service provider to get specific instructions:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {carriers.map((carrier) => (
              <button
                key={carrier.name}
                onClick={() => setSelectedCarrier(carrier.name)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-3xl mb-2">{carrier.logo}</div>
                <div className="font-medium text-gray-900">{carrier.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  {carrier.timeEstimate}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Carrier Instructions */}
      {selectedCarrierInfo && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{selectedCarrierInfo.logo}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedCarrierInfo.name} Instructions
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {selectedCarrierInfo.timeEstimate}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedCarrierInfo.difficulty === 'easy' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedCarrierInfo.difficulty === 'easy' ? '✅ Super Easy' : '⚡ Quick Call'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedCarrier('')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Choose Different Carrier
            </button>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-4">
            {selectedCarrierInfo.instructions.map((instruction, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
                  completedSteps.includes(index)
                    ? 'bg-green-50 border-green-300'
                    : currentStep === index
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  completedSteps.includes(index)
                    ? 'bg-green-600 text-white'
                    : currentStep === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.includes(index) ? '✓' : index + 1}
                </div>
                
                <div className="flex-grow">
                  <p className="text-gray-900 font-medium">{instruction}</p>
                  {index === 1 && selectedCarrierInfo.name !== 'T-Mobile' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm">
                        💡 <strong>Code to dial:</strong> {selectedCarrierInfo.phoneNumber}
                      </p>
                    </div>
                  )}
                  {(index === 2 || index === 3) && instruction.includes('AI number') && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm">
                        📞 <strong>AI Number:</strong> {formatPhoneNumber(aiPhoneNumber)}
                      </p>
                    </div>
                  )}
                </div>

                {!completedSteps.includes(index) && (
                  <button
                    onClick={() => {
                      handleStepComplete(index)
                      setCurrentStep(index + 1)
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Test Step */}
          <div className="mt-6 p-6 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-3">
              🧪 Test Your Setup
            </h4>
            <div className="space-y-3">
              <p className="text-purple-800">
                After completing the steps above, test your forwarding:
              </p>
              <ol className="list-decimal list-inside text-purple-800 text-sm space-y-1">
                <li>Call your business number from another phone</li>
                <li>Your AI assistant should answer</li>
                <li>Try booking a test appointment</li>
                <li>Check that it appears in your dashboard</li>
              </ol>
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleAllComplete}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  ✅ It's Working Perfectly!
                </button>
                <button
                  onClick={onNeedHelp}
                  className="bg-red-100 text-red-700 px-6 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                >
                  🆘 I Need Help
                </button>
              </div>
            </div>
          </div>

          {/* Turn Off Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">
              🔄 How to Turn Off Forwarding (Anytime)
            </h4>
            <p className="text-yellow-800 text-sm">
              <strong>To disable forwarding:</strong> Pick up your business phone and dial{' '}
              <span className="font-mono bg-yellow-100 px-1 rounded">
                {selectedCarrierInfo.name === 'T-Mobile' ? '#21#' : '*73'}
              </span>{' '}
              then hang up. Your calls will go directly to your phone again.
            </p>
          </div>
        </div>
      )}

      {/* Common Issues & Solutions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🛠️ Common Questions & Solutions
        </h3>
        
        <div className="space-y-4">
          <details className="bg-white rounded-lg border">
            <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              What if I don't hear a dial tone?
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700">
              <p>Some carriers have a delay. Wait 5-10 seconds after dialing the forwarding code before entering your AI number.</p>
            </div>
          </details>
          
          <details className="bg-white rounded-lg border">
            <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              What if forwarding doesn't work?
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700">
              <p>Call your phone company and say "I need help setting up call forwarding." They'll do it for you in 2 minutes.</p>
            </div>
          </details>
          
          <details className="bg-white rounded-lg border">
            <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              Can I forward only some calls?
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700">
              <p>Yes! Many carriers offer "busy line forwarding" or "no answer forwarding" so calls only forward when you don't answer.</p>
            </div>
          </details>
          
          <details className="bg-white rounded-lg border">
            <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
              Will customers know calls are forwarded?
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700">
              <p>No! They call your normal number and your AI answers professionally. It's completely transparent to customers.</p>
            </div>
          </details>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          🤝 Need Personal Help?
        </h3>
        <p className="text-blue-800 mb-4">
          Our success team can walk you through this step-by-step on a quick call.
          Most setups are done in under 5 minutes!
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onNeedHelp}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            📞 Get Phone Support
          </button>
          <button className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            💬 Live Chat Help
          </button>
        </div>
      </div>
    </div>
  )
}