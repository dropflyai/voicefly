'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import PaymentStatusBadge from './PaymentStatusBadge'

interface Payment {
  id: string
  total_amount: number
  processor_type: 'stripe' | 'square'
  status: 'processing' | 'completed' | 'failed' | 'refunded'
  transaction_id: string
  created_at: string
  customer_name?: string
  service_name?: string
  appointment_date?: string
}

interface PaymentHistoryProps {
  businessId: string
  customerId?: string
  limit?: number
  showCustomerInfo?: boolean
}

export default function PaymentHistory({ 
  businessId, 
  customerId, 
  limit = 10,
  showCustomerInfo = true 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [businessId, customerId])

  const loadPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        businessId,
        ...(customerId && { customerId }),
        limit: limit.toString()
      })
      
      const response = await fetch(`/api/payments/history?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment history')
      }
      
      setPayments(data.payments || [])
    } catch (error: any) {
      console.error('Failed to load payment history:', error)
      setError(error.message)
      // Mock data for development
      setPayments([
        {
          id: '1',
          total_amount: 5000,
          processor_type: 'stripe',
          status: 'completed',
          transaction_id: 'pi_1234567890',
          created_at: '2024-12-01T14:30:00Z',
          customer_name: 'Sarah Johnson',
          service_name: 'Full Set + Gel Polish',
          appointment_date: '2024-12-01'
        },
        {
          id: '2',
          total_amount: 3500,
          processor_type: 'square',
          status: 'processing',
          transaction_id: 'sq_1234567890',
          created_at: '2024-12-01T10:15:00Z',
          customer_name: 'Maria Garcia',
          service_name: 'Manicure',
          appointment_date: '2024-12-01'
        },
        {
          id: '3',
          total_amount: 4200,
          processor_type: 'stripe',
          status: 'failed',
          transaction_id: 'pi_0987654321',
          created_at: '2024-11-30T16:45:00Z',
          customer_name: 'Jennifer Lee',
          service_name: 'Pedicure + Polish',
          appointment_date: '2024-11-30'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
      case 'refunded':
        return <ArrowPathIcon className="w-5 h-5 text-gray-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getProcessorLogo = (processor: string) => {
    switch (processor) {
      case 'stripe':
        return (
          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
            S
          </div>
        )
      case 'square':
        return (
          <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
            □
          </div>
        )
      default:
        return <CreditCardIcon className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading payment history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPayments}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment history yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Payments will appear here once customers complete their bookings
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        <p className="text-sm text-gray-500 mt-1">
          Recent transactions and payment status
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(payment.status)}
                  {getProcessorLogo(payment.processor_type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">
                      ${(payment.total_amount / 100).toFixed(2)}
                    </span>
                    <PaymentStatusBadge status={payment.status === 'completed' ? 'paid' : payment.status as any} />
                  </div>
                  
                  {showCustomerInfo && payment.customer_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      {payment.customer_name}
                      {payment.service_name && (
                        <span className="text-gray-400"> • {payment.service_name}</span>
                      )}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                    <span>{new Date(payment.created_at).toLocaleTimeString()}</span>
                    <span className="font-mono">{payment.transaction_id.slice(-8)}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {payment.appointment_date && (
                  <p className="text-xs text-gray-500">
                    Appointment: {new Date(payment.appointment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {payments.length >= limit && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => {/* TODO: Load more payments */}}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            Load More Payments
          </button>
        </div>
      )}
    </div>
  )
}