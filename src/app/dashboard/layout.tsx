import OmnipresentResearchProvider from '@/components/OmnipresentResearch'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OmnipresentResearchProvider>
      {children}
    </OmnipresentResearchProvider>
  )
}
