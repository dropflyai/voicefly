'use client'

import Link from 'next/link'
import { Check, X, ArrowRight, DollarSign } from 'lucide-react'

export default function VoiceFlyVsHubSpot() {
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
            VoiceFly vs HubSpot
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Get HubSpot-level features for <span className="text-blue-600 font-bold">1/4 the price</span>
          </p>
          <p className="text-lg text-gray-500">
            Plus AI voice conversations HubSpot doesn't offer
          </p>
        </div>
      </section>

      {/* Price Shock */}
      <section className="py-12 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <DollarSign className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">The HubSpot Price Problem</h2>
            <p className="text-xl text-gray-600">Small businesses can't afford HubSpot's enterprise pricing</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">HubSpot</div>
                <div className="text-5xl font-bold text-red-600 mb-2">$800<span className="text-2xl text-gray-600">/mo</span></div>
                <div className="text-sm text-gray-600">Marketing Hub Professional</div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>+ Sales Hub: $450/month</div>
                <div>+ Service Hub: $450/month</div>
                <div className="border-t pt-2 font-bold text-lg text-gray-900">Total: $1,700/month</div>
              </div>
              <div className="mt-6 bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">$20,400/year</div>
                <div className="text-sm text-gray-600">Minimum commitment</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border-4 border-blue-600">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">🎙️ VoiceFly</div>
                <div className="text-5xl font-bold text-blue-600 mb-2">$249<span className="text-2xl text-gray-600">/mo</span></div>
                <div className="text-sm text-gray-600">Law Firm Snapshot (All-in-One)</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI Phone Agent + CRM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Email + SMS Marketing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Appointment Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Analytics + Reporting</span>
                </div>
              </div>
              <div className="mt-6 bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">$2,988/year</div>
                <div className="text-sm text-gray-600">Save $17,412/year vs HubSpot</div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-gray-900 mb-2">You save 85% with VoiceFly</div>
            <div className="text-xl text-gray-600">That's $17,412 per year back in your pocket</div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold text-blue-600">VoiceFly<br/>$249/mo</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">HubSpot<br/>$1,700/mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 font-medium">AI Voice Agent</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">24/7 answering</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <X className="h-6 w-6 text-red-500" />
                      <span className="text-xs text-gray-600 mt-1">Not available</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">CRM</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Email Marketing</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">SMS Marketing</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Add-on only</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Appointment Booking</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Basic only</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Automation Workflows</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Analytics & Reporting</td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-6 w-6 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Industry-Specific Templates</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Pre-configured</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Generic</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Done-For-You Services</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Included</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Extra $$$</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium">Setup Time</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-green-600">10-20 min</span>
                      <span className="text-xs text-gray-600 mt-1">Instant value</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-orange-600">2-3 months</span>
                      <span className="text-xs text-gray-600 mt-1">Complex setup</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Support</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Included</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <Check className="h-6 w-6 text-green-600" />
                      <span className="text-xs text-gray-600 mt-1">Email only</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* When to Choose */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Who Should Choose Each Platform?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Choose VoiceFly if you:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Are a small-to-medium business (1-50 employees)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Want to save $17,000+/year on software</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Need AI voice conversations (not just chatbots)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Want fast setup (minutes, not months)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Value simplicity over complexity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Want done-for-you services included</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Choose HubSpot if you:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Are a large enterprise (500+ employees)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Have $20,000+/year budget for CRM</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Have dedicated IT/marketing team</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Need complex custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Already invested in HubSpot ecosystem</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span>Don't need AI voice capabilities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-center mb-6">Switching from HubSpot?</h2>
            <p className="text-xl text-gray-600 text-center mb-8">
              We make it easy to migrate. Keep all your data, save $17K/year, add AI voice.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">1</div>
                <div className="font-semibold">Export from HubSpot</div>
                <div className="text-sm text-gray-600 mt-1">We guide you step-by-step</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">2</div>
                <div className="font-semibold">Import to VoiceFly</div>
                <div className="text-sm text-gray-600 mt-1">Contacts, deals, history</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">✓</div>
                <div className="font-semibold">Start Saving</div>
                <div className="text-sm text-gray-600 mt-1">$1,451/month back</div>
              </div>
            </div>
            <div className="text-center">
              <Link href="/enterprise?from=hubspot" className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg">
                Schedule Migration Call
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <p className="text-sm text-gray-600 mt-4">White-glove migration assistance included</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Save $17,412/Year</h2>
          <p className="text-2xl mb-2">Get the same features for 85% less</p>
          <p className="text-xl mb-8 text-blue-100">Plus AI voice conversations HubSpot doesn't offer</p>
          <Link href="/signup" className="inline-flex items-center px-10 py-5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all">
            Start Free Trial - No Credit Card
            <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
          <p className="text-sm text-blue-100 mt-6">See why SMBs choose VoiceFly over HubSpot</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-sm text-gray-400">
            © 2025 VoiceFly. This is an independent comparison. HubSpot is a registered trademark of HubSpot, Inc.
          </div>
        </div>
      </footer>
    </div>
  )
}
