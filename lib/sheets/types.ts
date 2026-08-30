export interface Holding {
  ticker: string
  name: string
  broker: 'IBKR' | 'MooMoo' | 'SG'
  sector?: string
  status: 'Held' | 'Watchlist'
  shares: number | null
  avgCost: number | null
  lastPrice: number | null
  marketValue: number | null
  unrealizedPnl: number | null
  unrealizedPnlPct: number | null
  targetPct: number | null
  currency: 'USD' | 'SGD'
}

export interface TradeLogEntry {
  date: string
  ticker: string
  company: string
  side: 'BUY' | 'SELL'
  shares: number
  price: number
  netAmount: number
  orderType: string
  commission: number
}

export interface WatchlistItem {
  ticker: string
  company: string
  status: 'Held' | 'Watchlist'
}

export interface EarningsRow {
  ticker: string
  period: string
  epsActual: number | null
  epsEstimate: number | null
  epsBeatMiss: number | null
  revenueActual: string
  revenueEstimate: string
  revenueBeatMiss: string
  guidance: string
  nextEarningsDate: string | null
}

export interface OutlookRow {
  ticker: string
  netMarginTtm: string
  freeCashFlowTtm: string
  managementOutlook: string
}

export interface PortfolioSummary {
  totalInvestedUsd: number
  marketValueUsd: number
  unrealizedPnlUsd: number
  unrealizedPnlPctUsd: number
  totalInvestedSgd: number
  currentValueSgd: number
  unrealizedPnlSgd: number
  unrealizedPnlPctSgd: number
}
