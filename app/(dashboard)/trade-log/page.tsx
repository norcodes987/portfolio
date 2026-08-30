import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTradeLog } from '@/lib/sheets/fetch'
import { Panel } from '@/components/panel'
import { TradeLogTable } from '@/components/trade-log-table'

export default function TradeLogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
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
    <Panel bodyClassName="px-2 py-2 sm:px-4">
      <TradeLogTable trades={trades} />
    </Panel>
  )
}
