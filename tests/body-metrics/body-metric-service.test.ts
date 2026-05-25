import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BodyMetricRepository } from '../../src/repositories';
import { BodyMetricService } from '../../src/body-metrics/body-metric-service';
import { ValidationError } from '../../src/domain/errors';

describe('BodyMetricService', () => {
  let repo: BodyMetricRepository;
  let service: BodyMetricService;

  beforeEach(() => {
    repo = new BodyMetricRepository();
    service = new BodyMetricService(repo);
  });

  it('合法体重记录可创建成功', async () => {
    const metric = await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68.5,
      waist: 78,
      hip: null,
      thigh: null,
      note: '晨起称重',
    });

    expect(metric.id).toBeDefined();
    expect(metric.userId).toBe('user-1');
    expect(metric.weight).toBe(68.5);
  });

  it('非法体重会被拒绝', async () => {
    await expect(
      service.createMetric({
        userId: 'user-1',
        metricDate: '2026-05-25',
        weight: 0,
        waist: null,
        hip: null,
        thigh: null,
        note: null,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('同一用户可按日期范围查询记录并保持排序', async () => {
    await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-24',
      weight: 69,
      waist: 79,
      hip: null,
      thigh: null,
      note: null,
    });
    await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68.5,
      waist: 78,
      hip: null,
      thigh: null,
      note: null,
    });

    const results = await service.getMetricsInRange('user-1', '2026-05-24', '2026-05-25');
    expect(results).toHaveLength(2);
    expect(results[0].metricDate).toBe('2026-05-24');
    expect(results[1].metricDate).toBe('2026-05-25');
  });

  it('趋势函数可返回最近变化与方向', async () => {
    await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-24',
      weight: 69,
      waist: 79,
      hip: 92,
      thigh: 54,
      note: null,
    });
    await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68.2,
      waist: 78,
      hip: 91.5,
      thigh: 53.5,
      note: null,
    });

    const trend = await service.getTrend('user-1');
    expect(trend.latest.weight).toBe(68.2);
    expect(trend.previous?.weight).toBe(69);
    expect(trend.delta.weight).toBeCloseTo(-0.8);
    expect(trend.direction).toBe('down');
  });

  it('只有一条记录时趋势返回 flat 且 previous 为空', async () => {
    await service.createMetric({
      userId: 'user-1',
      metricDate: '2026-05-25',
      weight: 68.2,
      waist: 78,
      hip: 91.5,
      thigh: 53.5,
      note: null,
    });

    const trend = await service.getTrend('user-1');
    expect(trend.latest.weight).toBe(68.2);
    expect(trend.previous).toBeNull();
    expect(trend.delta.weight).toBe(0);
    expect(trend.direction).toBe('flat');
  });

  it('开始日期晚于结束日期时会拒绝查询', async () => {
    await expect(
      service.getMetricsInRange('user-1', '2026-05-26', '2026-05-25'),
    ).rejects.toThrow(ValidationError);
  });
});
