'use client'

import React, { useState } from 'react'
import { 
  SparklesIcon,
  CheckIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export interface MayaJob {
  id: string
  title: string
  icon: string
  description: string
  businessTypes: string[]
  pricing: string
  features: string[]
  popular?: boolean
  premium?: boolean
  comingSoon?: boolean
}

export const MAYA_JOBS: MayaJob[] = [
  {
    id: 'nail-salon-receptionist',
    title: 'Nail Salon Receptionist',
    icon: '💅',
    description: 'Books manicures, pedicures, and nail art appointments with expertise',
    businessTypes: ['Nail Salon'],
    pricing: '$67-297/mo',
    features: ['Appointment booking', 'Service recommendations', 'Color consultations', 'Nail art scheduling'],
    popular: true
  },
  {
    id: 'hair-salon-coordinator',
    title: 'Hair Salon Coordinator',
    icon: '💇‍♀️',
    description: 'Coordinates cuts, colors, and styling appointments with style expertise',
    businessTypes: ['Hair Salon'],
    pricing: '$67-297/mo',
    features: ['Cut & color booking', 'Stylist matching', 'Treatment scheduling', 'Consultation setup']
  },
  {
    id: 'spa-wellness-assistant',
    title: 'Spa Wellness Assistant',
    icon: '🧘‍♀️',
    description: 'Coordinates treatments, packages, and wellness experiences professionally',
    businessTypes: ['Day Spa', 'Medical Spa', 'Wellness Center'],
    pricing: '$97-397/mo',
    features: ['18+ Treatment booking', 'High-value service coordination', 'Medical spa procedures', 'Holistic wellness programs'],
    premium: true
  },
  {
    id: 'massage-therapy-scheduler',
    title: 'Massage Therapy Scheduler',
    icon: '💆‍♀️',
    description: 'Books therapeutic and relaxation massage sessions with care',
    businessTypes: ['Massage Therapy'],
    pricing: '$67-197/mo',
    features: ['Massage booking', 'Therapist scheduling', 'Health screening', 'Package deals']
  },
  {
    id: 'beauty-salon-assistant',
    title: 'Beauty Salon Assistant',
    icon: '✨',
    description: 'Handles facials, waxing, and beauty service appointments expertly',
    businessTypes: ['Beauty Salon', 'Esthetics'],
    pricing: '$67-297/mo',
    features: ['Facial booking', 'Waxing appointments', 'Skin consultations', 'Treatment planning']
  },
  {
    id: 'barbershop-coordinator',
    title: 'Barbershop Coordinator',
    icon: '💈',
    description: 'Schedules cuts, shaves, and grooming services with precision',
    businessTypes: ['Barbershop'],
    pricing: '$67-197/mo',
    features: ['Haircut booking', 'Shave scheduling', 'Beard trimming', 'Hot towel services']
  },
  // Coming Soon Jobs
  {
    id: 'medical-scheduler',
    title: 'Medical Scheduler',
    icon: '🏥',
    description: 'Professional medical appointment coordination with insurance handling',
    businessTypes: ['Medical Practice', 'Clinic'],
    pricing: '$197-497/mo',
    features: ['Medical scheduling', 'Insurance verification', 'Follow-up booking', 'Referral coordination'],
    premium: true,
    comingSoon: true
  },
  {
    id: 'dental-coordinator',
    title: 'Dental Coordinator',
    icon: '🦷',
    description: 'Schedules cleanings, procedures, and dental care appointments',
    businessTypes: ['Dental Practice'],
    pricing: '$197-397/mo',
    features: ['Cleaning booking', 'Procedure scheduling', 'Insurance handling', 'Reminder systems'],
    comingSoon: true
  },
  {
    id: 'fitness-coordinator',
    title: 'Fitness Coordinator',
    icon: '🏃‍♂️',
    description: 'Books classes, training sessions, and fitness consultations',
    businessTypes: ['Gym', 'Fitness Studio'],
    pricing: '$97-297/mo',
    features: ['Class booking', 'Trainer scheduling', 'Membership sales', 'Trial coordination'],
    comingSoon: true
  }
]

interface MayaJobSelectorProps {
  onJobSelect: (job: MayaJob) => void
  selectedJob?: MayaJob | null
}

export default function MayaJobSelector({ onJobSelect, selectedJob }: MayaJobSelectorProps) {
  const [hoveredJob, setHoveredJob] = useState<string | null>(null)

  const availableJobs = MAYA_JOBS.filter(job => !job.comingSoon)
  const comingSoonJobs = MAYA_JOBS.filter(job => job.comingSoon)

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center bg-purple-50 text-purple-800 px-4 py-2 rounded-full mb-6">
          <SparklesIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold">Choose Maya's Role</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          What Job Should
          <br />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Maya Do For You?
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Maya is ready to work 24/7 in your industry. Select her role to get started with specialized expertise.
        </p>
      </div>

      {/* Available Jobs */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Available Maya Jobs</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableJobs.map((job) => (
            <div
              key={job.id}
              className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                selectedJob?.id === job.id
                  ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                  : hoveredJob === job.id
                  ? 'shadow-xl scale-102 border-2 border-purple-200'
                  : 'shadow-lg hover:shadow-xl border border-gray-200'
              }`}
              onClick={() => onJobSelect(job)}
              onMouseEnter={() => setHoveredJob(job.id)}
              onMouseLeave={() => setHoveredJob(null)}
            >
              {/* Popular Badge */}
              {job.popular && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                  <FireIcon className="w-3 h-3 mr-1" />
                  POPULAR
                </div>
              )}

              {/* Premium Badge */}
              {job.premium && !job.popular && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                  <StarIconSolid className="w-3 h-3 mr-1" />
                  PREMIUM
                </div>
              )}

              {/* Job Icon */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{job.icon}</div>
                <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                <div className="text-purple-600 font-semibold text-sm">{job.pricing}</div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 text-center">{job.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-4">
                {job.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                {job.features.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{job.features.length - 3} more features
                  </div>
                )}
              </div>

              {/* Business Types */}
              <div className="text-xs text-gray-500 text-center">
                Perfect for: {job.businessTypes.join(', ')}
              </div>

              {/* Selection Indicator */}
              {selectedJob?.id === job.id && (
                <div className="absolute inset-0 bg-purple-500 bg-opacity-10 rounded-2xl flex items-center justify-center">
                  <div className="bg-purple-500 text-white p-2 rounded-full">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Jobs */}
      {comingSoonJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Coming Soon</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonJobs.map((job) => (
              <div
                key={job.id}
                className="relative bg-gray-50 rounded-2xl p-6 opacity-75 cursor-not-allowed"
              >
                {/* Coming Soon Badge */}
                <div className="absolute -top-3 -right-3 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                  COMING SOON
                </div>

                {/* Job Icon */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2 grayscale">{job.icon}</div>
                  <h3 className="text-lg font-bold text-gray-700">{job.title}</h3>
                  <div className="text-gray-500 font-semibold text-sm">{job.pricing}</div>
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm mb-4 text-center">{job.description}</p>

                {/* Notify Me Button */}
                <button className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors">
                  Notify Me When Available
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedJob && (
        <div className="text-center">
          <div className="inline-flex items-center bg-green-50 text-green-800 px-4 py-2 rounded-full mb-4">
            <CheckIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-semibold">
              Maya selected as {selectedJob.title}
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            Perfect choice! Maya will specialize in {selectedJob.businessTypes.join(' and ')} operations.
          </p>
          <button
            onClick={() => onJobSelect(selectedJob)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Continue with {selectedJob.title} →
          </button>
        </div>
      )}
    </div>
  )
}