/**
 * Medical and Dental Practice Theme System
 * Professional healthcare visual themes and branding
 */

export interface MedicalTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      accent: string
    }
    status: {
      success: string
      warning: string
      error: string
      info: string
    }
  }
  gradients: {
    primary: string
    secondary: string
    accent: string
  }
  shadows: {
    card: string
    elevated: string
    focus: string
  }
}

export const MEDICAL_PRACTICE_THEME: MedicalTheme = {
  name: 'Medical Practice',
  colors: {
    primary: '#1e40af', // Professional blue
    secondary: '#10b981', // Healthcare green
    accent: '#f59e0b', // Warning amber
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#1e40af'
    },
    status: {
      success: '#10b981', // Healthy green
      warning: '#f59e0b', // Caution amber
      error: '#ef4444', // Critical red
      info: '#3b82f6' // Informational blue
    }
  },
  gradients: {
    primary: 'from-blue-600 to-blue-700',
    secondary: 'from-emerald-500 to-green-600',
    accent: 'from-blue-50 to-emerald-50'
  },
  shadows: {
    card: 'shadow-md hover:shadow-lg',
    elevated: 'shadow-lg',
    focus: 'ring-2 ring-blue-500 ring-opacity-50'
  }
}

export const DENTAL_PRACTICE_THEME: MedicalTheme = {
  name: 'Dental Practice',
  colors: {
    primary: '#0f766e', // Professional teal
    secondary: '#0891b2', // Clean cyan
    accent: '#dc2626', // Emergency red
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#0f766e'
    },
    status: {
      success: '#059669', // Healthy teal
      warning: '#ea580c', // Dental orange
      error: '#dc2626', // Emergency red
      info: '#0891b2' // Informational cyan
    }
  },
  gradients: {
    primary: 'from-teal-700 to-cyan-600',
    secondary: 'from-cyan-500 to-blue-500',
    accent: 'from-teal-50 to-cyan-50'
  },
  shadows: {
    card: 'shadow-md hover:shadow-lg',
    elevated: 'shadow-lg',
    focus: 'ring-2 ring-teal-500 ring-opacity-50'
  }
}

export interface MedicalIcon {
  category: string
  icons: {
    [key: string]: string
  }
}

export const MEDICAL_ICONS: MedicalIcon[] = [
  {
    category: 'appointments',
    icons: {
      'new-patient': '🆕',
      'follow-up': '📋',
      'consultation': '🩺',
      'physical': '❤️',
      'wellness': '🌟',
      'vaccination': '💉',
      'diagnostic': '🔬',
      'procedure': '⚕️',
      'biopsy': '🩹',
      'urgent': '🚨',
      'emergency': '⚡',
      'mental-health': '🧠',
      'chronic-care': '📊'
    }
  },
  {
    category: 'specialties',
    icons: {
      'family-medicine': '👨‍⚕️',
      'internal-medicine': '🩺',
      'pediatrics': '🧸',
      'cardiology': '❤️',
      'dermatology': '🌟',
      'orthopedics': '🦴',
      'neurology': '🧠',
      'gastroenterology': '🫘',
      'endocrinology': '⚖️',
      'psychiatry': '🧠',
      'psychology': '💭',
      'urgent-care': '🚨',
      'emergency-medicine': '⚡'
    }
  },
  {
    category: 'providers',
    icons: {
      'physician': '👨‍⚕️',
      'nurse-practitioner': '👩‍⚕️',
      'physician-assistant': '🩺',
      'registered-nurse': '👩‍⚕️',
      'medical-assistant': '👨‍⚕️',
      'specialist': '🎯'
    }
  },
  {
    category: 'status',
    icons: {
      'scheduled': '📅',
      'confirmed': '✅',
      'in-progress': '🔄',
      'completed': '✔️',
      'cancelled': '❌',
      'no-show': '❌',
      'rescheduled': '📅'
    }
  }
]

export const DENTAL_ICONS: MedicalIcon[] = [
  {
    category: 'appointments',
    icons: {
      'cleaning': '🦷',
      'deep-cleaning': '🪥',
      'exam': '🔍',
      'xrays': '📷',
      'fluoride': '💧',
      'filling': '🔧',
      'crown': '👑',
      'bridge': '🌉',
      'root-canal': '🦷',
      'implant': '⚙️',
      'whitening': '✨',
      'veneers': '💎',
      'bonding': '🎨',
      'smile-makeover': '😊',
      'extraction': '🔻',
      'wisdom-teeth': '🦷',
      'oral-surgery': '⚕️',
      'emergency': '🚨',
      'consultation': '📋',
      'second-opinion': '🤝'
    }
  },
  {
    category: 'providers',
    icons: {
      'general-dentist': '🦷',
      'oral-surgeon': '⚕️',
      'orthodontist': '🔧',
      'endodontist': '🦷',
      'periodontist': '🦷',
      'cosmetic-dentist': '✨',
      'dental-hygienist': '🪥',
      'dental-assistant': '👩‍⚕️'
    }
  },
  {
    category: 'categories',
    icons: {
      'preventive': '🦷',
      'restorative': '🔧',
      'cosmetic': '✨',
      'surgical': '⚕️',
      'emergency': '🚨',
      'consultation': '📋'
    }
  }
]

