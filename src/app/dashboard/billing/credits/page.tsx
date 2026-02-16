'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import CreditMeter from '@/components/CreditMeter'
import PurchaseCreditsModal from '@/components/PurchaseCreditsModal'
import { getCurrentBusinessId } from '@/lib/auth-utils'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function CreditsPageContent() {
  const searchParams = useSearchParams()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    const id = getCurrentBusinessId()
    setBusinessId(id)

    // Check for success message from Stripe redirect
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Billing
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Voice Minutes</h1>
            <p className="text-gray-600 mt-2">
              Additional voice minutes for your VoiceFly account. Minutes never expire and roll over forever.
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Minutes Purchased Successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your minutes have been added to your account. They'll appear in your balance within a few seconds.
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

          {/* Purchase Button */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Purchase More Minutes?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Choose from our flexible minute packs below. All minutes never expire and can be used for VoiceFly voice AI.
            </p>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              View Minute Packs
            </button>
          </div>

          {/* How Minutes Work */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6">How Voice Minutes Work</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">1 min</div>
                <div className="text-sm text-gray-500 mb-3">= 1 voice minute</div>
                <h4 className="font-semibold text-gray-900 mb-2">Inbound Calls</h4>
                <p className="text-sm text-gray-600">
                  Receive and handle customer calls with Maya AI
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">1.6 min</div>
                <div className="text-sm text-gray-500 mb-3">= 1 voice minute</div>
                <h4 className="font-semibold text-gray-900 mb-2">Outbound Calls</h4>
                <p className="text-sm text-gray-600">
                  Proactive calling campaigns to leads and customers
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">5 min</div>
                <div className="text-sm text-gray-500 mb-3">equivalent</div>
                <h4 className="font-semibold text-gray-900 mb-2">Deep Research</h4>
                <p className="text-sm text-gray-600">
                  Comprehensive market analysis and competitive research
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">2 min</div>
                <div className="text-sm text-gray-500 mb-3">equivalent</div>
                <h4 className="font-semibold text-gray-900 mb-2">Quick Research</h4>
                <p className="text-sm text-gray-600">
                  Fast market insights and data analysis
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">3 min</div>
                <div className="text-sm text-gray-500 mb-3">per 100 contacts</div>
                <h4 className="font-semibold text-gray-900 mb-2">Email Campaign</h4>
                <p className="text-sm text-gray-600">
                  Send bulk email campaigns to your customer base
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">~0.5 min</div>
                <div className="text-sm text-gray-500 mb-3">equivalent</div>
                <h4 className="font-semibold text-gray-900 mb-2">Appointment Booking</h4>
                <p className="text-sm text-gray-600">
                  Schedule appointments with customers
                </p>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Purchase History</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pack
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Minutes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={5}>
                      No purchases yet. Click "View Minute Packs" above to get started.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        <PurchaseCreditsModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          businessId={businessId}
          onPurchaseComplete={() => {
            setShowPurchaseModal(false)
            // Refresh page to show updated balance
            window.location.reload()
          }}
        />
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
