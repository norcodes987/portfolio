/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('sorts by ticker when the Ticker header is clicked', () => {
    render(
      <WatchlistTable
        items={
          [
            { ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Held' },
            { ticker: 'AAPL', company: 'Apple Inc.', status: 'Watchlist' },
            { ticker: 'GOOG', company: 'Alphabet Inc.', status: 'Held' },
          ] as WatchlistItem[]
        }
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /ticker/i }))
    const tickers = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(tickers).toEqual(['AAPL', 'GOOG', 'MSFT'])
  })
})
