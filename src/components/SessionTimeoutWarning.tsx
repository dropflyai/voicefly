'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function SessionTimeoutWarning() {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleWarning = (e: Event) => {
      const customEvent = e as CustomEvent
      setMinutesLeft(customEvent.detail.minutesLeft)
      setShow(true)

      // Auto-hide after 30 seconds if user doesn't interact
      setTimeout(() => {
        setShow(false)
      }, 30000)
    }

    window.addEventListener('session-timeout-warning', handleWarning)
    return () => {
      window.removeEventListener('session-timeout-warning', handleWarning)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    // User activity automatically extends session
  }

  if (!show || !minutesLeft) return null

  return (
    <div className="fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border-2 border-yellow-400 z-50 animate-slide-in">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Session Timeout Warning
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Your session will expire in{' '}
              <span className="font-semibold text-yellow-700">
                {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}
              </span>
              {' '}due to inactivity.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Click anywhere or move your mouse to stay logged in.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(minutesLeft / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md border border-yellow-300 transition-colors"
          >
            I'm still here
          </button>
        </div>
      </div>
    </div>
  )
}
