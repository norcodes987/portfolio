/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { ResearchCard } from '../research-card'
import type { ResearchRow } from '@/lib/research'

const row: ResearchRow = {
  ticker: 'GOOG',
  earnings: {
    ticker: 'GOOG',
    period: 'Q2 2026',
    epsActual: 9.11,
    epsEstimate: 2.87,
    epsBeatMiss: 6.24,
    revenueActual: '$119.80B',
    revenueEstimate: '$116.53B',
    revenueBeatMiss: '$3.27B',
    guidance: 'AI/search strength; Cloud growth',
    nextEarningsDate: '2026-10-28',
  },
  outlook: {
    ticker: 'GOOG',
    netMarginTtm: '~31.5%',
    freeCashFlowTtm: '~$72B',
    managementOutlook: 'AI is strengthening Search and YouTube.',
  },
}

describe('ResearchCard', () => {
  it('renders the ticker, period, and guidance', () => {
    render(<ResearchCard row={row} />)
    expect(screen.getByText('GOOG')).toBeInTheDocument()
    expect(screen.getByText('Q2 2026')).toBeInTheDocument()
    expect(screen.getByText('AI/search strength; Cloud growth')).toBeInTheDocument()
  })

  it('renders the management outlook text', () => {
    render(<ResearchCard row={row} />)
    expect(screen.getByText('AI is strengthening Search and YouTube.')).toBeInTheDocument()
  })

  it('renders without crashing when earnings is null', () => {
    render(<ResearchCard row={{ ticker: 'XYZ', earnings: null, outlook: null }} />)
    expect(screen.getByText('XYZ')).toBeInTheDocument()
  })
})
