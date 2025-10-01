/**
 * Automated Business Profile Generation
 * Creates custom Maya agent profiles based on business information
 */

import { getJobTemplate, MayaJobTemplate } from './maya-job-templates'

export interface BusinessTierInfo {
  businessName: string
  ownerName: string
  email: string
  phone: string
  mayaJobId: string
  businessDescription?: string
  brandPersonality: 'professional' | 'warm' | 'luxury' | 'casual'
  uniqueSellingPoints: string[]
  targetCustomer?: string
  priceRange: 'budget' | 'mid-range' | 'premium' | 'luxury'
}

export interface CustomBusinessProfile {
  agentName: string
  customSystemPrompt: string
  brandVoice: string
  customGreeting: string
  personalityTraits: string[]
  voiceSettings: {
    provider: string
    voiceId: string
    speed: number
    stability: number
  }
  businessContext: string
  serviceExpertise: string[]
}

/**
 * Brand Voice Templates based on personality selection
 */
const BRAND_VOICE_TEMPLATES = {
  professional: {
    tone: "professional and knowledgeable",
    language: "expert, quality, professional, reliable, trusted",
    adjectives: "experienced, skilled, dependable, thorough",
    greeting_style: "formal but warm"
  },
  warm: {
    tone: "warm and welcoming",
    language: "friendly, caring, personal, welcoming, comfortable",
    adjectives: "caring, attentive, personable, approachable",
    greeting_style: "friendly and personal"
  },
  luxury: {
    tone: "elegant and sophisticated", 
    language: "exclusive, premium, luxurious, exquisite, bespoke",
    adjectives: "refined, sophisticated, exclusive, exceptional",
    greeting_style: "elegant and distinguished"
  },
  casual: {
    tone: "friendly and relaxed",
    language: "fun, relaxed, easygoing, comfortable, laid-back",
    adjectives: "approachable, easy-going, fun, comfortable",
    greeting_style: "casual and friendly"
  }
}

/**
 * Voice Settings based on brand personality
 */
const VOICE_SETTINGS_MAP = {
  professional: { provider: '11labs', voiceId: 'sarah', speed: 1.0, stability: 0.8 },
  warm: { provider: '11labs', voiceId: 'sarah', speed: 0.95, stability: 0.75 },
  luxury: { provider: '11labs', voiceId: 'sarah', speed: 0.9, stability: 0.85 },
  casual: { provider: '11labs', voiceId: 'sarah', speed: 1.05, stability: 0.7 }
}

/**
 * Generate custom greeting based on job type and business info
 */
