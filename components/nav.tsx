'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

interface NavItem {
  href: string
  label: string
  icon: Icon
  disabled?: boolean
}

function IconOverview(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}
function IconWatchlist(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconTradeLog(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  )
}
function IconResearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  )
}
function IconPerformance(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 17 10 11l4 4 6-7" />
      <path d="M15 5h5v5" />
    </svg>
  )
}

const primary: NavItem[] = [
  { href: '/', label: 'Overview', icon: IconOverview },
  { href: '/watchlist', label: 'Watchlist', icon: IconWatchlist },
  { href: '/trade-log', label: 'Trade Log', icon: IconTradeLog },
]
const soon: NavItem[] = [
  { href: '/research', label: 'Research', icon: IconResearch, disabled: true },
  { href: '/performance', label: 'Performance', icon: IconPerformance, disabled: true },
]
const allItems = [...primary, ...soon]

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-slate-300 md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <IconLogo className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-white">Portfolio</span>
            <span className="block text-[11px] uppercase tracking-wider text-slate-500">Nor Automates</span>
          </span>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-2">
          <NavGroup label="Views">
            {primary.map((item) => (
              <SidebarLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </NavGroup>
          <NavGroup label="Soon">
            {soon.map((item) => (
              <SidebarLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </NavGroup>
        </nav>

        <div className="px-5 py-4 text-[11px] leading-relaxed text-slate-500">
          <span className="block font-medium text-slate-400">Auto-syncs weekdays</span>
          8:00 AM SGT via IBKR
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-800 bg-sidebar text-slate-400">
        {allItems.map((item) => (
          <MobileLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>
    </>
  )
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  disabled,
  active,
}: NavItem & { active: boolean }) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-600"
      >
        <Icon className="h-[18px] w-[18px]" />
        {label}
        <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Soon
        </span>
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-500/10 text-emerald-300'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </Link>
  )
}

function MobileLink({
  href,
  label,
  icon: Icon,
  disabled,
  active,
}: NavItem & { active: boolean }) {
  const inner = (
    <>
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </>
  )
  const base = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-1'

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} text-slate-700`}>
        {inner}
      </span>
    )
  }
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${base} ${active ? 'text-emerald-400' : 'text-slate-500'}`}
    >
      {inner}
    </Link>
  )
}
