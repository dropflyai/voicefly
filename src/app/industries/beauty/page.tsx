'use client'

import Link from 'next/link'
import { Phone, Calendar, MessageSquare, Users, TrendingUp, Clock, Check, ArrowRight, Star } from 'lucide-react'

export default function BeautyIndustryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center flex-wrap gap-3">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            🎙️ VoiceFly
          </Link>
          <div className="flex gap-6 items-center flex-wrap">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/solutions" className="text-gray-600 hover:text-gray-900">Solutions</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/signup" className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              💅 Built for Beauty & Spa Professionals
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Never Miss Another <span className="text-pink-600">Booking</span> Again
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Your AI receptionist answers calls 24/7, books appointments, sends reminders, and manages your salon—so you can focus on making clients beautiful.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/signup?industry=beauty" className="inline-flex items-center px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#demo" className="inline-flex items-center px-8 py-4 bg-white border-2 border-pink-600 text-pink-600 hover:bg-pink-50 rounded-lg font-semibold text-lg transition-all">
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">✓ No credit card required · ✓ 2-minute setup · ✓ Cancel anytime</p>
          </div>

          {/* Trust Signals */}
          <div className="flex justify-center items-center gap-8 flex-wrap text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">2,400+</div>
              <div className="text-gray-600">Salons & Spas</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">$1,200/mo</div>
              <div className="text-gray-600">Avg Revenue Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Problems VoiceFly Solves for Salons</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Missed Calls = Lost Money</h3>
              <p className="text-gray-600">Average salon misses 30% of calls while with clients. That's 6 lost bookings per week = $1,440/month in revenue.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No-Shows Kill Your Schedule</h3>
              <p className="text-gray-600">18% no-show rate costs the average salon $800/month. Automated reminders cut no-shows by 70%.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">After-Hours Opportunities</h3>
              <p className="text-gray-600">68% of salon calls happen outside business hours. Your AI receptionist never sleeps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything Your Salon Needs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Phone,
                title: 'AI Phone Agent',
                desc: 'Answers calls 24/7 with natural conversation. Books appointments, answers questions about services, handles cancellations.'
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                desc: 'Syncs with your calendar. Manages stylist availability. Handles walk-ins and online bookings seamlessly.'
              },
              {
                icon: MessageSquare,
                title: 'Automated Reminders',
                desc: 'SMS and email reminders reduce no-shows by 70%. Confirmation requests 24 hours before appointments.'
              },
              {
                icon: Users,
                title: 'Client Profiles',
                desc: 'Remembers preferences, past services, color formulas, allergies. "Welcome back Sarah! Same highlights as last time?"'
              },
              {
                icon: TrendingUp,
                title: 'Loyalty Rewards',
                desc: 'Points program that runs itself. Birthday specials. Referral bonuses. Automatic reward redemption.'
              },
              {
                icon: Clock,
                title: 'Waitlist Management',
                desc: 'Automatically fills cancellations from waitlist. Texts customers when their preferred stylist has an opening.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 px-4 bg-gradient-to-br from-pink-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Calculate Your ROI</h2>
          <p className="text-xl mb-8 text-pink-100">See how much revenue VoiceFly can recover for your salon</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">30%</div>
              <div className="text-pink-100">Missed calls recovered</div>
              <div className="text-sm mt-2">= 24 extra bookings/month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">70%</div>
              <div className="text-pink-100">Fewer no-shows</div>
              <div className="text-sm mt-2">= 12 slots saved/month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">$1,200</div>
              <div className="text-pink-100">Avg monthly increase</div>
              <div className="text-sm mt-2">ROI: 8x your investment</div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8">
            <div className="text-sm text-pink-100 mb-2">Monthly Cost: $149</div>
            <div className="text-4xl font-bold mb-2">$1,200 - $149 = $1,051</div>
            <div className="text-xl text-pink-100">Net profit increase per month</div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-pink-500 text-pink-500" />
              ))}
            </div>
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "VoiceFly paid for itself in the first week. We went from missing 8-10 calls a day to zero. Our bookings are up 35% and no-shows dropped from 20% to 6%."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center text-2xl">
                👩
              </div>
              <div>
                <div className="font-bold text-lg">Jessica Martinez</div>
                <div className="text-gray-600">Owner, Luxe Beauty Lounge</div>
                <div className="text-sm text-gray-500">3 locations in Miami, FL</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-pink-600">35%</div>
                <div className="text-sm text-gray-600">Booking increase</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600">70%</div>
                <div className="text-sm text-gray-600">Fewer no-shows</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600">$3,200</div>
                <div className="text-sm text-gray-600">Added revenue/mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Beauty & Spa Snapshot</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Everything you need, pre-configured for salons</p>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-pink-600">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">$149<span className="text-2xl text-gray-600">/month</span></div>
              <div className="text-gray-600">Save $127/month vs buying separately</div>
              <div className="inline-block mt-4 bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-semibold">
                ✨ Most Popular for Salons
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'AI Phone Agent (trained on beauty terminology)',
                'Appointment Booking (stylist-specific scheduling)',
                'SMS Reminders (appointment confirmations)',
                'Email Marketing (promotions, birthday specials)',
                'Client Preference Memory (services, formulas, allergies)',
                'Loyalty & Rewards Program',
                'Before/After Photo Gallery',
                'Product Retail Tracking',
                '15+ Pre-built Email Templates',
                '10+ Pre-built SMS Templates'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-pink-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/signup?plan=beauty-spa" className="block w-full text-center px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all">
              Start 14-Day Free Trial
            </Link>
            <p className="text-center text-sm text-gray-500 mt-4">No credit card required · Setup in 10 minutes</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-pink-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Stop Missing Bookings?</h2>
          <p className="text-xl mb-8 text-pink-100">
            Join 2,400+ salons using VoiceFly to capture every opportunity
          </p>
          <Link href="/signup?industry=beauty" className="inline-flex items-center px-10 py-5 bg-white text-pink-600 hover:bg-pink-50 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all">
            Start Your Free Trial Today
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
          <p className="text-sm text-pink-100 mt-6">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white text-xl font-bold mb-4">🎙️ VoiceFly</div>
              <p className="text-sm">AI-powered business automation for salons & spas.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/industries/beauty" className="hover:text-white">For Salons</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/testimonials" className="hover:text-white">Testimonials</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2025 VoiceFly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
