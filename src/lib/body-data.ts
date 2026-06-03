export interface BodyMetricEntry {
  id: string
  metricDate: string
  weight: number
  height: number | null
  waist: number | null
  chest: number | null
  hip: number | null
  note: string | null
}

export interface BodyFormInput {
  weight: number
  height: number | null
  waist: number | null
  chest: number | null
  hip: number | null
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
  if (input.height !== undefined && input.height !== null) {
    if (input.height <= 0 || input.height > 250) {
      errors.push('身高需在 0-250 cm 之间')
    }
  }
  if (input.waist !== undefined && input.waist !== null) {
    if (input.waist <= 0 || input.waist > 300) {
      errors.push('围度需在 0-300 cm 之间')
    }
  }
  if (input.chest !== undefined && input.chest !== null) {
    if (input.chest <= 0 || input.chest > 300) {
      errors.push('胸围需在 0-300 cm 之间')
    }
  }
  if (input.hip !== undefined && input.hip !== null) {
    if (input.hip <= 0 || input.hip > 300) {
      errors.push('臀围需在 0-300 cm 之间')
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
