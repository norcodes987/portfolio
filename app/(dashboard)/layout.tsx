import { Nav } from '@/components/nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <Nav />
      <div className="flex-1 pt-[var(--safe-top)] pb-[calc(4rem+var(--safe-bottom))] md:pt-0 md:pb-0">
        {children}
      </div>
    </div>
  )
}
