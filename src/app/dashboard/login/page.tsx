'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { AuthService } from '@/lib/auth-service'

export default function BusinessLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await AuthService.login({ email, password })

      // Set auth in localStorage
      localStorage.setItem('authenticated_business_id', result.primaryBusinessId)
      localStorage.setItem('authenticated_user_email', result.user.email)

      const primaryBusiness = result.user.businesses.find(
        b => b.id === result.primaryBusinessId
      )
      if (primaryBusiness) {
        localStorage.setItem('authenticated_business_name', primaryBusiness.name)
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-surface-low rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Business Dashboard</h1>
          <p className="text-text-secondary mt-2">Sign in to manage your business</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#93000a]/5 border border-red-200 rounded-lg text-[#ffb4ab] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your business email"
              className="w-full px-4 py-3 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-[rgba(65,71,84,0.2)] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-brand-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-purple-400 hover:text-purple-400 font-medium">
              Sign up free
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
