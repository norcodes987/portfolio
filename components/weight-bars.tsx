import type { BrokerWeight } from '@/lib/aggregate'

export function WeightBars({ weights }: { weights: BrokerWeight[] }) {
  if (weights.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No portfolio weight data yet</p>
  }

  return (
    <ul className="space-y-4">
      {weights.map((weight) => (
        <li key={weight.broker}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{weight.broker}</span>
            <span className="tabular-nums font-semibold text-slate-900">{weight.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.max(weight.pct, 1.5)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
