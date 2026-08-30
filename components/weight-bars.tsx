import type { BrokerWeight } from '@/lib/aggregate'

export function WeightBars({ weights }: { weights: BrokerWeight[] }) {
  if (weights.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No portfolio weight data yet</p>
  }

  return (
    <ul className="space-y-3">
      {weights.map((weight) => (
        <li key={weight.broker}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{weight.broker}</span>
            <span className="tabular-nums">{weight.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${weight.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
