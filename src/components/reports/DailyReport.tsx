'use client'

import { useState } from 'react'
import { 
  DocumentArrowDownIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface ReportData {
  date: string
  summary: {
    totalAppointments: number
    completedAppointments: number
    totalRevenue: number
    newCustomers: number
    averageTicket: number
  }
  topServices: {
    name: string
    bookings: number
    revenue: number
  }[]
  staffPerformance: {
    name: string
    appointments: number
    revenue: number
    utilizationRate: number
  }[]
  insights: {
    type: 'opportunity' | 'warning' | 'success'
    title: string
    description: string
    action?: string
  }[]
}

interface DailyReportProps {
  businessId: string
  date?: string
}

export default function DailyReport({ businessId, date }: DailyReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0])

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          date: selectedDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      setReportData(data.report)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!reportData) return

    try {
      const response = await fetch(`/api/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData,
          format,
          filename: `daily-report-${selectedDate}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      const fileExtension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'json'
      a.download = `daily-report-${selectedDate}.${fileExtension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report. Please try again.')
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      case 'opportunity':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'opportunity':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-purple-600" />
              Daily Report Generator
            </h3>
            <p className="text-sm text-gray-600">Generate comprehensive daily business reports</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <>
          {/* Report Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Daily Business Report</h2>
                <p className="text-gray-600">{new Date(reportData.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => downloadReport('csv')}
                  className="flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => downloadReport('json')}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  JSON
                </button>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Appointments</p>
                    <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalAppointments}</p>
                  </div>
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{reportData.summary.completedAppointments}</p>
                  </div>
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Revenue</p>
                    <p className="text-2xl font-bold text-purple-900">${reportData.summary.totalRevenue.toLocaleString()}</p>
                  </div>
                  <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">New Customers</p>
                    <p className="text-2xl font-bold text-orange-900">{reportData.summary.newCustomers}</p>
                  </div>
                  <UserGroupIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Avg Ticket</p>
                    <p className="text-2xl font-bold text-gray-900">${reportData.summary.averageTicket.toFixed(0)}</p>
                  </div>
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Services & Staff Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
              <div className="space-y-3">
                {reportData.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${service.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
              <div className="space-y-3">
                {reportData.staffPerformance.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-sm text-gray-600">{staff.appointments} appointments • {staff.utilizationRate}% utilized</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${staff.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.insights.map((insight, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      {insight.action && (
                        <div className="bg-white px-3 py-1 rounded-md border border-gray-300 text-xs font-medium">
                          Action: {insight.action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}