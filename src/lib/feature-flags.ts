/**
 * Feature Flags System
 * Controls rollout of new receptionist features while protecting existing beauty salon functionality
 */

import { ReactNode } from 'react';

export const FEATURE_FLAGS = {
  // Core receptionist features
  receptionistFeatures: process.env.ENABLE_RECEPTIONIST_FEATURES === 'true',
  businessTypeSelector: process.env.ENABLE_BUSINESS_TYPE_SELECTOR === 'true',
  callLogs: process.env.ENABLE_CALL_LOGS === 'true',
  leadManagement: process.env.ENABLE_LEAD_MANAGEMENT === 'true',
  
  // Advanced features (for future)
  multiCalendar: process.env.ENABLE_MULTI_CALENDAR === 'true',
  callRouting: process.env.ENABLE_CALL_ROUTING === 'true',
  crmIntegration: process.env.ENABLE_CRM_INTEGRATION === 'true',
} as const;

export type BusinessType = 'beauty_salon' | 'general_business' | 'medical_practice' | 'dental_practice' | 'home_services' | 'fitness_wellness';

/**
 * Get business type with fallback protection
 * Always defaults to beauty_salon if receptionist features disabled
 */
export const getBusinessType = (userBusinessType?: string): BusinessType => {
  if (!FEATURE_FLAGS.receptionistFeatures) {
    return 'beauty_salon'; // Force beauty salon if feature disabled
  }
  
  const validTypes: BusinessType[] = ['beauty_salon', 'general_business', 'medical_practice', 'dental_practice', 'home_services', 'fitness_wellness'];
  
  if (userBusinessType && validTypes.includes(userBusinessType as BusinessType)) {
    return userBusinessType as BusinessType;
  }
  
  return 'beauty_salon'; // Safe default
};

/**
 * Check if user should see receptionist features
 */
export const shouldShowReceptionistFeatures = (businessType?: string): boolean => {
  if (!FEATURE_FLAGS.receptionistFeatures) return false;
  
  const type = getBusinessType(businessType);
  return type !== 'beauty_salon';
};

/**
 * Check if user should see beauty features
 */
export const shouldShowBeautyFeatures = (businessType?: string): boolean => {
  const type = getBusinessType(businessType);
  return type === 'beauty_salon';
};

/**
 * Get Maya job ID based on business type
 */
export const getMayaJobForBusinessType = (businessType: BusinessType): string => {
  switch (businessType) {
    case 'beauty_salon':
      return 'nail-salon-receptionist';
    case 'medical_practice':
      return 'medical-scheduler';
    case 'dental_practice':
      return 'dental-coordinator';
    case 'home_services':
      return 'general-receptionist'; // Home services use general receptionist with specialized training
    case 'fitness_wellness':
      return 'fitness-coordinator';
    case 'general_business':
    default:
      return 'general-receptionist';
  }
};

/**
 * Get features available for business type
 */
export const getFeaturesForBusinessType = (businessType: BusinessType) => {
  switch (businessType) {
    case 'beauty_salon':
      return {
        appointments: true,
        services: true,
        staff: true,
        customers: true,
        analytics: true,
        receptionist: false,
        callLogs: false,
        leadManagement: false
      };
    
    case 'general_business':
    case 'home_services':
      return {
        appointments: FEATURE_FLAGS.multiCalendar,
        services: false,
        staff: false,
        customers: true,
        analytics: true,
        receptionist: true,
        callLogs: FEATURE_FLAGS.callLogs,
        leadManagement: FEATURE_FLAGS.leadManagement
      };
    
    case 'medical_practice':
    case 'dental_practice':
      return {
        appointments: true, // Medical/dental need appointment scheduling
        services: true, // Need to manage procedures/treatments
        staff: true, // Need to manage doctors/dentists
        customers: true, // Patient management
        analytics: true,
        receptionist: true,
        callLogs: FEATURE_FLAGS.callLogs,
        leadManagement: FEATURE_FLAGS.leadManagement
      };
    
    case 'fitness_wellness':
      return {
        appointments: true, // Need class/session scheduling
        services: true, // Need to manage classes/training programs
        staff: true, // Need to manage trainers/instructors
        customers: true, // Member management
        analytics: true,
        receptionist: true,
        callLogs: FEATURE_FLAGS.callLogs,
        leadManagement: FEATURE_FLAGS.leadManagement
      };
      
    default:
      return getFeaturesForBusinessType('beauty_salon');
  }
};

/**
 * Feature flag debugging (development only)
 */
export const getFeatureFlagStatus = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return {
    ...FEATURE_FLAGS,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
};

// React hook for feature flags
export const useFeatureFlags = () => {
  return FEATURE_FLAGS;
};

// Feature gate component - simple wrapper for conditional rendering
export const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: keyof typeof FEATURE_FLAGS;
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const isEnabled = FEATURE_FLAGS[feature];
  return isEnabled ? children : fallback;
};