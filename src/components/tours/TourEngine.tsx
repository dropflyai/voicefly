'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

export interface TourStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  required: boolean
  canSkip: boolean
  skipMessage?: string
  estimatedTime: number
  completedMessage?: string
}

export interface TourEngineProps {
  steps: TourStep[]
  onComplete: () => void
  onExit?: () => void
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  autoSaveProgress?: boolean
}

interface TourProgress {
  currentStepIndex: number
  completedSteps: string[]
  skippedSteps: string[]
  startTime: string
  lastActiveTime: string
}

export default function TourEngine({
  steps,
  onComplete,
  onExit,
  planTier,
  businessName,
  autoSaveProgress = true
}: TourEngineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [skippedSteps, setSkippedSteps] = useState<string[]>([])
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [startTime] = useState(new Date().toISOString())

  const currentStep = steps[currentStepIndex]
  const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100)
  const totalTime = steps.reduce((acc, step) => acc + step.estimatedTime, 0)
  const remainingTime = steps.slice(currentStepIndex).reduce((acc, step) => acc + step.estimatedTime, 0)

  const planNames = {
    starter: 'Starter',
    professional: 'Professional',
    business: 'Business'
  }

  // Auto-save progress
  useEffect(() => {
    if (autoSaveProgress) {
      const tourProgress: TourProgress = {
        currentStepIndex,
        completedSteps,
        skippedSteps,
        startTime,
        lastActiveTime: new Date().toISOString()
      }
      
      localStorage.setItem(`tour_progress_${planTier}`, JSON.stringify(tourProgress))
    }
  }, [currentStepIndex, completedSteps, skippedSteps, autoSaveProgress, planTier, startTime])

  // Load saved progress on mount
  useEffect(() => {
    if (autoSaveProgress) {
      const saved = localStorage.getItem(`tour_progress_${planTier}`)
      if (saved) {
        try {
          const progress: TourProgress = JSON.parse(saved)
          // Only restore if the session is recent (within 24 hours)
          const lastActive = new Date(progress.lastActiveTime)
          const hoursSinceLastActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceLastActive < 24) {
            setCurrentStepIndex(progress.currentStepIndex)
            setCompletedSteps(progress.completedSteps)
            setSkippedSteps(progress.skippedSteps)
          }
        } catch (error) {
          console.error('Failed to load tour progress:', error)
        }
      }
    }
  }, [autoSaveProgress, planTier])

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep.id])
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Tour complete
      setCompletedSteps(prev => [...prev, currentStep.id])
      handleTourComplete()
    }
  }

  const handleSkip = () => {
    setSkippedSteps(prev => [...prev, currentStep.id])
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      handleTourComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // Remove current step from completed/skipped
      setCompletedSteps(prev => prev.filter(id => id !== currentStep.id))
      setSkippedSteps(prev => prev.filter(id => id !== currentStep.id))
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleTourComplete = () => {
    // Clear saved progress
    if (autoSaveProgress) {
      localStorage.removeItem(`tour_progress_${planTier}`)
    }
    onComplete()
  }

  const handleExit = () => {
    if (onExit) {
      // Save current progress before exiting
      if (autoSaveProgress) {
        const tourProgress: TourProgress = {
          currentStepIndex,
          completedSteps,
          skippedSteps,
          startTime,
          lastActiveTime: new Date().toISOString()
        }
        localStorage.setItem(`tour_progress_${planTier}`, JSON.stringify(tourProgress))
      }
      onExit()
    }
  }

  const confirmExit = () => {
    setShowExitConfirm(false)
    handleExit()
  }

  if (!currentStep) {
    return null
  }

  const StepComponent = currentStep.component

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome to {businessName}!
              </h2>
              <p className="text-blue-100">
                {planNames[planTier]} Plan Dashboard Training
              </p>
            </div>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-100">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <span>{remainingTime} min remaining</span>
            </div>
            <div className="w-full bg-blue-500 bg-opacity-50 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentStep.description}
            </p>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span>⏱️ ~{currentStep.estimatedTime} minutes</span>
              {currentStep.required && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  Required
                </span>
              )}
              {currentStep.canSkip && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Optional
                </span>
              )}
            </div>
          </div>

          {/* Step Component */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <StepComponent 
              planTier={planTier}
              businessName={businessName}
              onStepComplete={handleNext}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep.canSkip && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {currentStep.skipMessage || 'Skip for now'}
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStepIndex === steps.length - 1 ? 'Complete Training' : 'Continue'}
                {currentStepIndex < steps.length - 1 && (
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                )}
                {currentStepIndex === steps.length - 1 && (
                  <CheckCircleIcon className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* Step Summary */}
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>✅ Completed: {completedSteps.length}</span>
              <span>⏭️ Skipped: {skippedSteps.length}</span>
              <span>📋 Remaining: {steps.length - currentStepIndex - 1}</span>
            </div>
            <span>Total time: ~{totalTime} minutes</span>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Exit Dashboard Training?
            </h3>
            <p className="text-gray-600 mb-6">
              Your progress will be saved and you can resume this training anytime from your dashboard.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Training
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Exit & Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}