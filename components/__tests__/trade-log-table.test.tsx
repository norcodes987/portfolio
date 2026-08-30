/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { TradeLogTable } from '../trade-log-table'
import type { TradeLogEntry } from '@/lib/sheets/types'

const trade: TradeLogEntry = {
  date: '26 Aug 2026, 14:32',
  ticker: 'GOOG',
  company: 'Alphabet Inc. (Cl C)',
  side: 'BUY',
  shares: 3,
  price: 338,
  netAmount: 1014,
  orderType: 'Limit, Day',
  commission: 0.00001,
}

describe('TradeLogTable', () => {
  it('renders a trade row', () => {
    render(<TradeLogTable trades={[trade]} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByText('$338.00')).toBeInTheDocument()
  })

  it('shows the empty message with no trades', () => {
    render(<TradeLogTable trades={[]} />)
    expect(screen.getByText('No trades yet')).toBeInTheDocument()
  })
})
