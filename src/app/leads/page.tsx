"use client"

import { useState, useEffect } from 'react'
import {
  Users, Search, Filter, Download, Plus, Phone, Mail,
  MessageSquare, Calendar, TrendingUp, Target, UserCheck,
  Star, Clock, DollarSign, Edit, Trash2, Eye
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { BusinessAPI, Lead } from '@/lib/supabase'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const businessId = 'demo-business-id'
        const leadsData = await BusinessAPI.getLeads(businessId)
        setLeads(leadsData || [])
      } catch (error) {
        console.error('Error loading leads:', error)
        // Set demo data as fallback
        setLeads([
          {
            id: '1',
            business_id: 'demo-business-id',
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah.johnson@email.com',
            phone: '+1-555-0123',
            status: 'qualified',
            source: 'voice_ai',
            qualification_score: 85,
            interest_level: 'high',
            budget_range: '$5,000-$10,000',
            timeline: 'immediate',
            notes: 'Interested in comprehensive business automation package',
            assigned_to: 'John Doe',
            last_contact_date: new Date().toISOString(),
            next_follow_up: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            business_id: 'demo-business-id',
            first_name: 'Michael',
            last_name: 'Chen',
            email: 'michael.chen@company.com',
            phone: '+1-555-0124',
            status: 'new',
            source: 'website',
            qualification_score: 72,
            interest_level: 'medium',
            budget_range: '$1,000-$5,000',
            timeline: 'next_month',
            notes: 'Looking for voice AI solution for customer service',
            assigned_to: 'Jane Smith',
            last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadLeads()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  const getInterestIcon = (level: string) => {
    switch (level) {
      case 'high': return <Star className="h-4 w-4 text-yellow-500 fill-current" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />
      case 'low': return <Star className="h-4 w-4 text-gray-400" />
      default: return <Star className="h-4 w-4 text-gray-400" />
    }
  }

  const leadTableData = leads.map(lead => ({
    id: lead.id,
    name: `${lead.first_name} ${lead.last_name}`,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    source: lead.source,
    score: lead.qualification_score,
    interest: lead.interest_level,
    budget: lead.budget_range,
    timeline: lead.timeline,
    assigned_to: lead.assigned_to,
    last_contact: lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString() : 'Never',
    next_follow_up: lead.next_follow_up ? new Date(lead.next_follow_up).toLocaleDateString() : 'Not scheduled'
  }))

  const columns = [
    { key: 'name', label: 'Lead Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'interest', label: 'Interest', sortable: true },
    { key: 'budget', label: 'Budget', sortable: true },
    { key: 'assigned_to', label: 'Assigned To', sortable: true },
    { key: 'next_follow_up', label: 'Next Follow Up', sortable: true }
  ]

  const leadStats = [
    {
      title: 'Total Leads',
      value: leads.length.toString(),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Qualified Leads',
      value: leads.filter(l => l.status === 'qualified').length.toString(),
      change: '+8.3%',
      changeType: 'positive' as const,
      icon: UserCheck
    },
    {
      title: 'Avg Response Time',
      value: '2.4 hrs',
      change: '-15 min',
      changeType: 'positive' as const,
      icon: Clock
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Database</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and track all leads from VoiceFly AI and LeadFly sources</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leadStats.map((stat, index) => {
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="voice_ai">Voice AI</option>
              <option value="website">Website</option>
              <option value="social_media">Social Media</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Start Voice Campaign</h3>
              <p className="text-sm text-gray-600">Launch AI-powered outreach</p>
            </div>
          </div>
        </button>
        <button className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Email Sequence</h3>
              <p className="text-sm text-gray-600">Send automated follow-ups</p>
            </div>
          </div>
        </button>
        <button className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left hover:bg-purple-100 transition-colors">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Qualify Leads</h3>
              <p className="text-sm text-gray-600">Run qualification process</p>
            </div>
          </div>
        </button>
        <button className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left hover:bg-orange-100 transition-colors">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Schedule Meetings</h3>
              <p className="text-sm text-gray-600">Book qualified prospects</p>
            </div>
          </div>
        </button>
      </div>

      {/* Leads Table */}
      <DataTable
        title="All Leads"
        columns={columns}
        data={leadTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}