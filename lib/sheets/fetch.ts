// lib/sheets/fetch.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { fetchRange } from './client'
import {
  parseEarnings,
  parseIbkrHoldings,
  parseMoomooHoldings,
  parseOutlook,
  parseOverviewSummary,
  parseSgHoldings,
  parseTradeLog,
  parseWatchlist,
} from './parse'
import type {
  EarningsRow,
  Holding,
  OutlookRow,
  PortfolioSummary,
  TradeLogEntry,
  WatchlistItem,
} from './types'

export async function getOverview(): Promise<PortfolioSummary> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Portfolio Overview!A1:E20')
  return parseOverviewSummary(rows)
}

export async function getIbkrHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('IBKR Portfolio!A36:M90')
  return parseIbkrHoldings(rows)
}

export async function getMoomooHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Moo Moo Portfolio!A7:J20')
  return parseMoomooHoldings(rows)
}

export async function getSgHoldings(): Promise<Holding[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('SG Investments Portfolio!A6:G15')
  return parseSgHoldings(rows)
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Holdings!A2:C25')
  return parseWatchlist(rows)
}

export async function getTradeLog(): Promise<TradeLogEntry[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Trade Log!A2:J50')
  return parseTradeLog(rows)
}

export async function getEarnings(): Promise<EarningsRow[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Quarterly Results!A2:M20')
  return parseEarnings(rows)
}

export async function getOutlook(): Promise<OutlookRow[]> {
  'use cache'
  cacheTag('portfolio')
  cacheLife('portfolioData')
  const rows = await fetchRange('Profitability & Outlook!A2:D20')
  return parseOutlook(rows)
}
