import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationService } from '../../src/recommendations/recommendation-service';
import { ValidationError } from '../../src/domain/errors';
import type { DailyStatsResult } from '../../src/stats/daily-stats-service';
import type { WorkoutPlan } from '../../src/domain/types';
import type { BodyMetricTrend } from '../../src/body-metrics/body-metric-service';

describe('RecommendationService', () => {
  let service: RecommendationService;

  const stats: DailyStatsResult = {
    summary: {
      id: 'summary-1',
      userId: 'user-1',
      summaryDate: '2026-05-25',
      mealCount: 3,
      totalCalories: 2600,
      totalProtein: 90,
      totalFat: 80,
      totalCarbs: 300,
      totalFiber: 20,
      totalSugar: 35,
      totalSodium: 1800,
      updatedAt: '2026-05-25T12:00:00.000Z',
    },
    goalComparison: { goalType: 'fat_loss', status: 'high' },
  };

  const plan: WorkoutPlan = {
    id: 'plan-1',
    userId: 'user-1',
    title: '减脂训练计划',
    goalType: 'fat_loss',
    frequencyPerWeek: 3,
    durationMinutes: 40,
    planContent: { weeklySchedule: [] },
    createdAt: '2026-05-25T00:00:00.000Z',
  };

  const trend: BodyMetricTrend = {
    latest: {
      id: 'metric-2',
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68.2,
      waist: 78,
      hip: 91,
      thigh: 53,
      note: null,
    },
    previous: {
      id: 'metric-1',
      userId: 'user-1',
      metricDate: '2026-05-24',
      weight: 69,
      waist: 79,
      hip: 92,
      thigh: 54,
      note: null,
    },
    delta: {
      weight: -0.8,
      waist: -1,
      hip: -1,
      thigh: -1,
    },
    direction: 'down',
  };

  beforeEach(() => {
    service = new RecommendationService();
  });

  it('可以基于结构化输入生成减脂建议', () => {
    const recommendation = service.generateDailyRecommendation({
      userId: 'user-1',
      date: '2026-05-25',
      goalType: 'fat_loss',
      dailyStats: stats,
      workoutPlan: plan,
      bodyTrend: trend,
    });

    expect(recommendation.userId).toBe('user-1');
    expect(recommendation.type).toBe('daily_summary');
    expect(recommendation.content).toContain('减脂');
    expect(recommendation.content).toContain('热量偏高');
  });

  it('数据不足时回退到通用建议', () => {
    const recommendation = service.generateDailyRecommendation({
      userId: 'user-1',
      date: '2026-05-25',
      goalType: 'maintain',
      dailyStats: { summary: null, goalComparison: null },
      workoutPlan: null,
      bodyTrend: null,
    });

    expect(recommendation.content).toContain('数据不足');
    expect(recommendation.content).toContain('通用建议');
  });

  it('缺少用户目标会报错', () => {
    expect(() =>
      service.generateDailyRecommendation({
        userId: 'user-1',
        date: '2026-05-25',
        goalType: undefined,
        dailyStats: stats,
        workoutPlan: plan,
        bodyTrend: trend,
      }),
    ).toThrow(ValidationError);
  });
});
