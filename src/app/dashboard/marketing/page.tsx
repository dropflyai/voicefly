'use client'

import { useState, useEffect } from 'react'
import { 
  EnvelopeIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent'
  recipient_count: number
  open_rate?: number
  click_rate?: number
  created_at: string
  sent_at?: string
}

export default function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRecipients: 0,
    averageOpenRate: 0,
    recentCampaigns: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      // This will connect to Developer #1's backend API
      const response = await fetch('/api/email/campaigns')
      const data = await response.json()
      
      setCampaigns(data.campaigns || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      // Mock data for development
      setCampaigns([
        {
          id: '1',
          name: 'Welcome Series',
          subject: 'Welcome to our salon!',
          status: 'sent',
          recipient_count: 45,
          open_rate: 68.5,
          click_rate: 12.3,
          created_at: '2024-01-15',
          sent_at: '2024-01-16'
        },
        {
          id: '2', 
          name: 'Holiday Special',
          subject: 'New Year, New Nails! 50% Off',
          status: 'draft',
          recipient_count: 120,
          created_at: '2024-01-20'
        },
        {
          id: '3',
          name: 'Monthly Newsletter',
          subject: 'January Nail Trends & Tips',
          status: 'scheduled',
          recipient_count: 87,
          created_at: '2024-01-18'
        }
      ])
      setStats({
        totalCampaigns: 3,
        totalRecipients: 252,
        averageOpenRate: 68.5,
        recentCampaigns: 2
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200', 
      sent: 'bg-green-100 text-green-800 border-green-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600">Create and manage email campaigns for your customers</p>
        </div>
        <Link
          href="/dashboard/marketing/campaigns/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Campaign
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecipients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageOpenRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentCampaigns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/marketing/campaigns/new?template=welcome"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200">
                <EnvelopeIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Welcome Email</h3>
              <p className="text-sm text-gray-500 mt-1">Send to new customers</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/marketing/campaigns/new?template=promotion"
            className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-200">
                <ChartBarIcon className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-medium text-gray-900">Promotion</h3>
              <p className="text-sm text-gray-500 mt-1">Special offers & deals</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/marketing/campaigns/new?template=newsletter"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Newsletter</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly updates</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.recipient_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.status === 'sent' ? (
                      <div>
                        <div>Open: {campaign.open_rate}%</div>
                        <div>Click: {campaign.click_rate}%</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/marketing/campaigns/${campaign.id}`}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      View
                    </Link>
                    {campaign.status === 'draft' && (
                      <Link
                        href={`/dashboard/marketing/campaigns/${campaign.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Top Performing Campaigns</h3>
            <div className="space-y-3">
              {campaigns
                .filter(c => c.status === 'sent' && c.open_rate)
                .sort((a, b) => (b.open_rate || 0) - (a.open_rate || 0))
                .slice(0, 3)
                .map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.recipient_count} recipients</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{campaign.open_rate}%</p>
                      <p className="text-xs text-gray-500">open rate</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">Campaign "Welcome Series" delivered</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">New subscribers added to list</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-900">Campaign "Holiday Special" scheduled</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}