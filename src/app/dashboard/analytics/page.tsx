"use client"

import { useState, useEffect } from 'react'
import { BarChart, LineChart, PieChart, TrendingUp, Users, Phone, Calendar, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState({
    callMetrics: {
      totalCalls: 1247,
      answeredCalls: 1089,
      missedCalls: 158,
      averageDuration: '4:32',
      conversionRate: 73.2
    },
    leadMetrics: {
      totalLeads: 892,
      qualifiedLeads: 654,
      convertedLeads: 234,
      leadSources: [
        { name: 'Google Ads', leads: 324, percentage: 36.3 },
        { name: 'Facebook', leads: 267, percentage: 30.0 },
        { name: 'Organic Search', leads: 156, percentage: 17.5 },
        { name: 'Referrals', leads: 145, percentage: 16.2 }
      ]
    },
    revenueMetrics: {
      monthlyRevenue: 89450,
      averageTicket: 382,
      revenueGrowth: 23.4
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your voice AI performance</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Calls</h3>
              <Phone className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.callMetrics.totalCalls.toLocaleString()}</p>
            <p className="text-green-600 text-sm flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5% from last month
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Qualified Leads</h3>
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.leadMetrics.qualifiedLeads.toLocaleString()}</p>
            <p className="text-green-600 text-sm flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.3% from last month
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.callMetrics.conversionRate}%</p>
            <p className="text-green-600 text-sm flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.1% from last month
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${analyticsData.revenueMetrics.monthlyRevenue.toLocaleString()}</p>
            <p className="text-green-600 text-sm flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +{analyticsData.revenueMetrics.revenueGrowth}% from last month
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Call Performance Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Call Performance</h3>
              <BarChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Answered Calls</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '87.3%'}}></div>
                  </div>
                  <span className="text-sm font-medium">{analyticsData.callMetrics.answeredCalls}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Missed Calls</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '12.7%'}}></div>
                  </div>
                  <span className="text-sm font-medium">{analyticsData.callMetrics.missedCalls}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Duration</span>
                  <span className="text-sm font-medium">{analyticsData.callMetrics.averageDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Sources Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {analyticsData.leadMetrics.leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">{source.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{source.leads}</span>
                    <span className="text-xs text-gray-500">({source.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Analytics Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Summer Promotion</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">324</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48.1%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$29,450</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Holiday Special</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">267</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">74.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$42,100</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">New Customer Outreach</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">57.1%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$17,900</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}