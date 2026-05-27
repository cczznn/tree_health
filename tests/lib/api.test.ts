import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDailyStats, getMealRecords, searchFoods, getCurrentWorkoutPlan } from '../../src/lib/api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOk(data: unknown) {
  return { ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) }
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('getDailyStats', () => {
  it('calls /api/stats/daily and returns data', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: { date: '2026-05-27', mealCount: 3, totalCalories: 1400 } }))
    const result = await getDailyStats('2026-05-27')
    expect(mockFetch).toHaveBeenCalledWith('/api/stats/daily?date=2026-05-27', expect.any(Object))
    expect(result.mealCount).toBe(3)
  })
})

describe('getMealRecords', () => {
  it('calls /api/meal-records and returns data', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: [], summary: { mealCount: 0, totalCalories: 0 } }))
    const result = await getMealRecords('2026-05-27')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('summary')
  })
})

describe('searchFoods', () => {
  it('calls /api/foods with query', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: [], total: 0 }))
    const result = await searchFoods('鸡')
    expect(mockFetch).toHaveBeenCalledWith('/api/foods?query=%E9%B8%A1', expect.any(Object))
    expect(result.total).toBe(0)
  })
})

describe('getCurrentWorkoutPlan', () => {
  it('calls /api/workout-plans/current', async () => {
    mockFetch.mockResolvedValue(mockOk({ data: { id: 'wp-1', title: 'test', goalType: 'maintain', frequencyPerWeek: 3, durationMinutes: 30, planContent: {} } }))
    const result = await getCurrentWorkoutPlan('fat_loss', 5)
    expect(result.data.id).toBe('wp-1')
  })
})
