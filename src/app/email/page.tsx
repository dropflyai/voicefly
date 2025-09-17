"use client"

import { useState, useEffect } from 'react'
import {
  Mail, Plus, Send, Users, TrendingUp, BarChart3,
  Edit, Trash2, Copy, Eye, Clock, Target, CheckCircle,
  XCircle, AlertCircle, Filter, Download, Settings,
  MousePointer, MessageSquare, Calendar
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { LineChartComponent, PieChartComponent, BarChartComponent } from '@/components/Charts'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  type: 'newsletter' | 'promotional' | 'follow_up' | 'welcome' | 'abandoned_cart' | 'survey'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  recipients_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  unsubscribed_count: number
  bounced_count: number
  open_rate: number
  click_rate: number
  unsubscribe_rate: number
  bounce_rate: number
  revenue_generated: number
  scheduled_at?: string
  sent_at?: string
  created_at: string
  updated_at: string
}

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        // Demo email campaign data
        setCampaigns([
          {
            id: '1',
            name: 'VoiceFly Product Launch',
            subject: 'Revolutionary Voice AI Technology is Here',
            type: 'promotional',
            status: 'sent',
            recipients_count: 12500,
            sent_count: 12500,
            delivered_count: 12234,
            opened_count: 8456,
            clicked_count: 2134,
            unsubscribed_count: 45,
            bounced_count: 266,
            open_rate: 69.1,
            click_rate: 25.2,
            unsubscribe_rate: 0.4,
            bounce_rate: 2.1,
            revenue_generated: 156780,
            sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            name: 'Weekly Newsletter - AI Insights',
            subject: 'This Week in Voice AI: Maya\'s Latest Updates',
            type: 'newsletter',
            status: 'sent',
            recipients_count: 8945,
            sent_count: 8945,
            delivered_count: 8823,
            opened_count: 5234,
            clicked_count: 1456,
            unsubscribed_count: 23,
            bounced_count: 122,
            open_rate: 59.3,
            click_rate: 27.8,
            unsubscribe_rate: 0.3,
            bounce_rate: 1.4,
            revenue_generated: 89400,
            sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            name: 'Welcome Series - Part 1',
            subject: 'Welcome to VoiceFly! Let\'s Get Started',
            type: 'welcome',
            status: 'sending',
            recipients_count: 1456,
            sent_count: 1234,
            delivered_count: 1198,
            opened_count: 789,
            clicked_count: 234,
            unsubscribed_count: 5,
            bounced_count: 36,
            open_rate: 65.9,
            click_rate: 29.7,
            unsubscribe_rate: 0.4,
            bounce_rate: 2.9,
            revenue_generated: 34500,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Follow-up: Demo Request',
            subject: 'Ready to See Maya in Action?',
            type: 'follow_up',
            status: 'scheduled',
            recipients_count: 567,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0,
            unsubscribed_count: 0,
            bounced_count: 0,
            open_rate: 0,
            click_rate: 0,
            unsubscribe_rate: 0,
            bounce_rate: 0,
            revenue_generated: 0,
            scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Customer Satisfaction Survey',
            subject: 'How Are We Doing? Quick 2-Minute Survey',
            type: 'survey',
            status: 'draft',
            recipients_count: 3456,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0,
            unsubscribed_count: 0,
            bounced_count: 0,
            open_rate: 0,
            click_rate: 0,
            unsubscribe_rate: 0,
            bounce_rate: 0,
            revenue_generated: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      } catch (error) {
        console.error('Error loading email campaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      paused: 'bg-red-100 text-red-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'newsletter': return <MessageSquare className="h-4 w-4" />
      case 'promotional': return <Target className="h-4 w-4" />
      case 'follow_up': return <Users className="h-4 w-4" />
      case 'welcome': return <CheckCircle className="h-4 w-4" />
      case 'abandoned_cart': return <AlertCircle className="h-4 w-4" />
      case 'survey': return <BarChart3 className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const campaignTableData = campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    type: campaign.type,
    status: campaign.status,
    recipients: campaign.recipients_count,
    open_rate: `${campaign.open_rate}%`,
    click_rate: `${campaign.click_rate}%`,
    revenue: `$${(campaign.revenue_generated / 100).toLocaleString()}`,
    sent_at: campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() :
             campaign.scheduled_at ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}` : 'Draft',
    created_at: new Date(campaign.created_at).toLocaleDateString()
  }))

  const columns = [
    { key: 'name', label: 'Campaign Name', sortable: true },
    { key: 'subject', label: 'Subject Line', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'recipients', label: 'Recipients', sortable: true },
    { key: 'open_rate', label: 'Open Rate', sortable: true },
    { key: 'click_rate', label: 'Click Rate', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true },
    { key: 'sent_at', label: 'Sent Date', sortable: true }
  ]

  const emailStats = [
    {
      title: 'Total Sent',
      value: campaigns.reduce((sum, c) => sum + c.sent_count, 0).toLocaleString(),
      change: '+18.2%',
      changeType: 'positive' as const,
      icon: Send
    },
    {
      title: 'Avg Open Rate',
      value: `${(campaigns.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.open_rate, 0) / campaigns.filter(c => c.sent_count > 0).length || 0).toFixed(1)}%`,
      change: '+3.4%',
      changeType: 'positive' as const,
      icon: Eye
    },
    {
      title: 'Avg Click Rate',
      value: `${(campaigns.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.click_rate, 0) / campaigns.filter(c => c.sent_count > 0).length || 0).toFixed(1)}%`,
      change: '+1.8%',
      changeType: 'positive' as const,
      icon: MousePointer
    },
    {
      title: 'Total Revenue',
      value: `$${(campaigns.reduce((sum, c) => sum + c.revenue_generated, 0) / 100).toLocaleString()}`,
      change: '+24.7%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ]

  // Chart data
  const performanceData = [
    { name: 'Week 1', sent: 8500, opened: 5100, clicked: 1360, revenue: 45600 },
    { name: 'Week 2', sent: 9200, opened: 5612, clicked: 1564, revenue: 52300 },
    { name: 'Week 3', sent: 7800, opened: 4836, clicked: 1289, revenue: 38900 },
    { name: 'Week 4', sent: 12500, opened: 8456, clicked: 2134, revenue: 67400 }
  ]

  const campaignTypeData = [
    { name: 'Newsletter', value: 45, open_rate: 59.3 },
    { name: 'Promotional', value: 25, open_rate: 69.1 },
    { name: 'Welcome', value: 15, open_rate: 65.9 },
    { name: 'Follow-up', value: 10, open_rate: 72.4 },
    { name: 'Survey', value: 5, open_rate: 48.2 }
  ]

  const engagementData = [
    { name: 'Opened', value: campaigns.reduce((sum, c) => sum + c.opened_count, 0), color: '#10B981' },
    { name: 'Clicked', value: campaigns.reduce((sum, c) => sum + c.clicked_count, 0), color: '#3B82F6' },
    { name: 'Unsubscribed', value: campaigns.reduce((sum, c) => sum + c.unsubscribed_count, 0), color: '#EF4444' },
    { name: 'Bounced', value: campaigns.reduce((sum, c) => sum + c.bounced_count, 0), color: '#F59E0B' }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage email campaigns with advanced analytics</p>
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
        {emailStats.map((stat, index) => {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Performance Trends</h3>
          <LineChartComponent data={performanceData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Breakdown</h3>
          <PieChartComponent data={engagementData} height={300} />
        </div>
      </div>

      {/* Campaign Type Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Type Performance</h3>
        <BarChartComponent data={campaignTypeData} height={300} />
      </div>

      {/* Email Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Newsletter</h4>
                <p className="text-sm text-gray-600">Weekly AI insights and updates</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Use Template</p>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Target className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Product Launch</h4>
                <p className="text-sm text-gray-600">Promotional campaign template</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Use Template</p>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Welcome Series</h4>
                <p className="text-sm text-gray-600">Onboard new subscribers</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Use Template</p>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Users className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Follow-up Sequence</h4>
                <p className="text-sm text-gray-600">Nurture leads with automation</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Use Template</p>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <BarChart3 className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Survey Campaign</h4>
                <p className="text-sm text-gray-600">Collect customer feedback</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Use Template</p>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-3">
              <Mail className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Custom Campaign</h4>
                <p className="text-sm text-gray-600">Build from scratch</p>
              </div>
            </div>
            <p className="text-sm text-blue-600">Create New</p>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns..."
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
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="follow_up">Follow-up</option>
              <option value="welcome">Welcome</option>
              <option value="abandoned_cart">Abandoned Cart</option>
              <option value="survey">Survey</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Management</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Selected
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Selected
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

      {/* Campaigns Table */}
      <DataTable
        title="Email Campaigns"
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