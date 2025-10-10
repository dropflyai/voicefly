'use client'

import { useState } from 'react'
import { X, Check, CreditCard, Zap, TrendingUp, Award } from 'lucide-react'
import { CREDIT_PACKS } from '@/lib/credit-system'

interface PurchaseCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  onPurchaseComplete?: () => void
}

export default function PurchaseCreditsModal({
  isOpen,
  onClose,
  businessId,
  onPurchaseComplete
}: PurchaseCreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async () => {
    if (!selectedPack) return

    setProcessing(true)
    setError(null)

    try {
      // Create Stripe checkout session for credit pack
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          pack_id: selectedPack
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { checkout_url } = await response.json()

      // Redirect to Stripe checkout
      window.location.href = checkout_url
    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'Failed to process purchase')
      setProcessing(false)
    }
  }

  const pack = CREDIT_PACKS.find(p => p.id === selectedPack)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Additional Credits</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Credits Never Expire
                </h3>
                <p className="text-sm text-blue-700">
                  Purchased credits roll over forever and are used after your monthly allocation runs out.
                  Buy in bulk to save up to 46%!
                </p>
              </div>
            </div>
          </div>

          {/* Credit Packs Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {CREDIT_PACKS.map((creditPack) => (
              <button
                key={creditPack.id}
                onClick={() => setSelectedPack(creditPack.id)}
                className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                  selectedPack === creditPack.id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Best Value Badge */}
                {creditPack.id === 'pack_large' && (
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    <Award className="h-3 w-3 inline mr-1" />
                    BEST VALUE
                  </div>
                )}

                {/* Pack Details */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {creditPack.name}
                    </h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {creditPack.credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">credits</div>
                  </div>

                  {selectedPack === creditPack.id && (
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(creditPack.price / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${creditPack.pricePerCredit.toFixed(3)} per credit
                  </div>
                </div>

                {/* Savings */}
                {creditPack.savings > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                    <div className="flex items-center text-green-700 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Save ${(creditPack.savings / 100).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Use Cases */}
                <div className="space-y-1.5 text-sm text-gray-600">
                  {creditPack.id === 'pack_small' && (
                    <>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~20 voice calls</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~4 deep research queries</span>
                      </div>
                    </>
                  )}
                  {creditPack.id === 'pack_medium' && (
                    <>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~100 voice calls</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~20 deep research queries</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~3 email campaigns (100 each)</span>
                      </div>
                    </>
                  )}
                  {creditPack.id === 'pack_large' && (
                    <>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~200 voice calls</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~40 deep research queries</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~6 email campaigns (100 each)</span>
                      </div>
                    </>
                  )}
                  {creditPack.id === 'pack_enterprise' && (
                    <>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~1,000 voice calls</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~200 deep research queries</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        <span>~33 email campaigns (100 each)</span>
                      </div>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Selected Pack Summary */}
          {pack && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">You're purchasing:</div>
                  <div className="text-lg font-bold text-gray-900">
                    {pack.credits.toLocaleString()} credits for ${(pack.price / 100).toFixed(2)}
                  </div>
                </div>
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            disabled={processing}
          >
            Cancel
          </button>

          <button
            onClick={handlePurchase}
            disabled={!selectedPack || processing}
            className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center ${
              selectedPack && !processing
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Purchase {pack ? `$${(pack.price / 100).toFixed(2)}` : 'Credits'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
