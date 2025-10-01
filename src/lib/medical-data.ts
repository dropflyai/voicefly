/**
 * Medical Practice Foundation Data
 * Comprehensive medical appointment types, specialties, and service categories
 */

export interface MedicalAppointmentType {
  id: string;
  name: string;
  duration: number; // minutes
  category: 'consultation' | 'procedure' | 'preventive' | 'emergency' | 'follow-up';
  requiresInsurance: boolean;
  description: string;
  icon: string;
  basePrice: number;
  requiresPreAuth?: boolean;
}

export interface MedicalSpecialty {
  id: string;
  name: string;
  category: 'primary_care' | 'specialist' | 'mental_health' | 'urgent_care';
  icon: string;
  description: string;
}

export interface MedicalServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  appointmentTypes: string[]; // IDs of appointment types in this category
}

// Medical Appointment Types
export const MEDICAL_APPOINTMENT_TYPES: MedicalAppointmentType[] = [
  // Consultation Appointments
  {
    id: 'new-patient-consultation',
    name: 'New Patient Consultation',
    duration: 60,
    category: 'consultation',
    requiresInsurance: true,
    description: 'Comprehensive initial evaluation and medical history review',
    icon: '🩺',
    basePrice: 250
  },
  {
    id: 'follow-up-consultation',
    name: 'Follow-up Visit',
    duration: 30,
    category: 'follow-up',
    requiresInsurance: true,
    description: 'Review treatment progress and adjust care plan',
    icon: '📋',
    basePrice: 150
  },
  {
    id: 'specialist-consultation',
    name: 'Specialist Consultation',
    duration: 45,
    category: 'consultation',
    requiresInsurance: true,
    description: 'Specialized medical evaluation and treatment planning',
    icon: '🎯',
    basePrice: 300
  },

  // Preventive Care
  {
    id: 'annual-physical',
    name: 'Annual Physical Exam',
    duration: 45,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Comprehensive yearly health assessment and screening',
    icon: '❤️',
    basePrice: 200
  },
  {
    id: 'wellness-check',
    name: 'Wellness Check',
    duration: 30,
    category: 'preventive',
    requiresInsurance: true,
    description: 'General health maintenance and prevention screening',
    icon: '🌟',
    basePrice: 125
  },
  {
    id: 'vaccination-appointment',
    name: 'Vaccination',
    duration: 20,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Immunizations and travel vaccines',
    icon: '💉',
    basePrice: 75
  },

  // Diagnostic Procedures
  {
    id: 'diagnostic-testing',
    name: 'Diagnostic Testing',
    duration: 60,
    category: 'procedure',
    requiresInsurance: true,
    description: 'Laboratory tests, imaging, and diagnostic procedures',
    icon: '🔬',
    basePrice: 175
  },
  {
    id: 'minor-procedure',
    name: 'Minor Procedure',
    duration: 30,
    category: 'procedure',
    requiresInsurance: true,
    description: 'In-office medical procedures and treatments',
    icon: '⚕️',
    basePrice: 225
  },
  {
    id: 'biopsy-procedure',
    name: 'Biopsy',
    duration: 45,
    category: 'procedure',
    requiresInsurance: true,
    description: 'Tissue sampling for diagnostic analysis',
    icon: '🩹',
    basePrice: 350
  },

  // Emergency & Urgent Care
  {
    id: 'urgent-care-visit',
    name: 'Urgent Care Visit',
    duration: 45,
    category: 'emergency',
    requiresInsurance: true,
    description: 'Same-day care for acute medical conditions',
    icon: '🚨',
    basePrice: 275
  },
  {
    id: 'emergency-consultation',
    name: 'Emergency Consultation',
    duration: 30,
    category: 'emergency',
    requiresInsurance: true,
    description: 'Immediate medical evaluation for urgent conditions',
    icon: '⚡',
    basePrice: 400
  },

  // Specialized Services
  {
    id: 'mental-health-session',
    name: 'Mental Health Session',
    duration: 50,
    category: 'consultation',
    requiresInsurance: true,
    description: 'Psychological evaluation and therapy session',
    icon: '🧠',
    basePrice: 180
  },
  {
    id: 'chronic-care-management',
    name: 'Chronic Care Management',
    duration: 40,
    category: 'follow-up',
    requiresInsurance: true,
    description: 'Ongoing management of chronic medical conditions',
    icon: '📊',
    basePrice: 160
  }
];

