import { describe, it, expect } from 'vitest'
import { getDailyStats, getMealRecords, searchFoods, getCurrentWorkoutPlan } from '../../src/lib/api'

describe('getDailyStats', () => {
  it('returns daily stats with required fields', async () => {
    const stats = await getDailyStats('2026-05-27')

    expect(stats).toHaveProperty('date')
    expect(stats).toHaveProperty('mealCount')
    expect(stats).toHaveProperty('totalCalories')
    expect(stats).toHaveProperty('totalProtein')
    expect(stats).toHaveProperty('totalFat')
    expect(stats).toHaveProperty('totalCarbs')
    expect(stats).toHaveProperty('totalFiber')
    expect(stats).toHaveProperty('totalSugar')
    expect(stats).toHaveProperty('totalSodium')
    expect(stats).toHaveProperty('goalType')
    expect(stats.goalType).toBe('maintain')
  })

  it('returns positive numeric values for nutrition fields', async () => {
    const stats = await getDailyStats('2026-05-27')

    expect(stats.mealCount).toBeGreaterThan(0)
    expect(stats.totalCalories).toBeGreaterThan(0)
    expect(stats.totalProtein).toBeGreaterThan(0)
    expect(stats.totalFat).toBeGreaterThan(0)
    expect(stats.totalCarbs).toBeGreaterThan(0)
  })
})

describe('getMealRecords', () => {
  it('returns data array and summary object', async () => {
    const result = await getMealRecords('2026-05-27')

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('summary')
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('each meal record has required fields', async () => {
    const result = await getMealRecords('2026-05-27')

    for (const record of result.data) {
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('userId')
      expect(record).toHaveProperty('foodId')
      expect(record).toHaveProperty('mealType')
      expect(record).toHaveProperty('amount')
      expect(record).toHaveProperty('unit')
      expect(record).toHaveProperty('calories')
      expect(record).toHaveProperty('recordDate')
    }
  })

  it('summary matches data totals', async () => {
    const result = await getMealRecords('2026-05-27')

    expect(result.summary.mealCount).toBe(result.data.length)
    expect(result.summary.totalCalories).toBeGreaterThan(0)
  })
})

describe('searchFoods', () => {
  it('returns data array and total count', async () => {
    const result = await searchFoods('')

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.total).toBe(result.data.length)
  })

  it('each food item has id, name, and calories', async () => {
    const result = await searchFoods('鸡')

    for (const food of result.data) {
      expect(food).toHaveProperty('id')
      expect(food).toHaveProperty('name')
      expect(food).toHaveProperty('caloriesPer100g')
      expect(typeof food.name).toBe('string')
    }
  })
})

describe('getCurrentWorkoutPlan', () => {
  it('returns plan with required fields', async () => {
    const result = await getCurrentWorkoutPlan()

    expect(result).toHaveProperty('data')
    expect(result.data).toHaveProperty('id')
    expect(result.data).toHaveProperty('title')
    expect(result.data).toHaveProperty('goalType')
    expect(result.data).toHaveProperty('frequencyPerWeek')
    expect(result.data).toHaveProperty('durationMinutes')
    expect(result.data).toHaveProperty('planContent')
  })

  it('planContent includes weeklySchedule with exercises', async () => {
    const result = await getCurrentWorkoutPlan('maintain', 3)

    const schedule = result.data.planContent.weeklySchedule
    expect(schedule).toBeDefined()
    expect(schedule!.length).toBe(3)
    expect(schedule![0]).toHaveProperty('dayLabel')
    expect(schedule![0]).toHaveProperty('focus')
    expect(schedule![0]).toHaveProperty('exercises')
    expect(Array.isArray(schedule![0].exercises)).toBe(true)
  })

  it('accepts optional goalType and frequency params', async () => {
    const fatLossPlan = await getCurrentWorkoutPlan('fat_loss', 5)
    expect(fatLossPlan.data.goalType).toBe('maintain') // mock always returns maintain

    const musclePlan = await getCurrentWorkoutPlan('muscle_gain', 2)
    expect(musclePlan.data.frequencyPerWeek).toBe(3) // mock always returns 3
  })
})
