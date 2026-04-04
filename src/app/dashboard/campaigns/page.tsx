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
      draft: 'bg-surface-high text-text-primary',
      active: 'bg-emerald-500/10 text-green-800',
      paused: 'bg-accent/10 text-yellow-800',
      completed: 'bg-brand-primary/10 text-blue-800'
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
            <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Auto-generated email & voice campaigns for lead nurturing
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-low p-6 rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Campaigns</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{campaigns.length}</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-text-muted" />
            </div>
          </div>

          <div className="bg-surface-low p-6 rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-500">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <PlayCircleIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-surface-low p-6 rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Booked</p>
                <p className="mt-2 text-3xl font-semibold text-brand-primary">
                  {campaigns.reduce((sum, c) => sum + (c.booked || 0), 0)}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-brand-primary" />
            </div>
          </div>

          <div className="bg-surface-low p-6 rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Leads Reached</p>
                <p className="mt-2 text-3xl font-semibold text-purple-400">
                  {campaigns.reduce((sum, c) => sum + (c.sentCount || c.calls || 0), 0)}
                </p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-low p-4 rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-[rgba(65,71,84,0.15)] pr-4">
              <button
                onClick={() => setFilter('all')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors', filter === 'all' ? 'bg-brand-primary text-white' : 'bg-surface-high text-text-primary hover:bg-surface-highest')}
              >
                All
              </button>
              <button
                onClick={() => setFilter('email')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', filter === 'email' ? 'bg-brand-primary text-white' : 'bg-surface-high text-text-primary hover:bg-surface-highest')}
              >
                <EnvelopeIcon className="h-4 w-4" />
                Email
              </button>
              <button
                onClick={() => setFilter('voice')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2', filter === 'voice' ? 'bg-brand-primary text-white' : 'bg-surface-high text-text-primary hover:bg-surface-highest')}
              >
                <PhoneIcon className="h-4 w-4" />
                Voice
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary"
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
              <div key={campaign.id} className="bg-surface-low shadow-sm rounded-lg border border-[rgba(65,71,84,0.15)] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={clsx('p-3 rounded-lg', campaign.type === 'email' ? 'bg-brand-primary/10' : 'bg-emerald-500/10')}>
                      {campaign.type === 'email' ? (
                        <EnvelopeIcon className="h-6 w-6 text-brand-primary" />
                      ) : (
                        <PhoneIcon className="h-6 w-6 text-emerald-500" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-text-primary">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
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
                                <p className="text-xs text-text-secondary">Sent</p>
                                <p className="text-lg font-semibold text-text-primary">{campaign.sentCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Opens</p>
                                <p className="text-lg font-semibold text-brand-primary">
                                  {campaign.opens || 0} <span className="text-sm text-text-secondary">({perf.openRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Clicks</p>
                                <p className="text-lg font-semibold text-purple-400">
                                  {campaign.clicks || 0} <span className="text-sm text-text-secondary">({perf.clickRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Replies</p>
                                <p className="text-lg font-semibold text-emerald-500">{campaign.replies || 0}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-text-secondary">Calls</p>
                                <p className="text-lg font-semibold text-text-primary">{campaign.calls || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Connected</p>
                                <p className="text-lg font-semibold text-brand-primary">
                                  {campaign.connected || 0} <span className="text-sm text-text-secondary">({perf.connectionRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Booked</p>
                                <p className="text-lg font-semibold text-emerald-500">
                                  {campaign.booked || 0} <span className="text-sm text-text-secondary">({perf.bookingRate}%)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-text-secondary">Close Rate</p>
                                <p className="text-lg font-semibold text-purple-400">{perf.bookingRate}%</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <button className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-[#0060d0] transition-colors text-sm font-medium">
                        Approve & Launch
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
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
          <div className="bg-surface-low shadow-sm rounded-lg border border-[rgba(65,71,84,0.15)] p-12 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-text-muted" />
            <p className="mt-2 text-text-secondary">No campaigns found</p>
            <p className="text-sm text-text-muted mt-1">Campaigns are auto-created when you request leads</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
