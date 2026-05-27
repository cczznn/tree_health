import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository, WorkoutPlanRepository, WorkoutCheckinRepository, BodyMetricRepository } from './repositories'

export interface AppContext {
  foodRepo: FoodRepository
  mealRecordRepo: MealRecordRepository
  dailyMealSummaryRepo: DailyMealSummaryRepository
  workoutPlanRepo: WorkoutPlanRepository
  workoutCheckinRepo: WorkoutCheckinRepository
  bodyMetricRepo: BodyMetricRepository
}

let currentContext: AppContext | null = null

export function beginNewAppContext(): AppContext {
  currentContext = {
    foodRepo: new FoodRepository(),
    mealRecordRepo: new MealRecordRepository(),
    dailyMealSummaryRepo: new DailyMealSummaryRepository(),
    workoutPlanRepo: new WorkoutPlanRepository(),
    workoutCheckinRepo: new WorkoutCheckinRepository(),
    bodyMetricRepo: new BodyMetricRepository(),
  }

  // Seed default workout plan (workout-checkin API needs it)
  const planId = 'wp-1'
  if (!(currentContext.workoutPlanRepo as any).store.has(planId)) {
    (currentContext.workoutPlanRepo as any).store.set(planId, {
      id: planId,
      userId: 'demo-user',
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
      createdAt: new Date().toISOString(),
    })
  }

  return currentContext
}

export function getAppContext(): AppContext {
  return currentContext ?? beginNewAppContext()
}
