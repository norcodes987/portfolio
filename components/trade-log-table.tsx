'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { TradeLogEntry } from '@/lib/sheets/types'

const columns: ColumnDef<TradeLogEntry, unknown>[] = [
  { accessorKey: 'date', header: 'Date' },
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
  { accessorKey: 'shares', header: 'Shares', meta: { align: 'right' } },
  {
    accessorKey: 'price',
    header: 'Price',
    meta: { align: 'right' },
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
  return <DataTable columns={columns} data={trades} emptyMessage="No trades yet" />
}
