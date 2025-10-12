'use client'

import Link from 'next/link'
import { Phone, Car, TrendingUp, Users, BarChart3, MessageSquare, Check, ArrowRight, Star, Zap } from 'lucide-react'

export default function AutomotiveIndustryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
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
            <Link href="/enterprise" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Book Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🚗 Automotive Solutions - Built for Auto Dealers
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Sell More Cars with <span className="text-blue-600">AI-Powered</span> Lead Follow-Up
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Your AI sales team calls, qualifies, and schedules test drives 24/7—while you focus on closing deals. Turn cold leads into hot prospects automatically.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/enterprise?industry=automotive" className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="#roi" className="inline-flex items-center px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-lg transition-all">
                See ROI Calculator
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">✓ Custom proposal in 24 hours · ✓ White-glove setup · ✓ Guaranteed results</p>
          </div>

          {/* Trust Signals */}
          <div className="flex justify-center items-center gap-8 flex-wrap text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">180+</div>
              <div className="text-gray-600">Dealerships</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">$177K</div>
              <div className="text-gray-600">Avg Annual Profit Increase</div>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <div className="text-3xl font-bold text-gray-900">8 cars/mo</div>
              <div className="text-gray-600">Avg Additional Sales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Problems Costing You Sales Every Day</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Leads Go Cold in Hours</h3>
              <p className="text-gray-600">78% of car buyers go with the dealer who responds first. Your team can't call 100 leads in 5 minutes. AI can.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Inconsistent Follow-Up</h3>
              <p className="text-gray-600">80% of leads need 5+ touchpoints to buy. Sales reps give up after 2 calls. AI never quits.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Old Leads Sitting in CRM</h3>
              <p className="text-gray-600">Average dealer has 500+ uncontacted leads worth $150K in potential sales. Reactivate them with AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How VoiceFly Drives Sales</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Your AI sales team working 24/7</p>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Lead Comes In</h3>
              <p className="text-gray-600 text-sm">Website, Facebook, AutoTrader - wherever</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">AI Calls in 60 Seconds</h3>
              <p className="text-gray-600 text-sm">Natural conversation, qualifies interest</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Books Test Drive</h3>
              <p className="text-gray-600 text-sm">Schedules appointment, sends confirmation</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">✓</div>
              <h3 className="font-bold text-lg mb-2">You Close the Deal</h3>
              <p className="text-gray-600 text-sm">Walk onto lot with pre-qualified buyer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Auto Dealer Pro Platform</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Phone,
                title: 'Outbound AI Dialer',
                desc: 'Calls 100 leads per hour. Qualifies interest. Books test drives. Warm transfers to sales when ready to buy.'
              },
              {
                icon: Car,
                title: 'Inventory Integration',
                desc: 'Syncs with DealerSocket, vAuto. AI knows every vehicle. Answers pricing, features, availability questions.'
              },
              {
                icon: MessageSquare,
                title: 'Multi-Channel Follow-Up',
                desc: 'Calls, texts, emails automatically. Drip campaigns for cold leads. Re-engagement for old prospects.'
              },
              {
                icon: BarChart3,
                title: 'Lead Scoring & Prioritization',
                desc: 'AI identifies hot leads. Alerts your team instantly. Focuses effort on buyers ready to purchase.'
              },
              {
                icon: TrendingUp,
                title: 'Custom Pricing Tools',
                desc: 'Trade-in estimator. Financing calculator. Market price comparison. Builds trust with transparency.'
              },
              {
                icon: Zap,
                title: 'CRM Integration',
                desc: 'Logs every interaction automatically. Updates deal stages. Syncs with your existing dealership CRM.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-blue-600" />
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

      {/* ROI Section */}
      <section id="roi" className="py-16 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Real ROI for Auto Dealers</h2>
          <p className="text-xl text-center mb-12 text-blue-100">Actual results from a 50-car/month dealership</p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Lead Sources</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>SEO (VoiceFly managed)</span>
                  <span className="font-bold">20 leads/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Ads (Facebook + Google)</span>
                  <span className="font-bold">60 leads/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Old leads reactivated</span>
                  <span className="font-bold">20 leads/mo</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between text-lg font-bold">
                  <span>Total Monthly Leads</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Conversion & Revenue</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Conversion rate</span>
                  <span className="font-bold">8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cars sold from VoiceFly</span>
                  <span className="font-bold">8 cars/mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Average profit per sale</span>
                  <span className="font-bold">$3,000</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between text-lg font-bold">
                  <span>Monthly Revenue</span>
                  <span>$24,000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white text-gray-900 rounded-2xl p-8 text-center">
            <div className="text-sm text-gray-600 mb-2">Monthly VoiceFly Cost</div>
            <div className="text-2xl font-bold mb-1">$9,247</div>
            <div className="text-sm text-gray-600 mb-4">(Platform $648 + SEO $2,500 + Ads $3,000 + Ad Spend $3,000 + Website hosting $99)</div>

            <div className="border-t-2 border-gray-200 my-6" />

            <div className="text-sm text-gray-600 mb-2">Net Monthly Profit</div>
            <div className="text-5xl font-bold text-blue-600 mb-2">$14,753</div>
            <div className="text-gray-600">ROI: 2.6x your investment</div>

            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">$177,036</div>
              <div className="text-gray-700 font-medium">Additional annual profit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-blue-500 text-blue-500" />
              ))}
            </div>
            <blockquote className="text-2xl font-medium text-gray-900 mb-6">
              "We were skeptical, but VoiceFly completely changed our business. The AI calls leads faster than my BDC team ever could. We're selling 8-10 extra cars per month just from better follow-up. Best investment we've made."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-2xl">
                👨
              </div>
              <div>
                <div className="font-bold text-lg">Mike Thompson</div>
                <div className="text-gray-600">General Manager</div>
                <div className="text-sm text-gray-500">Thompson Auto Group, Phoenix AZ</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">10</div>
                <div className="text-sm text-gray-600">Extra cars/month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">$30K</div>
                <div className="text-sm text-gray-600">Added profit/month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">3x</div>
                <div className="text-sm text-gray-600">ROI in 90 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Auto Dealer Pro Package</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Complete done-for-you solution</p>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-blue-600">
            <div className="text-center mb-8">
              <div className="text-sm text-gray-600 mb-2">Starting at</div>
              <div className="text-5xl font-bold text-gray-900 mb-2">$6,500<span className="text-2xl text-gray-600">/month</span></div>
              <div className="text-gray-600">+ $10,000 one-time website development</div>
              <div className="inline-block mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                💼 Enterprise Package
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-bold mb-3">Platform & Services</h3>
                <div className="space-y-2">
                  {[
                    'Auto Dealer Pro Snapshot ($349/mo)',
                    'SEO Management ($2,500/mo)',
                    'Lead Gen Service ($3,000/mo)',
                    'Custom Website with tools',
                    'White-glove onboarding'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-3">Features Included</h3>
                <div className="space-y-2">
                  {[
                    'AI outbound calling',
                    'Inventory integration',
                    'Financing calculator',
                    'Trade-in estimator',
                    'CRM integration'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/enterprise?industry=automotive" className="block w-full text-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all">
              Schedule Custom Proposal
            </Link>
            <p className="text-center text-sm text-gray-500 mt-4">Custom proposal in 24 hours · ROI guarantee · Annual contracts</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Sell More Cars?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 180+ dealerships using VoiceFly to dominate their market
          </p>
          <Link href="/enterprise?industry=automotive" className="inline-flex items-center px-10 py-5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all">
            Get Your Custom Proposal
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
          <p className="text-sm text-blue-100 mt-6">No obligation · Custom ROI analysis · Implementation roadmap included</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-white text-xl font-bold mb-4">🎙️ VoiceFly</div>
              <p className="text-sm">AI-powered sales automation for auto dealers.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/industries/automotive" className="hover:text-white">For Auto Dealers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/testimonials" className="hover:text-white">Case Studies</Link></li>
                <li><Link href="/enterprise" className="hover:text-white">Enterprise</Link></li>
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
