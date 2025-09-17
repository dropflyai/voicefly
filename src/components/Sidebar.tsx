"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Phone, TrendingUp, MessageSquare,
  Settings, Users, Calendar, BarChart3, FileText,
  Plug, ChevronLeft, ChevronRight, Search, Bell,
  Menu, X, Mic, Target, DollarSign, Database,
  Workflow, UserCheck, Mail, Bot, Zap, CreditCard,
  MapPin, Gift, Brain, Headphones, UserPlus
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigation = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Voice AI',
      items: [
        { name: 'Live Calls', href: '/calls/live', icon: Phone },
        { name: 'Call History', href: '/calls/history', icon: MessageSquare },
        { name: 'Voice Scripts', href: '/scripts', icon: Mic },
        { name: 'AI Training', href: '/ai-training', icon: Brain },
      ]
    },
    {
      title: 'Lead Management',
      items: [
        { name: 'Lead Database', href: '/leads', icon: Database },
        { name: 'Campaigns', href: '/campaigns', icon: Target },
        { name: 'Qualification', href: '/qualification', icon: UserCheck },
        { name: 'Lead Sources', href: '/lead-sources', icon: UserPlus },
      ]
    },
    {
      title: 'Appointments',
      items: [
        { name: 'Appointments', href: '/appointments', icon: Calendar },
        { name: 'Services', href: '/services', icon: Settings },
        { name: 'Staff', href: '/staff', icon: Users },
        { name: 'Customers', href: '/customers', icon: Headphones },
      ]
    },
    {
      title: 'Business',
      items: [
        { name: 'Revenue', href: '/revenue', icon: DollarSign },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Loyalty Program', href: '/loyalty', icon: Gift },
        { name: 'Locations', href: '/locations', icon: MapPin },
      ]
    },
    {
      title: 'Automation',
      items: [
        { name: 'Workflows', href: '/workflows', icon: Workflow },
        { name: 'Email Marketing', href: '/email', icon: Mail },
        { name: 'Integrations', href: '/integrations', icon: Plug },
        { name: 'Automations', href: '/automations', icon: Zap },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-gray-900 text-white transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64 lg:translate-x-0 lg:static lg:z-30
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className={`flex items-center ${isCollapsed && 'lg:justify-center'}`}>
              {!isCollapsed ? (
                <div>
                  <h1 className="text-xl font-bold">VoiceFly</h1>
                  <p className="text-xs text-gray-400">Enterprise Edition</p>
                </div>
              ) : (
                <span className="text-xl font-bold hidden lg:block">V</span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto lg:hidden text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-md hover:bg-gray-800"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navigation.map((section) => (
              <div key={section.title} className="mb-6">
                {!isCollapsed && (
                  <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            flex items-center px-4 py-2.5 text-sm font-medium transition-colors
                            ${isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }
                          `}
                        >
                          <Icon className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4">
            <div className={`flex items-center ${isCollapsed && 'justify-center'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}