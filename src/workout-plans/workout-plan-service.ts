import { randomUUID } from 'node:crypto';
import type { GoalType, WorkoutPlan } from '../domain/types';

export interface GenerateWorkoutPlanInput {
  goalType?: GoalType;
  frequencyPerWeek?: number;
}

export interface ScheduleDay {
  dayLabel: string;
  focus: string;
  durationMinutes: number;
  exercises: string[];
}

const BEGINNER_PLAN: Omit<WorkoutPlan, 'id' | 'userId' | 'createdAt'> = {
  title: '新手入门训练计划',
  goalType: 'maintain',
  frequencyPerWeek: 3,
  durationMinutes: 30,
  planContent: {
    generatedBy: 'default-beginner-template',
    summary: '当输入不足或不合法时，回退到一个适合新手的均衡训练计划。',
    weeklySchedule: [
      {
        dayLabel: '周一',
        focus: '全身激活',
        durationMinutes: 30,
        exercises: ['动态热身', '深蹲', '俯卧撑', '平板支撑'],
      },
      {
        dayLabel: '周三',
        focus: '有氧 + 核心',
        durationMinutes: 30,
        exercises: ['快走', '开合跳', '卷腹', '死虫'],
      },
      {
        dayLabel: '周五',
        focus: '基础力量',
        durationMinutes: 30,
        exercises: ['徒手深蹲', '箭步蹲', '臀桥', '平板支撑'],
      },
    ] satisfies ScheduleDay[],
    notes: '建议保持动作标准，训练强度以能持续完成为主。',
  },
};

const TEMPLATES: Record<GoalType, { title: string; summary: string; baseFocuses: string[]; notes: string }> = {
  fat_loss: {
    title: '减脂训练计划',
    summary: '以提升消耗和维持基础力量为主，帮助形成稳定的减脂节奏。',
    baseFocuses: ['有氧 + 核心', '下肢力量', '上肢循环', '全身代谢'],
    notes: '建议控制组间休息，保持中等强度和持续性。',
  },
  muscle_gain: {
    title: '增肌训练计划',
    summary: '以力量训练为主，围绕大肌群进行分化训练并配合恢复。',
    baseFocuses: ['上肢力量', '下肢力量', '背部 + 核心', '全身复合动作'],
    notes: '建议优先保证动作质量和训练恢复，逐步增加负荷。',
  },
  maintain: {
    title: '维持训练计划',
    summary: '保持均衡活动量和基础体能，适合日常长期坚持。',
    baseFocuses: ['全身激活', '有氧 + 核心', '基础力量', '活动恢复'],
    notes: '建议维持均衡训练频率，避免一次性训练量过大。',
  },
};

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export class WorkoutPlanService {
  generatePlan(input: GenerateWorkoutPlanInput): WorkoutPlan {
    const goalType = input.goalType;
    const frequencyPerWeek = input.frequencyPerWeek;

    if (!goalType || !frequencyPerWeek || frequencyPerWeek < 1 || frequencyPerWeek > 7) {
      return this.buildPlan('maintain', 3, BEGINNER_PLAN);
    }

    const template = TEMPLATES[goalType];
    const schedule = this.buildSchedule(goalType, frequencyPerWeek);
    const durationMinutes = goalType === 'muscle_gain' ? 45 : goalType === 'fat_loss' ? 40 : 35;

    return {
      id: randomUUID(),
      userId: 'system',
      createdAt: new Date().toISOString(),
      title: template.title,
      goalType,
      frequencyPerWeek,
      durationMinutes,
      planContent: {
        generatedBy: 'rule-based-template',
        summary: template.summary,
        weeklySchedule: schedule,
        notes: template.notes,
      },
    };
  }

  private buildPlan(goalType: GoalType, frequencyPerWeek: number, base: Omit<WorkoutPlan, 'id' | 'userId' | 'createdAt'>): WorkoutPlan {
    return {
      id: randomUUID(),
      userId: 'system',
      createdAt: new Date().toISOString(),
      title: base.title,
      goalType,
      frequencyPerWeek,
      durationMinutes: base.durationMinutes,
      planContent: base.planContent,
    };
  }

  private buildSchedule(goalType: GoalType, frequencyPerWeek: number): ScheduleDay[] {
    const template = TEMPLATES[goalType];
    const durationMinutes = goalType === 'muscle_gain' ? 45 : goalType === 'fat_loss' ? 40 : 35;
    const schedule: ScheduleDay[] = [];

    for (let index = 0; index < frequencyPerWeek; index += 1) {
      const focus = template.baseFocuses[index % template.baseFocuses.length];
      schedule.push({
        dayLabel: DAY_LABELS[index % DAY_LABELS.length],
        focus,
        durationMinutes,
        exercises: this.getExercises(goalType, index),
      });
    }

    return schedule;
  }

  private getExercises(goalType: GoalType, index: number): string[] {
    if (goalType === 'fat_loss') {
      return [
        '动态热身',
        index % 2 === 0 ? '快走 / 跳绳' : '开合跳 / 波比跳',
        '平板支撑',
        '深蹲或箭步蹲',
      ];
    }

    if (goalType === 'muscle_gain') {
      return [
        '动态热身',
        index % 2 === 0 ? '卧推 / 俯卧撑' : '硬拉 / 划船',
        index % 2 === 0 ? '深蹲' : '肩推',
        '核心收尾',
      ];
    }

    return [
      '动态热身',
      '中等强度有氧',
      '基础力量训练',
      '拉伸放松',
    ];
  }
}