// Medical Provider Specialties
export const MEDICAL_SPECIALTIES: MedicalSpecialty[] = [
  // Primary Care
  {
    id: 'family-medicine',
    name: 'Family Medicine',
    category: 'primary_care',
    icon: '👨‍⚕️',
    description: 'Comprehensive care for patients of all ages'
  },
  {
    id: 'internal-medicine',
    name: 'Internal Medicine',
    category: 'primary_care', 
    icon: '🩺',
    description: 'Adult primary care and chronic disease management'
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    category: 'primary_care',
    icon: '🧸',
    description: 'Medical care for infants, children, and adolescents'
  },

  // Specialists
  {
    id: 'cardiology',
    name: 'Cardiology',
    category: 'specialist',
    icon: '❤️',
    description: 'Heart and cardiovascular system disorders'
  },
  {
    id: 'dermatology',
    name: 'Dermatology', 
    category: 'specialist',
    icon: '🌟',
    description: 'Skin, hair, and nail conditions'
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    category: 'specialist',
    icon: '🦴',
    description: 'Musculoskeletal system and sports medicine'
  },
  {
    id: 'neurology',
    name: 'Neurology',
    category: 'specialist',
    icon: '🧠',
    description: 'Nervous system and brain disorders'
  },
  {
    id: 'gastroenterology',
    name: 'Gastroenterology',
    category: 'specialist',
    icon: '🫘',
    description: 'Digestive system and liver conditions'
  },
  {
    id: 'endocrinology',
    name: 'Endocrinology',
    category: 'specialist',
    icon: '⚖️',
    description: 'Hormonal disorders and diabetes management'
  },

  // Mental Health
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    category: 'mental_health',
    icon: '🧠',
    description: 'Mental health disorders and medication management'
  },
  {
    id: 'psychology',
    name: 'Psychology',
    category: 'mental_health',
    icon: '💭',
    description: 'Psychological therapy and behavioral health'
  },

  // Urgent Care
  {
    id: 'urgent-care',
    name: 'Urgent Care',
    category: 'urgent_care',
    icon: '🚨',
    description: 'Immediate care for non-emergency conditions'
  },
  {
    id: 'emergency-medicine',
    name: 'Emergency Medicine',
    category: 'urgent_care',
    icon: '⚡',
    description: 'Critical care and emergency treatment'
  }
];

// Medical Service Categories
export const MEDICAL_SERVICE_CATEGORIES: MedicalServiceCategory[] = [
  {
    id: 'consultations',
    name: 'Consultations',
    icon: '🩺',
    color: 'bg-blue-100 text-blue-800',
    description: 'Initial evaluations and specialist consultations',
    appointmentTypes: ['new-patient-consultation', 'specialist-consultation', 'mental-health-session']
  },
  {
    id: 'preventive-care',
    name: 'Preventive Care',
    icon: '❤️',
    color: 'bg-green-100 text-green-800',
    description: 'Wellness exams, screenings, and vaccinations',
    appointmentTypes: ['annual-physical', 'wellness-check', 'vaccination-appointment']
  },
  {
    id: 'procedures',
    name: 'Procedures',
    icon: '⚕️',
    color: 'bg-purple-100 text-purple-800',
    description: 'Diagnostic tests and minor medical procedures',
    appointmentTypes: ['diagnostic-testing', 'minor-procedure', 'biopsy-procedure']
  },
  {
    id: 'follow-up-care',
    name: 'Follow-up Care',
    icon: '📋',
    color: 'bg-amber-100 text-amber-800',
    description: 'Ongoing care and chronic condition management',
    appointmentTypes: ['follow-up-consultation', 'chronic-care-management']
  },
  {
    id: 'urgent-emergency',
    name: 'Urgent & Emergency',
    icon: '🚨',
    color: 'bg-red-100 text-red-800',
    description: 'Immediate care for acute medical conditions',
    appointmentTypes: ['urgent-care-visit', 'emergency-consultation']
  }
];

// Insurance Information Fields
export interface InsuranceInfo {
  id: string;
  patientId: string;
  primaryInsurance: {
    provider: string;
    planName: string;
    memberId: string;
    groupNumber?: string;
    policyHolder: string;
    relationship: 'self' | 'spouse' | 'child' | 'other';
    effectiveDate: string;
    copay?: number;
    deductible?: number;
  };
  secondaryInsurance?: {
    provider: string;
    planName: string;
    memberId: string;
    groupNumber?: string;
    policyHolder: string;
    relationship: 'self' | 'spouse' | 'child' | 'other';
    effectiveDate: string;
  };
  verificationStatus: 'pending' | 'verified' | 'invalid' | 'expired';
  lastVerified?: string;
  notes?: string;
}

// Common Insurance Providers
export const INSURANCE_PROVIDERS = [
  'Aetna', 'Anthem', 'Blue Cross Blue Shield', 'Cigna', 'Humana', 
  'Kaiser Permanente', 'Medicare', 'Medicaid', 'Tricare', 'UnitedHealthcare',
  'Other'
];

// Helper functions
export const getAppointmentTypesByCategory = (category: string): MedicalAppointmentType[] => {
  return MEDICAL_APPOINTMENT_TYPES.filter(apt => apt.category === category);
};

export const getSpecialtiesByCategory = (category: string): MedicalSpecialty[] => {
  return MEDICAL_SPECIALTIES.filter(spec => spec.category === category);
};

export const getServiceCategoryById = (id: string): MedicalServiceCategory | undefined => {
  return MEDICAL_SERVICE_CATEGORIES.find(cat => cat.id === id);
};

export const getAppointmentTypeById = (id: string): MedicalAppointmentType | undefined => {
  return MEDICAL_APPOINTMENT_TYPES.find(apt => apt.id === id);
};

export const getSpecialtyById = (id: string): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES.find(spec => spec.id === id);
};