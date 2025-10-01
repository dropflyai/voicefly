/**
 * Dental Practice Foundation Data
 * Comprehensive dental appointment types, procedures, and service categories
 */

export interface DentalAppointmentType {
  id: string;
  name: string;
  duration: number; // minutes
  category: 'preventive' | 'restorative' | 'cosmetic' | 'surgical' | 'emergency' | 'consultation';
  requiresInsurance: boolean;
  description: string;
  icon: string;
  basePrice: number;
  requiresPreAuth?: boolean;
}

export interface DentalProviderRole {
  id: string;
  name: string;
  category: 'general' | 'specialist' | 'hygienist' | 'assistant';
  icon: string;
  description: string;
  appointmentTypes: string[]; // IDs of appointment types this role can perform
}

export interface DentalServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  appointmentTypes: string[]; // IDs of appointment types in this category
}

// Dental Appointment Types
export const DENTAL_APPOINTMENT_TYPES: DentalAppointmentType[] = [
  // Preventive Care
  {
    id: 'routine-cleaning',
    name: 'Routine Cleaning',
    duration: 60,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Regular dental cleaning and examination',
    icon: '🦷',
    basePrice: 120
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning (Scaling)',
    duration: 90,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Periodontal therapy for gum disease',
    icon: '🪥',
    basePrice: 200,
    requiresPreAuth: true
  },
  {
    id: 'dental-exam',
    name: 'Comprehensive Exam',
    duration: 45,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Complete oral health evaluation',
    icon: '🔍',
    basePrice: 85
  },
  {
    id: 'dental-xrays',
    name: 'Digital X-Rays',
    duration: 30,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Digital radiographic imaging',
    icon: '📷',
    basePrice: 150
  },
  {
    id: 'fluoride-treatment',
    name: 'Fluoride Treatment',
    duration: 20,
    category: 'preventive',
    requiresInsurance: true,
    description: 'Preventive fluoride application',
    icon: '💧',
    basePrice: 45
  },

  // Restorative Procedures
  {
    id: 'dental-filling',
    name: 'Dental Filling',
    duration: 60,
    category: 'restorative',
    requiresInsurance: true,
    description: 'Composite or amalgam cavity restoration',
    icon: '🔧',
    basePrice: 180
  },
  {
    id: 'dental-crown',
    name: 'Dental Crown',
    duration: 90,
    category: 'restorative',
    requiresInsurance: true,
    description: 'Full coverage tooth restoration',
    icon: '👑',
    basePrice: 1200,
    requiresPreAuth: true
  },
  {
    id: 'dental-bridge',
    name: 'Dental Bridge',
    duration: 120,
    category: 'restorative',
    requiresInsurance: true,
    description: 'Fixed bridge to replace missing teeth',
    icon: '🌉',
    basePrice: 2400,
    requiresPreAuth: true
  },
  {
    id: 'root-canal',
    name: 'Root Canal Treatment',
    duration: 90,
    category: 'restorative',
    requiresInsurance: true,
    description: 'Endodontic treatment to save infected tooth',
    icon: '🦷',
    basePrice: 800,
    requiresPreAuth: true
  },
  {
    id: 'dental-implant',
    name: 'Dental Implant',
    duration: 120,
    category: 'restorative',
    requiresInsurance: false,
    description: 'Titanium implant to replace tooth root',
    icon: '⚙️',
    basePrice: 3500,
    requiresPreAuth: true
  },

  // Cosmetic Procedures
  {
    id: 'teeth-whitening',
    name: 'Professional Whitening',
    duration: 90,
    category: 'cosmetic',
    requiresInsurance: false,
    description: 'In-office teeth whitening treatment',
    icon: '✨',
    basePrice: 450
  },
  {
    id: 'dental-veneers',
    name: 'Porcelain Veneers',
    duration: 120,
    category: 'cosmetic',
    requiresInsurance: false,
    description: 'Custom porcelain shells for smile enhancement',
    icon: '💎',
    basePrice: 1800
  },
  {
    id: 'dental-bonding',
    name: 'Cosmetic Bonding',
    duration: 60,
    category: 'cosmetic',
    requiresInsurance: false,
    description: 'Tooth-colored composite resin enhancement',
    icon: '🎨',
    basePrice: 350
  },
  {
    id: 'smile-makeover',
    name: 'Smile Makeover Consultation',
    duration: 90,
    category: 'cosmetic',
    requiresInsurance: false,
    description: 'Comprehensive cosmetic treatment planning',
    icon: '😊',
    basePrice: 200
  },

  // Surgical Procedures
  {
    id: 'tooth-extraction',
    name: 'Tooth Extraction',
    duration: 45,
    category: 'surgical',
    requiresInsurance: true,
    description: 'Simple or surgical tooth removal',
    icon: '🔻',
    basePrice: 225
  },
  {
    id: 'wisdom-teeth-removal',
    name: 'Wisdom Teeth Removal',
    duration: 90,
    category: 'surgical',
    requiresInsurance: true,
    description: 'Third molar extraction procedure',
    icon: '🦷',
    basePrice: 400,
    requiresPreAuth: true
  },
  {
    id: 'oral-surgery',
    name: 'Oral Surgery',
    duration: 120,
    category: 'surgical',
    requiresInsurance: true,
    description: 'Complex oral and maxillofacial procedures',
    icon: '⚕️',
    basePrice: 800,
    requiresPreAuth: true
  },

  // Emergency Care
  {
    id: 'dental-emergency',
    name: 'Dental Emergency',
    duration: 60,
    category: 'emergency',
    requiresInsurance: true,
    description: 'Urgent dental pain or trauma care',
    icon: '🚨',
    basePrice: 300
  },
  {
    id: 'emergency-extraction',
    name: 'Emergency Extraction',
    duration: 45,
    category: 'emergency',
    requiresInsurance: true,
    description: 'Urgent tooth removal for pain relief',
    icon: '⚡',
    basePrice: 275
  },

  // Consultations
  {
    id: 'new-patient-exam',
    name: 'New Patient Consultation',
    duration: 75,
    category: 'consultation',
    requiresInsurance: true,
    description: 'Comprehensive initial dental evaluation',
    icon: '📋',
    basePrice: 150
  },
  {
    id: 'second-opinion',
    name: 'Second Opinion',
    duration: 45,
    category: 'consultation',
    requiresInsurance: false,
    description: 'Independent treatment plan evaluation',
    icon: '🤝',
    basePrice: 125
  }
];

