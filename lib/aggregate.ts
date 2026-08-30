import type { Holding } from './sheets/types'

export interface SectorSlice {
  sector: string
  value: number
}

export function aggregateBySector(holdings: Holding[], maxSlices = 6): SectorSlice[] {
  const totals = new Map<string, number>()

  for (const holding of holdings) {
    if (holding.marketValue === null) continue
    const sector = holding.sector ?? 'Other'
    totals.set(sector, (totals.get(sector) ?? 0) + holding.marketValue)
  }

  const sorted = [...totals.entries()]
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value)

  if (sorted.length <= maxSlices) return sorted

  const top = sorted.slice(0, maxSlices - 1)
  const rest = sorted.slice(maxSlices - 1)
  const otherValue = rest.reduce((sum, slice) => sum + slice.value, 0)
  return [...top, { sector: 'Other', value: otherValue }]
}

export interface HoldingsSummary {
  marketValue: number
  unrealizedPnl: number
  /** P&L as a % of cost basis (marketValue - unrealizedPnl); 0 when nothing is held */
  unrealizedPnlPct: number
}

export function summarizeHoldings(holdings: Holding[]): HoldingsSummary {
  let marketValue = 0
  let unrealizedPnl = 0

  for (const holding of holdings) {
    if (holding.marketValue === null) continue
    marketValue += holding.marketValue
    unrealizedPnl += holding.unrealizedPnl ?? 0
  }

  const costBasis = marketValue - unrealizedPnl
  return {
    marketValue,
    unrealizedPnl,
    unrealizedPnlPct: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0,
  }
}

export interface BrokerWeight {
  broker: Holding['broker']
  pct: number
}

export function computeBrokerWeights(holdings: Holding[]): BrokerWeight[] {
  const totals = new Map<Holding['broker'], number>()
  let grandTotal = 0

  for (const holding of holdings) {
    if (holding.marketValue === null) continue
    totals.set(holding.broker, (totals.get(holding.broker) ?? 0) + holding.marketValue)
    grandTotal += holding.marketValue
  }

  if (grandTotal === 0) return []

  return [...totals.entries()].map(([broker, value]) => ({
    broker,
    pct: (value / grandTotal) * 100,
  }))
}
