'use client'

import { useState, useEffect } from 'react'
import {
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface StaffMetrics {
  staffId: string
  name: string
  appointmentCount: number
  revenue: number
  averageServiceTime: number
  utilizationRate: number
  topServices: string[]
  customerRating?: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  totalHoursWorked: number
  revenuePerHour: number
}

interface StaffPerformanceProps {
  businessId: string
  dateRange?: 'week' | 'month' | 'quarter' | 'year'
}

export function StaffPerformanceCard({ metrics }: { metrics: StaffMetrics }) {
  const getTrendIcon = () => {
    if (metrics.trend === 'up') {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    } else if (metrics.trend === 'down') {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const getTrendColor = () => {
    if (metrics.trend === 'up') return 'text-green-600'
    if (metrics.trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{metrics.name}</h3>
              <p className="text-sm text-gray-600">
                {metrics.appointmentCount} appointments
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${metrics.revenue.toLocaleString()}
            </p>
            <div className="flex items-center justify-end space-x-1 mt-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {metrics.trendPercentage > 0 ? '+' : ''}{metrics.trendPercentage}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Utilization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.utilizationRate, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium">{metrics.utilizationRate}%</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Revenue/Hour</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              ${metrics.revenuePerHour.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Service Time & Rating */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Avg Service Time</p>
            <p className="text-lg font-semibold">{metrics.averageServiceTime} min</p>
          </div>
          
          {metrics.customerRating && (
            <div>
              <p className="text-sm text-gray-600">Customer Rating</p>
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-lg font-semibold">{metrics.customerRating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Services */}
        {metrics.topServices.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Top Services</p>
            <div className="flex flex-wrap gap-1">
              {metrics.topServices.slice(0, 3).map((service, index) => (
                <span 
                  key={index}
                  className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Performance Badge */}
        {metrics.utilizationRate >= 80 && (
          <div className="mt-4 flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <TrophyIcon className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">Top Performer</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffPerformance({ businessId, dateRange = 'month' }: StaffPerformanceProps) {
  const [staffMetrics, setStaffMetrics] = useState<StaffMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'revenue' | 'appointments' | 'utilization'>('revenue')

  useEffect(() => {
    loadStaffPerformance()
  }, [businessId, dateRange])

  const loadStaffPerformance = async () => {
    setIsLoading(true)
    try {
      // Mock data for development - in production this would fetch from API
      const mockStaffData: StaffMetrics[] = [
        {
          staffId: '1',
          name: 'Sarah Johnson',
          appointmentCount: 85,
          revenue: 6800,
          averageServiceTime: 45,
          utilizationRate: 92,
          topServices: ['Popular Service', 'Signature Treatment', 'Express Service'],
          customerRating: 4.8,
          trend: 'up',
          trendPercentage: 15,
          totalHoursWorked: 160,
          revenuePerHour: 42.5
        },
        {
          staffId: '2', 
          name: 'Maria Rodriguez',
          appointmentCount: 72,
          revenue: 5760,
          averageServiceTime: 50,
          utilizationRate: 88,
          topServices: ['Pedicure', 'Spa Treatment', 'Gel Polish'],
          customerRating: 4.7,
          trend: 'up',
          trendPercentage: 8,
          totalHoursWorked: 156,
          revenuePerHour: 36.9
        },
        {
          staffId: '3',
          name: 'Emily Chen',
          appointmentCount: 65,
          revenue: 4875,
          averageServiceTime: 40,
          utilizationRate: 75,
          topServices: ['Basic Manicure', 'Cuticle Care', 'Polish Change'],
          customerRating: 4.6,
          trend: 'stable',
          trendPercentage: 2,
          totalHoursWorked: 150,
          revenuePerHour: 32.5
        },
        {
          staffId: '4',
          name: 'Ashley Williams',
          appointmentCount: 58,
          revenue: 4350,
          averageServiceTime: 42,
          utilizationRate: 68,
          topServices: ['Premium Service', 'Specialty Treatment', 'Quick Fix'],
          customerRating: 4.5,
          trend: 'down',
          trendPercentage: -5,
          totalHoursWorked: 145,
          revenuePerHour: 30.0
        }
      ]

      setStaffMetrics(mockStaffData)
    } catch (error) {
      console.error('Failed to load staff performance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedStaff = [...staffMetrics].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.revenue - a.revenue
      case 'appointments':
        return b.appointmentCount - a.appointmentCount
      case 'utilization':
        return b.utilizationRate - a.utilizationRate
      default:
        return 0
    }
  })

  const totalRevenue = staffMetrics.reduce((sum, staff) => sum + staff.revenue, 0)
  const totalAppointments = staffMetrics.reduce((sum, staff) => sum + staff.appointmentCount, 0)
  const averageUtilization = staffMetrics.reduce((sum, staff) => sum + staff.utilizationRate, 0) / staffMetrics.length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Team Revenue</p>
              <p className="text-2xl font-bold text-green-900">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Appointments</p>
              <p className="text-2xl font-bold text-blue-900">{totalAppointments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Avg Utilization</p>
              <p className="text-2xl font-bold text-purple-900">{averageUtilization.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="revenue">Revenue</option>
              <option value="appointments">Appointments</option>
              <option value="utilization">Utilization Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStaff.map((staff) => (
          <StaffPerformanceCard key={staff.staffId} metrics={staff} />
        ))}
      </div>

      {/* Team Insights */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Performance Highlights</h5>
            {sortedStaff[0] && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium text-yellow-800">{sortedStaff[0].name}</span>
                  <span className="text-yellow-700"> is your top revenue generator with </span>
                  <span className="font-medium text-yellow-800">${sortedStaff[0].revenue.toLocaleString()}</span>
                </p>
              </div>
            )}
            
            {staffMetrics.filter(s => s.utilizationRate >= 80).length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium text-green-800">
                    {staffMetrics.filter(s => s.utilizationRate >= 80).length} team member(s)
                  </span>
                  <span className="text-green-700"> are operating at high efficiency (80%+ utilization)</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Improvement Opportunities</h5>
            {staffMetrics.filter(s => s.utilizationRate < 70).map(staff => (
              <div key={staff.staffId} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium text-blue-800">{staff.name}</span>
                  <span className="text-blue-700"> could increase bookings - currently at {staff.utilizationRate}% utilization</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}