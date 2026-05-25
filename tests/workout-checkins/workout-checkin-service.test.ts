import { describe, it, expect, beforeEach } from 'vitest';
import { WorkoutCheckinService } from '../../src/workout-checkins/workout-checkin-service';
import { WorkoutPlanRepository, WorkoutCheckinRepository } from '../../src/repositories';
import { ValidationError, NotFoundError } from '../../src/domain/errors';

describe('WorkoutCheckinService', () => {
  let planRepo: WorkoutPlanRepository;
  let checkinRepo: WorkoutCheckinRepository;
  let service: WorkoutCheckinService;
  let planId: string;

  beforeEach(async () => {
    planRepo = new WorkoutPlanRepository();
    checkinRepo = new WorkoutCheckinRepository();
    service = new WorkoutCheckinService(planRepo, checkinRepo);

    const plan = await planRepo.create({
      id: 'plan-1',
      userId: 'user-1',
      title: '减脂训练计划',
      goalType: 'fat_loss',
      frequencyPerWeek: 3,
      durationMinutes: 40,
      planContent: { weeklySchedule: [] },
      createdAt: '2026-05-25T00:00:00.000Z',
    });
    planId = plan.id;
  });

  it('首次打卡成功', async () => {
    const result = await service.createCheckin({
      userId: 'user-1',
      planId,
      date: '2026-05-25',
      note: '今天完成了有氧训练',
    });

    expect(result.userId).toBe('user-1');
    expect(result.planId).toBe(planId);
    expect(result.note).toBe('今天完成了有氧训练');
  });

  it('同一天允许重复打卡并按时间保留多条记录', async () => {
    await service.createCheckin({
      userId: 'user-1',
      planId,
      date: '2026-05-25',
      note: '第一次打卡',
    });

    await service.createCheckin({
      userId: 'user-1',
      planId,
      date: '2026-05-25',
      note: '第二次打卡',
    });

    const records = await service.getCheckinsByPlanAndDate('user-1', planId, '2026-05-25');
    expect(records).toHaveLength(2);
    expect(records[0].note).toBe('第一次打卡');
    expect(records[1].note).toBe('第二次打卡');
  });

  it('缺少必填字段会报错', async () => {
    await expect(
      service.createCheckin({
        userId: 'user-1',
        planId,
        date: '',
        note: '缺少日期',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('不存在的计划会报 NotFoundError', async () => {
    await expect(
      service.createCheckin({
        userId: 'user-1',
        planId: 'missing-plan',
        date: '2026-05-25',
        note: '测试越权',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('其他用户不能查看别人的打卡记录', async () => {
    await service.createCheckin({
      userId: 'user-1',
      planId,
      date: '2026-05-25',
      note: '私有打卡',
    });

    await expect(service.getCheckinsByPlanAndDate('user-2', planId, '2026-05-25')).rejects.toThrow(NotFoundError);
  });
});
