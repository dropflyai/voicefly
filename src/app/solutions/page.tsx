'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDownIcon,
  CheckCircleIcon,
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

type Industry = {
  id: string
  name: string
  icon: string
  description: string
  painPoints: string[]
  solutions: string[]
  stats: {
    missedCalls: string
    lostRevenue: string
    afterHours: string
  }
  roi: string
  avgTransaction: string
  conversionRate: string
}

const industries: Industry[] = [
  {
    id: 'medspa',
    name: 'Med Spas & Aesthetic Clinics',
    icon: '💆‍♀️',
    description: 'High-value aesthetic services that demand luxury customer experience',
    painPoints: [
      'Instagram leads calling after hours - going straight to competitors',
      'Front desk overwhelmed with consultation requests during peak hours',
      'Missing calls from high-value clients ($500-2000+ treatments)',
      'Can\'t qualify leads fast enough - wasting time on price shoppers',
      'No 24/7 availability for urgent Botox/filler inquiries'
    ],
    solutions: [
      'Maya answers every Instagram lead instantly - even at 11 PM',
      'Books consultations automatically while your team focuses on in-person clients',
      'Qualifies leads by asking about desired treatments, budget, timeline',
      'Sends pricing & before/after photos via SMS immediately',
      'Available 24/7 to capture after-hours bookings when competitors are closed'
    ],
    stats: {
      missedCalls: '40%',
      lostRevenue: '$75K+/year',
      afterHours: '40%'
    },
    roi: '20-25x within 2 months',
    avgTransaction: '$800-2000',
    conversionRate: '85%'
  },
  {
    id: 'medical',
    name: 'Medical Practices',
    icon: '🩺',
    description: 'Primary care, specialists, and urgent care facilities',
    painPoints: [
      '40% of patient calls go to voicemail - they call the next doctor',
      'Front desk staff overwhelmed during flu season / peak hours',
      'After-hours calls going unanswered - patients go to ER instead',
      'Insurance verification taking 15+ minutes per call',
      'Missing $50K+ annually in appointment revenue from unanswered calls'
    ],
    solutions: [
      'Maya answers 100% of calls immediately - no more voicemail',
      'Books appointments while verifying insurance in real-time',
      'Handles after-hours triage - books urgent vs routine appointments',
      'Transfers critical emergencies to on-call doctor automatically',
      'Sends appointment confirmations & reminders via SMS'
    ],
    stats: {
      missedCalls: '40%',
      lostRevenue: '$50K+/year',
      afterHours: '35%'
    },
    roi: '15-20x within 3 months',
    avgTransaction: '$200-500',
    conversionRate: '80%'
  },
  {
    id: 'dental',
    name: 'Dental Practices',
    icon: '🦷',
    description: 'General dentistry, orthodontics, and dental specialists',
    painPoints: [
      'Front desk can\'t answer phones during patient care - losing new patients',
      'No-shows costing $150-300 per missed slot',
      'After-hours emergency calls going to competitors',
      'Insurance verification delaying appointment bookings',
      'Can\'t handle lunch rush + 5 PM call spike'
    ],
    solutions: [
      'Maya answers every call while your team focuses on patients',
      'Sends automated reminders - reduces no-shows by 60%',
      'Handles emergency calls 24/7 - books urgent vs routine',
      'Verifies insurance instantly during booking',
      'Manages high-volume periods without adding staff'
    ],
    stats: {
      missedCalls: '35%',
      lostRevenue: '$45K+/year',
      afterHours: '30%'
    },
    roi: '12-18x within 3 months',
    avgTransaction: '$250-600',
    conversionRate: '75%'
  },
  {
    id: 'legal',
    name: 'Law Firms',
    icon: '⚖️',
    description: 'Personal injury, family law, criminal defense, and business law',
    painPoints: [
      'Paralegals spending 10+ hours/week on intake calls instead of billable work',
      'Missing high-value consultations ($500-5000+) after business hours',
      'Can\'t qualify leads fast enough - wasting attorney time',
      'Potential clients calling competitors when they can\'t reach you',
      'No Spanish-speaking receptionist for 40% of incoming leads'
    ],
    solutions: [
      'Maya handles intake 24/7 - collects case details before attorney review',
      'Qualifies leads automatically - case type, urgency, budget, timeline',
      'Books consultations directly on attorney calendars',
      'Bilingual support - English & Spanish intake',
      'Sends retainer agreements & case intake forms via SMS/email instantly'
    ],
    stats: {
      missedCalls: '50%',
      lostRevenue: '$100K+/year',
      afterHours: '50%'
    },
    roi: '10-15x within 2 months',
    avgTransaction: '$1000-5000',
    conversionRate: '75%'
  },
  {
    id: 'home_services',
    name: 'Home Services (HVAC, Plumbing, Electrical)',
    icon: '🏠',
    description: 'Emergency and scheduled home repair services',
    painPoints: [
      'Missing emergency calls at 2 AM - competitors win the job',
      'Technicians can\'t answer phone while fixing AC in 100° attic',
      'Losing $80K+ annually from unanswered emergency calls',
      'No way to triage urgent vs routine - wasting dispatch time',
      'Can\'t capture seasonal spikes (AC in summer, heating in winter)'
    ],
    solutions: [
      'Maya answers emergencies 24/7 - books same-day service instantly',
      'Triages urgent vs routine - sends techs to high-priority calls first',
      'Collects photos/videos of problem via SMS for accurate diagnosis',
      'Dispatches techs automatically based on location & availability',
      'Handles seasonal spikes without hiring seasonal staff'
    ],
    stats: {
      missedCalls: '60%',
      lostRevenue: '$80K+/year',
      afterHours: '60%'
    },
    roi: '15-20x within 3 months',
    avgTransaction: '$300-1500',
    conversionRate: '78%'
  },
  {
    id: 'auto',
    name: 'Auto Repair & Dealerships',
    icon: '🔧',
    description: 'Auto repair shops, dealerships, and collision centers',
    painPoints: [
      'Service advisors on phone all day - can\'t focus on customers in shop',
      'Missing appointment requests during peak drop-off hours (7-9 AM)',
      'No follow-up on service reminders - losing $30K+ in maintenance revenue',
      'Can\'t handle recall campaigns - customers going elsewhere',
      'No after-hours booking for working professionals'
    ],
    solutions: [
      'Maya books service appointments 24/7 - even when shop is closed',
      'Sends automated service reminders based on mileage/time',
      'Handles recall campaigns - books appointments automatically',
      'Provides service quotes instantly based on year/make/model',
      'Upsells maintenance packages during booking calls'
    ],
    stats: {
      missedCalls: '45%',
      lostRevenue: '$60K+/year',
      afterHours: '25%'
    },
    roi: '8-12x within 3 months',
    avgTransaction: '$400-800',
    conversionRate: '70%'
  },
  {
    id: 'barbershop',
    name: 'Barber Shops & Hair Salons',
    icon: '💇‍♂️',
    description: 'Full-service salons, barber shops, and styling studios',
    painPoints: [
      'Stylists can\'t answer phone while cutting hair - losing walk-in bookings',
      'Instagram leads calling after hours - going to 24/7 booking competitors',
      'No-shows costing $50-100 per missed appointment',
      'Can\'t handle lunch rush bookings + 5 PM call spike',
      'Missing group bookings (weddings, proms, events)'
    ],
    solutions: [
      'Maya answers calls while stylists focus on clients',
      'Books appointments directly from Instagram DMs & website chat',
      'Sends automated reminders - reduces no-shows by 65%',
      'Handles group bookings - coordinates multiple stylists',
      'Captures after-hours bookings when shop is closed'
    ],
    stats: {
      missedCalls: '55%',
      lostRevenue: '$35K+/year',
      afterHours: '20%'
    },
    roi: '6-10x within 3 months',
    avgTransaction: '$50-150',
    conversionRate: '60%'
  },
  {
    id: 'fitness',
    name: 'Fitness Studios & Gyms',
    icon: '🏋️',
    description: 'Boutique fitness, yoga studios, CrossFit, and gyms',
    painPoints: [
      'Front desk overwhelmed during peak hours (6 AM, 6 PM)',
      'Losing trial class conversions - can\'t follow up fast enough',
      'Can\'t answer calls during classes - missing membership sales',
      'No automated class waitlist management',
      'Missing corporate wellness inquiries after business hours'
    ],
    solutions: [
      'Maya books trial classes & memberships 24/7',
      'Follows up on trial attendees immediately - converts to membership',
      'Manages class waitlists automatically - fills cancellations instantly',
      'Handles corporate wellness inquiries & group bookings',
      'Sends class reminders & motivational check-ins'
    ],
    stats: {
      missedCalls: '50%',
      lostRevenue: '$40K+/year',
      afterHours: '50%'
    },
    roi: '8-12x within 2 months',
    avgTransaction: '$100-200',
    conversionRate: '65%'
  },
  {
    id: 'realestate',
    name: 'Real Estate Agencies',
    icon: '🏡',
    description: 'Residential and commercial real estate brokerages',
    painPoints: [
      'Agents in showings can\'t answer - leads calling next realtor on Zillow',
      'Speed-to-lead critical - lose 80% of leads after 5 minutes',
      'Missing after-hours inquiries from working professionals',
      'Can\'t coordinate showings across multiple agents efficiently',
      'No automated follow-up on open house attendees'
    ],
    solutions: [
      'Maya qualifies leads instantly - budget, timeline, neighborhoods',
      'Books showings directly on agent calendars based on availability',
      'Responds in under 60 seconds - wins leads before competitors',
      'Sends property details, photos, virtual tours via SMS immediately',
      'Follows up with open house attendees - books private showings'
    ],
    stats: {
      missedCalls: '70%',
      lostRevenue: '$150K+/year',
      afterHours: '45%'
    },
    roi: '10-15x within 2 months',
    avgTransaction: '$5000-15000',
    conversionRate: '72%'
  },
  {
    id: 'veterinary',
    name: 'Veterinary Clinics',
    icon: '🐾',
    description: 'Veterinary hospitals, emergency vet, and specialty animal care',
    painPoints: [
      'Pet emergencies call after hours - owners panicking, going to 24/7 ER',
      'Front desk overwhelmed during vaccine season',
      'Can\'t provide empathetic service while handling high call volume',
      'Missing appointment requests during surgery hours',
      'No way to triage urgent vs routine pet issues'
    ],
    solutions: [
      'Maya handles after-hours emergencies with empathy - triages urgent vs routine',
      'Books wellness visits & vaccine appointments automatically',
      'Sends pet health reminders based on vaccination schedules',
      'Collects pet symptoms via SMS - helps vets prepare before visit',
      'Provides 24/7 support for worried pet owners'
    ],
    stats: {
      missedCalls: '40%',
      lostRevenue: '$55K+/year',
      afterHours: '40%'
    },
    roi: '10-14x within 3 months',
    avgTransaction: '$150-400',
    conversionRate: '74%'
  }
]

