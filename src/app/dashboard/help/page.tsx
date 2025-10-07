"use client"

import { useState } from 'react'
import {
  BookOpen,
  Video,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react'

export default function HelpCenter() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started')
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      articles: [
        {
          title: 'Quick Start Guide',
          content: 'Learn the basics of VoiceFly in 5 minutes',
          link: '#quick-start'
        },
        {
          title: 'Setting Up Your First Campaign',
          content: 'Step-by-step guide to creating your first voice AI campaign',
          link: '#first-campaign'
        },
        {
          title: 'Importing Your Contacts',
          content: 'How to add customers and manage your contact database',
          link: '#import-contacts'
        }
      ]
    },
    {
      id: 'voice-ai',
      title: 'Voice AI Setup',
      icon: Phone,
      articles: [
        {
          title: 'Configuring Your AI Voice',
          content: 'Customize tone, personality, and conversation style',
          link: '#voice-config'
        },
        {
          title: 'Phone Number Setup',
          content: 'Connect your business phone number to VoiceFly',
          link: '#phone-setup'
        },
        {
          title: 'Call Scripts & Templates',
          content: 'Create effective conversation flows for your AI',
          link: '#call-scripts'
        }
      ]
    },
    {
      id: 'services',
      title: 'Managing Services',
      icon: BookOpen,
      articles: [
        {
          title: 'Adding Services',
          content: 'Create and customize services for your business',
          link: '#add-services'
        },
        {
          title: 'Pricing & Duration',
          content: 'Set up service pricing and appointment durations',
          link: '#pricing'
        },
        {
          title: 'Service Categories',
          content: 'Organize services by category for easier booking',
          link: '#categories'
        }
      ]
    },
    {
      id: 'appointments',
      title: 'Appointments & Scheduling',
      icon: BookOpen,
      articles: [
        {
          title: 'Viewing Your Calendar',
          content: 'Navigate your appointment dashboard',
          link: '#calendar'
        },
        {
          title: 'Managing Bookings',
          content: 'Confirm, reschedule, or cancel appointments',
          link: '#manage-bookings'
        },
        {
          title: 'Automated Reminders',
          content: 'Set up SMS and voice reminders for clients',
          link: '#reminders'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      icon: BookOpen,
      articles: [
        {
          title: 'Understanding Your Dashboard',
          content: 'Key metrics and what they mean for your business',
          link: '#dashboard-metrics'
        },
        {
          title: 'Call Performance Reports',
          content: 'Track AI call success rates and outcomes',
          link: '#call-reports'
        },
        {
          title: 'Revenue Tracking',
          content: 'Monitor bookings and revenue trends',
          link: '#revenue'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Help Center
          </h1>
          <p className="text-gray-600 mb-6">
            Find answers, learn best practices, and get the most out of VoiceFly
          </p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {helpSections.map((section) => {
              const Icon = section.icon
              const isExpanded = expandedSection === section.id

              return (
                <div key={section.id} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {section.title}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {section.articles.length} articles
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3">
                      {section.articles.map((article, index) => (
                        <a
                          key={index}
                          href={article.link}
                          className="block p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {article.content}
                          </p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Need More Help?
              </h3>
              <div className="space-y-3">
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Video Tutorials
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href="mailto:support@voiceflyai.com"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Email Support
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href="tel:+15551234567"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Call Support
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Popular Topics */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Popular Right Now
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    How to add my first service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    Setting up voice AI personality
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    Importing customer contacts
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    Understanding analytics dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Support Hours
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Monday - Friday:</strong><br />
                  9:00 AM - 6:00 PM EST
                </p>
                <p>
                  <strong>Saturday - Sunday:</strong><br />
                  10:00 AM - 4:00 PM EST
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Average response time: &lt;2 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
