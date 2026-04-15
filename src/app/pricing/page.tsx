"use client"

import { useState } from 'react'
import { CheckCircle, X, ArrowRight, Phone } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'For businesses getting started with AI',
      monthlyPrice: 49,
      yearlyPrice: 39,
      yearlySavings: 120,
      features: [
        '60 AI voice minutes/month',
        '1 AI employee',
        '1 phone number',
        '24/7 call answering',
        'Appointment booking',
        'Lead capture',
        'Call analytics dashboard',
        'Email support',
      ],
      limitations: ['Custom greeting', 'Custom call routing', 'SMS notifications (add-on)', 'CRM integration'],
      popular: false,
      overage: '$0.25/additional minute',
    },
    {
      id: 'growth',
      name: 'Growth',
      subtitle: 'For growing businesses that need more',
      monthlyPrice: 129,
      yearlyPrice: 103,
      yearlySavings: 312,
      features: [
        '250 AI voice minutes/month',
        '3 AI employees',
        '3 phone numbers',
        '24/7 call answering',
        'Appointment booking',
        'Lead capture',
        'Custom greeting',
        'Custom FAQ answers',
        'Custom call routing',
        'Advanced analytics',
        'Chat support',
      ],
      limitations: ['SMS conversations (add-on)', 'Custom voice selection', 'API access'],
      popular: true,
      overage: '$0.20/additional minute',
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: 'For busy businesses ready to scale',
      monthlyPrice: 249,
      yearlyPrice: 199,
      yearlySavings: 600,
      features: [
        '750 AI voice minutes/month',
        '5 AI employees',
        '5 phone numbers',
        '24/7 call answering',
        'Fully custom AI agent (dedicated)',
        'Custom voice selection',
        'Custom call scripts',
        'API access',
        'CRM integration',
        'Advanced analytics',
        'Priority support',
      ],
      limitations: ['SMS conversations (add-on)'],
      popular: false,
      overage: '$0.18/additional minute',
    },
  ]

  const faq = [
    { question: "Can I change plans at any time?", answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences." },
    { question: "What happens if I exceed my monthly minutes?", answer: "We'll notify you when you reach 80% of your minute allocation. Overage minutes are billed at your plan's rate. You can also add minute packs to avoid overages." },
    { question: "How does the 14-day trial work?", answer: "Your trial includes full access to your plan's features. No credit card required at signup. If you love it, add payment details before day 14 to continue." },
    { question: "How quickly can I get set up?", answer: "Most businesses are up and running in under 10 minutes. Choose your AI voice, set your greeting, and your phone employee starts answering calls immediately." },
    { question: "Will clients know they're talking to AI?", answer: "Our AI voices sound natural and conversational. Many clients won't notice the difference. The AI handles bookings, answers questions, and takes messages just like a human." },
    { question: "Can I cancel anytime?", answer: "Yes, cancel your subscription at any time. No cancellation fees. You'll retain access until the end of your billing period." },
    { question: "Is SMS included?", answer: "Voice calling is included in every plan and works on day one. SMS (appointment reminders and text replies from your AI) is available as an add-on after your business is A2P 10DLC registered with US carriers. Registration takes 2–3 weeks and we handle it for you. Reach out to enable SMS for your account." },
  ]

  const getPrice = (plan: typeof plans[0]) => billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-inter)]">
      {/* Navigation */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="h-6 w-6 text-brand-primary" />
              <span className="text-xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">Login</Link>
              <Link href="/signup" className="bg-brand-primary text-brand-on px-4 py-2 rounded-md text-sm font-medium hover:bg-[#0060d0] transition-colors">
                Try It Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Header */}
      <section className="pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
            Predictable pricing for growing teams.
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Forward your calls to AI. Keep your number. Free for 14 days.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center">
            <span className={`mr-3 text-sm ${billingPeriod === 'monthly' ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 bg-surface-high rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                billingPeriod === 'yearly' ? 'transform translate-x-6 bg-brand-primary' : 'bg-text-muted'
              }`} />
            </button>
            <span className={`ml-3 text-sm ${billingPeriod === 'yearly' ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>Yearly</span>
            {billingPeriod === 'yearly' && (
              <span className="ml-2 bg-brand-primary/10 text-brand-light text-xs font-semibold px-2 py-1 rounded">Save 20%</span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-surface-low hover:bg-surface-med rounded-xl p-8 transition-all duration-300 ${
                  plan.popular ? 'ring-1 ring-brand-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-primary text-brand-on px-4 py-1.5 rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-sm uppercase tracking-wider mb-2 ${plan.popular ? 'text-brand-light' : 'text-text-muted'}`}>{plan.name}</div>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">${getPrice(plan)}</span>
                    <span className="text-text-muted ml-2">/mo</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-xs text-brand-light font-medium mb-2">Save ${plan.yearlySavings}/year</div>
                  )}
                  <p className="text-text-secondary text-sm">{plan.subtitle}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start text-sm text-text-secondary">
                      <CheckCircle className="h-4 w-4 text-brand-primary mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.limitations.map(limitation => (
                    <li key={limitation} className="flex items-start text-sm text-text-muted/50">
                      <X className="h-4 w-4 text-text-muted/30 mr-2 mt-0.5 flex-shrink-0" />
                      {limitation}
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

                <div className="mt-4 text-center">
                  <p className="text-xs text-text-muted">Additional minutes: {plan.overage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-16 bg-surface-low">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-6">
            How much revenue are you losing to missed calls?
          </h2>
          <div className="bg-surface-med rounded-xl p-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-[#ffb4ab] font-[family-name:var(--font-manrope)]">5</div>
                <div className="text-sm text-text-muted">missed calls/week</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">x $80</div>
                <div className="text-sm text-text-muted">avg service value</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-brand-primary font-[family-name:var(--font-manrope)]">$1,600/mo</div>
                <div className="text-sm text-text-muted">revenue recovered</div>
              </div>
            </div>
            <p className="text-text-secondary mt-4 text-sm">
              VoiceFly pays for itself by capturing just 1 extra booking per week.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faq.map(item => (
              <div key={item.question} className="bg-surface-low hover:bg-surface-med rounded-lg p-6 transition-all">
                <h3 className="font-semibold text-text-primary mb-2">{item.question}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface-low relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
            Forward your calls. See how AI does.
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Keep your number. Set up in 2 minutes. Free for 14 days.
          </p>
          <Link href="/signup" className="inline-flex items-center bg-brand-primary hover:bg-[#0060d0] text-brand-on px-8 py-4 rounded-md text-lg font-semibold transition-all">
            Forward Your Calls to AI <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <div className="flex items-center justify-center space-x-6 text-text-muted text-sm mt-6">
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1 text-brand-primary" />Your number stays the same</span>
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1 text-brand-primary" />Live in 2 minutes</span>
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1 text-brand-primary" />Undo anytime with *73</span>
          </div>
        </div>
      </section>

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
