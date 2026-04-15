"use client"

import Link from 'next/link'
import {
  Phone,
  CheckCircle,
  ArrowRight,
  Clock,
  Calendar,
  Mic,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Star,
  PhoneCall
} from 'lucide-react'
import { useState } from 'react'

const JORDAN_PHONE = '+19892997944'
const JORDAN_PHONE_DISPLAY = '(989) 299-7944'

export default function BeautyLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-inter)]">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Phone className="h-6 w-6 md:h-7 md:w-7 text-brand-primary mr-2" />
              <span className="text-xl md:text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">VoiceFly</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Home</Link>
              <Link href="/beauty" className="text-brand-light text-sm font-medium">For Salons</Link>
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
              <Link href="/" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/beauty" className="block px-4 py-3 text-brand-light font-medium rounded-lg" onClick={() => setMobileMenuOpen(false)}>For Salons</Link>
              <Link href="/demo" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
              <Link href="/pricing" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/login" className="block px-4 py-3 text-text-secondary font-medium rounded-lg hover:bg-surface-high" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/signup" className="block bg-brand-primary text-brand-on px-4 py-3 rounded-lg font-medium text-center mt-2" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-28 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-surface-high text-brand-light px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Mic className="h-4 w-4 mr-2" />
              Built for Salons, Spas & Beauty Professionals
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight leading-[1.1] mb-6">
              AI Receptionist That
              <span className="text-brand-primary block mt-1">Keeps Your Chair Full</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Forward your salon phone to AI that answers every call, books appointments, and sends
              reminders — so you can focus on the client in your chair. Your number stays the same.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/demo"
                className="bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md font-semibold text-lg flex items-center justify-center transition-all hover:scale-[1.02]"
              >
                <Mic className="mr-2 h-5 w-5" /> Hear Our Salon AI
              </Link>
              <Link
                href="/signup"
                className="border border-[rgba(65,71,84,0.3)] text-text-secondary hover:text-text-primary hover:bg-surface-high px-8 py-4 rounded-md font-semibold text-lg transition-all flex items-center justify-center"
              >
                Forward Your Calls to AI <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

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

            <div className="flex flex-wrap items-center justify-center gap-6 text-text-muted text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
                <span>Keep your salon number</span>
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

      {/* The Problem */}
      <section className="py-24 bg-surface-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Every Missed Call Is a Lost Client
            </h2>
            <p className="text-lg text-text-secondary">
              Here&apos;s what happens when you can&apos;t answer the phone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {[
              { emoji: '✂️', title: "You're With a Client", desc: "The phone rings while you're mid-color or mid-cut. You can't stop what you're doing. The call goes to voicemail. That potential client calls the next salon." },
              { emoji: '📅', title: 'Booking Is a Back-and-Forth', desc: "Clients leave voicemails, you call back, they're busy, they call back. Booking one appointment takes half a day of phone tag — if you catch them at all." },
              { emoji: '🌙', title: 'Closed After 7pm', desc: "Most people browse and want to book in the evening. If your phone isn't answered, they book with someone whose is — or they forget entirely." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-surface-med p-8 rounded-lg text-center">
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-3">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-low rounded-xl p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-8 text-center">
              How Much Revenue Are You Losing?
            </h2>

            <div className="grid md:grid-cols-3 gap-2 mb-8">
              <div className="bg-surface-med rounded-lg p-6 text-center">
                <div className="text-text-muted text-sm mb-2">Missed calls per week</div>
                <div className="text-4xl font-bold text-[#ffb4ab] font-[family-name:var(--font-manrope)]">5</div>
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
                VoiceFly starts at just $49/mo. It pays for itself by capturing just 1 extra booking per week.
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
              Up and Running in Under 10 Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: Mic, title: 'Choose Your Voice', desc: "Pick a natural-sounding AI voice that fits your salon's vibe." },
              { step: '2', icon: MessageSquare, title: 'Add Your Info', desc: 'Services, prices, hours, stylists — your AI learns it all in minutes.' },
              { step: '3', icon: Phone, title: 'Forward Calls', desc: 'Forward your salon phone to your VoiceFly number. Done.' },
              { step: '4', icon: Calendar, title: 'Appointments Roll In', desc: 'Your AI books clients, answers questions, and sends you updates.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-brand-primary text-brand-on rounded-full flex items-center justify-center mx-auto mb-5 text-xl font-bold font-[family-name:var(--font-manrope)]">{step}</div>
                <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-2">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Your AI Receptionist Does */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              What Your AI Receptionist Handles
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-2 max-w-4xl mx-auto">
            {[
              { icon: Phone, title: 'Answers Every Call', quote: "Thanks for calling Bella Salon! I'd love to help you book an appointment. Are you looking for a haircut, color, or something else today?" },
              { icon: Calendar, title: 'Books Appointments', quote: "Let me check availability for a balayage with Sarah... I have openings on Tuesday at 2pm or Thursday at 10am. Which works better?" },
              { icon: Star, title: 'Answers Service Questions', quote: "Our gel manicure is $45 and takes about 45 minutes. We also offer nail art starting at $10 per nail. Would you like to book?" },
              { icon: Clock, title: 'Handles After-Hours', quote: "We're currently closed but I can book your appointment right now! We open at 9am Tuesday through Saturday. What day works for you?" },
            ].map(({ icon: Icon, title, quote }) => (
              <div key={title} className="bg-surface-low hover:bg-surface-med p-8 rounded-lg transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-brand-light group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-2">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview — 3 tiers matching /pricing */}
      <section className="py-24 bg-surface-low">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-text-secondary">
              No contracts. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-2 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter', price: 49, desc: 'For salons getting started',
                features: ['60 AI voice minutes/month', '100 SMS segments/month', '1 AI receptionist', '1 phone number', 'Appointment booking', 'A2P registration handled for you'],
                popular: false, overage: '$0.25/min · $0.04/SMS over 100',
              },
              {
                name: 'Growth', price: 129, desc: 'For growing salons that need more',
                features: ['250 AI voice minutes/month', '400 SMS segments/month', '3 AI receptionists', '3 phone numbers', 'Custom greeting & FAQ', 'Custom call routing', 'Advanced analytics'],
                popular: true, overage: '$0.20/min · $0.04/SMS over 400',
              },
              {
                name: 'Pro', price: 249, desc: 'For busy salons ready to scale',
                features: ['750 AI voice minutes/month', '1,000 SMS segments/month', '5 AI receptionists', '5 phone numbers', 'Fully custom AI agent', 'Custom voice selection', 'CRM integration', 'Priority support'],
                popular: false, overage: '$0.18/min · $0.03/SMS over 1,000',
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`relative bg-surface-med hover:bg-surface-high rounded-xl p-8 transition-all duration-300 ${
                  plan.popular ? 'ring-1 ring-brand-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-primary text-brand-on px-4 py-1.5 rounded-full text-xs font-semibold">MOST POPULAR</span>
                  </div>
                )}
                <div className={`text-sm uppercase tracking-wider mb-2 ${plan.popular ? 'text-brand-light' : 'text-text-muted'}`}>{plan.name}</div>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">${plan.price}</span>
                  <span className="text-text-muted ml-2">/mo</span>
                </div>
                <p className="text-text-secondary text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start text-sm text-text-secondary">
                      <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`w-full py-3 px-6 rounded-md font-semibold transition-all block text-center text-sm ${
                    plan.popular
                      ? 'bg-brand-primary text-brand-on hover:bg-[#0060d0]'
                      : 'bg-surface-high text-text-primary hover:bg-surface-highest'
                  }`}
                >
                  Try It Free for 14 Days
                </Link>
                <p className="text-xs text-text-muted text-center mt-3">{plan.overage}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-brand-light hover:text-brand-primary font-medium transition-colors">
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Founding Offer */}
      <section className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-8 w-8 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-3">
            Founding Salon Partner Program
          </h2>
          <p className="text-text-secondary mb-2">
            Be one of our first salon partners and get <span className="font-bold text-text-primary">50% off for life</span>.
          </p>
          <p className="text-text-muted text-sm mb-6">
            Starter at $25/mo, Growth at $65/mo, or Pro at $125/mo — forever. In exchange, we ask for honest feedback
            and permission to share your story.
          </p>
          <Link
            href="/founding"
            className="inline-flex items-center bg-accent hover:bg-accent/90 text-surface px-8 py-3 rounded-md font-semibold transition-all"
          >
            Apply for Founding Rate <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-surface-low relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-6 leading-tight">
            Your next client is calling.
            <span className="text-brand-primary block mt-1">Let AI pick up.</span>
          </h2>
          <p className="text-xl text-text-secondary mb-10">
            Forward your salon phone to AI. If it doesn&apos;t book you extra appointments this week, turn it off with *73.
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
              Your number stays the same
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              Live in 2 minutes
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-brand-primary flex-shrink-0" />
              Undo anytime with *73
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
                AI receptionist for salons, spas, and beauty professionals.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary font-[family-name:var(--font-manrope)] mb-4">Product</h4>
              <ul className="space-y-3 text-text-muted text-sm">
                <li><Link href="/beauty" className="hover:text-text-primary transition-colors">For Salons & Spas</Link></li>
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
    </div>
  )
}
