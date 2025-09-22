"use client"

import { useState, useEffect } from 'react'
import {
  Workflow, Plus, Play, Pause, Square, Settings, BarChart3,
  Zap, Clock, Users, Target, CheckCircle, AlertCircle,
  ArrowRight, Edit, Trash2, Copy, TrendingUp, Activity
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { LineChartComponent, BarChartComponent } from '@/components/Charts'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  name: string
  config: any
  position: { x: number; y: number }
}

interface AutomationWorkflow {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft' | 'error'
  trigger_type: 'lead_created' | 'call_completed' | 'email_opened' | 'appointment_booked' | 'payment_received' | 'time_based'
  total_runs: number
  successful_runs: number
  failed_runs: number
  success_rate: number
  avg_execution_time: number
  last_run: string
  created_at: string
  updated_at: string
  steps: WorkflowStep[]
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        // Demo workflow data
        setWorkflows([
          {
            id: '1',
            name: 'New Lead Qualification',
            description: 'Automatically qualify and route new leads based on criteria',
            status: 'active',
            trigger_type: 'lead_created',
            total_runs: 1247,
            successful_runs: 1189,
            failed_runs: 58,
            success_rate: 95.3,
            avg_execution_time: 2.4,
            last_run: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            steps: []
          },
          {
            id: '2',
            name: 'Voice AI Follow-up Sequence',
            description: 'Automated voice call follow-ups for qualified leads',
            status: 'active',
            trigger_type: 'call_completed',
            total_runs: 856,
            successful_runs: 789,
            failed_runs: 67,
            success_rate: 92.2,
            avg_execution_time: 45.6,
            last_run: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            steps: []
          },
          {
            id: '3',
            name: 'Appointment Reminder System',
            description: 'Send automated reminders via email, SMS, and voice calls',
            status: 'active',
            trigger_type: 'appointment_booked',
            total_runs: 2341,
            successful_runs: 2298,
            failed_runs: 43,
            success_rate: 98.2,
            avg_execution_time: 1.8,
            last_run: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            steps: []
          },
          {
            id: '4',
            name: 'Payment Processing & Receipt',
            description: 'Process payments and send receipts with loyalty points',
            status: 'active',
            trigger_type: 'payment_received',
            total_runs: 1567,
            successful_runs: 1544,
            failed_runs: 23,
            success_rate: 98.5,
            avg_execution_time: 3.2,
            last_run: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            steps: []
          },
          {
            id: '5',
            name: 'Lead Nurturing Campaign',
            description: 'Multi-channel nurturing sequence for cold leads',
            status: 'paused',
            trigger_type: 'time_based',
            total_runs: 445,
            successful_runs: 401,
            failed_runs: 44,
            success_rate: 90.1,
            avg_execution_time: 12.5,
            last_run: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            steps: []
          }
        ])
      } catch (error) {
        console.error('Error loading workflows:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflows()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'lead_created': return <Users className="h-4 w-4" />
      case 'call_completed': return <Activity className="h-4 w-4" />
      case 'email_opened': return <CheckCircle className="h-4 w-4" />
      case 'appointment_booked': return <Target className="h-4 w-4" />
      case 'payment_received': return <CheckCircle className="h-4 w-4" />
      case 'time_based': return <Clock className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const workflowTableData = workflows.map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    trigger_type: workflow.trigger_type,
    status: workflow.status,
    total_runs: workflow.total_runs,
    success_rate: `${workflow.success_rate}%`,
    avg_execution_time: `${workflow.avg_execution_time}s`,
    last_run: workflow.last_run ? new Date(workflow.last_run).toLocaleString() : 'Never',
    created_at: new Date(workflow.created_at).toLocaleDateString()
  }))

  const columns = [
    { key: 'name', label: 'Workflow Name', sortable: true },
    { key: 'trigger_type', label: 'Trigger', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'total_runs', label: 'Total Runs', sortable: true },
    { key: 'success_rate', label: 'Success Rate', sortable: true },
    { key: 'avg_execution_time', label: 'Avg Time', sortable: true },
    { key: 'last_run', label: 'Last Run', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true }
  ]

  const workflowStats = [
    {
      title: 'Active Workflows',
      value: workflows.filter(w => w.status === 'active').length.toString(),
      change: '+3 this month',
      changeType: 'positive' as const,
      icon: Workflow
    },
    {
      title: 'Total Executions',
      value: workflows.reduce((sum, w) => sum + w.total_runs, 0).toLocaleString(),
      change: '+24.3%',
      changeType: 'positive' as const,
      icon: Activity
    },
    {
      title: 'Avg Success Rate',
      value: `${(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length || 0).toFixed(1)}%`,
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: CheckCircle
    },
    {
      title: 'Time Saved',
      value: '284 hrs',
      change: '+15.8%',
      changeType: 'positive' as const,
      icon: Clock
    }
  ]

  // Chart data
  const executionData = [
    { name: 'Week 1', successful: 456, failed: 12, total: 468 },
    { name: 'Week 2', successful: 578, failed: 18, total: 596 },
    { name: 'Week 3', successful: 689, failed: 15, total: 704 },
    { name: 'Week 4', successful: 734, failed: 21, total: 755 }
  ]

  const triggerTypeData = [
    { name: 'Lead Created', value: 1247, success_rate: 95.3 },
    { name: 'Call Completed', value: 856, success_rate: 92.2 },
    { name: 'Appointment Booked', value: 2341, success_rate: 98.2 },
    { name: 'Payment Received', value: 1567, success_rate: 98.5 },
    { name: 'Time Based', value: 445, success_rate: 90.1 }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Workflows</h1>
          <p className="mt-1 text-sm text-gray-600">Design and manage automated business processes</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowStats.map((stat, index) => {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Execution Trends</h3>
          <LineChartComponent data={executionData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Type Performance</h3>
          <BarChartComponent data={triggerTypeData} height={300} />
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Lead Qualification</h4>
                <p className="text-sm text-gray-600">Auto-qualify new leads</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Activity className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Voice AI Follow-up</h4>
                <p className="text-sm text-gray-600">Automated call sequences</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Appointment Reminders</h4>
                <p className="text-sm text-gray-600">Multi-channel reminders</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Payment Processing</h4>
                <p className="text-sm text-gray-600">Auto-process & receipt</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Clock className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Lead Nurturing</h4>
                <p className="text-sm text-gray-600">Time-based sequences</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Zap className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Custom Workflow</h4>
                <p className="text-sm text-gray-600">Build from scratch</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <span>Create New</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </button>
        </div>
      </div>

      {/* Workflow Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Selected
          </button>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 flex items-center gap-2">
            <Pause className="h-4 w-4" />
            Pause Selected
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
            <Square className="h-4 w-4" />
            Stop Selected
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Duplicate Selected
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bulk Settings
          </button>
        </div>
      </div>

      {/* Active Workflow Monitor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Execution Monitor</h3>
        <div className="space-y-3">
          {workflows.filter(w => w.status === 'active').slice(0, 3).map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getTriggerIcon(workflow.trigger_type)}
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{workflow.name}</p>
                  <p className="text-sm text-gray-600">Last run: {workflow.last_run ? new Date(workflow.last_run).toLocaleTimeString() : 'Never'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(workflow.status)}`}>
                  {workflow.status}
                </span>
                <span className="text-sm text-gray-600">{workflow.success_rate}% success</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${workflow.success_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows Table */}
      <DataTable
        title="All Workflows"
        columns={columns}
        data={workflowTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}