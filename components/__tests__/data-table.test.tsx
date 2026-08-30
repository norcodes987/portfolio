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
