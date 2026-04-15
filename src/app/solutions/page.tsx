'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phone, ArrowRight, CheckCircle, ChevronDown } from 'lucide-react'

type Industry = {
  id: string; name: string; icon: string; description: string
  painPoints: string[]; solutions: string[]
  stats: { missedCalls: string; lostRevenue: string; afterHours: string }
  roi: string; avgTransaction: string; conversionRate: string
}

const industries: Industry[] = [
  {
    id: 'medspa', name: 'Med Spas & Aesthetic Clinics', icon: '💆‍♀️',
    description: 'High-value aesthetic services that demand luxury customer experience',
    painPoints: [
      'Instagram leads calling after hours — going straight to competitors',
      'Front desk overwhelmed with consultation requests during peak hours',
      'Missing calls from high-value clients ($500-2000+ treatments)',
      'Can\'t qualify leads fast enough — wasting time on price shoppers',
    ],
    solutions: [
      'Answers every lead instantly — even at 11 PM',
      'Books consultations automatically while your team focuses on in-person clients',
      'Qualifies leads by asking about desired treatments, budget, timeline',
      'Available 24/7 to capture after-hours bookings when competitors are closed',
    ],
    stats: { missedCalls: '40%', lostRevenue: '$75K+/year', afterHours: '40%' },
    roi: '20-25x within 2 months', avgTransaction: '$800-2000', conversionRate: '85%',
  },
  {
    id: 'medical', name: 'Medical Practices', icon: '🩺',
    description: 'Primary care, specialists, and urgent care facilities',
    painPoints: [
      '40% of patient calls go to voicemail — they call the next doctor',
      'Front desk overwhelmed during flu season / peak hours',
      'After-hours calls going unanswered — patients go to ER instead',
      'Missing $50K+ annually in appointment revenue from unanswered calls',
    ],
    solutions: [
      'Answers 100% of calls immediately — no more voicemail',
      'Books appointments while verifying insurance in real-time',
      'Handles after-hours triage — books urgent vs routine appointments',
      'Appointment confirmations & reminders via SMS (add-on, 2-3 week A2P registration)',
    ],
    stats: { missedCalls: '40%', lostRevenue: '$50K+/year', afterHours: '35%' },
    roi: '15-20x within 3 months', avgTransaction: '$200-500', conversionRate: '80%',
  },
  {
    id: 'dental', name: 'Dental Practices', icon: '🦷',
    description: 'General dentistry, orthodontics, and dental specialists',
    painPoints: [
      'Front desk can\'t answer phones during patient care — losing new patients',
      'No-shows costing $150-300 per missed slot',
      'After-hours emergency calls going to competitors',
      'Can\'t handle lunch rush + 5 PM call spike',
    ],
    solutions: [
      'Answers every call while your team focuses on patients',
      'Automated reminders via SMS (add-on) — typically reduces no-shows 60%',
      'Handles emergency calls 24/7 — books urgent vs routine',
      'Manages high-volume periods without adding staff',
    ],
    stats: { missedCalls: '35%', lostRevenue: '$45K+/year', afterHours: '30%' },
    roi: '12-18x within 3 months', avgTransaction: '$250-600', conversionRate: '75%',
  },
  {
    id: 'legal', name: 'Law Firms', icon: '⚖️',
    description: 'Personal injury, family law, criminal defense, and business law',
    painPoints: [
      'Paralegals spending 10+ hours/week on intake calls instead of billable work',
      'Missing high-value consultations ($500-5000+) after business hours',
      'Can\'t qualify leads fast enough — wasting attorney time',
      'Potential clients calling competitors when they can\'t reach you',
    ],
    solutions: [
      'Handles intake 24/7 — collects case details before attorney review',
      'Qualifies leads automatically — case type, urgency, budget, timeline',
      'Books consultations directly on attorney calendars',
      'Sends intake forms & retainer agreements via email (SMS available as add-on)',
    ],
    stats: { missedCalls: '50%', lostRevenue: '$100K+/year', afterHours: '50%' },
    roi: '10-15x within 2 months', avgTransaction: '$1000-5000', conversionRate: '75%',
  },
  {
    id: 'home_services', name: 'Home Services', icon: '🏠',
    description: 'HVAC, plumbing, electrical, and emergency home repair',
    painPoints: [
      'Missing emergency calls at 2 AM — competitors win the job',
      'Technicians can\'t answer phone while on the job',
      'Losing $80K+ annually from unanswered emergency calls',
      'Can\'t capture seasonal spikes (AC in summer, heating in winter)',
    ],
    solutions: [
      'Answers emergencies 24/7 — books same-day service instantly',
      'Triages urgent vs routine — sends techs to high-priority calls first',
      'Collects problem details during the call for accurate diagnosis (photo/video via SMS available as add-on)',
      'Handles seasonal spikes without hiring seasonal staff',
    ],
    stats: { missedCalls: '60%', lostRevenue: '$80K+/year', afterHours: '60%' },
    roi: '15-20x within 3 months', avgTransaction: '$300-1500', conversionRate: '78%',
  },
  {
    id: 'barbershop', name: 'Salons & Barber Shops', icon: '💇‍♂️',
    description: 'Full-service salons, barber shops, and styling studios',
    painPoints: [
      'Stylists can\'t answer phone while cutting hair — losing bookings',
      'Instagram leads calling after hours — going to competitors',
      'No-shows costing $50-100 per missed appointment',
      'Missing group bookings (weddings, proms, events)',
    ],
    solutions: [
      'Answers calls while stylists focus on clients',
      'Automated reminders via SMS (add-on) — typically reduces no-shows 65%',
      'Handles group bookings — coordinates multiple stylists',
      'Captures after-hours bookings when shop is closed',
    ],
    stats: { missedCalls: '55%', lostRevenue: '$35K+/year', afterHours: '20%' },
    roi: '6-10x within 3 months', avgTransaction: '$50-150', conversionRate: '60%',
  },
  {
    id: 'veterinary', name: 'Veterinary Clinics', icon: '🐾',
    description: 'Veterinary hospitals, emergency vet, and specialty animal care',
    painPoints: [
      'Pet emergencies call after hours — owners panicking',
      'Front desk overwhelmed during vaccine season',
      'Missing appointment requests during surgery hours',
      'No way to triage urgent vs routine pet issues',
    ],
    solutions: [
      'Handles after-hours emergencies with empathy — triages urgent vs routine',
      'Books wellness visits & vaccine appointments automatically',
      'Tracks pet health schedules and flags vaccinations due (SMS reminders available as add-on)',
      'Provides 24/7 support for worried pet owners',
    ],
    stats: { missedCalls: '40%', lostRevenue: '$55K+/year', afterHours: '40%' },
    roi: '10-14x within 3 months', avgTransaction: '$150-400', conversionRate: '74%',
  },
]

