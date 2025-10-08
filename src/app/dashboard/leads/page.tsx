'use client'

import { useState, useEffect } from 'react'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import Layout from '../../../components/Layout'
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  PhoneIcon,
  EnvelopeIcon,
  FireIcon,
  CloudIcon,
  BoltIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import Link from 'next/link'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  companyName: string
  jobTitle?: string
  industry?: string
  companySize?: string
  location?: string
  leadSource: string
  leadStatus: 'new' | 'qualified' | 'contacted' | 'nurturing' | 'converted' | 'lost'
  segment: 'cold' | 'warm' | 'hot'
  qualificationScore: number
  estimatedDealValue?: number
  estimatedCloseDate?: string
  assignedTo?: string
  notes?: string
  createdAt: string
  lastContactedAt?: string
  nextFollowUpAt?: string
}

// Mock data for demo
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Dr. Michael',
    lastName: 'Thompson',
    email: 'dr.thompson@dentalcare.com',
    phone: '(555) 321-7890',
    companyName: 'Thompson Dental Care',
    jobTitle: 'Owner',
    industry: 'Dental',
    companySize: '15 employees',
    location: 'Dallas, TX',
    leadSource: 'apollo',
    leadStatus: 'qualified',
    segment: 'hot',
    qualificationScore: 85,
    estimatedDealValue: 15000,
    estimatedCloseDate: '2025-11-15',
    notes: 'Interested in AI voice automation. Currently missing 20% of after-hours calls.',
    createdAt: '2025-10-05',
    lastContactedAt: '2025-10-06',
    nextFollowUpAt: '2025-10-10'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Martinez',
    email: 'smartinez@beaut yspa.com',
    phone: '(555) 432-1098',
    companyName: 'Luxury Beauty Spa',
    jobTitle: 'Manager',
    industry: 'Beauty & Spa',
    companySize: '8 employees',
    location: 'Austin, TX',
    leadSource: 'apollo',
    leadStatus: 'qualified',
    segment: 'warm',
    qualificationScore: 65,
    estimatedDealValue: 8000,
    estimatedCloseDate: '2025-11-30',
    notes: 'Opened email campaign 3x. High engagement.',
    createdAt: '2025-10-03',
    lastContactedAt: '2025-10-05',
    nextFollowUpAt: '2025-10-12'
  },
  {
    id: '3',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'jwilson@autogroup.com',
    companyName: 'Wilson Auto Group',
    jobTitle: 'GM',
    industry: 'Automotive',
    companySize: '50 employees',
    location: 'Houston, TX',
    leadSource: 'apollo',
    leadStatus: 'new',
    segment: 'cold',
    qualificationScore: 45,
    estimatedDealValue: 20000,
    estimatedCloseDate: '2025-12-15',
    notes: 'Large dealership. Sent initial email, no response yet.',
    createdAt: '2025-10-01',
    nextFollowUpAt: '2025-10-15'
  },
  {
    id: '4',
    firstName: 'Jennifer',
    lastName: 'Lee',
    email: 'jlee@wellnessclinic.com',
    phone: '(555) 567-8901',
    companyName: 'Wellness Health Clinic',
    jobTitle: 'Director',
    industry: 'Healthcare',
    companySize: '25 employees',
    location: 'San Antonio, TX',
    leadSource: 'apollo',
    leadStatus: 'qualified',
    segment: 'hot',
    qualificationScore: 92,
    estimatedDealValue: 18000,
    estimatedCloseDate: '2025-11-08',
    notes: 'Demo scheduled for Oct 12. Very interested in multi-location support.',
    createdAt: '2025-09-28',
    lastContactedAt: '2025-10-07',
    nextFollowUpAt: '2025-10-12'
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Chen',
    email: 'rchen@legalfirm.com',
    companyName: 'Chen & Associates Law',
    jobTitle: 'Partner',
    industry: 'Legal',
    companySize: '12 employees',
    location: 'Fort Worth, TX',
    leadSource: 'apollo',
    leadStatus: 'new',
    segment: 'cold',
    qualificationScore: 38,
    estimatedDealValue: 12000,
    notes: 'Email sent. No engagement yet.',
    createdAt: '2025-10-02'
  }
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'cold' | 'warm' | 'hot'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSegment = segmentFilter === 'all' || lead.segment === segmentFilter
    const matchesStatus = statusFilter === 'all' || lead.leadStatus === statusFilter

    return matchesSearch && matchesSegment && matchesStatus
  })

  // Pipeline summary
  const summary = {
    total: leads.length,
    cold: leads.filter(l => l.segment === 'cold').length,
    warm: leads.filter(l => l.segment === 'warm').length,
    hot: leads.filter(l => l.segment === 'hot').length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimatedDealValue || 0), 0)
  }

  const getSegmentIcon = (segment: string) => {
    switch(segment) {
      case 'hot': return <FireIcon className="h-5 w-5 text-red-500" />
      case 'warm': return <BoltIcon className="h-5 w-5 text-orange-500" />
      case 'cold': return <CloudIcon className="h-5 w-5 text-blue-500" />
      default: return null
    }
  }

  const getSegmentBadge = (segment: string) => {
    const classes = {
      hot: 'bg-red-100 text-red-800',
      warm: 'bg-orange-100 text-orange-800',
      cold: 'bg-blue-100 text-blue-800'
    }

    return (
      <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', classes[segment as keyof typeof classes])}>
        {getSegmentIcon(segment)}
        {segment.toUpperCase()}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const classes = {
      new: 'bg-gray-100 text-gray-800',
      qualified: 'bg-green-100 text-green-800',
      contacted: 'bg-blue-100 text-blue-800',
      nurturing: 'bg-purple-100 text-purple-800',
      converted: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    }

    return (
      <span className={clsx('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', classes[status as keyof typeof classes])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-researched leads with automated nurture campaigns
            </p>
          </div>
          <Link
            href="/dashboard/leads/request"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Request Leads
          </Link>
        </div>

        {/* Pipeline Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{summary.total}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Cold</p>
                <p className="mt-2 text-3xl font-semibold text-blue-900">{summary.cold}</p>
                <p className="mt-1 text-xs text-blue-600">Email nurture</p>
              </div>
              <CloudIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-sm border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Warm</p>
                <p className="mt-2 text-3xl font-semibold text-orange-900">{summary.warm}</p>
                <p className="mt-1 text-xs text-orange-600">Voice calls</p>
              </div>
              <BoltIcon className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Hot</p>
                <p className="mt-2 text-3xl font-semibold text-red-900">{summary.hot}</p>
                <p className="mt-1 text-xs text-red-600">Ready to close</p>
              </div>
              <FireIcon className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Pipeline Value</p>
                <p className="mt-2 text-2xl font-semibold text-green-900">
                  ${(summary.totalValue / 1000).toFixed(0)}K
                </p>
                <p className="mt-1 text-xs text-green-600">Est. revenue</p>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Segment Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Segments</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">⚡ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="contacted">Contacted</option>
                <option value="nurturing">Nurturing</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">No leads found</p>
                      <Link href="/dashboard/leads/request" className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                        Request your first batch of leads
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {lead.firstName[0]}{lead.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{lead.jobTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.companyName}</div>
                        <div className="text-sm text-gray-500">
                          {lead.industry} • {lead.companySize}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSegmentBadge(lead.segment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.leadStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={clsx('h-2 rounded-full', {
                                'bg-red-500': lead.qualificationScore >= 75,
                                'bg-orange-500': lead.qualificationScore >= 50 && lead.qualificationScore < 75,
                                'bg-blue-500': lead.qualificationScore < 50
                              })}
                              style={{ width: `${lead.qualificationScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {lead.qualificationScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(lead.estimatedDealValue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.nextFollowUpAt ? (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(lead.nextFollowUpAt), 'MMM d')}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not scheduled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xl">
                        {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h2>
                      <p className="text-gray-600">{selectedLead.jobTitle} at {selectedLead.companyName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLead.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLead.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Company Info</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 text-gray-900">{selectedLead.industry}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 text-gray-900">{selectedLead.companySize}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 text-gray-900">{selectedLead.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Source:</span>
                        <span className="ml-2 text-gray-900 capitalize">{selectedLead.leadSource}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Lead Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Segment:</span>
                        {getSegmentBadge(selectedLead.segment)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        {getStatusBadge(selectedLead.leadStatus)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Qualification Score:</span>
                        <span className="font-medium text-gray-900">{selectedLead.qualificationScore}/100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Est. Deal Value:</span>
                        <span className="font-medium text-gray-900">${selectedLead.estimatedDealValue?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Est. Close Date:</span>
                        <span className="font-medium text-gray-900">
                          {selectedLead.estimatedCloseDate ? format(new Date(selectedLead.estimatedCloseDate), 'MMM d, yyyy') : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedLead.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">AI Research Notes</h3>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                        {selectedLead.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Lead
                    </button>
                    <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Schedule Follow-up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