function generateCustomGreeting(businessInfo: BusinessTierInfo, jobTemplate: MayaJobTemplate): string {
  const brandVoice = BRAND_VOICE_TEMPLATES[businessInfo.brandPersonality]
  const businessName = businessInfo.businessName
  
  const greetingTemplates = {
    'nail-salon-receptionist': {
      professional: `Thank you for calling ${businessName}. This is Maya, your nail care specialist. How may I provide you with exceptional nail services today?`,
      warm: `Hi there! You've reached ${businessName}, and this is Maya. I'm so excited to help you achieve beautiful, healthy nails today!`,
      luxury: `Welcome to ${businessName}, where nail artistry meets luxury. This is Maya, your personal nail concierge. How may I create an exquisite experience for you?`,
      casual: `Hey! Thanks for calling ${businessName}! This is Maya, ready to help you get those nails looking amazing. What can we do for you today?`
    },
    'hair-salon-coordinator': {
      professional: `Good day, and thank you for calling ${businessName}. This is Maya, your professional styling coordinator. How may I help you achieve your perfect look?`,
      warm: `Hello and welcome to ${businessName}! This is Maya, and I can't wait to help you create your dream hairstyle today!`,
      luxury: `Welcome to ${businessName}, your premier destination for hair artistry. This is Maya, your personal styling concierge. How may we transform your look today?`,
      casual: `Hey there! You've reached ${businessName}, and this is Maya. Ready to get your hair looking absolutely fantastic? What's the vision?`
    },
    'spa-wellness-assistant': {
      professional: `Thank you for calling ${businessName}. This is Maya, your wellness coordinator. I'm here to help you find the perfect treatment for your relaxation and rejuvenation needs.`,
      warm: `Welcome to ${businessName}, your peaceful sanctuary. This is Maya, and I'm here to help you find the perfect way to relax and recharge today.`,
      luxury: `Welcome to ${businessName}, where wellness meets luxury. This is Maya, your personal spa concierge. How may we create an extraordinary wellness experience for you today?`,
      casual: `Hi! Thanks for calling ${businessName}! This is Maya, ready to help you chill out and feel amazing. What kind of relaxation are you looking for?`
    },
    'massage-therapy-scheduler': {
      professional: `Thank you for calling ${businessName}. This is Maya, your therapeutic care coordinator. How may I help address your wellness and healing needs today?`,
      warm: `Hello and welcome to ${businessName}. This is Maya, and I'm here to help you find the perfect therapeutic treatment to feel your best.`,
      luxury: `Welcome to ${businessName}, your sanctuary for therapeutic excellence. This is Maya, your personal wellness concierge. How may we restore your well-being today?`,
      casual: `Hey there! You've reached ${businessName}, and this is Maya. Ready to work out those knots and feel amazing? What's bothering you today?`
    },
    'beauty-salon-assistant': {
      professional: `Thank you for calling ${businessName}. This is Maya, your beauty care specialist. How may I help you look and feel your absolute best today?`,
      warm: `Hi! Welcome to ${businessName}! This is Maya, and I'm so excited to help you discover your most radiant self today!`,
      luxury: `Welcome to ${businessName}, where beauty becomes artistry. This is Maya, your personal beauty concierge. How may we enhance your natural radiance today?`,
      casual: `Hey beautiful! Thanks for calling ${businessName}! This is Maya, ready to help you glow up. What beauty adventure are we going on today?`
    },
    'barbershop-coordinator': {
      professional: `Good day, and thank you for calling ${businessName}. This is Maya, your grooming coordinator. How may I help you achieve that perfect, sharp look today?`,
      warm: `Hello and welcome to ${businessName}! This is Maya, ready to help you look and feel your best with our expert grooming services.`,
      luxury: `Welcome to ${businessName}, where traditional craftsmanship meets modern style. This is Maya, your personal grooming concierge. How may we refine your look today?`,
      casual: `What's up! You've reached ${businessName}, and this is Maya. Ready to get you looking fresh and sharp? What can we hook you up with?`
    },
    'medical-scheduler': {
      professional: `Thank you for calling ${businessName}. This is Maya, your appointment coordinator. I'm here to help schedule your visit and answer any questions about your care.`,
      warm: `Hello, and thank you for calling ${businessName}. This is Maya, and I'm here to help make your healthcare experience as smooth as possible.`,
      luxury: `Welcome to ${businessName}, where exceptional care meets personalized service. This is Maya, your patient care coordinator. How may I assist you today?`,
      casual: `Hi there! Thanks for calling ${businessName}. This is Maya, here to help you get the care you need. What can I do for you today?`
    },
    'dental-coordinator': {
      professional: `Thank you for calling ${businessName}. This is Maya, your dental care coordinator. I'm here to help you maintain your healthiest, most beautiful smile.`,
      warm: `Hello and welcome to ${businessName}! This is Maya, and I'm here to make your dental care experience comfortable and positive.`,
      luxury: `Welcome to ${businessName}, where dental excellence meets personalized care. This is Maya, your smile concierge. How may we perfect your smile today?`,
      casual: `Hey! Thanks for calling ${businessName}! This is Maya, ready to help keep that smile looking great. What can we do for you?`
    },
    'fitness-coordinator': {
      professional: `Thank you for calling ${businessName}. This is Maya, your fitness coordinator. I'm here to help you achieve your health and wellness goals through our professional programs.`,
      warm: `Hi there, and welcome to ${businessName}! This is Maya, and I'm so excited to help you on your fitness journey!`,
      luxury: `Welcome to ${businessName}, your premium fitness destination. This is Maya, your personal wellness coordinator. How may we elevate your fitness experience today?`,
      casual: `Hey there, fitness warrior! You've reached ${businessName}, and this is Maya. Ready to crush some goals together? What's the plan?`
    }
  }

  const templates = greetingTemplates[businessInfo.mayaJobId as keyof typeof greetingTemplates]
  return templates?.[businessInfo.brandPersonality] || jobTemplate.defaultGreeting.replace('our', businessName)
}

