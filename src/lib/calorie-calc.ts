// Mifflin-St Jeor Equation for BMR
// Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
// Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

export const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; factor: number }[] = [
  { key: 'sedentary', label: '久坐不动', factor: 1.2 },
  { key: 'light', label: '轻度活动', factor: 1.375 },
  { key: 'moderate', label: '中度活动', factor: 1.55 },
  { key: 'active', label: '高度活动', factor: 1.725 },
  { key: 'athlete', label: '运动员', factor: 1.9 },
]

export function getActivityFactor(level: ActivityLevel): number {
  return ACTIVITY_OPTIONS.find(o => o.key === level)?.factor ?? 1.2
}

export function calcBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(base + (gender === 'male' ? 5 : -161))
}

export function calcTDEE(bmr: number, activityLevel: ActivityLevel = 'sedentary'): number {
  return Math.round(bmr * getActivityFactor(activityLevel))
}

export function calcCalorieTarget(
  tdee: number,
  goalType: 'fat_loss' | 'muscle_gain' | 'maintain',
): { calories: number; label: string } {
  if (goalType === 'fat_loss') return { calories: Math.round(tdee - 400), label: '减脂（热量缺口 ~400 kcal）' }
  if (goalType === 'muscle_gain') return { calories: Math.round(tdee + 300), label: '增肌（热量盈余 ~300 kcal）' }
  return { calories: tdee, label: '维持体重' }
}

export interface CalorieInput {
  weightKg: number
  heightCm: number
  age: number
  gender: 'male' | 'female'
  goalType: 'fat_loss' | 'muscle_gain' | 'maintain'
  activityLevel?: ActivityLevel
}

export function calcDailyTarget(input: CalorieInput): { bmr: number; tdee: number; target: number; label: string } {
  const bmr = calcBMR(input.weightKg, input.heightCm, input.age, input.gender)
  const tdee = calcTDEE(bmr, input.activityLevel || 'sedentary')
  const target = calcCalorieTarget(tdee, input.goalType)
  return { bmr, tdee, target: target.calories, label: target.label }
}
