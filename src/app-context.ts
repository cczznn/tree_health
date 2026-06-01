import { InMemoryUserRepository } from './auth/user-repository'
import { MysqlUserRepository } from './auth/mysql-user-repository'
import {
  MysqlFoodRepository, MysqlMealRecordRepository, MysqlDailyMealSummaryRepository,
  MysqlWorkoutPlanRepository, MysqlWorkoutCheckinRepository, MysqlBodyMetricRepository,
} from './repositories/mysql-repos'
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository, WorkoutPlanRepository, WorkoutCheckinRepository, BodyMetricRepository } from './repositories'

export interface AppContext {
  foodRepo: any
  mealRecordRepo: any
  dailyMealSummaryRepo: any
  workoutPlanRepo: any
  workoutCheckinRepo: any
  bodyMetricRepo: any
  userRepo: InMemoryUserRepository | MysqlUserRepository
  isMysql: boolean
}

let currentContext: AppContext | null = null

export function beginNewAppContext(userRepoOverride?: MysqlUserRepository): AppContext {
  if (userRepoOverride) {
    // MySQL mode
    currentContext = {
      foodRepo: new MysqlFoodRepository(),
      mealRecordRepo: new MysqlMealRecordRepository(),
      dailyMealSummaryRepo: new MysqlDailyMealSummaryRepository(),
      workoutPlanRepo: new MysqlWorkoutPlanRepository(),
      workoutCheckinRepo: new MysqlWorkoutCheckinRepository(),
      bodyMetricRepo: new MysqlBodyMetricRepository(),
      userRepo: userRepoOverride,
      isMysql: true,
    }
  } else {
    // In-memory mode
    currentContext = {
      foodRepo: new FoodRepository(),
      mealRecordRepo: new MealRecordRepository(),
      dailyMealSummaryRepo: new DailyMealSummaryRepository(),
      workoutPlanRepo: new WorkoutPlanRepository(),
      workoutCheckinRepo: new WorkoutCheckinRepository(),
      bodyMetricRepo: new BodyMetricRepository(),
      userRepo: new InMemoryUserRepository(),
      isMysql: false,
    }

    const memUserRepo = currentContext.userRepo as InMemoryUserRepository
    memUserRepo.store.set('admin-user', {
      id: 'admin-user',
      name: 'admin',
      password_hash: '$2b$10$IY1DyWzK//FAvXn1xCLGgeVyCbQhUAw5/5cZNDPh3ts5n66nSuJYK',
      goal_type: 'maintain',
      created_at: new Date().toISOString(),
    })

    const planStore = (currentContext.workoutPlanRepo as any).store as Map<string, any>
    const planId = 'wp-1'
    if (!planStore.has(planId)) {
      planStore.set(planId, {
        id: planId, userId: 'system', title: '新手入门训练计划', goalType: 'maintain',
        frequencyPerWeek: 3, durationMinutes: 30,
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
  }

  return currentContext
}

export function getAppContext(): AppContext {
  if (!currentContext) beginNewAppContext()
  return currentContext
}
