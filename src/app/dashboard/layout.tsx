'use client'

import { useEffect, useState } from 'react'
import DashboardAssistant from '@/components/DashboardAssistant'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false)

  // Check if we should auto-open on the main dashboard page for new users
  useEffect(() => {
    // Only consider auto-opening on the main dashboard page
    if (pathname === '/dashboard') {
      // Let DashboardAssistant handle the logic based on onboarding step
      // We just signal that it's allowed to auto-open
      setShouldAutoOpen(true)
    } else {
      setShouldAutoOpen(false)
    }
  }, [pathname])

  return (
    <>
      {children}
      <DashboardAssistant autoOpenForNewUser={shouldAutoOpen} />
    </>
  )
}
