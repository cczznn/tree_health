import { randomUUID } from 'node:crypto';
import type { BodyMetric } from '../domain/types';
import { validateBodyMetric } from '../domain/validation';
import { BodyMetricRepository } from '../repositories';
import { ValidationError } from '../domain/errors';

export interface CreateBodyMetricInput {
  userId: string;
  metricDate: string;
  weight: number;
  waist: number | null;
  hip: number | null;
  thigh: number | null;
  note: string | null;
}

export interface BodyMetricTrend {
  latest: BodyMetric;
  previous: BodyMetric | null;
  delta: {
    weight: number;
    waist: number | null;
    hip: number | null;
    thigh: number | null;
  };
  direction: 'up' | 'down' | 'flat';
}

export class BodyMetricService {
  constructor(private readonly repo: BodyMetricRepository) {}

  async createMetric(input: CreateBodyMetricInput): Promise<BodyMetric> {
    validateBodyMetric({
      userId: input.userId,
      metricDate: input.metricDate,
      weight: input.weight,
      waist: input.waist,
      hip: input.hip,
      thigh: input.thigh,
      note: input.note,
    });
    const metric: BodyMetric = {
      id: randomUUID(),
      userId: input.userId,
      metricDate: input.metricDate,
      weight: input.weight,
      waist: input.waist,
      hip: input.hip,
      thigh: input.thigh,
      note: input.note,
    };

    await this.repo.create(metric);
    return metric;
  }

  async getMetricsInRange(userId: string, startDate: string, endDate: string): Promise<BodyMetric[]> {
    if (!userId) throw new ValidationError('用户ID不能为空');
    if (!startDate || !endDate) throw new ValidationError('日期范围不能为空');
    if (startDate > endDate) throw new ValidationError('开始日期不能晚于结束日期');
    const metrics = await this.repo.findByUserAndDateRange(userId, startDate, endDate);
    return metrics.sort((a, b) => a.metricDate.localeCompare(b.metricDate));
  }

  async getTrend(userId: string): Promise<BodyMetricTrend> {
    if (!userId) throw new ValidationError('用户ID不能为空');
    const metrics = await this.repo.findByUser(userId);
    if (metrics.length === 0) throw new ValidationError('暂无身体数据');
    const sorted = metrics.sort((a, b) => a.metricDate.localeCompare(b.metricDate));
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    return {
      latest,
      previous,
      delta: {
        weight: previous ? latest.weight - previous.weight : 0,
        waist: previous && latest.waist !== null && previous.waist !== null ? latest.waist - previous.waist : null,
        hip: previous && latest.hip !== null && previous.hip !== null ? latest.hip - previous.hip : null,
        thigh: previous && latest.thigh !== null && previous.thigh !== null ? latest.thigh - previous.thigh : null,
      },
      direction: previous
        ? latest.weight > previous.weight
          ? 'up'
          : latest.weight < previous.weight
            ? 'down'
            : 'flat'
        : 'flat',
    };
  }
}
