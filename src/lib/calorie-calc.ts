// Mifflin-St Jeor Equation for BMR
// Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
// Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

export function calcBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(base + (gender === 'male' ? 5 : -161))
}

// TDEE = BMR × activity factor (default: sedentary 1.2)
export function calcTDEE(bmr: number, activityLevel: number = 1.2): number {
  return Math.round(bmr * activityLevel)
}

// Goal-adjusted target
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
}

export function calcDailyTarget(input: CalorieInput): { bmr: number; tdee: number; target: number; label: string } {
  const bmr = calcBMR(input.weightKg, input.heightCm, input.age, input.gender)
  const tdee = calcTDEE(bmr)
  const target = calcCalorieTarget(tdee, input.goalType)
  return { bmr, tdee, target: target.calories, label: target.label }
}
