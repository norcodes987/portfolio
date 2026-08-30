import { Suspense } from 'react'
import { connection } from 'next/server'
import { getIbkrHoldings, getMoomooHoldings, getOverview, getSgHoldings } from '@/lib/sheets/fetch'
import { getUsdSgdRate } from '@/lib/fx'
import { aggregateBySector, computeBrokerWeights, summarizeHoldings } from '@/lib/aggregate'
import type { Holding } from '@/lib/sheets/types'
import { StatCard } from '@/components/stat-card'
import { Panel } from '@/components/panel'
import { PnlPill } from '@/components/pnl-pill'
import { HoldingsTable } from '@/components/holdings-table'
import { AllocationChart } from '@/components/allocation-chart'
import { WeightBars } from '@/components/weight-bars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshButton } from './refresh-button'

const usd = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const sgd = (n: number) =>
  `S$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <Suspense fallback={<span className="text-sm text-slate-400">Loading rate…</span>}>
          <RateBadge />
        </Suspense>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:inline">Live from Google Sheets</span>
          <RefreshButton />
        </div>
      </header>

      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </div>
  )
}

async function RateBadge() {
  await connection()
  const rate = await getUsdSgdRate()
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
      <span className="font-semibold text-slate-500">USD / SGD</span>
      <span className="font-numeric font-semibold text-slate-900">{rate.toFixed(3)}</span>
    </span>
  )
}

async function OverviewContent() {
  // The dashboard is always rendered per-request (auth-gated, always-fresh);
  // this stops the build from prerendering it against the live Sheet.
  await connection()

  const [overview, fxRate, ibkrAll, moomoo, sg] = await Promise.all([
    getOverview(),
    getUsdSgdRate(),
    getIbkrHoldings(),
    getMoomooHoldings(),
    getSgHoldings(),
  ])

  const held = (h: Holding) => h.status === 'Held'
  const ibkr = ibkrAll.filter(held)
  const moomooHeld = moomoo.filter(held)
  const sgHeld = sg.filter(held)
  const allHoldings = [...ibkr, ...moomooHeld, ...sgHeld]

  const ibkrSum = summarizeHoldings(ibkr)
  const moomooSum = summarizeHoldings(moomooHeld)
  const sgSum = summarizeHoldings(sgHeld)

  const usdMarketValue = overview.marketValueUsd
  const sgdValue = overview.currentValueSgd
  const netWorthSgd = usdMarketValue * fxRate + sgdValue

  const pnlSgd = overview.unrealizedPnlUsd * fxRate + overview.unrealizedPnlSgd
  const investedSgd = overview.totalInvestedUsd * fxRate + overview.totalInvestedSgd
  const pnlPctBlended = investedSgd > 0 ? (pnlSgd / investedSgd) * 100 : 0

  const sectorSlices = aggregateBySector(ibkr)
  const brokerWeights = computeBrokerWeights(allHoldings)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Net Worth" value={sgd(netWorthSgd)} sub="SGD equivalent" />
        <StatCard label="USD Portfolio" value={usd(usdMarketValue)} sub={`≈ ${sgd(usdMarketValue * fxRate)}`} />
        <StatCard label="SGD Portfolio" value={sgd(sgdValue)} sub="SG accounts" />
        <StatCard
          label="Unrealised P&L"
          value={`${pnlSgd >= 0 ? '+' : '-'}${sgd(Math.abs(pnlSgd))}`}
          deltaLabel={`${pct(pnlPctBlended)} all-time`}
          deltaPositive={pnlSgd >= 0}
          accent
        />
      </div>

      {/* Account groups */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <Panel
          title={<GroupTitle badge="USD" label="USD Accounts" tone="sky" />}
          className="lg:col-span-2"
          bodyClassName="grid grid-cols-2 gap-2.5 p-3 sm:gap-4 sm:p-5"
        >
          <AccountTile name="IBKR" value={usd(ibkrSum.marketValue)} sub={`≈ ${sgd(ibkrSum.marketValue * fxRate)}`} summary={ibkrSum} />
          <AccountTile name="MooMoo" value={usd(moomooSum.marketValue)} sub={`≈ ${sgd(moomooSum.marketValue * fxRate)}`} summary={moomooSum} />
        </Panel>
        <Panel title={<GroupTitle badge="SGD" label="SGD Accounts" tone="amber" />} bodyClassName="p-3 sm:p-5">
          <AccountTile name="SG Portfolio" value={sgd(sgSum.marketValue)} summary={sgSum} />
        </Panel>
      </div>

      {/* Holdings + charts */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Holdings"
          action={`${allHoldings.length} position${allHoldings.length === 1 ? '' : 's'}`}
          bodyClassName="px-1 pb-1 pt-3 sm:px-4 sm:pb-2"
        >
          <Tabs defaultValue="all">
            <TabsList className="px-1">
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
              <HoldingsTable holdings={moomooHeld} />
            </TabsContent>
            <TabsContent value="sg">
              <HoldingsTable holdings={sgHeld} />
            </TabsContent>
          </Tabs>
        </Panel>

        <div className="space-y-4 sm:space-y-6">
          <Panel title="Sector Allocation" action="IBKR holdings">
            <AllocationChart slices={sectorSlices} />
          </Panel>
          <Panel title="Portfolio Weight">
            <WeightBars weights={brokerWeights} />
          </Panel>
        </div>
      </div>
    </div>
  )
}

function GroupTitle({ badge, label, tone }: { badge: string; label: string; tone: 'sky' | 'amber' }) {
  const toneClass =
    tone === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
  return (
    <span className="flex items-center gap-2">
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${toneClass}`}>{badge}</span>
      {label}
    </span>
  )
}

function AccountTile({
  name,
  value,
  sub,
  summary,
}: {
  name: string
  value: string
  sub?: string
  summary: { unrealizedPnl: number; unrealizedPnlPct: number }
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">{name}</p>
      <p className="mt-1 font-numeric text-lg font-semibold text-slate-900 sm:mt-1.5 sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">{sub}</p>}
      <div className="mt-2 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
        <PnlPill value={summary.unrealizedPnl} format="currency" />
        <PnlPill value={summary.unrealizedPnlPct} format="percent" />
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white sm:h-28" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}
