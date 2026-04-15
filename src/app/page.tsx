"use client"

import Link from 'next/link'
import { Phone, PhoneCall, CheckCircle, ArrowRight, Clock, Calendar, Mic, Menu, X, MessageSquare, Brain, Zap, BarChart3, Shield, Headphones } from 'lucide-react'
import { useState } from 'react'
import MayaChat from '@/components/MayaChat'

const DEMO_PHONE = process.env.NEXT_PUBLIC_DEMO_PHONE || '+14248887754'
const DEMO_PHONE_DISPLAY = DEMO_PHONE.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')

const JORDAN_PHONE = '+19892997944'
const JORDAN_PHONE_DISPLAY = '(989) 299-7944'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-inter)]">
      {/* Navigation — Glassmorphism */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Phone className="h-6 w-6 md:h-7 md:w-7 text-brand-primary mr-2" />
              <span className="text-xl md:text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">VoiceFly</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-brand-light text-sm font-medium">Home</Link>
              <Link href="/demo" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Demo</Link>
              <Link href="/pricing" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Pricing</Link>
              <Link href="/login" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Sign In</Link>
              <Link
                href="/signup"
                className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-5 py-2 rounded-md text-sm font-medium transition-all"
              >
                Start Free Trial
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-1 border-t border-[rgba(65,71,84,0.15)]">
              <Link href="/" className="block px-4 py-3 text-brand-light font-medium rounded-lg" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/demo" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
              <Link href="/pricing" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link
                href="/signup"
                className="block bg-brand-primary text-brand-on px-4 py-3 rounded-lg font-medium text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Free Trial
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-28 relative overflow-hidden">
        {/* Ambient glow behind hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-surface-high text-brand-light px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Mic className="h-4 w-4 mr-2" />
              The AI-Powered Voice Employee for Small Businesses
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight leading-[1.1] mb-6">
              Never Miss a
              <span className="text-brand-primary block mt-1">Client Call Again</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Forward your business calls to AI that answers 24/7, books appointments,
              and remembers every customer. Your number stays the same — set up in 2 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/demo"
                className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg flex items-center justify-center transition-all hover:scale-[1.02]"
              >
                <Mic className="mr-2 h-5 w-5" /> Hear It For Yourself
              </Link>
              <Link
                href="/signup"
                className="border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all flex items-center justify-center"
              >
                Forward Your Calls to AI <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Call Jordan CTA */}
            <div className="mb-10">
              <a
                href={`tel:${JORDAN_PHONE}`}
                className="inline-flex items-center text-brand-light hover:text-brand-primary font-medium transition-colors"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Or call our AI right now: {JORDAN_PHONE_DISPLAY}
              </a>
              <p className="text-text-muted text-xs mt-1">
                Try it — available 24/7. No signup needed.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-text-muted text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>Keep your existing number</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>Live in 2 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 bg-surface-low">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-text-muted text-sm uppercase tracking-widest mb-6">Trusted by appointment-based businesses</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-text-muted/50">
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Salons</span>
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Dental</span>
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Home Services</span>
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Medical</span>
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Legal</span>
            <span className="text-lg font-semibold font-[family-name:var(--font-manrope)] tracking-tight">Veterinary</span>
          </div>
        </div>
      </section>

      {/* Try It Yourself — Demo CTA */}
      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-low rounded-xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-brand-primary/8 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center bg-brand-primary/10 text-brand-light px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Mic className="h-4 w-4 mr-2" />
                Live AI Demo — No signup required
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-3">
                Hear it for yourself
              </h2>
              <p className="text-text-secondary mb-6 max-w-lg mx-auto">
                Talk to a VoiceFly AI employee right in your browser. Pick your industry, have a real conversation, and imagine this answering your business line 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg transition-all hover:scale-[1.02]"
                >
                  <Mic className="mr-2 h-5 w-5" /> Try the Live Demo
                </Link>
                <a
                  href={`tel:${JORDAN_PHONE}`}
                  className="inline-flex items-center justify-center border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all"
                >
                  <Phone className="mr-2 h-5 w-5" /> Call {JORDAN_PHONE_DISPLAY}
                </a>
              </div>
              <p className="text-text-muted text-xs mt-4">6 industry demos available: Dental, Salon, Auto Shop, Restaurant, Law Firm, Nonprofit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Continuous Operations — Features Grid */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Built for continuous operations.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your AI phone employees handle the work that used to require a full front desk team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {[
              { icon: Phone, title: '24/7 Call Handling', desc: 'Natural-sounding AI picks up instantly. No hold music, no voicemail, no missed opportunities.' },
              { icon: Calendar, title: 'Appointment Booking', desc: 'Checks your real availability and books clients directly into Google Calendar or Calendly.' },
              { icon: MessageSquare, title: 'SMS Follow-ups (add-on)', desc: 'Confirmation texts and appointment reminders — available once your business is A2P registered (2-3 weeks, we handle it).' },
              { icon: Brain, title: 'Customer Memory', desc: 'Remembers every caller — their name, preferences, past appointments, and conversation history.' },
              { icon: Headphones, title: 'Order Taking', desc: 'Takes orders, processes requests, and captures details with structured data collection.' },
              { icon: Zap, title: 'CRM Integration', desc: 'Connects to HubSpot, Square, and your existing tools. Data flows automatically.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300 group cursor-default">
                <div className="w-10 h-10 bg-surface-high rounded-lg flex items-center justify-center mb-5 group-hover:bg-brand-primary/10 transition-colors">
                  <Icon className="h-5 w-5 text-brand-light group-hover:text-brand-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Math Is Simple — ROI */}
      <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-low rounded-xl p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-8 text-center">The Math Is Simple</h2>

            <div className="grid md:grid-cols-3 gap-2 mb-8">
              <div className="bg-surface-med rounded-lg p-6 text-center">
                <div className="text-text-muted text-sm mb-2">Missed calls per week</div>
                <div className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">5</div>
              </div>
              <div className="bg-surface-med rounded-lg p-6 text-center">
                <div className="text-text-muted text-sm mb-2">Avg service value</div>
                <div className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$80</div>
              </div>
              <div className="bg-brand-primary/10 rounded-lg p-6 text-center">
                <div className="text-brand-light text-sm mb-2">Monthly revenue recovered</div>
                <div className="text-4xl font-bold text-brand-primary font-[family-name:var(--font-manrope)]">$1,600</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-text-secondary mb-6">
                VoiceFly starts at just $49/mo. That&apos;s a 32x return if it captures just 1 extra booking per week.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-3 rounded-md font-semibold transition-all"
              >
                Forward Your Calls to AI <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-low">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Forward your calls. That&apos;s it.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Keep your number. Keep your carrier. Your customers won&apos;t know anything changed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tell Us About Your Business', desc: 'Your services, hours, and how you want calls handled. Takes 2 minutes.' },
              { step: '2', title: 'Pick Your AI Voice', desc: 'Choose from natural-sounding voices and customize your greeting.' },
              { step: '3', title: 'Forward & Go Live', desc: 'Dial *72 + your VoiceFly number. Your AI picks up every call instantly — 24/7.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-brand-primary text-brand-on rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold font-[family-name:var(--font-manrope)]">{step}</div>
                <h3 className="text-xl font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-2">{title}</h3>
                <p className="text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Predictable Pricing */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Predictable pricing for growing teams.
            </h2>
            <p className="text-lg text-text-secondary">
              No hidden fees. No per-call charges. Just simple monthly plans.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300">
              <div className="text-text-muted text-sm uppercase tracking-wider mb-2">Starter</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$49</span>
                <span className="text-text-muted ml-2">/mo</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">For businesses getting started with AI.</p>
              <ul className="space-y-3 mb-8">
                {['60 AI voice minutes/month', '1 AI employee', '1 phone number', '24/7 call answering', 'Appointment booking', 'Lead capture', 'Call analytics dashboard'].map(f => (
                  <li key={f} className="flex items-start text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center bg-surface-high hover:bg-surface-highest text-text-primary px-6 py-3 rounded-md font-medium transition-all">
                Try It Free for 14 Days
              </Link>
              <p className="text-xs text-text-muted text-center mt-3">Additional minutes: $0.25/min</p>
            </div>

            {/* Growth */}
            <div className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300 relative ring-1 ring-brand-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-brand-primary text-brand-on px-4 py-1.5 rounded-full text-xs font-semibold">MOST POPULAR</span>
              </div>
              <div className="text-brand-light text-sm uppercase tracking-wider mb-2">Growth</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$129</span>
                <span className="text-text-muted ml-2">/mo</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">For growing businesses that need more.</p>
              <ul className="space-y-3 mb-8">
                {['250 AI voice minutes/month', '3 AI employees', '3 phone numbers', '24/7 call answering', 'Appointment booking', 'Custom greeting', 'Custom FAQ answers', 'Custom call routing', 'Advanced analytics'].map(f => (
                  <li key={f} className="flex items-start text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=growth" className="block text-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-6 py-3 rounded-md font-medium transition-all">
                Try It Free for 14 Days
              </Link>
              <p className="text-xs text-text-muted text-center mt-3">Additional minutes: $0.20/min</p>
            </div>

            {/* Pro */}
            <div className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300">
              <div className="text-text-muted text-sm uppercase tracking-wider mb-2">Pro</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$249</span>
                <span className="text-text-muted ml-2">/mo</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">For busy businesses ready to scale.</p>
              <ul className="space-y-3 mb-8">
                {['750 AI voice minutes/month', '5 AI employees', '5 phone numbers', 'Fully custom AI agent', 'Custom voice selection', 'CRM integration', 'API access', 'Priority support'].map(f => (
                  <li key={f} className="flex items-start text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=pro" className="block text-center bg-surface-high hover:bg-surface-highest text-text-primary px-6 py-3 rounded-md font-medium transition-all">
                Try It Free for 14 Days
              </Link>
              <p className="text-xs text-text-muted text-center mt-3">Additional minutes: $0.18/min</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 bg-surface-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Built for businesses that run on appointments.
            </h2>
            <p className="text-lg text-text-secondary">
              Any business that books appointments and answers phone calls can use VoiceFly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {[
              { href: '/beauty', icon: '💇', title: 'Salons & Spas', desc: 'Never miss a booking while you\'re with a client.' },
              { href: '/solutions#dental', icon: '🦷', title: 'Dental Practices', desc: 'Handle scheduling, insurance, and new patient inquiries.' },
              { href: '/solutions#home_services', icon: '🏠', title: 'Home Services', desc: 'Capture leads while you\'re on the job site.' },
              { href: '/solutions#legal', icon: '⚖️', title: 'Law Firms', desc: 'Screen potential clients and schedule consultations.' },
              { href: '/solutions#medical', icon: '🏥', title: 'Medical & Wellness', desc: 'Manage patient scheduling and reduce front desk workload.' },
              { href: '/solutions#veterinary', icon: '🐾', title: 'Veterinary Clinics', desc: 'Book pet appointments and triage urgent calls.' },
            ].map(({ href, icon, title, desc }) => (
              <Link key={title} href={href} className="group bg-surface-med hover:bg-surface-high p-6 rounded-lg transition-all duration-300">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-base font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-1 group-hover:text-brand-light transition-colors">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
                <span className="text-brand-light text-sm font-medium mt-3 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-primary/8 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-6 leading-tight">
            Forward your calls.
            <span className="text-brand-primary block mt-1">See how AI does.</span>
          </h2>
          <p className="text-xl text-text-secondary mb-10">
            Keep your number. Forward to AI. If it doesn&apos;t book you at least one extra appointment this week, turn it off with *73.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg transition-all hover:scale-[1.02] flex items-center justify-center"
            >
              <Mic className="mr-2 h-5 w-5" /> Hear It For Yourself
            </Link>
            <Link
              href="/signup"
              className="border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all"
            >
              Forward Your Calls to AI
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-text-muted text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              <span>Your number stays the same</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              <span>Live in 2 minutes</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              <span>Undo anytime with *73</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-lowest py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center mb-4">
                <Phone className="h-6 w-6 text-brand-primary mr-2" />
                <span className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                AI phone employees for appointment-based businesses. Answer every call, book every client.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Product</h4>
              <ul className="space-y-3 text-text-muted text-sm">
                <li><Link href="/solutions" className="hover:text-text-primary transition-colors">Solutions</Link></li>
                <li><Link href="/demo" className="hover:text-text-primary transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-text-primary transition-colors">Start Trial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Company</h4>
              <ul className="space-y-3 text-text-muted text-sm">
                <li><Link href="/login" className="hover:text-text-primary transition-colors">Sign In</Link></li>
                <li><Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link></li>
                <li><Link href="mailto:tony@dropfly.io" className="hover:text-text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[rgba(65,71,84,0.15)] pt-8">
            <p className="text-text-muted text-sm text-center">
              &copy; 2026 VoiceFly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <MayaChat mode="public" />
    </div>
  )
}
