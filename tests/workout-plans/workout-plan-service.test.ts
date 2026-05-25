import { describe, it, expect } from 'vitest';
import { WorkoutPlanService } from '../../src/workout-plans/workout-plan-service';

describe('WorkoutPlanService', () => {
  const service = new WorkoutPlanService();

  it('fat_loss goal with 3 sessions generates a fat loss template', () => {
    const plan = service.generatePlan({ goalType: 'fat_loss', frequencyPerWeek: 3 });

    expect(plan.goalType).toBe('fat_loss');
    expect(plan.frequencyPerWeek).toBe(3);
    expect(plan.title).toContain('减脂');
    const weeklySchedule = plan.planContent.weeklySchedule as { focus: string }[];
    expect(weeklySchedule).toHaveLength(3);
    expect(weeklySchedule[0].focus).toBe('有氧 + 核心');
  });

  it('muscle_gain goal with 4 sessions generates a muscle gain template', () => {
    const plan = service.generatePlan({ goalType: 'muscle_gain', frequencyPerWeek: 4 });

    expect(plan.goalType).toBe('muscle_gain');
    expect(plan.frequencyPerWeek).toBe(4);
    expect(plan.title).toContain('增肌');
    const weeklySchedule = plan.planContent.weeklySchedule as { focus: string }[];
    expect(weeklySchedule).toHaveLength(4);
    expect(weeklySchedule.some((day) => day.focus.includes('力量'))).toBe(true);
  });

  it('maintain goal with 2 sessions generates a maintenance template', () => {
    const plan = service.generatePlan({ goalType: 'maintain', frequencyPerWeek: 2 });

    expect(plan.goalType).toBe('maintain');
    expect(plan.frequencyPerWeek).toBe(2);
    expect(plan.title).toContain('维持');
    const weeklySchedule = plan.planContent.weeklySchedule as { focus: string }[];
    expect(weeklySchedule).toHaveLength(2);
    expect(plan.planContent.notes).toContain('均衡');
  });

  it('invalid frequency falls back to beginner plan', () => {
    const plan = service.generatePlan({ goalType: 'fat_loss', frequencyPerWeek: 0 });

    expect(plan.title).toContain('新手');
    expect(plan.frequencyPerWeek).toBe(3);
    expect(plan.planContent.generatedBy).toBe('default-beginner-template');
  });
});
