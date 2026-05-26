import type { BodyMetric, MealRecord, Recommendation, WorkoutPlan } from '../domain/types';
import { RecommendationRepository, MealRecordRepository, WorkoutPlanRepository, BodyMetricRepository, FoodRepository } from '../repositories';
import { ValidationError } from '../domain/errors';

export interface RecommendationDeps {
  foodRepo: FoodRepository;
  mealRecordRepo: MealRecordRepository;
  workoutPlanRepo: WorkoutPlanRepository;
  bodyMetricRepo: BodyMetricRepository;
  recommendationRepo?: RecommendationRepository;
}

export interface RecommendationSection {
  title: string;
  content: string;
}

export interface DailyRecommendationResult {
  type: 'structured' | 'fallback';
  summary: string;
  sections: RecommendationSection[];
  meta: {
    source: string;
    reason: string;
  };
}

export class RecommendationService {
  private readonly recommendationRepo?: RecommendationRepository;

  constructor(private readonly deps: RecommendationDeps) {
    this.recommendationRepo = deps.recommendationRepo;
  }

  async generateDailyRecommendation(userId: string, date: string): Promise<DailyRecommendationResult> {
    if (!userId) throw new ValidationError('用户ID不能为空');
    if (!date) throw new ValidationError('日期不能为空');

    const meals = await this.deps.mealRecordRepo.findAll({ userId, recordDate: date } as Partial<MealRecord>);
    const plans = await this.deps.workoutPlanRepo.findAll({ userId } as Partial<WorkoutPlan>);
    const metrics = await this.deps.bodyMetricRepo.findByUser(userId);
    const latestMetric = metrics.sort((a, b) => a.metricDate.localeCompare(b.metricDate)).at(-1) ?? null;

    if (meals.length === 0 || plans.length === 0 || !latestMetric) {
      return this.buildFallbackRecommendation();
    }

    const summary = `基于 ${date} 的饮食、运动与身体数据，给出结构化建议。`;
    const sections: RecommendationSection[] = [
      {
        title: '饮食建议',
        content: `今天共记录 ${meals.length} 条饮食数据，建议保持蛋白质优先、控制高糖零食。`,
      },
      {
        title: '运动建议',
        content: `当前已存在 ${plans.length} 个训练计划，建议优先完成基础训练并注意恢复。`,
      },
      {
        title: '身体变化参考',
        content: `最近体重约为 ${latestMetric.weight}kg，可继续观察近几次变化趋势。`,
      },
    ];

    const result: DailyRecommendationResult = {
      type: 'structured',
      summary,
      sections,
      meta: {
        source: 'rule-based-summary',
        reason: '饮食、计划和身体数据都已具备，使用结构化规则生成建议。',
      },
    };

    if (this.recommendationRepo) {
      await this.recommendationRepo.create({
        id: `${userId}-${date}`,
        userId,
        date,
        type: 'daily_summary',
        content: summary,
        sourceDataSummary: {
          mealCount: meals.length,
          planCount: plans.length,
          latestWeight: latestMetric.weight,
        },
      });
    }

    return result;
  }

  private buildFallbackRecommendation(): DailyRecommendationResult {
    return {
      type: 'fallback',
      summary: '当前数据不足，先给出通用健康建议。',
      sections: [
        { title: '饮食建议', content: '保持规律三餐，优先保证蛋白质与蔬菜摄入。' },
        { title: '运动建议', content: '保持每周稳定活动量，优先完成基础有氧和力量训练。' },
      ],
      meta: {
        source: 'fallback-template',
        reason: '饮食、运动或身体数据不足，降级为通用建议。',
      },
    };
  }
}
