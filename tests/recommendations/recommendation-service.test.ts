import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationService } from '../../src/recommendations/recommendation-service';
import { FoodRepository, MealRecordRepository, WorkoutPlanRepository, BodyMetricRepository } from '../../src/repositories';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let foodRepo: FoodRepository;
  let mealRecordRepo: MealRecordRepository;
  let workoutPlanRepo: WorkoutPlanRepository;
  let bodyMetricRepo: BodyMetricRepository;

  beforeEach(() => {
    foodRepo = new FoodRepository();
    mealRecordRepo = new MealRecordRepository();
    workoutPlanRepo = new WorkoutPlanRepository();
    bodyMetricRepo = new BodyMetricRepository();
    service = new RecommendationService({
      foodRepo,
      mealRecordRepo,
      workoutPlanRepo,
      bodyMetricRepo,
    });
  });

  it('输入充足时生成结构化建议', async () => {
    await mealRecordRepo.create({
      id: 'meal-1',
      userId: 'user-1',
      foodId: 'preset-1',
      mealType: 'lunch',
      amount: 150,
      unit: 'g',
      recordDate: '2026-05-25',
      note: '午餐',
      calories: 200,
      protein: 10,
      fat: 5,
      carbs: 20,
      fiber: 2,
      sugar: 3,
      sodium: 120,
    });

    await workoutPlanRepo.create({
      id: 'plan-1',
      userId: 'user-1',
      title: '减脂训练计划',
      goalType: 'fat_loss',
      frequencyPerWeek: 3,
      durationMinutes: 40,
      planContent: { weeklySchedule: [] },
      createdAt: '2026-05-25T00:00:00.000Z',
    });

    await bodyMetricRepo.create({
      id: 'metric-1',
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68,
      waist: 78,
      hip: null,
      thigh: null,
      note: null,
    });

    const result = await service.generateDailyRecommendation('user-1', '2026-05-25');

    expect(result.type).toBe('structured');
    expect(result.summary).toContain('建议');
    expect(result.sections.some((section: { title: string }) => section.title === '饮食建议')).toBe(true);
    expect(result.sections.some((section: { title: string }) => section.title === '运动建议')).toBe(true);
  });

  it('数据不足时降级为通用建议', async () => {
    const result = await service.generateDailyRecommendation('user-1', '2026-05-25');

    expect(result.type).toBe('fallback');
    expect(result.summary).toContain('通用');
  });

  it('建议内容包含可解释字段', async () => {
    const result = await service.generateDailyRecommendation('user-1', '2026-05-25');

    expect(result.meta).toHaveProperty('source');
    expect(result.meta).toHaveProperty('reason');
  });
});
