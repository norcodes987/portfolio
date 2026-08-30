import type { EarningsRow, OutlookRow } from './sheets/types'

export interface ResearchRow {
  ticker: string
  earnings: EarningsRow | null
  outlook: OutlookRow | null
}

export function mergeResearch(earnings: EarningsRow[], outlook: OutlookRow[]): ResearchRow[] {
  const tickers = new Set([...earnings.map((e) => e.ticker), ...outlook.map((o) => o.ticker)])

  return [...tickers].sort().map((ticker) => ({
    ticker,
    earnings: earnings.find((e) => e.ticker === ticker) ?? null,
    outlook: outlook.find((o) => o.ticker === ticker) ?? null,
  }))
}
