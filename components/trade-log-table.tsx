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
