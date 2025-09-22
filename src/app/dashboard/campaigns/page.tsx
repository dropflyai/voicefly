"use client"

import { useState, useEffect } from 'react'
import {
  Target, Plus, Play, Pause, Square, BarChart3, Users,
  Phone, Mail, MessageSquare, Calendar, TrendingUp,
  Clock, DollarSign, Edit, Trash2, Eye, Settings
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { LineChartComponent, BarChartComponent } from '@/components/Charts'
import { BusinessAPI, Campaign } from '@/lib/supabase'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const businessId = 'demo-business-id'
        const campaignsData = await BusinessAPI.getCampaigns(businessId)
        setCampaigns(campaignsData || [])
      } catch (error) {
        console.error('Error loading campaigns:', error)
        // Set demo data as fallback
        setCampaigns([
          {
            id: '1',
            business_id: 'demo-business-id',
            name: 'Enterprise Software Outreach',
            type: 'voice_ai',
            status: 'active',
            target_audience: 'Enterprise software companies with 100+ employees',
            message_template: 'Hi, this is Maya from VoiceFly. We help enterprise software companies automate their customer outreach...',
            schedule: {
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              days_of_week: [1, 2, 3, 4, 5],
              time_slots: ['09:00-12:00', '14:00-17:00']
            },
            total_leads: 500,
            contacted_leads: 247,
            qualified_leads: 89,
            conversion_rate: 18.2,
            total_revenue: 145200,
            cost_per_lead: 12.50,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            business_id: 'demo-business-id',
            name: 'Healthcare Technology Follow-up',
            type: 'email',
            status: 'paused',
            target_audience: 'Healthcare technology decision makers',
            message_template: 'Following up on our previous conversation about voice AI solutions for healthcare...',
            schedule: {
              start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
              days_of_week: [1, 2, 3, 4, 5],
              time_slots: ['08:00-18:00']
            },
            total_leads: 300,
            contacted_leads: 156,
            qualified_leads: 45,
            conversion_rate: 15.0,
            total_revenue: 89500,
            cost_per_lead: 8.75,
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'voice_ai': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const campaignTableData = campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    total_leads: campaign.total_leads,
    contacted: campaign.contacted_leads,
    qualified: campaign.qualified_leads,
    conversion_rate: `${campaign.conversion_rate}%`,
    revenue: `$${(campaign.total_revenue / 100).toLocaleString()}`,
    cost_per_lead: `$${campaign.cost_per_lead}`,
    created_at: new Date(campaign.created_at).toLocaleDateString()
  }))

  const columns = [
    { key: 'name', label: 'Campaign Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'total_leads', label: 'Total Leads', sortable: true },
    { key: 'contacted', label: 'Contacted', sortable: true },
    { key: 'qualified', label: 'Qualified', sortable: true },
    { key: 'conversion_rate', label: 'Conversion', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true },
    { key: 'cost_per_lead', label: 'Cost/Lead', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true }
  ]

  const campaignStats = [
    {
      title: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'active').length.toString(),
      change: '+2 this week',
      changeType: 'positive' as const,
      icon: Target
    },
    {
      title: 'Total Leads Contacted',
      value: campaigns.reduce((sum, c) => sum + c.contacted_leads, 0).toLocaleString(),
      change: '+15.2%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Avg Conversion Rate',
      value: `${(campaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / campaigns.length || 0).toFixed(1)}%`,
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: 'Total Revenue',
      value: `$${(campaigns.reduce((sum, c) => sum + c.total_revenue, 0) / 100).toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign
    }
  ]

  // Performance data for charts
  const performanceData = [
    { name: 'Week 1', contacts: 120, qualified: 24, revenue: 12000 },
    { name: 'Week 2', contacts: 156, qualified: 31, revenue: 15600 },
    { name: 'Week 3', contacts: 189, qualified: 38, revenue: 19200 },
    { name: 'Week 4', contacts: 247, qualified: 49, revenue: 24500 }
  ]

  const campaignTypeData = [
    { name: 'Voice AI', value: 45, contacts: 1247 },
    { name: 'Email', value: 35, contacts: 890 },
    { name: 'SMS', value: 20, contacts: 567 }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage voice AI, email, and SMS campaigns</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {campaignStats.map((stat, index) => {
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

      {/* Campaign Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Last 4 weeks</option>
              <option>Last 3 months</option>
              <option>This year</option>
            </select>
          </div>
          <LineChartComponent data={performanceData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Types</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View breakdown</button>
          </div>
          <BarChartComponent data={campaignTypeData} height={300} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Voice AI Campaign</h3>
              <p className="text-sm text-gray-600">Maya AI outreach calls</p>
            </div>
          </div>
        </button>
        <button className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Email Campaign</h3>
              <p className="text-sm text-gray-600">Automated email sequences</p>
            </div>
          </div>
        </button>
        <button className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left hover:bg-purple-100 transition-colors">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">SMS Campaign</h3>
              <p className="text-sm text-gray-600">Text message outreach</p>
            </div>
          </div>
        </button>
        <button className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left hover:bg-orange-100 transition-colors">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Multi-Channel</h3>
              <p className="text-sm text-gray-600">Combined approach</p>
            </div>
          </div>
        </button>
      </div>

      {/* Campaign Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Controls</h3>
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
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bulk Settings
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <DataTable
        title="All Campaigns"
        columns={columns}
        data={campaignTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}