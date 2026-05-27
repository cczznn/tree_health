import { describe, it, expect } from 'vitest'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface MealFormInput {
  foodId: string
  foodName: string
  amount: number
  mealType: MealType
}

interface MealFormError {
  field: string
  message: string
}

function validateMealForm(input: Partial<MealFormInput>): MealFormError[] {
  const errors: MealFormError[] = []
  if (!input.foodId) errors.push({ field: 'foodId', message: '请选择食物' })
  if (!input.foodName) errors.push({ field: 'foodName', message: '请选择食物' })
  if (input.amount === undefined || input.amount === null) {
    errors.push({ field: 'amount', message: '请输入份量' })
  } else if (input.amount <= 0) {
    errors.push({ field: 'amount', message: '份量必须大于 0' })
  } else if (!Number.isFinite(input.amount)) {
    errors.push({ field: 'amount', message: '份量必须为数字' })
  }
  if (!input.mealType) errors.push({ field: 'mealType', message: '请选择餐次' })
  return errors
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type] ?? type
}

describe('validateMealForm', () => {
  it('returns no errors for valid input', () => {
    const errors = validateMealForm({
      foodId: 'f-1', foodName: '燕麦', amount: 1, mealType: 'breakfast',
    })
    expect(errors).toEqual([])
  })

  it('requires food selection', () => {
    const errors = validateMealForm({ amount: 1, mealType: 'lunch' })
    expect(errors.some((e) => e.field === 'foodId')).toBe(true)
  })

  it('requires amount to be positive', () => {
    const errors = validateMealForm({
      foodId: 'f-1', foodName: '鸡蛋', amount: 0, mealType: 'dinner',
    })
    expect(errors.some((e) => e.field === 'amount')).toBe(true)
  })

  it('requires amount to be finite', () => {
    const errors = validateMealForm({
      foodId: 'f-1', foodName: '鸡蛋', amount: NaN, mealType: 'dinner',
    })
    expect(errors.some((e) => e.field === 'amount')).toBe(true)
  })

  it('requires meal type', () => {
    const errors = validateMealForm({
      foodId: 'f-1', foodName: '鸡蛋', amount: 1,
    })
    expect(errors.some((e) => e.field === 'mealType')).toBe(true)
  })

  it('validates missing amount', () => {
    const errors = validateMealForm({
      foodId: 'f-1', foodName: '鸡蛋', mealType: 'snack',
    })
    expect(errors.some((e) => e.field === 'amount')).toBe(true)
  })
})

describe('getMealTypeLabel', () => {
  it('returns Chinese label for each type', () => {
    expect(getMealTypeLabel('breakfast')).toBe('早餐')
    expect(getMealTypeLabel('lunch')).toBe('午餐')
    expect(getMealTypeLabel('dinner')).toBe('晚餐')
    expect(getMealTypeLabel('snack')).toBe('加餐')
  })
})
