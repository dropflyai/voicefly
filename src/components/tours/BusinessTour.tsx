'use client'

import React from 'react'
import TourEngine, { TourStep } from './TourEngine'
import TestAppointmentView from './steps/TestAppointmentView'
import BookingManagementDemo from './steps/BookingManagementDemo'
import PaymentProcessingIntro from './steps/PaymentProcessingIntro'
import LoyaltyProgramIntro from './steps/LoyaltyProgramIntro'
import MultiLocationSetup from './steps/MultiLocationSetup'
import PhoneForwardingIntro from './steps/PhoneForwardingIntro'
import AdvancedAnalytics from './steps/AdvancedAnalytics'
import BusinessProfileSetup from './steps/BusinessProfileSetup'
import EmailMarketingSetup from './steps/EmailMarketingSetup'
import StaffManagementSetup from './steps/StaffManagementSetup'

export interface BusinessTourProps {
  businessName: string
  phoneNumber: string
  existingPhoneNumber: string
  onComplete: () => void
  onExit?: () => void
}

export default function BusinessTour({
  businessName,
  phoneNumber,
  existingPhoneNumber,
  onComplete,
  onExit
}: BusinessTourProps) {
  const businessSteps: TourStep[] = [
    {
      id: 'test-appointment',
      title: 'Your Custom AI Assistant in Action',
      description: 'See how your personalized AI booking appeared in the dashboard',
      component: (props) => (
        <TestAppointmentView 
          {...props}
          phoneNumber={phoneNumber}
          showTestCall={true}
          customMessage="Your Business tier includes a custom AI assistant trained specifically for your business!"
        />
      ),
      required: true,
      canSkip: false,
      estimatedTime: 3,
      completedMessage: 'Your custom AI assistant is working perfectly!'
    },
    {
      id: 'booking-management-enterprise',
      title: 'Enterprise Booking Management',
      description: 'Advanced appointment management with multi-location support',
      component: (props) => (
        <BookingManagementDemo 
          {...props}
          planTier="business"
        />
      ),
      required: true,
      canSkip: false,
      estimatedTime: 4,
      completedMessage: 'You\'re ready for enterprise-level appointment management.'
    },
    {
      id: 'payment-processing-business',
      title: 'Advanced Payment Processing',
      description: 'Multi-location payment setup with enterprise features',
      component: (props) => (
        <PaymentProcessingIntro 
          {...props}
          planTier="business"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Configure payment processing for each location when ready',
      estimatedTime: 6,
      completedMessage: 'Payment processing is configured for enterprise growth!'
    },
    {
      id: 'multi-location-setup',
      title: 'Multi-Location Management',
      description: 'Add your other locations when ready',
      component: (props) => (
        <MultiLocationSetup 
          {...props}
          businessName={businessName}
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Start with one location and expand gradually',
      estimatedTime: 8,
      completedMessage: 'You\'re ready to manage multiple locations!'
    },
    {
      id: 'business-profile-setup',
      title: 'Complete Business Profile',
      description: 'Set up your complete business profile with branding',
      component: (props) => (
        <BusinessProfileSetup 
          {...props}
          businessName={businessName}
          planTier="business"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Complete your profile when ready',
      estimatedTime: 5,
      completedMessage: 'Your business profile is complete and professional!'
    },
    {
      id: 'enterprise-phone-setup',
      title: 'Enterprise Phone Management',
      description: 'Forward multiple location numbers to AI system',
      component: (props) => (
        <PhoneForwardingIntro 
          {...props}
          phoneNumber={phoneNumber}
          existingPhoneNumber={existingPhoneNumber}
          businessName={businessName}
          planTier="business"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Test individual locations first, then consolidate',
      estimatedTime: 5,
      completedMessage: 'Enterprise phone management is configured!'
    },
    {
      id: 'advanced-reporting',
      title: 'Advanced Business Intelligence',
      description: 'Cross-location analytics and automated reporting',
      component: (props) => (
        <AdvancedAnalytics 
          {...props}
          planTier="business"
          businessName={businessName}
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Explore advanced reports anytime from Analytics',
      estimatedTime: 4,
      completedMessage: 'You have powerful insights to scale your business!'
    },
    {
      id: 'email-marketing-enterprise',
      title: 'Enterprise Email Marketing',
      description: 'Advanced email campaigns across all locations',
      component: (props) => (
        <EmailMarketingSetup 
          {...props}
          businessName={businessName}
          planTier="business"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Set up email marketing when ready to engage customers',
      estimatedTime: 6,
      completedMessage: 'Your email marketing campaigns are ready across all locations!'
    },
    {
      id: 'staff-management-enterprise',
      title: 'Enterprise Staff Management',
      description: 'Set up unlimited staff across all your locations',
      component: (props) => (
        <StaffManagementSetup 
          {...props}
          planTier="business"
          businessName={businessName}
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Add staff anytime from Dashboard → Staff',
      estimatedTime: 6,
      completedMessage: 'Your staff can now take bookings across all locations!'
    },
    {
      id: 'loyalty-program-enterprise', 
      title: 'Enterprise Loyalty Program',
      description: 'Advanced loyalty features with cross-location rewards',
      component: (props) => (
        <LoyaltyProgramIntro 
          {...props}
          planTier="business"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Configure enterprise loyalty features when ready',
      estimatedTime: 5,
      completedMessage: 'Your loyalty program will work across all locations!'
    }
  ]

  return (
    <TourEngine
      steps={businessSteps}
      onComplete={onComplete}
      onExit={onExit}
      planTier="business"
      businessName={businessName}
      autoSaveProgress={true}
    />
  )
}