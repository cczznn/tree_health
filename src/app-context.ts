import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository } from './repositories';

export interface AppContext {
  foodRepo: FoodRepository;
  mealRecordRepo: MealRecordRepository;
  dailyMealSummaryRepo: DailyMealSummaryRepository;
}

let currentContext: AppContext | null = null;

export function beginNewAppContext(): AppContext {
  currentContext = {
    foodRepo: new FoodRepository(),
    mealRecordRepo: new MealRecordRepository(),
    dailyMealSummaryRepo: new DailyMealSummaryRepository(),
  };
  return currentContext;
}

export function getAppContext(): AppContext {
  return currentContext ?? beginNewAppContext();
}
