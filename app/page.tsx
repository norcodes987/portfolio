import { Suspense } from 'react'
import { connection } from 'next/server'
import { getOverview } from '@/lib/sheets/fetch'
import { getUsdSgdRate } from '@/lib/fx'
import { RefreshButton } from './refresh-button'

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <RefreshButton />
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <Summary />
      </Suspense>
    </main>
  )
}

async function Summary() {
  // The dashboard is always rendered per-request (auth-gated, always-fresh);
  // this stops the build from trying to prerender it against the live Sheet.
  await connection()
  const [overview, fxRate] = await Promise.all([getOverview(), getUsdSgdRate()])

  return (
    <dl className="grid grid-cols-2 gap-4">
      <div>
        <dt className="text-sm text-gray-500">USD/SGD</dt>
        <dd className="text-lg font-medium">{fxRate.toFixed(3)}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Market value (USD)</dt>
        <dd className="text-lg font-medium">${overview.marketValueUsd.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Unrealized P&amp;L (USD)</dt>
        <dd className="text-lg font-medium">${overview.unrealizedPnlUsd.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500">Current value (SGD)</dt>
        <dd className="text-lg font-medium">S${overview.currentValueSgd.toLocaleString()}</dd>
      </div>
    </dl>
  )
}
