export interface BodyMetricEntry {
  id: string
  metricDate: string
  weight: number
  waist: number | null
  note: string | null
}

export interface BodyFormInput {
  weight: number
  waist: number | null
  note: string
}

export function validateBodyForm(input: Partial<BodyFormInput>): string[] {
  const errors: string[] = []
  if (input.weight === undefined || input.weight === null) {
    errors.push('请输入体重')
  } else if (input.weight <= 0 || input.weight > 500) {
    errors.push('体重需在 0-500 kg 之间')
  } else if (!Number.isFinite(input.weight)) {
    errors.push('体重必须为数字')
  }
  if (input.waist !== undefined && input.waist !== null) {
    if (input.waist <= 0 || input.waist > 300) {
      errors.push('围度需在 0-300 cm 之间')
    }
  }
  return errors
}

export function computeTrend(records: BodyMetricEntry[]) {
  if (records.length < 2) return { latest: records[0] ?? null, previous: null, delta: 0, direction: '—' as const }
  const sorted = [...records].sort((a, b) => a.metricDate.localeCompare(b.metricDate))
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]
  const delta = Math.round((latest.weight - previous.weight) * 10) / 10
  return {
    latest,
    previous,
    delta,
    direction: (delta > 0 ? '↑' : delta < 0 ? '↓' : '—') as '↑' | '↓' | '—',
  }
}
