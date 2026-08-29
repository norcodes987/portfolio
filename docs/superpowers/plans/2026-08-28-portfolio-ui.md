# Portfolio Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5 nav tabs (Overview, Watchlist, Research, Trade Log, Performance-stub) on top of the Foundation plan, using a DRY component core (`<DataTable>`, `<StatCard>`, `<AllocationChart>`, `<WeightBars>`) and a mobile-first nav shell, and make the app an installable PWA.

**Architecture:** Server Component pages fetch data via the Foundation plan's `lib/sheets/fetch.ts` / `lib/fx.ts` functions and pass plain (serializable) arrays down to thin Client Component table/chart wrappers. Two new pure-function modules (`lib/aggregate.ts`, `lib/research.ts`) do all data-shaping outside of components, so every component stays presentational and testable with plain props.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, `@tanstack/react-table`, Recharts, `@radix-ui/react-tabs` (hand-wired in the shadcn/ui convention — see Task 1 for why the shadcn CLI itself is skipped).

**Spec:** `docs/superpowers/specs/2026-08-28-portfolio-dashboard-design.md`
**Depends on:** `docs/superpowers/plans/2026-08-28-portfolio-foundation.md` (must be complete and merged first — every task below imports its types and fetch functions).

## Global Constraints

- Same shared-monorepo hazard as the Foundation plan: **never `git add -A` / `git add .`**. Every commit in this plan lists exact paths.
- Functions cannot cross the Server→Client Component prop boundary (only plain serializable data and Server Actions can). This is why column definitions for `<DataTable>` live *inside* each typed Client Component wrapper (`HoldingsTable`, `TradeLogTable`, `WatchlistTable`) instead of being fetched server-side and passed in as props.
- Reuse `refreshPortfolioData` (`app/actions.ts`) and `<RefreshButton>` (`app/refresh-button.tsx`) from the Foundation plan as-is — do not duplicate refresh logic.
- Semantic color rule from the spec: gains/losses are always green/red **and** carry a `+`/`-`/`%` text label — never color alone.
- Touch targets ≥44×44px (`min-h-11` = 2.75rem = 44px in Tailwind's default scale), per the mobile UX guidance gathered during brainstorming.

---

### Task 1: UI dependencies and the shared Tabs primitive

The shadcn CLI (`npx shadcn@latest init`) prompts interactively, which can hang under non-interactive/automated execution. Since a Tabs component is the only shadcn primitive this plan needs, this task hand-writes it directly against `@radix-ui/react-tabs` — the same headless library shadcn's own generated `tabs.tsx` wraps — producing an equivalent result with no CLI risk.

**Files:**
- Create: `components/ui/tabs.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — Task 9 (Overview page) is the consumer.

- [ ] **Step 1: Install dependencies**

```bash
npm install @tanstack/react-table recharts @radix-ui/react-tabs
```

- [ ] **Step 2: Write the Tabs primitive**

```tsx
// components/ui/tabs.tsx
'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={`flex flex-col gap-2 ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={`inline-flex h-10 items-center rounded-lg bg-gray-100 p-1 ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={`inline-flex min-h-8 flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow ${className ?? ''}`}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={`mt-3 ${className ?? ''}`} {...props} />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 3: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json components/ui/tabs.tsx
git commit -m "feat: add UI dependencies and a hand-wired Radix Tabs primitive"
```

---

### Task 2: Pure aggregation helpers (`lib/aggregate.ts`)

**Files:**
- Create: `lib/aggregate.ts`
- Test: `lib/__tests__/aggregate.test.ts`

**Interfaces:**
- Consumes: `Holding` from `lib/sheets/types.ts` (Foundation Task 8)
- Produces: `aggregateBySector(holdings: Holding[], maxSlices?: number): SectorSlice[]` where `SectorSlice = { sector: string; value: number }`; `computeBrokerWeights(holdings: Holding[]): BrokerWeight[]` where `BrokerWeight = { broker: Holding['broker']; pct: number }`. Task 7 (`AllocationChart`, `WeightBars`) and Task 9 (Overview page) are the consumers.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/aggregate.test.ts
import { aggregateBySector, computeBrokerWeights } from '../aggregate'
import type { Holding } from '../sheets/types'

function holding(overrides: Partial<Holding>): Holding {
  return {
    ticker: 'X',
    name: 'X',
    broker: 'IBKR',
    status: 'Held',
    shares: 1,
    avgCost: 1,
    lastPrice: 1,
    marketValue: 100,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    targetPct: null,
    currency: 'USD',
    ...overrides,
  }
}

describe('aggregateBySector', () => {
  it('sums market value per sector', () => {
    const holdings = [
      holding({ sector: 'Tech', marketValue: 100 }),
      holding({ sector: 'Tech', marketValue: 50 }),
      holding({ sector: 'Healthcare', marketValue: 30 }),
    ]
    expect(aggregateBySector(holdings)).toEqual([
      { sector: 'Tech', value: 150 },
      { sector: 'Healthcare', value: 30 },
    ])
  })

  it('ignores holdings with no market value (watchlist rows)', () => {
    const holdings = [holding({ sector: 'Tech', marketValue: null })]
    expect(aggregateBySector(holdings)).toEqual([])
  })

  it('caps at maxSlices, bucketing the rest into Other', () => {
    const holdings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((sector, i) =>
      holding({ sector, marketValue: 10 - i })
    )
    const result = aggregateBySector(holdings, 6)
    expect(result).toHaveLength(6)
    expect(result[5]).toEqual({ sector: 'Other', value: 4 + 3 }) // F(4) + G(3)
  })
})

describe('computeBrokerWeights', () => {
  it('computes each broker share of total market value', () => {
    const holdings = [
      holding({ broker: 'IBKR', marketValue: 75 }),
      holding({ broker: 'MooMoo', marketValue: 25 }),
    ]
    const weights = computeBrokerWeights(holdings)
    expect(weights).toEqual([
      { broker: 'IBKR', pct: 75 },
      { broker: 'MooMoo', pct: 25 },
    ])
  })

  it('returns an empty array when there is no market value at all', () => {
    expect(computeBrokerWeights([holding({ marketValue: null })])).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/__tests__/aggregate.test.ts`
Expected: FAIL — `Cannot find module '../aggregate'`

- [ ] **Step 3: Implement `lib/aggregate.ts`**

```ts
// lib/aggregate.ts
import type { Holding } from './sheets/types'

export interface SectorSlice {
  sector: string
  value: number
}

export function aggregateBySector(holdings: Holding[], maxSlices = 6): SectorSlice[] {
  const totals = new Map<string, number>()

  for (const holding of holdings) {
    if (holding.marketValue === null) continue
    const sector = holding.sector ?? 'Other'
    totals.set(sector, (totals.get(sector) ?? 0) + holding.marketValue)
  }

  const sorted = [...totals.entries()]
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)

  if (sorted.length <= maxSlices) return sorted

  const top = sorted.slice(0, maxSlices - 1)
  const rest = sorted.slice(maxSlices - 1)
  const otherValue = rest.reduce((sum, slice) => sum + slice.value, 0)
  return [...top, { sector: 'Other', value: otherValue }]
}

export interface BrokerWeight {
  broker: Holding['broker']
  pct: number
}

export function computeBrokerWeights(holdings: Holding[]): BrokerWeight[] {
  const totals = new Map<Holding['broker'], number>()
  let grandTotal = 0

  for (const holding of holdings) {
    if (holding.marketValue === null) continue
    totals.set(holding.broker, (totals.get(holding.broker) ?? 0) + holding.marketValue)
    grandTotal += holding.marketValue
  }

  if (grandTotal === 0) return []

  return [...totals.entries()].map(([broker, value]) => ({
    broker,
    pct: (value / grandTotal) * 100,
  }))
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/__tests__/aggregate.test.ts`
Expected: 5 passed, 5 total

- [ ] **Step 5: Commit**

```bash
git add lib/aggregate.ts lib/__tests__/aggregate.test.ts
git commit -m "feat: add pure sector/broker aggregation helpers"
```

---

### Task 3: `lib/research.ts` (earnings + outlook merge)

**Files:**
- Create: `lib/research.ts`
- Test: `lib/__tests__/research.test.ts`

**Interfaces:**
- Consumes: `EarningsRow`, `OutlookRow` from `lib/sheets/types.ts` (Foundation Task 8)
- Produces: `mergeResearch(earnings: EarningsRow[], outlook: OutlookRow[]): ResearchRow[]` where `ResearchRow = { ticker: string; earnings: EarningsRow | null; outlook: OutlookRow | null }`. Task 11 (Research page) is the consumer.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/research.test.ts
import { mergeResearch } from '../research'
import type { EarningsRow, OutlookRow } from '../sheets/types'

function earnings(ticker: string): EarningsRow {
  return {
    ticker,
    period: 'Q2 2026',
    epsActual: 1,
    epsEstimate: 1,
    epsBeatMiss: 0,
    revenueActual: '$1B',
    revenueEstimate: '$1B',
    revenueBeatMiss: '$0B',
    guidance: 'steady',
    nextEarningsDate: null,
  }
}

function outlook(ticker: string): OutlookRow {
  return { ticker, netMarginTtm: '10%', freeCashFlowTtm: '$1B', managementOutlook: 'stable' }
}

describe('mergeResearch', () => {
  it('joins earnings and outlook rows by ticker, sorted alphabetically', () => {
    const result = mergeResearch([earnings('MSFT'), earnings('GOOG')], [outlook('GOOG'), outlook('MSFT')])
    expect(result.map((r) => r.ticker)).toEqual(['GOOG', 'MSFT'])
    expect(result[0].earnings?.ticker).toBe('GOOG')
    expect(result[0].outlook?.ticker).toBe('GOOG')
  })

  it('includes a ticker with earnings but no outlook', () => {
    const result = mergeResearch([earnings('GOOG')], [])
    expect(result).toEqual([{ ticker: 'GOOG', earnings: earnings('GOOG'), outlook: null }])
  })

  it('includes a ticker with outlook but no earnings', () => {
    const result = mergeResearch([], [outlook('GOOG')])
    expect(result).toEqual([{ ticker: 'GOOG', earnings: null, outlook: outlook('GOOG') }])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/__tests__/research.test.ts`
Expected: FAIL — `Cannot find module '../research'`

- [ ] **Step 3: Implement `lib/research.ts`**

```ts
// lib/research.ts
import type { EarningsRow, OutlookRow } from './sheets/types'

export interface ResearchRow {
  ticker: string
  earnings: EarningsRow | null
  outlook: OutlookRow | null
}

export function mergeResearch(earnings: EarningsRow[], outlook: OutlookRow[]): ResearchRow[] {
  const tickers = new Set([...earnings.map((e) => e.ticker), ...outlook.map((o) => o.ticker)])

  return [...tickers].sort().map((ticker) => ({
    ticker,
    earnings: earnings.find((e) => e.ticker === ticker) ?? null,
    outlook: outlook.find((o) => o.ticker === ticker) ?? null,
  }))
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/__tests__/research.test.ts`
Expected: 3 passed, 3 total

- [ ] **Step 5: Commit**

```bash
git add lib/research.ts lib/__tests__/research.test.ts
git commit -m "feat: add pure earnings/outlook merge for the Research tab"
```

---

### Task 4: `<StatCard>`

**Files:**
- Create: `components/stat-card.tsx`
- Test: `components/__tests__/stat-card.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `StatCard({ label, value, deltaLabel?, deltaPositive? })`. Task 9 (Overview page) is the consumer.

- [ ] **Step 1: Write the failing test**

```tsx
// components/__tests__/stat-card.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { StatCard } from '../stat-card'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="USD/SGD" value="1.350" />)
    expect(screen.getByText('USD/SGD')).toBeInTheDocument()
    expect(screen.getByText('1.350')).toBeInTheDocument()
  })

  it('renders a positive delta in green', () => {
    render(<StatCard label="P&L" value="$100" deltaLabel="+5.00%" deltaPositive />)
    expect(screen.getByText('+5.00%')).toHaveClass('text-green-600')
  })

  it('renders a negative delta in red', () => {
    render(<StatCard label="P&L" value="-$50" deltaLabel="-2.00%" deltaPositive={false} />)
    expect(screen.getByText('-2.00%')).toHaveClass('text-red-600')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/__tests__/stat-card.test.tsx`
Expected: FAIL — `Cannot find module '../stat-card'`

- [ ] **Step 3: Implement `components/stat-card.tsx`**

```tsx
// components/stat-card.tsx
interface StatCardProps {
  label: string
  value: string
  deltaLabel?: string
  deltaPositive?: boolean
}

export function StatCard({ label, value, deltaLabel, deltaPositive }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {deltaLabel && (
        <p className={`mt-1 text-sm font-medium ${deltaPositive ? 'text-green-600' : 'text-red-600'}`}>
          {deltaLabel}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- components/__tests__/stat-card.test.tsx`
Expected: 3 passed, 3 total

- [ ] **Step 5: Commit**

```bash
git add components/stat-card.tsx components/__tests__/stat-card.test.tsx
git commit -m "feat: add StatCard component"
```

---

### Task 5: `<DataTable>` generic engine

**Files:**
- Create: `components/data-table.tsx`
- Test: `components/__tests__/data-table.test.tsx`

**Interfaces:**
- Consumes: `@tanstack/react-table` (Task 1)
- Produces: `DataTable<TData>({ columns, data, emptyMessage? })`. Tasks 6 (`HoldingsTable`, `TradeLogTable`, `WatchlistTable`) are the only consumers — pages never use `<DataTable>` directly.

- [ ] **Step 1: Write the failing test**

```tsx
// components/__tests__/data-table.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../data-table'

interface Row {
  name: string
  value: number
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'value', header: 'Value' },
]

describe('DataTable', () => {
  it('renders headers and row data', () => {
    render(<DataTable columns={columns} data={[{ name: 'GOOG', value: 100 }]} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('shows the empty message when there is no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/__tests__/data-table.test.tsx`
Expected: FAIL — `Cannot find module '../data-table'`

- [ ] **Step 3: Implement `components/data-table.tsx`**

```tsx
// components/data-table.tsx
'use client'

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage?: string
}

export function DataTable<TData>({ columns, data, emptyMessage = 'No data' }: DataTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (data.length === 0) {
    return <p className="p-4 text-sm text-gray-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b text-left text-gray-500">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 font-medium whitespace-nowrap">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 tabular-nums whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- components/__tests__/data-table.test.tsx`
Expected: 2 passed, 2 total

- [ ] **Step 5: Commit**

```bash
git add components/data-table.tsx components/__tests__/data-table.test.tsx
git commit -m "feat: add generic DataTable engine on TanStack Table"
```

---

### Task 6: Typed table wrappers (Holdings, Trade Log, Watchlist)

Column definitions contain render functions, which cannot be passed as Server Component props to a Client Component (only plain data and Server Actions cross that boundary). So each wrapper below defines its own columns internally and only accepts plain typed arrays as props.

**Files:**
- Create: `components/holdings-table.tsx`
- Create: `components/trade-log-table.tsx`
- Create: `components/watchlist-table.tsx`
- Test: `components/__tests__/holdings-table.test.tsx`
- Test: `components/__tests__/trade-log-table.test.tsx`
- Test: `components/__tests__/watchlist-table.test.tsx`

**Interfaces:**
- Consumes: `DataTable` (Task 5), `Holding`/`TradeLogEntry`/`WatchlistItem` from `lib/sheets/types.ts` (Foundation Task 8)
- Produces: `HoldingsTable({ holdings: Holding[] })`, `TradeLogTable({ trades: TradeLogEntry[] })`, `WatchlistTable({ items: WatchlistItem[] })`. Tasks 9-10 (Overview, Watchlist, Trade Log pages) are the consumers.

- [ ] **Step 1: Write the failing test for `HoldingsTable`**

```tsx
// components/__tests__/holdings-table.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { HoldingsTable } from '../holdings-table'
import type { Holding } from '@/lib/sheets/types'

function holding(overrides: Partial<Holding>): Holding {
  return {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    broker: 'IBKR',
    status: 'Held',
    shares: 3,
    avgCost: 338,
    lastPrice: 338.3,
    marketValue: 1014.9,
    unrealizedPnl: 0.9,
    unrealizedPnlPct: 0.09,
    targetPct: 10,
    currency: 'USD',
    ...overrides,
  }
}

describe('HoldingsTable', () => {
  it('renders a holding with a green P&L for a gain', () => {
    render(<HoldingsTable holdings={[holding({ unrealizedPnlPct: 5 })]} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('+5.00%')).toHaveClass('text-green-600')
  })

  it('renders a red P&L for a loss', () => {
    render(<HoldingsTable holdings={[holding({ unrealizedPnlPct: -6.55 })]} />)
    expect(screen.getByText('-6.55%')).toHaveClass('text-red-600')
  })

  it('shows an em dash for null financial fields (watchlist rows)', () => {
    render(
      <HoldingsTable
        holdings={[
          holding({ status: 'Watchlist', shares: null, unrealizedPnlPct: null, marketValue: null }),
        ]}
      />
    )
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/__tests__/holdings-table.test.tsx`
Expected: FAIL — `Cannot find module '../holdings-table'`

- [ ] **Step 3: Implement `components/holdings-table.tsx`**

```tsx
// components/holdings-table.tsx
'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { Holding } from '@/lib/sheets/types'

function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toLocaleString()
}

function formatCurrency(value: number | null): string {
  return value === null
    ? '—'
    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function PnlCell({ value }: { value: number | null }) {
  if (value === null) return <span>—</span>
  const positive = value >= 0
  return (
    <span className={positive ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
      {positive ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  )
}

const columns: ColumnDef<Holding, unknown>[] = [
  { accessorKey: 'ticker', header: 'Ticker' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'shares',
    header: 'Shares',
    cell: ({ getValue }) => formatNumber(getValue<number | null>()),
  },
  {
    accessorKey: 'avgCost',
    header: 'Avg Cost',
    cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
  },
  {
    accessorKey: 'lastPrice',
    header: 'Last Price',
    cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
  },
  {
    accessorKey: 'marketValue',
    header: 'Mkt Value',
    cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
  },
  {
    accessorKey: 'unrealizedPnlPct',
    header: 'P&L %',
    cell: ({ row }) => <PnlCell value={row.original.unrealizedPnlPct} />,
  },
]

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return <DataTable columns={columns} data={holdings} emptyMessage="No holdings" />
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- components/__tests__/holdings-table.test.tsx`
Expected: 3 passed, 3 total

- [ ] **Step 5: Write the failing test for `TradeLogTable`**

```tsx
// components/__tests__/trade-log-table.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { TradeLogTable } from '../trade-log-table'
import type { TradeLogEntry } from '@/lib/sheets/types'

const trade: TradeLogEntry = {
  date: '26 Aug 2026, 14:32',
  ticker: 'GOOG',
  company: 'Alphabet Inc. (Cl C)',
  side: 'BUY',
  shares: 3,
  price: 338,
  netAmount: 1014,
  orderType: 'Limit, Day',
  commission: 0.00001,
}

describe('TradeLogTable', () => {
  it('renders a trade row', () => {
    render(<TradeLogTable trades={[trade]} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByText('$338.00')).toBeInTheDocument()
  })

  it('shows the empty message with no trades', () => {
    render(<TradeLogTable trades={[]} />)
    expect(screen.getByText('No trades yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails, then implement `TradeLogTable`**

Run: `npm test -- components/__tests__/trade-log-table.test.tsx` (expect FAIL first)

```tsx
// components/trade-log-table.tsx
'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { TradeLogEntry } from '@/lib/sheets/types'

const columns: ColumnDef<TradeLogEntry, unknown>[] = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'ticker', header: 'Ticker' },
  { accessorKey: 'side', header: 'Side' },
  { accessorKey: 'shares', header: 'Shares' },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
  },
  {
    accessorKey: 'netAmount',
    header: 'Net Amount',
    cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
  },
]

export function TradeLogTable({ trades }: { trades: TradeLogEntry[] }) {
  return <DataTable columns={columns} data={trades} emptyMessage="No trades yet" />
}
```

Then run `npm test -- components/__tests__/trade-log-table.test.tsx` again.
Expected: 2 passed, 2 total

- [ ] **Step 7: Write the failing test for `WatchlistTable`**

```tsx
// components/__tests__/watchlist-table.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { WatchlistTable } from '../watchlist-table'
import type { WatchlistItem } from '@/lib/sheets/types'

describe('WatchlistTable', () => {
  it('renders a watchlist item', () => {
    render(
      <WatchlistTable
        items={[{ ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Watchlist' } as WatchlistItem]}
      />
    )
    expect(screen.getByText('MSFT')).toBeInTheDocument()
    expect(screen.getByText('Microsoft Corp.')).toBeInTheDocument()
  })

  it('shows the empty message with no items', () => {
    render(<WatchlistTable items={[]} />)
    expect(screen.getByText('Watchlist is empty')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Run it to verify it fails, then implement `WatchlistTable`**

Run: `npm test -- components/__tests__/watchlist-table.test.tsx` (expect FAIL first)

```tsx
// components/watchlist-table.tsx
'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { WatchlistItem } from '@/lib/sheets/types'

const columns: ColumnDef<WatchlistItem, unknown>[] = [
  { accessorKey: 'ticker', header: 'Ticker' },
  { accessorKey: 'company', header: 'Company' },
  { accessorKey: 'status', header: 'Status' },
]

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  return <DataTable columns={columns} data={items} emptyMessage="Watchlist is empty" />
}
```

Then run `npm test -- components/__tests__/watchlist-table.test.tsx` again.
Expected: 2 passed, 2 total

- [ ] **Step 9: Run all three test files together to confirm nothing regressed**

Run: `npm test -- components/__tests__/holdings-table.test.tsx components/__tests__/trade-log-table.test.tsx components/__tests__/watchlist-table.test.tsx`
Expected: 7 passed, 7 total

- [ ] **Step 10: Commit**

```bash
git add components/holdings-table.tsx components/trade-log-table.tsx components/watchlist-table.tsx components/__tests__/holdings-table.test.tsx components/__tests__/trade-log-table.test.tsx components/__tests__/watchlist-table.test.tsx
git commit -m "feat: add typed DataTable wrappers for holdings, trade log, watchlist"
```

---

### Task 7: `<AllocationChart>` and `<WeightBars>`

**Files:**
- Create: `components/allocation-chart.tsx`
- Create: `components/weight-bars.tsx`
- Test: `components/__tests__/allocation-chart.test.tsx`
- Test: `components/__tests__/weight-bars.test.tsx`

**Interfaces:**
- Consumes: `SectorSlice`, `BrokerWeight` from `lib/aggregate.ts` (Task 2)
- Produces: `AllocationChart({ slices: SectorSlice[] })`, `WeightBars({ weights: BrokerWeight[] })`. Task 9 (Overview page) is the consumer.

- [ ] **Step 1: Write the failing test for `AllocationChart`**

Recharts' `ResponsiveContainer` renders zero-size in jsdom (no real layout engine), so this test only asserts the accessible text-fallback list — the part users and screen readers actually rely on for exact values, per the "donuts fail WCAG color-only checks" guidance from the design spec.

```tsx
// components/__tests__/allocation-chart.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { AllocationChart } from '../allocation-chart'

describe('AllocationChart', () => {
  it('renders a text-fallback percentage list alongside the chart', () => {
    render(
      <AllocationChart
        slices={[
          { sector: 'Mega-cap', value: 75 },
          { sector: 'Healthcare', value: 25 },
        ]}
      />
    )
    expect(screen.getByText('Mega-cap')).toBeInTheDocument()
    expect(screen.getByText('75.0%')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
  })

  it('shows an empty state with no slices', () => {
    render(<AllocationChart slices={[]} />)
    expect(screen.getByText('No holdings to chart yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/__tests__/allocation-chart.test.tsx`
Expected: FAIL — `Cannot find module '../allocation-chart'`

- [ ] **Step 3: Implement `components/allocation-chart.tsx`**

```tsx
// components/allocation-chart.tsx
'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { SectorSlice } from '@/lib/aggregate'

const COLORS = ['#0d9488', '#0891b2', '#6366f1', '#a855f7', '#f59e0b', '#94a3b8']

export function AllocationChart({ slices }: { slices: SectorSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (slices.length === 0 || total === 0) {
    return <p className="p-4 text-sm text-gray-500">No holdings to chart yet</p>
  }

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="sector" innerRadius="60%" outerRadius="90%">
              {slices.map((slice, index) => (
                <Cell key={slice.sector} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible fallback: donut slices fail WCAG color-only checks, so
          percentages are always shown as text, not only on chart hover. */}
      <ul className="mt-2 space-y-1 text-sm">
        {slices.map((slice, index) => (
          <li key={slice.sector} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {slice.sector}
            </span>
            <span className="tabular-nums">{((slice.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- components/__tests__/allocation-chart.test.tsx`
Expected: 2 passed, 2 total

- [ ] **Step 5: Write the failing test for `WeightBars`**

```tsx
// components/__tests__/weight-bars.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { WeightBars } from '../weight-bars'

describe('WeightBars', () => {
  it('renders each broker with its percentage', () => {
    render(
      <WeightBars
        weights={[
          { broker: 'IBKR', pct: 75.2 },
          { broker: 'MooMoo', pct: 24.8 },
        ]}
      />
    )
    expect(screen.getByText('IBKR')).toBeInTheDocument()
    expect(screen.getByText('75.2%')).toBeInTheDocument()
  })

  it('shows an empty state with no weights', () => {
    render(<WeightBars weights={[]} />)
    expect(screen.getByText('No portfolio weight data yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run it to verify it fails, then implement `WeightBars`**

Run: `npm test -- components/__tests__/weight-bars.test.tsx` (expect FAIL first)

```tsx
// components/weight-bars.tsx
import type { BrokerWeight } from '@/lib/aggregate'

export function WeightBars({ weights }: { weights: BrokerWeight[] }) {
  if (weights.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No portfolio weight data yet</p>
  }

  return (
    <ul className="space-y-3">
      {weights.map((weight) => (
        <li key={weight.broker}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{weight.broker}</span>
            <span className="tabular-nums">{weight.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${weight.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
```

Then run `npm test -- components/__tests__/weight-bars.test.tsx` again.
Expected: 2 passed, 2 total

- [ ] **Step 7: Commit**

```bash
git add components/allocation-chart.tsx components/weight-bars.tsx components/__tests__/allocation-chart.test.tsx components/__tests__/weight-bars.test.tsx
git commit -m "feat: add AllocationChart and WeightBars components"
```

---

### Task 8: Route group + nav shell

Moves the Foundation plan's authenticated page under an `(dashboard)` route group so `/login` (outside the group) never renders the nav, and adds the dark-sidebar/bottom-tab-bar nav shell.

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `components/nav.tsx`
- Test: `components/__tests__/nav.test.tsx`
- Move: `app/page.tsx` → `app/(dashboard)/page.tsx`
- Move: `app/actions.ts` → `app/(dashboard)/actions.ts`
- Move: `app/refresh-button.tsx` → `app/(dashboard)/refresh-button.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `<Nav>` rendering 5 links (Overview `/`, Watchlist `/watchlist`, Research `/research`, Trade Log `/trade-log`, Performance `/performance` disabled). Tasks 9-13 (all dashboard pages) live under `app/(dashboard)/` from here on.

- [ ] **Step 1: Move the Foundation files into the route group**

```bash
mkdir -p "app/(dashboard)"
git mv app/page.tsx "app/(dashboard)/page.tsx"
git mv app/actions.ts "app/(dashboard)/actions.ts"
git mv app/refresh-button.tsx "app/(dashboard)/refresh-button.tsx"
```

The relative imports inside these three files (`./actions`, `@/lib/...`) keep working unchanged since all three moved together and `@/` paths are absolute from the repo root.

- [ ] **Step 2: Write the failing test for `Nav`**

```tsx
// components/__tests__/nav.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

import { Nav } from '../nav'

describe('Nav', () => {
  it('renders all 5 tabs', () => {
    render(<Nav />)
    for (const label of ['Overview', 'Watchlist', 'Research', 'Trade Log', 'Performance']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('marks Performance as disabled', () => {
    render(<Nav />)
    const performanceLinks = screen.getAllByText('Performance')
    for (const link of performanceLinks) {
      expect(link.closest('[aria-disabled="true"]')).not.toBeNull()
    }
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- components/__tests__/nav.test.tsx`
Expected: FAIL — `Cannot find module '../nav'`

- [ ] **Step 4: Implement `components/nav.tsx`**

```tsx
// components/nav.tsx
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
  { href: '/research', label: 'Research' },
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
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npm test -- components/__tests__/nav.test.tsx`
Expected: 2 passed, 2 total

- [ ] **Step 6: Wire `Nav` into the dashboard route group layout**

```tsx
// app/(dashboard)/layout.tsx
import { Nav } from '@/components/nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Nav />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
    </div>
  )
}
```

- [ ] **Step 7: Confirm the app still builds**

Run: `npx next build`
Expected: build succeeds; `/`, `/login` both resolve without route conflicts.

- [ ] **Step 8: Commit**

```bash
git add "app/(dashboard)" components/nav.tsx components/__tests__/nav.test.tsx
git commit -m "feat: add mobile-first nav shell and move dashboard under a route group"
```

---

### Task 9: Overview page (full)

Replaces the Foundation plan's minimal summary in `app/(dashboard)/page.tsx` with the full sample-UI layout: stat cards, per-broker holdings sub-tabs, sector donut, portfolio weight bars.

**Files:**
- Modify: `app/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `getOverview`, `getIbkrHoldings`, `getMoomooHoldings`, `getSgHoldings` (Foundation Task 10), `getUsdSgdRate` (Foundation Task 11), `aggregateBySector`/`computeBrokerWeights` (Task 2), `StatCard` (Task 4), `HoldingsTable` (Task 6), `AllocationChart`/`WeightBars` (Task 7), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (Task 1), `RefreshButton` (Foundation Task 12, now at `./refresh-button` after Task 8's move)
- Produces: the full Overview route at `/`. No other task consumes this page.

- [ ] **Step 1: Replace `app/(dashboard)/page.tsx`**

```tsx
// app/(dashboard)/page.tsx
import { Suspense } from 'react'
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
```

- [ ] **Step 2: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual verification (requires the real credentials from the Foundation plan)**

Run: `npm run dev`, log in, and confirm the Overview page shows stat cards, a working IBKR/MooMoo/SG/All tab switch, a sector donut with a visible percentage list, and portfolio-weight bars. Cannot be asserted by an automated test without live Sheet data.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/page.tsx"
git commit -m "feat: build the full Overview tab"
```

---

### Task 10: Watchlist page

**Files:**
- Create: `app/(dashboard)/watchlist/page.tsx`

**Interfaces:**
- Consumes: `getWatchlist` (Foundation Task 10), `WatchlistTable` (Task 6)
- Produces: the `/watchlist` route.

- [ ] **Step 1: Write the page**

```tsx
// app/(dashboard)/watchlist/page.tsx
import { getWatchlist } from '@/lib/sheets/fetch'
import { WatchlistTable } from '@/components/watchlist-table'

export default async function WatchlistPage() {
  const items = await getWatchlist()
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Watchlist</h1>
      <WatchlistTable items={items} />
    </main>
  )
}
```

- [ ] **Step 2: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/watchlist/page.tsx"
git commit -m "feat: add Watchlist tab"
```

---

### Task 11: Research page

**Files:**
- Create: `components/research-card.tsx`
- Test: `components/__tests__/research-card.test.tsx`
- Create: `app/(dashboard)/research/page.tsx`

**Interfaces:**
- Consumes: `getEarnings`, `getOutlook` (Foundation Task 10), `mergeResearch`/`ResearchRow` (Task 3)
- Produces: `ResearchCard({ row: ResearchRow })` and the `/research` route.

- [ ] **Step 1: Write the failing test for `ResearchCard`**

```tsx
// components/__tests__/research-card.test.tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { ResearchCard } from '../research-card'
import type { ResearchRow } from '@/lib/research'

const row: ResearchRow = {
  ticker: 'GOOG',
  earnings: {
    ticker: 'GOOG',
    period: 'Q2 2026',
    epsActual: 9.11,
    epsEstimate: 2.87,
    epsBeatMiss: 6.24,
    revenueActual: '$119.80B',
    revenueEstimate: '$116.53B',
    revenueBeatMiss: '$3.27B',
    guidance: 'AI/search strength; Cloud growth',
    nextEarningsDate: '2026-10-28',
  },
  outlook: {
    ticker: 'GOOG',
    netMarginTtm: '~31.5%',
    freeCashFlowTtm: '~$72B',
    managementOutlook: 'AI is strengthening Search and YouTube.',
  },
}

describe('ResearchCard', () => {
  it('renders the ticker, period, and guidance', () => {
    render(<ResearchCard row={row} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('Q2 2026')).toBeInTheDocument()
    expect(screen.getByText('AI/search strength; Cloud growth')).toBeInTheDocument()
  })

  it('renders the management outlook text', () => {
    render(<ResearchCard row={row} />)
    expect(screen.getByText('AI is strengthening Search and YouTube.')).toBeInTheDocument()
  })

  it('renders without crashing when earnings is null', () => {
    render(<ResearchCard row={{ ticker: 'XYZ', earnings: null, outlook: null }} />)
    expect(screen.getByText('XYZ')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- components/__tests__/research-card.test.tsx`
Expected: FAIL — `Cannot find module '../research-card'`

- [ ] **Step 3: Implement `components/research-card.tsx`**

```tsx
// components/research-card.tsx
import type { ResearchRow } from '@/lib/research'

export function ResearchCard({ row }: { row: ResearchRow }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold">{row.ticker}</h2>
      {row.earnings && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Period</dt>
          <dd>{row.earnings.period}</dd>
          <dt className="text-gray-500">EPS actual / est.</dt>
          <dd>
            {row.earnings.epsActual ?? '—'} / {row.earnings.epsEstimate ?? '—'}
          </dd>
          <dt className="text-gray-500">Revenue actual / est.</dt>
          <dd>
            {row.earnings.revenueActual} / {row.earnings.revenueEstimate}
          </dd>
          <dt className="text-gray-500">Guidance</dt>
          <dd>{row.earnings.guidance}</dd>
        </dl>
      )}
      {row.outlook && <p className="mt-3 text-sm text-gray-600">{row.outlook.managementOutlook}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- components/__tests__/research-card.test.tsx`
Expected: 3 passed, 3 total

- [ ] **Step 5: Write the Research page**

```tsx
// app/(dashboard)/research/page.tsx
import { getEarnings, getOutlook } from '@/lib/sheets/fetch'
import { mergeResearch } from '@/lib/research'
import { ResearchCard } from '@/components/research-card'

export default async function ResearchPage() {
  const [earnings, outlook] = await Promise.all([getEarnings(), getOutlook()])
  const rows = mergeResearch(earnings, outlook)

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Research</h1>
      {rows.map((row) => (
        <ResearchCard key={row.ticker} row={row} />
      ))}
    </main>
  )
}
```

- [ ] **Step 6: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/research-card.tsx components/__tests__/research-card.test.tsx "app/(dashboard)/research/page.tsx"
git commit -m "feat: add Research tab"
```

---

### Task 12: Trade Log page

**Files:**
- Create: `app/(dashboard)/trade-log/page.tsx`

**Interfaces:**
- Consumes: `getTradeLog` (Foundation Task 10), `TradeLogTable` (Task 6)
- Produces: the `/trade-log` route.

- [ ] **Step 1: Write the page**

```tsx
// app/(dashboard)/trade-log/page.tsx
import { getTradeLog } from '@/lib/sheets/fetch'
import { TradeLogTable } from '@/components/trade-log-table'

export default async function TradeLogPage() {
  const trades = await getTradeLog()
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Trade Log</h1>
      <TradeLogTable trades={trades} />
    </main>
  )
}
```

- [ ] **Step 2: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/trade-log/page.tsx"
git commit -m "feat: add Trade Log tab"
```

---

### Task 13: Performance stub page

**Files:**
- Create: `app/(dashboard)/performance/page.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: the `/performance` route (static placeholder; `Nav` from Task 8 already marks it disabled, but the route itself must still exist for anyone navigating directly to the URL).

- [ ] **Step 1: Write the page**

```tsx
// app/(dashboard)/performance/page.tsx
export default function PerformancePage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Performance</h1>
      <p className="mt-2 text-sm text-gray-500">
        Coming soon — historical performance charts need time-series data this sheet doesn&apos;t
        track yet.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Confirm it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/performance/page.tsx"
git commit -m "feat: add Performance coming-soon stub"
```

---

### Task 14: PWA manifest

**Files:**
- Create: `app/manifest.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `/manifest.webmanifest`, auto-linked by Next.js's file-convention (no manual `<link rel="manifest">` needed); a `viewport` export enabling PWA-safe mobile rendering.

- [ ] **Step 1: Write the manifest**

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portfolio Dashboard',
    short_name: 'Portfolio',
    description: 'Personal investment portfolio dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
```

- [ ] **Step 2: Add a mobile-safe viewport export to the root layout**

Add to `app/layout.tsx` (alongside the existing `metadata` export):

```tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

- [ ] **Step 3: Confirm it type-checks and builds**

Run: `npx tsc --noEmit && npx next build`
Expected: no errors; build output includes the `/manifest.webmanifest` route.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open Chrome DevTools → Application → Manifest, confirm it loads with the fields above and an install prompt is available (desktop Chrome shows an install icon in the address bar).

- [ ] **Step 5: Commit**

```bash
git add app/manifest.ts app/layout.tsx
git commit -m "feat: add PWA manifest and mobile-safe viewport"
```

---

### Task 15: Update `CLAUDE.md` with UI conventions

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append the UI conventions section**

Add to the end of `CLAUDE.md` (after the Foundation plan's "What's next" section, replacing it):

```markdown
## UI conventions

- **Column defs live inside Client Component wrappers, not passed as props.**
  `HoldingsTable`/`TradeLogTable`/`WatchlistTable` (`components/`) each define
  their own `ColumnDef[]` and wrap the generic `<DataTable>`
  (`components/data-table.tsx`). Functions (like column `cell` renderers)
  cannot cross the Server→Client Component prop boundary, so pages only ever
  pass plain typed arrays (`Holding[]`, etc.) into these wrappers — never
  columns.
- **All data-shaping is a pure function, not component logic.**
  `lib/aggregate.ts` (sector/broker aggregation) and `lib/research.ts`
  (earnings+outlook merge) are plain, fully unit-tested functions consumed
  by Server Component pages. If a new chart or summary needs reshaped data,
  add a function there first, not inline in a component.
- **The Tabs primitive is hand-wired against `@radix-ui/react-tabs`**
  (`components/ui/tabs.tsx`), not generated via the shadcn CLI — the CLI's
  interactive init prompts don't work under automated execution. If more
  shadcn-style primitives are needed later, follow the same pattern
  (headless Radix + Tailwind classes matching shadcn's conventions) rather
  than running `npx shadcn@latest init`.
- **`app/(dashboard)/` is a route group**, not a URL segment — `/`,
  `/watchlist`, `/research`, `/trade-log`, `/performance` all live there and
  share `app/(dashboard)/layout.tsx`'s nav shell. `/login` deliberately sits
  outside the group so it never renders the nav.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document UI conventions in CLAUDE.md"
```

---

## Self-Review Notes

- **Spec coverage:** all 5 nav tabs (Tasks 9-13), DRY component core (Tasks 4-7), PWA manifest/installability (Task 14) are covered. Offline caching is intentionally absent per the spec's "installable, online-only" decision — no service worker task exists in this plan.
- **Type consistency:** `Holding`, `TradeLogEntry`, `WatchlistItem`, `EarningsRow`, `OutlookRow` field names are used identically to their Foundation-plan definitions in every column def and test fixture above.
- **No placeholders:** every step has runnable code; the two manual-only steps (Task 9 Step 3, Task 14 Step 4) are explicitly labeled with the reason automation can't cover them (no live Sheet credentials; visual manifest/install-prompt check).
