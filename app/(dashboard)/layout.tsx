import { Nav } from '@/components/nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Nav />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
    </div>
  )
}
