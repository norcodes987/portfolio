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
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
      {accent && <span className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[11px]">
        {label}
      </p>
      <p
        className={`mt-1.5 font-numeric text-xl leading-none font-semibold sm:mt-2 sm:text-[28px] ${
          accent ? (deltaPositive ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] text-slate-400 sm:mt-2 sm:text-xs">{sub}</p>}
      {deltaLabel && (
        <p
          className={`mt-1.5 text-[11px] font-semibold sm:mt-2 sm:text-xs ${
            deltaPositive ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {deltaLabel}
        </p>
      )}
    </div>
  )
}
