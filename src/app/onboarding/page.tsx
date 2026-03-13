"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, ArrowLeft, CheckCircle, Mic, Phone, Calendar,
  ShoppingBag, Headphones, Play, Loader2, MapPin, Clock, User,
  Link2, ExternalLink, Globe, Sparkles, RotateCw, Copy, Check,
  Volume2, Square, HelpCircle, X, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Business
  industry: string
  address: string
  hoursNote: string  // e.g. "Mon-Fri 9am-5pm"

  // Step 2 — Employee type
  employeeType: string

  // Step 3 — Configure
  employeeName: string
  voiceId: string
  greeting: string
  services: string        // free text: "haircuts, color, manicures"
  escalationPhone: string // human fallback number

  // Step 4 — Phone number
  areaCode: string

  // Result
  provisionedPhone: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPLOYEE_TYPES = [
  {
    id: 'receptionist',
    label: 'Receptionist',
    icon: <Phone className="h-7 w-7" />,
    description: 'Answers calls, greets callers, routes to the right person or takes messages',
    popular: true,
    comingSoon: false,
  },
  {
    id: 'appointment-scheduler',
    label: 'Appointment Setter',
    icon: <Calendar className="h-7 w-7" />,
    description: 'Books, reschedules, and confirms appointments around the clock',
    popular: false,
    comingSoon: false,
  },
  {
    id: 'order-taker',
    label: 'Order Taker',
    icon: <ShoppingBag className="h-7 w-7" />,
    description: 'Takes orders over the phone, confirms details, sends confirmations',
    popular: false,
    comingSoon: false,
  },
  {
    id: 'customer-service',
    label: 'Customer Service',
    icon: <Headphones className="h-7 w-7" />,
    description: 'Handles questions, complaints, and support requests 24/7',
    popular: false,
    comingSoon: true,
  },
]

const VOICES = [
  { id: 'aVR2rUXJY4MTezzJjPyQ', name: 'Angie', description: 'Reassuring, calm & clear', gender: 'female' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella', description: 'Professional & warm', gender: 'female' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: 'Clear & engaging', gender: 'female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Knowledgeable & poised', gender: 'female' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', description: 'Charming & down-to-earth', gender: 'male' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Deep & comforting', gender: 'male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Steady & trustworthy', gender: 'male' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Confident & energetic', gender: 'male' },
]

const SERVICE_ACCOUNT_EMAIL = 'voicefly-calendar@voice-fly.iam.gserviceaccount.com'

const INDUSTRIES = [
  'Medical / Healthcare', 'Dental', 'Law Firm', 'Real Estate',
  'Beauty / Salon / Spa', 'Fitness & Wellness', 'Home Services',
  'Restaurant / Food', 'Retail', 'General Business',
]

// Expanded service suggestions per industry (for chip selection)
const INDUSTRY_SERVICES: Record<string, string[]> = {
  'Beauty / Salon / Spa': ['Haircut', 'Color & Highlights', 'Blowout', 'Balayage', 'Manicure', 'Pedicure', 'Gel Nails', 'Facial', 'Waxing', 'Massage', 'Lash Extensions', 'Brow Tint', 'Keratin Treatment', 'Bridal Package'],
  'Medical / Healthcare': ['New Patient Visit', 'Follow-up Appointment', 'Annual Physical', 'Lab Work', 'Vaccinations', 'Referral', 'Telehealth Visit', 'Urgent Care', 'Prescription Refill'],
  'Dental': ['Cleaning', 'Exam & X-rays', 'Filling', 'Crown', 'Whitening', 'Root Canal', 'Extraction', 'Emergency Visit', 'Invisalign Consult', 'Pediatric Dentistry'],
  'Law Firm': ['Free Consultation', 'Case Review', 'Document Preparation', 'Court Representation', 'Contract Review', 'Estate Planning', 'Mediation', 'Notarization'],
  'Real Estate': ['Property Showing', 'Buyer Consultation', 'Listing Appointment', 'Home Valuation', 'Open House Info', 'Rental Inquiry', 'Pre-Approval Referral'],
  'Fitness & Wellness': ['Personal Training', 'Group Classes', 'Yoga', 'Pilates', 'Nutrition Coaching', 'Membership Inquiry', 'Trial Visit', 'Spin Class', 'CrossFit', 'Meditation'],
  'Home Services': ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Painting', 'General Repair', 'Emergency Service', 'Inspection', 'Estimate', 'Landscaping'],
  'Restaurant / Food': ['Dine-in Reservation', 'Takeout Order', 'Catering', 'Private Events', 'Gift Cards', 'Delivery', 'Menu Inquiry', 'Dietary Accommodations'],
  'Retail': ['Product Inquiry', 'Order Status', 'Returns & Exchanges', 'Gift Cards', 'Personal Shopping', 'Product Demo', 'Curbside Pickup', 'Price Match'],
  'General Business': ['General Inquiry', 'Scheduling', 'Support', 'Billing Questions', 'Consultation', 'Follow-up', 'Quote Request'],
}

