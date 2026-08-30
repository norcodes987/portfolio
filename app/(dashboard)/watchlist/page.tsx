import { Suspense } from 'react'
import { connection } from 'next/server'
import { getWatchlist } from '@/lib/sheets/fetch'
import { WatchlistTable } from '@/components/watchlist-table'

export default function WatchlistPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Watchlist</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <WatchlistContent />
      </Suspense>
    </main>
  )
}

async function WatchlistContent() {
  await connection()
  const items = await getWatchlist()
  return <WatchlistTable items={items} />
}
