import { describe, it, expect, beforeEach } from 'vitest';
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository } from '../../src/repositories';
import { MealRecordService } from '../../src/meal-records/meal-record-service';
import { DailyStatsService } from '../../src/stats/daily-stats-service';

describe('DailyStatsService', () => {
  let mealRecordService: MealRecordService;
  let dailyStatsService: DailyStatsService;

  beforeEach(() => {
    const foodRepo = new FoodRepository();
    const mealRecordRepo = new MealRecordRepository();
    const summaryRepo = new DailyMealSummaryRepository();
    mealRecordService = new MealRecordService(foodRepo, mealRecordRepo, summaryRepo);
    dailyStatsService = new DailyStatsService(mealRecordRepo, summaryRepo);
  });

  it('应汇总某一天的热量与核心营养素', async () => {
    const food = (await new FoodRepository().search('鸡胸肉', 'user-1'))[0];
    await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 200,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    const stats = await dailyStatsService.getDailyStats('user-1', '2026-05-23');
    expect(stats.summary).not.toBeNull();
    expect(stats.summary?.summaryDate).toBe('2026-05-23');
    expect(stats.summary?.totalCalories).toBeGreaterThan(0);
    expect(stats.summary?.totalProtein).toBeGreaterThan(0);
    expect(stats.goalComparison).toBeNull();
  });

  it('无记录时应返回空状态', async () => {
    const stats = await dailyStatsService.getDailyStats('user-1', '2026-05-23');
    expect(stats.summary).toBeNull();
    expect(stats.goalComparison).toBeNull();
  });

  it('缺少日期时应抛出校验错误', async () => {
    await expect(dailyStatsService.getDailyStats('user-1', '')).rejects.toThrow();
  });
});
