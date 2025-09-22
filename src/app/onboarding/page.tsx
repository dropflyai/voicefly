"use client"

import { useState } from 'react'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mic,
  Users,
  Settings,
  Zap,
  Play,
  Phone,
  BarChart3,
  Building,
  Globe,
  Headphones
} from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Use Case
    primaryUseCase: '',
    businessType: '',
    teamSize: '',

    // Step 2: Voice Configuration
    voicePersonality: 'professional',
    voiceGender: 'female',
    selectedVoice: 'sarah',

    // Step 3: Integration
    crmSystem: '',
    phoneSystem: '',

    // Step 4: First Campaign
    campaignName: '',
    campaignGoal: ''
  })

  const totalSteps = 5

  const useCases = [
    {
      id: 'lead-qualification',
      title: 'Lead Qualification',
      description: 'Automatically qualify inbound leads and score prospects',
      icon: <Users className="h-8 w-8" />,
      popular: true
    },
    {
      id: 'appointment-booking',
      title: 'Appointment Booking',
      description: 'Schedule meetings and manage calendar availability',
      icon: <Phone className="h-8 w-8" />,
      popular: false
    },
    {
      id: 'customer-service',
      title: 'Customer Service',
      description: 'Handle support requests and common inquiries',
      icon: <Headphones className="h-8 w-8" />,
      popular: false
    },
    {
      id: 'sales-follow-up',
      title: 'Sales Follow-up',
      description: 'Nurture prospects and re-engage cold leads',
      icon: <BarChart3 className="h-8 w-8" />,
      popular: false
    }
  ]

  const voiceOptions = [
    {
      id: 'sarah',
      name: 'Sarah',
      personality: 'professional',
      description: 'Professional, confident, perfect for B2B sales',
      gender: 'female'
    },
    {
      id: 'michael',
      name: 'Michael',
      personality: 'friendly',
      description: 'Warm, approachable, great for customer service',
      gender: 'male'
    },
    {
      id: 'emma',
      name: 'Emma',
      personality: 'energetic',
      description: 'Enthusiastic, engaging, ideal for appointment booking',
      gender: 'female'
    },
    {
      id: 'david',
      name: 'David',
      personality: 'professional',
      description: 'Authoritative, trustworthy, excellent for enterprise',
      gender: 'male'
    }
  ]

  const crmOptions = [
    { id: 'hubspot', name: 'HubSpot', logo: '/logos/hubspot.png' },
    { id: 'salesforce', name: 'Salesforce', logo: '/logos/salesforce.png' },
    { id: 'pipedrive', name: 'Pipedrive', logo: '/logos/pipedrive.png' },
    { id: 'zoho', name: 'Zoho CRM', logo: '/logos/zoho.png' },
    { id: 'other', name: 'Other / Manual', logo: null }
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      window.location.href = '/dashboard'
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What's your primary use case?
              </h2>
              <p className="text-gray-600">
                Help us customize VoiceFly to your specific needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => updateFormData('primaryUseCase', useCase.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                    formData.primaryUseCase === useCase.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      formData.primaryUseCase === useCase.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {useCase.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
                        {useCase.popular && (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{useCase.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select business type</option>
                  <option value="saas">SaaS / Technology</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance / Insurance</option>
                  <option value="realestate">Real Estate</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => updateFormData('teamSize', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select team size</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-20">6-20 people</option>
                  <option value="21-50">21-50 people</option>
                  <option value="51-200">51-200 people</option>
                  <option value="200+">200+ people</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Voice
              </h2>
              <p className="text-gray-600">
                Select a voice that represents your brand
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => updateFormData('selectedVoice', voice.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                    formData.selectedVoice === voice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{voice.name}</h3>
                    <button className={`p-2 rounded-full ${
                      formData.selectedVoice === voice.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{voice.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="capitalize">{voice.gender}</span>
                    <span>•</span>
                    <span className="capitalize">{voice.personality}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Voice Customization</h4>
              <p className="text-gray-600 text-sm mb-4">
                Want a custom voice that sounds exactly like you or your team? We can create a personalized voice clone.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                Learn about voice cloning →
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connect Your Tools
              </h2>
              <p className="text-gray-600">
                Integrate with your existing CRM and phone systems
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">CRM System</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {crmOptions.map((crm) => (
                  <button
                    key={crm.id}
                    onClick={() => updateFormData('crmSystem', crm.id)}
                    className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                      formData.crmSystem === crm.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {crm.logo ? (
                      <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
                    ) : (
                      <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <div className="font-medium text-sm">{crm.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Phone System (Optional)</h4>
              <p className="text-gray-600 text-sm mb-4">
                Connect your existing phone system or use our built-in dialing
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateFormData('phoneSystem', 'builtin')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.phoneSystem === 'builtin'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Zap className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                  <div className="font-medium text-sm">VoiceFly Dialer</div>
                </button>
                <button
                  onClick={() => updateFormData('phoneSystem', 'existing')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.phoneSystem === 'existing'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Phone className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                  <div className="font-medium text-sm">Existing System</div>
                </button>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Create Your First Campaign
              </h2>
              <p className="text-gray-600">
                Let's set up your first voice AI campaign
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) => updateFormData('campaignName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Q1 Lead Qualification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal
                </label>
                <select
                  value={formData.campaignGoal}
                  onChange={(e) => updateFormData('campaignGoal', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your primary goal</option>
                  <option value="qualify-leads">Qualify inbound leads</option>
                  <option value="book-appointments">Book sales appointments</option>
                  <option value="follow-up">Follow up with prospects</option>
                  <option value="customer-service">Provide customer service</option>
                  <option value="surveys">Conduct surveys</option>
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Campaign Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voice:</span>
                    <span className="font-medium">{voiceOptions.find(v => v.id === formData.selectedVoice)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Use Case:</span>
                    <span className="font-medium capitalize">{formData.primaryUseCase?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CRM:</span>
                    <span className="font-medium">{crmOptions.find(c => c.id === formData.crmSystem)?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                You're All Set! 🎉
              </h2>
              <p className="text-gray-600 text-lg">
                Your VoiceFly account is configured and ready to transform your business communication
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-medium">Test Your Voice</div>
                  <div className="text-gray-600">Make a sample call</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-medium">Import Contacts</div>
                  <div className="text-gray-600">Upload your lead list</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-medium">View Analytics</div>
                  <div className="text-gray-600">Track performance</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Go to Dashboard
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Schedule Training Call
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.primaryUseCase && formData.businessType && formData.teamSize
      case 2:
        return formData.selectedVoice
      case 3:
        return formData.crmSystem
      case 4:
        return formData.campaignName && formData.campaignGoal
      case 5:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VoiceFly</span>
            </div>

            <div className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderStep()}

          {/* Navigation */}
          <div className="max-w-2xl mx-auto mt-12 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                isStepValid()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}