export default function SolutionsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', textDecoration: 'none' }}>
            🎙️ VoiceFly
          </Link>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</Link>
            <Link href="/solutions" style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>Solutions</Link>
            <Link href="/features" style={{ color: '#4b5563', textDecoration: 'none' }}>Features</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/testimonials" style={{ color: '#4b5563', textDecoration: 'none' }}>Testimonials</Link>
            <Link href="/login" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)', padding: '64px 24px', color: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
            Industry-Specific AI Receptionists
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '800px', margin: '0 auto', color: '#ffffff' }}>
            Maya is trained specifically for your industry. Select your business type below to see exactly how we solve your unique challenges.
          </p>
        </div>
      </div>

      {/* Industry Selector */}
      <div style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Select Your Industry
          </label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                cursor: 'pointer'
              }}
            >
              <span>
                {selectedIndustry.icon} {selectedIndustry.name}
              </span>
              <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 20
              }}>
                {industries.map((industry) => (
                  <button
                    key={industry.id}
                    onClick={() => {
                      setSelectedIndustry(industry)
                      setIsDropdownOpen(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      backgroundColor: selectedIndustry.id === industry.id ? '#f3f4f6' : '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      color: '#1f2937',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {industry.icon} {industry.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Industry Details */}
      <div style={{ maxWidth: '1200px', margin: '64px auto', padding: '0 24px' }}>
        {/* Stats Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          <div style={{ backgroundColor: '#fee2e2', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <PhoneIcon style={{ width: '32px', height: '32px', color: '#dc2626', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{selectedIndustry.stats.missedCalls}</div>
            <div style={{ fontSize: '14px', color: '#7f1d1d', marginTop: '4px' }}>Missed Calls</div>
          </div>

          <div style={{ backgroundColor: '#fef3c7', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <CurrencyDollarIcon style={{ width: '32px', height: '32px', color: '#d97706', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>{selectedIndustry.stats.lostRevenue}</div>
            <div style={{ fontSize: '14px', color: '#78350f', marginTop: '4px' }}>Lost Revenue/Year</div>
          </div>

          <div style={{ backgroundColor: '#dbeafe', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <ClockIcon style={{ width: '32px', height: '32px', color: '#2563eb', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>{selectedIndustry.stats.afterHours}</div>
            <div style={{ fontSize: '14px', color: '#1e3a8a', marginTop: '4px' }}>After-Hours Calls</div>
          </div>

          <div style={{ backgroundColor: '#d1fae5', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <UserGroupIcon style={{ width: '32px', height: '32px', color: '#059669', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{selectedIndustry.conversionRate}</div>
            <div style={{ fontSize: '14px', color: '#064e3b', marginTop: '4px' }}>Conversion Rate</div>
          </div>
        </div>

        {/* Pain Points & Solutions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          {/* Pain Points */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '2px solid #fee2e2' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '24px' }}>
              😫 Your Pain Points
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedIndustry.painPoints.map((point, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ fontSize: '20px', flexShrink: 0 }}>❌</div>
                  <p style={{ color: '#7f1d1d', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '2px solid #d1fae5' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '24px' }}>
              ✅ How Maya Solves It
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedIndustry.solutions.map((solution, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircleIcon style={{ width: '24px', height: '24px', color: '#059669', flexShrink: 0 }} />
                  <p style={{ color: '#064e3b', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROI Banner */}
        <div style={{ background: 'linear-gradient(to right, #059669, #10b981)', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#ffffff' }}>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
            Expected ROI: {selectedIndustry.roi}
          </h3>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', color: '#ffffff' }}>
            Average transaction: {selectedIndustry.avgTransaction} | Conversion rate: {selectedIndustry.conversionRate}
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              backgroundColor: '#ffffff',
              color: '#2563eb',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Get Started for {selectedIndustry.name}
            <ArrowRightIcon style={{ width: '20px', height: '20px' }} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: '#ffffff', padding: '48px 24px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', opacity: 0.8, color: '#ffffff' }}>
            © 2024 VoiceFly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