// Dental Provider Roles
export const DENTAL_PROVIDER_ROLES: DentalProviderRole[] = [
  {
    id: 'general-dentist',
    name: 'General Dentist',
    category: 'general',
    icon: '🦷',
    description: 'Comprehensive dental care for all ages',
    appointmentTypes: [
      'routine-cleaning', 'dental-exam', 'dental-xrays', 'fluoride-treatment',
      'dental-filling', 'dental-crown', 'root-canal', 'teeth-whitening',
      'dental-bonding', 'tooth-extraction', 'dental-emergency', 'new-patient-exam'
    ]
  },
  {
    id: 'dental-hygienist',
    name: 'Dental Hygienist',
    category: 'hygienist',
    icon: '🪥',
    description: 'Preventive care and patient education specialist',
    appointmentTypes: [
      'routine-cleaning', 'deep-cleaning', 'fluoride-treatment', 'dental-xrays'
    ]
  },
  {
    id: 'oral-surgeon',
    name: 'Oral Surgeon',
    category: 'specialist',
    icon: '⚕️',
    description: 'Surgical procedures and complex extractions',
    appointmentTypes: [
      'tooth-extraction', 'wisdom-teeth-removal', 'oral-surgery', 
      'dental-implant', 'emergency-extraction'
    ]
  },
  {
    id: 'orthodontist',
    name: 'Orthodontist',
    category: 'specialist',
    icon: '🔧',
    description: 'Teeth alignment and bite correction specialist',
    appointmentTypes: ['new-patient-exam', 'second-opinion']
  },
  {
    id: 'endodontist',
    name: 'Endodontist',
    category: 'specialist',
    icon: '🦷',
    description: 'Root canal and pulp treatment specialist',
    appointmentTypes: ['root-canal', 'dental-emergency']
  },
  {
    id: 'cosmetic-dentist',
    name: 'Cosmetic Dentist',
    category: 'specialist',
    icon: '✨',
    description: 'Aesthetic dentistry and smile enhancement',
    appointmentTypes: [
      'teeth-whitening', 'dental-veneers', 'dental-bonding', 'smile-makeover'
    ]
  },
  {
    id: 'periodontist',
    name: 'Periodontist',
    category: 'specialist',
    icon: '🦷',
    description: 'Gum disease treatment and prevention specialist',
    appointmentTypes: ['deep-cleaning', 'oral-surgery']
  },
  {
    id: 'dental-assistant',
    name: 'Dental Assistant',
    category: 'assistant',
    icon: '👩‍⚕️',
    description: 'Chairside assistance and patient care support',
    appointmentTypes: ['dental-xrays', 'fluoride-treatment']
  }
];

