'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../../../components/Layout'
import { BusinessAPI } from '../../../../lib/supabase'
import { getCurrentBusinessId } from '../../../../lib/auth-utils'
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  recipient_count: number
  open_rate?: number
  click_rate?: number
  created_at: string
  sent_at?: string
  template_type: 'welcome' | 'promotion' | 'newsletter' | 'reminder'
}

export default function CampaignsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])

  const businessId = getCurrentBusinessId() || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'

  useEffect(() => {
    loadBusiness()
    loadCampaigns()
  }, [])

  const loadBusiness = async () => {
    try {
      const businessData = await BusinessAPI.getBusiness(businessId)
      setBusiness(businessData)
    } catch (error) {
      console.error('Failed to load business:', error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/email/campaigns')
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      // Mock data for development
      setCampaigns([
        {
          id: '1',
          name: 'Welcome New Customers',
          subject: 'Welcome to Glamour Nails! 🎉',
          status: 'sent',
          recipient_count: 45,
          open_rate: 68.5,
          click_rate: 12.3,
          created_at: '2024-01-15T10:30:00Z',
          sent_at: '2024-01-16T09:00:00Z',
          template_type: 'welcome'
        },
        {
          id: '2',
          name: 'Holiday Special Offer',
          subject: 'New Year, New Nails! 50% Off First Visit',
          status: 'draft',
          recipient_count: 120,
          created_at: '2024-01-20T14:15:00Z',
          template_type: 'promotion'
        },
        {
          id: '3',
          name: 'January Newsletter',
          subject: 'January Nail Trends & Beauty Tips',
          status: 'scheduled',
          recipient_count: 87,
          created_at: '2024-01-18T16:45:00Z',
          template_type: 'newsletter'
        },
        {
          id: '4',
          name: 'Appointment Reminders',
          subject: 'Your appointment is tomorrow!',
          status: 'sent',
          recipient_count: 23,
          open_rate: 85.2,
          click_rate: 34.6,
          created_at: '2024-01-14T08:20:00Z',
          sent_at: '2024-01-14T18:00:00Z',
          template_type: 'reminder'
        },
        {
          id: '5',
          name: 'Valentine\'s Day Promo',
          subject: 'Spread Love with Beautiful Nails 💕',
          status: 'paused',
          recipient_count: 156,
          created_at: '2024-01-12T11:30:00Z',
          template_type: 'promotion'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      sent: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTemplateIcon = (type: Campaign['template_type']) => {
    const icons = {
      welcome: '👋',
      promotion: '🎉',
      newsletter: '📰',
      reminder: '⏰'
    }
    return icons[type] || '📧'
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on campaigns:`, selectedCampaigns)
    // TODO: Implement bulk actions
  }

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  const selectAllCampaigns = () => {
    setSelectedCampaigns(
      selectedCampaigns.length === filteredCampaigns.length 
        ? [] 
        : filteredCampaigns.map(c => c.id)
    )
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-sm text-gray-600">Manage and track your email marketing campaigns</p>
        </div>
        <Link
          href="/dashboard/marketing/campaigns/new"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="paused">Paused</option>
            </select>
            <FunnelIcon className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCampaigns.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-sm text-purple-700">
              {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => handleBulkAction('duplicate')}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Duplicate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onChange={selectAllCampaigns}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
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
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => toggleCampaignSelection(campaign.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{getTemplateIcon(campaign.template_type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.recipient_count.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">recipients</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.status === 'sent' && campaign.open_rate ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {campaign.open_rate}% open
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.click_rate}% click
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(campaign.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/marketing/campaigns/${campaign.id}`}
                        className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                      >
                        View
                      </Link>
                      {campaign.status === 'draft' && (
                        <>
                          <Link
                            href={`/dashboard/marketing/campaigns/${campaign.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button className="text-green-600 hover:text-green-900">
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <PaperAirplaneIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Create your first email campaign to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/dashboard/marketing/campaigns/new"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Campaign
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {campaigns.length}
            </div>
            <div className="text-sm text-gray-500">Total Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'sent').length}
            </div>
            <div className="text-sm text-gray-500">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.filter(c => c.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {campaigns.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-500">Drafts</div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </Layout>
  )
}