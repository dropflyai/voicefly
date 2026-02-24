/**
 * Widget layout — intentionally minimal.
 * The widget runs inside an iframe so it must NOT include the root
 * layout's SecurityProvider, header, or global navigation.
 */
export const metadata = {
  title: 'Chat',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children
}
