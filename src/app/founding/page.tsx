"use client"

import Link from 'next/link'
import {
  Phone,
  Mic,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  Shield,
  MessageSquare,
} from 'lucide-react'

export default function FoundingPage() {
  const plans = [
    {
      name: 'Starter',
      regularPrice: 49,
      foundingPrice: 25,
      discount: '50% off',
      features: [
        '60 AI voice minutes/month',
        '1 AI employee',
        '1 phone number',
        '24/7 call answering',
        'Appointment booking',
        'Lead capture',
        'SMS confirmations',
        'Call analytics dashboard',
        'Email support',
      ],
    },
    {
      name: 'Growth',
      regularPrice: 129,
      foundingPrice: 90,
      discount: '30% off',
      popular: true,
      features: [
        '250 AI voice minutes/month',
        '3 AI employees',
        '3 phone numbers',
        '24/7 call answering',
        'Appointment booking',
        'Custom greeting & FAQ',
        'Custom call routing',
        'Advanced analytics',
        'Chat support',
      ],
    },
    {
      name: 'Pro',
      regularPrice: 249,
      foundingPrice: 175,
      discount: '30% off',
      features: [
        '750 AI voice minutes/month',
        '5 AI employees',
        '5 phone numbers',
        'Fully custom AI agent',
        'AI SMS conversations',
        'Custom voice selection',
        'API access & CRM integration',
        'Advanced analytics',
        'Priority support',
      ],
    },
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Locked-In Rate Forever',
      description:
        'Your founding price never increases. As long as you stay subscribed, you keep your discount for life.',
    },
    {
      icon: Star,
      title: 'Priority Access',
      description:
        'Get early access to new features, integrations, and AI capabilities before anyone else.',
    },
    {
      icon: MessageSquare,
      title: 'Direct Feedback Line',
      description:
        'Shape the product. Your input goes directly to our engineering team to build what matters to you.',
    },
    {
      icon: Clock,
      title: 'Limited Availability',
      description:
        'We only accept a small number of founding partners per industry to ensure quality and attention.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">VoiceFly</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4 mr-2" />
            Limited spots available
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Founding Customer Program
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Lock in up to <span className="font-bold text-amber-700">50% off for life</span> as one
            of our earliest partners. Your price never goes up.
          </p>
          <p className="text-gray-500">
            In exchange, we ask for honest feedback and permission to feature your success story.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What You Get as a Founding Customer
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Founding Pricing Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Founding Rates</h2>
            <p className="text-lg text-gray-600">
              These prices are locked for life. Regular pricing shown for comparison.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.popular ? 'border-amber-400 md:scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                    <div className="mb-2">
                      <span className="text-lg text-gray-400 line-through">
                        ${plan.regularPrice}/mo
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${plan.foundingPrice}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <div className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                      {plan.discount} forever
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors block text-center ${
                      plan.popular
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Apply for Founding Rate
                  </Link>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    14-day trial included - No credit card needed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Ask */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            What We Ask In Return
          </h2>
          <div className="space-y-4">
            {[
              'Honest feedback on your experience (quick monthly check-in)',
              'Permission to use your business as a case study (with your approval)',
              'A testimonial or review if you love the product',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start bg-blue-50 border border-blue-100 rounded-lg p-4"
              >
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Founding Program FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How long does the founding rate last?',
                a: 'Forever. As long as you maintain an active subscription, your rate never changes. Even if our prices double, yours stays the same.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes. If you switch between founding tiers, you keep the founding discount on whichever tier you choose.',
              },
              {
                q: 'What happens if I cancel and come back?',
                a: 'If you cancel your subscription, the founding rate is forfeited. You would re-subscribe at the current regular price.',
              },
              {
                q: 'How many founding spots are available?',
                a: 'We limit the number of founding partners to ensure we can provide dedicated attention and incorporate feedback effectively. Apply now to secure your spot.',
              },
              {
                q: 'Is the 14-day trial still included?',
                a: 'Absolutely. You get the same 14-day free trial as everyone else. No credit card required to start.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-10 w-10 text-white mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Don&apos;t Miss Your Founding Rate
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your 14-day trial today. Lock in up to 50% off for life.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center bg-white text-amber-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <div className="flex items-center justify-center space-x-6 text-white/80 text-sm mt-6">
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              14-day free trial
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              No credit card needed
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Locked-in rate for life
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Phone className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold">VoiceFly</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI receptionist for appointment-based businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/beauty" className="hover:text-white">
                    For Salons & Spas
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white">
                    Start Trial
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/login" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="mailto:hello@voiceflyai.com" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm text-center">
              &copy; 2026 VoiceFly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
