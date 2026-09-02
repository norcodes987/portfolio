'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import { PnlPill } from './pnl-pill'
import type { Holding } from '@/lib/sheets/types'

function money(value: number | null | undefined): string {
  return value == null
    ? '—'
    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shares(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

/**
 * Column fragment for a nullable numeric field. Missing values render an em
 * dash and always sort to the bottom — ascending *or* descending — because
 * `sortUndefined: 'last'` is applied before TanStack inverts for direction
 * (unlike a custom `sortingFn`, which can't see the sort direction). The
 * accessor maps `null` → `undefined` so `sortUndefined` actually fires.
 */
function nullableNumberColumn(
  id: keyof Holding,
  header: string,
  cell: ColumnDef<Holding, unknown>['cell'],
  meta: ColumnDef<Holding, unknown>['meta'],
): ColumnDef<Holding, unknown> {
  return {
    id,
    accessorFn: (h) => h[id] ?? undefined,
    header,
    meta,
    sortUndefined: 'last',
    cell,
  }
}

const DOT_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899']

function tickerDot(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i += 1) hash = (hash * 31 + ticker.charCodeAt(i)) | 0
  return DOT_COLORS[Math.abs(hash) % DOT_COLORS.length]
}

const BROKER_STYLES: Record<Holding['broker'], string> = {
  IBKR: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  MooMoo: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SG: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

function TickerCell({ holding }: { holding: Holding }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: tickerDot(holding.ticker) }}
        aria-hidden
      />
      <span className="leading-tight">
        <span className="block font-semibold text-slate-900">{holding.ticker}</span>
        {holding.name && holding.name !== holding.ticker && (
          <span className="block text-xs text-slate-400">{holding.name}</span>
        )}
      </span>
    </div>
  )
}

const columns: ColumnDef<Holding, unknown>[] = [
  {
    accessorKey: 'ticker',
    header: 'Ticker',
    cell: ({ row }) => <TickerCell holding={row.original} />,
  },
  {
    accessorKey: 'broker',
    header: 'Account',
    cell: ({ getValue }) => {
      const broker = getValue<Holding['broker']>()
      return (
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BROKER_STYLES[broker]}`}
        >
          {broker}
        </span>
      )
    },
  },
  nullableNumberColumn('shares', 'Shares', ({ getValue }) => shares(getValue<number | undefined>()), {
    align: 'right',
    mobileHidden: true,
  }),
  nullableNumberColumn('avgCost', 'Avg Cost', ({ getValue }) => money(getValue<number | undefined>()), {
    align: 'right',
    mobileHidden: true,
  }),
  nullableNumberColumn('lastPrice', 'Last Price', ({ getValue }) => money(getValue<number | undefined>()), {
    align: 'right',
    mobileHidden: true,
  }),
  nullableNumberColumn(
    'marketValue',
    'Mkt Value',
    ({ getValue }) => (
      <span className="font-medium text-slate-900">{money(getValue<number | undefined>())}</span>
    ),
    { align: 'right' },
  ),
  nullableNumberColumn(
    'unrealizedPnl',
    'Unrealised P&L',
    ({ getValue }) => <PnlPill value={getValue<number | undefined>()} format="currency" />,
    { align: 'right', mobileHidden: true },
  ),
  nullableNumberColumn(
    'unrealizedPnlPct',
    'P&L %',
    ({ getValue }) => <PnlPill value={getValue<number | undefined>()} format="percent" />,
    { align: 'right' },
  ),
]

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <DataTable
      columns={columns}
      data={holdings}
      emptyMessage="No holdings"
      defaultSorting={[{ id: 'marketValue', desc: true }]}
    />
  )
}
