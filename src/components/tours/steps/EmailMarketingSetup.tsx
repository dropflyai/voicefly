'use client'

import React, { useState } from 'react'
import { EnvelopeIcon, SparklesIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface EmailMarketingSetupProps {
  planTier: 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

export default function EmailMarketingSetup({
  planTier,
  businessName,
  onStepComplete
}: EmailMarketingSetupProps) {
  const [campaignSettings, setCampaignSettings] = useState({
    welcomeSeries: true,
    appointmentReminders: true,
    promotionalEmails: true,
    loyaltyUpdates: true,
    frequency: 'weekly'
  })

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['welcome', 'birthday'])

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  const handleContinue = () => {
    onStepComplete()
  }

  const emailTemplates = [
    {
      id: 'welcome',
      name: 'Welcome New Customers',
      description: 'Sent automatically when customers book their first appointment',
      frequency: 'Triggered',
      openRate: '68%',
      popular: true
    },
    {
      id: 'birthday',
      name: 'Birthday Special Offers',
      description: 'Birthday discounts and special celebration offers',
      frequency: 'Monthly',
      openRate: '74%',
      popular: true
    },
    {
      id: 'winback',
      name: 'Win-Back Campaigns',
      description: 'Re-engage customers who haven\'t visited in 60+ days',
      frequency: 'Triggered',
      openRate: '45%',
      popular: false
    },
    {
      id: 'seasonal',
      name: 'Seasonal Promotions',
      description: 'Holiday and seasonal service promotions',
      frequency: 'Monthly',
      openRate: '52%',
      popular: true
    },
    {
      id: 'loyalty',
      name: 'Loyalty Milestone Rewards',
      description: 'Celebrate tier upgrades and point milestones',
      frequency: 'Triggered',
      openRate: '71%',
      popular: true
    },
    {
      id: 'referral',
      name: 'Referral Program Invites',
      description: 'Encourage customers to refer friends and family',
      frequency: 'Quarterly',
      openRate: '41%',
      popular: false
    }
  ]

  const tierFeatures = {
    professional: [
      'Automated email campaigns and sequences',
      'Professional branded email templates',
      'Customer segmentation and targeting',
      'Basic email analytics and performance tracking',
      'Birthday and loyalty celebration emails',
      'Win-back campaigns for inactive customers',
      'Up to 1,000 emails per month included'
    ],
    business: [
      'Multi-location email campaign management',
      'Advanced customer segmentation across locations',
      'A/B testing for email optimization',
      'Advanced email analytics and ROI tracking',
      'Custom email template builder',
      'Automated drip campaigns and sequences',
      'Enterprise email deliverability features',
      'Unlimited emails across all locations'
    ]
  }

  const marketingStats = [
    { metric: 'Average Open Rate', value: '58%', improvement: '+23% vs industry', icon: '📧' },
    { metric: 'Click-Through Rate', value: '12.4%', improvement: '+31% vs industry', icon: '🖱️' },
    { metric: 'Revenue per Email', value: '$3.42', improvement: '+45% ROI', icon: '💰' },
    { metric: 'Customer Retention', value: '+29%', improvement: 'With email vs without', icon: '🔄' }
  ]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <EnvelopeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Email Marketing Available
        </h3>
        <p className="text-gray-600">
          Stay connected with customers and drive repeat business through automated email campaigns.
        </p>
      </div>

      {/* Marketing Performance Stats */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">
          📊 Beauty Industry Email Performance:
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {marketingStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg font-bold text-green-600">{stat.value}</div>
              <div className="text-xs text-green-700">{stat.metric}</div>
              <div className="text-xs text-green-600 font-medium">{stat.improvement}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Templates */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">📋 Choose Your Email Campaigns:</h4>
        
        <div className="space-y-3">
          {emailTemplates.map((template) => (
            <div 
              key={template.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedTemplates.includes(template.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTemplateToggle(template.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template.id)}
                    onChange={() => handleTemplateToggle(template.id)}
                    className="mt-1"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      {template.popular && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>📅 {template.frequency}</span>
                      <span>📈 {template.openRate} open rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Settings */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">⚙️ Email Campaign Settings:</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-800 font-medium">Welcome Email Series</span>
              <p className="text-blue-700 text-xs">3-part series for new customers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={campaignSettings.welcomeSeries}
                onChange={(e) => setCampaignSettings(prev => ({ ...prev, welcomeSeries: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-800 font-medium">Appointment Reminders</span>
              <p className="text-blue-700 text-xs">24-hour email reminders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={campaignSettings.appointmentReminders}
                onChange={(e) => setCampaignSettings(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-blue-800">Promotional Email Frequency</span>
            <select
              value={campaignSettings.frequency}
              onChange={(e) => setCampaignSettings(prev => ({ ...prev, frequency: e.target.value }))}
              className="px-2 py-1 border border-blue-300 rounded text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Content Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">📧 Email Preview:</h4>
        
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-center mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold">
              {businessName.charAt(0)}
            </div>
            <h5 className="font-semibold text-gray-900">{businessName}</h5>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium">Welcome to {businessName}! 🎉</p>
            <p className="text-gray-600">
              Thank you for booking with us. We're excited to make your nails beautiful!
            </p>
            <div className="bg-blue-100 p-2 rounded text-center">
              <span className="text-blue-800 font-medium">🎁 10% off your next service</span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Automatically personalized with customer name and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Email Features:
        </h4>
        <ul className="text-purple-800 text-sm space-y-1">
          {tierFeatures[planTier].map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>

      {/* Setup Options */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Choose Your Setup Approach:</h4>
        
        <div className="space-y-3">
          <div className="border border-green-500 bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input type="radio" name="setup" value="now" defaultChecked />
              <div>
                <h5 className="font-semibold text-gray-900">🚀 Start Email Marketing Now</h5>
                <p className="text-gray-600 text-sm">
                  Activate selected campaigns immediately. First emails send within 24 hours.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input type="radio" name="setup" value="later" />
              <div>
                <h5 className="font-semibold text-gray-900">📅 Configure Later</h5>
                <p className="text-gray-600 text-sm">
                  Set up email campaigns from Settings → Marketing when ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-semibold text-yellow-800 mb-2">📋 What Happens Next:</h5>
        <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
          <li>Email campaigns activate with professional {businessName} branding</li>
          <li>Welcome series begins with new customer sign-ups</li>
          <li>Automated birthday and loyalty emails start sending</li>
          <li>Track email performance from Marketing → Analytics</li>
          <li>Adjust campaigns based on customer engagement</li>
        </ol>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Email marketing settings are always available in Settings → Marketing
        </p>
      </div>
    </div>
  )
}