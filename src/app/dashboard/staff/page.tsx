'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { BusinessAPI } from '../../../lib/supabase'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  isActive: boolean
  hireDate: string
  hourlyRate: number
  commissionRate: number
  profileImage?: string
  bio?: string
  rating: number
  totalAppointments: number
  schedule: {
    [key: string]: { start: string; end: string } | 'off'
  }
}

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Maya Rodriguez',
    email: 'maya@bellanails.com',
    phone: '(555) 234-5678',
    specialties: ['Pedicures', 'Spa Services', 'Massage'],
    isActive: true,
    hireDate: '2023-01-15',
    hourlyRate: 25,
    commissionRate: 40,
    rating: 4.9,
    totalAppointments: 847,
    bio: 'Expert in luxury spa treatments with 8+ years experience.',
    schedule: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '09:00', end: '15:00' },
      sunday: 'off'
    }
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@bellanails.com',
    phone: '(555) 345-6789',
    specialties: ['Manicures', 'Nail Art', 'Gel Extensions'],
    isActive: true,
    hireDate: '2022-08-20',
    hourlyRate: 28,
    commissionRate: 45,
    rating: 4.8,
    totalAppointments: 1203,
    bio: 'Creative nail artist specializing in custom designs and extensions.',
    schedule: {
      monday: { start: '10:00', end: '18:00' },
      tuesday: 'off',
      wednesday: { start: '10:00', end: '18:00' },
      thursday: { start: '10:00', end: '18:00' },
      friday: { start: '10:00', end: '18:00' },
      saturday: { start: '09:00', end: '16:00' },
      sunday: { start: '11:00', end: '15:00' }
    }
  },
  {
    id: '3',
    name: 'Jessica Chen',
    email: 'jessica@bellanails.com',
    phone: '(555) 456-7890',
    specialties: ['Manicures', 'Pedicures', 'Eyebrow Threading'],
    isActive: true,
    hireDate: '2023-03-10',
    hourlyRate: 22,
    commissionRate: 35,
    rating: 4.7,
    totalAppointments: 456,
    bio: 'Versatile technician with expertise in multiple beauty services.',
    schedule: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '09:00', end: '16:00' },
      sunday: 'off'
    }
  }
]

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // Load real staff from database
  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      setLoading(true)
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const realStaff = await BusinessAPI.getStaff(businessId)
      
      // Transform to match our interface
      const transformedStaff: Staff[] = realStaff.map(member => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        phone: member.phone || '',
        specialties: member.specialties || [],
        isActive: member.is_active,
        hireDate: member.hire_date || new Date().toISOString().split('T')[0],
        hourlyRate: member.hourly_rate || 0,
        commissionRate: member.commission_rate || 0,
        role: member.role,
        totalAppointments: 0, // Would need to calculate
        totalRevenue: 0, // Would need to calculate
        rating: 5.0, // Would need to calculate from reviews
        schedule: {} // Empty schedule for now - would need staff_schedules table
      }))
      
      setStaff(transformedStaff)
    } catch (error) {
      console.error('Error loading staff:', error)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [businessType, setBusinessType] = useState('beauty_salon')

  // Load business type
  useEffect(() => {
    loadBusinessType()
  }, [])

  const loadBusinessType = async () => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return
      
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData?.business_type) {
        setBusinessType(businessData.business_type)
      }
    } catch (error) {
      console.error('Error loading business type:', error)
    }
  }

  const handleAddStaff = async (staffData: any) => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) {
        console.error('No business ID available')
        return
      }

      // Split name into first and last name
      const nameParts = staffData.name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      // Create staff member data for API
      const newStaffMember = {
        first_name: firstName,
        last_name: lastName,
        email: staffData.email,
        phone: staffData.phone || null,
        role: 'technician',
        is_active: true,
        hire_date: new Date().toISOString().split('T')[0],
        hourly_rate: staffData.hourlyRate || 0,
        commission_rate: staffData.commissionRate || 0,
        specialties: staffData.specialties || []
      }

      // Add to database
      const createdStaff = await BusinessAPI.addStaff(businessId, newStaffMember)
      
      // Add to local state
      const newStaffForState: Staff = {
        id: createdStaff.id,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone || '',
        specialties: staffData.specialties || [],
        isActive: true,
        hireDate: new Date().toISOString().split('T')[0],
        hourlyRate: staffData.hourlyRate || 0,
        commissionRate: staffData.commissionRate || 0,
        rating: 5.0,
        totalAppointments: 0,
        schedule: staffData.schedule || {}
      }

      setStaff(prevStaff => [...prevStaff, newStaffForState])
      setShowAddModal(false)
      
      console.log('Staff member added successfully')
    } catch (error) {
      console.error('Failed to add staff member:', error)
      alert('Failed to add staff member. Please try again.')
    }
  }

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(rating) ? (
        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="h-4 w-4 text-gray-300" />
      )
    ))
  }

  const getScheduleDisplay = (schedule: Staff['schedule']) => {
    if (!schedule || Object.keys(schedule).length === 0) {
      return 'Schedule not set'
    }
    const workingDays = daysOfWeek.filter(day => schedule[day] && schedule[day] !== 'off').length
    return `${workingDays} days/week`
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {businessType === 'medical_practice' ? 'Medical Providers' :
               businessType === 'dental_practice' ? 'Dental Providers' : 'Staff Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {businessType === 'medical_practice' ? 'Manage your medical providers, schedules, and specialties' :
               businessType === 'dental_practice' ? 'Manage your dental team, schedules, and specialties' :
               'Manage your team, schedules, and performance'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              {businessType === 'medical_practice' ? 'Add Provider' :
               businessType === 'dental_practice' ? 'Add Provider' : 'Add Staff Member'}
            </button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={businessType === 'medical_practice' ? 'Search providers...' :
                           businessType === 'dental_practice' ? 'Search providers...' : 'Search staff...'}
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">
                  {businessType === 'medical_practice' ? 'Total Providers' :
                   businessType === 'dental_practice' ? 'Total Providers' : 'Total Staff'}
                </div>
                <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">
                  {businessType === 'medical_practice' ? 'Active Providers' :
                   businessType === 'dental_practice' ? 'Active Providers' : 'Active Staff'}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {staff.filter(s => s.isActive).length}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">Avg. Rating</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-beauty-400 to-brand-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                    <div className="flex items-center mt-1">
                      {renderStars(member.rating)}
                      <span className="ml-2 text-sm text-gray-500">
                        ({member.totalAppointments} appointments)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStaff(member)
                      setShowModal(true)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {member.email}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {member.phone}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {getScheduleDisplay(member.schedule)}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Specialties:</div>
                <div className="flex flex-wrap gap-1">
                  {member.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="font-medium">${member.hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Commission:</span>
                  <span className="font-medium">{member.commissionRate}%</span>
                </div>
              </div>

              <div className="mt-4">
                <div className={clsx(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  member.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                )}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Detail Modal */}
        {showModal && selectedStaff && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-6 py-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 bg-gradient-to-br from-beauty-400 to-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">
                          {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-medium text-gray-900">{selectedStaff.name}</h3>
                        <div className="flex items-center mt-1">
                          {renderStars(selectedStaff.rating)}
                          <span className="ml-2 text-sm text-gray-500">
                            {selectedStaff.rating}/5 • {selectedStaff.totalAppointments} appointments
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact & Basic Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {selectedStaff.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {selectedStaff.phone}
                        </div>
                        <div>
                          <span className="text-gray-500">Hire Date: </span>
                          {new Date(selectedStaff.hireDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500">Hourly Rate: </span>
                          ${selectedStaff.hourlyRate}/hour
                        </div>
                        <div>
                          <span className="text-gray-500">Commission: </span>
                          {selectedStaff.commissionRate}%
                        </div>
                      </div>

                      {selectedStaff.bio && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Bio</h4>
                          <p className="text-sm text-gray-600">{selectedStaff.bio}</p>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedStaff.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Schedule</h4>
                      <div className="space-y-2">
                        {daysOfWeek.map((day, index) => (
                          <div key={day} className="flex justify-between items-center text-sm">
                            <span className="font-medium capitalize w-16">{dayLabels[index]}</span>
                            <span className="text-gray-600">
                              {selectedStaff.schedule[day] === 'off' ? (
                                <span className="text-red-500">Off</span>
                              ) : (
                                <span className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {(selectedStaff.schedule[day] as any).start} - {(selectedStaff.schedule[day] as any).end}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                    onClick={() => setShowModal(false)}
                  >
                    Edit Staff Member
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:mt-0"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddModal && (
          <AddStaffModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddStaff}
          />
        )}
      </div>
    </Layout>
  )
}

// Add Staff Modal Component
interface AddStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (staffData: any) => void
}

function AddStaffModal({ isOpen, onClose, onSubmit }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    hourlyRate: 0,
    commissionRate: 0,
    bio: '',
    schedule: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: 'off' as const
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSpecialty, setNewSpecialty] = useState('')

  const availableSpecialties = [
    'Manicures', 'Pedicures', 'Nail Art', 'Gel Polish', 'Acrylic Nails', 
    'French Manicure', 'Spa Services', 'Massage', 'Waxing', 'Facials'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        ...formData,
        id: Date.now().toString(), // Temporary ID for mock data
        isActive: true,
        hireDate: new Date().toISOString().split('T')[0],
        rating: 5.0,
        totalAppointments: 0
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        hourlyRate: 0,
        commissionRate: 0,
        bio: '',
        schedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '10:00', end: '16:00' },
          sunday: 'off' as const
        }
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to add staff:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      })
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add Staff Member</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Specialties and Compensation */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Specialties & Compensation</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialties
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select a specialty...</option>
                          {availableSpecialties
                            .filter(s => !formData.specialties.includes(s))
                            .map(specialty => (
                              <option key={specialty} value={specialty}>{specialty}</option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            addSpecialty(newSpecialty)
                            setNewSpecialty('')
                          }}
                          disabled={!newSpecialty}
                          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.map(specialty => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {specialty}
                            <button
                              type="button"
                              onClick={() => removeSpecialty(specialty)}
                              className="ml-2 text-purple-600 hover:text-purple-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email}
                className="btn-primary sm:ml-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Staff Member'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary mt-3 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}