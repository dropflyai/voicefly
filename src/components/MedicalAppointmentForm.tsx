'use client'

import { useState, useEffect } from 'react'
import { 
  MEDICAL_APPOINTMENT_TYPES, 
  MEDICAL_SPECIALTIES, 
  INSURANCE_PROVIDERS,
  type InsuranceInfo
} from '../lib/medical-data'
import { 
  DENTAL_APPOINTMENT_TYPES, 
  DENTAL_PROVIDER_ROLES,
  DENTAL_INSURANCE_PROVIDERS
} from '../lib/dental-data'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface MedicalAppointmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (appointmentData: any) => void
  businessType: 'medical_practice' | 'dental_practice' | string
  selectedDate?: string
  selectedTime?: string
}

export default function MedicalAppointmentForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  businessType,
  selectedDate,
  selectedTime 
}: MedicalAppointmentFormProps) {
  const [formData, setFormData] = useState({
    // Patient Information
    patientFirstName: '',
    patientLastName: '',
    patientEmail: '',
    patientPhone: '',
    dateOfBirth: '',
    
    // Appointment Details
    appointmentType: '',
    provider: '',
    date: selectedDate || '',
    time: selectedTime || '',
    duration: 30,
    
    // Medical/Dental Specific
    reasonForVisit: '',
    urgencyLevel: 'routine',
    previousPatient: false,
    referringProvider: '',
    
    // Insurance Information
    hasInsurance: false,
    insuranceProvider: '',
    memberId: '',
    groupNumber: '',
    insurancePhone: '',
    
    // Additional Information
    allergies: '',
    medications: '',
    medicalHistory: '',
    specialRequests: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  })
  
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<any>(null)
  const [requiresPreAuth, setRequiresPreAuth] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const appointmentTypes = businessType === 'medical_practice' 
    ? MEDICAL_APPOINTMENT_TYPES 
    : DENTAL_APPOINTMENT_TYPES

  const providers = businessType === 'medical_practice'
    ? [
        { id: 'dr-smith', name: 'Dr. Sarah Smith', specialty: 'Family Medicine', icon: '👩‍⚕️' },
        { id: 'dr-johnson', name: 'Dr. Michael Johnson', specialty: 'Internal Medicine', icon: '👨‍⚕️' },
        { id: 'dr-wilson', name: 'Dr. Emily Wilson', specialty: 'Cardiology', icon: '❤️' }
      ]
    : [
        { id: 'dr-brown', name: 'Dr. James Brown', specialty: 'General Dentistry', icon: '🦷' },
        { id: 'dr-davis', name: 'Dr. Lisa Davis', specialty: 'Oral Surgery', icon: '⚕️' },
        { id: 'hygienist-jones', name: 'Sarah Jones, RDH', specialty: 'Dental Hygienist', icon: '🪥' }
      ]

  const insuranceProviders = businessType === 'medical_practice' 
    ? INSURANCE_PROVIDERS 
    : DENTAL_INSURANCE_PROVIDERS

  const urgencyLevels = businessType === 'medical_practice'
    ? [
        { value: 'routine', label: 'Routine', description: 'Regular appointment', color: 'text-green-600' },
        { value: 'urgent', label: 'Urgent', description: 'Same day preferred', color: 'text-orange-600' },
        { value: 'emergency', label: 'Emergency', description: 'Immediate attention needed', color: 'text-red-600' }
      ]
    : [
        { value: 'routine', label: 'Routine', description: 'Regular appointment', color: 'text-green-600' },
        { value: 'urgent', label: 'Urgent', description: 'Pain or discomfort', color: 'text-orange-600' },
        { value: 'emergency', label: 'Emergency', description: 'Severe pain or trauma', color: 'text-red-600' }
      ]

  useEffect(() => {
    if (formData.appointmentType) {
      const appointmentType = appointmentTypes.find(apt => apt.id === formData.appointmentType)
      if (appointmentType) {
        setSelectedAppointmentType(appointmentType)
        setFormData(prev => ({ ...prev, duration: appointmentType.duration }))
        setEstimatedCost(appointmentType.basePrice)
        setRequiresPreAuth(appointmentType.requiresPreAuth || false)
      }
    }
  }, [formData.appointmentType, appointmentTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const appointmentData = {
        // Patient Information
        patient: {
          firstName: formData.patientFirstName,
          lastName: formData.patientLastName,
          email: formData.patientEmail,
          phone: formData.patientPhone,
          dateOfBirth: formData.dateOfBirth,
          fullName: `${formData.patientFirstName} ${formData.patientLastName}`
        },
        
        // Appointment Details
        appointmentType: formData.appointmentType,
        appointmentTypeName: selectedAppointmentType?.name || '',
        provider: formData.provider,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        
        // Medical/Dental Specific
        reasonForVisit: formData.reasonForVisit,
        urgencyLevel: formData.urgencyLevel,
        previousPatient: formData.previousPatient,
        referringProvider: formData.referringProvider,
        
        // Insurance
        insurance: formData.hasInsurance ? {
          provider: formData.insuranceProvider,
          memberId: formData.memberId,
          groupNumber: formData.groupNumber,
          phone: formData.insurancePhone,
          requiresPreAuth: requiresPreAuth
        } : null,
        
        // Medical Information
        medicalInfo: {
          allergies: formData.allergies,
          medications: formData.medications,
          medicalHistory: formData.medicalHistory,
          specialRequests: formData.specialRequests
        },
        
        // Emergency Contact
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relation: formData.emergencyContactRelation
        },
        
        // Additional Details
        estimatedCost: estimatedCost,
        requiresInsurance: selectedAppointmentType?.requiresInsurance || false,
        category: selectedAppointmentType?.category || 'consultation',
        status: 'scheduled',
        businessType: businessType
      }

      await onSubmit(appointmentData)
      onClose()
    } catch (error) {
      console.error('Failed to create appointment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6 max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {businessType === 'medical_practice' 
                    ? 'Schedule Medical Appointment' 
                    : 'Schedule Dental Appointment'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Patient Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.patientFirstName}
                        onChange={(e) => setFormData({...formData, patientFirstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.patientLastName}
                        onChange={(e) => setFormData({...formData, patientLastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Doe"
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
                      value={formData.patientEmail}
                      onChange={(e) => setFormData({...formData, patientEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john.doe@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="previousPatient"
                      checked={formData.previousPatient}
                      onChange={(e) => setFormData({...formData, previousPatient: e.target.checked})}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="previousPatient" className="ml-2 block text-sm text-gray-900">
                      Existing patient
                    </label>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Appointment Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {businessType === 'medical_practice' ? 'Procedure Type *' : 'Service Type *'}
                    </label>
                    <select
                      required
                      value={formData.appointmentType}
                      onChange={(e) => setFormData({...formData, appointmentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      {appointmentTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.icon} {type.name} ({type.duration} min) - ${type.basePrice}
                        </option>
                      ))}
                    </select>
                    {selectedAppointmentType && (
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedAppointmentType.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {businessType === 'medical_practice' ? 'Provider *' : 'Provider *'}
                    </label>
                    <select
                      required
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Provider</option>
                      {providers.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.icon} {provider.name} - {provider.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency Level
                    </label>
                    <div className="space-y-2">
                      {urgencyLevels.map(level => (
                        <label key={level.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="urgencyLevel"
                            value={level.value}
                            checked={formData.urgencyLevel === level.value}
                            onChange={(e) => setFormData({...formData, urgencyLevel: e.target.value})}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-medium ${level.color}`}>
                            {level.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            - {level.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Visit
                    </label>
                    <textarea
                      rows={3}
                      value={formData.reasonForVisit}
                      onChange={(e) => setFormData({...formData, reasonForVisit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={businessType === 'medical_practice' 
                        ? 'Annual checkup, follow-up visit, specific symptoms...'
                        : 'Routine cleaning, tooth pain, consultation...'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2 mb-4">Insurance Information</h4>
                
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="hasInsurance"
                    checked={formData.hasInsurance}
                    onChange={(e) => setFormData({...formData, hasInsurance: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasInsurance" className="ml-2 block text-sm text-gray-900">
                    Patient has insurance
                  </label>
                </div>

                {formData.hasInsurance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Provider
                      </label>
                      <select
                        value={formData.insuranceProvider}
                        onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Provider</option>
                        {insuranceProviders.map(provider => (
                          <option key={provider} value={provider}>
                            {provider}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member ID
                      </label>
                      <input
                        type="text"
                        value={formData.memberId}
                        onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ABC123456789"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group Number
                      </label>
                      <input
                        type="text"
                        value={formData.groupNumber}
                        onChange={(e) => setFormData({...formData, groupNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="GRP12345"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insurance Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.insurancePhone}
                        onChange={(e) => setFormData({...formData, insurancePhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(800) 123-4567"
                      />
                    </div>
                  </div>
                )}

                {requiresPreAuth && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Pre-Authorization Required
                        </h3>
                        <p className="text-sm text-amber-700">
                          This procedure requires insurance pre-authorization. Please contact your insurance provider before the appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Information */}
              {estimatedCost > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Estimated Cost</h4>
                  <div className="text-2xl font-bold text-blue-900">${estimatedCost}</div>
                  <p className="text-sm text-blue-700">
                    {formData.hasInsurance 
                      ? 'Final cost may vary based on insurance coverage'
                      : 'Self-pay rate shown. Insurance coverage may reduce this amount'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.patientFirstName || !formData.patientLastName || !formData.patientEmail || !formData.appointmentType || !formData.provider || !formData.date || !formData.time}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
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