// Tooltip component for field help
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

// Smart defaults by industry + employee type
const INDUSTRY_DEFAULTS: Record<string, Record<string, { services: string; greetingTemplate: (name: string, biz: string) => string }>> = {
  'Beauty / Salon / Spa': {
    'receptionist': {
      services: 'Haircut, Color & Highlights, Blowout, Manicure, Pedicure, Facial, Waxing, Massage',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}, how can I help you today? I can answer questions about our services, hours, or help you get connected with a stylist.`,
    },
    'appointment-scheduler': {
      services: 'Haircut, Color & Highlights, Blowout, Manicure, Pedicure, Facial, Waxing, Massage',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}, and I'd love to help you book an appointment. What service are you looking for?`,
    },
  },
  'Medical / Healthcare': {
    'receptionist': {
      services: 'New Patient Visit, Follow-up Appointment, Lab Work, Physical Exam, Vaccinations, Referral',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}, how may I assist you today?`,
    },
    'appointment-scheduler': {
      services: 'New Patient Consultation, Follow-up Visit, Annual Physical, Lab Work, Vaccination, Specialist Referral',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}, I can help you schedule an appointment. Are you a new or existing patient?`,
    },
  },
  'Dental': {
    'receptionist': {
      services: 'Cleaning, Exam & X-rays, Filling, Crown, Whitening, Root Canal, Emergency Visit',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. How can I help you today?`,
    },
    'appointment-scheduler': {
      services: 'Cleaning & Exam, Whitening, Filling, Crown, Root Canal, Emergency Visit, New Patient Exam',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}, I'd be happy to help you schedule your next visit. What type of appointment do you need?`,
    },
  },
  'Law Firm': {
    'receptionist': {
      services: 'Free Consultation, Case Review, Document Preparation, Court Representation',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. How may I direct your call today?`,
    },
    'appointment-scheduler': {
      services: 'Initial Consultation, Case Review, Follow-up Meeting, Document Signing',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. I can help you schedule a consultation. What type of legal matter are you calling about?`,
    },
  },
  'Real Estate': {
    'receptionist': {
      services: 'Property Listing Inquiry, Buyer Consultation, Home Valuation, Open House Info',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. Are you looking to buy, sell, or just have questions about a property?`,
    },
    'appointment-scheduler': {
      services: 'Property Showing, Buyer Consultation, Listing Appointment, Home Valuation',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. I can help you schedule a showing or consultation. What are you looking for?`,
    },
  },
  'Fitness & Wellness': {
    'receptionist': {
      services: 'Membership Inquiry, Personal Training, Group Classes, Yoga, Pilates, Nutrition Coaching',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. How can I help you today?`,
    },
    'appointment-scheduler': {
      services: 'Personal Training Session, Group Class, Yoga, Pilates, Nutrition Consultation, Trial Visit',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. I can help you book a session or class. What are you interested in?`,
    },
  },
  'Home Services': {
    'receptionist': {
      services: 'Plumbing, Electrical, HVAC, Roofing, Painting, General Repair, Emergency Service',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. How can we help you today?`,
    },
    'appointment-scheduler': {
      services: 'Service Call, Estimate, Repair Appointment, Installation, Emergency Visit, Inspection',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. I can help you schedule a service appointment. What do you need help with?`,
    },
  },
  'Restaurant / Food': {
    'receptionist': {
      services: 'Dine-in, Takeout, Catering, Private Events, Gift Cards',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. How can I help you today?`,
    },
    'appointment-scheduler': {
      services: 'Reservation, Private Dining, Catering Consultation, Event Booking',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. I'd be happy to help you make a reservation or book an event.`,
    },
  },
  'Retail': {
    'receptionist': {
      services: 'Product Inquiry, Order Status, Returns & Exchanges, Store Hours, Gift Cards',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. How can I help you today?`,
    },
    'appointment-scheduler': {
      services: 'Personal Shopping, Product Demo, Consultation, Pickup Appointment',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}! I'm ${name}. I can help you schedule an appointment. What are you looking for?`,
    },
  },
  'General Business': {
    'receptionist': {
      services: 'General Inquiry, Scheduling, Support, Billing Questions',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. How can I help you today?`,
    },
    'appointment-scheduler': {
      services: 'Consultation, Meeting, Follow-up, Initial Appointment',
      greetingTemplate: (name: string, biz: string) => `Thank you for calling ${biz}. I'm ${name}. I can help you schedule an appointment. What works best for you?`,
    },
  },
}

function getSmartDefaults(industry: string, employeeType: string, employeeName: string, businessName: string): { services: string; greeting: string } | null {
  const industryDefaults = INDUSTRY_DEFAULTS[industry]
  if (!industryDefaults) return null
  const typeDefaults = industryDefaults[employeeType]
  if (!typeDefaults) return null
  return {
    services: typeDefaults.services,
    greeting: typeDefaults.greetingTemplate(employeeName || 'your assistant', businessName || 'our office'),
  }
}

