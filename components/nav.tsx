'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  disabled?: boolean
}

const links: NavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/research', label: 'Research', disabled: true },
  { href: '/trade-log', label: 'Trade Log' },
  { href: '/performance', label: 'Performance', disabled: true },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="hidden w-56 shrink-0 flex-col gap-1 bg-slate-900 p-4 text-slate-200 md:flex">
        {links.map((link) => (
          <NavLink key={link.href} {...link} active={pathname === link.href} />
        ))}
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-white md:hidden dark:bg-zinc-900">
        {links.map((link) => (
          <NavLink key={link.href} {...link} active={pathname === link.href} mobile />
        ))}
      </nav>
    </>
  )
}

function NavLink({
  href,
  label,
  disabled,
  active,
  mobile,
}: NavItem & { active: boolean; mobile?: boolean }) {
  const base = mobile
    ? 'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs'
    : 'flex min-h-11 items-center rounded px-3 py-2 text-sm'

  if (disabled) {
    return (
      <span className={`${base} cursor-not-allowed opacity-40`} aria-disabled="true">
        {label}
        {!mobile && <span className="ml-auto text-[10px]">Soon</span>}
      </span>
    )
  }

  const activeClass = mobile
    ? active
      ? 'text-teal-600'
      : 'text-slate-500'
    : active
      ? 'bg-slate-800 text-white'
      : 'text-slate-300 hover:bg-slate-800'

  return (
    <Link href={href} className={`${base} ${activeClass}`}>
      {label}
    </Link>
  )
}
