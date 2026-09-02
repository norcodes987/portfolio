interface PnlPillProps {
  value: number | null | undefined
  format: 'currency' | 'percent'
}

/**
 * Gain/loss indicator. Colour is always paired with an explicit +/- sign and a
 * unit, never colour alone (spec accessibility rule).
 */
export function PnlPill({ value, format }: PnlPillProps) {
  if (value == null) return <span className="text-slate-300">—</span>

  const positive = value >= 0
  const magnitude = Math.abs(value)
  const body =
    format === 'currency'
      ? `$${magnitude.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${magnitude.toFixed(2)}%`
  const text = `${positive ? '+' : '-'}${body}`

  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {text}
    </span>
  )
}
