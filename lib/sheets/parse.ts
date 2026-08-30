// lib/sheets/parse.ts
import type {
  Holding,
  TradeLogEntry,
  WatchlistItem,
  EarningsRow,
  OutlookRow,
  PortfolioSummary,
} from './types'

export function parseNumber(cell: string | undefined): number | null {
  if (!cell) return null
  const trimmed = cell.trim()
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null
  const cleaned = trimmed.replace(/[$,%]/g, '')
  const value = Number(cleaned)
  return Number.isNaN(value) ? null : value
}

/**
 * A real holding/trade row always has a positive integer in its `#` column.
 * Section headers ("MEGA-CAP"), spacer rows, and `TOTALS` / `NOTES` blocks
 * do not — this is what keeps those out of the parsed output.
 */
function isNumberedRow(cell: string | undefined): boolean {
  return /^\d+$/.test((cell ?? '').trim())
}

export function parseIbkrHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => isNumberedRow(row[0]))
    .map((row) => {
      const [
        ,
        sector,
        ticker,
        name,
        ,
        status,
        shares,
        avgCost,
        lastPrice,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPct,
        targetPct,
      ] = row
      return {
        ticker: (ticker ?? '').trim(),
        name: (name ?? '').trim(),
        broker: 'IBKR',
        sector: sector?.trim() || undefined,
        status: status?.trim() === 'Held' ? 'Held' : 'Watchlist',
        shares: parseNumber(shares),
        avgCost: parseNumber(avgCost),
        lastPrice: parseNumber(lastPrice),
        marketValue: parseNumber(marketValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: parseNumber(targetPct),
        currency: 'USD',
      } satisfies Holding
    })
}

export function parseMoomooHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => isNumberedRow(row[0]))
    .map((row) => {
      const [, ticker, , shares, avgCost, currency, currentPrice, marketValue, unrealizedPnl, unrealizedPnlPct] =
        row
      const label = (ticker ?? '').trim()
      return {
        ticker: label,
        name: label,
        broker: 'MooMoo',
        status: 'Held',
        shares: parseNumber(shares),
        avgCost: parseNumber(avgCost),
        lastPrice: parseNumber(currentPrice),
        marketValue: parseNumber(marketValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: null,
        currency: currency?.trim() === 'SGD' ? 'SGD' : 'USD',
      } satisfies Holding
    })
}

export function parseSgHoldings(rows: string[][]): Holding[] {
  return rows
    .filter((row) => isNumberedRow(row[0]))
    .map((row) => {
      const [, platform, product, invested, currentValue, unrealizedPnl, unrealizedPnlPct] = row
      return {
        ticker: (platform ?? '').trim(),
        name: (product ?? '').trim(),
        broker: 'SG',
        status: 'Held',
        shares: null,
        avgCost: parseNumber(invested),
        lastPrice: null,
        marketValue: parseNumber(currentValue),
        unrealizedPnl: parseNumber(unrealizedPnl),
        unrealizedPnlPct: parseNumber(unrealizedPnlPct),
        targetPct: null,
        currency: 'SGD',
      } satisfies Holding
    })
}

export function parseWatchlist(rows: string[][]): WatchlistItem[] {
  return rows
    .filter((row) => {
      const status = row[2]?.trim()
      return Boolean(row[0]?.trim()) && Boolean(row[1]?.trim()) && (status === 'Held' || status === 'Watchlist')
    })
    .map((row) => {
      const [ticker, company, status] = row
      return {
        ticker: ticker.trim(),
        company: company.trim(),
        status: status?.trim() === 'Held' ? 'Held' : 'Watchlist',
      } satisfies WatchlistItem
    })
}

export function parseTradeLog(rows: string[][]): TradeLogEntry[] {
  return rows
    .filter((row) => isNumberedRow(row[0]))
    .map((row) => {
      const [, dateTime, ticker, company, side, shares, price, netAmount, orderType, commission] = row
      return {
        date: (dateTime ?? '').trim(),
        ticker: (ticker ?? '').trim(),
        company: (company ?? '').trim(),
        side: side?.trim() === 'SELL' ? 'SELL' : 'BUY',
        shares: parseNumber(shares) ?? 0,
        price: parseNumber(price) ?? 0,
        netAmount: parseNumber(netAmount) ?? 0,
        orderType: (orderType ?? '').trim(),
        commission: parseNumber(commission) ?? 0,
      } satisfies TradeLogEntry
    })
}

export function parseEarnings(rows: string[][]): EarningsRow[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [
        ticker,
        period,
        epsActual,
        epsEstimate,
        epsBeatMiss,
        ,
        revenueActual,
        revenueEstimate,
        revenueBeatMiss,
        ,
        guidance,
        nextEarningsDate,
      ] = row
      return {
        ticker: ticker.trim(),
        period: period.trim(),
        epsActual: parseNumber(epsActual),
        epsEstimate: parseNumber(epsEstimate),
        epsBeatMiss: parseNumber(epsBeatMiss),
        revenueActual: revenueActual?.trim() ?? '',
        revenueEstimate: revenueEstimate?.trim() ?? '',
        revenueBeatMiss: revenueBeatMiss?.trim() ?? '',
        guidance: guidance?.trim() ?? '',
        nextEarningsDate: nextEarningsDate?.trim() || null,
      } satisfies EarningsRow
    })
}

export function parseOutlook(rows: string[][]): OutlookRow[] {
  return rows
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const [ticker, netMarginTtm, freeCashFlowTtm, managementOutlook] = row
      return {
        ticker: ticker.trim(),
        netMarginTtm: netMarginTtm.trim(),
        freeCashFlowTtm: freeCashFlowTtm.trim(),
        managementOutlook: managementOutlook?.trim() ?? '',
      } satisfies OutlookRow
    })
}

export function parseOverviewSummary(rows: string[][]): PortfolioSummary {
  const usdTotal = rows.find((row) => row[0]?.trim() === 'TOTAL USD')
  const sgdTotal = rows.find((row) => row[0]?.trim() === 'TOTAL SGD')

  if (!usdTotal || !sgdTotal) {
    throw new Error('Portfolio Overview sheet is missing a TOTAL USD or TOTAL SGD row')
  }

  return {
    totalInvestedUsd: parseNumber(usdTotal[1]) ?? 0,
    marketValueUsd: parseNumber(usdTotal[2]) ?? 0,
    unrealizedPnlUsd: parseNumber(usdTotal[3]) ?? 0,
    unrealizedPnlPctUsd: parseNumber(usdTotal[4]) ?? 0,
    totalInvestedSgd: parseNumber(sgdTotal[1]) ?? 0,
    currentValueSgd: parseNumber(sgdTotal[2]) ?? 0,
    unrealizedPnlSgd: parseNumber(sgdTotal[3]) ?? 0,
    unrealizedPnlPctSgd: parseNumber(sgdTotal[4]) ?? 0,
  }
}
