/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { HoldingsTable } from '../holdings-table'
import type { Holding } from '@/lib/sheets/types'

function holding(overrides: Partial<Holding>): Holding {
  return {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    broker: 'IBKR',
    status: 'Held',
    shares: 3,
    avgCost: 338,
    lastPrice: 338.3,
    marketValue: 1014.9,
    unrealizedPnl: 0.9,
    unrealizedPnlPct: 0.09,
    targetPct: 10,
    currency: 'USD',
    ...overrides,
  }
}

describe('HoldingsTable', () => {
  it('renders a holding with a green P&L pill for a gain', () => {
    render(<HoldingsTable holdings={[holding({ unrealizedPnlPct: 5 })]} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('+5.00%')).toHaveClass('text-emerald-700')
  })

  it('renders a red P&L pill for a loss', () => {
    render(<HoldingsTable holdings={[holding({ unrealizedPnlPct: -6.55 })]} />)
    expect(screen.getByText('-6.55%')).toHaveClass('text-red-700')
  })

  it('shows an em dash for null financial fields (watchlist rows)', () => {
    render(
      <HoldingsTable
        holdings={[
          holding({ status: 'Watchlist', shares: null, unrealizedPnlPct: null, marketValue: null }),
        ]}
      />
    )
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('tags each row with its broker', () => {
    render(<HoldingsTable holdings={[holding({ broker: 'MooMoo' })]} />)
    expect(screen.getByText('MooMoo')).toBeInTheDocument()
  })
})
