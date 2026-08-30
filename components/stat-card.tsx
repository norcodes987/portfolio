interface StatCardProps {
  label: string
  value: string
  deltaLabel?: string
  deltaPositive?: boolean
}

export function StatCard({ label, value, deltaLabel, deltaPositive }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {deltaLabel && (
        <p className={`mt-1 text-sm font-medium ${deltaPositive ? 'text-green-600' : 'text-red-600'}`}>
          {deltaLabel}
        </p>
      )}
    </div>
  )
}
