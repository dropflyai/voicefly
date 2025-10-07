import OmnipresentResearchProvider from '@/components/OmnipresentResearch'
import AIChatbot from '@/components/AIChatbot'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OmnipresentResearchProvider>
      {children}
      <AIChatbot />
    </OmnipresentResearchProvider>
  )
}
