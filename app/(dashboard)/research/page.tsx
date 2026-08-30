import { Suspense } from 'react'
import { connection } from 'next/server'
import { getEarnings, getOutlook } from '@/lib/sheets/fetch'
import { mergeResearch } from '@/lib/research'
import { ResearchCard } from '@/components/research-card'

export default function ResearchPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Research</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ResearchContent />
      </Suspense>
    </main>
  )
}

async function ResearchContent() {
  await connection()
  const [earnings, outlook] = await Promise.all([getEarnings(), getOutlook()])
  const rows = mergeResearch(earnings, outlook)

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <ResearchCard key={row.ticker} row={row} />
      ))}
    </div>
  )
}
