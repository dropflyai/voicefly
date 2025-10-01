'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../../../components/Layout'
import { BusinessAPI } from '../../../../../lib/supabase'
import { getCurrentBusinessId } from '../../../../../lib/auth-utils'
import {
  ArrowLeftIcon,
  SparklesIcon,
  UserGroupIcon,
  CalendarIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

export default function NewCampaignPage() {
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form fields
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [segment, setSegment] = useState('all')
  const [content, setContent] = useState('')
  const [scheduleType, setScheduleType] = useState('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const businessId = getCurrentBusinessId() || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call the API to create and send campaign
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          businessId,
          campaignData: {
            name: campaignName,
            subject,
            segment,
            content,
            scheduleFor: scheduleType === 'later' ? `${scheduleDate} ${scheduleTime}` : null
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Campaign "${campaignName}" has been ${scheduleType === 'now' ? 'sent' : 'scheduled'} successfully!`)
        router.push('/dashboard/marketing/campaigns')
      } else {
        alert('Failed to create campaign. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Email template suggestions based on segment
  const getTemplateSuggestion = () => {
    switch(segment) {
      case 'new':
        return `Hi [CUSTOMER_NAME],

Welcome to our salon family! 🎉

As a special thank you for joining us, enjoy 20% off your next visit. We can't wait to pamper you!

Book your appointment:
📞 Call: (424) 351-9304
🌐 Online: [booking link]

See you soon!
[Your Salon Name]`
      
      case 'loyal':
        return `Dear [CUSTOMER_NAME],

Thank you for being such a valued customer! 💕

As one of our VIP clients, we wanted to give you exclusive early access to our new services and a special 15% loyalty discount valid all month.

Your loyalty points: [POINTS]
Your next reward: [REWARD]

Book your next appointment:
📞 (424) 351-9304

With appreciation,
[Your Salon Name]`
      
      case 'inactive':
        return `Hi [CUSTOMER_NAME],

We miss you! 😊

It's been a while since your last visit, and we'd love to welcome you back. Enjoy 25% off your next service as our way of saying "we've missed you!"

What's new:
• New luxury treatments
• Extended hours
• Online booking available

Ready to book? Call us at (424) 351-9304

Hope to see you soon!
[Your Salon Name]`
      
      default:
        return `Hi [CUSTOMER_NAME],

[Your message here]

Book your next appointment:
📞 (424) 351-9304

Best regards,
[Your Salon Name]`
    }
  }

  return (
    <Layout business={business}>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/marketing/campaigns')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Campaigns
          </button>
          
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Email Campaign</h1>
            <p className="text-gray-600 mt-1">Design and send a campaign to your customers</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Special Promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Internal name for your reference</p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., 🌟 20% Off All Services This Week!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">This is what customers will see in their inbox</p>
              </div>
            </div>
          </div>

          {/* Audience Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Select Audience
            </h2>
            
            <div className="space-y-3">
              {[
                { value: 'all', label: 'All Customers', description: 'Send to everyone in your database' },
                { value: 'new', label: 'New Customers', description: 'Customers who joined in the last 30 days' },
                { value: 'loyal', label: 'Loyal Customers', description: 'Customers with 5+ visits or Gold+ tier' },
                { value: 'inactive', label: 'Inactive Customers', description: 'Haven\'t visited in 60+ days' }
              ].map(option => (
                <label key={option.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="segment"
                    value={option.value}
                    checked={segment === option.value}
                    onChange={(e) => setSegment(e.target.value)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email Content Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Email Content</h2>
              <button
                type="button"
                onClick={() => setContent(getTemplateSuggestion())}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <SparklesIcon className="h-4 w-4 inline mr-1" />
                Use Template
              </button>
            </div>
            
            <textarea
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your email content here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Pro Tips:</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• Use [CUSTOMER_NAME] to personalize with customer's name</li>
                <li>• Use [POINTS] to show loyalty points balance</li>
                <li>• Keep it concise and include a clear call-to-action</li>
                <li>• Emojis can increase open rates by 20%</li>
              </ul>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Schedule Delivery
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={scheduleType === 'now'}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Send Now</div>
                  <div className="text-sm text-gray-500">Campaign will be sent immediately</div>
                </div>
              </label>
              
              <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="schedule"
                  value="later"
                  checked={scheduleType === 'later'}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Schedule for Later</div>
                  <div className="text-sm text-gray-500 mb-2">Choose a specific date and time</div>
                  
                  {scheduleType === 'later' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required={scheduleType === 'later'}
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required={scheduleType === 'later'}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Campaign Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Recipients:</span>
                <span className="font-medium">
                  {segment === 'all' ? 'All Customers' : 
                   segment === 'new' ? 'New Customers (30 days)' :
                   segment === 'loyal' ? 'Loyal Customers (5+ visits)' :
                   'Inactive Customers (60+ days)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated reach:</span>
                <span className="font-medium">
                  {segment === 'all' ? '~250' : 
                   segment === 'new' ? '~45' :
                   segment === 'loyal' ? '~85' :
                   '~120'} customers
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery:</span>
                <span className="font-medium">
                  {scheduleType === 'now' ? 'Immediate' : `${scheduleDate} at ${scheduleTime}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/marketing/campaigns')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !campaignName || !subject || !content}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
                  {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}