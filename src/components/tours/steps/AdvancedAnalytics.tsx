'use client'

import React, { useState } from 'react'
import { ChartBarIcon, ArrowTrendingUpIcon, EyeIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface AdvancedAnalyticsProps {
  planTier: 'professional' | 'business'
  businessName?: string
  onStepComplete: () => void
}

export default function AdvancedAnalytics({
  planTier,
  businessName,
  onStepComplete
}: AdvancedAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')

  const handleContinue = () => {
    onStepComplete()
  }

  // Sample analytics data
  const analyticsData = {
    week: {
      revenue: '$1,285',
      appointments: 23,
      newCustomers: 8,
      avgService: '$55.87',
      growth: '+12%'
    },
    month: {
      revenue: '$5,470',
      appointments: 98,
      newCustomers: 34,
      avgService: '$55.82',
      growth: '+18%'
    },
    quarter: {
      revenue: '$16,890',
      appointments: 302,
      newCustomers: 127,
      avgService: '$55.93',
      growth: '+24%'
    }
  }

  const currentData = analyticsData[selectedTimeframe]

  const insightCards = [
    {
      title: 'Peak Hours Analysis',
      insight: 'Tuesdays 2-4 PM are your busiest times',
      action: 'Consider adding staff during peak hours',
      icon: '🕒',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      title: 'Service Performance',
      insight: 'Gel manicures have highest profit margin',
      action: 'Promote gel services in marketing',
      icon: '💅',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      title: 'Customer Retention',
      insight: '68% of customers book within 4 weeks',
      action: 'Send follow-up after 3 weeks',
      icon: '🔄',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      title: 'Revenue Opportunity',
      insight: '$340 potential from no-shows this month',
      action: 'Enable automated reminder system',
      icon: '💰',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  ]

  const chartData = [
    { day: 'Mon', bookings: 12, revenue: 650 },
    { day: 'Tue', bookings: 18, revenue: 920 },
    { day: 'Wed', bookings: 15, revenue: 780 },
    { day: 'Thu', bookings: 22, revenue: 1150 },
    { day: 'Fri', bookings: 25, revenue: 1380 },
    { day: 'Sat', bookings: 28, revenue: 1520 },
    { day: 'Sun', bookings: 8, revenue: 420 }
  ]

  const tierFeatures = {
    professional: [
      'Revenue and booking analytics dashboard',
      'Customer retention and lifetime value tracking',
      'Service performance and profitability analysis',
      'Peak time and staff utilization insights',
      'No-show and cancellation analytics',
      'Monthly business performance reports',
      'Customer demographics and preferences',
      'Marketing campaign effectiveness tracking'
    ],
    business: [
      'Multi-location analytics and comparisons',
      'Cross-location customer behavior analysis',
      'Advanced forecasting and trend analysis',
      'Custom report builder and automation',
      'Real-time business intelligence dashboard',
      'Staff performance across all locations',
      'Enterprise-level data export and integration',
      'Advanced customer segmentation',
      'ROI tracking for all marketing channels',
      'Predictive analytics for demand planning'
    ]
  }

  const reportTypes = [
    { name: 'Daily Performance', frequency: 'Daily', description: 'Bookings, revenue, and key metrics' },
    { name: 'Weekly Summary', frequency: 'Weekly', description: 'Trends and performance highlights' },
    { name: 'Monthly Business Review', frequency: 'Monthly', description: 'Comprehensive business analysis' },
    { name: 'Customer Retention Report', frequency: 'Monthly', description: 'Loyalty and retention metrics' },
    { name: 'Staff Performance Report', frequency: 'Monthly', description: 'Individual and team metrics' },
    ...(planTier === 'business' ? [
      { name: 'Multi-Location Comparison', frequency: 'Weekly', description: 'Cross-location performance analysis' },
      { name: 'Enterprise Dashboard', frequency: 'Real-time', description: 'Live business intelligence' }
    ] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <ChartBarIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Advanced Analytics Available
        </h3>
        <p className="text-gray-600">
          Get powerful insights to grow your business with data-driven decisions.
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'quarter'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'This Quarter'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <ArrowTrendingUpIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{currentData.revenue}</div>
          <div className="text-sm text-green-800">Total Revenue</div>
          <div className="text-xs text-green-600 font-medium">{currentData.growth} vs last period</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{currentData.appointments}</div>
          <div className="text-sm text-blue-800">Appointments</div>
          <div className="text-xs text-blue-600">Completed bookings</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{currentData.newCustomers}</div>
          <div className="text-sm text-purple-800">New Customers</div>
          <div className="text-xs text-purple-600">First-time visitors</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{currentData.avgService}</div>
          <div className="text-sm text-yellow-800">Avg Service Value</div>
          <div className="text-xs text-yellow-600">Per appointment</div>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">📊 Weekly Performance Trend</h4>
        
        <div className="space-y-3">
          {chartData.map((data, index) => (
            <div key={data.day} className="flex items-center space-x-3">
              <div className="w-12 text-sm font-medium text-gray-600">{data.day}</div>
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-grow bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(data.bookings / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.bookings}</span>
                </div>
                <div className="text-xs text-gray-600">${data.revenue} revenue</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <EyeIcon className="w-5 h-5 text-purple-600 mr-2" />
          🤖 AI-Powered Business Insights
        </h4>
        
        <div className="grid gap-4">
          {insightCards.map((insight, index) => (
            <div key={index} className={`border rounded-lg p-4 ${insight.color}`}>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-grow">
                  <h5 className="font-semibold mb-1">{insight.title}</h5>
                  <p className="text-sm mb-2">{insight.insight}</p>
                  <div className="text-xs font-medium">
                    💡 Recommendation: {insight.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Reports */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">📋 Available Analytics Reports:</h4>
        
        <div className="grid gap-3">
          {reportTypes.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{report.name}</span>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {report.frequency}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Analytics Features:
        </h4>
        <ul className="text-blue-800 text-sm space-y-1">
          {tierFeatures[planTier].map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>

      {/* Data Export & Integration */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">📈 Data Export & Integration:</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-green-800 text-sm">Export reports as CSV/PDF</span>
            <span className="text-green-600 font-medium">✅ Available</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-800 text-sm">Email automated reports</span>
            <span className="text-green-600 font-medium">✅ Available</span>
          </div>
          {planTier === 'business' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-green-800 text-sm">API access for custom integrations</span>
                <span className="text-green-600 font-medium">✅ Available</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-800 text-sm">Connect to business intelligence tools</span>
                <span className="text-green-600 font-medium">✅ Available</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-semibold text-yellow-800 mb-2">📋 Analytics Setup Complete:</h5>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>✅ Analytics tracking is automatically enabled for all appointments</li>
          <li>✅ Your dashboard shows real-time business performance metrics</li>
          <li>✅ Weekly and monthly reports will be automatically generated</li>
          <li>✅ AI insights will improve as more data is collected</li>
          <li>✅ Access detailed analytics anytime from Reports → Analytics</li>
        </ul>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Advanced analytics are always available in Reports → Analytics
        </p>
      </div>
    </div>
  )
}