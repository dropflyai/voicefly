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
              className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Billing
            </Link>
            <h1 className="text-3xl font-bold text-text-primary">Voice Minutes</h1>
            <p className="text-text-secondary mt-2">
              Track your voice minute usage across your VoiceFly account.
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Minutes Added Successfully!
                  </h3>
                  <p className="text-sm text-emerald-500">
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
            <h3 className="text-xl font-bold text-text-primary mb-6">How Minutes Are Used</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-surface-low border border-[rgba(65,71,84,0.15)] rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Phone className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">1 min</div>
                    <div className="text-xs text-text-secondary">= 1 voice minute</div>
                  </div>
                </div>
                <h4 className="font-semibold text-text-primary mb-1">Inbound Calls</h4>
                <p className="text-sm text-text-secondary">
                  Receive and handle customer calls with Maya AI
                </p>
              </div>

              <div className="bg-surface-low border border-[rgba(65,71,84,0.15)] rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mr-3">
                    <PhoneOutgoing className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">1.6 min</div>
                    <div className="text-xs text-text-secondary">= 1 voice minute</div>
                  </div>
                </div>
                <h4 className="font-semibold text-text-primary mb-1">Outbound Calls</h4>
                <p className="text-sm text-text-secondary">
                  Proactive calling campaigns to leads and customers
                </p>
              </div>

              <div className="bg-surface-low border border-[rgba(65,71,84,0.15)] rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">~0.1 min</div>
                    <div className="text-xs text-text-secondary">per message</div>
                  </div>
                </div>
                <h4 className="font-semibold text-text-primary mb-1">SMS Messages</h4>
                <p className="text-sm text-text-secondary">
                  AI-powered text conversations and appointment confirmations
                </p>
              </div>
            </div>
          </div>

          {/* Need More Minutes */}
          <div className="mt-8 bg-surface border border-[rgba(65,71,84,0.15)] rounded-lg p-6 text-center">
            <p className="text-sm text-text-secondary mb-3">
              Minutes are included with your plan and reset monthly.
              Need more? Upgrade your plan for additional minutes.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-4 py-2 bg-brand-primary hover:bg-[#0060d0] text-white rounded-lg transition-colors text-sm font-medium"
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