/**
 * Generate business context for agent prompt
 */
function generateBusinessContext(businessInfo: BusinessTierInfo): string {
  const uniquePoints = businessInfo.uniqueSellingPoints.length > 0 
    ? businessInfo.uniqueSellingPoints.join(', ')
    : 'quality service and customer satisfaction'

  return `
BUSINESS CONTEXT FOR ${businessInfo.businessName.toUpperCase()}:
- Business Name: ${businessInfo.businessName}
- Specializes in: ${uniquePoints}
- Brand Personality: ${businessInfo.brandPersonality}
- Target Customer: ${businessInfo.targetCustomer || 'clients seeking quality service'}
- Price Range: ${businessInfo.priceRange}
- Business Description: ${businessInfo.businessDescription || 'Professional service provider dedicated to excellence'}

BRAND VOICE: ${BRAND_VOICE_TEMPLATES[businessInfo.brandPersonality].tone}
KEY LANGUAGE: Use words like ${BRAND_VOICE_TEMPLATES[businessInfo.brandPersonality].language}
PERSONALITY TRAITS: Be ${BRAND_VOICE_TEMPLATES[businessInfo.brandPersonality].adjectives}
`
}

/**
 * Generate custom system prompt for Business tier
 */
function generateCustomSystemPrompt(businessInfo: BusinessTierInfo, jobTemplate: MayaJobTemplate): string {
  const businessContext = generateBusinessContext(businessInfo)
  
  return `${jobTemplate.systemPrompt}

${businessContext}

CUSTOM INSTRUCTIONS FOR ${businessInfo.businessName}:
- Always refer to the business by name: "${businessInfo.businessName}"
- Embody a ${businessInfo.brandPersonality} personality throughout all interactions
- Highlight our specialties: ${businessInfo.uniqueSellingPoints.join(', ')}
- Maintain the brand voice and use appropriate language for our ${businessInfo.priceRange} price point
- Focus on our target customer: ${businessInfo.targetCustomer || 'clients seeking quality service'}

Remember: You represent ${businessInfo.businessName} specifically, not a generic service provider. Make every interaction reflect our unique brand and values.`
}

/**
 * Main function to generate complete business profile
 */
export function generateBusinessProfile(businessInfo: BusinessTierInfo): CustomBusinessProfile {
  const jobTemplate = getJobTemplate(businessInfo.mayaJobId)
  
  if (!jobTemplate) {
    throw new Error(`Invalid Maya job ID: ${businessInfo.mayaJobId}`)
  }

  const brandVoiceTemplate = BRAND_VOICE_TEMPLATES[businessInfo.brandPersonality]
  
  return {
    agentName: `Maya for ${businessInfo.businessName}`,
    customSystemPrompt: generateCustomSystemPrompt(businessInfo, jobTemplate),
    brandVoice: brandVoiceTemplate.tone,
    customGreeting: generateCustomGreeting(businessInfo, jobTemplate),
    personalityTraits: brandVoiceTemplate.adjectives.split(', '),
    voiceSettings: VOICE_SETTINGS_MAP[businessInfo.brandPersonality],
    businessContext: generateBusinessContext(businessInfo),
    serviceExpertise: [
      ...jobTemplate.expertise,
      ...businessInfo.uniqueSellingPoints
    ]
  }
}

/**
 * Generate fallback profile if auto-generation fails
 */
