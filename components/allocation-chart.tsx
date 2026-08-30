'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { SectorSlice } from '@/lib/aggregate'

const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#a855f7', '#f59e0b', '#94a3b8']

function compact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
  return `$${value.toFixed(0)}`
}

export function AllocationChart({
  slices,
  totalLabel,
}: {
  slices: SectorSlice[]
  totalLabel?: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (slices.length === 0 || total === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No holdings to chart yet</p>
  }

  return (
    <div>
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="sector"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice, index) => (
                <Cell key={slice.sector} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
          <span className="font-numeric text-lg font-semibold text-slate-900">
            {totalLabel ?? compact(total)}
          </span>
        </div>
      </div>

      {/* Accessible fallback: donut slices fail WCAG colour-only checks, so
          percentages are always shown as text, not only on chart hover. */}
      <ul className="mt-4 space-y-2 text-sm">
        {slices.map((slice, index) => (
          <li key={slice.sector} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden
              />
              {slice.sector}
            </span>
            <span className="font-medium tabular-nums text-slate-900">
              {((slice.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
