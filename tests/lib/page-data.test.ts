import { describe, it, expect } from 'vitest'
import { buildHomeDisplay, buildDietDisplay } from '../../src/lib/page-data'
import type { DailyStatsResponse, MealRecordsResponse, WorkoutPlanResponse } from '../../src/lib/api'

const mockStats: DailyStatsResponse = {
  date: '2026-05-27', mealCount: 3, totalCalories: 1400,
  totalProtein: 73, totalFat: 42, totalCarbs: 160,
  totalFiber: 17, totalSugar: 17, totalSodium: 830,
  goalType: 'maintain',
}

function mockMeals(n: number): MealRecordsResponse {
  return {
    data: Array.from({ length: n }, (_, i) => ({
      id: `mr-${i}`, userId: 'u1', foodId: `f-${i}`,
      mealType: 'breakfast' as const, amount: 1, unit: '份',
      calories: 420, protein: 18, fat: 12, carbs: 55,
      fiber: 5, sugar: 8, sodium: 200, recordDate: '2026-05-27', note: null,
    })),
    summary: {
      mealCount: n, totalCalories: n * 420, totalProtein: n * 18,
      totalFat: n * 12, totalCarbs: n * 55,
      totalFiber: n * 5, totalSugar: n * 8, totalSodium: n * 200,
    },
  }
}

const mockPlan: WorkoutPlanResponse = {
  data: {
    id: 'wp-1', title: '新手入门训练计划', goalType: 'maintain',
    frequencyPerWeek: 3, durationMinutes: 30,
    planContent: { summary: '每周 3 次全身训练', weeklySchedule: [] },
  },
}

describe('buildHomeDisplay', () => {
  it('returns loading state when data is null', () => {
    const result = buildHomeDisplay(null, null, null)
    expect(result.loading).toBe(true)
    expect(result.mealSummary).toBe('加载中')
    expect(result.planSummary).toBe('加载中')
    expect(result.error).toBeNull()
  })

  it('returns error state when error is provided', () => {
    const result = buildHomeDisplay(null, null, null, 'Network error')
    expect(result.loading).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('returns display data with correct meal summary', () => {
    const result = buildHomeDisplay(mockStats, mockMeals(2), mockPlan)
    expect(result.loading).toBe(false)
    expect(result.totalCalories).toBe(1400)
    expect(result.mealCount).toBe(3)
    expect(result.mealSummary).toContain('已记录 2 条')
    expect(result.mealSummary).toContain('840 kcal')
  })

  it('returns display data with correct plan summary', () => {
    const result = buildHomeDisplay(mockStats, mockMeals(1), mockPlan)
    expect(result.planSummary).toContain('新手入门训练计划')
    expect(result.planSummary).toContain('3 次/周')
    expect(result.planSummary).toContain('30 分钟/次')
  })

  it('partial null data returns loading', () => {
    const meals = mockMeals(1)
    expect(buildHomeDisplay(null, meals, mockPlan).loading).toBe(true)
    expect(buildHomeDisplay(mockStats, null, mockPlan).loading).toBe(true)
  })
})

describe('buildDietDisplay', () => {
  it('returns loading state when data is null', () => {
    const result = buildDietDisplay(null, null)
    expect(result.loading).toBe(true)
    expect(result.recordSummary).toBe('加载中')
    expect(result.foodSummary).toBe('加载中')
  })

  it('returns error state when error provided', () => {
    const result = buildDietDisplay(null, null, 'fetch error')
    expect(result.loading).toBe(false)
    expect(result.error).toBe('fetch error')
  })

  it('shows meal count and nutrition in summary', () => {
    const result = buildDietDisplay(mockMeals(3), 12)
    expect(result.loading).toBe(false)
    expect(result.recordSummary).toContain('已记录 3 条')
    expect(result.recordSummary).toContain('1260 kcal')
    expect(result.recordSummary).toContain('蛋白质 54g')
    expect(result.recordSummary).toContain('脂肪 36g')
    expect(result.recordSummary).toContain('碳水 165g')
    expect(result.foodSummary).toContain('12 条')
  })
})
