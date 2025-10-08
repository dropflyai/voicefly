'use client'

import { useState } from 'react'
import Layout from '../../../components/Layout'
import {
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'voice'
  status: 'draft' | 'active' | 'paused' | 'completed'
  targetSegment: string
  targetCount: number
  sentCount?: number
  opens?: number
  clicks?: number
  replies?: number
  calls?: number
  connected?: number
  booked?: number
  createdAt: string
  scheduledStart?: string
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Dental Practice Outreach - Dallas',
    type: 'email',
    status: 'active',
    targetSegment: 'Cold',
    targetCount: 32,
    sentCount: 32,
    opens: 19,
    clicks: 8,
    replies: 3,
    createdAt: '2025-10-05',
    scheduledStart: '2025-10-06'
  },
  {
    id: '2',
    name: 'High-Intent Beauty Spas - Voice',
    type: 'voice',
    status: 'active',
    targetSegment: 'Warm',
    targetCount: 15,
    calls: 12,
    connected: 7,
    booked: 3,
    createdAt: '2025-10-05',
    scheduledStart: '2025-10-07'
  },
  {
    id: '3',
    name: 'Auto Dealership Follow-up',
    type: 'email',
    status: 'draft',
    targetSegment: 'Cold',
    targetCount: 18,
    createdAt: '2025-10-06'
  },
  {
    id: '4',
    name: 'Healthcare Clinics - Hot Leads',
    type: 'voice',
    status: 'active',
    targetSegment: 'Hot',
    targetCount: 5,
    calls: 5,
    connected: 4,
    booked: 2,
    createdAt: '2025-10-04',
    scheduledStart: '2025-10-05'
  }
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [filter, setFilter] = useState<'all' | 'email' | 'voice'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredCampaigns = campaigns.filter(c => {
    const matchesType = filter === 'all' || c.type === filter
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const classes = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    }

    const icons = {
      draft: ClockIcon,
      active: PlayCircleIcon,
      paused: PauseCircleIcon,
      completed: CheckCircleIcon
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', classes[status as keyof typeof classes])}>
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const calculatePerformance = (campaign: Campaign) => {
    if (campaign.type === 'email') {
      const openRate = campaign.opens && campaign.sentCount ? (campaign.opens / campaign.sentCount * 100).toFixed(0) : '0'
      const clickRate = campaign.clicks && campaign.sentCount ? (campaign.clicks / campaign.sentCount * 100).toFixed(0) : '0'
      return { openRate, clickRate }
    } else {
      const connectionRate = campaign.connected && campaign.calls ? (campaign.connected / campaign.calls * 100).toFixed(0) : '0'
      const bookingRate = campaign.booked && campaign.connected ? (campaign.booked / campaign.connected * 100).toFixed(0) : '0'
      return { connectionRate, bookingRate }
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Auto-generated email & voice campaigns for lead nurturing
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{campaigns.length}</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <PlayCircleIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Booked</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">
                  {campaigns.reduce((sum, c) => sum + (c.booked || 0), 0)}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Leads Reached</p>
                <p className="mt-2 text-3xl font-semibold text-purple-600">
                  {campaigns.reduce((sum, c) => sum + (c.sentCount || c.calls || 0), 0)}
                </p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <button
                onClick={() => setFilter('all')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors', filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
              >
                All
              </button>
              <button
                onClick={() => setFilter('email')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', filter === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
              >
                <EnvelopeIcon className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={() => setFilter('voice')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', filter === 'voice' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
              >
                <PhoneIcon className="h-4 w-4" />
                Voice
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((campaign) => {
            const perf = calculatePerformance(campaign)

            return (
              <div key={campaign.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={clsx('p-3 rounded-lg', campaign.type === 'email' ? 'bg-blue-100' : 'bg-green-100')}>
                      {campaign.type === 'email' ? (
                        <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                      ) : (
                        <PhoneIcon className="h-6 w-6 text-green-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>Segment: {campaign.targetSegment}</span>
                        <span>•</span>
                        <span>{campaign.targetCount} leads</span>
                        <span>•</span>
                        <span>Created {format(new Date(campaign.createdAt), 'MMM d')}</span>
                      </div>

                      {/* Performance Metrics */}
                      {campaign.status !== 'draft' && (
                        <div className="mt-4 grid grid-cols-4 gap-4">
                          {campaign.type === 'email' ? (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Sent</p>
                                <p className="text-lg font-semibold text-gray-900">{campaign.sentCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Opens</p>
                                <p className="text-lg font-semibold text-blue-600">
                                  {campaign.opens || 0} <span className="text-sm text-gray-500">({perf.openRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Clicks</p>
                                <p className="text-lg font-semibold text-purple-600">
                                  {campaign.clicks || 0} <span className="text-sm text-gray-500">({perf.clickRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Replies</p>
                                <p className="text-lg font-semibold text-green-600">{campaign.replies || 0}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Calls</p>
                                <p className="text-lg font-semibold text-gray-900">{campaign.calls || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Connected</p>
                                <p className="text-lg font-semibold text-blue-600">
                                  {campaign.connected || 0} <span className="text-sm text-gray-500">({perf.connectionRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Booked</p>
                                <p className="text-lg font-semibold text-green-600">
                                  {campaign.booked || 0} <span className="text-sm text-gray-500">({perf.bookingRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Close Rate</p>
                                <p className="text-lg font-semibold text-purple-600">{perf.bookingRate}%</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Approve & Launch
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No campaigns found</p>
            <p className="text-sm text-gray-400 mt-1">Campaigns are auto-created when you request leads</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
