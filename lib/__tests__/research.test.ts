import { mergeResearch } from '../research'
import type { EarningsRow, OutlookRow } from '../sheets/types'

function earnings(ticker: string): EarningsRow {
  return {
    ticker,
    period: 'Q2 2026',
    epsActual: 1,
    epsEstimate: 1,
    epsBeatMiss: 0,
    revenueActual: '$1B',
    revenueEstimate: '$1B',
    revenueBeatMiss: '$0B',
    guidance: 'steady',
    nextEarningsDate: null,
  }
}

function outlook(ticker: string): OutlookRow {
  return { ticker, netMarginTtm: '10%', freeCashFlowTtm: '$1B', managementOutlook: 'stable' }
}

describe('mergeResearch', () => {
  it('joins earnings and outlook rows by ticker, sorted alphabetically', () => {
    const result = mergeResearch([earnings('MSFT'), earnings('GOOG')], [outlook('GOOG'), outlook('MSFT')])
    expect(result.map((r) => r.ticker)).toEqual(['GOOG', 'MSFT'])
    expect(result[0].earnings?.ticker).toBe('GOOG')
    expect(result[0].outlook?.ticker).toBe('GOOG')
  })

  it('includes a ticker with earnings but no outlook', () => {
    const result = mergeResearch([earnings('GOOG')], [])
    expect(result).toEqual([{ ticker: 'GOOG', earnings: earnings('GOOG'), outlook: null }])
  })

  it('includes a ticker with outlook but no earnings', () => {
    const result = mergeResearch([], [outlook('GOOG')])
    expect(result).toEqual([{ ticker: 'GOOG', earnings: null, outlook: outlook('GOOG') }])
  })
})
