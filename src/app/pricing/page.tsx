"use client"

import { useState } from 'react'
import SEOOptimization from '../../components/SEOOptimization'
import {
  CheckCircle,
  X,
  Star,
  Users,
  User,
  TrendingUp,
  Shield,
  HeadphonesIcon,
  Zap,
  Building,
  ArrowRight,
  Mic,
  Phone,
  BarChart3,
  Globe,
  Clock,
  Award
} from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState('professional')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Perfect for small teams',
      monthlyPrice: 147,
      yearlyPrice: 125,
      description: 'Get started with essential voice AI features',
      features: [
        '300 voice minutes/month',
        '25 Maya research queries/month',
        '1 phone number included',
        '3 basic integrations',
        '• Google Calendar sync',
        '• Basic CRM (HubSpot/Pipedrive)',
        '• Email integration (Gmail/Outlook)',
        'Email support',
        'Call analytics dashboard',
        'Lead qualification AI',
        'Mobile app access'
      ],
      limitations: [
        'Advanced voice cloning',
        'Priority support',
        'Custom integrations',
        'Advanced analytics',
        'Multi-channel campaigns'
      ],
      cta: 'Start 3-Day Trial',
      popular: false,
      overage: {
        minutes: '$0.40/minute',
        research: '$0.15/query',
        phones: '$9/month each'
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      subtitle: 'Most popular for growing businesses',
      monthlyPrice: 397,
      yearlyPrice: 337,
      description: 'Everything you need to scale your voice AI operations',
      features: [
        '1,000 voice minutes/month',
        '100 Maya research queries/month',
        '3 phone numbers included',
        '15 advanced integrations',
        '• All basic integrations',
        '• Advanced CRM (Salesforce, Zoho)',
        '• Marketing tools (Mailchimp, ActiveCampaign)',
        '• Business tools (Slack, Teams, Zapier)',
        '• Custom webhooks (5)',
        'Priority chat support',
        'Advanced analytics dashboard',
        'Voice cloning included',
        'A/B testing tools',
        'Custom call scripts',
        'Multi-language support (25+)',
        'API access',
        'Team collaboration',
        'Custom branding'
      ],
      limitations: [
        'Dedicated account manager',
        'Custom voice training',
        'White-label solution',
        'Enterprise security'
      ],
      cta: 'Start 3-Day Trial',
      popular: true,
      savings: 'Most Popular Choice',
      overage: {
        minutes: '$0.40/minute',
        research: '$0.15/query',
        phones: '$9/month each'
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      subtitle: 'For large organizations',
      monthlyPrice: 997,
      yearlyPrice: 847,
      description: 'Complete solution with dedicated support',
      features: [
        '3,000 voice minutes/month',
        '300 Maya research queries/month',
        '10 phone numbers included',
        'Unlimited integrations',
        '• All professional integrations',
        '• Custom API development',
        '• ERP systems (SAP, Oracle)',
        '• Enterprise CRM (unlimited objects)',
        '• Advanced webhooks (unlimited)',
        '• White-label API access',
        'Dedicated account manager',
        '24/7 phone support',
        'Advanced security (SOC 2 + HIPAA)',
        'Custom voice training',
        'Custom onboarding & training',
        'Priority feature requests',
        'White-label solution',
        'Custom SLA (99.9% uptime)',
        'Advanced reporting & BI tools',
        'Multi-region hosting',
        'Custom contracts available',
        'Consulting & optimization'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
      overage: {
        minutes: '$0.35/minute',
        research: '$0.12/query',
        phones: '$7/month each'
      }
    }
  ]

  const features = [
    {
      category: 'Voice & Audio',
      items: [
        { name: 'Voice minutes per month', starter: '300', professional: '1,000', enterprise: '3,000' },
        { name: 'Maya research queries', starter: '25', professional: '100', enterprise: '300' },
        { name: 'Phone numbers included', starter: '1', professional: '3', enterprise: '10' },
        { name: 'Voice library', starter: '10 voices', professional: '100+ voices', enterprise: 'Custom voices' },
        { name: 'Voice cloning', starter: false, professional: true, enterprise: true },
        { name: 'Custom voice training', starter: false, professional: false, enterprise: true },
        { name: 'Multi-language support', starter: '5 languages', professional: '25+ languages', enterprise: '70+ languages' },
        { name: 'Audio quality', starter: 'Standard', professional: 'HD', enterprise: 'Studio quality' }
      ]
    },
    {
      category: 'Features & Automation',
      items: [
        { name: 'Lead qualification', starter: true, professional: true, enterprise: true },
        { name: 'Appointment booking', starter: true, professional: true, enterprise: true },
        { name: 'A/B testing', starter: false, professional: true, enterprise: true },
        { name: 'Custom scripts', starter: false, professional: true, enterprise: true },
        { name: 'Advanced workflows', starter: false, professional: true, enterprise: true },
        { name: 'AI conversation optimization', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Integrations & API',
      items: [
        { name: 'Total integrations', starter: '3 basic', professional: '15 advanced', enterprise: 'Unlimited' },
        { name: 'Google Calendar', starter: true, professional: true, enterprise: true },
        { name: 'Basic CRM (HubSpot/Pipedrive)', starter: true, professional: true, enterprise: true },
        { name: 'Email integration', starter: true, professional: true, enterprise: true },
        { name: 'Advanced CRM (Salesforce/Zoho)', starter: false, professional: true, enterprise: true },
        { name: 'Marketing tools', starter: false, professional: true, enterprise: true },
        { name: 'Business tools (Slack/Teams)', starter: false, professional: true, enterprise: true },
        { name: 'API access', starter: false, professional: true, enterprise: true },
        { name: 'Custom webhooks', starter: false, professional: '5', enterprise: 'Unlimited' },
        { name: 'Custom API development', starter: false, professional: false, enterprise: true },
        { name: 'ERP systems', starter: false, professional: false, enterprise: true },
        { name: 'White-label solution', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Analytics & Reporting',
      items: [
        { name: 'Basic analytics', starter: true, professional: true, enterprise: true },
        { name: 'Advanced reporting', starter: false, professional: true, enterprise: true },
        { name: 'Custom dashboards', starter: false, professional: false, enterprise: true },
        { name: 'Data export', starter: false, professional: true, enterprise: true },
        { name: 'Real-time insights', starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: 'Support & Security',
      items: [
        { name: 'Support', starter: 'Email', professional: 'Priority chat', enterprise: '24/7 phone' },
        { name: 'Onboarding', starter: 'Self-service', professional: 'Guided setup', enterprise: 'Custom onboarding' },
        { name: 'Account manager', starter: false, professional: false, enterprise: true },
        { name: 'SLA', starter: '99.5%', professional: '99.9%', enterprise: 'Custom SLA' },
        { name: 'Security compliance', starter: 'Basic', professional: 'SOC 2', enterprise: 'SOC 2 + HIPAA' }
      ]
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CEO, TechStart",
      plan: "Professional",
      quote: "ROI was immediate. We've 3x our qualified leads while cutting costs by 60%.",
      result: "+300% leads"
    },
    {
      name: "Mike Chen",
      role: "Sales Director, ScaleUp",
      plan: "Enterprise",
      quote: "The custom voice training perfectly matches our brand. Customers love it.",
      result: "+85% satisfaction"
    },
    {
      name: "Jennifer Walsh",
      role: "Operations Manager, GrowthCorp",
      plan: "Professional",
      quote: "Setup took 10 minutes. We're booking 40% more appointments every month.",
      result: "+40% appointments"
    }
  ]

  const faq = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What happens if I exceed my monthly limits?",
      answer: "We'll notify you when you reach 80% of your limits. Overage pricing applies: voice minutes at $0.35-0.40 each, Maya research queries at $0.12-0.15 each, and additional phone numbers at $7-9/month."
    },
    {
      question: "How does the 3-day free trial work?",
      answer: "Your trial includes limited usage: 50-150 voice minutes and 5-15 Maya research queries depending on the plan. No credit card required to start, and you can upgrade anytime during or after the trial."
    },
    {
      question: "What are the 3 basic integrations in the Starter plan?",
      answer: "Starter includes Google Calendar sync, basic CRM integration (HubSpot or Pipedrive), and email integration (Gmail or Outlook). Professional and Enterprise plans include many more advanced integrations."
    },
    {
      question: "Do you offer custom pricing for high-volume users?",
      answer: "Yes, we offer custom pricing for customers who need more than 3,000 minutes per month. Contact our sales team for a personalized Enterprise quote."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees, ever. We include free onboarding and training with all plans to ensure your success."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. No cancellation fees, and you'll retain access until the end of your billing period."
    }
  ]

  const getPrice = (plan: any) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getSavings = (plan: any) => {
    if (billingPeriod === 'yearly') {
      const monthlyCost = plan.monthlyPrice * 12
      const yearlyCost = plan.yearlyPrice * 12
      const savingsPercent = Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100)
      return savingsPercent
    }
    return 0
  }

  return (
    <>
      <SEOOptimization
        page="pricing"
        canonicalUrl="https://voicefly.ai/pricing"
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
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing That Grows With You
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            All plans include 3-day free trial, no credit card required
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                billingPeriod === 'yearly' ? 'transform translate-x-6 bg-blue-600' : ''
              }`} />
            </button>
            <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  plan.popular ? 'border-blue-500 scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.subtitle}</p>

                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">${getPrice(plan)}</span>
                      <span className="text-gray-600">/month</span>
                      {billingPeriod === 'yearly' && (
                        <div className="text-sm text-green-600 font-semibold mt-1">
                          Save {getSavings(plan)}% annually
                        </div>
                      )}
                    </div>

                    {plan.savings && plan.popular && (
                      <div className="text-sm text-green-600 font-semibold mb-4">
                        {plan.savings}
                      </div>
                    )}

                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start opacity-50">
                        <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Overage Pricing */}
                  {plan.overage && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Overage Pricing</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Extra minutes: {plan.overage.minutes}</div>
                        <div>Extra research: {plan.overage.research}</div>
                        <div>Extra phone numbers: {plan.overage.phones}</div>
                      </div>
                    </div>
                  )}

                  {plan.id !== 'enterprise' && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      3-day free trial • No credit card required
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare All Features
            </h2>
            <p className="text-gray-600">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header Row */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-3">
                <div className="font-bold text-gray-900">Features</div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">Starter</div>
                  <div className="text-xs text-gray-600">$147/mo</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600 flex items-center justify-center">
                    <Star className="h-3 w-3 mr-1" />
                    Professional
                  </div>
                  <div className="text-xs text-gray-600">$397/mo</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">Enterprise</div>
                  <div className="text-xs text-gray-600">$997/mo</div>
                </div>
              </div>
            </div>

            {features.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center">
                    {category.category === 'Voice & Audio' && <Mic className="h-4 w-4 mr-1 text-blue-600" />}
                    {category.category === 'Features & Automation' && <Zap className="h-4 w-4 mr-1 text-blue-600" />}
                    {category.category === 'Integrations & API' && <Globe className="h-4 w-4 mr-1 text-blue-600" />}
                    {category.category === 'Analytics & Reporting' && <BarChart3 className="h-4 w-4 mr-1 text-blue-600" />}
                    {category.category === 'Support & Security' && <Shield className="h-4 w-4 mr-1 text-blue-600" />}
                    {category.category}
                  </h3>
                </div>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-4 gap-3 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-gray-800">{item.name}</div>
                    <div className="text-center">
                      {typeof item.starter === 'boolean' ? (
                        item.starter ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400" />
                          </div>
                        )
                      ) : (
                        <div className="bg-gray-100 rounded px-2 py-1 text-xs font-medium text-gray-700">
                          {item.starter}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.professional === 'boolean' ? (
                        item.professional ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400" />
                          </div>
                        )
                      ) : (
                        <div className="bg-blue-100 rounded px-2 py-1 text-xs font-medium text-blue-700">
                          {item.professional}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.enterprise === 'boolean' ? (
                        item.enterprise ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400" />
                          </div>
                        )
                      ) : (
                        <div className="bg-purple-100 rounded px-2 py-1 text-xs font-medium text-purple-700">
                          {item.enterprise}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Bottom CTA Row */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3">
              <div className="grid grid-cols-4 gap-3">
                <div></div>
                <div className="text-center">
                  <button className="w-full bg-gray-200 text-gray-900 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">
                    Start Free Trial
                  </button>
                </div>
                <div className="text-center">
                  <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Start Free Trial
                  </button>
                </div>
                <div className="text-center">
                  <button className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See the Results Our Customers Achieve
            </h2>
            <p className="text-gray-600">
              Real success stories from businesses using VoiceFly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                    <div className="text-blue-600 text-sm font-medium">{testimonial.plan} Plan</div>
                  </div>
                </div>
                <blockquote className="text-gray-700 mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-green-600 font-semibold">{testimonial.result}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faq.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business Communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your 3-day free trial today. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-blue-100 text-sm">
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              3-day free trial
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              No setup fees
            </span>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}