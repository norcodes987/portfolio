/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { WeightBars } from '../weight-bars'

describe('WeightBars', () => {
  it('renders each broker with its percentage', () => {
    render(
      <WeightBars
        weights={[
          { broker: 'IBKR', pct: 75.2 },
          { broker: 'MooMoo', pct: 24.8 },
        ]}
      />
    )
    expect(screen.getByText('IBKR')).toBeInTheDocument()
    expect(screen.getByText('75.2%')).toBeInTheDocument()
  })

  it('shows an empty state with no weights', () => {
    render(<WeightBars weights={[]} />)
    expect(screen.getByText('No portfolio weight data yet')).toBeInTheDocument()
  })
})
