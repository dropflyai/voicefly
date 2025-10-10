"use client"

import SEOOptimization from '../../../components/SEOOptimization'
import {
  CheckCircle,
  ArrowRight,
  Mic,
  Phone,
  Zap,
  Users,
  Building,
  Globe,
  Crown,
  Sparkles,
  Lock
} from 'lucide-react'
import Link from 'next/link'

export default function AddOnsPage() {
  const addOnCategories = [
    {
      title: 'Capacity Add-Ons',
      subtitle: 'Need more usage? Scale up instantly',
      icon: Zap,
      color: 'blue',
      items: [
        {
          name: 'Extra 500 Voice Minutes',
          price: '$149/mo',
          description: 'Additional calling capacity for high-volume businesses',
          features: ['Inbound or outbound', 'Same quality as base plan', 'Stacks with your tier']
        },
        {
          name: 'Extra 50 Leads',
          price: '$99/mo',
          description: 'More AI-generated leads delivered monthly',
          features: ['Premium targeting', 'Verified contacts', 'Auto-added to CRM']
        },
        {
          name: 'Extra 500 SMS',
          price: '$49/mo',
          description: 'Additional text messaging capacity',
          features: ['Two-way messaging', 'Campaign support', 'Delivery tracking']
        },
        {
          name: 'Extra 5,000 Emails',
          price: '$29/mo',
          description: 'Boost your email marketing capacity',
          features: ['Template library', 'A/B testing', 'Analytics included']
        }
      ]
    },
    {
      title: 'Scaling Add-Ons',
      subtitle: 'Grow your team and locations',
      icon: Users,
      color: 'purple',
      items: [
        {
          name: 'Additional Location',
          price: '$199/mo each',
          description: 'Add another business location to your account',
          features: ['Separate phone numbers', 'Location-specific analytics', 'Unified dashboard'],
          minTier: 'Enterprise'
        },
        {
          name: 'Extra Phone Numbers',
          price: '$49/mo each',
          description: 'Additional local or toll-free numbers',
          features: ['Any US area code', 'Instant activation', 'Call routing included']
        },
        {
          name: 'Extra User Seats',
          price: '$29/mo per user',
          description: 'Add more team members to your account',
          features: ['Full platform access', 'Role-based permissions', 'Activity tracking']
        }
      ]
    },
    {
      title: 'Premium Services',
      subtitle: 'White-glove support and management',
      icon: Crown,
      color: 'amber',
      enterpriseOnly: true,
      items: [
        {
          name: 'White-Label Platform',
          price: '$299/mo',
          description: 'Remove VoiceFly branding, use your own',
          features: ['Custom domain', 'Your logo & colors', 'Client-facing rebrand'],
          minTier: 'Enterprise'
        },
        {
          name: 'Dedicated Account Manager',
          price: '$999/mo',
          description: 'Your personal VIP contact for everything',
          features: ['2-hour response SLA', 'Bi-weekly strategy calls', 'Direct phone/text access', 'Proactive monitoring'],
          minTier: 'Enterprise',
          badge: 'Most Popular'
        },
        {
          name: 'Done-For-You Campaigns',
          price: '$999/mo',
          description: 'We manage all your marketing campaigns',
          features: ['4 campaigns/month designed & launched', 'Email + SMS + Voice', 'Performance optimization', 'Monthly reporting'],
          minTier: 'Enterprise'
        }
      ]
    },
    {
      title: 'Custom Development',
      subtitle: 'One-time builds tailored to your business',
      icon: Building,
      color: 'indigo',
      enterpriseOnly: true,
      items: [
        {
          name: 'Template Website',
          price: '$2,000-$5,000',
          description: 'Pre-built industry website customized for you',
          features: ['Mobile responsive', 'SEO optimized', 'Lead capture forms', '2-week delivery'],
          minTier: 'Enterprise',
          oneTime: true
        },
        {
          name: 'Custom Website',
          price: '$5,000-$20,000',
          description: 'Fully custom design from scratch',
          features: ['Unique design', 'Custom features', 'Advanced integrations', '4-8 week delivery'],
          minTier: 'Enterprise',
          oneTime: true
        },
        {
          name: 'Custom Integration',
          price: '$2,500-$10,000',
          description: 'Connect to your existing systems',
          features: ['API development', 'Data migration', 'Testing & QA', '3-6 week delivery'],
          minTier: 'Enterprise',
          oneTime: true
        },
        {
          name: 'Custom AI Training',
          price: '$499',
          description: 'Train AI on your specific business language',
          features: ['Your industry terminology', 'Custom responses', 'Brand voice matching', '1-week delivery'],
          minTier: 'Enterprise',
          oneTime: true
        }
      ]
    },
    {
      title: 'Professional Marketing Services',
      subtitle: 'Full-service marketing team at your disposal',
      icon: Globe,
      color: 'green',
      enterpriseOnly: true,
      items: [
        {
          name: 'SEO Management - Basic',
          price: '$1,500/mo',
          description: 'Local SEO + 1 blog post per month',
          features: ['Google Business Profile', 'Local citations', 'On-page optimization', 'Monthly reporting'],
          minTier: 'Enterprise',
          contract: '6-month minimum'
        },
        {
          name: 'SEO Management - Pro',
          price: '$2,500/mo',
          description: 'Aggressive SEO + content + link building',
          features: ['Everything in Basic', '2 blog posts/month', 'Link building', 'Competitor analysis'],
          minTier: 'Enterprise',
          contract: '6-month minimum'
        },
        {
          name: 'Lead Generation Service',
          price: '$2,000-$3,500/mo',
          description: 'Google & Facebook ads managed for you',
          features: ['Campaign strategy', 'Ad creative design', 'Landing pages', 'Weekly reports'],
          minTier: 'Enterprise',
          contract: '3-month minimum',
          note: '+ Ad spend (budget separately)'
        },
        {
          name: 'Full Marketing Management',
          price: '$2,500/mo',
          description: 'We run all your marketing campaigns',
          features: ['Email campaigns', 'SMS campaigns', 'Voice campaigns', 'Strategy & optimization'],
          minTier: 'Enterprise',
          contract: '3-month minimum'
        }
      ]
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: any = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      amber: 'bg-amber-100 text-amber-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      green: 'bg-green-100 text-green-600'
    }
    return colors[color] || 'bg-gray-100 text-gray-600'
  }

  return (
    <>
      <SEOOptimization
        page="pricing"
        canonicalUrl="https://voicefly.ai/pricing/addons"
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">VoiceFly</span>
              </Link>

              <div className="flex items-center space-x-4">
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Back to Pricing</Link>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="pt-16 pb-12 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Add-Ons & Premium Services
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Scale your plan with extra capacity, premium support, and custom development
            </p>
            <p className="text-sm text-gray-500">
              Most add-ons available on any tier • Enterprise-only services marked below
            </p>
          </div>
        </section>

        {/* Add-On Categories */}
        {addOnCategories.map((category, idx) => {
          const CategoryIcon = category.icon
          return (
            <section key={idx} className={`py-16 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Category Header */}
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full ${getColorClasses(category.color)} flex items-center justify-center`}>
                      <CategoryIcon className="h-8 w-8" />
                    </div>
                    {category.enterpriseOnly && (
                      <div className="ml-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                        <Crown className="h-4 w-4 mr-2" />
                        Enterprise VIP Only
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{category.title}</h2>
                  <p className="text-gray-600">{category.subtitle}</p>
                </div>

                {/* Items Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className={`bg-white rounded-xl shadow-lg p-6 border-2 hover:shadow-xl transition-all ${
                        item.minTier === 'Enterprise' ? 'border-purple-200' : 'border-gray-200'
                      }`}
                    >
                      {item.badge && (
                        <div className="mb-3">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {item.badge}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-blue-600">{item.price}</p>
                            {item.oneTime && <span className="text-xs text-gray-500">one-time</span>}
                          </div>
                        </div>
                        {item.minTier === 'Enterprise' && (
                          <Lock className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{item.description}</p>

                      <ul className="space-y-2 mb-4">
                        {item.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {item.contract && (
                        <p className="text-xs text-amber-600 mb-3">
                          <span className="font-semibold">Contract:</span> {item.contract}
                        </p>
                      )}

                      {item.note && (
                        <p className="text-xs text-gray-500 mb-3">{item.note}</p>
                      )}

                      {item.minTier === 'Enterprise' ? (
                        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs text-purple-700 font-semibold flex items-center justify-center">
                            <Crown className="h-3 w-3 mr-1" />
                            Enterprise Tier Required
                          </p>
                        </div>
                      ) : (
                        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                          Add to Plan
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        {/* Support Tiers Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Support Response Times
              </h2>
              <p className="text-blue-100">
                Every tier includes support - here's what you can expect
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">5 days</div>
                <p className="text-sm text-gray-600">Email support (business days)</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Starter</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">2 days</div>
                <p className="text-sm text-gray-600">Email support (business days)</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center border-2 border-purple-500">
                <h3 className="font-bold text-gray-900 mb-2">Professional</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">1 day</div>
                <p className="text-sm text-gray-600">Email + ticket system</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center border-2 border-indigo-500">
                <h3 className="font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-3xl font-bold text-indigo-600 mb-2">4-8 hrs</div>
                <p className="text-sm text-gray-600">Email + phone + Slack (M-F)</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Crown className="h-6 w-6 text-amber-300" />
                  <h4 className="text-xl font-bold text-white">Dedicated Account Manager</h4>
                </div>
                <p className="text-blue-100 text-sm mb-3">Enterprise + $999/mo</p>
                <div className="text-4xl font-bold text-white mb-2">2 hours</div>
                <p className="text-sm text-blue-100">Your personal VIP contact • Direct access • Bi-weekly calls</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Scale Up?
            </h2>
            <p className="text-gray-600 mb-8">
              Start with any tier and add what you need as you grow
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                View All Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/pricing/enterprise" className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                <Crown className="mr-2 h-5 w-5" />
                Explore Enterprise VIP
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <Phone className="h-6 w-6 text-blue-400 mr-2" />
                  <span className="text-xl font-bold">VoiceFly</span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI-powered business automation that pays for itself
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/features" className="hover:text-white">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="/pricing/addons" className="hover:text-white">Add-Ons</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                  <li><Link href="/signup" className="hover:text-white">Get Started</Link></li>
                  <li><Link href="mailto:hello@voiceflyai.com" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 VoiceFly. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">SOC 2 Certified</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
