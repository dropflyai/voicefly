'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DataCollectionIndicatorProps {
  tier: string
  className?: string
}

/**
 * Shows users on Starter tier that their data is being collected
 * Creates FOMO and upgrade motivation
 */
export function DataCollectionIndicator({ tier, className = '' }: DataCollectionIndicatorProps) {
  const [dataPoints, setDataPoints] = useState(127)
  
  useEffect(() => {
    if (tier === 'starter') {
      const interval = setInterval(() => {
        setDataPoints(prev => prev + 1)
      }, 30000) // Add a data point every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [tier])
  
  if (tier !== 'starter') return null
  
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              📊 Your Analytics Data is Ready!
            </h4>
            <p className="text-xs text-gray-600">
              {dataPoints} data points collected • Growing by the hour
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-500 flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            Live tracking
          </div>
          <div className="text-lg font-bold text-purple-600">
            ${(dataPoints * 18.75).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Revenue tracked</div>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex space-x-4">
          <span className="text-green-600">✓ Revenue tracking</span>
          <span className="text-green-600">✓ Customer insights</span>
          <span className="text-green-600">✓ Service analytics</span>
        </div>
        
        <button className="text-purple-600 hover:text-purple-700 font-medium">
          Unlock Analytics →
        </button>
      </div>
    </div>
  )
}

/**
 * Small indicator that shows continuously in the dashboard sidebar
 */
export function LiveDataBadge({ tier }: { tier: string }) {
  const [count, setCount] = useState(43)
  
  useEffect(() => {
    if (tier === 'starter') {
      const interval = setInterval(() => {
        setCount(prev => prev + Math.floor(Math.random() * 3) + 1)
      }, 45000) // Update every 45 seconds
      
      return () => clearInterval(interval)
    }
  }, [tier])
  
  if (tier !== 'starter') return null
  
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-purple-700">
        <span className="font-medium">{count}</span> insights ready
      </span>
    </div>
  )
}

export default DataCollectionIndicator