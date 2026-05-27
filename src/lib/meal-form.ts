export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealFormInput {
  foodId: string
  foodName: string
  amount: number
  mealType: MealType
}

export interface MealFormError {
  field: string
  message: string
}

export function validateMealForm(input: Partial<MealFormInput>): MealFormError[] {
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

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type] ?? type
}
