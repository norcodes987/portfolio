/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../data-table'

interface Row {
  name: string
  value: number | null
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'value', header: 'Value' },
]

/** First-cell text of every body row, top to bottom. */
function firstColumn(): (string | null)[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)
}

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

  it('sorts ascending on the first header click and descending on the second', () => {
    const data = [
      { name: 'B', value: 2 },
      { name: 'A', value: 1 },
      { name: 'C', value: 3 },
    ]
    render(<DataTable columns={columns} data={data} />)

    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    expect(firstColumn()).toEqual(['A', 'B', 'C'])

    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    expect(firstColumn()).toEqual(['C', 'B', 'A'])
  })

  it('reflects the sort direction with aria-sort on the column header', () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { name: 'B', value: 2 },
          { name: 'A', value: 1 },
        ]}
      />,
    )
    const header = screen.getByRole('columnheader', { name: /name/i })
    expect(header).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })

  it('keeps missing values last with sortUndefined regardless of direction', () => {
    const nullableColumns: ColumnDef<Row>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        id: 'value',
        accessorFn: (r) => r.value ?? undefined,
        header: 'Value',
        sortUndefined: 'last',
      },
    ]
    const data = [
      { name: 'A', value: null },
      { name: 'B', value: 5 },
      { name: 'C', value: 1 },
    ]
    render(<DataTable columns={nullableColumns} data={data} />)

    // number columns sort desc-first: one click -> descending, blank still last
    fireEvent.click(screen.getByRole('button', { name: /value/i }))
    expect(firstColumn()).toEqual(['B', 'C', 'A'])

    // second click -> ascending, blank still last
    fireEvent.click(screen.getByRole('button', { name: /value/i }))
    expect(firstColumn()).toEqual(['C', 'B', 'A'])
  })

  it('applies defaultSorting on first render', () => {
    const data = [
      { name: 'B', value: 2 },
      { name: 'A', value: 1 },
      { name: 'C', value: 3 },
    ]
    render(
      <DataTable columns={columns} data={data} defaultSorting={[{ id: 'value', desc: true }]} />,
    )
    expect(firstColumn()).toEqual(['C', 'B', 'A'])
  })

  it('does not render a sort control for a column with sorting disabled', () => {
    const data = [{ name: 'A', value: 1 }]
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name', enableSorting: false },
          { accessorKey: 'value', header: 'Value' },
        ]}
        data={data}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' })
    expect(within(nameHeader).queryByRole('button')).toBeNull()
    expect(nameHeader).not.toHaveAttribute('aria-sort')
  })
})
