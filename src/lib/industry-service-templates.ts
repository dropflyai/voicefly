// Industry-specific service templates
// Auto-populated when a business signs up

export interface ServiceTemplate {
  name: string
  description: string
  duration_minutes: number
  base_price: number
  category: string
  requires_deposit: boolean
  deposit_amount: number
}

export const INDUSTRY_SERVICE_TEMPLATES: Record<string, ServiceTemplate[]> = {
  // Medical Practices
  medical_practice: [
    {
      name: 'Annual Physical Exam',
      description: 'Comprehensive annual health checkup and screening',
      duration_minutes: 30,
      base_price: 150,
      category: 'Preventive Care',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Follow-up Visit',
      description: 'Follow-up consultation for ongoing treatment',
      duration_minutes: 15,
      base_price: 100,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'New Patient Consultation',
      description: 'Initial consultation for new patients',
      duration_minutes: 45,
      base_price: 200,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Lab Work Review',
      description: 'Review and discuss lab results',
      duration_minutes: 15,
      base_price: 75,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Vaccination',
      description: 'Flu shot, COVID vaccine, or other immunizations',
      duration_minutes: 10,
      base_price: 50,
      category: 'Preventive Care',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Minor Procedure',
      description: 'Minor in-office procedures',
      duration_minutes: 30,
      base_price: 250,
      category: 'Procedures',
      requires_deposit: true,
      deposit_amount: 50
    }
  ],

  // Dental Practices
  dental_practice: [
    {
      name: 'Cleaning & Checkup',
      description: 'Routine dental cleaning and examination',
      duration_minutes: 60,
      base_price: 125,
      category: 'Preventive',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Cavity Filling',
      description: 'Composite or amalgam filling',
      duration_minutes: 45,
      base_price: 200,
      category: 'Restorative',
      requires_deposit: true,
      deposit_amount: 50
    },
    {
      name: 'Root Canal',
      description: 'Root canal therapy',
      duration_minutes: 90,
      base_price: 800,
      category: 'Endodontics',
      requires_deposit: true,
      deposit_amount: 200
    },
    {
      name: 'Crown Placement',
      description: 'Dental crown installation',
      duration_minutes: 120,
      base_price: 1200,
      category: 'Restorative',
      requires_deposit: true,
      deposit_amount: 300
    },
    {
      name: 'Teeth Whitening',
      description: 'Professional teeth whitening treatment',
      duration_minutes: 60,
      base_price: 400,
      category: 'Cosmetic',
      requires_deposit: true,
      deposit_amount: 100
    },
    {
      name: 'X-Rays',
      description: 'Digital dental x-rays',
      duration_minutes: 15,
      base_price: 75,
      category: 'Diagnostic',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // Beauty Salons & Spas
  beauty_salon: [
    {
      name: 'Gel Manicure',
      description: 'Long-lasting gel polish application',
      duration_minutes: 45,
      base_price: 55,
      category: 'Nails',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Spa Pedicure',
      description: 'Deluxe pedicure with massage and exfoliation',
      duration_minutes: 60,
      base_price: 65,
      category: 'Nails',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Signature Manicure',
      description: 'Classic manicure with regular polish',
      duration_minutes: 30,
      base_price: 35,
      category: 'Nails',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Nail Art',
      description: 'Custom nail art design',
      duration_minutes: 30,
      base_price: 25,
      category: 'Nails',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Express Manicure',
      description: 'Quick manicure service',
      duration_minutes: 20,
      base_price: 25,
      category: 'Nails',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Acrylic Full Set',
      description: 'Full acrylic nail application',
      duration_minutes: 90,
      base_price: 85,
      category: 'Nails',
      requires_deposit: true,
      deposit_amount: 20
    }
  ],

  // Fitness & Wellness Centers
  fitness_wellness: [
    {
      name: 'Personal Training Session',
      description: 'One-on-one personal training',
      duration_minutes: 60,
      base_price: 75,
      category: 'Training',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Group Fitness Class',
      description: 'Group exercise class',
      duration_minutes: 45,
      base_price: 20,
      category: 'Classes',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Nutrition Consultation',
      description: 'Personalized nutrition planning',
      duration_minutes: 30,
      base_price: 100,
      category: 'Wellness',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Body Composition Analysis',
      description: 'InBody scan and analysis',
      duration_minutes: 15,
      base_price: 50,
      category: 'Assessment',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Monthly Membership',
      description: 'Unlimited gym access',
      duration_minutes: 0,
      base_price: 99,
      category: 'Membership',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Yoga Class',
      description: 'Group yoga session',
      duration_minutes: 60,
      base_price: 25,
      category: 'Classes',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // Home Services (Cleaning, HVAC, Plumbing, etc.)
  home_services: [
    {
      name: 'Standard House Cleaning',
      description: 'Regular house cleaning service',
      duration_minutes: 120,
      base_price: 150,
      category: 'Cleaning',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Deep Clean',
      description: 'Thorough deep cleaning service',
      duration_minutes: 180,
      base_price: 250,
      category: 'Cleaning',
      requires_deposit: true,
      deposit_amount: 50
    },
    {
      name: 'Move In/Out Cleaning',
      description: 'Complete cleaning for move in or move out',
      duration_minutes: 240,
      base_price: 350,
      category: 'Cleaning',
      requires_deposit: true,
      deposit_amount: 75
    },
    {
      name: 'Window Cleaning',
      description: 'Interior and exterior window cleaning',
      duration_minutes: 60,
      base_price: 100,
      category: 'Cleaning',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Carpet Cleaning',
      description: 'Professional carpet steam cleaning',
      duration_minutes: 90,
      base_price: 200,
      category: 'Cleaning',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Post-Construction Cleaning',
      description: 'Cleaning after renovation or construction',
      duration_minutes: 300,
      base_price: 450,
      category: 'Cleaning',
      requires_deposit: true,
      deposit_amount: 100
    }
  ],

  // Med Spas & Aesthetic Clinics
  medspa: [
    {
      name: 'Botox Treatment',
      description: 'Cosmetic botulinum toxin injection',
      duration_minutes: 30,
      base_price: 400,
      category: 'Injectables',
      requires_deposit: true,
      deposit_amount: 100
    },
    {
      name: 'Dermal Fillers',
      description: 'Hyaluronic acid filler injection',
      duration_minutes: 45,
      base_price: 600,
      category: 'Injectables',
      requires_deposit: true,
      deposit_amount: 150
    },
    {
      name: 'Laser Hair Removal',
      description: 'Permanent hair reduction treatment',
      duration_minutes: 60,
      base_price: 300,
      category: 'Laser Treatments',
      requires_deposit: true,
      deposit_amount: 75
    },
    {
      name: 'Chemical Peel',
      description: 'Facial chemical exfoliation',
      duration_minutes: 45,
      base_price: 200,
      category: 'Facials',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Microneedling',
      description: 'Collagen induction therapy',
      duration_minutes: 60,
      base_price: 350,
      category: 'Skin Rejuvenation',
      requires_deposit: true,
      deposit_amount: 75
    },
    {
      name: 'Consultation',
      description: 'Initial aesthetic consultation',
      duration_minutes: 30,
      base_price: 50,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // Law Firms
  law_firm: [
    {
      name: 'Initial Consultation',
      description: 'First consultation with attorney',
      duration_minutes: 60,
      base_price: 250,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Follow-up Consultation',
      description: 'Additional consultation session',
      duration_minutes: 30,
      base_price: 150,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Document Review',
      description: 'Legal document review and analysis',
      duration_minutes: 120,
      base_price: 400,
      category: 'Services',
      requires_deposit: true,
      deposit_amount: 100
    },
    {
      name: 'Contract Drafting',
      description: 'Custom contract preparation',
      duration_minutes: 180,
      base_price: 750,
      category: 'Services',
      requires_deposit: true,
      deposit_amount: 200
    },
    {
      name: 'Court Representation',
      description: 'Legal representation in court',
      duration_minutes: 240,
      base_price: 2000,
      category: 'Litigation',
      requires_deposit: true,
      deposit_amount: 500
    }
  ],

  // Real Estate Agencies
  real_estate: [
    {
      name: 'Property Showing',
      description: 'Scheduled property viewing',
      duration_minutes: 45,
      base_price: 0,
      category: 'Showings',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Buyer Consultation',
      description: 'Initial buyer consultation',
      duration_minutes: 60,
      base_price: 0,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Seller Consultation',
      description: 'Property listing consultation',
      duration_minutes: 60,
      base_price: 0,
      category: 'Consultations',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Home Appraisal',
      description: 'Professional property appraisal',
      duration_minutes: 90,
      base_price: 400,
      category: 'Services',
      requires_deposit: true,
      deposit_amount: 100
    },
    {
      name: 'Open House',
      description: 'Scheduled open house event',
      duration_minutes: 180,
      base_price: 0,
      category: 'Events',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // Veterinary Clinics
  veterinary: [
    {
      name: 'Wellness Exam',
      description: 'Annual pet health checkup',
      duration_minutes: 30,
      base_price: 75,
      category: 'Preventive Care',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Vaccination',
      description: 'Pet vaccination service',
      duration_minutes: 15,
      base_price: 45,
      category: 'Preventive Care',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Dental Cleaning',
      description: 'Professional pet dental cleaning',
      duration_minutes: 90,
      base_price: 300,
      category: 'Dental',
      requires_deposit: true,
      deposit_amount: 75
    },
    {
      name: 'Emergency Visit',
      description: 'Urgent care appointment',
      duration_minutes: 45,
      base_price: 150,
      category: 'Emergency',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Surgery',
      description: 'Surgical procedure',
      duration_minutes: 120,
      base_price: 800,
      category: 'Surgery',
      requires_deposit: true,
      deposit_amount: 200
    },
    {
      name: 'Grooming',
      description: 'Pet grooming service',
      duration_minutes: 60,
      base_price: 60,
      category: 'Grooming',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // Auto Sales & Car Dealerships
  auto_sales: [
    {
      name: 'Test Drive',
      description: 'Scheduled vehicle test drive',
      duration_minutes: 30,
      base_price: 0,
      category: 'Sales',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Vehicle Appraisal',
      description: 'Trade-in vehicle evaluation',
      duration_minutes: 45,
      base_price: 0,
      category: 'Sales',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Financing Consultation',
      description: 'Loan and financing options meeting',
      duration_minutes: 60,
      base_price: 0,
      category: 'Finance',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Vehicle Delivery',
      description: 'New vehicle pickup and orientation',
      duration_minutes: 90,
      base_price: 0,
      category: 'Sales',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Service Appointment',
      description: 'Scheduled maintenance or repair',
      duration_minutes: 120,
      base_price: 150,
      category: 'Service',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Oil Change',
      description: 'Standard oil change service',
      duration_minutes: 30,
      base_price: 45,
      category: 'Service',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Tire Rotation',
      description: 'Tire rotation and balance',
      duration_minutes: 45,
      base_price: 60,
      category: 'Service',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'State Inspection',
      description: 'Annual vehicle safety inspection',
      duration_minutes: 45,
      base_price: 25,
      category: 'Service',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Detail Service',
      description: 'Full interior and exterior detailing',
      duration_minutes: 180,
      base_price: 200,
      category: 'Service',
      requires_deposit: true,
      deposit_amount: 50
    },
    {
      name: 'Parts Pickup',
      description: 'Customer pickup of ordered parts',
      duration_minutes: 15,
      base_price: 0,
      category: 'Parts',
      requires_deposit: false,
      deposit_amount: 0
    }
  ],

  // General Business (catch-all)
  general_business: [
    {
      name: 'Consultation',
      description: 'General consultation service',
      duration_minutes: 60,
      base_price: 100,
      category: 'Services',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Service Call',
      description: 'On-site service visit',
      duration_minutes: 90,
      base_price: 150,
      category: 'Services',
      requires_deposit: false,
      deposit_amount: 0
    },
    {
      name: 'Follow-up',
      description: 'Follow-up appointment',
      duration_minutes: 30,
      base_price: 75,
      category: 'Services',
      requires_deposit: false,
      deposit_amount: 0
    }
  ]
}

export function getServicesForIndustry(businessType: string): ServiceTemplate[] {
  return INDUSTRY_SERVICE_TEMPLATES[businessType] || INDUSTRY_SERVICE_TEMPLATES.general_business
}

export function getServiceTerminology(businessType: string): {
  singular: string
  plural: string
  verb: string
} {
  const terminology: Record<string, { singular: string; plural: string; verb: string }> = {
    medical_practice: { singular: 'Procedure', plural: 'Procedures', verb: 'Schedule' },
    dental_practice: { singular: 'Treatment', plural: 'Treatments', verb: 'Book' },
    beauty_salon: { singular: 'Service', plural: 'Services', verb: 'Book' },
    fitness_wellness: { singular: 'Class', plural: 'Classes', verb: 'Register for' },
    home_services: { singular: 'Service', plural: 'Services', verb: 'Schedule' },
    medspa: { singular: 'Treatment', plural: 'Treatments', verb: 'Book' },
    law_firm: { singular: 'Consultation', plural: 'Consultations', verb: 'Schedule' },
    real_estate: { singular: 'Showing', plural: 'Showings', verb: 'Schedule' },
    veterinary: { singular: 'Appointment', plural: 'Appointments', verb: 'Book' },
    auto_sales: { singular: 'Appointment', plural: 'Appointments', verb: 'Schedule' },
    general_business: { singular: 'Service', plural: 'Services', verb: 'Book' }
  }

  return terminology[businessType] || terminology.general_business
}
