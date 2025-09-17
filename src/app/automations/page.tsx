"use client"

import { useState, useEffect } from 'react'
import {
  Zap, Plus, Settings, BarChart3, Clock, Target,
  Mail, MessageSquare, Phone, Users, TrendingUp,
  Activity, CheckCircle, AlertCircle, XCircle,
  Play, Pause, Edit, Trash2, Copy, RefreshCw
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { LineChartComponent, PieChartComponent } from '@/components/Charts'

interface Automation {
  id: string
  name: string
  type: 'email_sequence' | 'sms_campaign' | 'voice_follow_up' | 'lead_scoring' | 'appointment_booking' | 'payment_reminder'
  status: 'active' | 'paused' | 'draft' | 'completed'
  trigger_condition: string
  target_audience: string
  total_executions: number
  successful_executions: number
  open_rate?: number
  click_rate?: number
  conversion_rate: number
  revenue_generated: number
  last_execution: string
  next_execution?: string
  created_at: string
  updated_at: string
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadAutomations = async () => {
      try {
        // Demo automation data
        setAutomations([
          {
            id: '1',
            name: 'Welcome Email Series',
            type: 'email_sequence',
            status: 'active',
            trigger_condition: 'New lead created',
            target_audience: 'All new leads',
            total_executions: 1456,
            successful_executions: 1398,
            open_rate: 68.5,
            click_rate: 24.3,
            conversion_rate: 18.7,
            revenue_generated: 89500,
            last_execution: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            next_execution: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Voice AI Follow-up Calls',
            type: 'voice_follow_up',
            status: 'active',
            trigger_condition: 'Lead qualification score > 70',
            target_audience: 'Qualified leads',
            total_executions: 892,
            successful_executions: 823,
            conversion_rate: 32.4,
            revenue_generated: 156700,
            last_execution: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            next_execution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'SMS Appointment Reminders',
            type: 'sms_campaign',
            status: 'active',
            trigger_condition: '24 hours before appointment',
            target_audience: 'Scheduled customers',
            total_executions: 2341,
            successful_executions: 2298,
            open_rate: 98.2,
            conversion_rate: 15.6,
            revenue_generated: 45200,
            last_execution: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            next_execution: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Dynamic Lead Scoring',
            type: 'lead_scoring',
            status: 'active',
            trigger_condition: 'Lead activity detected',
            target_audience: 'All active leads',
            total_executions: 5678,
            successful_executions: 5634,
            conversion_rate: 28.9,
            revenue_generated: 234500,
            last_execution: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            next_execution: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Auto Booking Assistant',
            type: 'appointment_booking',
            status: 'active',
            trigger_condition: 'Lead requests appointment',
            target_audience: 'Interested prospects',
            total_executions: 1234,
            successful_executions: 1189,
            conversion_rate: 76.4,
            revenue_generated: 345600,
            last_execution: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            next_execution: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '6',
            name: 'Payment Recovery Campaign',
            type: 'payment_reminder',
            status: 'paused',
            trigger_condition: 'Overdue payment',
            target_audience: 'Customers with outstanding payments',
            total_executions: 234,
            successful_executions: 198,
            open_rate: 85.2,
            click_rate: 45.6,
            conversion_rate: 42.3,
            revenue_generated: 67800,
            last_execution: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      } catch (error) {
        console.error('Error loading automations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAutomations()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email_sequence': return <Mail className="h-4 w-4" />
      case 'sms_campaign': return <MessageSquare className="h-4 w-4" />
      case 'voice_follow_up': return <Phone className="h-4 w-4" />
      case 'lead_scoring': return <Target className="h-4 w-4" />
      case 'appointment_booking': return <CheckCircle className="h-4 w-4" />
      case 'payment_reminder': return <AlertCircle className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const automationTableData = automations.map(automation => ({
    id: automation.id,
    name: automation.name,
    type: automation.type,
    status: automation.status,
    total_executions: automation.total_executions,
    success_rate: `${((automation.successful_executions / automation.total_executions) * 100).toFixed(1)}%`,
    conversion_rate: `${automation.conversion_rate}%`,
    revenue: `$${(automation.revenue_generated / 100).toLocaleString()}`,
    last_execution: automation.last_execution ? new Date(automation.last_execution).toLocaleString() : 'Never',
    next_execution: automation.next_execution ? new Date(automation.next_execution).toLocaleString() : 'Not scheduled'
  }))

  const columns = [
    { key: 'name', label: 'Automation Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'total_executions', label: 'Executions', sortable: true },
    { key: 'success_rate', label: 'Success Rate', sortable: true },
    { key: 'conversion_rate', label: 'Conversion', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true },
    { key: 'last_execution', label: 'Last Run', sortable: true },
    { key: 'next_execution', label: 'Next Run', sortable: true }
  ]

  const automationStats = [
    {
      title: 'Active Automations',
      value: automations.filter(a => a.status === 'active').length.toString(),
      change: '+2 this week',
      changeType: 'positive' as const,
      icon: Zap
    },
    {
      title: 'Total Executions',
      value: automations.reduce((sum, a) => sum + a.total_executions, 0).toLocaleString(),
      change: '+18.5%',
      changeType: 'positive' as const,
      icon: Activity
    },
    {
      title: 'Avg Success Rate',
      value: `${(automations.reduce((sum, a) => sum + ((a.successful_executions / a.total_executions) * 100), 0) / automations.length || 0).toFixed(1)}%`,
      change: '+2.3%',
      changeType: 'positive' as const,
      icon: CheckCircle
    },
    {
      title: 'Revenue Generated',
      value: `$${(automations.reduce((sum, a) => sum + a.revenue_generated, 0) / 100).toLocaleString()}`,
      change: '+24.7%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ]

  // Chart data
  const performanceData = [
    { name: 'Week 1', executions: 1234, successful: 1189, revenue: 45600 },
    { name: 'Week 2', executions: 1456, successful: 1398, revenue: 52300 },
    { name: 'Week 3', executions: 1678, successful: 1601, revenue: 58900 },
    { name: 'Week 4', executions: 1892, successful: 1823, revenue: 67400 }
  ]

  const typeDistribution = [
    { name: 'Email Sequences', value: 35, executions: 1456 },
    { name: 'Voice Follow-ups', value: 25, executions: 892 },
    { name: 'SMS Campaigns', value: 20, executions: 2341 },
    { name: 'Lead Scoring', value: 15, executions: 5678 },
    { name: 'Appointment Booking', value: 5, executions: 1234 }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Automations</h1>
          <p className="mt-1 text-sm text-gray-600">Intelligent automation for lead nurturing and conversion</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Automation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {automationStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-2 flex items-center ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Performance</h3>
          <LineChartComponent data={performanceData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Types</h3>
          <PieChartComponent data={typeDistribution} height={300} />
        </div>
      </div>

      {/* Automation Builder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Builder</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Email Sequence</h4>
            <p className="text-sm text-gray-600">Create automated email nurturing campaigns</p>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Voice Follow-up</h4>
            <p className="text-sm text-gray-600">AI-powered voice call sequences</p>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">SMS Campaign</h4>
            <p className="text-sm text-gray-600">Text message automation workflows</p>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Lead Scoring</h4>
            <p className="text-sm text-gray-600">Dynamic lead qualification automation</p>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Booking Assistant</h4>
            <p className="text-sm text-gray-600">Automated appointment scheduling</p>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">Custom Automation</h4>
            <p className="text-sm text-gray-600">Build your own automation flow</p>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search automations..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="email_sequence">Email Sequence</option>
              <option value="sms_campaign">SMS Campaign</option>
              <option value="voice_follow_up">Voice Follow-up</option>
              <option value="lead_scoring">Lead Scoring</option>
              <option value="appointment_booking">Appointment Booking</option>
              <option value="payment_reminder">Payment Reminder</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Controls</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Selected
          </button>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 flex items-center gap-2">
            <Pause className="h-4 w-4" />
            Pause Selected
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restart Selected
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Duplicate Selected
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bulk Settings
          </button>
        </div>
      </div>

      {/* Live Automation Monitor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Execution Monitor</h3>
        <div className="space-y-3">
          {automations.filter(a => a.status === 'active').slice(0, 4).map((automation) => (
            <div key={automation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getTypeIcon(automation.type)}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{automation.name}</p>
                  <p className="text-sm text-gray-600">
                    Last: {automation.last_execution ? new Date(automation.last_execution).toLocaleTimeString() : 'Never'} |
                    Next: {automation.next_execution ? new Date(automation.next_execution).toLocaleTimeString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(automation.status)}`}>
                  {automation.status}
                </span>
                <span className="text-sm text-gray-600">{automation.conversion_rate}% conv</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${automation.conversion_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automations Table */}
      <DataTable
        title="All Automations"
        columns={columns}
        data={automationTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}