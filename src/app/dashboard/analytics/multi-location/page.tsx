'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../../components/Layout'
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MapPinIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface LocationMetrics {
  locationId: string
  locationName: string
  address: string
  revenue: number
  appointments: number
  customers: number
  utilizationRate: number
  averageTicket: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  staffCount: number
  topService: string
  monthlyRevenue: number[]
  monthlyAppointments: number[]
}

interface ComparisonData {
  location: string
  revenue: number
  appointments: number
  customers: number
  utilizationRate: number
}

export default function MultiLocationAnalytics() {
  const [locations, setLocations] = useState<LocationMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'appointments' | 'utilization'>('revenue')
  
  // Mock business data
  const businessTier = 'business' as const
  const businessId = '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
  const business = {
    id: businessId,
    name: 'Beauty Chain Enterprise',
    subscription_tier: businessTier
  }

  useEffect(() => {
    loadLocationData()
  }, [businessId, dateRange])

  const loadLocationData = async () => {
    setIsLoading(true)
    try {
      // Mock multi-location data - in production this would fetch from API
      const mockLocationData: LocationMetrics[] = [
        {
          locationId: 'loc-1',
          locationName: 'Downtown Beauty Studio',
          address: '123 Main St, Downtown',
          revenue: 45600,
          appointments: 285,
          customers: 195,
          utilizationRate: 87,
          averageTicket: 160,
          trend: 'up',
          trendPercentage: 12,
          staffCount: 4,
          topService: 'Gel Manicure',
          monthlyRevenue: [38000, 42000, 45600, 48000, 51000, 47000],
          monthlyAppointments: [240, 265, 285, 295, 310, 290]
        },
        {
          locationId: 'loc-2', 
          locationName: 'Westside Wellness Spa',
          address: '456 Oak Ave, Westside',
          revenue: 38200,
          appointments: 218,
          customers: 156,
          utilizationRate: 74,
          averageTicket: 175,
          trend: 'up',
          trendPercentage: 8,
          staffCount: 3,
          topService: 'Spa Pedicure',
          monthlyRevenue: [32000, 35000, 38200, 40000, 42000, 39000],
          monthlyAppointments: [185, 205, 218, 230, 240, 225]
        },
        {
          locationId: 'loc-3',
          locationName: 'Northgate Nail Boutique',
          address: '789 Pine Rd, Northgate',
          revenue: 29800,
          appointments: 198,
          customers: 142,
          utilizationRate: 68,
          averageTicket: 150,
          trend: 'down',
          trendPercentage: -3,
          staffCount: 3,
          topService: 'French Manicure',
          monthlyRevenue: [31000, 30500, 29800, 28500, 27000, 29000],
          monthlyAppointments: [210, 205, 198, 190, 180, 195]
        }
      ]
      
      setLocations(mockLocationData)
    } catch (error) {
      console.error('Failed to load location data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalMetrics = () => {
    return {
      totalRevenue: locations.reduce((sum, loc) => sum + loc.revenue, 0),
      totalAppointments: locations.reduce((sum, loc) => sum + loc.appointments, 0),
      totalCustomers: locations.reduce((sum, loc) => sum + loc.customers, 0),
      avgUtilization: locations.length > 0 
        ? locations.reduce((sum, loc) => sum + loc.utilizationRate, 0) / locations.length 
        : 0,
      totalStaff: locations.reduce((sum, loc) => sum + loc.staffCount, 0)
    }
  }

  const getComparisonData = (): ComparisonData[] => {
    return locations.map(loc => ({
      location: loc.locationName.split(' ')[0], // Short name for charts
      revenue: loc.revenue,
      appointments: loc.appointments,
      customers: loc.customers,
      utilizationRate: loc.utilizationRate
    }))
  }

  const getBestPerformer = () => {
    return locations.reduce((best, current) => 
      current.revenue > best.revenue ? current : best, locations[0]
    )
  }

  const getWorstPerformer = () => {
    return locations.reduce((worst, current) => 
      current.utilizationRate < worst.utilizationRate ? current : worst, locations[0]
    )
  }

  const totalMetrics = getTotalMetrics()
  const comparisonData = getComparisonData()
  const bestPerformer = getBestPerformer()
  const worstPerformer = getWorstPerformer()

  if (isLoading) {
    return (
      <Layout business={business}>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BuildingOffice2Icon className="h-8 w-8 mr-3 text-purple-600" />
                Multi-Location Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                Compare performance across all your business locations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Total Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">${totalMetrics.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-700">{locations.length} locations</p>
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
                <p className="text-2xl font-bold text-blue-900">{totalMetrics.totalAppointments}</p>
                <p className="text-sm text-blue-700">Across all locations</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Customers</p>
                <p className="text-2xl font-bold text-purple-900">{totalMetrics.totalCustomers}</p>
                <p className="text-sm text-purple-700">Unique customers</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Avg Utilization</p>
                <p className="text-2xl font-bold text-orange-900">{totalMetrics.avgUtilization.toFixed(1)}%</p>
                <p className="text-sm text-orange-700">{totalMetrics.totalStaff} total staff</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Location Comparison Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Location Performance Comparison</h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Compare by:</label>
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="revenue">Revenue</option>
                <option value="appointments">Appointments</option>
                <option value="utilization">Utilization Rate</option>
              </select>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis 
                  tickFormatter={(value) => 
                    selectedMetric === 'revenue' ? `$${value.toLocaleString()}` :
                    selectedMetric === 'utilization' ? `${value}%` :
                    value.toString()
                  }
                />
                <Tooltip 
                  formatter={(value: any) => [
                    selectedMetric === 'revenue' ? `$${value.toLocaleString()}` :
                    selectedMetric === 'utilization' ? `${value}%` :
                    value.toString(),
                    selectedMetric === 'revenue' ? 'Revenue' :
                    selectedMetric === 'appointments' ? 'Appointments' :
                    'Utilization Rate'
                  ]}
                />
                <Bar 
                  dataKey={selectedMetric} 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Location Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {locations.map((location) => (
            <div key={location.locationId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-500" />
                      {location.locationName}
                    </h3>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {location.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    ) : location.trend === 'down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className={`text-sm font-medium ${
                      location.trend === 'up' ? 'text-green-600' :
                      location.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {location.trendPercentage > 0 ? '+' : ''}{location.trendPercentage}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="text-xl font-bold text-green-600">${location.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Appointments</p>
                      <p className="text-xl font-bold text-blue-600">{location.appointments}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-lg font-semibold">{location.customers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Ticket</p>
                      <p className="text-lg font-semibold">${location.averageTicket}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className="text-sm font-medium">{location.utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          location.utilizationRate >= 80 ? 'bg-green-500' :
                          location.utilizationRate >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${location.utilizationRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-600">Top Service</p>
                    <p className="font-medium text-gray-900">{location.topService}</p>
                    <p className="text-xs text-gray-500">{location.staffCount} staff members</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Location Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <TrophyIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Top Performer</h4>
                    <p className="text-sm text-green-800">{bestPerformer?.locationName}</p>
                    <p className="text-sm text-green-700">
                      ${bestPerformer?.revenue.toLocaleString()} revenue with {bestPerformer?.utilizationRate}% utilization
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ChartBarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Growth Opportunity</h4>
                    <p className="text-sm text-blue-800">Average utilization could improve</p>
                    <p className="text-sm text-blue-700">
                      Current: {totalMetrics.avgUtilization.toFixed(1)}% | Target: 85%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Needs Attention</h4>
                    <p className="text-sm text-yellow-800">{worstPerformer?.locationName}</p>
                    <p className="text-sm text-yellow-700">
                      {worstPerformer?.utilizationRate}% utilization - consider staff training or marketing boost
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <BuildingOffice2Icon className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Network Performance</h4>
                    <p className="text-sm text-purple-800">Strong multi-location presence</p>
                    <p className="text-sm text-purple-700">
                      ${(totalMetrics.totalRevenue / locations.length).toLocaleString()} average per location
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}