// Helper functions for applying themes
export const getThemeForBusinessType = (businessType: string): MedicalTheme => {
  switch (businessType) {
    case 'medical_practice':
      return MEDICAL_PRACTICE_THEME
    case 'dental_practice':
      return DENTAL_PRACTICE_THEME
    default:
      return MEDICAL_PRACTICE_THEME
  }
}

export const getIconForService = (serviceCategory: string, businessType: string): string => {
  const iconSets = businessType === 'medical_practice' ? MEDICAL_ICONS : DENTAL_ICONS
  
  for (const iconSet of iconSets) {
    if (iconSet.icons[serviceCategory]) {
      return iconSet.icons[serviceCategory]
    }
  }
  
  // Default fallbacks
  if (businessType === 'medical_practice') {
    return '🏥'
  } else if (businessType === 'dental_practice') {
    return '🦷'
  }
  
  return '⚕️'
}

export const getMedicalStatusColor = (status: string, theme: MedicalTheme): string => {
  switch (status) {
    case 'scheduled':
    case 'confirmed':
      return theme.colors.status.info
    case 'in-progress':
      return theme.colors.status.warning
    case 'completed':
      return theme.colors.status.success
    case 'cancelled':
    case 'no-show':
      return theme.colors.status.error
    default:
      return theme.colors.text.secondary
  }
}

export const getUrgencyColor = (urgency: string, theme: MedicalTheme): string => {
  switch (urgency) {
    case 'routine':
      return theme.colors.status.success
    case 'urgent':
      return theme.colors.status.warning
    case 'emergency':
      return theme.colors.status.error
    default:
      return theme.colors.text.secondary
  }
}

// CSS-in-JS style generators
export const generateMedicalCardStyles = (theme: MedicalTheme) => ({
  backgroundColor: theme.colors.surface,
  borderColor: theme.colors.primary + '20', // 20% opacity
  boxShadow: theme.shadows.card,
  borderRadius: '0.5rem',
  transition: 'all 0.2s ease-in-out'
})

export const generateMedicalButtonStyles = (theme: MedicalTheme, variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        borderColor: theme.colors.primary,
        boxShadow: theme.shadows.focus
      }
    case 'secondary':
      return {
        backgroundColor: theme.colors.secondary,
        color: '#ffffff',
        borderColor: theme.colors.secondary,
        boxShadow: theme.shadows.focus
      }
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: theme.colors.primary,
        borderColor: theme.colors.primary,
        boxShadow: 'none'
      }
    default:
      return generateMedicalButtonStyles(theme, 'primary')
  }
}

// Tailwind CSS class generators
export const getMedicalCardClasses = (businessType: string): string => {
  const baseClasses = 'bg-white rounded-lg border-2 shadow-md hover:shadow-lg transition-all duration-200'
  
  if (businessType === 'medical_practice') {
    return `${baseClasses} border-blue-100 hover:border-blue-200`
  } else if (businessType === 'dental_practice') {
    return `${baseClasses} border-teal-100 hover:border-teal-200`
  }
  
  return baseClasses
}

export const getMedicalButtonClasses = (businessType: string, variant: 'primary' | 'secondary' | 'outline' = 'primary'): string => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  if (businessType === 'medical_practice') {
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`
      case 'secondary':
        return `${baseClasses} bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500`
      case 'outline':
        return `${baseClasses} border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500`
    }
  } else if (businessType === 'dental_practice') {
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-teal-700 hover:bg-teal-800 text-white focus:ring-teal-500`
      case 'secondary':
        return `${baseClasses} bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500`
      case 'outline':
        return `${baseClasses} border border-teal-700 text-teal-700 hover:bg-teal-50 focus:ring-teal-500`
    }
  }
  
  return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`
}

export const getMedicalStatusBadgeClasses = (status: string, businessType: string): string => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
  
  if (businessType === 'medical_practice') {
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'confirmed':
        return `${baseClasses} bg-emerald-100 text-emerald-800`
      case 'in-progress':
        return `${baseClasses} bg-amber-100 text-amber-800`
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  } else if (businessType === 'dental_practice') {
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-teal-100 text-teal-800`
      case 'confirmed':
        return `${baseClasses} bg-cyan-100 text-cyan-800`
      case 'in-progress':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }
  
  return `${baseClasses} bg-gray-100 text-gray-800`
}