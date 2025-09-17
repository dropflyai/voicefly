"use client"

import { useState, useEffect } from 'react'
import {
  UserCheck, Brain, Target, TrendingUp, Users, Star,
  CheckCircle, XCircle, Clock, AlertCircle, Filter,
  Search, Download, Play, Settings, BarChart3
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import { PieChartComponent, BarChartComponent } from '@/components/Charts'
import { BusinessAPI, Lead } from '@/lib/supabase'

export default function QualificationPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterScore, setFilterScore] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const businessId = 'demo-business-id'
        const leadsData = await BusinessAPI.getLeads(businessId)
        setLeads(leadsData || [])
      } catch (error) {
        console.error('Error loading leads:', error)
        // Set demo data with qualification scores
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
            qualification_score: 92,
            interest_level: 'high',
            budget_range: '$10,000+',
            timeline: 'immediate',
            company_size: '100-500 employees',
            decision_maker: true,
            pain_points: ['Manual processes', 'High customer service costs', 'Scalability issues'],
            notes: 'Enterprise software company looking for voice AI automation. Strong budget, immediate timeline.',
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
            qualification_score: 78,
            interest_level: 'medium',
            budget_range: '$5,000-$10,000',
            timeline: 'next_quarter',
            company_size: '50-100 employees',
            decision_maker: false,
            pain_points: ['Customer service efficiency', 'Lead response time'],
            notes: 'Mid-size company, needs approval from CEO. Good fit for professional plan.',
            assigned_to: 'Jane Smith',
            last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            business_id: 'demo-business-id',
            first_name: 'Lisa',
            last_name: 'Rodriguez',
            email: 'lisa.rodriguez@startup.com',
            phone: '+1-555-0125',
            status: 'contacted',
            source: 'referral',
            qualification_score: 65,
            interest_level: 'high',
            budget_range: '$1,000-$5,000',
            timeline: 'next_month',
            company_size: '10-50 employees',
            decision_maker: true,
            pain_points: ['Limited resources', 'Need automation'],
            notes: 'Early stage startup, high interest but limited budget. Good fit for starter plan.',
            assigned_to: 'Mike Wilson',
            last_contact_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            next_follow_up: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadLeads()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'Hot Lead'
    if (score >= 60) return 'Warm Lead'
    return 'Cold Lead'
  }

  const getInterestIcon = (level: string) => {
    switch (level) {
      case 'high': return <Star className="h-4 w-4 text-yellow-500 fill-current" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />
      case 'low': return <Star className="h-4 w-4 text-gray-400" />
      default: return <Star className="h-4 w-4 text-gray-400" />
    }
  }

  const qualificationTableData = leads.map(lead => ({
    id: lead.id,
    name: `${lead.first_name} ${lead.last_name}`,
    company_size: lead.company_size || 'Unknown',
    score: lead.qualification_score,
    badge: getScoreBadge(lead.qualification_score || 0),
    interest: lead.interest_level,
    budget: lead.budget_range,
    timeline: lead.timeline,
    decision_maker: lead.decision_maker ? 'Yes' : 'No',
    pain_points: lead.pain_points?.join(', ') || 'Not assessed',
    status: lead.status,
    assigned_to: lead.assigned_to
  }))

  const columns = [
    { key: 'name', label: 'Lead Name', sortable: true },
    { key: 'company_size', label: 'Company Size', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'badge', label: 'Grade', sortable: true },
    { key: 'interest', label: 'Interest', sortable: true },
    { key: 'budget', label: 'Budget', sortable: true },
    { key: 'timeline', label: 'Timeline', sortable: true },
    { key: 'decision_maker', label: 'Decision Maker', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'assigned_to', label: 'Assigned To', sortable: true }
  ]

  const qualificationStats = [
    {
      title: 'Hot Leads (80+)',
      value: leads.filter(l => (l.qualification_score || 0) >= 80).length.toString(),
      change: '+5 this week',
      changeType: 'positive' as const,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Warm Leads (60-79)',
      value: leads.filter(l => (l.qualification_score || 0) >= 60 && (l.qualification_score || 0) < 80).length.toString(),
      change: '+3 this week',
      changeType: 'positive' as const,
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      title: 'Cold Leads (<60)',
      value: leads.filter(l => (l.qualification_score || 0) < 60).length.toString(),
      change: 'No change',
      changeType: 'neutral' as const,
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      title: 'Avg Score',
      value: `${(leads.reduce((sum, l) => sum + (l.qualification_score || 0), 0) / leads.length || 0).toFixed(1)}`,
      change: '+2.3 points',
      changeType: 'positive' as const,
      icon: Target,
      color: 'text-blue-600'
    }
  ]

  // Chart data
  const scoreDistribution = [
    { name: 'Hot (80+)', value: leads.filter(l => (l.qualification_score || 0) >= 80).length, color: '#10B981' },
    { name: 'Warm (60-79)', value: leads.filter(l => (l.qualification_score || 0) >= 60 && (l.qualification_score || 0) < 80).length, color: '#F59E0B' },
    { name: 'Cold (<60)', value: leads.filter(l => (l.qualification_score || 0) < 60).length, color: '#EF4444' }
  ]

  const qualificationCriteria = [
    { name: 'Budget', weight: 25, value: 85 },
    { name: 'Timeline', weight: 20, value: 78 },
    { name: 'Authority', weight: 20, value: 90 },
    { name: 'Need', weight: 15, value: 92 },
    { name: 'Company Size', weight: 10, value: 75 },
    { name: 'Industry Fit', weight: 10, value: 88 }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Qualification</h1>
          <p className="mt-1 text-sm text-gray-600">AI-powered lead scoring and qualification system</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Scoring Rules
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Auto-Qualify
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {qualificationStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  <p className={`text-sm mt-2 flex items-center ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.changeType === 'positive' && <TrendingUp className="h-4 w-4 mr-1" />}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Score Distribution</h3>
          <PieChartComponent data={scoreDistribution} height={250} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualification Criteria Performance</h3>
          <BarChartComponent data={qualificationCriteria} height={250} />
        </div>
      </div>

      {/* Qualification Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualification Scoring Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qualificationCriteria.map((criterion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                <span className="text-sm text-gray-600">{criterion.weight}% weight</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${criterion.value}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{criterion.value}% avg score</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search qualified leads..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Scores</option>
              <option value="hot">Hot Leads (80+)</option>
              <option value="warm">Warm Leads (60-79)</option>
              <option value="cold">Cold Leads (&lt;60)</option>
            </select>
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
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Auto-Qualify All</h3>
              <p className="text-sm text-gray-600">Run AI qualification on new leads</p>
            </div>
          </div>
        </button>
        <button className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Update Scores</h3>
              <p className="text-sm text-gray-600">Refresh qualification scores</p>
            </div>
          </div>
        </button>
        <button className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left hover:bg-purple-100 transition-colors">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">Detailed scoring analytics</p>
            </div>
          </div>
        </button>
        <button className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left hover:bg-orange-100 transition-colors">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Scoring Rules</h3>
              <p className="text-sm text-gray-600">Configure qualification criteria</p>
            </div>
          </div>
        </button>
      </div>

      {/* Qualified Leads Table */}
      <DataTable
        title="Lead Qualification Results"
        columns={columns}
        data={qualificationTableData}
        searchable={true}
        exportable={true}
        selectable={true}
        actions={true}
        isLoading={isLoading}
      />
    </div>
  )
}