export function generateFallbackProfile(businessInfo: BusinessTierInfo): CustomBusinessProfile {
  const jobTemplate = getJobTemplate(businessInfo.mayaJobId)
  
  if (!jobTemplate) {
    throw new Error(`Invalid Maya job ID: ${businessInfo.mayaJobId}`)
  }

  return {
    agentName: `Maya for ${businessInfo.businessName}`,
    customSystemPrompt: jobTemplate.systemPrompt.replace(/our/g, businessInfo.businessName),
    brandVoice: 'professional and knowledgeable',
    customGreeting: jobTemplate.defaultGreeting.replace('our', businessInfo.businessName),
    personalityTraits: ['professional', 'knowledgeable', 'helpful'],
    voiceSettings: jobTemplate.voiceSettings,
    businessContext: `Professional service provider: ${businessInfo.businessName}`,
    serviceExpertise: jobTemplate.expertise
  }
}

/**
 * Analyze business name for automatic personality suggestions
 */
export function suggestBrandPersonality(businessName: string): 'professional' | 'warm' | 'luxury' | 'casual' {
  const name = businessName.toLowerCase()
  
  // Luxury indicators
  if (name.includes('luxury') || name.includes('premier') || name.includes('elite') || 
      name.includes('signature') || name.includes('boutique') || name.includes('spa') ||
      name.includes('salon') || name.includes('studio')) {
    return 'luxury'
  }
  
  // Casual indicators  
  if (name.includes('quick') || name.includes('express') || name.includes('fast') ||
      name.includes('easy') || name.includes('simple') || name.includes('buddy') ||
      name.includes('friendly')) {
    return 'casual'
  }
  
  // Warm indicators
  if (name.includes('care') || name.includes('family') || name.includes('home') ||
      name.includes('comfort') || name.includes('cozy') || name.includes('warm')) {
    return 'warm'
  }
  
  // Default to professional
  return 'professional'
}

/**
 * Generate unique selling points suggestions based on job type
 */
export function suggestUniqueSellingPoints(mayaJobId: string): string[] {
  const suggestions = {
    'nail-salon-receptionist': [
      'Custom nail art designs',
      'Luxury manicure experience', 
      'Nail health specialists',
      'Latest nail trends',
      'Organic nail products',
      'Express service available'
    ],
    'hair-salon-coordinator': [
      'Color correction specialists',
      'Bridal hair packages',
      'Latest cutting techniques',
      'Premium hair products',
      'Personalized consultations',
      'Hair health treatments'
    ],
    'spa-wellness-assistant': [
      'Holistic wellness approach',
      'Organic treatment products',
      'Couples packages available',
      'Therapeutic massage',
      'Skin rejuvenation',
      'Relaxation sanctuary'
    ],
    'massage-therapy-scheduler': [
      'Licensed therapeutic massage',
      'Sports injury specialists',
      'Deep tissue expertise',
      'Hot stone therapy',
      'Prenatal massage',
      'Pain management focus'
    ],
    'beauty-salon-assistant': [
      'Advanced facial treatments',
      'Professional makeup',
      'Skincare consultations',
      'Eyebrow artistry',
      'Anti-aging treatments',
      'Bridal beauty packages'
    ],
    'barbershop-coordinator': [
      'Traditional hot towel shaves',
      'Master barber craftsmanship',
      'Classic and modern cuts',
      'Beard styling expertise',
      'Premium grooming products',
      'Father-son appointments'
    ],
    'medical-scheduler': [
      'Board-certified physicians',
      'Same-day appointments',
      'Comprehensive care',
      'Insurance accepted',
      'Telemedicine available',
      'Preventive care focus'
    ],
    'dental-coordinator': [
      'Cosmetic dentistry',
      'Pain-free procedures',
      'Latest dental technology',
      'Emergency appointments',
      'Family dentistry',
      'Sedation options available'
    ],
    'fitness-coordinator': [
      'Certified personal trainers',
      'Custom workout plans',
      'Nutrition coaching',
      'Group fitness classes',
      'State-of-art equipment',
      'Flexible scheduling'
    ]
  }
  
  return suggestions[mayaJobId as keyof typeof suggestions] || []
}