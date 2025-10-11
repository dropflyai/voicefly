'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  priceId: string
  planName: string
  businessId?: string
  className?: string
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function CheckoutButton({
  priceId,
  planName,
  businessId,
  className,
  children,
  variant = 'primary'
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName,
          businessId: businessId || `user-${Date.now()}`, // Generate temp ID if not provided
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-pink-600 hover:bg-pink-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`
          inline-flex items-center justify-center
          px-8 py-4 rounded-lg font-semibold
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${className || ''}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Creating checkout...
          </>
        ) : (
          children || `Try ${planName} Free for 14 Days`
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {!error && !loading && (
        <p className="text-sm text-gray-500 text-center">
          No credit card required • Cancel anytime
        </p>
      )}
    </div>
  )
}
