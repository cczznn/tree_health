import { InMemoryUserRepository } from './auth/user-repository'
import { MysqlUserRepository } from './auth/mysql-user-repository'
import {
  MysqlFoodRepository, MysqlMealRecordRepository, MysqlDailyMealSummaryRepository,
  MysqlWorkoutPlanRepository, MysqlWorkoutCheckinRepository, MysqlBodyMetricRepository,
  MysqlDietPlanRepository,
} from './repositories/mysql-repos'
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository, WorkoutPlanRepository, WorkoutCheckinRepository, BodyMetricRepository, DietPlanRepository } from './repositories'

export interface AppContext {
  foodRepo: any
  mealRecordRepo: any
  dailyMealSummaryRepo: any
  workoutPlanRepo: any
  workoutCheckinRepo: any
  bodyMetricRepo: any
  dietPlanRepo: any
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
      dietPlanRepo: new MysqlDietPlanRepository(),
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
      dietPlanRepo: new DietPlanRepository(),
      userRepo: new InMemoryUserRepository(),
      isMysql: false,
    }

    const memUserRepo = currentContext.userRepo as InMemoryUserRepository
    memUserRepo.store.set('admin-user', {
      id: 'admin-user',
      name: 'admin',
      password_hash: '$2b$10$IY1DyWzK//FAvXn1xCLGgeVyCbQhUAw5/5cZNDPh3ts5n66nSuJYK',
      goal_type: 'maintain',
      age: null,
      gender: null,
      weight: null,
      height: null,
      created_at: new Date().toISOString(),
    })
  }

  return currentContext
}

export function getAppContext(): AppContext {
  if (!currentContext) beginNewAppContext()
  return currentContext!
}
