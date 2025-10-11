'use client'

import Link from 'next/link'
import { Check, X, ArrowRight, Star } from 'lucide-react'

export default function VoiceFlyVsGoHighLevel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center flex-wrap gap-3">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            🎙️ VoiceFly
          </Link>
          <div className="flex gap-6 items-center flex-wrap">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Try VoiceFly Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            VoiceFly vs GoHighLevel
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Both are powerful platforms. Here's an honest comparison to help you choose the right fit.
          </p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-12 px-4 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-600">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">🎙️ VoiceFly</div>
                <div className="text-sm text-gray-600">Best for: Voice-first automation + Done-for-you services</div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">True AI voice conversations (not just chatbots)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Hybrid SaaS + Agency model</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">50-70% cheaper than GoHighLevel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Done-for-you SEO, ads, websites</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                Try VoiceFly Free
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">GoHighLevel</div>
                <div className="text-sm text-gray-600">Best for: Marketing agencies with existing clients</div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Established agency platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Large template marketplace</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm">No AI voice conversations</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Complex for beginners</span>
                </div>
              </div>
              <div className="text-center text-sm text-gray-600">
                Starting at $97/month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Feature-by-Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold text-blue-600">VoiceFly</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">GoHighLevel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">AI Voice Conversations</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Full AI phone agent</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <X className="h-6 w-6 text-red-500" />
                      <span className="text-xs text-gray-600 mt-1">Chatbots only</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Appointment Booking</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">CRM</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Email Marketing</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">SMS Marketing</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Outbound Calling (AI)</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">AI-powered</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Manual dialer</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">White-Label</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">$299/mo</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">$497/mo</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Industry Snapshots</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Pre-configured</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Templates</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Done-For-You Services</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">SEO, Ads, Websites</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <X className="h-6 w-6 text-red-500" />
                      <span className="text-xs text-gray-600 mt-1">DIY only</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Learning Curve</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🟢</span>
                      <span className="text-xs text-gray-600 mt-1">Easy (10 min setup)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🟡</span>
                      <span className="text-xs text-gray-600 mt-1">Complex (days to learn)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing Comparison</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-600">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">🎙️ VoiceFly</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">$149<span className="text-xl text-gray-600">/mo</span></div>
                <div className="text-sm text-gray-600">Beauty & Spa Snapshot</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI Phone Agent + Booking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>SMS + Email Marketing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Loyalty Program</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>15+ Templates</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center mb-4">
                Save $127/month vs buying separately
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">GoHighLevel</div>
                <div className="text-4xl font-bold mb-2">$297<span className="text-xl text-gray-600">/mo</span></div>
                <div className="text-sm text-gray-600">Agency Unlimited Plan</div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited sub-accounts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>CRM + Funnels</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>SMS + Email Marketing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 text-red-500" />
                  <span>No AI voice agent</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center mb-4">
                + $97/mo for Agency Starter
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center">
            <div className="text-xl font-bold text-gray-900 mb-2">VoiceFly saves you $148/month (50% cheaper)</div>
            <div className="text-gray-600">And includes AI voice conversations that GoHighLevel doesn't offer</div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">When to Choose Each Platform</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Choose VoiceFly if you:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Need AI voice conversations (not just chatbots)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Want done-for-you services (SEO, ads, websites)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Are a solo business or small team (1-20 people)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Value simplicity and quick setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Want to save money (50-70% cheaper)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Choose GoHighLevel if you:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Are an established marketing agency</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Need to manage 50+ client accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Don't need AI voice conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Are comfortable with complexity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Have time to learn a complex platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Try VoiceFly?</h2>
          <p className="text-xl mb-8 text-blue-100">
            50% cheaper than GoHighLevel + AI voice conversations they don't offer
          </p>
          <Link href="/signup" className="inline-flex items-center px-10 py-5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all">
            Start 14-Day Free Trial
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
          <p className="text-sm text-blue-100 mt-6">No credit card required · 2-minute setup · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-sm text-gray-400">
            © 2025 VoiceFly. This is an independent comparison. GoHighLevel is a registered trademark of GoHighLevel LLC.
          </div>
        </div>
      </footer>
    </div>
  )
}
