'use client'

import React, { useState } from 'react'
import { UserPlusIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { getCurrentBusinessId } from '../../../lib/auth-utils'

interface StaffManagementSetupProps {
  planTier: 'professional' | 'business'
  businessName: string
  onStepComplete: () => void
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  specialties: string[]
  workingHours: {
    monday: { start: string; end: string; enabled: boolean }
    tuesday: { start: string; end: string; enabled: boolean }
    wednesday: { start: string; end: string; enabled: boolean }
    thursday: { start: string; end: string; enabled: boolean }
    friday: { start: string; end: string; enabled: boolean }
    saturday: { start: string; end: string; enabled: boolean }
    sunday: { start: string; end: string; enabled: boolean }
  }
}

export default function StaffManagementSetup({
  planTier,
  businessName,
  onStepComplete
}: StaffManagementSetupProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: '1',
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex@' + businessName.toLowerCase().replace(/\s+/g, '') + '.com',
      phone: '+1 (555) 123-4567',
      role: 'Senior Technician',
      specialties: ['Manicures', 'Pedicures', 'Nail Art'],
      workingHours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '10:00', end: '16:00', enabled: false }
      }
    }
  ])

  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [showAddStaff, setShowAddStaff] = useState(false)

  const commonSpecialties = [
    'Manicures', 'Pedicures', 'Gel Applications', 'Nail Art', 'Acrylics', 
    'Dip Powder', 'Nail Extensions', 'Nail Repair', 'Cuticle Care', 'Hand Massage'
  ]

  const applyStaffSetup = async () => {
    setIsApplying(true)
    setApplyError(null)

    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) {
        throw new Error('No business ID found')
      }

      const response = await fetch('/api/staff/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId,
          staff_members: staffMembers
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to create staff members')
      }

      setApplied(true)
      console.log('✅ Staff members created and will appear in dashboard!')
      
    } catch (error) {
      console.error('❌ Failed to create staff members:', error)
      setApplyError(error instanceof Error ? error.message : 'Setup failed')
    } finally {
      setIsApplying(false)
    }
  }

  const addStaffMember = () => {
    const newId = (staffMembers.length + 1).toString()
    const newMember: StaffMember = {
      id: newId,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Technician',
      specialties: [],
      workingHours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '10:00', end: '16:00', enabled: true },
        sunday: { start: '10:00', end: '16:00', enabled: false }
      }
    }
    setStaffMembers([...staffMembers, newMember])
    setShowAddStaff(false)
  }

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev => 
      prev.map(member => 
        member.id === id ? { ...member, ...updates } : member
      )
    )
  }

  const removeStaffMember = (id: string) => {
    setStaffMembers(prev => prev.filter(member => member.id !== id))
  }

  const planFeatures = {
    professional: [
      'Up to 5 staff members',
      'Individual scheduling',
      'Performance tracking',
      'Service assignments',
      'Basic reporting'
    ],
    business: [
      'Unlimited staff members',
      'Multi-location assignments', 
      'Advanced scheduling rules',
      'Cross-location coverage',
      'Enterprise reporting',
      'Staff performance analytics',
      'Automated shift management'
    ]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          👥 Staff Management Setup
        </h3>
        <p className="text-gray-600">
          Set up your team so customers can book with specific staff members
        </p>
      </div>

      {/* Plan Benefits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">
          🎉 Your {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan Staff Features:
        </h4>
        <ul className="text-blue-800 text-sm space-y-1">
          {planFeatures[planTier].map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>

      {/* Current Staff Preview */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">👤 Your Team Preview:</h4>
        
        {staffMembers.map((member, index) => (
          <div key={member.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {member.firstName.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {member.firstName || 'New'} {member.lastName || 'Technician'}
                    </h5>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📧 {member.email || 'Email not set'}</p>
                  <p>📱 {member.phone || 'Phone not set'}</p>
                  <p>⭐ Specialties: {member.specialties.length > 0 ? member.specialties.join(', ') : 'None selected'}</p>
                  <p>🕒 Mon-Fri: {member.workingHours.monday.start}-{member.workingHours.monday.end}</p>
                </div>
              </div>
              
              {staffMembers.length > 1 && (
                <button
                  onClick={() => removeStaffMember(member.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Staff Button */}
        {!showAddStaff && planTier === 'business' && (
          <button
            onClick={() => setShowAddStaff(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <UserPlusIcon className="w-6 h-6 mx-auto mb-2" />
            Add Another Team Member
          </button>
        )}

        {showAddStaff && (
          <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">Ready to add another team member?</span>
              <div className="flex space-x-2">
                <button
                  onClick={addStaffMember}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Add Member
                </button>
                <button
                  onClick={() => setShowAddStaff(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Settings Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="font-semibold text-gray-900 mb-4">💡 Want to add these staff members now?</h4>
        
        {!applied ? (
          <div className="space-y-4">
            {/* Quick Setup Option */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-semibold text-green-900 mb-2">👥 Quick Staff Setup</h5>
                  <p className="text-green-800 text-sm mb-3">
                    We'll add {staffMembers.length} team member{staffMembers.length > 1 ? 's' : ''} to your system:
                  </p>
                  <ul className="text-green-700 text-xs space-y-1 mb-4">
                    {staffMembers.map((member, index) => (
                      <li key={member.id}>
                        • {member.firstName || 'Team Member'} {member.lastName || `#${index + 1}`} ({member.role})
                      </li>
                    ))}
                    <li>• Individual schedules and booking availability</li>
                    <li>• Appears immediately in your Staff dashboard</li>
                    <li>• Customers can book with specific staff members</li>
                  </ul>
                  
                  {applyError && (
                    <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm mb-3">
                      <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                      {applyError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={applyStaffSetup}
                  disabled={isApplying}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Staff...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Add Staff to Dashboard
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Skip Option */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">📅 Setup Later</h5>
                  <p className="text-gray-600 text-sm">Add staff from Dashboard → Staff anytime</p>
                </div>
                <button
                  onClick={onStepComplete}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Success State
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h5 className="font-semibold text-green-900">✅ Staff Members Added!</h5>
                <p className="text-green-800 text-sm">
                  Your team is now set up and will appear in Dashboard → Staff. Customers can now book with specific staff members!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="text-center pt-4">
        <button
          onClick={onStepComplete}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {applied ? 'Continue Training →' : 'Continue Without Setting Up Staff →'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Staff management is always available in Dashboard → Staff
        </p>
      </div>
    </div>
  )
}