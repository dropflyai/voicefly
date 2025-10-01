'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Location, CreateLocationRequest } from '../lib/supabase-types-mvp'

interface LocationFormProps {
  location?: Location
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateLocationRequest) => Promise<void>
  isLoading?: boolean
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu'
]

export default function LocationForm({ 
  location, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: LocationFormProps) {
  const [formData, setFormData] = useState<CreateLocationRequest>({
    name: location?.name || '',
    address_line1: location?.address_line1 || '',
    address_line2: location?.address_line2 || '',
    city: location?.city || '',
    state: location?.state || '',
    postal_code: location?.postal_code || '',
    country: location?.country || 'US',
    phone: location?.phone || '',
    email: location?.email || '',
    timezone: location?.timezone || 'America/Los_Angeles'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required'
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Street address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Please enter a valid ZIP code (12345 or 12345-6789)'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)\.]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save location:', error)
    }
  }

  const updateField = (field: keyof CreateLocationRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {location ? 'Edit Location' : 'Add New Location'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Location Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Main Salon"
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => updateField('address_line1', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.address_line1 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street"
                  disabled={isLoading}
                />
                {errors.address_line1 && <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => updateField('address_line2', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Suite 100"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Los Angeles"
                  disabled={isLoading}
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.postal_code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="90210"
                  disabled={isLoading}
                />
                {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Timezone *
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  disabled={isLoading}
                >
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Anchorage">Alaska Time</option>
                  <option value="Pacific/Honolulu">Hawaii Time</option>
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(555) 123-4567"
                  disabled={isLoading}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="location@salon.com"
                  disabled={isLoading}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : location ? 'Update Location' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}