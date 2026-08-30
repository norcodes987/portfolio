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
