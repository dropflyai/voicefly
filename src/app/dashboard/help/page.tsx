'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { BusinessAPI, type Business } from '../../../lib/supabase'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import {
  QuestionMarkCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CogIcon,
  PuzzlePieceIcon,
  CreditCardIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import SupportAgent from '../../../components/SupportAgent'

const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpenIcon,
    articles: [
      {
        title: 'Quick Start Guide',
        content: 'Create your first phone employee, assign a phone number, and start receiving AI-handled calls in minutes.',
      },
      {
        title: 'How Phone Employees Work',
        content: 'Your AI phone employees answer calls 24/7, follow your instructions, take messages, book appointments, and more.',
      },
      {
        title: 'Understanding the Dashboard',
        content: 'The dashboard shows today\'s calls, messages, and employee activity at a glance.',
      },
    ],
  },
  {
    id: 'phone-employees',
    title: 'Phone Employees',
    icon: UserGroupIcon,
    articles: [
      {
        title: 'Creating a Phone Employee',
        content: 'Go to Phone Employees > Create New. Choose a job type (receptionist, order taker, appointment scheduler, etc.), give it a name, and configure its behavior.',
      },
      {
        title: 'Job Types Explained',
        content: 'Receptionist handles general calls and takes messages. Order Taker processes food/retail orders. Appointment Scheduler books calendar slots. Customer Service answers FAQs.',
      },
      {
        title: 'Assigning Phone Numbers',
        content: 'Each employee needs a VAPI phone number. This is provisioned automatically when you activate an employee.',
      },
    ],
  },
  {
    id: 'call-log',
    title: 'Call Log & Transcripts',
    icon: PhoneIcon,
    articles: [
      {
        title: 'Viewing Call History',
        content: 'The Call Log page shows all calls handled by your AI employees. Filter by employee, see call outcomes, and click any call to view the full transcript.',
      },
      {
        title: 'Call Outcomes',
        content: 'Completed (green) = call lasted 30+ seconds. Short (yellow) = call under 30 seconds. Live (blue) = currently in progress.',
      },
      {
        title: 'Reading Transcripts',
        content: 'Click any call row to open the detail panel. You\'ll see the caller, duration, summary, and full conversation transcript.',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: PuzzlePieceIcon,
    articles: [
      {
        title: 'Google Calendar',
        content: 'Share your Google Calendar with the VoiceFly service account, then enter your Calendar ID on the Integrations page. Your AI employees will check real availability before booking.',
      },
      {
        title: 'Calendly',
        content: 'Click "Authorize with Calendly" on the Integrations page. Once connected, your AI employees can check your Calendly availability and book appointments.',
      },
      {
        title: 'Square POS',
        content: 'Connect your Square account to let order-taker employees access your live menu and process orders during calls.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings & Configuration',
    icon: CogIcon,
    articles: [
      {
        title: 'Business Profile',
        content: 'Update your business name, phone number, and address from Settings > Business Profile.',
      },
      {
        title: 'Business Hours',
        content: 'Set your operating hours so your AI employees know when you\'re open and can inform callers accordingly.',
      },
      {
        title: 'Notifications',
        content: 'Configure email and SMS alerts for new bookings, cancellations, and daily/weekly reports.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Plans',
    icon: CreditCardIcon,
    articles: [
      {
        title: 'Plans Overview',
        content: 'Starter ($49/mo) includes 60 voice minutes, 1 AI employee, and 1 phone number. Growth ($129/mo) includes 250 minutes, 3 employees, and 3 phone numbers. Pro ($249/mo) includes 750 minutes, 5 employees, and 5 phone numbers.',
      },
      {
        title: 'Upgrading Your Plan',
        content: 'Go to Billing and click "Upgrade to Pro". You\'ll be redirected to Stripe Checkout to enter your payment details.',
      },
      {
        title: 'Cancelling',
        content: 'You can cancel anytime from the Billing page. You\'ll retain access until the end of your billing period.',
      },
    ],
  },
]

function HelpPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started')

  useEffect(() => {
    const businessId = getCurrentBusinessId()
    if (businessId) {
      BusinessAPI.getBusiness(businessId).then(b => { if (b) setBusiness(b) })
    }
  }, [])

  return (
    <Layout business={business}>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <QuestionMarkCircleIcon className="h-7 w-7 text-brand-primary" />
            <h1 className="text-2xl font-bold text-text-primary">Help Center</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Learn how to get the most out of VoiceFly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles */}
          <div className="lg:col-span-2 space-y-3">
            {helpSections.map((section) => {
              const Icon = section.icon
              const isExpanded = expandedSection === section.id

              return (
                <div key={section.id} className="bg-surface-low rounded-lg border border-[rgba(65,71,84,0.15)]">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-primary/5 rounded-lg">
                        <Icon className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
                        <p className="text-xs text-text-secondary">{section.articles.length} articles</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-text-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-2">
                      {section.articles.map((article, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-surface border border-[rgba(65,71,84,0.1)]"
                        >
                          <h3 className="text-sm font-medium text-text-primary mb-1">{article.title}</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">{article.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <SupportAgent businessId={business?.id || null} />

            <div className="bg-surface-low rounded-lg border border-[rgba(65,71,84,0.15)] p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Still need help?</h3>
              <a
                href="mailto:support@voiceflyai.com"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors border border-[rgba(65,71,84,0.1)]"
              >
                <EnvelopeIcon className="h-5 w-5 text-brand-primary" />
                <div>
                  <span className="text-sm font-medium text-text-primary block">Email Support</span>
                  <span className="text-xs text-text-secondary">support@voiceflyai.com</span>
                </div>
              </a>
            </div>

            <div className="bg-brand-primary/5 rounded-lg p-5 border border-blue-100">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Quick Tips</h3>
              <ul className="space-y-2 text-xs text-text-primary">
                <li>Start with a Receptionist employee to handle general calls</li>
                <li>Connect Google Calendar so your AI can book real appointments</li>
                <li>Check the Call Log daily to review how your AI is performing</li>
                <li>Use the transcript viewer to spot areas for improvement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function ProtectedHelpPage() {
  return (
    <ProtectedRoute>
      <HelpPage />
    </ProtectedRoute>
  )
}
