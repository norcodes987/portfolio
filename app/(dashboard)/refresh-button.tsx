'use client'

import { useTransition } from 'react'
import { refreshPortfolioData } from './actions'

export function RefreshButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => refreshPortfolioData())}
      className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {isPending ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
