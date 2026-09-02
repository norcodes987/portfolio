/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
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

  const dated = (ticker: string, date: string): TradeLogEntry => ({ ...trade, ticker, date })

  function tickerOrder(): (string | null)[] {
    return screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getByText(/OLD|MID|NEW/).textContent)
  }

  it('shows the most recent trade first by default', () => {
    render(
      <TradeLogTable
        trades={[
          dated('OLD', '3 Aug 2026, 10:00'),
          dated('NEW', '9 Sep 2026, 10:00'),
          dated('MID', '20 Aug 2026, 10:00'),
        ]}
      />,
    )
    expect(tickerOrder()).toEqual(['NEW', 'MID', 'OLD'])
  })

  it('re-sorts to oldest first when the Date header is clicked', () => {
    render(
      <TradeLogTable
        trades={[
          dated('OLD', '3 Aug 2026, 10:00'),
          dated('NEW', '9 Sep 2026, 10:00'),
          dated('MID', '20 Aug 2026, 10:00'),
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /date/i }))
    expect(tickerOrder()).toEqual(['OLD', 'MID', 'NEW'])
  })
})
