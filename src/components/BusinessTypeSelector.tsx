'use client'

import { useState } from 'react'
import { FEATURE_FLAGS, type BusinessType, getMayaJobForBusinessType } from '../lib/feature-flags'

interface BusinessTypeSelectorProps {
  onBusinessTypeSelect: (type: BusinessType, mayaJob: string) => void
  selectedType?: BusinessType
}

export default function BusinessTypeSelector({ onBusinessTypeSelect, selectedType }: BusinessTypeSelectorProps) {
  const [selected, setSelected] = useState<BusinessType>(selectedType || 'beauty_salon')

  const businessTypes = [
    {
      type: 'beauty_salon' as BusinessType,
      icon: '💅',
      name: 'Beauty & Wellness',
      description: 'Nail salon, hair salon, spa, massage, barbershop',
      features: ['Appointment booking', 'Service management', 'Staff scheduling', 'Customer loyalty'],
      available: true
    },
    {
      type: 'general_business' as BusinessType,
      icon: '🏢',
      name: 'Professional Services', 
      description: 'Law firm, accounting, consulting, agency, B2B services',
      features: ['Call routing', 'Lead qualification', 'Message taking', 'Meeting scheduling'],
      available: true
    },
    {
      type: 'medical_practice' as BusinessType,
      icon: '🏥',
      name: 'Medical Practice',
      description: 'Medical clinic, family practice, urgent care, specialist office',
      features: ['HIPAA-compliant scheduling', 'Insurance verification', 'Patient reminders', 'Emergency routing'],
      available: false,
      comingSoon: true
    },
    {
      type: 'dental_practice' as BusinessType,
      icon: '🦷',
      name: 'Dental Practice',
      description: 'Dental office, orthodontist, oral surgeon, hygienist clinic',
      features: ['Appointment scheduling', 'Insurance pre-auth', 'Treatment reminders', 'Emergency triage'],
      available: false,
      comingSoon: true
    },
    {
      type: 'home_services' as BusinessType,
      icon: '🏠',
      name: 'Home Services',
      description: 'HVAC, plumbing, electrical, cleaning, landscaping',
      features: ['Service calls', 'Quote scheduling', 'Emergency routing', 'Customer follow-up'],
      available: true
    },
    {
      type: 'fitness_wellness' as BusinessType,
      icon: '💪',
      name: 'Fitness & Wellness',
      description: 'Gym, yoga studio, personal training, martial arts, dance',
      features: ['Class scheduling', 'Membership management', 'Trainer booking', 'Health screening'],
      available: true
    }
  ]

  const handleSelection = (type: BusinessType) => {
    setSelected(type)
    const mayaJob = getMayaJobForBusinessType(type)
    onBusinessTypeSelect(type, mayaJob)
  }

  // If receptionist features are disabled, only show beauty salon option
  if (!FEATURE_FLAGS.businessTypeSelector) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Setting up your Maya for Beauty & Wellness</h3>
        <div className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💅</span>
            <div>
              <h4 className="font-semibold text-purple-900">Beauty & Wellness</h4>
              <p className="text-sm text-purple-700">Perfect for salons, spas, and beauty businesses</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What type of business do you run?</h3>
        <p className="text-gray-600">Maya will customize her personality and features for your industry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessTypes.map((businessType) => (
          <div
            key={businessType.type}
            className={`relative ${!businessType.available ? 'opacity-75' : ''}`}
          >
            <button
              onClick={() => businessType.available && handleSelection(businessType.type)}
              disabled={!businessType.available}
              className={`p-6 border-2 rounded-xl text-left transition-all duration-200 w-full ${
                businessType.available 
                  ? selected === businessType.type
                    ? 'border-blue-500 bg-blue-50 shadow-lg hover:shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-4xl flex-shrink-0">{businessType.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg text-gray-900">{businessType.name}</h4>
                    {businessType.comingSoon && (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{businessType.description}</p>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maya will handle:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {businessType.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selected === businessType.type && businessType.available && (
                    <div className="mt-3 flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}

                  {businessType.comingSoon && (
                    <div className="mt-3 text-sm text-amber-700">
                      We're working on bringing Maya to {businessType.name.toLowerCase()}. Join the waitlist to be notified when available!
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Maya Preview */}
      {selected && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Maya's Introduction</h4>
              <p className="text-gray-700 italic">
                "{getPreviewMessage(selected)}"
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Maya will learn about your specific business during setup and customize her responses accordingly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPreviewMessage(businessType: BusinessType): string {
  switch (businessType) {
    case 'beauty_salon':
      return "Thank you for calling! This is Maya, your nail care specialist. Whether you need a classic manicure or want to explore some beautiful nail art, I'm here to help you achieve gorgeous, healthy nails. What can I book for you today?"
    
    case 'general_business':
      return "Thank you for calling. This is Maya, your virtual receptionist. I'm here to help direct your call and make sure you reach the right person. How may I assist you today?"
    
    case 'medical_practice':
      return "Thank you for calling our medical practice. This is Maya, your patient coordinator. I can help schedule appointments, verify insurance coverage, handle prescription refills, or route urgent calls to the appropriate provider. How may I assist you today?"
    
    case 'dental_practice':
      return "Thank you for calling our dental office. This is Maya, your dental coordinator. I can schedule your cleaning, consultation, or treatment, help with insurance pre-authorization, or connect you with our dental team. What can I help you with today?"
    
    case 'home_services':
      return "Thanks for calling! This is Maya. Whether you need emergency service, want to schedule a consultation, or have questions about our services, I'm here to help get you connected with the right technician. What can I help you with?"
    
    case 'fitness_wellness':
      return "Thank you for calling! This is Maya, your fitness coordinator. I can help you book classes, schedule personal training sessions, manage your membership, or answer questions about our programs. How can I help you reach your wellness goals today?"
    
    default:
      return "Thank you for calling. This is Maya, and I'm here to help direct your call to the right person. How may I assist you today?"
  }
}