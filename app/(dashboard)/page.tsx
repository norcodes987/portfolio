import { Suspense } from 'react'
import { connection } from 'next/server'
import { getIbkrHoldings, getMoomooHoldings, getOverview, getSgHoldings } from '@/lib/sheets/fetch'
import { getUsdSgdRate } from '@/lib/fx'
import { aggregateBySector, computeBrokerWeights } from '@/lib/aggregate'
import { StatCard } from '@/components/stat-card'
import { HoldingsTable } from '@/components/holdings-table'
import { AllocationChart } from '@/components/allocation-chart'
import { WeightBars } from '@/components/weight-bars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshButton } from './refresh-button'

export default function OverviewPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <RefreshButton />
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <OverviewContent />
      </Suspense>
    </main>
  )
}

async function OverviewContent() {
  // The dashboard is always rendered per-request (auth-gated, always-fresh);
  // this stops the build from prerendering it against the live Sheet.
  await connection()

  const [overview, fxRate, ibkr, moomoo, sg] = await Promise.all([
    getOverview(),
    getUsdSgdRate(),
    getIbkrHoldings(),
    getMoomooHoldings(),
    getSgHoldings(),
  ])

  const allHoldings = [...ibkr, ...moomoo, ...sg]
  const sectorSlices = aggregateBySector(ibkr)
  const brokerWeights = computeBrokerWeights(allHoldings)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="USD/SGD" value={fxRate.toFixed(3)} />
        <StatCard label="Market value (USD)" value={`$${overview.marketValueUsd.toLocaleString()}`} />
        <StatCard
          label="Unrealized P&L (USD)"
          value={`$${overview.unrealizedPnlUsd.toLocaleString()}`}
          deltaLabel={`${overview.unrealizedPnlPctUsd >= 0 ? '+' : ''}${overview.unrealizedPnlPctUsd.toFixed(2)}%`}
          deltaPositive={overview.unrealizedPnlPctUsd >= 0}
        />
        <StatCard label="Current value (SGD)" value={`S$${overview.currentValueSgd.toLocaleString()}`} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ibkr">IBKR</TabsTrigger>
          <TabsTrigger value="moomoo">MooMoo</TabsTrigger>
          <TabsTrigger value="sg">SG</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <HoldingsTable holdings={allHoldings} />
        </TabsContent>
        <TabsContent value="ibkr">
          <HoldingsTable holdings={ibkr} />
        </TabsContent>
        <TabsContent value="moomoo">
          <HoldingsTable holdings={moomoo} />
        </TabsContent>
        <TabsContent value="sg">
          <HoldingsTable holdings={sg} />
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-500">Sector allocation</h2>
          <AllocationChart slices={sectorSlices} />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-500">Portfolio weight</h2>
          <WeightBars weights={brokerWeights} />
        </section>
      </div>
    </div>
  )
}
