// lib/sheets/fetch.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { fetchRange } from './client'
import {
  parseIbkrHoldings,
  parseMoomooHoldings,
  parseOverviewSummary,
  parseSgHoldings,
  parseTradeLog,
  parseWatchlist,
} from './parse'
import type { Holding, PortfolioSummary, TradeLogEntry, WatchlistItem } from './types'

// Ranges are deliberately wider than the current data: the parsers key off the
// numeric `#` column (or a valid Held/Watchlist status), so trailing TOTALS /
// NOTES blocks and future rows are ignored rather than mis-parsed.

export async function getOverview(): Promise<PortfolioSummary> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Overview!A1:F40')
  return parseOverviewSummary(rows)
}

export async function getIbkrHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('IBKR Portfolio!A13:M150')
  return parseIbkrHoldings(rows)
}

export async function getMoomooHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Moo Moo Portfolio!A8:J80')
  return parseMoomooHoldings(rows)
}

export async function getSgHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('SG Portfolio!A10:G50')
  return parseSgHoldings(rows)
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  // The Held/Watchlist ticker list lives on the tab labelled "Earnings".
  const rows = await fetchRange('Earnings!A1:C80')
  return parseWatchlist(rows)
}

export async function getTradeLog(): Promise<TradeLogEntry[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Trade Log!A2:J80')
  return parseTradeLog(rows)
}