const TOTAL_STEPS = 7

// ─── Step components ─────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current ? 'bg-blue-600 w-6' : i === current ? 'bg-blue-600 w-4' : 'bg-gray-200 w-4'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface LeadContext {
  email?: string
  name?: string
  firstName?: string
  businessType?: string
  employeeInterest?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [leadContext, setLeadContext] = useState<LeadContext | null>(null)

  const [websiteUrl, setWebsiteUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Voice preview state
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCacheRef = useRef<Map<string, string>>(new Map())

  // Service chips state
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceInput, setCustomServiceInput] = useState('')

  // Extra knowledge from website scrape (passed to VAPI system prompt)
  const [extraKnowledge, setExtraKnowledge] = useState<Record<string, any>>({})

  // Provisioned employee ID (from provision() response)
  const [provisionedEmployeeId, setProvisionedEmployeeId] = useState<string | null>(null)

  // Training chat state
  const [trainingMessages, setTrainingMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [trainingInput, setTrainingInput] = useState('')
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [trainingApplied, setTrainingApplied] = useState(false)
  const trainingEndRef = useRef<HTMLDivElement | null>(null)
  const [trainingListening, setTrainingListening] = useState(false)
  const [trainingSpeakerOn, setTrainingSpeakerOn] = useState(false)
  const [trainingSpeaking, setTrainingSpeaking] = useState(false)
  const trainingRecognitionRef = useRef<any>(null)
  const trainingAudioRef = useRef<HTMLAudioElement | null>(null)

  // Google Calendar inline setup state
  const [calendarId, setCalendarId] = useState('')
  const [calendarConnecting, setCalendarConnecting] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [calendlyConnected, setCalendlyConnected] = useState(false)
  const [calendlyError, setCalendlyError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    industry: '',
    address: '',
    hoursNote: '',
    employeeType: '',
    employeeName: '',
    voiceId: VOICES[0].id,
    greeting: '',
    services: '',
    escalationPhone: '',
    areaCode: '',
    provisionedPhone: '',
  })

  useEffect(() => {
    const id = localStorage.getItem('authenticated_business_id')
    const name = localStorage.getItem('authenticated_business_name') || 'Your Business'
    setBusinessId(id)
    setBusinessName(name)

    // Read context from Maya chat conversation and pre-populate the form
    try {
      const raw = localStorage.getItem('voicefly_lead_context')
      if (raw) {
        const ctx: LeadContext = JSON.parse(raw)
        setLeadContext(ctx)
        setForm(prev => ({
          ...prev,
          industry: ctx.businessType && INDUSTRIES.includes(ctx.businessType) ? ctx.businessType : prev.industry,
          employeeType: ctx.employeeInterest && EMPLOYEE_TYPES.some(t => t.id === ctx.employeeInterest && !t.comingSoon)
            ? ctx.employeeInterest
            : prev.employeeType,
        }))
        localStorage.removeItem('voicefly_lead_context')
      }
    } catch {
      // ignore
    }
  }, [])

  // Detect Calendly OAuth return from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendly_connected') === 'true') {
      setCalendlyConnected(true)
      setStep(4) // go back to calendar step to show success
    } else if (params.get('calendly_error')) {
      const err = params.get('calendly_error')
      setCalendlyError(err === 'authorization_denied' ? 'Calendly authorization was denied.' : 'Failed to connect Calendly. Please try again.')
      setStep(4)
    }
  }, [])

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  // Auto-fill greeting from smart defaults when name/type changes (unless AI-generated)
  useEffect(() => {
    if (!form.employeeName || !form.employeeType || generated) return
    const defaults = getSmartDefaults(form.industry, form.employeeType, form.employeeName, businessName)
    if (defaults) {
      set('greeting', defaults.greeting)
    } else {
      const typeLabel = EMPLOYEE_TYPES.find(t => t.id === form.employeeType)?.label || 'assistant'
      set('greeting', `Hello! Thank you for calling ${businessName}. I'm ${form.employeeName}, your ${typeLabel.toLowerCase()}. How can I help you today?`)
    }
  }, [form.employeeName, form.employeeType, businessName])

  // Pre-select common services when industry is chosen (only on first entry to step 2)
  useEffect(() => {
    if (!form.industry || selectedServices.length > 0 || generated) return
    const suggestions = INDUSTRY_SERVICES[form.industry]
    if (suggestions) {
      // Pre-select the first 6 as a reasonable default
      const preSelected = suggestions.slice(0, 6)
      setSelectedServices(preSelected)
    }
  }, [form.industry, step])

  // Sync selectedServices -> form.services
  useEffect(() => {
    set('services', selectedServices.join(', '))
  }, [selectedServices])

  // Helper to toggle a service chip
  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    )
  }

  // Add a custom service
  const addCustomService = () => {
    const trimmed = customServiceInput.trim()
    if (trimmed && !selectedServices.includes(trimmed)) {
      setSelectedServices(prev => [...prev, trimmed])
      setCustomServiceInput('')
    }
  }

  const canAdvance = () => {
    switch (step) {
      case 0: return !!form.industry
      case 1: return !!form.employeeType
      case 2: return !!form.employeeName && !!form.voiceId
      case 3: return true // area code optional
      case 4: return true // calendar step — optional, can skip
      case 5: return true // training step — always skippable
      case 6: return true
      default: return false
    }
  }

  const handleNext = async () => {
    if (step === 3) {
      await provision()
    } else if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    }
  }

  const skipCalendarStep = () => {
    setStep(5) // go to training step
  }

  // ── Voice preview ───────────────────────────────────────────────────────────
  const playVoicePreview = async (voiceId: string) => {
    // Toggle off if same voice
    if (playingVoice === voiceId) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlayingVoice(null)
      return
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingVoice(null)
    }

    // Use cached blob URL if available
    const cachedUrl = audioCacheRef.current.get(voiceId)
    if (cachedUrl) {
      const audio = new Audio(cachedUrl)
      audioRef.current = audio
      audio.onended = () => { setPlayingVoice(null); audioRef.current = null }
      audio.play()
      setPlayingVoice(voiceId)
      return
    }

    // Fetch from API
    setLoadingVoice(voiceId)
    try {
      const res = await fetch(`/api/voice-preview?voiceId=${voiceId}`)
      if (!res.ok) throw new Error('Failed to load preview')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioCacheRef.current.set(voiceId, url)

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPlayingVoice(null); audioRef.current = null }
      audio.play()
      setPlayingVoice(voiceId)
    } catch (err) {
      console.error('Voice preview error:', err)
    } finally {
      setLoadingVoice(null)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  // Auto-scroll training chat messages
  useEffect(() => {
    trainingEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [trainingMessages])

  // ── Google Calendar inline setup ────────────────────────────────────────────
  const copyServiceEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const connectGoogleCalendar = async () => {
    if (!calendarId.trim() || !businessId || calendarConnecting) return
    setCalendarConnecting(true)
    setCalendarError(null)

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch('/api/integrations/google-calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ businessId, calendarId: calendarId.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to connect calendar')

      setCalendarConnected(true)
    } catch (err: any) {
      setCalendarError(err.message || 'Failed to connect. Make sure you shared the calendar first.')
    } finally {
      setCalendarConnecting(false)
    }
  }

  // Scrape website and auto-fill business info across all steps
  const generateFromWebsite = async () => {
    if (!websiteUrl.trim() || !businessId || generating) return
    setGenerating(true)
    setError(null)

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch('/api/phone-employees/extract-from-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          jobType: form.employeeType || 'receptionist',
          url: websiteUrl.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to scrape website')

      const ext = data.extracted || {}

      // Step 0 fields: industry, address, hours
      if (ext.detectedIndustry && INDUSTRIES.includes(ext.detectedIndustry)) {
        set('industry', ext.detectedIndustry)
      }
      if (ext.address) set('address', ext.address)
      if (ext.hours) set('hoursNote', ext.hours)

      // Step 2 fields: services (as chips), escalation phone
      if (ext.services && Array.isArray(ext.services)) {
        const serviceNames = ext.services.map((s: any) => typeof s === 'string' ? s : s.name).filter(Boolean)
        if (serviceNames.length > 0) setSelectedServices(serviceNames)
      }
      if (ext.phone) set('escalationPhone', ext.phone)

      // Store extra knowledge for VAPI system prompt
      const knowledge: Record<string, any> = {}
      if (ext.faqs?.length) knowledge.faqs = ext.faqs
      if (ext.staff?.length) knowledge.staff = ext.staff
      if (ext.policies && Object.keys(ext.policies).length) knowledge.policies = ext.policies
      if (ext.paymentMethods?.length) knowledge.paymentMethods = ext.paymentMethods
      if (ext.parkingInfo) knowledge.parkingInfo = ext.parkingInfo
      if (ext.promotions?.length) knowledge.promotions = ext.promotions
      if (ext.brandTone) knowledge.brandTone = ext.brandTone
      if (ext.businessDescription) knowledge.businessDescription = ext.businessDescription
      if (ext.socialMedia?.length) knowledge.socialMedia = ext.socialMedia
      setExtraKnowledge(knowledge)

      setGenerated(true)
    } catch (err: any) {
      setError(err.message || 'Failed to scrape website. You can fill in the details manually.')
    } finally {
      setGenerating(false)
    }
  }

  const skipTrainingStep = () => setStep(6)

  const toggleTrainingListening = () => {
    if (trainingListening) {
      trainingRecognitionRef.current?.stop()
      setTrainingListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    trainingRecognitionRef.current = recognition
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setTrainingInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setTrainingListening(false)
        if (transcript.trim()) sendOnboardingTraining(transcript.trim())
      }
    }
    recognition.onerror = () => setTrainingListening(false)
    recognition.onend = () => setTrainingListening(false)
    recognition.start()
    setTrainingListening(true)
  }

  const speakTrainingResponse = async (text: string) => {
    if (trainingAudioRef.current) { trainingAudioRef.current.pause(); trainingAudioRef.current = null }
    try {
      setTrainingSpeaking(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) { setTrainingSpeaking(false); return }
      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      trainingAudioRef.current = audio
      audio.onended = () => { setTrainingSpeaking(false); URL.revokeObjectURL(audioUrl); trainingAudioRef.current = null }
      audio.onerror = () => { setTrainingSpeaking(false); URL.revokeObjectURL(audioUrl); trainingAudioRef.current = null }
      await audio.play()
    } catch { setTrainingSpeaking(false) }
  }

  const sendOnboardingTraining = async (overrideMessage?: string) => {
    const message = (overrideMessage || trainingInput).trim()
    if (!message || trainingLoading) return
    setTrainingInput('')
    setTrainingMessages(prev => [...prev, { role: 'user', content: message }])
    setTrainingLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/parse-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          message,
          currentConfig: {
            greeting: form.greeting,
            businessDescription: '',
            customInstructions: '',
            callHandlingRules: '',
            restrictions: '',
            faqs: [],
            services: form.services,
            transferDestinations: [],
          },
          jobType: form.employeeType || 'receptionist',
          context: {
            industry: form.industry,
            employeeName: form.employeeName,
            services: form.services,
          },
        }),
      })

      if (!res.ok) {
        setTrainingMessages(prev => [...prev, { role: 'assistant', content: "I had trouble processing that. You can always refine this from the dashboard after setup." }])
        return
      }

      const data = await res.json()
      setTrainingApplied(true)

      // Apply changes directly to form
      if (data.changes?.length) {
        for (const change of data.changes) {
          if (change.type === 'greeting' && change.action === 'set') {
            set('greeting', change.data.text)
          }
          if ((change.type === 'customInstructions' || change.type === 'businessDescription') && (change.action === 'set' || change.action === 'append')) {
            // store in escalationPhone field? No — just acknowledge, can't easily apply all in onboarding
          }
        }
      }

      const reply = data.summary || "Got it! I've noted that for your employee. Anything else you want to configure, or are you ready to finish setup?"
      setTrainingMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (trainingSpeakerOn) speakTrainingResponse(reply)
    } catch {
      setTrainingMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. You can always train your employee from the dashboard." }])
    } finally {
      setTrainingLoading(false)
    }
  }

  const provision = async () => {
    if (!businessId) { setError('Session expired. Please sign in again.'); return }
    setSubmitting(true)
    setError(null)

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          industry: form.industry,
          address: form.address,
          hoursNote: form.hoursNote,
          employeeType: form.employeeType,
          employeeName: form.employeeName,
          voiceId: form.voiceId,
          greeting: form.greeting,
          services: form.services,
          escalationPhone: form.escalationPhone,
          areaCode: form.areaCode || undefined,
          extraKnowledge: Object.keys(extraKnowledge).length > 0 ? extraKnowledge : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to provision employee')

      set('provisionedPhone', data.phoneNumber || '')
      if (data.employee?.id) setProvisionedEmployeeId(data.employee.id)
      // Only show calendar step for appointment schedulers — others go to training step
      setStep(form.employeeType === 'appointment-scheduler' ? 4 : 5)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render steps ────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Business setup ──────────────────────────────────────────────
      case 0:
        return (
          <div className="max-w-xl mx-auto">
            {/* Personalized welcome from Maya chat context */}
            {leadContext && (leadContext.firstName || leadContext.businessType || leadContext.employeeInterest) && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-10 w-10 rounded-full border-2 border-blue-400/50 flex-shrink-0 object-cover object-top" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">
                    Welcome{leadContext.firstName ? `, ${leadContext.firstName}` : ''}! I've pre-filled what I learned from our chat.
                  </p>
                  <p className="text-xs text-gray-600">
                    {leadContext.businessType && leadContext.employeeInterest
                      ? `Industry pre-selected: ${leadContext.businessType} · Suggested employee: ${EMPLOYEE_TYPES.find(t => t.id === leadContext.employeeInterest)?.label || leadContext.employeeInterest}`
                      : leadContext.businessType
                      ? `Industry pre-selected: ${leadContext.businessType} — confirm it below`
                      : leadContext.employeeInterest
                      ? `Suggested employee: ${EMPLOYEE_TYPES.find(t => t.id === leadContext.employeeInterest)?.label} — you can change it in the next step`
                      : 'Just confirm your industry below to continue.'}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
              <p className="text-gray-500">We'll use this to train your AI employee</p>
            </div>

            {/* Website URL auto-fill — scrapes business info into all fields */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-semibold text-gray-900">Auto-fill from your website</label>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">AI-powered</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">We'll scan your website and auto-fill your industry, address, hours, services, and more.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={generateFromWebsite}
                  disabled={!websiteUrl.trim() || generating}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    websiteUrl.trim() && !generating
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
                  ) : generated ? (
                    <><RotateCw className="h-4 w-4" /> Re-scan</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Scan</>
                  )}
                </button>
              </div>
              {generated && (
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Business info auto-filled from your website. Review and edit anything below.
                </p>
              )}
              {error && step === 0 && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => set('industry', ind)}
                      className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        form.industry === ind
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Hours <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.hoursNote}
                    onChange={e => set('hoursNote', e.target.value)}
                    placeholder="e.g. Mon–Fri 9am–5pm, Sat 10am–3pm"
                    className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      // ── Step 1: Choose employee type ────────────────────────────────────────
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hire your first AI employee</h2>
              <p className="text-gray-500">What role do you need filled?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {EMPLOYEE_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => !type.comingSoon && set('employeeType', type.id)}
                  disabled={type.comingSoon}
                  className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                    type.comingSoon
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : form.employeeType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {type.comingSoon && (
                    <span className="absolute top-4 right-4 text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                      Coming soon
                    </span>
                  )}
                  {type.popular && !type.comingSoon && (
                    <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      Most popular
                    </span>
                  )}
                  <div className={`p-3 rounded-lg w-fit mb-4 ${
                    type.comingSoon ? 'bg-gray-100 text-gray-400'
                    : form.employeeType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {type.icon}
                  </div>
                  <h3 className={`font-semibold mb-1 ${type.comingSoon ? 'text-gray-400' : 'text-gray-900'}`}>{type.label}</h3>
                  <p className={`text-sm ${type.comingSoon ? 'text-gray-400' : 'text-gray-500'}`}>{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )

      // ── Step 2: Configure employee ──────────────────────────────────────────
      case 2: {
        const selectedVoice = VOICES.find(v => v.id === form.voiceId)
        return (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure your employee</h2>
              <p className="text-gray-500">Personalize how they sound and what they know</p>
            </div>

            {/* Show website scrape context if scraped in Step 0 */}
            {generated && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">Services and greeting pre-filled from your website</p>
                  <p className="text-xs text-green-700 mt-0.5">Review and edit anything below to get it just right.</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Give them a name
                  <Tooltip text="This is how your AI employee introduces itself on calls. Pick something friendly and professional." />
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.employeeName}
                    onChange={e => set('employeeName', e.target.value)}
                    placeholder="e.g. Alex, Jordan, Sam..."
                    className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Choose a voice
                  <Tooltip text="This is the voice callers will hear. Preview a few to find one that matches your brand." />
                </label>
                <p className="text-xs text-gray-400 mb-3">Click the play button to preview each voice</p>
                <div className="grid grid-cols-2 gap-3">
                  {VOICES.map(voice => (
                    <div
                      key={voice.id}
                      onClick={() => set('voiceId', voice.id)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                        form.voiceId === voice.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900">{voice.name}</div>
                        <div className="text-xs text-gray-500">{voice.description}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); playVoicePreview(voice.id) }}
                        className={`p-2 rounded-full transition-all flex-shrink-0 ml-2 ${
                          playingVoice === voice.id
                            ? 'bg-blue-600 text-white'
                            : loadingVoice === voice.id
                            ? 'bg-blue-100 text-blue-400'
                            : form.voiceId === voice.id
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={playingVoice === voice.id ? 'Stop' : 'Preview voice'}
                      >
                        {loadingVoice === voice.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : playingVoice === voice.id ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Opening greeting
                  <Tooltip text="This is exactly what your AI says when it picks up. Keep it natural, include your business name, and mention how you can help." />
                </label>
                <textarea
                  value={form.greeting}
                  onChange={e => set('greeting', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="What should they say when they pick up?"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated — customize it if you'd like</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Services you offer
                  <Tooltip text="Select the services your business provides. Your AI employee will use this to answer caller questions about what you offer." />
                </label>

                {/* Selected services */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedServices.map(service => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => toggleService(service)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Industry suggestions */}
                {form.industry && INDUSTRY_SERVICES[form.industry] && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Tap to add or remove:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INDUSTRY_SERVICES[form.industry]
                        .filter(s => !selectedServices.includes(s))
                        .map(service => (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleService(service)}
                            className="inline-flex items-center gap-1 border border-gray-300 text-gray-600 text-sm px-2.5 py-1 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Plus className="h-3 w-3" />
                            {service}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Custom service input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customServiceInput}
                    onChange={e => setCustomServiceInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomService() } }}
                    placeholder="Add a custom service..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addCustomService}
                    disabled={!customServiceInput.trim()}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      customServiceInput.trim()
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Escalation phone number <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  <Tooltip text="If a caller needs a real person, your AI will transfer them to this number. Leave blank to skip." />
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.escalationPhone}
                    onChange={e => set('escalationPhone', e.target.value)}
                    placeholder="+1 (555) 000-0000 — transfer if AI can't help"
                    className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }

      // ── Step 3: Get phone number ────────────────────────────────────────────
      case 3:
        return (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get {form.employeeName || 'your employee'} a phone number</h2>
              <p className="text-gray-500">We'll provision a dedicated Twilio number — calls <strong>and</strong> SMS included</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred area code <span className="text-gray-400 font-normal">(optional — we'll find the best match)</span>
              </label>
              <input
                type="text"
                value={form.areaCode}
                onChange={e => set('areaCode', e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415, 312, 212"
                maxLength={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono text-center text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-sm">
              <p className="font-semibold text-blue-900">What you get with this number:</p>
              <ul className="space-y-1.5 text-blue-800">
                {[
                  'Inbound voice calls handled by your AI employee 24/7',
                  'SMS capability — confirmations, reminders, follow-ups',
                  'Keep your existing number — just forward calls to this one',
                  'Full call recordings and transcripts in your dashboard',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )

      // ── Step 4: Connect calendar ─────────────────────────────────────────────
      case 4: {
        const isAppointmentType = form.employeeType === 'appointment-scheduler'
        return (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your calendar</h2>
              <p className="text-gray-500">
                {isAppointmentType
                  ? `Let ${form.employeeName || 'your employee'} book appointments directly on your calendar`
                  : `Optional: let ${form.employeeName || 'your employee'} check your availability for callers`
                }
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {/* Google Calendar — inline setup */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                    <p className="text-sm text-gray-500 mt-0.5">3 quick steps to connect</p>
                  </div>
                </div>

                {calendarConnected ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 text-sm">Calendar connected!</p>
                      <p className="text-xs text-green-700 mt-0.5">{form.employeeName || 'Your employee'} can now check your availability and book appointments.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Step 1: Copy service account email */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-2">Copy this email address</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
                            {SERVICE_ACCOUNT_EMAIL}
                          </code>
                          <button
                            onClick={copyServiceEmail}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                            title="Copy email"
                          >
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Share calendar instructions */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Share your Google Calendar</p>
                        <ol className="text-xs text-gray-600 space-y-1.5 mb-2">
                          <li className="flex items-start gap-1.5">
                            <span className="text-gray-400 font-medium">a.</span>
                            <span>Open{' '}
                              <a href="https://calendar.google.com/calendar/r/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                Google Calendar Settings <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-gray-400 font-medium">b.</span>
                            <span>Click your calendar name in the left sidebar</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-gray-400 font-medium">c.</span>
                            <span>Scroll to <strong>&quot;Share with specific people&quot;</strong> → click <strong>&quot;+ Add people and groups&quot;</strong></span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-gray-400 font-medium">d.</span>
                            <span>Paste the email above, select <strong>&quot;Make changes to events&quot;</strong>, then click <strong>&quot;Send&quot;</strong></span>
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Step 3: Paste Calendar ID */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Enter your Calendar ID</p>
                        <p className="text-xs text-gray-500 mb-2">
                          In the same settings page, scroll down to <strong>&quot;Integrate calendar&quot;</strong>. Copy the <strong>Calendar ID</strong> — it usually looks like <code className="bg-gray-100 px-1 rounded text-gray-600">your-email@gmail.com</code>
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={calendarId}
                            onChange={e => setCalendarId(e.target.value)}
                            placeholder="your-email@gmail.com or calendar ID"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={connectGoogleCalendar}
                            disabled={!calendarId.trim() || calendarConnecting}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                              calendarId.trim() && !calendarConnecting
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {calendarConnecting ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                            ) : (
                              'Connect'
                            )}
                          </button>
                        </div>
                        {calendarError && (
                          <p className="text-xs text-red-600 mt-2">{calendarError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendly option — inline status */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="#006BFF" />
                      <path d="M15.5 8.5a4 4 0 1 0 0 7h0a3 3 0 0 0 2.12-.88" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Calendly</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Connect with one click — you'll authorize on Calendly and come right back</p>
                  </div>
                </div>

                {calendlyConnected ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 text-sm">Calendly connected!</p>
                      <p className="text-xs text-green-700 mt-0.5">{form.employeeName || 'Your employee'} can now book appointments through your Calendly event types.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        if (businessId) {
                          window.location.href = `/api/integrations/calendly/oauth?businessId=${businessId}&from=onboarding`
                        }
                      }}
                      className="w-full bg-[#006BFF] text-white font-medium px-4 py-2.5 rounded-lg hover:bg-[#0057d4] transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      Connect Calendly <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    {calendlyError && (
                      <p className="text-xs text-red-600 mt-2">{calendlyError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isAppointmentType && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">
                <p className="font-semibold mb-1">Recommended for appointment setters</p>
                <p>Without a calendar connection, {form.employeeName || 'your employee'} won't be able to check availability or book appointments. You can always connect one later from Settings.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={skipCalendarStep}
                className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      }

      // ── Step 5: Train your employee ─────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Train {form.employeeName || 'your employee'}</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Tell me about your business and I&apos;ll configure {form.employeeName || 'your employee'} for you. You can always refine this from the dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (trainingSpeaking) { trainingAudioRef.current?.pause(); trainingAudioRef.current = null; setTrainingSpeaking(false) }
                  setTrainingSpeakerOn(v => !v)
                }}
                title={trainingSpeakerOn ? 'Mute Maya' : 'Hear Maya speak'}
                className={`mt-1 p-2 rounded-lg transition-colors flex-shrink-0 ${trainingSpeakerOn ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {trainingSpeakerOn
                  ? <Volume2 className="h-5 w-5" />
                  : <Volume2 className="h-5 w-5 opacity-40" />}
              </button>
            </div>

            {/* Opening message from Maya */}
            <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
              <div className="max-h-72 overflow-y-auto p-4 space-y-3">
                {/* Static welcome message */}
                <div className="flex justify-start gap-2">
                  <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                  <div className="max-w-[85%] bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>
                    <p className="text-sm text-gray-800">
                      {form.industry
                        ? `${form.employeeName || 'Your employee'} is all set! I can see you're in ${form.industry}${form.services ? ` and offer ${form.services}` : ''}. What do callers ask about most — things like pricing, hours, or booking?`
                        : `${form.employeeName || 'Your employee'} is ready to go! Tell me about your business — what services you offer, your hours, anything callers typically ask — and I'll configure them for you.`}
                    </p>
                  </div>
                </div>
                {trainingMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                    {msg.role === 'assistant' && (
                      <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                    )}
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-xl px-4 py-3`}>
                      {msg.role === 'assistant' && <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {trainingLoading && (
                  <div className="flex justify-start gap-2">
                    <img src="/maya-avatars/holo-d1.png" alt="Maya" className="h-7 w-7 rounded-full border border-blue-300/50 flex-shrink-0 object-cover object-top mt-0.5" />
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-blue-600 mb-1">Maya</p>
                      <p className="text-sm text-gray-400">Thinking...</p>
                    </div>
                  </div>
                )}
                <div ref={trainingEndRef} />
              </div>

              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trainingInput}
                    onChange={e => setTrainingInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendOnboardingTraining() } }}
                    placeholder={trainingListening ? 'Listening...' : `e.g. We're a dental office open Mon-Fri 8am-5pm...`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={trainingLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleTrainingListening}
                    disabled={trainingLoading}
                    title={trainingListening ? 'Stop listening' : 'Speak to Maya'}
                    className={`px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${trainingListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sendOnboardingTraining()}
                    disabled={trainingLoading || !trainingInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={skipTrainingStep}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now →
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Finish Setup
              </button>
            </div>
          </div>
        )

      // ── Step 6: Live! ───────────────────────────────────────────────────────
      case 6:
        return (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {form.employeeName || 'Your employee'} is live!
            </h2>
            <p className="text-gray-500 mb-8">
              Your AI phone employee is active and ready to take calls right now.
            </p>

            {form.provisionedPhone ? (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-6">
                  <p className="text-blue-200 text-sm mb-2">Your new phone number</p>
                  <p className="text-4xl font-bold font-mono tracking-wide mb-4">{form.provisionedPhone}</p>
                  <a
                    href={`tel:${form.provisionedPhone}`}
                    className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Call now to test {form.employeeName}
                  </a>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 text-left mb-6">
                  <p className="font-semibold mb-2">Want to keep your existing number?</p>
                  <p>Forward calls from your current number to <strong>{form.provisionedPhone}</strong>. Most carriers let you do this in your account settings — search "call forwarding" + your carrier name for instructions.</p>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 mb-6">
                <p className="font-semibold mb-1">Phone number provisioning is in progress</p>
                <p>Check your dashboard in a moment — your number will appear there once it's ready.</p>
              </div>
            )}

            <button
              onClick={() => {
                if (provisionedEmployeeId) {
                  localStorage.setItem('voicefly_just_onboarded', provisionedEmployeeId)
                }
                router.push('/dashboard')
              }}
              className="w-full bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Go to your dashboard <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">VoiceFly</span>
          </div>
          {step < TOTAL_STEPS - 1 && step !== 4 && step !== 5 && (
            <div className="flex items-center gap-4">
              <StepIndicator current={step} total={4} />
              <span className="text-sm text-gray-400">Step {step + 1} of 4</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {step < TOTAL_STEPS - 1 && step !== 4 && step !== 5 && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-blue-600 transition-all duration-500"
            style={{ width: `${((step + 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Footer nav — hidden on calendar step (has own buttons), training step, and success screen */}
      {step < TOTAL_STEPS - 1 && step !== 4 && step !== 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
                step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canAdvance() || submitting}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-semibold transition-all ${
                canAdvance() && !submitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : step === 3 ? (
                <>Activate employee <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Next <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
