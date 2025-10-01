'use client'

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface PaymentConfirmationProps {
  success: boolean
  amount?: number
  paymentId?: string  
  error?: string
  onClose: () => void
  onRetry?: () => void
}

export default function PaymentConfirmation({ 
  success, 
  amount, 
  paymentId, 
  error, 
  onClose, 
  onRetry 
}: PaymentConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {success ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">Payment Successful!</h2>
              <div className="mb-6">
                <div className="text-gray-600 mb-2">Amount Paid:</div>
                <div className="text-3xl font-bold text-green-600">${((amount || 0) / 100).toFixed(2)}</div>
                {paymentId && (
                  <div className="mt-2 text-xs text-gray-500">
                    Payment ID: {paymentId}
                  </div>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-green-700">
                  ✅ Your appointment is confirmed and paid for!<br />
                  📧 You'll receive a confirmation email shortly.<br />
                  📱 Check your phone for SMS confirmation.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircleIcon className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">Payment Failed</h2>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-red-700">
                  ❌ {error || 'There was an issue processing your payment.'}
                </p>
              </div>
            </>
          )}

          <div className="space-y-3">
            {success ? (
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={onRetry}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}