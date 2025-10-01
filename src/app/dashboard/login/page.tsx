'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function BusinessLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simple test login - in production this would verify credentials
    const testAccounts = {
      'bella@bellasnails.com': {
        businessId: 'bb18c6ca-7e97-449d-8245-e3c28a6b6971',
        businessName: "Bella's Nails Studio"
      },
      'demo@example.com': {
        businessId: '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad',
        businessName: 'Demo Beauty Salon'
      },
      'admin@test.com': {
        businessId: '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad',
        businessName: 'Test Salon'
      }
    }

    const account = testAccounts[email.toLowerCase() as keyof typeof testAccounts]
    
    if (account) {
      // Set auth in localStorage
      localStorage.setItem('authenticated_business_id', account.businessId)
      localStorage.setItem('authenticated_business_name', account.businessName)
      localStorage.setItem('authenticated_user_email', email)
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } else {
      alert('Invalid email. Try:\n• bella@bellasnails.com\n• demo@example.com\n• admin@test.com')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your salon</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your business email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Any password (not checked)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Password not required for demo</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Test Accounts:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• bella@bellasnails.com (Bella's Nails)</li>
            <li>• demo@example.com (Demo Salon)</li>
            <li>• admin@test.com (Test Salon)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}