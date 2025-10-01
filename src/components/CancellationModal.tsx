'use client'

import React, { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

interface CancellationModalProps {
  isOpen: boolean
  onClose: () => void
  businessName: string
  phoneNumber: string
  onConfirmCancel: (data: CancellationData) => Promise<void>
}

export interface CancellationData {
  reason: string
  feedback: string
  retainNumber: boolean
  wouldReturn: boolean
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'not_ready', label: 'Not ready to use AI yet' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'found_alternative', label: 'Found another solution' },
  { value: 'other', label: 'Other reason' }
]

export default function CancellationModal({ 
  isOpen, 
  onClose, 
  businessName,
  phoneNumber,
  onConfirmCancel 
}: CancellationModalProps) {
  const [step, setStep] = useState<'survey' | 'retention' | 'confirm'>('survey')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [retainNumber, setRetainNumber] = useState<boolean | null>(null)
  const [wouldReturn, setWouldReturn] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 'survey' && reason) {
      setStep('retention')
    } else if (step === 'retention' && retainNumber !== null) {
      setStep('confirm')
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirmCancel({
        reason,
        feedback,
        retainNumber: retainNumber || false,
        wouldReturn
      })
      onClose()
    } catch (error) {
      console.error('Cancellation failed:', error)
      alert('Failed to cancel. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'retention') setStep('survey')
    else if (step === 'confirm') setStep('retention')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'survey' && 'Before you go...'}
              {step === 'retention' && 'Keep your phone number?'}
              {step === 'confirm' && 'Confirm cancellation'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Survey Step */}
          {step === 'survey' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                We're sorry to see you go. Your feedback helps us improve.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you cancelling? *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason...</option>
                  {CANCELLATION_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional feedback? (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="would-return"
                  checked={wouldReturn}
                  onChange={(e) => setWouldReturn(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="would-return" className="ml-2 text-sm text-gray-700">
                  I might return in the future
                </label>
              </div>
            </div>
          )}

          {/* Retention Step */}
          {step === 'retention' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Don't lose your AI phone number!
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  Your customers already know: <strong>{phoneNumber}</strong>
                </p>
                <p className="text-blue-700 text-sm">
                  Keep it active for just $5/month and reactivate your full service anytime.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setRetainNumber(true)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                    retainNumber === true
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">
                        Keep my number - $5/month
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        • Customers can still reach you
                        • Reactivate anytime
                        • No setup fee when you return
                      </div>
                    </div>
                    {retainNumber === true && (
                      <div className="text-green-600">✓</div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setRetainNumber(false)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                    retainNumber === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">
                        Release my number
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        • Number available to others in 7 days
                        • Get a new number if you return
                        • No monthly charge
                      </div>
                    </div>
                    {retainNumber === false && (
                      <div className="text-red-600">✓</div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  ⚠️ You're about to cancel your trial
                </h3>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Your AI assistant will stop taking calls</li>
                  <li>• No charges will be processed</li>
                  <li>• Your data saved for 30 days</li>
                  {retainNumber ? (
                    <li className="text-green-700">• Your number retained for $5/month</li>
                  ) : (
                    <li className="text-red-700">• Your number released in 7 days</li>
                  )}
                </ul>
              </div>

              <div className="text-center text-gray-600">
                <p className="mb-2">Are you sure you want to cancel?</p>
                <p className="text-sm">You can reactivate anytime within 30 days.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            {step !== 'survey' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Keep Trial
              </button>
              
              {step !== 'confirm' ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 'survey' && !reason) ||
                    (step === 'retention' && retainNumber === null)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}