'use client'

import React from 'react'
import TourEngine, { TourStep } from './TourEngine'
import TestAppointmentView from './steps/TestAppointmentView'
import BookingManagementDemo from './steps/BookingManagementDemo'
import PhoneForwardingIntro from './steps/PhoneForwardingIntro'
import ServiceRefinement from './steps/ServiceRefinement'
import BusinessProfileSetup from './steps/BusinessProfileSetup'

export interface StarterTourProps {
  businessName: string
  phoneNumber: string
  existingPhoneNumber: string
  onComplete: () => void
  onExit?: () => void
}

export default function StarterTour({
  businessName,
  phoneNumber,
  existingPhoneNumber,
  onComplete,
  onExit
}: StarterTourProps) {
  const starterSteps: TourStep[] = [
    {
      id: 'test-appointment',
      title: 'Your First Test Appointment',
      description: 'See how your AI booking appeared in the dashboard',
      component: (props) => (
        <TestAppointmentView 
          {...props}
          phoneNumber={phoneNumber}
          showTestCall={true}
        />
      ),
      required: true,
      canSkip: false,
      estimatedTime: 3,
      completedMessage: 'Great! You can see how AI bookings appear in real-time.'
    },
    {
      id: 'booking-management',
      title: 'Managing Your Bookings',
      description: 'Learn how to view, edit, and manage appointments',
      component: (props) => (
        <BookingManagementDemo 
          {...props}
          planTier="starter"
        />
      ),
      required: true,
      canSkip: false,
      estimatedTime: 4,
      completedMessage: 'Perfect! You now know how to manage all your appointments.'
    },
    {
      id: 'phone-forwarding-intro',
      title: 'Ready to Go Live? (Optional)',
      description: 'Forward your business line when you feel confident',
      component: (props) => (
        <PhoneForwardingIntro 
          {...props}
          phoneNumber={phoneNumber}
          existingPhoneNumber={existingPhoneNumber}
          planTier="starter"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Setup phone forwarding anytime from Settings → Phone',
      estimatedTime: 2,
      completedMessage: 'You can forward your phone line whenever you\'re ready!'
    },
    {
      id: 'service-refinement',
      title: 'Customize Your Services (Optional)',
      description: 'Add pricing and descriptions to your services',
      component: (props) => (
        <ServiceRefinement 
          {...props}
          planTier="starter"
          showPricingOptions={false}
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Perfect your services anytime from Services menu',
      estimatedTime: 3,
      completedMessage: 'Your services are looking professional!'
    },
    {
      id: 'business-profile',
      title: 'Complete Your Profile (Optional)',
      description: 'Add your business details and contact information',
      component: (props) => (
        <BusinessProfileSetup 
          {...props}
          planTier="starter"
          showBasicProfileOnly={true}
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Complete your profile anytime from Settings',
      estimatedTime: 3,
      completedMessage: 'Your business profile looks great!'
    }
  ]

  return (
    <TourEngine
      steps={starterSteps}
      onComplete={onComplete}
      onExit={onExit}
      planTier="starter"
      businessName={businessName}
      autoSaveProgress={true}
    />
  )
}