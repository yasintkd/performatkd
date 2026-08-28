'use client'

import { cn } from '@/lib/utils'
import { calculateVO2max, getPerformanceCategory, CATEGORY_COLORS, getLevelSpeed, type Gender } from '@/lib/calculations/beep-test'

export function BeepTestInput({
  id,
  student,
  level,
  shuttle,
  onLevel,
  onShuttle,
  previousValue,
}: {
  id: string
  student: { first_name: string; belt?: string; birth_date?: string | null; gender?: string }
  level: string
  shuttle: string
  onLevel: (v: string) => void
  onShuttle: (v: string) => void
  previousValue?: string
}) {
  const l = Number(level)
  const s = Number(shuttle)
  const valid = l >= 1 && s >= 0 && s <= 16
  const vo2max = valid ? calculateVO2max(l, s) : null
  const gender: Gender = student.gender === 'kiz' || student.gender === 'female' ? 'female' : 'male'
  const cat = valid && vo2max !== null ? getPerformanceCategory(vo2max, gender) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Level / Shuttle</span>
        {previousValue && <span className="text-xs text-gray-400">Önceki: {previousValue}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-sm text-gray-600">Level</span>
          <select
            value={level}
            onChange={(e) => onLevel(e.target.value)}
            className="h-[44px] w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-base outline-none focus:border-[var(--color-secondary)] focus:ring-2"
          >
            <option value="">—</option>
            {Array.from({ length: 21 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Shuttle</span>
          <select
            value={shuttle}
            onChange={(e) => onShuttle(e.target.value)}
            className="h-[44px] w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-base outline-none focus:border-[var(--color-secondary)] focus:ring-2"
          >
            <option value="">—</option>
            {Array.from({ length: 17 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      {valid && vo2max !== null && cat && (
        <div className="space-y-1 rounded-lg bg-gray-50 p-2 text-sm">
          <p>
            VO2max: <span className="font-bold">{vo2max} ml/kg/min</span>
          </p>
          <p>
            Hız: {getLevelSpeed(l)} km/s · {cat}
          </p>
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', CATEGORY_COLORS[cat])}>
            {cat}
          </span>
        </div>
      )}
      <input type="hidden" id={id} value={vo2max ?? ''} readOnly />
    </div>
  )
}