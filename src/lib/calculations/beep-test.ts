export function calculateContinuousScore(level: number, shuttle: number): number {
  if (level === 1) return 1 + (shuttle - 1) / 7
  return level + (shuttle - 1) / 8
}

export function calculateVO2max(level: number, shuttle: number): number {
  return Math.round((3.46 * calculateContinuousScore(level, shuttle) + 12.2) * 100) / 100
}

export function getLevelSpeed(level: number): number {
  return 8.5 + (level - 1) * 0.5
}

export function calculateTotalDistance(level: number, shuttle: number): number {
  let totalShuttles = 0
  for (let l = 1; l < level; l++) totalShuttles += l === 1 ? 7 : 8
  return (totalShuttles + shuttle) * 20
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}

export type Gender = 'male' | 'female'

const NORMS: Record<Gender, [string, number][]> = {
  male: [['Çok İyi', 55], ['İyi', 48], ['Orta', 42], ['Zayıf', 37], ['Çok Zayıf', 0]],
  female: [['Çok İyi', 48], ['İyi', 41], ['Orta', 35], ['Zayıf', 30], ['Çok Zayıf', 0]],
}

export function getPerformanceCategory(vo2max: number, gender: Gender): string {
  for (const [cat, min] of NORMS[gender]) if (vo2max >= min) return cat
  return 'Çok Zayıf'
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Çok İyi': 'bg-yellow-400 text-gray-900',
  'İyi': 'bg-green-500 text-white',
  'Orta': 'bg-blue-600 text-white',
  'Zayıf': 'bg-orange-500 text-white',
  'Çok Zayıf': 'bg-red-600 text-white',
}