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

export function buildDietDisplay(
  meals: MealRecordsResponse | { summary: { mealCount: number; totalCalories: number; totalProtein: number } } | null,
  foodsTotal: number | null,
  error: string | null = null,
  localMealCount = 0,
  localMealCalories = 0,
): DietDisplayData {
  if (error) {
    return { recordSummary: '加载失败', foodSummary: '加载失败', loading: false, error }
  }
  if (!meals || foodsTotal === null) {
    return { recordSummary: '加载中', foodSummary: '加载中', loading: true, error: null }
  }
  const totalCount = meals.summary.mealCount + localMealCount
  const totalCalories = meals.summary.totalCalories + localMealCalories
  const totalProtein = meals.summary.totalProtein + (localMealCount > 0 ? Math.round(localMealCalories * 0.17) : 0)
  return {
    recordSummary: `已记录 ${totalCount} 条，今日总能量 ${totalCalories} kcal，蛋白质 ${totalProtein} g`,
    foodSummary: `可搜索食物 ${foodsTotal} 条，方便快速添加`,
    loading: false,
    error: null,
  }
}
