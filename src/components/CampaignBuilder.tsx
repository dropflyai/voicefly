'use client'

import { useState, useEffect } from 'react'
import { 
  PaintBrushIcon, 
  EyeIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Campaign {
  id?: string
  name: string
  subject: string
  content: string
  template_type: 'welcome' | 'promotion' | 'newsletter' | 'reminder'
  target_segment: string
  scheduled_at?: string
  status: 'draft' | 'scheduled'
}

interface CampaignBuilderProps {
  initialCampaign?: Partial<Campaign>
  onSave: (campaign: Campaign) => Promise<void>
  onCancel: () => void
}

export default function CampaignBuilder({ initialCampaign, onSave, onCancel }: CampaignBuilderProps) {
  const [campaign, setCampaign] = useState<Campaign>({
    name: '',
    subject: '',
    content: '',
    template_type: 'newsletter',
    target_segment: 'all_customers',
    status: 'draft',
    ...initialCampaign
  })

  const [activeTab, setActiveTab] = useState<'content' | 'recipients' | 'schedule'>('content')
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const templates = {
    welcome: {
      name: 'Welcome New Customers',
      subject: 'Welcome to [Business Name]! 🎉',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333ea;">Welcome to [Business Name]!</h2>
        <p>Thank you for choosing us for your nail care needs. We're excited to have you as a customer!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What to expect:</h3>
          <ul>
            <li>Professional nail services</li>
            <li>Clean and sanitized equipment</li>
            <li>Friendly and experienced staff</li>
          </ul>
        </div>
        <p>Ready to book your next appointment?</p>
        <a href="[Booking Link]" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Now</a>
      </div>`
    },
    promotion: {
      name: 'Special Offer',
      subject: 'Special Offer Just for You! 🎉',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Limited Time Offer!</h2>
        <div style="text-align: center; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 30px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #92400e; font-size: 24px; margin: 0;">50% OFF</h3>
          <p style="color: #92400e; margin: 10px 0;">Your Next Nail Service</p>
        </div>
        <p>Don't miss out on this amazing deal! Book your appointment before [Expiry Date] and save big.</p>
        <p><strong>What's included:</strong></p>
        <ul>
          <li>Full manicure service</li>
          <li>Your choice of regular or gel polish</li>
          <li>Nail art (basic design)</li>
        </ul>
        <a href="[Booking Link]" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Now & Save 50%</a>
      </div>`
    },
    newsletter: {
      name: 'Monthly Newsletter',
      subject: 'This Month at [Business Name] 📰',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">This Month's Newsletter</h2>
        <div style="border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;"></div>
        
        <h3 style="color: #9333ea;">💅 Trending Nail Colors This Month</h3>
        <p>Check out the hottest nail trends that are dominating this season...</p>
        
        <h3 style="color: #9333ea;">✨ New Services Available</h3>
        <p>We're excited to announce new services now available at our salon...</p>
        
        <h3 style="color: #9333ea;">📅 Special Events & Promotions</h3>
        <ul>
          <li>Mother's Day Special - May 12th</li>
          <li>Bridal Package Discounts - All Month</li>
          <li>Student Discount Wednesdays</li>
        </ul>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4>💡 Nail Care Tip of the Month</h4>
          <p>Keep your cuticles healthy by applying cuticle oil daily. This simple step can make a huge difference in the health and appearance of your nails!</p>
        </div>
        
        <a href="[Booking Link]" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Your Next Visit</a>
      </div>`
    },
    reminder: {
      name: 'Appointment Reminder',
      subject: 'Reminder: Your appointment is tomorrow! ⏰',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Appointment Reminder</h2>
        <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
          <p><strong>We're looking forward to seeing you tomorrow!</strong></p>
          <p><strong>Date:</strong> [Appointment Date]<br>
          <strong>Time:</strong> [Appointment Time]<br>
          <strong>Service:</strong> [Service Name]<br>
          <strong>Duration:</strong> Approximately [Duration] minutes</p>
        </div>
        
        <h3>Before Your Visit:</h3>
        <ul>
          <li>Please arrive 5 minutes early</li>
          <li>Remove any existing nail polish</li>
          <li>Let us know if you have any allergies</li>
        </ul>
        
        <p>Need to reschedule? No problem! Just give us a call or click the link below.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="[Reschedule Link]" style="background-color: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Reschedule</a>
          <a href="[Cancel Link]" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Cancel</a>
        </div>
      </div>`
    }
  }

  const targetSegments = [
    { id: 'all_customers', name: 'All Customers', count: 245 },
    { id: 'new_customers', name: 'New Customers (Last 30 days)', count: 23 },
    { id: 'vip_customers', name: 'VIP Customers', count: 45 },
    { id: 'inactive_customers', name: 'Inactive Customers (60+ days)', count: 67 },
    { id: 'loyalty_members', name: 'Loyalty Program Members', count: 156 }
  ]

  const handleTemplateSelect = (templateType: Campaign['template_type']) => {
    const template = templates[templateType]
    setCampaign(prev => ({
      ...prev,
      template_type: templateType,
      name: template.name,
      subject: template.subject,
      content: template.content
    }))
  }

  const validateCampaign = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!campaign.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }
    
    if (!campaign.subject.trim()) {
      newErrors.subject = 'Email subject is required'
    }
    
    if (!campaign.content.trim()) {
      newErrors.content = 'Email content is required'
    }
    
    if (campaign.status === 'scheduled' && !campaign.scheduled_at) {
      newErrors.scheduled_at = 'Schedule date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (status: 'draft' | 'scheduled') => {
    const campaignToSave = { ...campaign, status }
    
    if (!validateCampaign()) {
      return
    }
    
    setSaving(true)
    try {
      await onSave(campaignToSave)
    } catch (error) {
      console.error('Failed to save campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Template
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(templates).map(([type, template]) => (
            <button
              key={type}
              onClick={() => handleTemplateSelect(type as Campaign['template_type'])}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                campaign.template_type === type
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">
                {type === 'welcome' && '👋'}
                {type === 'promotion' && '🎉'}
                {type === 'newsletter' && '📰'}
                {type === 'reminder' && '⏰'}
              </div>
              <div className="font-medium text-sm text-gray-900">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name
        </label>
        <input
          type="text"
          value={campaign.name}
          onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter campaign name..."
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Email Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Subject Line
        </label>
        <input
          type="text"
          value={campaign.subject}
          onChange={(e) => setCampaign(prev => ({ ...prev, subject: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter email subject..."
        />
        {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Use [Business Name] for dynamic business name replacement
        </p>
      </div>

      {/* Email Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Email Content
          </label>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
        
        {previewMode ? (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[300px]">
            <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
          </div>
        ) : (
          <textarea
            value={campaign.content}
            onChange={(e) => setCampaign(prev => ({ ...prev, content: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter email content (HTML supported)..."
          />
        )}
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>
    </div>
  )

  const renderRecipientsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Recipients</h3>
        <div className="space-y-3">
          {targetSegments.map((segment) => (
            <label
              key={segment.id}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="target_segment"
                value={segment.id}
                checked={campaign.target_segment === segment.id}
                onChange={(e) => setCampaign(prev => ({ ...prev, target_segment: e.target.value }))}
                className="text-purple-600 focus:ring-purple-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{segment.name}</span>
                  <span className="text-sm text-gray-500">{segment.count} recipients</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderScheduleTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Options</h3>
        <div className="space-y-4">
          <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="delivery"
              value="now"
              checked={campaign.status === 'draft'}
              onChange={() => setCampaign(prev => ({ ...prev, status: 'draft', scheduled_at: undefined }))}
              className="text-purple-600 focus:ring-purple-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">Send Later</div>
              <div className="text-sm text-gray-500">Save as draft and send manually</div>
            </div>
          </label>
          
          <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="delivery"
              value="scheduled"
              checked={campaign.status === 'scheduled'}
              onChange={() => setCampaign(prev => ({ ...prev, status: 'scheduled' }))}
              className="text-purple-600 focus:ring-purple-500 mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900">Schedule Send</div>
              <div className="text-sm text-gray-500 mb-3">Choose when to send this campaign</div>
              {campaign.status === 'scheduled' && (
                <input
                  type="datetime-local"
                  value={campaign.scheduled_at || ''}
                  onChange={(e) => setCampaign(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          </label>
        </div>
        {errors.scheduled_at && <p className="mt-1 text-sm text-red-600">{errors.scheduled_at}</p>}
      </div>
    </div>
  )

  const tabs = [
    { id: 'content' as const, name: 'Content', icon: DocumentTextIcon },
    { id: 'recipients' as const, name: 'Recipients', icon: UserGroupIcon },
    { id: 'schedule' as const, name: 'Schedule', icon: CalendarIcon }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {campaign.id ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <p className="text-gray-600">Design and schedule your email campaign</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 text-purple-700 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave(campaign.status === 'scheduled' ? 'scheduled' : 'draft')}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : campaign.status === 'scheduled' ? 'Schedule' : 'Save & Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'recipients' && renderRecipientsTab()}
          {activeTab === 'schedule' && renderScheduleTab()}
        </div>
      </div>
    </div>
  )
}