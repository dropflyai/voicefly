"use client"

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Phone, AlertCircle, Shield } from 'lucide-react'
import Link from 'next/link'
import { AuthService } from '../../lib/auth-service'
import { supabase } from '../../lib/supabase-client'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { user, primaryBusinessId } = await AuthService.login({
        email: formData.email,
        password: formData.password
      })

      const { BusinessAPI } = await import('../../lib/supabase')
      const business = await BusinessAPI.getBusiness(primaryBusinessId)
      if (!business) throw new Error('Business not found')

      localStorage.setItem('authenticated_business_id', primaryBusinessId)
      localStorage.setItem('authenticated_user_email', user.email)
      localStorage.setItem('authenticated_business_name', business.name)
      localStorage.setItem('authenticated_business_type', business.business_type)

      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const isFormValid = formData.email && formData.password

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) setError(error.message || 'Google Sign-In failed.')
    } catch (err: any) { setError(err?.message || 'Google Sign-In failed.') }
  }

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      })
      if (error) setError('Apple Sign-In not yet configured. Please use email/password.')
    } catch { setError('Apple Sign-In not yet configured. Please use email/password.') }
  }

  return (
    <div className="min-h-screen bg-surface flex font-[family-name:var(--font-inter)]">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="flex items-center space-x-2 mb-8">
            <Phone className="h-6 w-6 text-brand-primary" />
            <span className="text-2xl font-bold text-text-primary font-[family-name:var(--font-manrope)]">VoiceFly</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-2">Welcome back</h1>
            <p className="text-text-secondary">Sign in to your VoiceFly account</p>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 bg-surface-high rounded-lg text-text-primary hover:bg-surface-highest transition-colors">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={handleAppleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 bg-surface-high rounded-lg text-text-primary hover:bg-surface-highest transition-colors">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(65,71,84,0.15)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-muted">or continue with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#93000a]/10 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ffb4ab] mr-2" />
              <span className="text-[#ffb4ab] text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange}
                className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 border-none"
                placeholder="your@email.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange}
                  className="w-full px-3 py-3 bg-surface-highest text-text-primary placeholder-text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/50 pr-10 border-none"
                  placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleInputChange}
                  className="w-4 h-4 rounded bg-surface-highest border-none focus:ring-brand-primary text-brand-primary" />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-text-secondary">Remember me</label>
              </div>
              <Link href="mailto:tony@dropfly.io?subject=Password%20Reset" className="text-sm text-brand-light hover:text-brand-primary transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={!isFormValid || isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-colors ${
                isFormValid && !isLoading ? 'bg-brand-primary hover:bg-[#0060d0] text-brand-on' : 'bg-surface-high text-text-muted cursor-not-allowed'
              }`}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>Sign in <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </button>

            <div className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-brand-light hover:text-brand-primary font-semibold">Start your trial</Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-center space-x-4 text-xs text-text-muted">
              <span className="flex items-center"><Shield className="h-3 w-3 mr-1 text-brand-primary" />SOC 2 Compliant</span>
              <span className="flex items-center"><Shield className="h-3 w-3 mr-1 text-brand-primary" />HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center bg-surface-low px-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight mb-4">
            Your AI employees are working.
          </h2>
          <p className="text-text-secondary text-lg mb-10">
            Sign in to see calls answered, appointments booked, and leads captured.
          </p>

          <div className="bg-surface-med rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-text-primary font-semibold font-[family-name:var(--font-manrope)]">Today&apos;s Snapshot</h3>
              <span className="text-brand-light text-sm font-medium">Live</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-muted">Calls Handled</div>
                <div className="text-text-primary font-bold text-2xl font-[family-name:var(--font-manrope)]">47</div>
              </div>
              <div>
                <div className="text-text-muted">Appointments</div>
                <div className="text-text-primary font-bold text-2xl font-[family-name:var(--font-manrope)]">12</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-text-muted text-sm">Need help? <Link href="mailto:tony@dropfly.io" className="text-brand-light hover:text-brand-primary transition-colors">Contact support</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
