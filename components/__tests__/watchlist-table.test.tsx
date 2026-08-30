/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { WatchlistTable } from '../watchlist-table'
import type { WatchlistItem } from '@/lib/sheets/types'

describe('WatchlistTable', () => {
  it('renders a watchlist item', () => {
    render(
      <WatchlistTable
        items={[{ ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Watchlist' } as WatchlistItem]}
      />
    )
    expect(screen.getByText('MSFT')).toBeInTheDocument()
    expect(screen.getByText('Microsoft Corp.')).toBeInTheDocument()
  })

  it('shows the empty message with no items', () => {
    render(<WatchlistTable items={[]} />)
    expect(screen.getByText('Watchlist is empty')).toBeInTheDocument()
  })
})