// Dental Service Categories
export const DENTAL_SERVICE_CATEGORIES: DentalServiceCategory[] = [
  {
    id: 'preventive',
    name: 'Preventive Care',
    icon: '🦷',
    color: 'bg-green-100 text-green-800',
    description: 'Regular cleanings, exams, and preventive treatments',
    appointmentTypes: [
      'routine-cleaning', 'deep-cleaning', 'dental-exam', 
      'dental-xrays', 'fluoride-treatment'
    ]
  },
  {
    id: 'restorative',
    name: 'Restorative Care',
    icon: '🔧',
    color: 'bg-blue-100 text-blue-800',
    description: 'Fillings, crowns, bridges, and tooth restoration',
    appointmentTypes: [
      'dental-filling', 'dental-crown', 'dental-bridge', 
      'root-canal', 'dental-implant'
    ]
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic Dentistry',
    icon: '✨',
    color: 'bg-purple-100 text-purple-800',
    description: 'Smile enhancement and aesthetic treatments',
    appointmentTypes: [
      'teeth-whitening', 'dental-veneers', 'dental-bonding', 'smile-makeover'
    ]
  },
  {
    id: 'surgical',
    name: 'Oral Surgery',
    icon: '⚕️',
    color: 'bg-red-100 text-red-800',
    description: 'Extractions and surgical dental procedures',
    appointmentTypes: [
      'tooth-extraction', 'wisdom-teeth-removal', 'oral-surgery'
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency Care',
    icon: '🚨',
    color: 'bg-orange-100 text-orange-800',
    description: 'Urgent dental pain and trauma treatment',
    appointmentTypes: ['dental-emergency', 'emergency-extraction']
  },
  {
    id: 'consultation',
    name: 'Consultations',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800',
    description: 'Initial evaluations and treatment planning',
    appointmentTypes: ['new-patient-exam', 'second-opinion']
  }
];

// Dental Insurance Information
export interface DentalInsuranceInfo {
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
    annualMaximum?: number;
    deductible?: number;
    preventiveCoverage?: number; // percentage
    basicCoverage?: number; // percentage
    majorCoverage?: number; // percentage
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
  preAuthRequired: string[]; // appointment type IDs requiring pre-authorization
  notes?: string;
}

// Common Dental Insurance Providers
export const DENTAL_INSURANCE_PROVIDERS = [
  'Delta Dental', 'Cigna Dental', 'Aetna Dental', 'Humana Dental',
  'MetLife Dental', 'Guardian Dental', 'Principal Dental', 'United Concordia',
  'Anthem Dental', 'Blue Cross Blue Shield Dental', 'Other'
];

// Treatment Planning
export interface TreatmentPlan {
  id: string;
  patientId: string;
  dentistId: string;
  treatments: {
    appointmentTypeId: string;
    tooth?: string;
    priority: 'urgent' | 'recommended' | 'optional';
    estimatedCost: number;
    insuranceCoverage?: number;
    patientPortion?: number;
    requiresPreAuth: boolean;
    notes?: string;
  }[];
  totalEstimate: number;
  totalInsuranceCoverage: number;
  totalPatientPortion: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'presented' | 'accepted' | 'declined' | 'completed';
}

// Helper functions
export const getAppointmentTypesByCategory = (category: string): DentalAppointmentType[] => {
  return DENTAL_APPOINTMENT_TYPES.filter(apt => apt.category === category);
};

export const getProviderRolesByCategory = (category: string): DentalProviderRole[] => {
  return DENTAL_PROVIDER_ROLES.filter(role => role.category === category);
};

export const getServiceCategoryById = (id: string): DentalServiceCategory | undefined => {
  return DENTAL_SERVICE_CATEGORIES.find(cat => cat.id === id);
};

export const getAppointmentTypeById = (id: string): DentalAppointmentType | undefined => {
  return DENTAL_APPOINTMENT_TYPES.find(apt => apt.id === id);
};

export const getProviderRoleById = (id: string): DentalProviderRole | undefined => {
  return DENTAL_PROVIDER_ROLES.find(role => role.id === id);
};

export const getAppointmentTypesForProvider = (providerRoleId: string): DentalAppointmentType[] => {
  const role = getProviderRoleById(providerRoleId);
  if (!role) return [];
  
  return DENTAL_APPOINTMENT_TYPES.filter(apt => 
    role.appointmentTypes.includes(apt.id)
  );
};

export const getPreAuthRequiredTypes = (): DentalAppointmentType[] => {
  return DENTAL_APPOINTMENT_TYPES.filter(apt => apt.requiresPreAuth);
};

export const calculateTreatmentPlanTotal = (plan: TreatmentPlan): {
  totalCost: number;
  totalInsurance: number;
  totalPatient: number;
} => {
  const totalCost = plan.treatments.reduce((sum, treatment) => sum + treatment.estimatedCost, 0);
  const totalInsurance = plan.treatments.reduce((sum, treatment) => sum + (treatment.insuranceCoverage || 0), 0);
  const totalPatient = plan.treatments.reduce((sum, treatment) => sum + (treatment.patientPortion || 0), 0);
  
  return { totalCost, totalInsurance, totalPatient };
};