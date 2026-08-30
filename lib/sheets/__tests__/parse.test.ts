// lib/sheets/__tests__/parse.test.ts
import {
  parseNumber,
  parseIbkrHoldings,
  parseMoomooHoldings,
  parseSgHoldings,
  parseWatchlist,
  parseTradeLog,
  parseEarnings,
  parseOutlook,
  parseOverviewSummary,
} from '../parse'

describe('parseNumber', () => {
  it('parses plain numbers', () => {
    expect(parseNumber('338.00')).toBe(338)
  })

  it('strips thousands separators', () => {
    expect(parseNumber('1,014.90')).toBe(1014.9)
  })

  it('strips percent signs', () => {
    expect(parseNumber('7.63%')).toBeCloseTo(7.63)
  })

  it('strips dollar signs', () => {
    expect(parseNumber('$56,091.00')).toBe(56091)
  })

  it('treats an em-dash as null', () => {
    expect(parseNumber('—')).toBeNull()
  })

  it('treats an empty string as null', () => {
    expect(parseNumber('')).toBeNull()
  })

  it('treats undefined as null', () => {
    expect(parseNumber(undefined)).toBeNull()
  })

  it('parses negative numbers', () => {
    expect(parseNumber('-6.55%')).toBeCloseTo(-6.55)
  })
})

describe('parseIbkrHoldings', () => {
  const rows = [
    ['', 'MEGA-CAP', '', '', '', '', '', '', '', '', '', '', '30%'],
    ['1', 'Mega-cap', 'GOOG', 'Alphabet Inc.', 'Stock', 'Held', '3', '338.00', '338.30', '1,014.90', '0.9', '0.09%', '10%'],
    ['2', 'Mega-cap', 'MSFT', 'Microsoft', 'Stock', 'Watchlist', '—', '—', '—', '—', '—', '—', '10%'],
    ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  ]

  it('skips section header and blank rows, keeping only numbered data rows', () => {
    expect(parseIbkrHoldings(rows)).toHaveLength(2)
  })

  it('parses a held position', () => {
    const [held] = parseIbkrHoldings(rows)
    expect(held).toEqual({
      ticker: 'GOOG',
      name: 'Alphabet Inc.',
      broker: 'IBKR',
      sector: 'Mega-cap',
      status: 'Held',
      shares: 3,
      avgCost: 338,
      lastPrice: 338.3,
      marketValue: 1014.9,
      unrealizedPnl: 0.9,
      unrealizedPnlPct: 0.09,
      targetPct: 10,
      currency: 'USD',
    })
  })

  it('parses a watchlist position with null financial fields', () => {
    const [, watchlist] = parseIbkrHoldings(rows)
    expect(watchlist.status).toBe('Watchlist')
    expect(watchlist.shares).toBeNull()
    expect(watchlist.marketValue).toBeNull()
  })
})

describe('parseMoomooHoldings', () => {
  const rows = [
    ['1', 'BOTZ', 'BOTZ', '11', '33.882', 'USD', '36.14', '397.54', '24.84', '6.66%'],
    ['', '', '', '', '', '', '', '', '', ''],
  ]

  it('parses a holding and skips blank rows', () => {
    const holdings = parseMoomooHoldings(rows)
    expect(holdings).toHaveLength(1)
    expect(holdings[0]).toEqual({
      ticker: 'BOTZ',
      name: 'BOTZ',
      broker: 'MooMoo',
      status: 'Held',
      shares: 11,
      avgCost: 33.882,
      lastPrice: 36.14,
      marketValue: 397.54,
      unrealizedPnl: 24.84,
      unrealizedPnlPct: 6.66,
      targetPct: null,
      currency: 'USD',
    })
  })
})

