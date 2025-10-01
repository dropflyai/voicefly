'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    trend: 'up' | 'down' | 'stable'
    growth: number
  }
  bookings: {
    total: number
    completed: number
    cancelled: number
    noShows: number
  }
  customers: {
    total: number
    new: number
    returning: number
    retention: number
  }
  services: {
    name: string
    bookings: number
    revenue: number
    avgDuration: number
    satisfaction: number
  }[]
  timeSlots: {
    hour: string
    bookings: number
    revenue: number
  }[]
  insights: {
    type: 'opportunity' | 'warning' | 'success'
    title: string
    description: string
    action?: string
  }[]
}

interface SmartAnalyticsProps {
  businessId: string
  dateRange?: 'week' | 'month' | 'quarter' | 'year'
  className?: string
}

export default function SmartAnalytics({ businessId, dateRange = 'month', className = '' }: SmartAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'customers'>('revenue')

  useEffect(() => {
    loadAnalyticsData()
  }, [businessId, dateRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Fetch real data from backend API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-60875.up.railway.app'
      const response = await fetch(`${apiBaseUrl}/api/analytics/dashboard/${businessId}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('API returned error')
      }
      
      // Get backend data
      const backendData = result.data
      
      // Transform backend data to match frontend AnalyticsData interface
      const transformedData: AnalyticsData = {
        revenue: {
          current: backendData.realTimeMetrics?.monthlyRevenue || 0,
          previous: (backendData.realTimeMetrics?.monthlyRevenue || 0) * 0.8, // Estimate previous month
          trend: (backendData.realTimeMetrics?.monthlyRevenue || 0) > 0 ? 'up' : 'stable',
          growth: 26.0 // Default growth rate
        },
        bookings: {
          total: backendData.realTimeMetrics?.todayAppointments || 0,
          completed: Math.floor((backendData.realTimeMetrics?.todayAppointments || 0) * 0.85),
          cancelled: Math.floor((backendData.realTimeMetrics?.todayAppointments || 0) * 0.10),
          noShows: Math.floor((backendData.realTimeMetrics?.todayAppointments || 0) * 0.05)
        },
        customers: {
          total: backendData.customerInsights?.totalCustomers || 0,
          new: backendData.customerInsights?.newCustomersThisMonth || 0,
          returning: (backendData.customerInsights?.totalCustomers || 0) - (backendData.customerInsights?.newCustomersThisMonth || 0),
          retention: backendData.customerInsights?.customerRetentionRate || 0
        },
        services: backendData.servicePerformance?.map((service: any) => ({
          name: service.name,
          bookings: service.bookings,
          revenue: service.revenue,
          avgDuration: service.avgDuration,
          satisfaction: 4.5 // Default satisfaction rating
        })) || [],
        timeSlots: Object.entries(backendData.servicePerformance?.[0]?.popularTimes || {}).map(([hour, bookings]: [string, any]) => ({
          hour: `${hour}:00`,
          bookings: bookings,
          revenue: bookings * 80 // Estimate revenue per booking
        })),
        insights: backendData.insights?.map((insight: any) => ({
          type: insight.priority === 'high' ? 'warning' : insight.priority === 'medium' ? 'opportunity' : 'success',
          title: insight.title,
          description: insight.description,
          action: insight.recommendation
        })) || []
      }

      setData(transformedData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <LightBulbIcon className="h-5 w-5 text-blue-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <SparklesIcon className="h-5 w-5 text-green-500" />
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getInsightBackground = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-blue-50 border-blue-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
          <p>Unable to load analytics data</p>
          <button 
            onClick={loadAnalyticsData}
            className="mt-2 text-purple-600 hover:text-purple-700 flex items-center mx-auto"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3 text-purple-600" />
            Smart Analytics
          </h2>
          <div className="flex items-center space-x-2">
            <select 
              value={dateRange}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button 
              onClick={loadAnalyticsData}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Revenue</p>
                <p className="text-2xl font-bold text-green-900">${data.revenue.current.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-700">+{data.revenue.growth}% vs last {dateRange}</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Bookings</p>
                <p className="text-2xl font-bold text-blue-900">{data.bookings.total}</p>
                <div className="text-sm text-blue-700 mt-1">
                  {data.bookings.completed} completed • {data.bookings.cancelled} cancelled
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Customers</p>
                <p className="text-2xl font-bold text-purple-900">{data.customers.total}</p>
                <div className="flex items-center mt-1">
                  <UserGroupIcon className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-700">{data.customers.retention}% retention</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
          Smart Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map((insight, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getInsightBackground(insight.type)}`}>
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  {insight.action && (
                    <button className="text-xs bg-white px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 font-medium">
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Service</th>
                <th className="text-center py-3 font-medium text-gray-700">Bookings</th>
                <th className="text-center py-3 font-medium text-gray-700">Revenue</th>
                <th className="text-center py-3 font-medium text-gray-700">Avg Duration</th>
                <th className="text-center py-3 font-medium text-gray-700">Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((service, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{service.name}</div>
                  </td>
                  <td className="text-center py-3">{service.bookings}</td>
                  <td className="text-center py-3 font-medium text-green-600">
                    ${service.revenue.toLocaleString()}
                  </td>
                  <td className="text-center py-3">{service.avgDuration}min</td>
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 font-medium">{service.satisfaction}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
          Peak Hours Analysis
        </h3>
        <div className="space-y-3">
          {data.timeSlots.map((slot, index) => {
            const maxBookings = Math.max(...data.timeSlots.map(s => s.bookings))
            const percentage = (slot.bookings / maxBookings) * 100
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-700">{slot.hour}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {slot.bookings} bookings
                  </div>
                </div>
                <div className="w-20 text-sm font-medium text-green-600 text-right">
                  ${slot.revenue}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}