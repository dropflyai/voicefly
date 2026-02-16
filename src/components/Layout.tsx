'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  CalendarIcon,
  UsersIcon,
  CogIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  GiftIcon,
  EnvelopeIcon,
  HeartIcon,
  SparklesIcon,
  InboxIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import MobileNavigation from './MobileNavigation'
import CreditMeter from './CreditMeter'
import { FEATURE_FLAGS, shouldShowBeautyFeatures, shouldShowReceptionistFeatures, getFeaturesForBusinessType, type BusinessType } from '../lib/feature-flags'
import { getAuthenticatedUser } from '../lib/auth-utils'

// Common navigation items
const commonNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
]

// Beauty salon specific features
const beautyFeatures = [
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Services', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
  { name: 'Staff', href: '/dashboard/staff', icon: UsersIcon },
]

// General business/receptionist features
const receptionistFeatures = [
  { name: 'Call Log', href: '/dashboard/calls', icon: PhoneIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: InboxIcon },
  { name: 'Leads', href: '/dashboard/leads', icon: UserGroupIcon },
]

// Professional+ features
const professionalFeatures = [
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon },
  { name: 'Loyalty Program', href: '/dashboard/loyalty', icon: HeartIcon },
  { name: 'Email Marketing', href: '/dashboard/marketing', icon: EnvelopeIcon },
]

// Business+ features
const businessFeatures = [
  { name: 'Locations', href: '/dashboard/locations', icon: BuildingStorefrontIcon },
]

