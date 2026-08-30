import { aggregateBySector, computeBrokerWeights, summarizeHoldings } from '../aggregate'
import type { Holding } from '../sheets/types'

function holding(overrides: Partial<Holding>): Holding {
  return {
    ticker: 'X',
    name: 'X',
    broker: 'IBKR',
    status: 'Held',
    shares: 1,
    avgCost: 1,
    lastPrice: 1,
    marketValue: 100,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
    targetPct: null,
    currency: 'USD',
    ...overrides,
  }
}

describe('aggregateBySector', () => {
  it('sums market value per sector', () => {
    const holdings = [
      holding({ sector: 'Tech', marketValue: 100 }),
      holding({ sector: 'Tech', marketValue: 50 }),
      holding({ sector: 'Healthcare', marketValue: 30 }),
    ]
    expect(aggregateBySector(holdings)).toEqual([
      { sector: 'Tech', value: 150 },
      { sector: 'Healthcare', value: 30 },
    ])
  })

  it('ignores holdings with no market value (watchlist rows)', () => {
    const holdings = [holding({ sector: 'Tech', marketValue: null })]
    expect(aggregateBySector(holdings)).toEqual([])
  })

  it('caps at maxSlices, bucketing the rest into Other', () => {
    const holdings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((sector, i) =>
      holding({ sector, marketValue: 10 - i })
    )
    const result = aggregateBySector(holdings, 6)
    expect(result).toHaveLength(6)
    // marketValue is `10 - i`, so A..G = 10,9,8,7,6,5,4; top 5 kept, F+G bucketed.
    expect(result[5]).toEqual({ sector: 'Other', value: 5 + 4 }) // F(5) + G(4)
  })
})

describe('summarizeHoldings', () => {
  it('totals market value and P&L, and derives P&L % off cost basis', () => {
    const holdings = [
      holding({ marketValue: 110, unrealizedPnl: 10 }),
      holding({ marketValue: 90, unrealizedPnl: -10 }),
    ]
    expect(summarizeHoldings(holdings)).toEqual({
      marketValue: 200,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
    })
  })

  it('ignores rows with no market value', () => {
    expect(summarizeHoldings([holding({ marketValue: null, unrealizedPnl: 5 })])).toEqual({
      marketValue: 0,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
    })
  })
})

describe('computeBrokerWeights', () => {
  it('computes each broker share of total market value', () => {
    const holdings = [
      holding({ broker: 'IBKR', marketValue: 75 }),
      holding({ broker: 'MooMoo', marketValue: 25 }),
    ]
    const weights = computeBrokerWeights(holdings)
    expect(weights).toEqual([
      { broker: 'IBKR', pct: 75 },
      { broker: 'MooMoo', pct: 25 },
    ])
  })

  it('returns an empty array when there is no market value at all', () => {
    expect(computeBrokerWeights([holding({ marketValue: null })])).toEqual([])
  })
})
