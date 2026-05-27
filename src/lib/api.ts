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

// ── mock data (no backend in T11 worktree, mini-program has no fetch) ──

const MOCK_RECORDS: MealRecord[] = [
  {
    id: 'mr-1', userId: 'demo-user', foodId: 'f-1',
    mealType: 'breakfast', amount: 1, unit: '份',
    calories: 420, protein: 18, fat: 12, carbs: 55, fiber: 5, sugar: 8, sodium: 200,
    recordDate: today(), note: null,
  },
  {
    id: 'mr-2', userId: 'demo-user', foodId: 'f-2',
    mealType: 'lunch', amount: 1, unit: '份',
    calories: 680, protein: 35, fat: 22, carbs: 70, fiber: 8, sugar: 6, sodium: 450,
    recordDate: today(), note: '少油',
  },
  {
    id: 'mr-3', userId: 'demo-user', foodId: 'f-3',
    mealType: 'dinner', amount: 0.5, unit: '份',
    calories: 300, protein: 20, fat: 8, carbs: 35, fiber: 4, sugar: 3, sodium: 180,
    recordDate: today(), note: null,
  },
]

const MOCK_SUMMARY: SummaryMetrics = {
  mealCount: 3,
  totalCalories: 1400,
  totalProtein: 73,
  totalFat: 42,
  totalCarbs: 160,
  totalFiber: 17,
  totalSugar: 17,
  totalSodium: 830,
}

const MOCK_FOODS = [
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

const MOCK_PLAN: WorkoutPlanResponse['data'] = {
  id: 'wp-1',
  title: '新手入门训练计划',
  goalType: 'maintain',
  frequencyPerWeek: 3,
  durationMinutes: 30,
  planContent: {
    summary: '每周 3 次全身训练，适合新手入门',
    notes: '训练前后做好热身与拉伸，量力而行',
    weeklySchedule: [
      { dayLabel: '周一', focus: '上肢 + 有氧', durationMinutes: 30, exercises: ['俯卧撑 3×12', '哑铃弯举 3×10', '慢跑 15 分钟'] },
      { dayLabel: '周三', focus: '下肢 + 核心', durationMinutes: 30, exercises: ['深蹲 3×15', '弓步走 3×12', '平板支撑 3×30 秒'] },
      { dayLabel: '周五', focus: '全身 + 有氧', durationMinutes: 30, exercises: ['波比跳 3×10', '开合跳 3×20', '轻松骑行 15 分钟'] },
    ],
  },
}

const MOCK_METRICS: Array<{ id: string; metricDate: string; weight: number; waist: number | null; note: string | null }> = [
  { id: 'bm-1', metricDate: '2026-05-13', weight: 70, waist: 82, note: null },
  { id: 'bm-2', metricDate: '2026-05-20', weight: 69, waist: 80, note: '减脂中' },
  { id: 'bm-3', metricDate: today(), weight: 68.5, waist: 78, note: null },
]

// ── API functions ──

export async function getDailyStats(_date: string): Promise<DailyStatsResponse> {
  return {
    date: today(),
    mealCount: MOCK_SUMMARY.mealCount,
    totalCalories: MOCK_SUMMARY.totalCalories,
    totalProtein: MOCK_SUMMARY.totalProtein,
    totalFat: MOCK_SUMMARY.totalFat,
    totalCarbs: MOCK_SUMMARY.totalCarbs,
    totalFiber: MOCK_SUMMARY.totalFiber,
    totalSugar: MOCK_SUMMARY.totalSugar,
    totalSodium: MOCK_SUMMARY.totalSodium,
    goalType: 'maintain',
  }
}

export async function getMealRecords(_date: string): Promise<MealRecordsResponse> {
  return { data: MOCK_RECORDS, summary: MOCK_SUMMARY }
}

export async function searchFoods(_query = '') {
  return { data: MOCK_FOODS, total: MOCK_FOODS.length }
}

export async function getCurrentWorkoutPlan(
  _goalType: GoalType = 'maintain',
  _frequencyPerWeek = 3,
): Promise<WorkoutPlanResponse> {
  return { data: MOCK_PLAN }
}

export async function getBodyMetrics() {
  return { data: MOCK_METRICS }
}

export async function addBodyMetric(input: { weight: number; waist: number | null; note: string }) {
  const entry = {
    id: `bm-local-${Date.now()}`,
    metricDate: today(),
    weight: input.weight,
    waist: input.waist,
    note: input.note || null,
  }
  MOCK_METRICS.push(entry)
  return { data: entry }
}

let MOCK_CHECKINS: Array<{ id: string; planId: string; date: string; note: string | null }> = [
  { id: 'wc-1', planId: 'wp-1', date: '2026-05-25', note: '完成' },
  { id: 'wc-2', planId: 'wp-1', date: '2026-05-26', note: null },
]

export async function getWorkoutCheckins() {
  return { data: MOCK_CHECKINS }
}

export async function addWorkoutCheckin(note: string) {
  const entry = { id: `wc-local-${Date.now()}`, planId: 'wp-1', date: today(), note: note || null }
  MOCK_CHECKINS.push(entry)
  return { data: entry }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
