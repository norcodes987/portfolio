// lib/sheets/__tests__/fetch.test.ts
jest.mock('../client', () => ({
  fetchRange: jest.fn(),
}))

// next/cache's cacheTag/cacheLife throw outside the Next runtime under jest
// ("`cacheTag()` is only available with the `cacheComponents` config"). This
// test verifies fetch-range + parse wiring, not caching behavior; fetch.ts
// keeps its real 'use cache' + cacheTag('portfolio') + cacheLife directives.
jest.mock('next/cache', () => ({ cacheTag: jest.fn(), cacheLife: jest.fn() }))

import { fetchRange } from '../client'
import { getIbkrHoldings, getOverview, getWatchlist } from '../fetch'

const mockedFetchRange = fetchRange as jest.MockedFunction<typeof fetchRange>

describe('getIbkrHoldings', () => {
  it('fetches the IBKR range and parses it', async () => {
    mockedFetchRange.mockResolvedValueOnce([
      ['1', 'Mega-cap', 'GOOG', 'Alphabet Inc.', 'Stock', 'Held', '3', '338.00', '338.30', '1,014.90', '0.9', '0.09%', '10%'],
    ])

    const holdings = await getIbkrHoldings()

    expect(mockedFetchRange).toHaveBeenCalledWith(expect.stringContaining('IBKR Portfolio'))
    expect(holdings).toHaveLength(1)
    expect(holdings[0].ticker).toBe('GOOG')
  })
})

describe('getOverview', () => {
  it('fetches the overview range and parses the totals', async () => {
    mockedFetchRange.mockResolvedValueOnce([
      ['TOTAL USD', '81,546.82', '90,943.05', '9,396.24', '11.52%'],
      ['TOTAL SGD', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
    ])

    const overview = await getOverview()

    expect(mockedFetchRange).toHaveBeenCalledWith(expect.stringContaining('Overview!'))
    expect(overview.marketValueUsd).toBe(90943.05)
    expect(overview.currentValueSgd).toBe(126809.14)
  })
})

describe('getWatchlist', () => {
  it('reads the ticker list from the tab labelled "Earnings"', async () => {
    mockedFetchRange.mockResolvedValueOnce([
      ['TICKER', 'COMPANY', 'STATUS'],
      ['GOOG', 'Alphabet Inc.', 'Held'],
    ])

    const items = await getWatchlist()

    expect(mockedFetchRange).toHaveBeenCalledWith(expect.stringContaining('Earnings!'))
    expect(items).toEqual([{ ticker: 'GOOG', company: 'Alphabet Inc.', status: 'Held' }])
  })
})
