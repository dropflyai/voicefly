'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { BusinessAPI } from '../../../lib/supabase'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

// Helper function to get service icon based on category and business type
const getServiceIcon = (category: string = 'General', businessType: string = 'beauty_salon'): string => {
  const categoryLower = category.toLowerCase()
  
  // Medical practice icons
  if (businessType === 'medical_practice') {
    if (categoryLower.includes('consultation')) return '🩺'
    if (categoryLower.includes('preventive')) return '❤️'
    if (categoryLower.includes('procedure')) return '⚕️'
    if (categoryLower.includes('follow')) return '📋'
    if (categoryLower.includes('emergency')) return '🚨'
    return '🩺'
  }
  
  // Dental practice icons  
  if (businessType === 'dental_practice') {
    if (categoryLower.includes('preventive')) return '🦷'
    if (categoryLower.includes('restorative')) return '🔧'
    if (categoryLower.includes('cosmetic')) return '✨'
    if (categoryLower.includes('surgery') || categoryLower.includes('surgical')) return '⚕️'
    if (categoryLower.includes('emergency')) return '🚨'
    if (categoryLower.includes('consultation')) return '📋'
    return '🦷'
  }
  
  // Beauty salon icons (default)
  if (categoryLower.includes('manicure')) return '💅'
  if (categoryLower.includes('pedicure')) return '🦶'
  if (categoryLower.includes('enhancement')) return '✨'
  if (categoryLower.includes('spa')) return '🧖‍♀️'
  if (categoryLower.includes('massage')) return '💆‍♀️'
  if (categoryLower.includes('facial')) return '✨'
  
  // Default icon
  return '💅'
}
import { clsx } from 'clsx'

interface Service {
  id: string
  name: string
  description: string
  category: string
  duration: number
  price: number
  isActive: boolean
  isFeatured: boolean
  requiresDeposit: boolean
  depositAmount?: number
  bookingCount: number
  revenue: number
  lastBooked?: string
}

// No mock data - load real services from database

// Helper function to determine if a service is high value
const isHighValueService = (price: number) => price >= 50

// Helper function to get categories based on business type
const getBusinessTypeCategories = (businessType: string) => {
  const baseCategories = [
    { name: 'All Categories', value: 'all', color: 'bg-gray-100 text-gray-800' }
  ]
  
  switch (businessType) {
    case 'medical_practice':
      return [
        ...baseCategories,
        { name: 'Consultations', value: 'consultations', color: 'bg-blue-100 text-blue-800' },
        { name: 'Preventive Care', value: 'preventive-care', color: 'bg-green-100 text-green-800' },
        { name: 'Procedures', value: 'procedures', color: 'bg-purple-100 text-purple-800' },
        { name: 'Follow-up Care', value: 'follow-up-care', color: 'bg-amber-100 text-amber-800' },
        { name: 'Urgent & Emergency', value: 'urgent-emergency', color: 'bg-red-100 text-red-800' }
      ]
    case 'dental_practice':
      return [
        ...baseCategories,
        { name: 'Preventive Care', value: 'preventive', color: 'bg-green-100 text-green-800' },
        { name: 'Restorative Care', value: 'restorative', color: 'bg-blue-100 text-blue-800' },
        { name: 'Cosmetic Dentistry', value: 'cosmetic', color: 'bg-purple-100 text-purple-800' },
        { name: 'Oral Surgery', value: 'surgical', color: 'bg-red-100 text-red-800' },
        { name: 'Emergency Care', value: 'emergency', color: 'bg-orange-100 text-orange-800' },
        { name: 'Consultations', value: 'consultation', color: 'bg-gray-100 text-gray-800' }
      ]
    case 'Medical Spa':
      return [
        ...baseCategories,
        { name: 'Injectables', value: 'Injectables', color: 'bg-brand-100 text-brand-800' },
        { name: 'Laser Treatments', value: 'Laser Treatments', color: 'bg-beauty-100 text-beauty-800' },
        { name: 'Skin Treatments', value: 'Skin Treatments', color: 'bg-purple-100 text-purple-800' },
        { name: 'Body Contouring', value: 'Body Contouring', color: 'bg-green-100 text-green-800' }
      ]
    case 'Day Spa':
      return [
        ...baseCategories,
        { name: 'Massages', value: 'Massages', color: 'bg-brand-100 text-brand-800' },
        { name: 'Facials', value: 'Facials', color: 'bg-beauty-100 text-beauty-800' },
        { name: 'Body Treatments', value: 'Body Treatments', color: 'bg-purple-100 text-purple-800' },
        { name: 'Specialty Services', value: 'Specialty Services', color: 'bg-green-100 text-green-800' }
      ]
    case 'Wellness Center':
      return [
        ...baseCategories,
        { name: 'Alternative Medicine', value: 'Alternative Medicine', color: 'bg-brand-100 text-brand-800' },
        { name: 'Energy Healing', value: 'Energy Healing', color: 'bg-beauty-100 text-beauty-800' },
        { name: 'Wellness Consultations', value: 'Wellness Consultations', color: 'bg-purple-100 text-purple-800' },
        { name: 'Therapeutic Services', value: 'Therapeutic Services', color: 'bg-green-100 text-green-800' }
      ]
    default:
      return [
        ...baseCategories,
        { name: 'Manicures', value: 'Manicures', color: 'bg-brand-100 text-brand-800' },
        { name: 'Pedicures', value: 'Pedicures', color: 'bg-beauty-100 text-beauty-800' },
        { name: 'Enhancements', value: 'Enhancements', color: 'bg-purple-100 text-purple-800' },
        { name: 'Spa Services', value: 'Spa Services', color: 'bg-green-100 text-green-800' }
      ]
  }
}

