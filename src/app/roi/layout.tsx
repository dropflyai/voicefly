import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ROI Calculator | VoiceFly - How Much Are Missed Calls Costing You?',
  description:
    'Calculate how much revenue your business loses from missed calls and see how fast VoiceFly pays for itself with our interactive ROI calculator.',
}

export default function ROILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
