import { describe, it, expect } from 'vitest'
import { filterFoods, formatCalories, type FoodItem } from '../../src/lib/food-search'

const MOCK_FOODS: FoodItem[] = [
  { id: 'f-1', name: '燕麦酸奶碗', caloriesPer100g: 180 },
  { id: 'f-2', name: '鸡胸肉沙拉', caloriesPer100g: 145 },
  { id: 'f-3', name: '清蒸鱼', caloriesPer100g: 110 },
  { id: 'f-4', name: '全麦面包', caloriesPer100g: 250 },
  { id: 'f-5', name: '牛奶', caloriesPer100g: 65 },
  { id: 'f-6', name: '苹果', caloriesPer100g: 52 },
  { id: 'f-7', name: '鸡蛋', caloriesPer100g: 144 },
  { id: 'f-8', name: '西兰花', caloriesPer100g: 34 },
  { id: 'f-9', name: '糙米饭', caloriesPer100g: 123 },
  { id: 'f-10', name: '牛肉', caloriesPer100g: 250 },
  { id: 'f-11', name: '三文鱼', caloriesPer100g: 208 },
  { id: 'f-12', name: '豆腐', caloriesPer100g: 76 },
]

describe('filterFoods', () => {
  it('returns first 10 items when query is empty', () => {
    const result = filterFoods(MOCK_FOODS, '')
    expect(result.length).toBe(10)
  })

  it('returns all items when foods < 10 and query empty', () => {
    const few = MOCK_FOODS.slice(0, 3)
    const result = filterFoods(few, '')
    expect(result.length).toBe(3)
  })

  it('filters by name substring (case insensitive)', () => {
    const result = filterFoods(MOCK_FOODS, '鸡')
    expect(result.length).toBe(2)
    expect(result.map((f) => f.name)).toContain('鸡胸肉沙拉')
    expect(result.map((f) => f.name)).toContain('鸡蛋')
  })

  it('returns empty array when no match', () => {
    const result = filterFoods(MOCK_FOODS, 'xyz不存在的食物')
    expect(result).toEqual([])
  })

  it('handles leading/trailing whitespace in query', () => {
    const result = filterFoods(MOCK_FOODS, '  牛奶  ')
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('牛奶')
  })
})

describe('formatCalories', () => {
  it('formats calories with unit', () => {
    expect(formatCalories({ id: 'f-1', name: 'test', caloriesPer100g: 180 }))
      .toBe('180 kcal/100g')
  })
})
