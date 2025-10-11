'use client'

import Link from 'next/link'
import { Phone, Scale, Calendar, Shield, FileText, Users, Check, ArrowRight, Star, Clock } from 'lucide-react'

export default function LegalIndustryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-gray-50">
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
            <Link href="/signup" className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              ⚖️ Built for Law Firms
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Capture More <span className="text-amber-600">Qualified Leads</span> While You Focus on Cases
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Your AI intake specialist screens potential clients 24/7, qualifies cases, schedules consultations, and maintains HIPAA-compliant records—automatically.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/signup?industry=legal" className="inline-flex items-center px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#demo" className="inline-flex items-center px-8 py-4 bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg font-semibold text-lg transition-all">
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">✓ HIPAA compliant · ✓ No credit card required · ✓ Setup in 20 minutes</p>
          </div>

          {/* Trust Signals */}
          <div className="flex justify-center items-center gap-8 flex-wrap text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">890+</div>
              <div className="text-gray-600">Law Firms</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">40%</div>
              <div className="text-gray-600">More Consultations</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">$8,400/mo</div>
              <div className="text-gray-600">Avg Revenue Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Problems Costing Your Firm Revenue</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Missed Intake Calls</h3>
              <p className="text-gray-600">62% of potential clients call 3+ firms. The first to answer usually wins the case. Missing calls = losing clients to competitors.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">After-Hours Emergencies</h3>
              <p className="text-gray-600">68% of legal inquiries happen outside business hours. Your AI receptionist handles calls 24/7, even at 2 AM.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Unqualified Leads Waste Time</h3>
              <p className="text-gray-600">Stop spending billable hours on cases you can't take. AI pre-qualifies based on your criteria before scheduling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Law Firm Management Platform</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Phone,
                title: 'AI Legal Intake Specialist',
                desc: 'Answers calls with natural conversation. Asks qualifying questions. Determines case viability. Books consultations for qualified prospects only.'
              },
              {
                icon: FileText,
                title: 'Case Intake Forms',
                desc: 'Automated forms for case details. Conflict checking against existing clients. Statute of limitations tracking. Document upload portal.'
              },
              {
                icon: Calendar,
                title: 'Consultation Scheduler',
                desc: 'Books initial consultations. Syncs with attorney calendars. Sends confirmation and reminder emails. Reschedules automatically if needed.'
              },
              {
                icon: Shield,
                title: 'Secure Client Portal',
                desc: 'HIPAA-compliant document sharing. Encrypted messaging. Case status updates. E-signature collection.'
              },
              {
                icon: Scale,
                title: 'Practice Area Specialization',
                desc: 'Customized intake for your practice areas: Personal Injury, Family Law, Criminal Defense, Estate Planning, Business Law, etc.'
              },
              {
                icon: Users,
                title: 'Multi-Attorney Management',
                desc: 'Route cases by practice area. Manage multiple calendars. Track referrals. Monitor attorney performance.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-amber-600" />
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
      <section className="py-16 px-4 bg-gradient-to-br from-amber-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">ROI for Law Firms</h2>
          <p className="text-xl mb-8 text-amber-100">Based on solo practitioner or small firm (1-5 attorneys)</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">30</div>
              <div className="text-amber-100">Missed calls recovered</div>
              <div className="text-sm mt-2">= 6 extra consultations/month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">40%</div>
              <div className="text-amber-100">Consultation conversion</div>
              <div className="text-sm mt-2">= 2.4 new clients/month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">$3,500</div>
              <div className="text-amber-100">Avg case value</div>
              <div className="text-sm mt-2">Varies by practice area</div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8">
            <div className="text-sm text-amber-100 mb-2">Monthly Cost: $249</div>
            <div className="text-4xl font-bold mb-2">2.4 clients × $3,500 = $8,400</div>
            <div className="text-xl text-amber-100 mb-4">Additional monthly revenue</div>
            <div className="text-3xl font-bold">$8,151 net profit/month</div>
            <div className="text-amber-100">ROI: 33x your investment</div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "VoiceFly transformed my solo practice. I was missing 40% of calls while in court or with clients. Now AI handles intake 24/7, pre-qualifies cases, and books consultations. I'm taking on 3-4 more cases per month without hiring staff."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center text-2xl">
                👨‍⚖️
              </div>
              <div>
                <div className="font-bold text-lg">David Chen, Esq.</div>
                <div className="text-gray-600">Solo Practitioner - Personal Injury</div>
                <div className="text-sm text-gray-500">Chen Law Office, Seattle WA</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-600">4</div>
                <div className="text-sm text-gray-600">Extra cases/month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">$14K</div>
                <div className="text-sm text-gray-600">Added revenue/month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">0</div>
                <div className="text-sm text-gray-600">Missed calls now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA Compliance */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security & Compliance</h2>
            <p className="text-xl text-gray-600">Built for legal professionals with strict confidentiality requirements</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'HIPAA compliant infrastructure',
              'End-to-end encryption for all data',
              'Secure client portal with 2FA',
              'Business Associate Agreement (BAA) included',
              'Attorney-client privilege maintained',
              'Automatic audit logs',
              'SOC 2 Type II certified',
              'GDPR & CCPA compliant'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
                <span className="font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Law Firm Snapshot</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Complete legal practice management system</p>

          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-600">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">$249<span className="text-2xl text-gray-600">/month</span></div>
              <div className="text-gray-600">+ Enterprise Core Platform ($299/month for HIPAA compliance)</div>
              <div className="text-xl font-bold text-gray-900 mt-2">Total: $548/month</div>
              <div className="inline-block mt-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
                ⚖️ HIPAA Compliant
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'AI Phone Agent (legal intake specialist)',
                'Case Intake Forms & Qualification',
                'Appointment Booking (consultation scheduler)',
                'Secure Client Portal (encrypted document sharing)',
                'Document Management System',
                'Billable Hours Tracking',
                'Trust Accounting Integration',
                'Court Calendar Sync',
                'Legal-specific CRM pipeline',
                '10+ Legal Email Templates',
                'Conflict Check Tools',
                'HIPAA Compliance & BAA'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/signup?plan=law-firm" className="block w-full text-center px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all">
              Start 14-Day Free Trial
            </Link>
            <p className="text-center text-sm text-gray-500 mt-4">HIPAA compliant · Setup in 20 minutes · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Optimized for All Practice Areas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              'Personal Injury',
              'Family Law',
              'Criminal Defense',
              'Estate Planning',
              'Business Law',
              'Immigration',
              'Real Estate',
              'Employment Law',
              'Bankruptcy'
            ].map((area, idx) => (
              <div key={idx} className="p-6 bg-white rounded-xl shadow-sm text-center">
                <Scale className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900">{area}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-amber-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Grow Your Practice?</h2>
          <p className="text-xl mb-8 text-amber-100">
            Join 890+ law firms using VoiceFly to capture more qualified cases
          </p>
          <Link href="/signup?industry=legal" className="inline-flex items-center px-10 py-5 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all">
            Start Your Free Trial Today
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
          <p className="text-sm text-amber-100 mt-6">14-day free trial · HIPAA compliant · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white text-xl font-bold mb-4">🎙️ VoiceFly</div>
              <p className="text-sm">AI-powered practice management for law firms.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/industries/legal" className="hover:text-white">For Law Firms</Link></li>
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
                <li><Link href="/hipaa" className="hover:text-white">HIPAA Compliance</Link></li>
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
