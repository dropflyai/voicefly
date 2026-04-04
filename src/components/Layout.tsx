'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
  CreditCardIcon,
  CogIcon,
  PuzzlePieceIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import MobileNavigation from './MobileNavigation'
import { getAuthenticatedUser, logout } from '../lib/auth-utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Phone Employees', href: '/dashboard/employees', icon: PhoneIcon },
  { name: 'Call Log', href: '/dashboard/voice-ai', icon: PhoneIcon },
  { name: 'SMS', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Phone Messages', href: '/dashboard/phone-messages', icon: EnvelopeIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBagIcon },
  { name: 'Calendar', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Integrations', href: '/dashboard/integrations', icon: PuzzlePieceIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCardIcon },
]

interface LayoutProps {
  children: React.ReactNode
  business?: {
    name: string
    subscription_tier: string
  } | null
}

export default function Layout({ children, business }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
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
            <div className="fixed inset-0 bg-black/60" />
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
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-surface-lowest">
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
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
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

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-surface-lowest">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <SidebarContent business={business} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 glass">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="md:hidden">
                <button
                  type="button"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-high transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserMenu businessName={business?.name} />
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

function UserMenu({ businessName }: { businessName?: string }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const user = getAuthenticatedUser()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-high transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-brand-on text-sm font-medium">
          {businessName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <svg className="hidden md:block h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-high rounded-lg sonic-shadow py-1 z-50">
          <div className="px-4 py-3 border-b border-[rgba(65,71,84,0.15)]">
            <p className="text-sm font-medium text-text-primary truncate">
              {businessName || 'Your Business'}
            </p>
            {user?.email && (
              <p className="text-xs text-text-muted truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-surface-highest transition-colors"
            onClick={() => setOpen(false)}
          >
            <CogIcon className="h-4 w-4 mr-2 text-text-muted" />
            Settings
          </Link>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-[#ffb4ab] hover:bg-[#93000a]/10 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

function SidebarContent({ business }: { business?: LayoutProps['business'] }) {
  const pathname = usePathname()

  return (
    <>
      {/* Logo and business info */}
      <div className="flex items-center flex-shrink-0 px-4 border-b border-[rgba(65,71,84,0.15)] pb-4">
        <div className="flex flex-col w-full">
          <div className="flex items-center">
            <div className="h-9 w-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm">
              <PhoneIcon className="h-5 w-5 text-brand-on" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-manrope)] tracking-tight">VoiceFly</h1>
              <p className="text-xs text-text-muted">AI Phone Employees</p>
            </div>
          </div>
          {business && (
            <div className="mt-3 px-3 py-2 bg-surface-low rounded-lg">
              <p className="text-sm font-medium text-text-primary truncate">{business.name}</p>
              <p className="text-xs text-text-muted capitalize mt-0.5">
                {business.subscription_tier || 'Starter'} Plan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-brand-primary/10 text-brand-light'
                  : 'text-text-secondary hover:bg-surface-low hover:text-text-primary'
              )}
            >
              <item.icon
                className={clsx(
                  "flex-shrink-0 mr-3 h-5 w-5 transition-colors",
                  isActive ? 'text-brand-primary' : 'text-text-muted group-hover:text-text-secondary'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <span className="ml-2 w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
