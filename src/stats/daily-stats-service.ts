import { ValidationError } from '../domain/errors';
import type { DailyMealSummary, GoalType } from '../domain/types';
import { DailyMealSummaryRepository, MealRecordRepository } from '../repositories';

export interface GoalComparison {
  goalType: GoalType;
  status: 'low' | 'ok' | 'high';
}

export interface DailyStatsResult {
  summary: DailyMealSummary | null;
  goalComparison: GoalComparison | null;
}

export class DailyStatsService {
  constructor(
    private readonly mealRecordRepo: MealRecordRepository,
    private readonly summaryRepo: DailyMealSummaryRepository,
  ) {}

  async getDailyStats(userId: string, date: string, goalType?: GoalType): Promise<DailyStatsResult> {
    if (!date) throw new ValidationError('日期不能为空');
    const summary = await this.summaryRepo.findByUserAndDate(userId, date);
    if (!summary) {
      return { summary: null, goalComparison: null };
    }
    return {
      summary,
      goalComparison: goalType ? { goalType, status: this.compareGoal(summary.totalCalories, goalType) } : null,
    };
  }

  private compareGoal(calories: number, goalType: GoalType): 'low' | 'ok' | 'high' {
    const ranges: Record<GoalType, [number, number]> = {
      fat_loss: [0, 1600],
      maintain: [1600, 2400],
      muscle_gain: [2000, 3200],
    };
    const [min, max] = ranges[goalType];
    if (calories < min) return 'low';
    if (calories > max) return 'high';
    return 'ok';
  }
}
