"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, ArrowRight, Eye, EyeOff, Phone } from 'lucide-react'
import Link from 'next/link'
import { AuthService } from '../../lib/auth-service'
import { supabase } from '../../lib/supabase-client'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    businessType: 'general_business',
    password: '',
    agreeToTerms: false,
    smsOptIn: false,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const nameParam = params.get('name')
    if (emailParam || nameParam) {
      setFormData(prev => {
        const next = { ...prev }
        if (emailParam) next.email = emailParam
        if (nameParam) {
          const parts = nameParam.trim().split(' ')
          next.firstName = parts[0] || ''
          next.lastName = parts.slice(1).join(' ') || ''
        }
        return next
      })
    }
  }, [])

  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { user, primaryBusinessId } = await AuthService.signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.company,
        businessType: formData.businessType,
        phone: formData.phone,
        smsOptIn: formData.smsOptIn,
      })

      localStorage.setItem('authenticated_business_id', primaryBusinessId)
      localStorage.setItem('authenticated_user_email', user.email)
      localStorage.setItem('authenticated_business_name', user.businesses[0].name)
      localStorage.setItem('authenticated_business_type', formData.businessType)

      window.location.href = '/onboarding'
    } catch (error: any) {
      console.error('Signup error:', error)
      alert(error.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPasswordStrength = (password: string) => {
    if (!password) { setPasswordStrength(null); return }
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8

    if (isLongEnough && hasLetter && hasNumber && hasSpecial) setPasswordStrength('strong')
    else if (isLongEnough && hasLetter && hasNumber) setPasswordStrength('medium')
    else setPasswordStrength('weak')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'password') checkPasswordStrength(value)
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.phone && formData.company && formData.password && formData.agreeToTerms

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) alert('Google Sign-In not yet configured. Please use email/password.')
    } catch { alert('Google Sign-In not yet configured. Please use email/password.') }
  }


  return (
    <div className="min-h-screen bg-surface flex font-[family-name:var(--font-inter)]">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <Phone className="h-6 w-6 text-brand-primary" />
            <span className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-2">
              Forward Your Calls to AI
            </h1>
            <p className="text-text-secondary">Keep your number. Your AI picks up every call, 24/7.</p>
            <p className="text-sm text-brand-light font-medium mt-2">
              Live in 2 minutes — no credit card needed
            </p>
          </div>

          {/* Social Signup */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center px-4 py-3 bg-surface-high rounded-lg text-text-primary hover:bg-surface-highest transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(65,71,84,0.15)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-muted">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-1">First name</label>
                <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleInputChange}
                  className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                  placeholder="John" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-1">Last name</label>
                <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleInputChange}
                  className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                  placeholder="Doe" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Business email</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange}
                className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                placeholder="john@company.com" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Mobile phone</label>
              <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange}
                className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                placeholder="(555) 123-4567" />
              <p className="text-xs text-text-muted mt-1">Used for account security and optional SMS notifications.</p>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-1">Company name</label>
              <input id="company" name="company" type="text" required value={formData.company} onChange={handleInputChange}
                className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                placeholder="Your Company Inc." />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-text-secondary mb-1">Industry Type</label>
              <select id="businessType" name="businessType" required value={formData.businessType}
                onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-3 py-3 bg-surface-highest text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none">
                <option value="general_business">General Business</option>
                <option value="medical_practice">Medical Practice</option>
                <option value="dental_practice">Dental Practice</option>
                <option value="beauty_salon">Beauty Salon / Spa</option>
                <option value="fitness_wellness">Fitness & Wellness</option>
                <option value="home_services">Home Services</option>
                <option value="medspa">Medical Spa</option>
                <option value="law_firm">Law Firm</option>
                <option value="real_estate">Real Estate</option>
                <option value="veterinary">Veterinary Clinic</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange}
                  className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 pr-10 border-none"
                  placeholder="Create a strong password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${
                      passwordStrength === 'weak' ? 'w-1/3 bg-[#ffb4ab]' :
                      passwordStrength === 'medium' ? 'w-2/3 bg-accent' :
                      'w-full bg-green-500'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'weak' ? 'text-[#ffb4ab]' :
                    passwordStrength === 'medium' ? 'text-accent' :
                    'text-green-500'
                  }`}>
                    {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
              <p className="text-xs text-text-muted mt-1">Must be at least 8 characters with letters and numbers</p>
            </div>

            <div className="flex items-start">
              <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleInputChange}
                className="mt-1 w-4 h-4 rounded bg-surface-highest border-none focus:ring-brand-primary text-brand-primary" />
              <label htmlFor="agreeToTerms" className="ml-3 text-sm text-text-secondary">
                I agree to the{' '}
                <Link href="/terms" className="text-brand-light hover:text-brand-primary">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-light hover:text-brand-primary">Privacy Policy</Link>
              </label>
            </div>

            <div className="flex items-start">
              <input id="smsOptIn" name="smsOptIn" type="checkbox" checked={formData.smsOptIn} onChange={handleInputChange}
                className="mt-1 w-4 h-4 rounded bg-surface-highest border-none focus:ring-brand-primary text-brand-primary" />
              <label htmlFor="smsOptIn" className="ml-3 text-sm text-text-secondary">
                Send me account notifications by SMS (onboarding updates, trial status, billing).
                Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out. See{' '}
                <Link href="/sms-terms" className="text-brand-light hover:text-brand-primary">SMS Terms</Link>.
              </label>
            </div>

            <button type="submit" disabled={!isFormValid || isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-colors ${
                isFormValid && !isLoading
                  ? 'bg-brand-primary hover:bg-[#0060d0] text-brand-on'
                  : 'bg-surface-high text-text-muted cursor-not-allowed'
              }`}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </button>

            <div className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-light hover:text-brand-primary font-semibold">Sign in</Link>
            </div>
          </form>

          {/* Trust Signals */}
          <div className="mt-8 pt-6 border-t border-[rgba(65,71,84,0.15)]">
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              {['14-day free trial', 'Keep your number', 'Live in 2 minutes', 'Undo anytime with *73'].map(signal => (
                <div key={signal} className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-brand-primary" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center bg-surface-low px-12">
        <div className="max-w-md">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
              Your number. Your AI.
            </h2>
            <p className="text-text-secondary text-lg">
              Forward your business line and let AI answer every call, book appointments, and keep your schedule full
            </p>
          </div>

          <div className="space-y-8">
            {[
              { title: 'Never Miss a Call', desc: 'AI answers 24/7 so you never lose a client to voicemail' },
              { title: 'Book More Appointments', desc: 'Clients book instantly, even when you\'re with someone' },
              { title: 'Reduce No-Shows', desc: 'Automated SMS reminders keep your schedule full (Pro plan)' },
            ].map(benefit => (
              <div key={benefit.title} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-text-primary font-semibold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-text-secondary">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-surface-med rounded-lg">
            <p className="text-text-secondary text-sm">
              VoiceFly works for any appointment-based business. Set up your AI phone employee
              in under 10 minutes and start capturing every call.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
