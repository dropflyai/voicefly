'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PaymentForm from '../../../../components/PaymentForm'
import PaymentConfirmation from '../../../../components/PaymentConfirmation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface AppointmentDetails {
  id: string
  customer_name: string
  customer_phone: string
  service_name: string
  date: string
  time: string
  duration: number
  total_amount: number
  business_name: string
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const appointmentId = searchParams.get('appointment')
  const customerId = searchParams.get('customer')
  const businessId = searchParams.get('business')
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [completedPaymentId, setCompletedPaymentId] = useState<string | null>(null)

  useEffect(() => {
    if (appointmentId && customerId && businessId) {
      loadAppointmentDetails()
    } else {
      setError('Missing required parameters')
      setLoading(false)
    }
  }, [appointmentId, customerId, businessId])

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/appointments/${appointmentId}?customerId=${customerId}&businessId=${businessId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load appointment details')
      }
      
      setAppointment(data.appointment)
    } catch (error: any) {
      console.error('Failed to load appointment:', error)
      setError(error.message)
      
      // Mock data for development
      setAppointment({
        id: appointmentId!,
        customer_name: 'Sarah Johnson',
        customer_phone: '(555) 123-4567',
        service_name: 'Full Set + Gel Polish',
        date: '2024-12-15',
        time: '14:30',
        duration: 90,
        total_amount: 5500,
        business_name: 'Glamour Nails & Spa'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentId: string) => {
    setCompletedPaymentId(paymentId)
    setPaymentSuccess(true)
    setPaymentError(null)
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setPaymentSuccess(false)
  }

  const handlePaymentRetry = () => {
    setPaymentError(null)
    setPaymentSuccess(false)
  }

  const handleClose = () => {
    if (paymentSuccess) {
      router.push('/dashboard/payments')
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Checkout</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
              <p className="text-sm text-gray-600">Secure checkout for your appointment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Appointment Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Business:</span>
                <span className="font-medium text-gray-900">{appointment.business_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{appointment.customer_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{appointment.service_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(appointment.date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">{appointment.time}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{appointment.duration} minutes</span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${(appointment.total_amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Payment Security:</strong> Your payment information is encrypted and secure. 
                We use industry-standard security measures to protect your data.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <PaymentForm
              amount={appointment.total_amount}
              appointmentId={appointment.id}
              customerId={customerId!}
              businessId={businessId!}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            
            {/* Security Badge */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>256-bit SSL encrypted</span>
                <span>•</span>
                <span>PCI DSS compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {(paymentSuccess || paymentError) && (
        <PaymentConfirmation
          success={paymentSuccess}
          amount={appointment.total_amount}
          paymentId={completedPaymentId}
          error={paymentError}
          onClose={handleClose}
          onRetry={handlePaymentRetry}
        />
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}