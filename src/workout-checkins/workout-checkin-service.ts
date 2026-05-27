import { randomUUID } from 'node:crypto';
import { ValidationError, NotFoundError } from '../domain/errors';
import type { WorkoutCheckin } from '../domain/types';
import { WorkoutPlanRepository, WorkoutCheckinRepository } from '../repositories';

export interface CreateWorkoutCheckinInput {
  userId: string;
  planId: string;
  date: string;
  note: string;
}

export class WorkoutCheckinService {
  constructor(
    private readonly planRepo: WorkoutPlanRepository,
    private readonly checkinRepo: WorkoutCheckinRepository,
  ) {}

  async createCheckin(input: CreateWorkoutCheckinInput): Promise<WorkoutCheckin> {
    this.validateInput(input);
    const plan = await this.planRepo.getById(input.planId);
    if (plan.userId !== input.userId) {
      throw new NotFoundError('WorkoutPlan', input.planId);
    }

    const checkin: WorkoutCheckin = {
      id: randomUUID(),
      userId: input.userId,
      planId: input.planId,
      date: input.date,
      status: 'completed',
      note: input.note,
      createdAt: new Date().toISOString(),
    };

    await this.checkinRepo.create(checkin);
    return checkin;
  }

  async getCheckinsByPlanAndDate(userId: string, planId: string, date: string): Promise<WorkoutCheckin[]> {
    if (!userId) throw new ValidationError('用户ID不能为空');
    if (!planId) throw new ValidationError('计划ID不能为空');
    if (!date) throw new ValidationError('日期不能为空');

    const plan = await this.planRepo.getById(planId);
    if (plan.userId !== userId) {
      throw new NotFoundError('WorkoutPlan', planId);
    }

    return this.checkinRepo.findByUserPlanAndDate(userId, planId, date);
  }

  private validateInput(input: CreateWorkoutCheckinInput): void {
    if (!input.userId) throw new ValidationError('用户ID不能为空');
    if (!input.planId) throw new ValidationError('计划ID不能为空');
    if (!input.date) throw new ValidationError('日期不能为空');
    // note is optional
  }
}
