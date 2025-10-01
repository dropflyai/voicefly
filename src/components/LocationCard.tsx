'use client'

import { useState } from 'react'
import { 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import type { Location } from '../lib/supabase-types-mvp'

interface LocationCardProps {
  location: Location
  isPrimary?: boolean
  onEdit: (location: Location) => void
  onDelete: (locationId: string) => void
  onSetPrimary: (locationId: string) => void
  className?: string
}

export default function LocationCard({ 
  location, 
  isPrimary = false, 
  onEdit, 
  onDelete, 
  onSetPrimary,
  className = '' 
}: LocationCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSetPrimary = async () => {
    if (isPrimary || isLoading) return
    
    setIsLoading(true)
    try {
      await onSetPrimary(location.id)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (location: Location) => {
    const parts = [
      location.address_line1,
      location.address_line2,
      `${location.city}, ${location.state} ${location.postal_code}`
    ].filter(Boolean)
    return parts.join(', ')
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${isPrimary ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <BuildingStorefrontIcon className={`h-6 w-6 ${isPrimary ? 'text-purple-600' : 'text-gray-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                {isPrimary && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <StarSolidIcon className="w-3 h-3 mr-1" />
                    Primary
                  </span>
                )}
                {location.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Location ID: {location.slug}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {!isPrimary && (
              <button
                onClick={handleSetPrimary}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <StarIcon className="w-4 h-4 mr-1" />
                {isLoading ? 'Setting...' : 'Set Primary'}
              </button>
            )}
            
            <button
              onClick={() => onEdit(location)}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-600 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            
            {!isPrimary && (
              <button
                onClick={() => onDelete(location.id)}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-400 hover:text-red-600 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Location Details */}
        <div className="mt-4 space-y-3">
          {/* Address */}
          <div className="flex items-start space-x-2">
            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">{formatAddress(location)}</span>
          </div>

          {/* Contact Info */}
          <div className="flex items-center space-x-4">
            {location.phone && (
              <div className="flex items-center space-x-2">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{location.phone}</span>
              </div>
            )}
            
            {location.email && (
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{location.email}</span>
              </div>
            )}
          </div>

          {/* Timezone */}
          <div className="text-xs text-gray-500">
            Timezone: {location.timezone}
          </div>
        </div>

        {/* Integration Status */}
        {(location.square_location_id || location.stripe_account_id) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-gray-500">INTEGRATIONS:</span>
              {location.square_location_id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Square Connected
                </span>
              )}
              {location.stripe_account_id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Stripe Connected
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}