// Shared features (for all business types)
const sharedFeatures = [
  { name: 'Voice AI', href: '/dashboard/voice-ai', icon: PhoneIcon },
  { name: 'Phone Employees', href: '/dashboard/employees', icon: UsersIcon },
  { name: 'AI Agents', href: '/dashboard/agents', icon: SparklesIcon },
  { name: 'Agent Config', href: '/dashboard/agent', icon: CogIcon },
  { name: 'Research', href: '/dashboard/research', icon: BeakerIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
]

// Get business-specific features with appropriate terminology
const getBusinessSpecificFeatures = (businessType: BusinessType) => {
  switch (businessType) {
    case 'medical_practice':
      return [
        { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
        { name: 'Procedures', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
        { name: 'Providers', href: '/dashboard/staff', icon: UsersIcon },
        { name: 'Patients', href: '/dashboard/customers', icon: UsersIcon },
      ]
    
    case 'dental_practice':
      return [
        { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
        { name: 'Treatments', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
        { name: 'Dentists', href: '/dashboard/staff', icon: UsersIcon },
        { name: 'Patients', href: '/dashboard/customers', icon: UsersIcon },
      ]
    
    case 'fitness_wellness':
      return [
        { name: 'Classes & Sessions', href: '/dashboard/appointments', icon: CalendarIcon },
        { name: 'Programs', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
        { name: 'Trainers', href: '/dashboard/staff', icon: UsersIcon },
        { name: 'Members', href: '/dashboard/customers', icon: UsersIcon },
      ]
    
    default:
      return beautyFeatures // Fallback to beauty features
  }
}

// Function to get navigation based on business type and plan tier
const getNavigationForBusiness = (subscriptionTier: string, businessType?: string) => {
  const user = getAuthenticatedUser()
  const userBusinessType = user?.businessType || businessType

  // Start with common items
  let navigation = [...commonNavigation]
  
  // Add business-type specific features based on feature flags
  const features = getFeaturesForBusinessType(userBusinessType as BusinessType)
  
  // Beauty salon features
  if (features.appointments && shouldShowBeautyFeatures(userBusinessType)) {
    navigation.push(...beautyFeatures)
  }
  
  // Medical/Dental/Fitness features (they get beauty salon-like features)
  if (features.appointments && !shouldShowBeautyFeatures(userBusinessType)) {
    // These business types need appointment scheduling but with different terminology
    const businessSpecificFeatures = getBusinessSpecificFeatures(userBusinessType as BusinessType)
    navigation.push(...businessSpecificFeatures)
  }
  
  // General receptionist features
  if (shouldShowReceptionistFeatures(userBusinessType)) {
    // Only show if features are enabled
    if (FEATURE_FLAGS.callLogs) {
      navigation.push({ name: 'Call Log', href: '/dashboard/calls', icon: PhoneIcon })
    }
    if (FEATURE_FLAGS.leadManagement) {
      navigation.push({ name: 'Leads', href: '/dashboard/leads', icon: UserGroupIcon })
      navigation.push({ name: 'Campaigns', href: '/dashboard/campaigns', icon: EnvelopeIcon })
    }
    // Messages feature (placeholder for future)
    navigation.push({ name: 'Messages', href: '/dashboard/messages', icon: InboxIcon })
  }
  
  // Add professional features for Professional+ plans
  if (['professional', 'business', 'enterprise'].includes(subscriptionTier)) {
    navigation.push(...professionalFeatures)
  }
  
  // Add business features for Business+ plans
  if (['business', 'enterprise'].includes(subscriptionTier)) {
    // Insert business features before professional features
    const paymentsIndex = navigation.findIndex(item => item.name === 'Payments')
    if (paymentsIndex !== -1) {
      navigation.splice(paymentsIndex, 0, ...businessFeatures)
    } else {
      navigation.push(...businessFeatures)
    }
  }
  
  // Add shared features at the end
  navigation.push(...sharedFeatures)
  
  return navigation
}

// Legacy function for backward compatibility
const getNavigationForPlan = (subscriptionTier: string) => {
  return getNavigationForBusiness(subscriptionTier, 'beauty_salon')
}

interface LayoutProps {
  children: React.ReactNode
  business?: {
    name: string
    subscription_tier: string
  }
}

export default function Layout({ children, business }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <SidebarContent business={business} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop - Enterprise Design */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <SidebarContent business={business} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar - Enterprise Design */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Left side - Mobile menu + Breadcrumb area */}
            <div className="flex items-center">
              <div className="md:hidden">
                <button
                  type="button"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Search bar - Desktop only */}
              <div className="hidden md:flex items-center ml-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers, appointments..."
                    className="w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* Credit Meter */}
              {business?.id && (
                <CreditMeter
                  businessId={business.id}
                  compact={true}
                  showPurchaseButton={true}
                />
              )}

              {/* Notifications - Placeholder */}
              <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* User menu - Placeholder */}
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  {business?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <svg className="hidden md:block h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        businessPlan={business?.subscription_tier as 'starter' | 'professional' | 'business'}
        businessName={business?.name}
      />
    </div>
  )
}

function SidebarContent({ business }: { business?: LayoutProps['business'] }) {
  const pathname = usePathname()
  const user = getAuthenticatedUser()
  const navigation = getNavigationForBusiness(
    business?.subscription_tier || 'starter',
    user?.businessType || 'beauty_salon'
  )

  return (
    <>
      {/* Logo and business info - Enterprise Design */}
      <div className="flex items-center flex-shrink-0 px-4 border-b border-gray-100 pb-4">
        <div className="flex flex-col w-full">
          <div className="flex items-center">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">VoiceFly</h1>
              <p className="text-xs text-gray-500">Business Center</p>
            </div>
          </div>
          {business && (
            <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 truncate">{business.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {getPlanBadge(business.subscription_tier)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Enterprise Design */}
      <nav className="mt-6 flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isUpgradeRequired = isFeatureUpgradeRequired(item.name, business?.subscription_tier || 'starter')

          return (
            <Link
              key={item.name}
              href={isUpgradeRequired ? '/dashboard/settings?tab=billing' : item.href}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                isUpgradeRequired ? 'opacity-60' : ''
              )}
            >
              <item.icon
                className={clsx(
                  "flex-shrink-0 mr-3 h-5 w-5 transition-colors",
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
              {isUpgradeRequired && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  Upgrade
                </span>
              )}
              {isActive && (
                <span className="ml-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade prompts based on plan */}
      {getUpgradePrompt(business?.subscription_tier || 'starter')}
    </>
  )
}

// Helper function to determine if feature requires upgrade
function isFeatureUpgradeRequired(featureName: string, subscriptionTier: string): boolean {
  // Features that require Professional tier or higher
  const professionalFeatures = ['Analytics', 'Payments', 'Loyalty Program', 'Marketing']
  
  // Features that require Business tier or higher  
  const businessFeatures = ['Locations']
  
  // Check Professional features (not available in Starter)
  if (professionalFeatures.includes(featureName)) {
    return subscriptionTier === 'starter'
  }
  
  // Check Business features (not available in Starter or Professional)
  if (businessFeatures.includes(featureName)) {
    return !['business', 'enterprise'].includes(subscriptionTier)
  }
  
  return false
}

// Helper function to get plan badge - Enterprise Design
function getPlanBadge(subscriptionTier: string) {
  const badges = {
    starter: (
      <span className="inline-flex items-center text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5"></span>
        Starter
      </span>
    ),
    professional: (
      <span className="inline-flex items-center text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
        Professional
      </span>
    ),
    business: (
      <span className="inline-flex items-center text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span>
        Business
      </span>
    ),
    enterprise: (
      <span className="inline-flex items-center text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
        Enterprise
      </span>
    )
  }
  return badges[subscriptionTier as keyof typeof badges] || null
}

// Helper function to get upgrade prompt based on plan - Enterprise Design
function getUpgradePrompt(subscriptionTier: string) {
  if (subscriptionTier === 'starter') {
    return (
      <div className="flex-shrink-0 p-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Upgrade to Professional</h3>
              <p className="text-xs mt-1 text-blue-700">
                Unlock analytics, payments, and loyalty features
              </p>
              <Link href="/dashboard/settings?tab=billing">
                <button className="mt-3 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (subscriptionTier === 'professional') {
    return (
      <div className="flex-shrink-0 p-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-900">Scale with Business</h3>
              <p className="text-xs mt-1 text-indigo-700">
                Multi-location support and custom AI training
              </p>
              <Link href="/dashboard/settings?tab=billing">
                <button className="mt-3 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}