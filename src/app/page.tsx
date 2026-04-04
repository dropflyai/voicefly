"use client"

import Link from 'next/link'
import { Phone, PhoneCall, CheckCircle, ArrowRight, Clock, Calendar, Mic, Menu, X, MessageSquare, Brain, Zap, BarChart3, Shield, Headphones } from 'lucide-react'
import { useState, useRef } from 'react'
import AIChatbot, { AIChatbotRef } from '@/components/AIChatbot'

const DEMO_PHONE = process.env.NEXT_PUBLIC_DEMO_PHONE || '+14248887754'
const DEMO_PHONE_DISPLAY = DEMO_PHONE.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')

const JORDAN_PHONE = '+19892997944'
const JORDAN_PHONE_DISPLAY = '(989) 299-7944'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const chatbotRef = useRef<AIChatbotRef>(null)

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
              Automate your phone lines with AI agents that answer calls, book appointments,
              take orders, and remember every customer — 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/signup"
                className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg flex items-center justify-center transition-all hover:scale-[1.02]"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all flex items-center justify-center"
              >
                See a Demo
              </Link>
            </div>

            {/* Call Jordan CTA */}
            <div className="mb-10">
              <a
                href={`tel:${JORDAN_PHONE}`}
                className="inline-flex items-center text-brand-light hover:text-brand-primary font-medium transition-colors"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Or call our AI now: {JORDAN_PHONE_DISPLAY}
              </a>
              <p className="text-text-muted text-xs mt-1">
                Available 24/7
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-text-muted text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>Live in 10 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>Starting at $49/mo</span>
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
              { icon: MessageSquare, title: 'SMS Follow-ups', desc: 'Automatic confirmation texts, appointment reminders, and post-call follow-ups.' },
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
                VoiceFly starts at $49/mo with 60 minutes included. That&apos;s a 32x return if it captures just 1 extra booking per week.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-3 rounded-md font-semibold transition-all"
              >
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
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
              Live in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up & Choose Your Voice', desc: 'Pick from natural-sounding AI voices. Set your business greeting and hours.' },
              { step: '2', title: 'Tell It About Your Business', desc: 'Add your services, prices, and availability. The AI learns your business in minutes.' },
              { step: '3', title: 'Forward Your Calls', desc: 'Forward calls to your VoiceFly number. Your AI phone employee handles the rest.' },
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

          <div className="grid md:grid-cols-2 gap-2 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300">
              <div className="text-text-muted text-sm uppercase tracking-wider mb-2">Starter</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$49</span>
                <span className="text-text-muted ml-2">/mo</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">Perfect for solo operators and small shops.</p>
              <ul className="space-y-3 mb-8">
                {['60 minutes included', '1 AI phone employee', 'Google Calendar sync', 'SMS confirmations', 'Call transcripts', 'Business hours routing'].map(f => (
                  <li key={f} className="flex items-start text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center bg-surface-high hover:bg-surface-highest text-text-primary px-6 py-3 rounded-md font-medium transition-all">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300 relative">
              <div className="absolute top-4 right-4 bg-brand-primary text-brand-on text-xs font-semibold px-3 py-1 rounded-full">Popular</div>
              <div className="text-brand-light text-sm uppercase tracking-wider mb-2">Pro</div>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">$199</span>
                <span className="text-text-muted ml-2">/mo</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">For growing businesses with multiple needs.</p>
              <ul className="space-y-3 mb-8">
                {['300 minutes included', 'Unlimited AI employees', 'All integrations (Calendar, CRM, Square)', 'SMS reminders & follow-ups', 'Customer memory & history', 'Priority support', 'Custom voice & personality'].map(f => (
                  <li key={f} className="flex items-start text-sm text-text-secondary">
                    <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=pro" className="block text-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-6 py-3 rounded-md font-medium transition-all">
                Get Started
              </Link>
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
              { href: '/solutions', icon: '💇', title: 'Salons & Spas', desc: 'Never miss a booking while you\'re with a client.' },
              { href: '/solutions', icon: '🦷', title: 'Dental Practices', desc: 'Handle scheduling, insurance, and new patient inquiries.' },
              { href: '/solutions', icon: '🏠', title: 'Home Services', desc: 'Capture leads while you\'re on the job site.' },
              { href: '/solutions', icon: '⚖️', title: 'Law Firms', desc: 'Screen potential clients and schedule consultations.' },
              { href: '/solutions', icon: '🏥', title: 'Medical & Wellness', desc: 'Manage patient scheduling and reduce front desk workload.' },
              { href: '/solutions', icon: '🐾', title: 'Veterinary Clinics', desc: 'Book pet appointments and triage urgent calls.' },
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
            Ready to automate your
            <span className="text-brand-primary block mt-1">business phone lines?</span>
          </h2>
          <p className="text-xl text-text-secondary mb-10">
            Set up your AI phone employee in under 10 minutes. Free for 14 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg transition-all hover:scale-[1.02]"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all"
            >
              See Pricing
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-text-muted text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              <span>Cancel anytime</span>
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
      <AIChatbot ref={chatbotRef} />
    </div>
  )
}
