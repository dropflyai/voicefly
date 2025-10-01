'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCardIcon } from '@heroicons/react/24/outline'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  appointmentId: string
  customerId: string
  businessId: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

function PaymentFormInner({ amount, appointmentId, customerId, businessId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedProcessor, setSelectedProcessor] = useState<'stripe' | 'square'>('stripe')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsProcessing(true)
    
    try {
      // First, create payment intent on backend
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processor: selectedProcessor,
          amount,
          customerId,
          appointmentId,
          businessId
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      if (selectedProcessor === 'stripe') {
        // Handle Stripe payment
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) throw new Error('Card element not found')
        
        const { error: stripeError } = await stripe.confirmCardPayment(result.clientSecret, {
          payment_method: {
            card: cardElement
          }
        })
        
        if (stripeError) {
          throw new Error(stripeError.message)
        }
      }
      
      onSuccess(result.paymentId)
      
    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCardIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
        <p className="text-gray-600">Secure payment for your appointment</p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedProcessor('stripe')}
            className={`p-3 border-2 rounded-lg transition-colors ${
              selectedProcessor === 'stripe'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium">Credit Card</div>
              <div className="text-xs text-gray-500">Stripe</div>
            </div>
          </button>
          <button
            type="button" 
            onClick={() => setSelectedProcessor('square')}
            className={`p-3 border-2 rounded-lg transition-colors ${
              selectedProcessor === 'square'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium">Square</div>
              <div className="text-xs text-gray-500">Card/Digital</div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {selectedProcessor === 'stripe' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-lg">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#374151',
                      '::placeholder': {
                        color: '#9CA3AF',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-gray-500">
        🔒 Your payment information is secure and encrypted
      </div>
    </div>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  )
}