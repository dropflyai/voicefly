'use client'

import React from 'react'
import TourEngine, { TourStep } from './TourEngine'
import TestAppointmentView from './steps/TestAppointmentView'
import BookingManagementDemo from './steps/BookingManagementDemo'
import PaymentProcessingIntro from './steps/PaymentProcessingIntro'
import LoyaltyProgramIntro from './steps/LoyaltyProgramIntro'
import EmailMarketingSetup from './steps/EmailMarketingSetup'
import PhoneForwardingIntro from './steps/PhoneForwardingIntro'
import AdvancedAnalytics from './steps/AdvancedAnalytics'
import StaffManagementSetup from './steps/StaffManagementSetup'

export interface ProfessionalTourProps {
  businessName: string
  phoneNumber: string
  existingPhoneNumber: string
  onComplete: () => void
  onExit?: () => void
}

export default function ProfessionalTour({
  businessName,
  phoneNumber,
  existingPhoneNumber,
  onComplete,
  onExit
}: ProfessionalTourProps) {
  const professionalSteps: TourStep[] = [
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
      completedMessage: 'Excellent! Your AI is working perfectly.'
    },
    {
      id: 'booking-management',
      title: 'Managing Your Bookings',
      description: 'Learn advanced appointment management features',
      component: (props) => (
        <BookingManagementDemo 
          {...props}
          planTier="professional"
        />
      ),
      required: true,
      canSkip: false,
      estimatedTime: 3,
      completedMessage: 'Great! You\'re ready to manage appointments like a pro.'
    },
    {
      id: 'payment-processing-intro',
      title: 'Payment Processing Available',
      description: 'Ready to accept credit cards automatically?',
      component: (props) => (
        <PaymentProcessingIntro 
          {...props}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Setup anytime from Settings → Payments',
      estimatedTime: 5,
      completedMessage: 'Payment processing is ready when you are!'
    },
    {
      id: 'loyalty-program-intro', 
      title: 'Loyalty Program Setup',
      description: 'Turn customers into regulars with points',
      component: (props) => (
        <LoyaltyProgramIntro 
          {...props}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Configure loyalty program anytime from Marketing → Loyalty',
      estimatedTime: 4,
      completedMessage: 'Your loyalty program will keep customers coming back!'
    },
    {
      id: 'staff-management-setup',
      title: 'Add Your Team Members',
      description: 'Set up staff schedules and specialties for customer bookings',
      component: (props) => (
        <StaffManagementSetup 
          {...props}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Add staff anytime from Dashboard → Staff',
      estimatedTime: 5,
      completedMessage: 'Your staff can now take bookings individually!'
    },
    {
      id: 'email-marketing',
      title: 'Email Marketing Campaigns',
      description: 'Send promotions and stay connected with customers',
      component: (props) => (
        <EmailMarketingSetup 
          {...props}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Start email marketing anytime from Marketing → Campaigns',
      estimatedTime: 4,
      completedMessage: 'You\'re ready to launch effective marketing campaigns!'
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics Overview',
      description: 'Understand your business performance and growth',
      component: (props) => (
        <AdvancedAnalytics 
          {...props}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Explore analytics anytime from Reports → Analytics',
      estimatedTime: 3,
      completedMessage: 'You now have insights to grow your business!'
    },
    {
      id: 'phone-forwarding-professional',
      title: 'Forward Your Business Line (When Ready)',
      description: 'Replace your existing phone system with AI',
      component: (props) => (
        <PhoneForwardingIntro 
          {...props}
          phoneNumber={phoneNumber}
          existingPhoneNumber={existingPhoneNumber}
          planTier="professional"
        />
      ),
      required: false,
      canSkip: true,
      skipMessage: 'Keep testing with your dedicated number for now',
      estimatedTime: 3,
      completedMessage: 'You\'re ready to go live whenever you feel confident!'
    }
  ]

  return (
    <TourEngine
      steps={professionalSteps}
      onComplete={onComplete}
      onExit={onExit}
      planTier="professional"
      businessName={businessName}
      autoSaveProgress={true}
    />
  )
}