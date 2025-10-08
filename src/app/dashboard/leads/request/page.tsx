'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../../components/Layout'
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UsersIcon,
  BriefcaseIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { clsx } from 'clsx'

interface LeadRequestForm {
  industry: string[]
  location: {
    city: string
    state: string
    country: string
  }
  companySize: {
    min: number
    max: number
  }
  jobTitles: string[]
  keywords: string[]
  limit: number
}

const INDUSTRIES = [
  'Dental', 'Medical', 'Chiropractic', 'Physical Therapy',
  'Beauty & Spa', 'Massage', 'Hair Salon', 'Nail Salon',
  'Automotive', 'Real Estate', 'Legal', 'Accounting',
  'Fitness', 'Veterinary', 'Home Services', 'Other'
]

const JOB_TITLES = [
  'Owner', 'CEO', 'President', 'Manager', 'Director',
  'Practice Manager', 'Office Manager', 'Partner', 'Principal'
]

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
]

export default function RequestLeadsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [quota, setQuota] = useState({ monthly: 100, used: 50, remaining: 50 })

  const [formData, setFormData] = useState<LeadRequestForm>({
    industry: [],
    location: { city: '', state: 'Texas', country: 'USA' },
    companySize: { min: 1, max: 50 },
    jobTitles: ['Owner', 'CEO'],
    keywords: [],
    limit: 50
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Call API
      const response = await fetch('/api/leads/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'demo-business-id', // TODO: Get from auth
          criteria: formData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request leads')
      }

      const result = await response.json()

      // Success! Redirect to leads page
      router.push('/dashboard/leads')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request leads')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industry: prev.industry.includes(industry)
        ? prev.industry.filter(i => i !== industry)
        : [...prev.industry, industry]
    }))
  }

  const toggleJobTitle = (title: string) => {
    setFormData(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(title)
        ? prev.jobTitles.filter(t => t !== title)
        : [...prev.jobTitles, title]
    }))
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Leads
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Request New Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tell us what kind of leads you're looking for and we'll deliver AI-researched prospects with auto-generated campaigns
          </p>
        </div>

        {/* Quota Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Monthly Lead Quota</h3>
              <p className="text-sm text-blue-700 mt-1">
                {quota.remaining} of {quota.monthly} leads remaining this month
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">{quota.remaining}</div>
              <div className="text-sm text-blue-600">available</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(quota.used / quota.monthly) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BuildingOfficeIcon className="inline h-5 w-5 mr-1" />
              Industry *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {INDUSTRIES.map(industry => (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggleIndustry(industry)}
                  className={clsx(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    formData.industry.includes(industry)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  )}
                >
                  {formData.industry.includes(industry) && (
                    <CheckCircleIcon className="inline h-4 w-4 mr-1" />
                  )}
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="inline h-5 w-5 mr-1" />
              Location
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City (optional)</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  placeholder="Dallas, Austin, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">State *</label>
                <select
                  value={formData.location.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, state: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UsersIcon className="inline h-5 w-5 mr-1" />
              Company Size (Employees)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                <input
                  type="number"
                  value={formData.companySize.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    companySize: { ...prev.companySize, min: parseInt(e.target.value) }
                  }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                <input
                  type="number"
                  value={formData.companySize.max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    companySize: { ...prev.companySize, max: parseInt(e.target.value) }
                  }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BriefcaseIcon className="inline h-5 w-5 mr-1" />
              Target Job Titles *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {JOB_TITLES.map(title => (
                <button
                  key={title}
                  type="button"
                  onClick={() => toggleJobTitle(title)}
                  className={clsx(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    formData.jobTitles.includes(title)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  )}
                >
                  {formData.jobTitles.includes(title) && (
                    <CheckCircleIcon className="inline h-4 w-4 mr-1" />
                  )}
                  {title}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Leads */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SparklesIcon className="inline h-5 w-5 mr-1" />
              How many leads do you need?
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max={quota.remaining}
                step="10"
                value={formData.limit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  limit: parseInt(e.target.value)
                }))}
                className="flex-1"
              />
              <div className="text-center min-w-[80px]">
                <div className="text-3xl font-bold text-blue-600">{formData.limit}</div>
                <div className="text-xs text-gray-500">leads</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Each lead will be researched by AI and segmented into cold/warm/hot with auto-generated campaigns
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Request Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Estimated processing time: 2-5 minutes
            </div>
            <button
              type="submit"
              disabled={isSubmitting || formData.industry.length === 0 || formData.jobTitles.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Processing...' : `Request ${formData.limit} Leads`}
            </button>
          </div>
        </form>

        {/* What Happens Next */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">We search Apollo.io</p>
                <p className="text-xs text-gray-600">Find {formData.limit} companies matching your criteria</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">DeepSeek-R1 AI researches each lead</p>
                <p className="text-xs text-gray-600">Analyzes pain points, buying signals, competitors, news</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-segment & create campaigns</p>
                <p className="text-xs text-gray-600">Cold → Email campaigns, Warm/Hot → Voice campaigns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ready to approve & launch!</p>
                <p className="text-xs text-gray-600">Review campaigns and click approve to start nurturing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
