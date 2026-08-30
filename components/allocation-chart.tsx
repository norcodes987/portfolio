'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { SectorSlice } from '@/lib/aggregate'

const COLORS = ['#0d9488', '#0891b2', '#6366f1', '#a855f7', '#f59e0b', '#94a3b8']

export function AllocationChart({ slices }: { slices: SectorSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (slices.length === 0 || total === 0) {
    return <p className="p-4 text-sm text-gray-500">No holdings to chart yet</p>
  }

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="sector" innerRadius="60%" outerRadius="90%">
              {slices.map((slice, index) => (
                <Cell key={slice.sector} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible fallback: donut slices fail WCAG color-only checks, so
          percentages are always shown as text, not only on chart hover. */}
      <ul className="mt-2 space-y-1 text-sm">
        {slices.map((slice, index) => (
          <li key={slice.sector} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {slice.sector}
            </span>
            <span className="tabular-nums">{((slice.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
