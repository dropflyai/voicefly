'use client'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart 
} from 'recharts'

// Mock data for charts
const revenueData = [
  { month: 'Jul', revenue: 12400, appointments: 156 },
  { month: 'Aug', revenue: 13200, appointments: 165 },
  { month: 'Sep', revenue: 15800, appointments: 198 },
  { month: 'Oct', revenue: 14500, appointments: 181 },
  { month: 'Nov', revenue: 16200, appointments: 203 },
  { month: 'Dec', revenue: 18900, appointments: 237 },
  { month: 'Jan', revenue: 19500, appointments: 244 }
]

const servicePopularity = [
  { name: 'Gel Manicure', value: 35, color: '#3B82F6' },
  { name: 'Spa Pedicure', value: 28, color: '#EC4899' },
  { name: 'Signature Manicure', value: 20, color: '#10B981' },
  { name: 'Nail Art', value: 12, color: '#F59E0B' },
  { name: 'Express Manicure', value: 5, color: '#8B5CF6' }
]

const weeklyPerformance = [
  { day: 'Mon', appointments: 28, revenue: 1450 },
  { day: 'Tue', appointments: 32, revenue: 1680 },
  { day: 'Wed', appointments: 35, revenue: 1820 },
  { day: 'Thu', appointments: 38, revenue: 1950 },
  { day: 'Fri', appointments: 42, revenue: 2180 },
  { day: 'Sat', appointments: 45, revenue: 2340 },
  { day: 'Sun', appointments: 18, revenue: 920 }
]

const staffPerformance = [
  { name: 'Maya', appointments: 89, revenue: 4650, rating: 4.9 },
  { name: 'Sarah', appointments: 76, revenue: 4120, rating: 4.8 },
  { name: 'Jessica', appointments: 64, revenue: 3480, rating: 4.7 }
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Calculate metrics
  const totalRevenue = 19500
  const revenueGrowth = 12.5
  const totalAppointments = 244
  const appointmentGrowth = 8.2
  const avgTicket = totalRevenue / totalAppointments
  const ticketGrowth = 3.8
  const customerRetention = 78.5

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <Layout business={{ name: 'Bella Nails & Spa', subscription_tier: 'professional' }}>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">
              Track your business performance and insights
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              className="input-field"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalRevenue)}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        {revenueGrowth}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-brand-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Appointments
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {totalAppointments}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        {appointmentGrowth}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-beauty-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Ticket
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(avgTicket)}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        {ticketGrowth}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Retention Rate
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {customerRetention}%
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                        2.1%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Appointments Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="appointments" fill="#EC4899" name="Appointments" />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Popularity */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Popularity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={servicePopularity}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {servicePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="card mb-8">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="appointments" fill="#3B82F6" name="Appointments" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10B981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Staff Performance</h3>
            <div className="space-y-6">
              {staffPerformance.map((staff, index) => (
                <div key={staff.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gradient-to-br from-beauty-400 to-brand-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {staff.name[0]}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{staff.name}</h4>
                      <div className="flex items-center mt-1">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-600">{staff.rating} rating</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{staff.appointments}</div>
                      <div className="text-sm text-gray-500">Appointments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(staff.revenue)}</div>
                      <div className="text-sm text-gray-500">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600">{formatCurrency(staff.revenue / staff.appointments)}</div>
                      <div className="text-sm text-gray-500">Avg. Ticket</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Peak Hours</h4>
                  <p className="text-sm text-gray-600">Most appointments between</p>
                  <p className="text-2xl font-bold text-blue-600">2-4 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Busiest Day</h4>
                  <p className="text-sm text-gray-600">Highest booking volume on</p>
                  <p className="text-2xl font-bold text-green-600">Saturday</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">New Customers</h4>
                  <p className="text-sm text-gray-600">This month</p>
                  <p className="text-2xl font-bold text-purple-600">47</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}