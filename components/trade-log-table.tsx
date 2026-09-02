'use client'

import type { ColumnDef, Row } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { TradeLogEntry } from '@/lib/sheets/types'

/**
 * The sheet's `date` column is a free-form timestamp string
 * (e.g. "26 Aug 2026, 14:32"), so sort it chronologically via `Date.parse`.
 * Unparseable values are treated as the epoch so they sink to the bottom.
 */
function byTradeDate(rowA: Row<TradeLogEntry>, rowB: Row<TradeLogEntry>): number {
  const a = Date.parse(rowA.original.date) || 0
  const b = Date.parse(rowB.original.date) || 0
  return a - b
}

const columns: ColumnDef<TradeLogEntry, unknown>[] = [
  { accessorKey: 'date', header: 'Date', sortingFn: byTradeDate, sortDescFirst: true },
  {
    accessorKey: 'ticker',
    header: 'Ticker',
    cell: ({ row }) => (
      <span className="leading-tight">
        <span className="block font-semibold text-slate-900">{row.original.ticker}</span>
        {row.original.company && (
          <span className="block text-xs text-slate-400">{row.original.company}</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: 'side',
    header: 'Side',
    cell: ({ getValue }) => {
      const side = getValue<TradeLogEntry['side']>()
      return (
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            side === 'BUY' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {side}
        </span>
      )
    },
  },
  { accessorKey: 'shares', header: 'Shares', meta: { align: 'right', mobileHidden: true } },
  {
    accessorKey: 'price',
    header: 'Price',
    meta: { align: 'right', mobileHidden: true },
    cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
  },
  {
    accessorKey: 'netAmount',
    header: 'Net Amount',
    meta: { align: 'right' },
    cell: ({ getValue }) => (
      <span className="font-medium text-slate-900">
        ${getValue<number>().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
  },
]

export function TradeLogTable({ trades }: { trades: TradeLogEntry[] }) {
  return (
    <DataTable
      columns={columns}
      data={trades}
      emptyMessage="No trades yet"
      defaultSorting={[{ id: 'date', desc: true }]}
    />
  )
}
