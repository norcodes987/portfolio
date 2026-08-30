import type { ResearchRow } from '@/lib/research'

export function ResearchCard({ row }: { row: ResearchRow }) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold">{row.ticker}</h2>
      {row.earnings && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Period</dt>
          <dd>{row.earnings.period}</dd>
          <dt className="text-gray-500">EPS actual / est.</dt>
          <dd>
            {row.earnings.epsActual ?? '—'} / {row.earnings.epsEstimate ?? '—'}
          </dd>
          <dt className="text-gray-500">Revenue actual / est.</dt>
          <dd>
            {row.earnings.revenueActual} / {row.earnings.revenueEstimate}
          </dd>
          <dt className="text-gray-500">Guidance</dt>
          <dd>{row.earnings.guidance}</dd>
        </dl>
      )}
      {row.outlook && <p className="mt-3 text-sm text-gray-600">{row.outlook.managementOutlook}</p>}
    </div>
  )
}
