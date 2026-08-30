'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table'
import type { WatchlistItem } from '@/lib/sheets/types'

const columns: ColumnDef<WatchlistItem, unknown>[] = [
  {
    accessorKey: 'ticker',
    header: 'Ticker',
    cell: ({ getValue }) => (
      <span className="font-semibold text-slate-900">{getValue<string>()}</span>
    ),
  },
  { accessorKey: 'company', header: 'Company' },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { align: 'right' },
    cell: ({ getValue }) => {
      const status = getValue<WatchlistItem['status']>()
      return (
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            status === 'Held'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20'
          }`}
        >
          {status}
        </span>
      )
    },
  },
]

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  return <DataTable columns={columns} data={items} emptyMessage="Watchlist is empty" />
}
