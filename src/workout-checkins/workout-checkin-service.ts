import { randomUUID } from 'node:crypto';
import { ValidationError, NotFoundError } from '../domain/errors';
import type { WorkoutCheckin } from '../domain/types';
import { WorkoutPlanRepository, WorkoutCheckinRepository } from '../repositories';

export interface CreateWorkoutCheckinInput {
  userId: string;
  planId: string;
  date: string;
  note: string;
  exerciseIndex?: number;
  exerciseName?: string;
}

export class WorkoutCheckinService {
  constructor(
    private readonly planRepo: WorkoutPlanRepository,
    private readonly checkinRepo: WorkoutCheckinRepository,
  ) {}

  async createCheckin(input: CreateWorkoutCheckinInput): Promise<WorkoutCheckin> {
    this.validateInput(input);
    await this.planRepo.getById(input.planId);

    if (input.exerciseName !== undefined) {
      // Per-exercise toggle: find existing check-in for today, toggle the exercise
      const existing = await this.checkinRepo.findByUserPlanAndDate(input.userId, input.planId, input.date)
      const today = existing[0]
      if (today) {
        const completed = [...(today.completedExercises || [])]
        const idx = completed.indexOf(input.exerciseName)
        if (idx >= 0) completed.splice(idx, 1); else completed.push(input.exerciseName)
        const updated = { ...today, completedExercises: completed, status: 'completed' as const }
        await this.checkinRepo.update(today.id, updated)
        return updated
      }
    }

    // New check-in for the day
    const checkin: WorkoutCheckin = {
      id: randomUUID(),
      userId: input.userId,
      planId: input.planId,
      date: input.date,
      status: 'completed',
      note: input.note || null,
      completedExercises: input.exerciseName ? [input.exerciseName] : [],
      createdAt: new Date().toISOString(),
    };

    await this.checkinRepo.create(checkin);
    return checkin;
  }

  async getCheckinsByPlanAndDate(userId: string, planId: string, date: string): Promise<WorkoutCheckin[]> {
    if (!userId) throw new ValidationError('用户ID不能为空');
    if (!planId) throw new ValidationError('计划ID不能为空');
    if (!date) throw new ValidationError('日期不能为空');

    // Plans are shared templates, not user-owned; skip ownership check
    await this.planRepo.getById(planId);
    return this.checkinRepo.findByUserPlanAndDate(userId, planId, date);
  }

  private validateInput(input: CreateWorkoutCheckinInput): void {
    if (!input.userId) throw new ValidationError('用户ID不能为空');
    if (!input.planId) throw new ValidationError('计划ID不能为空');
    if (!input.date) throw new ValidationError('日期不能为空');
    // note is optional
  }
}
