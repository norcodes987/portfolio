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
