'use client'

import React, { useState } from 'react'
import { BuildingStorefrontIcon, MapPinIcon, ClockIcon, ArrowRightIcon, CameraIcon } from '@heroicons/react/24/solid'

interface BusinessProfileSetupProps {
  planTier: 'starter' | 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

export default function BusinessProfileSetup({
  planTier,
  businessName,
  onStepComplete
}: BusinessProfileSetupProps) {
  const [profileData, setProfileData] = useState({
    description: '',
    specialties: [] as string[],
    experience: '',
    atmosphere: '',
    logoUploaded: false
  })
  
  const [currentTab, setCurrentTab] = useState<'description' | 'specialties' | 'branding' | 'hours'>('description')

  const specialtyOptions = [
    'Nail Art & Design',
    'Gel & Shellac',
    'Acrylic Extensions',
    'Natural Nail Care',
    'Spa Pedicures',
    'Bridal Services',
    'Men\'s Grooming',
    'Quick Express Services'
  ]

  const handleSpecialtyToggle = (specialty: string) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleContinue = () => {
    onStepComplete()
  }

  const tierBenefits = {
    starter: [
      'Basic business profile display',
      'Contact information sharing',
      'Simple service descriptions',
      'Basic business hours'
    ],
    professional: [
      'Enhanced profile with custom branding',
      'Professional photo gallery',
      'Detailed specialties and experience',
      'Marketing-optimized descriptions',
      'Customer review integration',
      'Social media links'
    ],
    business: [
      'Multi-location profile management',
      'Individual location branding',
      'Advanced SEO optimization',
      'Franchise-level consistency',
      'White-label branding options',
      'Corporate profile management'
    ]
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center">
        <BuildingStorefrontIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Complete Your Business Profile
        </h3>
        <p className="text-gray-600">
          Help customers learn more about {businessName} and what makes you special.
        </p>
      </div>

      {/* Profile Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'description', label: '📝 About', icon: '📝' },
          { id: 'specialties', label: '⭐ Specialties', icon: '⭐' },
          { id: 'branding', label: '🎨 Branding', icon: '🎨' },
          { id: 'hours', label: '🕒 Hours', icon: '🕒' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              currentTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Description Tab */}
        {currentTab === 'description' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-3">Tell customers about your business</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                value={profileData.description}
                onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your business's atmosphere, experience, and what makes you unique..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This appears on your booking page and helps customers choose you
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <select
                value={profileData.experience}
                onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select experience level</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5-10 years">5-10 years</option>
                <option value="10+ years">10+ years experience</option>
                <option value="20+ years">20+ years experience</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Atmosphere
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Relaxing & Spa-like', 'Modern & Trendy', 'Classic & Elegant', 'Fun & Social', 'Luxury & Upscale', 'Quick & Efficient'].map((atmosphere) => (
                  <label key={atmosphere} className="flex items-center">
                    <input
                      type="radio"
                      name="atmosphere"
                      value={atmosphere}
                      checked={profileData.atmosphere === atmosphere}
                      onChange={(e) => setProfileData(prev => ({ ...prev, atmosphere: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm">{atmosphere}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Specialties Tab */}
        {currentTab === 'specialties' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-3">What are your specialties?</h4>
            <p className="text-gray-600 text-sm mb-4">
              Select the services and techniques you excel at. This helps customers find exactly what they're looking for.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {specialtyOptions.map((specialty) => (
                <div
                  key={specialty}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    profileData.specialties.includes(specialty)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSpecialtyToggle(specialty)}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">{specialty}</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Customers often search by specialty. The more accurate your selections, the better your AI can match customer requests!
              </p>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {currentTab === 'branding' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-3">Brand Your Business</h4>
            
            {/* Logo Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h5 className="font-medium text-gray-900 mb-2">Upload Your Logo</h5>
              <p className="text-gray-600 text-sm mb-4">
                Add your business logo to appear on booking confirmations and receipts
              </p>
              <button
                onClick={() => setProfileData(prev => ({ ...prev, logoUploaded: !prev.logoUploaded }))}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  profileData.logoUploaded
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {profileData.logoUploaded ? '✅ Logo Uploaded' : 'Choose Logo File'}
              </button>
            </div>

            {/* Color Scheme */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Brand Colors</h5>
              <div className="grid grid-cols-6 gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
                  <div
                    key={color}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {planTier === 'professional' || planTier === 'business'
                  ? 'Your brand colors will appear throughout your customer experience'
                  : 'Upgrade to Professional for custom brand colors'
                }
              </p>
            </div>

            {planTier === 'business' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-semibold text-purple-900 mb-2">🏢 Enterprise Branding</h5>
                <ul className="text-purple-800 text-sm space-y-1">
                  <li>• Custom domain (yourbusiness.com)</li>
                  <li>• White-label booking experience</li>
                  <li>• Remove all third-party branding</li>
                  <li>• Multi-location brand consistency</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Hours Tab */}
        {currentTab === 'hours' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-3">Business Hours</h4>
            <p className="text-gray-600 text-sm mb-4">
              Your AI assistant uses these hours to suggest appointment times and inform customers when you're available.
            </p>
            
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked={day !== 'Sunday'} />
                    <span className="font-medium">{day}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="time" 
                      defaultValue="09:00" 
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input 
                      type="time" 
                      defaultValue={day === 'Friday' || day === 'Saturday' ? '20:00' : '18:00'} 
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                ✅ <strong>Smart Scheduling:</strong> Your AI will automatically suggest the best available times based on these hours!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Profile Features:
        </h4>
        <ul className="text-blue-800 text-sm space-y-1">
          {tierBenefits[planTier].map((benefit, index) => (
            <li key={index}>✅ {benefit}</li>
          ))}
        </ul>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          Continue Training
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
        <p className="text-sm text-gray-600 mt-2">
          You can always update your profile from Settings → Business Profile
        </p>
      </div>
    </div>
  )
}