'use client'

import { useState, useEffect } from 'react'
import { MapPinIcon, FunnelIcon } from '@heroicons/react/24/outline'
import type { Location, BusinessWithLocations } from '../lib/supabase-types-mvp'

interface CustomerLocationFilterProps {
  business: BusinessWithLocations | null
  locations: Location[]
  selectedLocationId: string
  onLocationChange: (locationId: string) => void
  className?: string
}

export default function CustomerLocationFilter({
  business,
  locations,
  selectedLocationId,
  onLocationChange,
  className = ''
}: CustomerLocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Only show for Business tier plans with multiple locations
  if (!business || business.subscription_tier !== 'business' || locations.length <= 1) {
    return null
  }

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)
  const allCustomersCount = locations.reduce((sum, loc) => sum + (loc as any).customer_count || 0, 0)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        <MapPinIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          {selectedLocationId === 'all' 
            ? `All Locations (${locations.length})` 
            : selectedLocation?.name || 'Select Location'
          }
        </span>
        <FunnelIcon className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {/* All Locations Option */}
              <button
                onClick={() => {
                  onLocationChange('all')
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  selectedLocationId === 'all' 
                    ? 'bg-brand-50 text-brand-700 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span>All Locations</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {locations.length} locations
                  </span>
                </div>
              </button>

              {/* Divider */}
              <hr className="my-1 border-gray-200" />

              {/* Individual Locations */}
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    onLocationChange(location.id)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    selectedLocationId === location.id
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: location.is_active ? '#10B981' : '#EF4444' }}
                        />
                        <span>{location.name}</span>
                        {location.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {location.city}, {location.state}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {(location as any).customer_count || 0} customers
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper component for location stats
export function LocationCustomerStats({ locations }: { locations: Location[] }) {
  const totalCustomers = locations.reduce((sum, loc) => sum + ((loc as any).customer_count || 0), 0)
  
  return (
    <div className="text-sm text-gray-500">
      <span className="font-medium">{totalCustomers}</span> customers across{' '}
      <span className="font-medium">{locations.length}</span> locations
    </div>
  )
}