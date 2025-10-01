'use client'

import { useState } from 'react'
import { 
  StarIcon, 
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { LoyaltyTier } from '../lib/supabase-types-mvp'

interface LoyaltyTierCardProps {
  tier: LoyaltyTier
  onEdit: (tierId: string, tierData: Partial<LoyaltyTier>) => Promise<void>
  isLoading?: boolean
  className?: string
}

export default function LoyaltyTierCard({
  tier,
  onEdit,
  isLoading = false,
  className = ''
}: LoyaltyTierCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<LoyaltyTier>>({
    name: tier.name,
    min_points: tier.min_points,
    discount_percentage: tier.discount_percentage,
    color: tier.color,
    benefits: tier.benefits || []
  })

  const handleSave = async () => {
    try {
      await onEdit(tier.id, editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save tier:', error)
    }
  }

  const handleCancel = () => {
    setEditData({
      name: tier.name,
      min_points: tier.min_points,
      discount_percentage: tier.discount_percentage,
      color: tier.color,
      benefits: tier.benefits || []
    })
    setIsEditing(false)
  }

  const addBenefit = () => {
    setEditData(prev => ({
      ...prev,
      benefits: [...(prev.benefits || []), '']
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      benefits: prev.benefits?.map((benefit, i) => i === index ? value : benefit) || []
    }))
  }

  const removeBenefit = (index: number) => {
    setEditData(prev => ({
      ...prev,
      benefits: prev.benefits?.filter((_, i) => i !== index) || []
    }))
  }

  if (isEditing) {
    return (
      <div className={`bg-white rounded-lg border-2 border-purple-200 p-6 ${className}`}>
        <div className="space-y-4">
          {/* Tier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier Name
            </label>
            <input
              type="text"
              value={editData.name || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Min Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Points
            </label>
            <input
              type="number"
              value={editData.min_points || 0}
              onChange={(e) => setEditData(prev => ({ ...prev, min_points: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min="0"
              disabled={isLoading}
            />
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={editData.discount_percentage || 0}
                onChange={(e) => setEditData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm"
                min="0"
                max="100"
                step="0.1"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={editData.color || '#6B7280'}
                onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-8 border border-gray-300 rounded"
                disabled={isLoading}
              />
              <input
                type="text"
                value={editData.color || '#6B7280'}
                onChange={(e) => setEditData(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="#6B7280"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits
            </label>
            <div className="space-y-2">
              {editData.benefits?.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter benefit description"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBenefit}
                className="text-sm text-purple-600 hover:text-purple-700"
                disabled={isLoading}
              >
                + Add Benefit
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 p-6 relative ${className}`}
      style={{ borderColor: tier.color }}
    >
      {/* Edit Button */}
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        disabled={isLoading}
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      {/* Tier Header */}
      <div className="text-center mb-4">
        <div 
          className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white mb-3"
          style={{ backgroundColor: tier.color }}
        >
          <StarIcon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
        <p className="text-sm text-gray-500">
          {tier.min_points === 0 ? 'Starting tier' : `${tier.min_points}+ points`}
        </p>
      </div>

      {/* Discount */}
      {tier.discount_percentage > 0 && (
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-gray-900">
            {tier.discount_percentage}% OFF
          </div>
          <div className="text-sm text-gray-500">All services</div>
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-2">
        {tier.benefits?.map((benefit, index) => (
          <div key={index} className="flex items-start space-x-2 text-sm">
            <CheckCircleIcon 
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              style={{ color: tier.color }}
            />
            <span className="text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Member Count (Mock Data) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Members</span>
          <span className="font-medium text-gray-900">
            {/* Mock member count - in real app, this would come from props */}
            {tier.name === 'Bronze' ? '45' : 
             tier.name === 'Silver' ? '28' : 
             tier.name === 'Gold' ? '15' : 
             tier.name === 'Platinum' ? '3' : '0'}
          </span>
        </div>
      </div>
    </div>
  )
}