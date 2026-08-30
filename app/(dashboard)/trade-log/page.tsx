import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTradeLog } from '@/lib/sheets/fetch'
import { Panel } from '@/components/panel'
import { TradeLogTable } from '@/components/trade-log-table'

export default function TradeLogPage() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Trade Log</h1>
      <p className="mb-5 text-sm text-slate-400">Executed trades, most recent first.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />}>
        <TradeLogContent />
      </Suspense>
    </div>
  )
}

async function TradeLogContent() {
  await connection()
  const trades = await getTradeLog()
  return (
    <Panel bodyClassName="px-1 py-1 sm:px-4 sm:py-2">
      <TradeLogTable trades={trades} />
    </Panel>
  )
}