// Note: categories will be dynamic based on business type

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [businessType, setBusinessType] = useState('Nail Salon')

  // Load real services from database
  useEffect(() => {
    loadServices()
  }, [])

  const handleAddService = async (serviceData: any) => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) {
        console.error('No business ID available')
        return
      }

      // Create service data for API
      const newServiceData = {
        name: serviceData.name,
        description: serviceData.description || '',
        category: serviceData.category || 'General',
        duration_minutes: serviceData.duration,
        base_price: serviceData.price,
        is_active: true,
        requires_deposit: serviceData.requiresDeposit || false,
        deposit_amount: serviceData.depositAmount || 0
      }

      // Add to database
      const createdService = await BusinessAPI.addService(businessId, newServiceData)
      
      // Reload services to show the new one
      await loadServices()
      
      setShowAddModal(false)
      
      console.log('Service added successfully')
    } catch (error) {
      console.error('Failed to add service:', error)
      alert('Failed to add service. Please try again.')
    }
  }

  const loadServices = async () => {
    try {
      setLoading(true)
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      // Load business data to get business type
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData?.business_type) {
        setBusinessType(businessData.business_type)
      }

      const realServices = await BusinessAPI.getServices(businessId)
      
      // Transform to match our interface
      const transformedServices: Service[] = realServices.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        category: service.category || 'General',
        duration: service.duration_minutes,
        price: service.base_price || 0,
        isActive: service.is_active,
        isFeatured: false, // Could be added to DB later
        requiresDeposit: false, // Could be added to DB later
        bookingCount: 0, // Would need to calculate from appointments
        revenue: 0, // Would need to calculate from payments
        lastBooked: undefined // Would need to query appointments
      }))
      
      setServices(transformedServices)
    } catch (error) {
      console.error('Error loading services:', error)
      setServices([]) // Show empty state on error
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {businessType === 'medical_practice' ? 'Medical Procedures' : 
               businessType === 'dental_practice' ? 'Dental Services' : 'Services'}
            </h1>
            <p className="text-gray-600 mt-1">
              {services.length === 0 
                ? (businessType === 'medical_practice' ? 'No procedures yet - Add your first medical procedure to get started!' :
                   businessType === 'dental_practice' ? 'No dental services yet - Add your first dental service to get started!' :
                   'No services yet - Add your first service to get started!')
                : (businessType === 'medical_practice' ? `Managing ${services.length} medical procedures for your practice` :
                   businessType === 'dental_practice' ? `Managing ${services.length} dental services for your practice` :
                   `Managing ${services.length} services for your business`)
              }
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {businessType === 'medical_practice' ? 'Add Procedure' :
               businessType === 'dental_practice' ? 'Add Service' : 'Add Service'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={businessType === 'medical_practice' ? 'Search procedures...' :
                           businessType === 'dental_practice' ? 'Search dental services...' : 'Search services...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {getBusinessTypeCategories(businessType).map(category => (
              <button
                key={category.value}
                onClick={() => setCategoryFilter(category.value)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  categoryFilter === category.value
                    ? category.color
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {services.length === 0 ? 
                  (businessType === 'medical_practice' ? 'No procedures yet' :
                   businessType === 'dental_practice' ? 'No dental services yet' : 'No services yet') :
                  (businessType === 'medical_practice' ? 'No matching procedures' :
                   businessType === 'dental_practice' ? 'No matching services' : 'No matching services')
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {services.length === 0 
                  ? (businessType === 'medical_practice' ? 'Add your first medical procedure to get started with patient appointments' :
                     businessType === 'dental_practice' ? 'Add your first dental service to get started with patient appointments' :
                     'Add your first service to get started with bookings')
                  : 'Try adjusting your search or filters'
                }
              </p>
              {services.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {businessType === 'medical_practice' ? 'Add Your First Procedure' :
                   businessType === 'dental_practice' ? 'Add Your First Service' : 'Add Your First Service'}
                </button>
              )}
            </div>
          ) : (
            filteredServices.map(service => (
              <div key={service.id} className="card">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className={clsx(
                        'h-12 w-12 rounded-lg flex items-center justify-center',
                        service.isActive ? 'bg-brand-100' : 'bg-gray-100'
                      )}>
                        <span className="text-lg">
                          {getServiceIcon(service.category, businessType)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {service.name}
                        </h3>
                        {service.isFeatured && (
                          <StarIconSolid className="h-4 w-4 text-yellow-400" />
                        )}
                        {!service.isActive && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {service.duration} min
                        </div>
                        <div className={clsx(
                          "flex items-center",
                          isHighValueService(service.price) && "text-yellow-600 font-semibold"
                        )}>
                          <CurrencyDollarIcon className={clsx(
                            "h-4 w-4 mr-1",
                            isHighValueService(service.price) && "text-yellow-500"
                          )} />
                          ${service.price.toFixed(2)}
                          {isHighValueService(service.price) && (
                            <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1 rounded font-medium">
                              PREMIUM
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {service.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedService(service)
                        setShowModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit service"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete service"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Service Modal */}
        {showAddModal && (
          <AddServiceModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddService}
            businessType={businessType}
          />
        )}
      </div>
    </Layout>
  )
}

// Add Service Modal Component
interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (serviceData: any) => void
  businessType: string
}

function AddServiceModal({ isOpen, onClose, onSubmit, businessType }: AddServiceModalProps) {
  const modalCategories = getBusinessTypeCategories(businessType).slice(1) // Remove 'All Categories'
  const defaultCategory = modalCategories[0]?.value || 'general'
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: defaultCategory,
    duration: businessType === 'medical_practice' ? 45 : businessType === 'dental_practice' ? 60 : businessType === 'Medical Spa' ? 45 : 30,
    price: businessType === 'medical_practice' ? 200 : businessType === 'dental_practice' ? 120 : businessType === 'Medical Spa' ? 150 : businessType === 'Day Spa' ? 85 : 25,
    requiresDeposit: false,
    depositAmount: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      
      // Reset form with business-type appropriate defaults
      setFormData({
        name: '',
        description: '',
        category: defaultCategory,
        duration: businessType === 'medical_practice' ? 45 : businessType === 'dental_practice' ? 60 : businessType === 'Medical Spa' ? 45 : 30,
        price: businessType === 'medical_practice' ? 200 : businessType === 'dental_practice' ? 120 : businessType === 'Medical Spa' ? 150 : businessType === 'Day Spa' ? 85 : 25,
        requiresDeposit: false,
        depositAmount: 0
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to add service:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {businessType === 'medical_practice' ? 'Add New Medical Procedure' :
                   businessType === 'dental_practice' ? 'Add New Dental Service' : 'Add New Service'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {businessType === 'medical_practice' ? 'Procedure Name *' :
                     businessType === 'dental_practice' ? 'Service Name *' : 'Service Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={businessType === 'medical_practice' ? 'e.g., Annual Physical Exam' :
                                businessType === 'dental_practice' ? 'e.g., Routine Cleaning' :
                                'e.g., Classic Manicure'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={businessType === 'medical_practice' ? 'Brief description of the medical procedure...' :
                                businessType === 'dental_practice' ? 'Brief description of the dental service...' :
                                'Brief description of the service...'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {modalCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 30})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresDeposit"
                    checked={formData.requiresDeposit}
                    onChange={(e) => setFormData({...formData, requiresDeposit: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresDeposit" className="ml-2 block text-sm text-gray-900">
                    Requires deposit
                  </label>
                </div>

                {formData.requiresDeposit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData({...formData, depositAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Service'}
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