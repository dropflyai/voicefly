"use client"

import { useState, useEffect } from 'react'
import {
  Phone, TrendingUp, Clock, DollarSign, Users, Calendar,
  Target, Activity, Filter, Download, RefreshCw, Plus,
  Mic, Database, UserCheck, Bot, MessageSquare
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { LineChartComponent, BarChartComponent, PieChartComponent, AreaChartComponent } from '@/components/Charts'
import { BusinessAPI, DashboardStats, RevenueData } from '@/lib/supabase'

export default function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    activeCustomers: 0,
    totalCalls: 0,
    qualifiedLeads: 0,
    campaignSuccess: 0
  })
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Use demo business ID for now - in production this would come from auth
        const businessId = 'demo-business-id'

        const [stats, revenue] = await Promise.all([
          BusinessAPI.getDashboardStats(businessId),
          BusinessAPI.getRevenueData(businessId)
        ])

        setDashboardStats(stats)
        setRevenueData(revenue)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set fallback data
        setRevenueData([
          { month: 'Jan', revenue: 45000, appointments: 120, calls: 350, leads: 78 },
          { month: 'Feb', revenue: 52000, appointments: 142, calls: 420, leads: 89 },
          { month: 'Mar', revenue: 61000, appointments: 168, calls: 485, leads: 102 },
          { month: 'Apr', revenue: 58000, appointments: 155, calls: 462, leads: 94 },
          { month: 'May', revenue: 72000, appointments: 198, calls: 567, leads: 125 },
          { month: 'Jun', revenue: 89000, appointments: 245, calls: 678, leads: 156 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const campaignPerformance = [
    { name: 'Enterprise', value: 247, value2: 178 },
    { name: 'SaaS', value: 89, value2: 72 },
    { name: 'Healthcare', value: 156, value2: 101 },
    { name: 'Finance', value: 203, value2: 165 },
    { name: 'Retail', value: 145, value2: 98 },
  ]

  const sentimentData = [
    { name: 'Positive', value: 62 },
    { name: 'Neutral', value: 28 },
    { name: 'Negative', value: 10 },
  ]

  const callVolumeData = [
    { name: '00:00', value: 12, value2: 8 },
    { name: '04:00', value: 8, value2: 5 },
    { name: '08:00', value: 45, value2: 32 },
    { name: '12:00', value: 78, value2: 65 },
    { name: '16:00', value: 92, value2: 84 },
    { name: '20:00', value: 35, value2: 28 },
  ]

  // Sample data for table
  const campaignTableData = [
    {
      id: 'CAM-001',
      name: 'Enterprise Software Outreach',
      status: 'Active',
      leads: 247,
      completed: 124,
      success: '72%',
      revenue: '$45,200',
      lastCall: '2 min ago'
    },
    {
      id: 'CAM-002',
      name: 'SaaS Startup Outreach',
      status: 'Active',
      leads: 89,
      completed: 56,
      success: '81%',
      revenue: '$28,400',
      lastCall: '15 min ago'
    },
    {
      id: 'CAM-003',
      name: 'Healthcare Technology',
      status: 'Paused',
      leads: 156,
      completed: 93,
      success: '65%',
      revenue: '$52,100',
      lastCall: '1 hour ago'
    },
    {
      id: 'CAM-004',
      name: 'Financial Services',
      status: 'Active',
      leads: 203,
      completed: 165,
      success: '78%',
      revenue: '$91,300',
      lastCall: '5 min ago'
    },
    {
      id: 'CAM-005',
      name: 'Retail Tech Solutions',
      status: 'Scheduled',
      leads: 145,
      completed: 0,
      success: 'N/A',
      revenue: '$0',
      lastCall: 'Not started'
    },
  ]

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Campaign Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'leads', label: 'Total Leads', sortable: true },
    { key: 'completed', label: 'Calls Made', sortable: true },
    { key: 'success', label: 'Success Rate', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true },
    { key: 'lastCall', label: 'Last Activity', sortable: false },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Real-time overview of your voice AI performance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${(dashboardStats.monthlyRevenue / 100).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5% from last month
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Voice AI Calls</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats.totalCalls?.toLocaleString() || '4,827'}
              </p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.3% from last week
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats.qualifiedLeads?.toLocaleString() || '1,247'}
              </p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15.2% this month
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats.campaignSuccess || 73.8}%
              </p>
              <p className="text-sm text-gray-600 mt-2 flex items-center">
                <Bot className="h-4 w-4 mr-1" />
                Maya AI Agent
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Bot className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
          </div>
          <AreaChartComponent data={revenueData} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <BarChartComponent data={campaignPerformance} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
          <PieChartComponent data={sentimentData} height={250} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Call Volume by Hour</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Today</button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">This Week</button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">This Month</button>
            </div>
          </div>
          <LineChartComponent data={callVolumeData} height={250} />
        </div>
      </div>

      {/* Campaign Table */}
      <DataTable
        title="Active Campaigns"
        columns={columns}
        data={campaignTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <h4 className="text-sm font-medium opacity-90">Avg Call Duration</h4>
          <p className="text-2xl font-bold mt-2">3:42</p>
          <p className="text-sm opacity-75 mt-1">-18 sec from average</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <h4 className="text-sm font-medium opacity-90">Appointments Booked</h4>
          <p className="text-2xl font-bold mt-2">284</p>
          <p className="text-sm opacity-75 mt-1">This week</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <h4 className="text-sm font-medium opacity-90">Lead Quality Score</h4>
          <p className="text-2xl font-bold mt-2">8.4/10</p>
          <p className="text-sm opacity-75 mt-1">Above target</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <h4 className="text-sm font-medium opacity-90">Cost per Call</h4>
          <p className="text-2xl font-bold mt-2">$0.42</p>
          <p className="text-sm opacity-75 mt-1">92% cheaper than human</p>
        </div>
      </div>
    </div>
  )
}