'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Bars3Icon, 
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  HomeIcon,
  MapPinIcon,
  HeartIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  planTier?: 'starter' | 'professional' | 'business'
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Staff', href: '/dashboard/staff', icon: UsersIcon },
  { name: 'Locations', href: '/dashboard/locations', icon: MapPinIcon, planTier: 'business' },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon, planTier: 'professional' },
  { name: 'Loyalty', href: '/dashboard/loyalty', icon: HeartIcon, planTier: 'professional' },
  { name: 'Marketing', href: '/dashboard/marketing', icon: EnvelopeIcon, planTier: 'professional' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, planTier: 'professional' },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

interface MobileNavigationProps {
  businessPlan?: 'starter' | 'professional' | 'business'
  businessName?: string
}

export default function MobileNavigation({ 
  businessPlan = 'starter', 
  businessName = 'Your Business' 
}: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const canAccessFeature = (planTier?: string) => {
    if (!planTier) return true
    
    const planLevels = {
      starter: 1,
      professional: 2,
      business: 3
    }
    
    const currentLevel = planLevels[businessPlan]
    const requiredLevel = planLevels[planTier as keyof typeof planLevels]
    
    return currentLevel >= requiredLevel
  }

  const filteredNavigation = navigation.filter(item => canAccessFeature(item.planTier))

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{businessName}</h2>
                <p className="text-sm text-gray-500 capitalize">{businessPlan} Plan</p>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close navigation menu"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-6 py-6">
              <div className="space-y-2">
                {filteredNavigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center px-4 py-3 text-gray-700 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-500'
                          : 'hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mr-3 ${
                        isActive ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                      {item.planTier && (
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          item.planTier === 'business' 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.planTier === 'business' ? 'Business' : 'Pro'}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Upgrade prompt for limited plans */}
            {businessPlan !== 'business' && (
              <div className="p-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                  <h3 className="font-semibold text-sm mb-1">Unlock More Features</h3>
                  <p className="text-xs text-purple-100 mb-3">
                    Upgrade to access advanced tools and integrations
                  </p>
                  <Link
                    href="/dashboard/settings/billing"
                    onClick={closeMenu}
                    className="inline-block bg-white text-purple-600 text-xs font-semibold px-3 py-1 rounded-md hover:bg-purple-50 transition-colors"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <span>Powered by</span>
                <span className="ml-1 font-semibold text-purple-600">DropFly AI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}