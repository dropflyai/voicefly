'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { PaymentAPIImpl } from '../lib/supabase'
import type { Appointment } from '../lib/supabase-types-mvp'

interface PaymentStatusModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onPaymentProcessed: (paymentData: any) => void
  isLoading?: boolean
}

interface PaymentData {
  amount: number
  tipAmount: number
  paymentMethod: 'card' | 'cash'
  processorType?: 'square' | 'stripe'
  taxAmount: number
  totalAmount: number
}

export default function PaymentStatusModal({
  appointment,
  isOpen,
  onClose,
  onPaymentProcessed,
  isLoading = false
}: PaymentStatusModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    tipAmount: 0,
    paymentMethod: 'card',
    processorType: 'square',
    taxAmount: 0,
    totalAmount: 0
  })
  const [tipPercentage, setTipPercentage] = useState<number>(18)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const TAX_RATE = 0.0875 // 8.75% tax rate

  // Initialize payment data when appointment changes
  useEffect(() => {
    if (appointment && isOpen) {
      const baseAmount = appointment.total_amount ? appointment.total_amount / 100 : 55 // Convert from cents or default
      const taxAmount = Math.round(baseAmount * TAX_RATE * 100) / 100
      const tipAmount = Math.round(baseAmount * (tipPercentage / 100) * 100) / 100
      const totalAmount = Math.round((baseAmount + taxAmount + tipAmount) * 100) / 100

      setPaymentData({
        amount: baseAmount,
        tipAmount,
        paymentMethod: 'card',
        processorType: 'square',
        taxAmount,
        totalAmount
      })
      setErrors({})
      setProcessingStatus('idle')
    }
  }, [appointment, isOpen, tipPercentage])

  // Recalculate total when tip changes
  useEffect(() => {
    if (paymentData.amount > 0) {
      const tipAmount = Math.round(paymentData.amount * (tipPercentage / 100) * 100) / 100
      const totalAmount = Math.round((paymentData.amount + paymentData.taxAmount + tipAmount) * 100) / 100
      
      setPaymentData(prev => ({
        ...prev,
        tipAmount,
        totalAmount
      }))
    }
  }, [tipPercentage, paymentData.amount, paymentData.taxAmount])

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (paymentData.amount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0'
    }

    if (paymentData.tipAmount < 0) {
      newErrors.tipAmount = 'Tip amount cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProcessPayment = async () => {
    if (!appointment || !validatePayment()) return

    try {
      setIsProcessing(true)
      setProcessingStatus('processing')

      const paymentAPI = new PaymentAPIImpl()
      
      // Convert amounts to cents for API
      const paymentRequest = {
        appointment_id: appointment.id,
        customer_id: appointment.customer_id,
        business_id: appointment.business_id,
        location_id: appointment.location_id,
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        tip_amount: Math.round(paymentData.tipAmount * 100),
        tax_amount: Math.round(paymentData.taxAmount * 100),
        total_amount: Math.round(paymentData.totalAmount * 100),
        currency: 'USD',
        payment_method: paymentData.paymentMethod,
        processor_type: (paymentData.paymentMethod === 'cash' ? 'cash' : paymentData.processorType) as 'square' | 'stripe' | 'cash',
        description: `Payment for ${appointment.service?.name || 'Service'}`,
        payment_method_details: paymentData.paymentMethod === 'cash' ? { type: 'cash' } : undefined
      }

      const payment = await paymentAPI.createPayment(paymentRequest)
      
      setProcessingStatus('success')
      setTimeout(() => {
        onPaymentProcessed(payment)
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Payment processing failed:', error)
      setProcessingStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCustomTipAmount = (amount: string) => {
    const customTip = parseFloat(amount) || 0
    if (paymentData.amount > 0) {
      const percentage = (customTip / paymentData.amount) * 100
      setTipPercentage(percentage)
    }
  }

  const handleGenerateReceipt = () => {
    // In a real implementation, this would generate and download a receipt
    console.log('Generating receipt for payment:', paymentData)
    alert('Receipt generation would be implemented here')
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Process Payment</h3>
                <p className="text-sm text-gray-500">
                  {appointment.customer?.first_name} {appointment.customer?.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {processingStatus === 'processing' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-blue-700">Processing payment...</p>
              </div>
            </div>
          )}

          {processingStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="ml-3 text-green-700">Payment processed successfully!</p>
              </div>
            </div>
          )}

          {processingStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <p className="ml-3 text-red-700">Payment processing failed. Please try again.</p>
              </div>
            </div>
          )}

          {processingStatus === 'idle' && (
            <div className="space-y-6">
              {/* Service Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>{appointment.service?.name || 'Service'}</span>
                    <span>${paymentData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                    <span>${paymentData.taxAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentData.paymentMethod === 'card'}
                      onChange={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'card' }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      disabled={isProcessing}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <CreditCardIcon className="h-4 w-4 mr-1" />
                      Card
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={paymentData.paymentMethod === 'cash'}
                      onChange={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      disabled={isProcessing}
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <BanknotesIcon className="h-4 w-4 mr-1" />
                      Cash
                    </span>
                  </label>
                </div>
              </div>

              {/* Card Processor Selection */}
              {paymentData.paymentMethod === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Processor
                  </label>
                  <select
                    value={paymentData.processorType}
                    onChange={(e) => setPaymentData(prev => ({ 
                      ...prev, 
                      processorType: e.target.value as 'square' | 'stripe' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    disabled={isProcessing}
                  >
                    <option value="square">Square</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
              )}

              {/* Tip Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tip Amount
                </label>
                
                {/* Preset Tip Percentages */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[15, 18, 20, 25].map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => setTipPercentage(percentage)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        tipPercentage === percentage
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isProcessing}
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>

                {/* Custom Tip Amount */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Custom:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentData.tipAmount.toFixed(2)}
                      onChange={(e) => handleCustomTipAmount(e.target.value)}
                      className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                {errors.tipAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipAmount}</p>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-green-900">Total Amount</span>
                  <span className="text-xl font-bold text-green-900">
                    ${paymentData.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Service ${paymentData.amount.toFixed(2)} + Tax ${paymentData.taxAmount.toFixed(2)} + Tip ${paymentData.tipAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            {processingStatus === 'success' && (
              <button
                onClick={handleGenerateReceipt}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Generate Receipt
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {processingStatus === 'success' ? 'Done' : 'Cancel'}
            </button>
            
            {processingStatus === 'idle' && (
              <button
                onClick={handleProcessPayment}
                disabled={isProcessing || !validatePayment()}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : `Process $${paymentData.totalAmount.toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}