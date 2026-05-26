import { randomUUID } from 'node:crypto';
import { ValidationError } from '../domain/errors';
import type { GoalType, Recommendation, RecommendationType, WorkoutPlan } from '../domain/types';
import type { DailyStatsResult } from '../stats/daily-stats-service';
import type { BodyMetricTrend } from '../body-metrics/body-metric-service';

export interface GenerateDailyRecommendationInput {
  userId: string;
  date: string;
  goalType?: GoalType;
  dailyStats: DailyStatsResult;
  workoutPlan: WorkoutPlan | null;
  bodyTrend: BodyMetricTrend | null;
}

export class RecommendationService {
  generateDailyRecommendation(input: GenerateDailyRecommendationInput): Recommendation {
    this.validateInput(input);

    const sourceDataSummary = {
      goalType: input.goalType,
      hasSummary: Boolean(input.dailyStats.summary),
      hasWorkoutPlan: Boolean(input.workoutPlan),
      hasBodyTrend: Boolean(input.bodyTrend),
    };

    if (!input.dailyStats.summary || !input.goalType) {
      return this.buildRecommendation({
        userId: input.userId,
        date: input.date,
        type: 'daily_summary',
        content: '当前数据不足，先给出通用建议：保持规律饮食、稳定训练和充足恢复。',
        sourceDataSummary,
      });
    }

    const summary = input.dailyStats.summary;
    const lines: string[] = [];
    const title = this.buildTitle(input.goalType);

    if (input.goalType === 'fat_loss') {
      lines.push(summary.totalCalories > 2200 ? '今天热量偏高，晚餐建议更清淡，减少额外零食。' : '今天热量控制得不错，继续保持清淡饮食节奏。');
      lines.push(summary.totalProtein < 90 ? '蛋白质摄入偏低，优先补充鸡蛋、鱼类、鸡胸肉或豆制品。' : '蛋白质摄入较稳，可以保持当前搭配。');
      lines.push(input.bodyTrend?.direction === 'down' ? '体重趋势在下降，当前减脂节奏总体可行。' : '如果体重趋势停滞，可适当增加日常活动量。');
    } else if (input.goalType === 'muscle_gain') {
      lines.push(summary.totalCalories < 2200 ? '热量可能偏低，增肌期建议适当提高主食和优质脂肪摄入。' : '热量供给基本足够，继续关注训练后的恢复。');
      lines.push(summary.totalProtein < 120 ? '蛋白质还可以再补一些，优先保证每餐都有优质蛋白。' : '蛋白质摄入比较理想，继续保持。');
      lines.push(input.bodyTrend?.direction === 'up' ? '体重趋势在上升，若力量也在提升，说明增肌节奏正常。' : '如果体重变化不明显，可逐步提高训练刺激和总摄入。');
    } else {
      lines.push('当前以维持状态为主，保持规律饮食和均衡训练即可。');
      lines.push(summary.totalProtein < 100 ? '可以把蛋白质摄入再补足一些，帮助维持身体状态。' : '蛋白质摄入比较稳定。');
      lines.push(input.bodyTrend?.direction === 'flat' ? '体重趋势稳定，当前节奏适合长期维持。' : '体重出现波动时，优先观察连续几天的数据再调整。');
    }

    if (input.workoutPlan && input.workoutPlan.frequencyPerWeek < 3) {
      lines.push('训练频率偏低，建议先把每周最低训练次数稳定下来。');
    }

    return this.buildRecommendation({
      userId: input.userId,
      date: input.date,
      type: 'daily_summary',
      content: `${title}：${lines.join(' ')}`,
      sourceDataSummary,
    });
  }

  private validateInput(input: GenerateDailyRecommendationInput): void {
    if (!input.userId) throw new ValidationError('用户ID不能为空');
    if (!input.date) throw new ValidationError('日期不能为空');
    if (!input.goalType) throw new ValidationError('用户目标不能为空');
    if (!input.dailyStats) throw new ValidationError('饮食统计不能为空');
  }

  private buildTitle(goalType: GoalType): string {
    if (goalType === 'fat_loss') return '减脂日建议';
    if (goalType === 'muscle_gain') return '增肌日建议';
    return '维持日建议';
  }

  private buildRecommendation(params: {
    userId: string;
    date: string;
    type: RecommendationType;
    content: string;
    sourceDataSummary: Record<string, unknown>;
  }): Recommendation {
    return {
      id: randomUUID(),
      userId: params.userId,
      date: params.date,
      type: params.type,
      content: params.content,
      sourceDataSummary: params.sourceDataSummary,
    };
  }
}
