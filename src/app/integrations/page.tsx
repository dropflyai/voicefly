"use client"

import { Zap, Check, Plus, Settings } from 'lucide-react'

export default function IntegrationsPage() {
  const integrations = [
    { name: 'CRM Systems', description: 'Connect with Salesforce, HubSpot, and more', status: 'available', connected: false },
    { name: 'Calendar Apps', description: 'Sync with Google Calendar, Outlook', status: 'available', connected: true },
    { name: 'Payment Processors', description: 'Stripe, PayPal, Square integration', status: 'available', connected: false },
    { name: 'Email Marketing', description: 'Mailchimp, Constant Contact, SendGrid', status: 'available', connected: true },
    { name: 'SMS Services', description: 'Twilio, AWS SNS integration', status: 'available', connected: true },
    { name: 'Analytics Tools', description: 'Google Analytics, Mixpanel', status: 'coming-soon', connected: false }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">Connect VoiceFly with your favorite tools and services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    {integration.connected && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                    )}
                  </div>
                </div>
                {integration.status === 'coming-soon' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="flex gap-2">
                {integration.connected ? (
                  <>
                    <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                    <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                      Disconnect
                    </button>
                  </>
                ) : integration.status === 'available' ? (
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    Connect
                  </button>
                ) : (
                  <button disabled className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Integrations</h3>
          <p className="text-gray-600 mb-4">
            Need a custom integration? Our API allows you to connect VoiceFly with any service.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View API Documentation
          </button>
        </div>
      </div>
    </div>
  )
}