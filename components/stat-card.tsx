interface StatCardProps {
  label: string
  value: string
  sub?: string
  deltaLabel?: string
  deltaPositive?: boolean
  /** draws a thin emerald rule along the top edge — used for the headline P&L card */
  accent?: boolean
}

export function StatCard({ label, value, sub, deltaLabel, deltaPositive, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {accent && <span className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-2 font-numeric text-[28px] leading-none font-semibold ${
          accent ? (deltaPositive ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-xs text-slate-400">{sub}</p>}
      {deltaLabel && (
        <p
          className={`mt-2 text-xs font-semibold ${
            deltaPositive ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {deltaLabel}
        </p>
      )}
    </div>
  )
}
