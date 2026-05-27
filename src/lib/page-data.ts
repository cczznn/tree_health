import type { DailyStatsResponse, MealRecordsResponse, WorkoutPlanResponse } from './api'

export interface HomeDisplayData {
  totalCalories: number | null
  mealCount: number | null
  mealSummary: string
  planSummary: string
  loading: boolean
  error: string | null
}

export function buildHomeDisplay(
  stats: DailyStatsResponse | null,
  meals: MealRecordsResponse | null,
  plan: WorkoutPlanResponse | null,
  error: string | null = null,
): HomeDisplayData {
  if (error) {
    return {
      totalCalories: null, mealCount: null,
      mealSummary: '加载失败', planSummary: '加载失败',
      loading: false, error,
    }
  }
  if (!stats || !meals || !plan) {
    return {
      totalCalories: null, mealCount: null,
      mealSummary: '加载中', planSummary: '加载中',
      loading: true, error: null,
    }
  }
  return {
    totalCalories: stats.totalCalories,
    mealCount: stats.mealCount,
    mealSummary: `已记录 ${meals.data.length} 条，今日总能量 ${meals.summary.totalCalories} kcal`,
    planSummary: `${plan.data.title} · ${plan.data.frequencyPerWeek} 次/周 · ${plan.data.durationMinutes} 分钟/次`,
    loading: false,
    error: null,
  }
}

export interface DietDisplayData {
  recordSummary: string
  foodSummary: string
  loading: boolean
  error: string | null
}

export interface LocalMealTotals {
  count: number
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

type MealSummary = { mealCount: number; totalCalories: number; totalProtein: number; totalFat: number; totalCarbs: number; totalFiber: number }

export function buildDietDisplay(
  meals: (MealRecordsResponse | { summary: MealSummary }) | null,
  foodsTotal: number | null,
  error: string | null = null,
  local: LocalMealTotals = { count: 0, calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
): DietDisplayData {
  if (error) {
    return { recordSummary: '加载失败', foodSummary: '加载失败', loading: false, error }
  }
  if (!meals || foodsTotal === null) {
    return { recordSummary: '加载中', foodSummary: '加载中', loading: true, error: null }
  }
  const s = meals.summary
  const totalCalories = s.totalCalories + local.calories
  const totalProtein = Math.round((s.totalProtein + local.protein) * 10) / 10
  const totalFat = Math.round((s.totalFat + local.fat) * 10) / 10
  const totalCarbs = Math.round((s.totalCarbs + local.carbs) * 10) / 10
  const totalFiber = Math.round((s.totalFiber + local.fiber) * 10) / 10
  return {
    recordSummary: `已记录 ${s.mealCount + local.count} 条 · ${totalCalories} kcal · 蛋白质 ${totalProtein}g · 脂肪 ${totalFat}g · 碳水 ${totalCarbs}g · 纤维 ${totalFiber}g`,
    foodSummary: `可搜索食物 ${foodsTotal} 条，方便快速添加`,
    loading: false,
    error: null,
  }
}
