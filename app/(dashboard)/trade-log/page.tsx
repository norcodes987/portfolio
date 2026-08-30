import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTradeLog } from '@/lib/sheets/fetch'
import { TradeLogTable } from '@/components/trade-log-table'

export default function TradeLogPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Trade Log</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <TradeLogContent />
      </Suspense>
    </main>
  )
}

async function TradeLogContent() {
  await connection()
  const trades = await getTradeLog()
  return <TradeLogTable trades={trades} />
}
