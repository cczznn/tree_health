import { describe, it, expect } from 'vitest'

interface BodyMetricEntry {
  id: string
  metricDate: string
  weight: number
  waist: number | null
  note: string | null
}

interface BodyFormInput {
  weight: number
  waist: number | null
  note: string
}

function validateBodyForm(input: Partial<BodyFormInput>): string[] {
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

function computeTrend(records: BodyMetricEntry[]) {
  if (records.length < 2) return { latest: records[0] ?? null, previous: null, delta: 0, direction: '—' as const }
  const sorted = [...records].sort((a, b) => a.metricDate.localeCompare(b.metricDate))
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]
  const delta = Math.round((latest.weight - previous.weight) * 10) / 10
  return {
    latest,
    previous,
    delta,
    direction: delta > 0 ? ('↑' as const) : delta < 0 ? ('↓' as const) : ('—' as const),
  }
}

describe('validateBodyForm', () => {
  it('accepts valid weight with optional waist', () => {
    expect(validateBodyForm({ weight: 68.5, waist: 78 })).toEqual([])
  })

  it('accepts weight only (waist optional)', () => {
    expect(validateBodyForm({ weight: 70, waist: null })).toEqual([])
  })

  it('rejects missing weight', () => {
    expect(validateBodyForm({ waist: 80 }).some((e) => e.includes('体重'))).toBe(true)
  })

  it('rejects zero weight', () => {
    expect(validateBodyForm({ weight: 0 }).some((e) => e.includes('0-500'))).toBe(true)
  })

  it('rejects excessive waist', () => {
    expect(validateBodyForm({ weight: 70, waist: 999 }).some((e) => e.includes('围度'))).toBe(true)
  })
})

describe('computeTrend', () => {
  it('returns null previous when only one record', () => {
    const trend = computeTrend([{ id: '1', metricDate: '2026-05-27', weight: 68.5, waist: null, note: null }])
    expect(trend.latest?.weight).toBe(68.5)
    expect(trend.previous).toBeNull()
    expect(trend.direction).toBe('—')
  })

  it('computes delta and direction with two records', () => {
    const records = [
      { id: '1', metricDate: '2026-05-20', weight: 70, waist: null, note: null },
      { id: '2', metricDate: '2026-05-27', weight: 68.5, waist: null, note: null },
    ]
    const trend = computeTrend(records)
    expect(trend.delta).toBe(-1.5)
    expect(trend.direction).toBe('↓')
  })

  it('sorts by date regardless of input order', () => {
    const records = [
      { id: '2', metricDate: '2026-05-27', weight: 68, waist: null, note: null },
      { id: '1', metricDate: '2026-05-20', weight: 70, waist: null, note: null },
    ]
    const trend = computeTrend(records)
    expect(trend.delta).toBe(-2)
  })
})
