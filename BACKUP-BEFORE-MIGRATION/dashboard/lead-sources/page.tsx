"use client"

import { useState, useEffect } from 'react'
import {
  UserPlus, Globe, Phone, Mail, MessageSquare, Users,
  TrendingUp, DollarSign, Target, BarChart3, Plus,
  Settings, Filter, Download, LinkIcon, Share2,
  Facebook, Twitter, Linkedin, Youtube, Instagram
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { PieChartComponent, BarChartComponent, LineChartComponent } from '@/components/Charts'
import { BusinessAPI } from '@/lib/supabase'

interface LeadSource {
  id: string
  name: string
  type: 'voice_ai' | 'website' | 'social_media' | 'referral' | 'cold_call' | 'email' | 'paid_ads' | 'events'
  status: 'active' | 'paused' | 'inactive'
  total_leads: number
  qualified_leads: number
  conversion_rate: number
  cost_per_lead: number
  total_spent: number
  roi: number
  created_at: string
  updated_at: string
}

export default function LeadSourcesPage() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadLeadSources = async () => {
      try {
        // In production, this would fetch from BusinessAPI.getLeadSources()
        setLeadSources([
          {
            id: '1',
            name: 'VoiceFly AI Outreach',
            type: 'voice_ai',
            status: 'active',
            total_leads: 1247,
            qualified_leads: 456,
            conversion_rate: 36.6,
            cost_per_lead: 8.50,
            total_spent: 10599.50,
            roi: 285.2,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Website Contact Form',
            type: 'website',
            status: 'active',
            total_leads: 892,
            qualified_leads: 267,
            conversion_rate: 29.9,
            cost_per_lead: 0,
            total_spent: 0,
            roi: 0,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'LinkedIn Ads',
            type: 'social_media',
            status: 'active',
            total_leads: 567,
            qualified_leads: 189,
            conversion_rate: 33.3,
            cost_per_lead: 15.75,
            total_spent: 8930.25,
            roi: 198.5,
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Partner Referrals',
            type: 'referral',
            status: 'active',
            total_leads: 234,
            qualified_leads: 156,
            conversion_rate: 66.7,
            cost_per_lead: 25.00,
            total_spent: 5850.00,
            roi: 445.8,
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Google Ads',
            type: 'paid_ads',
            status: 'active',
            total_leads: 445,
            qualified_leads: 123,
            conversion_rate: 27.6,
            cost_per_lead: 22.50,
            total_spent: 10012.50,
            roi: 156.3,
            created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '6',
            name: 'Email Marketing',
            type: 'email',
            status: 'paused',
            total_leads: 156,
            qualified_leads: 34,
            conversion_rate: 21.8,
            cost_per_lead: 5.25,
            total_spent: 819.00,
            roi: 89.4,
            created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      } catch (error) {
        console.error('Error loading lead sources:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeadSources()
  }, [])

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'voice_ai': return <Phone className="h-5 w-5" />
      case 'website': return <Globe className="h-5 w-5" />
      case 'social_media': return <Share2 className="h-5 w-5" />
      case 'referral': return <Users className="h-5 w-5" />
      case 'cold_call': return <Phone className="h-5 w-5" />
      case 'email': return <Mail className="h-5 w-5" />
      case 'paid_ads': return <Target className="h-5 w-5" />
      case 'events': return <Users className="h-5 w-5" />
      default: return <UserPlus className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const sourceTableData = leadSources.map(source => ({
    id: source.id,
    name: source.name,
    type: source.type,
    status: source.status,
    total_leads: source.total_leads,
    qualified_leads: source.qualified_leads,
    conversion_rate: `${source.conversion_rate}%`,
    cost_per_lead: `$${source.cost_per_lead.toFixed(2)}`,
    total_spent: `$${source.total_spent.toLocaleString()}`,
    roi: `${source.roi}%`,
    created_at: new Date(source.created_at).toLocaleDateString()
  }))

  const columns = [
    { key: 'name', label: 'Source Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'total_leads', label: 'Total Leads', sortable: true },
    { key: 'qualified_leads', label: 'Qualified', sortable: true },
    { key: 'conversion_rate', label: 'Conversion', sortable: true },
    { key: 'cost_per_lead', label: 'Cost/Lead', sortable: true },
    { key: 'total_spent', label: 'Total Spent', sortable: true },
    { key: 'roi', label: 'ROI', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true }
  ]

  const sourceStats = [
    {
      title: 'Active Sources',
      value: leadSources.filter(s => s.status === 'active').length.toString(),
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: UserPlus
    },
    {
      title: 'Total Leads Generated',
      value: leadSources.reduce((sum, s) => sum + s.total_leads, 0).toLocaleString(),
      change: '+15.2%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Avg Conversion Rate',
      value: `${(leadSources.reduce((sum, s) => sum + s.conversion_rate, 0) / leadSources.length || 0).toFixed(1)}%`,
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: 'Total ROI',
      value: `${(leadSources.reduce((sum, s) => sum + s.roi, 0) / leadSources.length || 0).toFixed(1)}%`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign
    }
  ]

  // Chart data
  const sourceDistribution = leadSources.map(source => ({
    name: source.name,
    value: source.total_leads,
    qualified: source.qualified_leads
  }))

  const performanceData = [
    { name: 'Week 1', voice_ai: 89, website: 45, social: 34, referral: 12 },
    { name: 'Week 2', voice_ai: 124, website: 67, social: 45, referral: 18 },
    { name: 'Week 3', voice_ai: 156, website: 78, social: 56, referral: 23 },
    { name: 'Week 4', voice_ai: 189, website: 89, social: 67, referral: 28 }
  ]

  const roiComparison = leadSources.map(source => ({
    name: source.name.split(' ')[0],
    roi: source.roi,
    cost: source.cost_per_lead
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Sources</h1>
          <p className="mt-1 text-sm text-gray-600">Track and optimize all lead generation channels</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sourceStats.map((stat, index) => {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Generation Performance</h3>
          <LineChartComponent data={performanceData} height={300} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Comparison</h3>
          <BarChartComponent data={roiComparison} height={300} />
        </div>
      </div>

      {/* Source Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Source Distribution</h3>
        <PieChartComponent data={sourceDistribution} height={300} />
      </div>

      {/* Quick Setup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">VoiceFly AI Setup</h3>
              <p className="text-sm opacity-90 mt-1">Configure Maya AI for outbound calls</p>
              <button className="mt-3 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Configure Now
              </button>
            </div>
            <Phone className="h-12 w-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Website Integration</h3>
              <p className="text-sm opacity-90 mt-1">Add lead capture forms and chat widgets</p>
              <button className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Get Code
              </button>
            </div>
            <Globe className="h-12 w-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Social Media</h3>
              <p className="text-sm opacity-90 mt-1">Connect LinkedIn, Facebook, and more</p>
              <button className="mt-3 px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Connect
              </button>
            </div>
            <Share2 className="h-12 w-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search lead sources..."
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
              <option value="voice_ai">Voice AI</option>
              <option value="website">Website</option>
              <option value="social_media">Social Media</option>
              <option value="referral">Referral</option>
              <option value="paid_ads">Paid Ads</option>
              <option value="email">Email</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Integration Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Integration Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-2">
              <Linkedin className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-medium">LinkedIn</span>
            </div>
            <p className="text-sm text-gray-600">Lead generation ads and InMail campaigns</p>
          </button>
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-2">
              <Facebook className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-medium">Facebook</span>
            </div>
            <p className="text-sm text-gray-600">Social media advertising and lead forms</p>
          </button>
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-2">
              <Globe className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-medium">Google Ads</span>
            </div>
            <p className="text-sm text-gray-600">Search and display advertising campaigns</p>
          </button>
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center mb-2">
              <LinkIcon className="h-6 w-6 text-purple-600 mr-2" />
              <span className="font-medium">Zapier</span>
            </div>
            <p className="text-sm text-gray-600">Connect 5,000+ apps for lead automation</p>
          </button>
        </div>
      </div>

      {/* Lead Sources Table */}
      <DataTable
        title="All Lead Sources"
        columns={columns}
        data={sourceTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}