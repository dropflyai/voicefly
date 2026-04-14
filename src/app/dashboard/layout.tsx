'use client'

import { useEffect, useState } from 'react'
import MayaChat from '@/components/MayaChat'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false)

  useEffect(() => {
    setShouldAutoOpen(pathname === '/dashboard')
  }, [pathname])

  return (
    <>
      {children}
      <MayaChat mode="dashboard" autoOpenForNewUser={shouldAutoOpen} />
    </>
  )
}
