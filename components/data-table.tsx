'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
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
}

export function DataTable<TData>({ columns, data, emptyMessage = 'No data' }: DataTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  if (data.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-400">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-slate-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`whitespace-nowrap px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:px-3 ${
                    header.column.columnDef.meta?.align === 'right' ? 'text-right' : 'text-left'
                  } ${header.column.columnDef.meta?.mobileHidden ? 'hidden sm:table-cell' : ''}`}
                >
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
