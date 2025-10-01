'use client'

import React, { useState } from 'react'
import { BuildingOffice2Icon, MapPinIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/solid'

interface MultiLocationSetupProps {
  planTier: 'business'
  businessName: string
  onStepComplete: () => void
}

export default function MultiLocationSetup({
  planTier,
  businessName,
  onStepComplete
}: MultiLocationSetupProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  })

  // Sample existing locations (first location from onboarding)
  const existingLocations = [
    {
      id: '1',
      name: `${businessName} - Main Location`,
      address: '123 Main St, Downtown',
      phone: '(555) 123-4567',
      manager: 'Sarah Johnson',
      status: 'Primary',
      appointments: 24,
      revenue: '$2,340'
    }
  ]

  const handleAddLocation = () => {
    if (newLocation.name && newLocation.address) {
      // In real implementation, this would add to database
      setNewLocation({ name: '', address: '', phone: '', manager: '' })
      setShowAddForm(false)
    }
  }

  const handleContinue = () => {
    onStepComplete()
  }

  const businessFeatures = [
    'Up to 3 total locations included in Business plan',
    'Unified booking system across all locations',
    'Location-specific staff and service management',
    'Cross-location customer and appointment tracking',
    'Individual location phone numbers and AI assistants',
    'Centralized reporting with location breakdowns',
    'Location-specific branding and customization',
    'Multi-location loyalty program integration'
  ]

  const locationBenefits = [
    {
      title: 'Shared Customer Base',
      description: 'Customers can book at any location with their loyalty points',
      icon: '👥',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      title: 'Unified Management',
      description: 'Manage all locations from one dashboard',
      icon: '🎯',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      title: 'Cross-Location Analytics',
      description: 'Compare performance and optimize operations',
      icon: '📊',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      title: 'Centralized Marketing',
      description: 'Run campaigns across all locations simultaneously',
      icon: '📢',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <BuildingOffice2Icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Multi-Location Management
        </h3>
        <p className="text-gray-600">
          Your Business plan supports up to 3 locations. Add your other locations to centralize operations.
        </p>
      </div>

      {/* Current Locations */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">🏢 Your Current Locations:</h4>
        
        {existingLocations.map((location) => (
          <div key={location.id} className="border border-green-500 bg-green-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">{location.name}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {location.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>📍 {location.address}</div>
                  <div>📞 {location.phone}</div>
                  <div>👤 Manager: {location.manager}</div>
                </div>
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <span className="text-green-700 font-medium">
                    📅 {location.appointments} appointments this week
                  </span>
                  <span className="text-green-700 font-medium">
                    💰 {location.revenue} revenue
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Location */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900">
            ➕ Add Additional Locations
          </h4>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Location
            </button>
          )}
        </div>
        
        {showAddForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`${businessName} - South Location`}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  value={newLocation.manager}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, manager: e.target.value }))}
                  placeholder="Location manager name"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Full Address
              </label>
              <input
                type="text"
                value={newLocation.address}
                onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                placeholder="456 Oak Ave, Uptown District"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={newLocation.phone}
                onChange={(e) => setNewLocation(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 987-6543"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAddLocation}
                disabled={!newLocation.name || !newLocation.address}
                className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Location
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewLocation({ name: '', address: '', phone: '', manager: '' }) }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {!showAddForm && (
          <div className="space-y-2">
            <p className="text-blue-800 text-sm">
              Add your other business locations to manage everything from one dashboard.
            </p>
            <div className="text-xs text-blue-700">
              📊 <strong>Remaining:</strong> 2 more locations available (3 total in Business plan)
            </div>
          </div>
        )}
      </div>

      {/* Multi-Location Benefits */}
      <div className="grid grid-cols-2 gap-4">
        {locationBenefits.map((benefit, index) => (
          <div key={index} className={`border rounded-lg p-4 ${benefit.color}`}>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{benefit.icon}</span>
              <div>
                <h5 className="font-semibold mb-1">{benefit.title}</h5>
                <p className="text-sm">{benefit.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What Happens When You Add Locations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-3">
          🎯 What Happens When You Add Locations:
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-yellow-800 text-sm">Each location gets its own AI phone number and assistant</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-yellow-800 text-sm">Location-specific services, staff, and hours are configured</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-yellow-800 text-sm">Customers can book at any location using their loyalty points</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <span className="text-yellow-800 text-sm">All locations appear in unified dashboard for easy management</span>
          </div>
        </div>
      </div>

      {/* Business Plan Features */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-3">
          🎉 Your Business Plan Multi-Location Features:
        </h4>
        <ul className="text-purple-800 text-sm space-y-1">
          {businessFeatures.map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>

      {/* Setup Approach Options */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Choose Your Approach:</h4>
        
        <div className="space-y-3">
          <div className="border border-green-500 bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input type="radio" name="approach" value="gradual" defaultChecked />
              <div>
                <h5 className="font-semibold text-gray-900">🎯 Start with Main Location (Recommended)</h5>
                <p className="text-gray-600 text-sm">
                  Perfect your system at your main location first, then add other locations when ready.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input type="radio" name="approach" value="all-now" />
              <div>
                <h5 className="font-semibold text-gray-900">🚀 Add All Locations Now</h5>
                <p className="text-gray-600 text-sm">
                  Set up all your locations immediately for unified management from day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Multi-location management is always available in Settings → Locations
        </p>
      </div>
    </div>
  )
}