describe('parseSgHoldings', () => {
  const rows = [
    ['1', 'FWD Insurance', 'Invest First Horizon', '4000', '5862.97', '1862.97', '46.57%'],
  ]

  it('parses a platform-based holding', () => {
    const holdings = parseSgHoldings(rows)
    expect(holdings).toEqual([
      {
        ticker: 'FWD Insurance',
        name: 'Invest First Horizon',
        broker: 'SG',
        status: 'Held',
        shares: null,
        avgCost: 4000,
        lastPrice: null,
        marketValue: 5862.97,
        unrealizedPnl: 1862.97,
        unrealizedPnlPct: 46.57,
        targetPct: null,
        currency: 'SGD',
      },
    ])
  })
})

describe('parseWatchlist', () => {
  const rows = [
    ['HELD POSITIONS', '', ''],
    ['GOOG', 'Alphabet Inc.', 'Held'],
    ['WATCHLIST POSITIONS', '', ''],
    ['MSFT', 'Microsoft Corp.', 'Watchlist'],
  ]

  it('skips section-label rows and keeps ticker rows', () => {
    expect(parseWatchlist(rows)).toEqual([
      { ticker: 'GOOG', company: 'Alphabet Inc.', status: 'Held' },
      { ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Watchlist' },
    ])
  })
})

describe('parseTradeLog', () => {
  const rows = [
    ['1', '26 Aug 2026, 14:32', 'GOOG', 'Alphabet Inc. (Cl C)', 'BUY', '3', '338', '1014', 'Limit, Day', '0.00001'],
    ['', '', '', '', 'TOTAL', '', '', '3,239.00', '', '0.00018'],
  ]

  it('parses a trade and skips the TOTAL row', () => {
    expect(parseTradeLog(rows)).toEqual([
      {
        date: '26 Aug 2026, 14:32',
        ticker: 'GOOG',
        company: 'Alphabet Inc. (Cl C)',
        side: 'BUY',
        shares: 3,
        price: 338,
        netAmount: 1014,
        orderType: 'Limit, Day',
        commission: 0.00001,
      },
    ])
  })
})

describe('parseEarnings', () => {
  const rows = [
    [
      'GOOG', 'Q2 2026', '9.11', '2.87', '6.24', '4.00',
      '$119.80B', '$116.53B', '$3.27B', '9.0%',
      'AI/search strength; Cloud growth', '2026-10-28', '2.73',
    ],
  ]

  it('parses eps as numbers and keeps revenue as display strings', () => {
    expect(parseEarnings(rows)).toEqual([
      {
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
    ])
  })
})

describe('parseOutlook', () => {
  const rows = [['GOOG', '~31.5%', '~$72B', 'AI is strengthening Search and YouTube.']]

  it('parses profitability and outlook text as-is', () => {
    expect(parseOutlook(rows)).toEqual([
      {
        ticker: 'GOOG',
        netMarginTtm: '~31.5%',
        freeCashFlowTtm: '~$72B',
        managementOutlook: 'AI is strengthening Search and YouTube.',
      },
    ])
  })
})

describe('parseOverviewSummary', () => {
  const rows = [
    ['Portfolio', 'Invested (USD)', 'Market Value (USD)', 'P&L (USD)', 'P&L %'],
    ['IBKR Portfolio', '14,676.45', '15,795.83', '1,119.39', '7.63%'],
    ['MooMoo Portfolio', '66,870.37', '75,147.22', '8,276.85', '12.38%'],
    ['', '', '', '', ''],
    ['TOTAL USD', '81,546.82', '90,943.05', '9,396.24', '11.52%'],
    ['', '', '', '', ''],
    ['Portfolio', 'Invested (SGD)', 'Current Value (SGD)', 'P&L (SGD)', 'P&L %'],
    ['SG Portfolio', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
    ['', '', '', '', ''],
    ['TOTAL SGD', '118,390.00', '126,809.14', '8,419.14', '7.11%'],
  ]

  it('finds the TOTAL USD and TOTAL SGD rows regardless of position', () => {
    expect(parseOverviewSummary(rows)).toEqual({
      totalInvestedUsd: 81546.82,
      marketValueUsd: 90943.05,
      unrealizedPnlUsd: 9396.24,
      unrealizedPnlPctUsd: 11.52,
      totalInvestedSgd: 118390,
      currentValueSgd: 126809.14,
      unrealizedPnlSgd: 8419.14,
      unrealizedPnlPctSgd: 7.11,
    })
  })

  it('throws a clear error when the TOTAL USD row is missing (schema drift)', () => {
    const brokenRows = rows.filter((row) => row[0] !== 'TOTAL USD')
    expect(() => parseOverviewSummary(brokenRows)).toThrow(
      'Portfolio Overview sheet is missing a TOTAL USD or TOTAL SGD row'
    )
  })
})

// --- Regression: real spreadsheet rows the earlier fixtures didn't cover ---
// Captured from the live sheet on 2026-08-30. These are the exact row shapes
// that previously crashed the parsers (`ticker.trim()` on undefined).

describe('parsers ignore trailing TOTALS / NOTES / header blocks', () => {
  it('parseIbkrHoldings skips section headers, TOTALS and NOTES rows', () => {
    const rows = [
      ['', 'MEGA-CAP', '', '', '', '', '', '', '', '', '', '', '30%'],
      ['1', 'Mega-cap', 'GOOG', 'Alphabet Inc.', 'Stock', 'Held', '3', '338.00', '338.30', '1,014.90', '0.9', '0.0009', '10%'],
      [''],
      ['TOTALS — HELD POSITIONS'],
      ['', '', '', '', '', '', '', 'Cost Basis', 'Mkt Value', 'Unrealised P&L', 'P&L %'],
      ['', '', '', '', '', '', '', '14,676.45', '15,795.83', '+$1,119.39', '+7.63%'],
      ['NOTES'],
      ['VGT — Vanguard IT ETF placed in Tech/Software. Overlaps with MSFT & NVDA.'],
    ]
    const holdings = parseIbkrHoldings(rows)
    expect(holdings.map((h) => h.ticker)).toEqual(['GOOG'])
  })

  it('parseMoomooHoldings skips the "#/TICKER/..." header row', () => {
    const rows = [
      ['#', 'TICKER', 'YAHOO TICKER', 'Shares', 'Avg Cost', 'Currency', 'Current Price', 'Market Value', 'Unrealised P& L', 'Unrealised P& L %'],
      ['1', 'BOTZ', 'BOTZ', '11', '33.882', 'USD', '35.75', '393.25', '20.55', '5.51%'],
      ['8', 'CSOP USD MM', '—', '—', '31196.93', 'USD', '—', '35177.99', '3981.06', '12.76%'],
    ]
    const holdings = parseMoomooHoldings(rows)
    expect(holdings.map((h) => h.ticker)).toEqual(['BOTZ', 'CSOP USD MM'])
    expect(holdings[1].shares).toBeNull()
    expect(holdings[1].lastPrice).toBeNull()
  })

  it('parseSgHoldings skips the TOTALS block', () => {
    const rows = [
      ['1', 'FWD Insurance', 'Invest First Horizon', '4000', '5862.97', '1862.97', '46.57%'],
      ['6', 'FSM One', 'FSM One Stocks', '2800', '3948', '1148', '41.00%'],
      ['TOTALS — ALL POSITIONS'],
      ['', '', '', '118390', '126809.14', '8419.14', '7.11%'],
    ]
    expect(parseSgHoldings(rows).map((h) => h.ticker)).toEqual(['FWD Insurance', 'FSM One'])
  })

  it('parseWatchlist (from the "Earnings" tab) skips the column header and section labels', () => {
    const rows = [
      ['HOLDINGS'],
      ['TICKER', 'COMPANY', 'STATUS'],
      ['HELD POSITIONS'],
      ['GOOG', 'Alphabet Inc.', 'Held'],
      ['WATCHLIST POSITIONS'],
      ['MSFT', 'Microsoft Corp.', 'Watchlist'],
    ]
    expect(parseWatchlist(rows)).toEqual([
      { ticker: 'GOOG', company: 'Alphabet Inc.', status: 'Held' },
      { ticker: 'MSFT', company: 'Microsoft Corp.', status: 'Watchlist' },
    ])
  })
})
