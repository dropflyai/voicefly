'use client'

import { MapPinIcon } from '@heroicons/react/24/outline'
import type { Location } from '../lib/supabase-types-mvp'

interface AppointmentLocationBadgeProps {
  location: Location | null
  size?: 'sm' | 'md' | 'lg'
  showAddress?: boolean
  className?: string
}

export default function AppointmentLocationBadge({
  location,
  size = 'md',
  showAddress = false,
  className = ''
}: AppointmentLocationBadgeProps) {
  if (!location) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 ${className}`}>
        <MapPinIcon className="w-3 h-3 mr-1" />
        No Location
      </span>
    )
  }

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-2.5 py-1 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-5 h-5',
      text: 'text-sm'
    }
  }

  const classes = sizeClasses[size]

  // Generate a consistent color based on location name
  const getLocationColor = (locationName: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200', 
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-rose-100 text-rose-800 border-rose-200'
    ]
    
    // Simple hash function to get consistent color for location name
    let hash = 0
    for (let i = 0; i < locationName.length; i++) {
      hash = ((hash << 5) - hash + locationName.charCodeAt(i)) & 0xffffffff
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const colorClasses = getLocationColor(location.name)
  const truncatedAddress = location.address_line1?.length > 25 
    ? `${location.address_line1.substring(0, 25)}...` 
    : location.address_line1

  return (
    <div className={`inline-flex items-center ${classes.container} rounded-md font-medium border ${colorClasses} ${className}`}>
      <MapPinIcon className={`${classes.icon} mr-1 flex-shrink-0`} />
      <div className="flex flex-col">
        <span className="font-medium">{location.name}</span>
        {showAddress && location.address_line1 && (
          <span className={`${classes.text} opacity-75 font-normal`}>
            {truncatedAddress}
          </span>
        )}
      </div>
      {location.is_primary && (
        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Primary
        </span>
      )}
    </div>
  )
}