export default function SolutionsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      const match = industries.find(i => i.id === hash)
      if (match) setSelectedIndustry(match)
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-inter)]">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="h-6 w-6 text-brand-primary" />
              <span className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/demo" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Demo</Link>
              <Link href="/pricing" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Pricing</Link>
              <Link href="/signup" className="bg-brand-primary text-brand-on px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0060d0] transition-colors">
                Try It Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-10 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
            Built for your industry.
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            VoiceFly is trained specifically for your business type. Select your industry to see exactly how we solve your challenges.
          </p>
        </div>
      </section>

      {/* Industry Selector */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-surface-low rounded-xl p-4">
          <label className="block text-sm font-medium text-text-muted mb-2">Select Your Industry</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 bg-surface-high rounded-lg flex justify-between items-center text-text-primary font-medium hover:bg-surface-highest transition-colors"
            >
              <span>{selectedIndustry.icon} {selectedIndustry.name}</span>
              <ChevronDown className={`h-5 w-5 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-high rounded-lg sonic-shadow max-h-80 overflow-y-auto z-20">
                {industries.map(industry => (
                  <button
                    key={industry.id}
                    onClick={() => { setSelectedIndustry(industry); setIsDropdownOpen(false) }}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                      selectedIndustry.id === industry.id
                        ? 'bg-brand-primary/10 text-brand-light'
                        : 'text-text-secondary hover:bg-surface-highest hover:text-text-primary'
                    }`}
                  >
                    {industry.icon} {industry.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: 'Missed Calls', value: selectedIndustry.stats.missedCalls, color: 'text-[#ffb4ab]' },
            { label: 'Lost Revenue/Year', value: selectedIndustry.stats.lostRevenue, color: 'text-accent' },
            { label: 'After-Hours Calls', value: selectedIndustry.stats.afterHours, color: 'text-brand-light' },
            { label: 'Conversion Rate', value: selectedIndustry.conversionRate, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-low rounded-lg p-6 text-center">
              <div className={`text-3xl font-bold font-[family-name:var(--font-manrope)] ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points & Solutions */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid md:grid-cols-2 gap-2">
          <div className="bg-surface-low rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#ffb4ab] font-[family-name:var(--font-manrope)] mb-6">Your Pain Points</h2>
            <div className="space-y-4">
              {selectedIndustry.painPoints.map((point, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[#ffb4ab] mt-0.5 flex-shrink-0">&#10005;</span>
                  <p className="text-text-secondary text-sm leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-low rounded-xl p-8">
            <h2 className="text-xl font-bold text-green-400 font-[family-name:var(--font-manrope)] mb-6">How VoiceFly Solves It</h2>
            <div className="space-y-4">
              {selectedIndustry.solutions.map((solution, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-text-secondary text-sm leading-relaxed">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROI Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-surface-med rounded-xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-brand-primary/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-3">
              Expected ROI: {selectedIndustry.roi}
            </h3>
            <p className="text-text-secondary mb-8">
              Average transaction: {selectedIndustry.avgTransaction} | Conversion rate: {selectedIndustry.conversionRate}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg transition-all"
            >
              Forward Your Calls — {selectedIndustry.name} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-lowest py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Phone className="h-6 w-6 text-brand-primary mr-2" />
                <span className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
              </div>
              <p className="text-text-muted text-sm">AI phone employees for appointment-based businesses</p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Product</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link href="/solutions" className="hover:text-text-primary transition-colors">Solutions</Link></li>
                <li><Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-text-primary transition-colors">Demo</Link></li>
                <li><Link href="/signup" className="hover:text-text-primary transition-colors">Start Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Company</h4>
              <ul className="space-y-2 text-text-muted text-sm">
                <li><Link href="/login" className="hover:text-text-primary transition-colors">Sign In</Link></li>
                <li><Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link></li>
                <li><Link href="mailto:tony@dropfly.io" className="hover:text-text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgba(65,71,84,0.15)] pt-8">
            <p className="text-text-muted text-sm text-center">&copy; 2026 VoiceFly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
