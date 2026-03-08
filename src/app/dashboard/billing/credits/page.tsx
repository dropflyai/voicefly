'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import CreditMeter from '@/components/CreditMeter'
import { getCurrentBusinessId } from '@/lib/auth-utils'
import { CheckCircle, ArrowLeft, Phone, PhoneOutgoing, MessageSquare } from 'lucide-react'
import Link from 'next/link'

function CreditsPageContent() {
  const searchParams = useSearchParams()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    const id = getCurrentBusinessId()
    setBusinessId(id)

    if (searchParams.get('credits_purchased') === 'true' || searchParams.get('minutes_purchased') === 'true') {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [searchParams])

  if (!businessId) {
    return (
      <ProtectedRoute>
        <Layout business={null}>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout business={null}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Billing
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Voice Minutes</h1>
            <p className="text-gray-600 mt-2">
              Track your voice minute usage across your VoiceFly account.
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Minutes Added Successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your minutes have been added to your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Credit Meter - Full View */}
          <div className="mb-8">
            <CreditMeter
              businessId={businessId}
              compact={false}
              showPurchaseButton={false}
            />
          </div>

          {/* How Minutes Are Used */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">How Minutes Are Used</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1 min</div>
                    <div className="text-xs text-gray-500">= 1 voice minute</div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Inbound Calls</h4>
                <p className="text-sm text-gray-600">
                  Receive and handle customer calls with Maya AI
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <PhoneOutgoing className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1.6 min</div>
                    <div className="text-xs text-gray-500">= 1 voice minute</div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Outbound Calls</h4>
                <p className="text-sm text-gray-600">
                  Proactive calling campaigns to leads and customers
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">~0.1 min</div>
                    <div className="text-xs text-gray-500">per message</div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">SMS Messages</h4>
                <p className="text-sm text-gray-600">
                  AI-powered text conversations and appointment confirmations
                </p>
              </div>
            </div>
          </div>

          {/* Need More Minutes */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Minutes are included with your plan and reset monthly.
              Need more? Upgrade your plan for additional minutes.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              View Plans
            </Link>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default function CreditsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <Layout business={null}>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    }>
      <CreditsPageContent />
    </Suspense>
  )
}
