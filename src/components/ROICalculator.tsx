'use client'

import React, { useState, useEffect } from 'react'
import { CalculatorIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/solid'

interface ROICalculatorProps {
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  monthlyRevenue?: number
  averageServicePrice?: number
  onClose?: () => void
}

export default function ROICalculator({
  planTier,
  businessName,
  monthlyRevenue = 15000,
  averageServicePrice = 55,
  onClose
}: ROICalculatorProps) {
  const [currentMetrics, setCurrentMetrics] = useState({
    missedCalls: 15,
    noShowRate: 20,
    repeatCustomerRate: 30,
    averageServicePrice: averageServicePrice
  })

  const [projectedMetrics, setProjectedMetrics] = useState({
    additionalBookings: 0,
    reducedNoShows: 0,
    increasedRepeatRate: 0,
    totalAdditionalRevenue: 0,
    roi: 0,
    paybackDays: 0
  })

  // Plan costs
  const planCosts = {
    starter: 67,
    professional: 147,
    business: 297
  }

  // Expected improvements by tier
  const improvements = {
    starter: {
      capturedMissedCalls: 0.8, // Capture 80% of missed calls
      noShowReduction: 0, // No payment processing
      repeatRateIncrease: 0, // No loyalty program
      averageTicketIncrease: 0 // No upselling features
    },
    professional: {
      capturedMissedCalls: 0.85, // Better with analytics
      noShowReduction: 0.7, // Payment processing reduces no-shows
      repeatRateIncrease: 0.35, // Loyalty program impact
      averageTicketIncrease: 0.15 // Email marketing and upselling
    },
    business: {
      capturedMissedCalls: 0.9, // Custom AI captures more
      noShowReduction: 0.75, // Better with multi-location management
      repeatRateIncrease: 0.45, // Enterprise loyalty features
      averageTicketIncrease: 0.25 // White-label trust and custom AI upselling
    }
  }

  useEffect(() => {
    calculateROI()
  }, [currentMetrics, planTier])

  const calculateROI = () => {
    const improvement = improvements[planTier]
    const monthlyCost = planCosts[planTier]

    // Calculate additional bookings from missed calls
    const additionalBookings = Math.round(currentMetrics.missedCalls * improvement.capturedMissedCalls)
    const revenueFromNewBookings = additionalBookings * currentMetrics.averageServicePrice

    // Calculate savings from reduced no-shows
    const monthlyNoShows = (monthlyRevenue / currentMetrics.averageServicePrice) * (currentMetrics.noShowRate / 100)
    const reducedNoShows = Math.round(monthlyNoShows * improvement.noShowReduction)
    const revenueFromReducedNoShows = reducedNoShows * currentMetrics.averageServicePrice

    // Calculate revenue from increased repeat customers
    const currentMonthlyCustomers = monthlyRevenue / currentMetrics.averageServicePrice
    const currentRepeatCustomers = currentMonthlyCustomers * (currentMetrics.repeatCustomerRate / 100)
    const newRepeatCustomers = currentRepeatCustomers * improvement.repeatRateIncrease
    const revenueFromRepeatCustomers = newRepeatCustomers * currentMetrics.averageServicePrice * 2 // They visit twice

    // Calculate increased average ticket
    const revenueFromIncreasedTicket = monthlyRevenue * improvement.averageTicketIncrease

    // Total additional revenue
    const totalAdditionalRevenue = 
      revenueFromNewBookings + 
      revenueFromReducedNoShows + 
      revenueFromRepeatCustomers + 
      revenueFromIncreasedTicket

    // Calculate ROI
    const roi = ((totalAdditionalRevenue - monthlyCost) / monthlyCost) * 100

    // Calculate payback period in days
    const dailyAdditionalRevenue = totalAdditionalRevenue / 30
    const paybackDays = Math.ceil(monthlyCost / dailyAdditionalRevenue)

    setProjectedMetrics({
      additionalBookings,
      reducedNoShows,
      increasedRepeatRate: Math.round(improvement.repeatRateIncrease * 100),
      totalAdditionalRevenue: Math.round(totalAdditionalRevenue),
      roi: Math.round(roi),
      paybackDays
    })
  }

  const handleMetricChange = (metric: string, value: number) => {
    setCurrentMetrics({
      ...currentMetrics,
      [metric]: value
    })
  }

  // Psychology messages based on ROI
  const getPsychologyMessage = () => {
    if (projectedMetrics.roi > 500) {
      return {
        title: "🚀 Exceptional ROI Potential!",
        message: "You're leaving serious money on the table every day you wait.",
        color: "text-green-600"
      }
    } else if (projectedMetrics.roi > 200) {
      return {
        title: "💰 Strong Investment Return",
        message: "Most businesses see these results within 30 days.",
        color: "text-blue-600"
      }
    } else if (projectedMetrics.roi > 100) {
      return {
        title: "📈 Positive ROI Expected",
        message: "You'll break even quickly and profit from there.",
        color: "text-indigo-600"
      }
    } else {
      return {
        title: "💡 Quick Break-Even",
        message: `You'll cover your costs in just ${projectedMetrics.paybackDays} days.`,
        color: "text-gray-600"
      }
    }
  }

  const psychologyMessage = getPsychologyMessage()

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CalculatorIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ROI Calculator</h2>
            <p className="text-gray-600">See your potential return with {businessName}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Current Metrics Input */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Current Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Missed Calls Per Week
            </label>
            <input
              type="number"
              value={currentMetrics.missedCalls}
              onChange={(e) => handleMetricChange('missedCalls', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Average salon misses 15-20 calls/week</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No-Show Rate (%)
            </label>
            <input
              type="number"
              value={currentMetrics.noShowRate}
              onChange={(e) => handleMetricChange('noShowRate', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Industry average: 20-30%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repeat Customer Rate (%)
            </label>
            <input
              type="number"
              value={currentMetrics.repeatCustomerRate}
              onChange={(e) => handleMetricChange('repeatCustomerRate', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Industry average: 30-40%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Service Price ($)
            </label>
            <input
              type="number"
              value={currentMetrics.averageServicePrice}
              onChange={(e) => handleMetricChange('averageServicePrice', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Your average ticket value</p>
          </div>
        </div>
      </div>

      {/* Projected Improvements */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Expected Improvements with {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              +{projectedMetrics.additionalBookings}
            </div>
            <div className="text-sm text-gray-600">New Bookings/Week</div>
          </div>

          {planTier !== 'starter' && (
            <div className="bg-white rounded-lg p-4 text-center">
              <ChartBarIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                -{projectedMetrics.reducedNoShows}
              </div>
              <div className="text-sm text-gray-600">No-Shows/Month</div>
            </div>
          )}

          {planTier !== 'starter' && (
            <div className="bg-white rounded-lg p-4 text-center">
              <UsersIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                +{projectedMetrics.increasedRepeatRate}%
              </div>
              <div className="text-sm text-gray-600">Repeat Rate</div>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 text-center">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              ${projectedMetrics.totalAdditionalRevenue}
            </div>
            <div className="text-sm text-gray-600">Extra Revenue/Month</div>
          </div>
        </div>

        {/* Feature Impact Breakdown */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Revenue Impact Breakdown:</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">📞 Captured missed calls</span>
              <span className="font-medium text-gray-900">
                +${projectedMetrics.additionalBookings * currentMetrics.averageServicePrice}/mo
              </span>
            </div>
            
            {planTier !== 'starter' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💳 Reduced no-shows</span>
                <span className="font-medium text-gray-900">
                  +${projectedMetrics.reducedNoShows * currentMetrics.averageServicePrice}/mo
                </span>
              </div>
            )}
            
            {planTier !== 'starter' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">🎁 Loyalty program impact</span>
                <span className="font-medium text-gray-900">
                  +${Math.round((projectedMetrics.increasedRepeatRate / 100) * monthlyRevenue * 0.2)}/mo
                </span>
              </div>
            )}
            
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Additional Revenue</span>
              <span className="text-lg font-bold text-green-600">
                +${projectedMetrics.totalAdditionalRevenue}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">
              {projectedMetrics.roi}%
            </div>
            <div className="text-green-100">Return on Investment</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold mb-2">
              {projectedMetrics.paybackDays} days
            </div>
            <div className="text-green-100">To Break Even</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold mb-2">
              ${projectedMetrics.totalAdditionalRevenue - planCosts[planTier]}
            </div>
            <div className="text-green-100">Net Profit/Month</div>
          </div>
        </div>
      </div>

      {/* Psychology Message */}
      <div className="mt-6 text-center">
        <h3 className={`text-xl font-bold ${psychologyMessage.color} mb-2`}>
          {psychologyMessage.title}
        </h3>
        <p className="text-gray-600 mb-4">
          {psychologyMessage.message}
        </p>
        
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium">
            💡 Every day you wait = ${Math.round(projectedMetrics.totalAdditionalRevenue / 30)} in lost revenue
          </p>
        </div>

        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Activate These Features Now
        </button>
      </div>
    </div>
  )
}

// Import missing icons
import { XMarkIcon, UsersIcon } from '@heroicons/react/24/solid'