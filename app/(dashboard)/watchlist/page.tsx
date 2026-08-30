import { Suspense } from 'react'
import { connection } from 'next/server'
import { getWatchlist } from '@/lib/sheets/fetch'
import { Panel } from '@/components/panel'
import { WatchlistTable } from '@/components/watchlist-table'

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Watchlist</h1>
      <p className="mb-5 text-sm text-slate-400">Tickers you&apos;re tracking, held and not-yet-held.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />}>
        <WatchlistContent />
      </Suspense>
    </div>
  )
}

async function WatchlistContent() {
  await connection()
  const items = await getWatchlist()
  return (
    <Panel bodyClassName="px-1 py-1 sm:px-4 sm:py-2">
      <WatchlistTable items={items} />
    </Panel>
  )
}
