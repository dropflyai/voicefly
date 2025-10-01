'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  GiftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import type { LoyaltyCustomer } from '../lib/supabase-types-mvp'

interface CustomerPointsModalProps {
  customer: LoyaltyCustomer | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (customerId: string, pointsChange: number, reason: string) => Promise<void>
  isLoading?: boolean
}

export default function CustomerPointsModal({
  customer,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CustomerPointsModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [pointsAmount, setPointsAmount] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen && customer) {
      setAdjustmentType('add')
      setPointsAmount('')
      setReason('')
      setErrors({})
    }
  }, [isOpen, customer])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!pointsAmount || parseFloat(pointsAmount) <= 0) {
      newErrors.pointsAmount = 'Please enter a valid number of points'
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for this adjustment'
    }

    if (adjustmentType === 'subtract' && customer) {
      const subtractAmount = parseFloat(pointsAmount)
      if (subtractAmount > customer.total_points) {
        newErrors.pointsAmount = `Cannot subtract more than ${customer.total_points} points`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customer || !validateForm()) return

    try {
      const pointsChange = adjustmentType === 'add' 
        ? parseFloat(pointsAmount) 
        : -parseFloat(pointsAmount)
      
      await onSubmit(customer.id, pointsChange, reason)
    } catch (error) {
      console.error('Failed to adjust points:', error)
    }
  }

  const getPresetReasons = () => {
    return adjustmentType === 'add' ? [
      'Bonus points promotion',
      'Customer service recovery',
      'Birthday bonus',
      'Referral reward',
      'Special event bonus',
      'Manual correction'
    ] : [
      'Points redemption',
      'Manual correction',
      'Account adjustment',
      'Expired points removal',
      'System error correction'
    ]
  }

  if (!isOpen || !customer) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GiftIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Adjust Points
                </h3>
                <p className="text-sm text-gray-500">
                  {customer.customer.first_name} {customer.customer.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Current Points */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {customer.total_points.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Current Points Balance</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adjustment Type
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={adjustmentType === 'add'}
                    onChange={() => setAdjustmentType('add')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <PlusIcon className="h-4 w-4 text-green-600 mr-1" />
                    Add Points
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={adjustmentType === 'subtract'}
                    onChange={() => setAdjustmentType('subtract')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <MinusIcon className="h-4 w-4 text-red-600 mr-1" />
                    Subtract Points
                  </span>
                </label>
              </div>
            </div>

            {/* Points Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Points
              </label>
              <input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                  errors.pointsAmount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter points amount"
                min="1"
                disabled={isLoading}
              />
              {errors.pointsAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.pointsAmount}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adjustment
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter reason for this points adjustment"
                rows={3}
                disabled={isLoading}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
              
              {/* Preset Reasons */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Quick reasons:</p>
                <div className="flex flex-wrap gap-1">
                  {getPresetReasons().map((presetReason) => (
                    <button
                      key={presetReason}
                      type="button"
                      onClick={() => setReason(presetReason)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      disabled={isLoading}
                    >
                      {presetReason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            {pointsAmount && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Preview:</p>
                    <p className="text-blue-700">
                      Customer will have{' '}
                      <span className="font-medium">
                        {adjustmentType === 'add' 
                          ? customer.total_points + parseFloat(pointsAmount)
                          : customer.total_points - parseFloat(pointsAmount)
                        } points
                      </span>{' '}
                      after this adjustment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${
                  adjustmentType === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Subtract'} Points`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}