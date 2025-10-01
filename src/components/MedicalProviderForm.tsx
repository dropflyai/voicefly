'use client'

import { useState } from 'react'
import { MEDICAL_SPECIALTIES } from '../lib/medical-data'
import { DENTAL_PROVIDER_ROLES } from '../lib/dental-data'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface MedicalProviderFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (providerData: any) => void
  businessType: 'medical_practice' | 'dental_practice' | string
}

export default function MedicalProviderForm({ isOpen, onClose, onSubmit, businessType }: MedicalProviderFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialties: [] as string[],
    role: '',
    yearsExperience: '',
    education: '',
    boardCertifications: [] as string[],
    schedule: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '14:00', available: false },
      sunday: { start: '09:00', end: '14:00', available: false }
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableSpecialties = businessType === 'medical_practice' 
    ? MEDICAL_SPECIALTIES 
    : DENTAL_PROVIDER_ROLES.filter(role => role.category === 'specialist' || role.category === 'general')

  const availableRoles = businessType === 'medical_practice'
    ? [
        { id: 'physician', name: 'Physician', icon: '👨‍⚕️' },
        { id: 'nurse-practitioner', name: 'Nurse Practitioner', icon: '👩‍⚕️' },
        { id: 'physician-assistant', name: 'Physician Assistant', icon: '🩺' },
        { id: 'registered-nurse', name: 'Registered Nurse', icon: '👩‍⚕️' },
        { id: 'medical-assistant', name: 'Medical Assistant', icon: '👨‍⚕️' },
        { id: 'specialist', name: 'Specialist', icon: '🎯' }
      ]
    : [
        { id: 'general-dentist', name: 'General Dentist', icon: '🦷' },
        { id: 'oral-surgeon', name: 'Oral Surgeon', icon: '⚕️' },
        { id: 'orthodontist', name: 'Orthodontist', icon: '🔧' },
        { id: 'endodontist', name: 'Endodontist', icon: '🦷' },
        { id: 'periodontist', name: 'Periodontist', icon: '🦷' },
        { id: 'dental-hygienist', name: 'Dental Hygienist', icon: '🪥' },
        { id: 'dental-assistant', name: 'Dental Assistant', icon: '👩‍⚕️' }
      ]

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const providerData = {
        name: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        specialties: formData.specialties,
        role: formData.role,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        education: formData.education,
        boardCertifications: formData.boardCertifications,
        schedule: formData.schedule,
        isActive: true,
        hireDate: new Date().toISOString().split('T')[0]
      }

      await onSubmit(providerData)
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        specialties: [],
        role: '',
        yearsExperience: '',
        education: '',
        boardCertifications: [],
        schedule: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '14:00', available: false },
          sunday: { start: '09:00', end: '14:00', available: false }
        }
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to add provider:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSpecialty = (specialtyId: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialtyId)
        ? prev.specialties.filter(id => id !== specialtyId)
        : [...prev.specialties, specialtyId]
    }))
  }

  const updateSchedule = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          [field]: value
        }
      }
    }))
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
                <h3 className="text-lg font-medium text-gray-900">
                  {businessType === 'medical_practice' ? 'Add Medical Provider' : 'Add Dental Provider'}
                </h3>
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
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dr. John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Smith"
                      />
                    </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="dr.smith@practice.com"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {businessType === 'medical_practice' ? 'Medical License Number' : 'Dental License Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={businessType === 'medical_practice' ? 'MD123456' : 'DDS123456'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.icon} {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Professional Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {businessType === 'medical_practice' ? 'Medical Specialties' : 'Areas of Practice'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {availableSpecialties.map(specialty => (
                        <label key={specialty.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.specialties.includes(specialty.id)}
                            onChange={() => toggleSpecialty(specialty.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {specialty.icon} {specialty.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Education
                    </label>
                    <textarea
                      rows={3}
                      value={formData.education}
                      onChange={(e) => setFormData({...formData, education: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={businessType === 'medical_practice' 
                        ? 'MD from Harvard Medical School, Residency at Johns Hopkins'
                        : 'DDS from University of California, Specialty training in Oral Surgery'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Weekly Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daysOfWeek.map(day => (
                    <div key={day.key} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {day.label}
                        </label>
                        <input
                          type="checkbox"
                          checked={formData.schedule[day.key as keyof typeof formData.schedule].available}
                          onChange={(e) => updateSchedule(day.key, 'available', e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      {formData.schedule[day.key as keyof typeof formData.schedule].available && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start</label>
                            <input
                              type="time"
                              value={formData.schedule[day.key as keyof typeof formData.schedule].start}
                              onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End</label>
                            <input
                              type="time"
                              value={formData.schedule[day.key as keyof typeof formData.schedule].end}
                              onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.role}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : `Add ${businessType === 'medical_practice' ? 'Provider' : 'Provider'}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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