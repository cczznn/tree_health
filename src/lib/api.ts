import type { MealRecord, GoalType } from '../domain/types'

export interface DailyStatsResponse {
  date: string
  mealCount: number
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  totalFiber: number
  totalSugar: number
  totalSodium: number
  goalType?: GoalType
}

export interface MealRecordsResponse {
  data: MealRecord[]
  summary: SummaryMetrics
}

export interface SummaryMetrics {
  mealCount: number
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  totalFiber: number
  totalSugar: number
  totalSodium: number
}

export interface WorkoutPlanResponse {
  data: {
    id: string
    title: string
    goalType: GoalType
    frequencyPerWeek: number
    durationMinutes: number
    planContent: {
      summary?: string
      notes?: string
      weeklySchedule?: Array<{
        dayLabel: string
        focus: string
        durationMinutes: number
        exercises: string[]
      }>
    }
  }
}

function getUserId(): string {
  return 'demo-user'
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': getUserId(),
  }

  const res = await fetch(path, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> || {}) },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`请求失败: ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

export async function getDailyStats(date: string): Promise<DailyStatsResponse> {
  const res = await request<{ data: DailyStatsResponse }>(`/api/stats/daily?date=${encodeURIComponent(date)}`)
  return res.data
}

export async function getMealRecords(date: string): Promise<MealRecordsResponse> {
  return request<MealRecordsResponse>(`/api/meal-records?date=${encodeURIComponent(date)}`)
}

export async function searchFoods(query = '') {
  return request<{
    data: Array<{
      id: string; name: string
      caloriesPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number
      fiberPer100g: number | null; sugarPer100g: number | null; sodiumPer100g: number | null
    }>
    total: number
  }>(`/api/foods?query=${encodeURIComponent(query)}`)
}

export async function getCurrentWorkoutPlan(
  goalType: GoalType = 'maintain',
  frequencyPerWeek = 3,
): Promise<WorkoutPlanResponse> {
  return request<WorkoutPlanResponse>(
    `/api/workout-plans/current?goalType=${encodeURIComponent(goalType)}&frequencyPerWeek=${encodeURIComponent(String(frequencyPerWeek))}`,
  )
}

export async function getBodyMetrics() {
  return request<{
    data: Array<{ id: string; metricDate: string; weight: number; waist: number | null; note: string | null }>
    trend: unknown
  }>(`/api/body-metrics`)
}

export async function addBodyMetric(input: { weight: number; waist: number | null; note: string }) {
  return request<{ data: unknown }>('/api/body-metrics', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getWorkoutCheckins() {
  return request<{ data: Array<{ id: string; planId: string; date: string; note: string | null }> }>(
    `/api/workout-checkins`,
  )
}

export async function addWorkoutCheckin(note: string) {
  return request<{ data: unknown }>('/api/workout-checkins', {
    method: 'POST',
    body: JSON.stringify({ planId: 'wp-1', date: today(), note }),
  })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
