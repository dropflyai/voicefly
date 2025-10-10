'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function EnterpriseContactPage() {
  const [formData, setFormData] = useState({
    // Contact Information
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',

    // Company Information
    companyName: '',
    companySize: '',
    industry: '',
    website: '',

    // Business Needs
    currentCallVolume: '',
    currentSolution: '',
    painPoints: [] as string[],
    desiredOutcomes: [] as string[],
    integrationNeeds: '',

    // Additional Information
    timeline: '',
    budget: '',
    additionalInfo: ''
  })

  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (category: 'painPoints' | 'desiredOutcomes', value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In production, this would send to your CRM/backend
    console.log('Enterprise Form Submission:', formData)

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#d1fae5', borderRadius: '50%', marginBottom: '24px' }}>
            <CheckCircleIcon style={{ width: '48px', height: '48px', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            Thank You!
          </h1>
          <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '24px', lineHeight: '1.6' }}>
            We've received your Enterprise inquiry. A dedicated specialist will reach out within 24 hours to discuss your needs and create a custom solution for {formData.companyName}.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Return to Homepage
              <ArrowRightIcon style={{ width: '20px', height: '20px' }} />
            </Link>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: '2px solid #2563eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* Header */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', textDecoration: 'none' }}>
            🎙️ VoiceFly
          </Link>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</Link>
            <Link href="/solutions" style={{ color: '#4b5563', textDecoration: 'none' }}>Solutions</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/login" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(to right, #1f2937, #111827)', padding: '64px 24px', color: '#ffffff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(34, 211, 238, 0.1)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', color: '#22d3ee', marginBottom: '16px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
            ENTERPRISE SOLUTIONS
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
            Let's Build Your Custom Solution
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '700px', margin: '0 auto', color: '#ffffff' }}>
            Tell us about your business needs, and we'll design a VoiceFly solution with dedicated support, custom integrations, and guaranteed SLAs.
          </p>
        </div>
      </div>

      {/* Benefits Bar */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '32px 16px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Dedicated Manager</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Personal success partner</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔧</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Custom Integrations</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Connect your tech stack</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>SLA Guarantees</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>99.9% uptime commitment</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Priority Support</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>24/7 dedicated assistance</div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div style={{ maxWidth: '900px', margin: '64px auto', padding: '0 24px' }}>
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px', border: '1px solid #e5e7eb' }}>

          {/* Contact Information */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <UserGroupIcon style={{ width: '28px', height: '28px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Contact Information
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  required
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="VP of Operations"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <BuildingOfficeIcon style={{ width: '28px', height: '28px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Company Information
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Company Size *
                </label>
                <select
                  name="companySize"
                  required
                  value={formData.companySize}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1,000 employees</option>
                  <option value="1000+">1,000+ employees</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Industry *
                </label>
                <select
                  name="industry"
                  required
                  value={formData.industry}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select industry...</option>
                  <option value="auto">Auto Dealerships</option>
                  <option value="realestate">Real Estate</option>
                  <option value="legal">Law Firms</option>
                  <option value="homeservices">Home Services (HVAC, Plumbing)</option>
                  <option value="medical">Medical & Dental</option>
                  <option value="salons">Salons & Spas</option>
                  <option value="insurance">Insurance</option>
                  <option value="financial">Financial Services</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Company Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                  placeholder="https://www.company.com"
                />
              </div>
            </div>
          </div>

          {/* Business Needs */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <PhoneIcon style={{ width: '28px', height: '28px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Business Needs
              </h2>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Current Monthly Call Volume *
              </label>
              <select
                name="currentCallVolume"
                required
                value={formData.currentCallVolume}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', backgroundColor: '#ffffff' }}
              >
                <option value="">Select volume...</option>
                <option value="0-500">0-500 calls/month</option>
                <option value="500-1000">500-1,000 calls/month</option>
                <option value="1000-2500">1,000-2,500 calls/month</option>
                <option value="2500-5000">2,500-5,000 calls/month</option>
                <option value="5000-10000">5,000-10,000 calls/month</option>
                <option value="10000+">10,000+ calls/month</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Current Solution
              </label>
              <input
                type="text"
                name="currentSolution"
                value={formData.currentSolution}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                placeholder="e.g., Traditional receptionist, answering service, voicemail"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Primary Pain Points (select all that apply)
              </label>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Missing calls during business hours',
                  'No after-hours coverage',
                  'High staff costs',
                  'Slow response times',
                  'Poor customer experience',
                  'No call tracking/analytics',
                  'Difficulty scaling operations',
                  'Integration challenges with existing systems'
                ].map((painPoint) => (
                  <label key={painPoint} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.painPoints.includes(painPoint)}
                      onChange={() => handleCheckboxChange('painPoints', painPoint)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '15px', color: '#4b5563' }}>{painPoint}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Desired Outcomes (select all that apply)
              </label>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Capture more leads',
                  'Improve customer satisfaction',
                  'Reduce operational costs',
                  'Scale without adding staff',
                  'Get better call analytics',
                  'Integrate with CRM/systems',
                  'Provide 24/7 coverage',
                  'Increase conversion rates'
                ].map((outcome) => (
                  <label key={outcome} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.desiredOutcomes.includes(outcome)}
                      onChange={() => handleCheckboxChange('desiredOutcomes', outcome)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '15px', color: '#4b5563' }}>{outcome}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Integration Needs
              </label>
              <textarea
                name="integrationNeeds"
                value={formData.integrationNeeds}
                onChange={handleInputChange}
                rows={3}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit' }}
                placeholder="List any systems you need to integrate with (e.g., Salesforce, HubSpot, custom CRM, scheduling software)"
              />
            </div>
          </div>

          {/* Project Details */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <EnvelopeIcon style={{ width: '28px', height: '28px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Project Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Preferred Timeline *
                </label>
                <select
                  name="timeline"
                  required
                  value={formData.timeline}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select timeline...</option>
                  <option value="immediate">Immediate (within 2 weeks)</option>
                  <option value="1month">Within 1 month</option>
                  <option value="1-3months">1-3 months</option>
                  <option value="3-6months">3-6 months</option>
                  <option value="exploring">Just exploring options</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Monthly Budget Range *
                </label>
                <select
                  name="budget"
                  required
                  value={formData.budget}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select budget...</option>
                  <option value="1000-2500">$1,000 - $2,500</option>
                  <option value="2500-5000">$2,500 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                  <option value="flexible">Flexible based on value</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Additional Information
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={5}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit' }}
                placeholder="Tell us more about your specific requirements, challenges, or questions..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 48px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              Submit Enterprise Inquiry
              <ArrowRightIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            By submitting this form, you agree to be contacted by our Enterprise team regarding VoiceFly solutions. We typically respond within 24 hours.
          </p>
        </form>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: '#ffffff', padding: '48px 16px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🎙️ VoiceFly</div>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            The world's most advanced AI business employee platform
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '14px', color: '#9ca3af' }}>
            <Link href="/pricing" style={{ color: '#9ca3af', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/solutions" style={{ color: '#9ca3af', textDecoration: 'none' }}>Solutions</Link>
            <Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Sign In</Link>
          </div>
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #374151', fontSize: '14px', color: '#9ca3af' }}>
            © 2025 VoiceFly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
