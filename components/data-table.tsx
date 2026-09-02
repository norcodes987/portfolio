'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortDirection,
  type SortingState,
} from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right'
    /** hide this column on narrow (< sm) viewports */
    mobileHidden?: boolean
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage?: string
  /** Column sort applied on first render; users can still re-sort from the header. */
  defaultSorting?: SortingState
}

function SortIndicator({ direction }: { direction: SortDirection | false }) {
  return (
    <span aria-hidden className="text-[10px] leading-none">
      {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : <span className="text-slate-300">↕</span>}
    </span>
  )
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = 'No data',
  defaultSorting,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting ?? [])
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (data.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-400">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-slate-200">
              {headerGroup.headers.map((header) => {
                const alignRight = header.column.columnDef.meta?.align === 'right'
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    aria-sort={
                      !canSort
                        ? undefined
                        : sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                    }
                    className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-3 ${
                      alignRight ? 'text-right' : 'text-left'
                    } ${header.column.columnDef.meta?.mobileHidden ? 'hidden sm:table-cell' : ''}`}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-slate-600 ${
                          alignRight ? 'flex-row-reverse' : ''
                        } ${sorted ? 'text-slate-700' : ''}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIndicator direction={sorted} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`whitespace-nowrap px-2 py-2.5 tabular-nums text-slate-700 sm:px-3 sm:py-3 ${
                    cell.column.columnDef.meta?.align === 'right' ? 'text-right' : 'text-left'
                  } ${cell.column.columnDef.meta?.mobileHidden ? 'hidden sm:table-cell' : ''}`}
                >
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
