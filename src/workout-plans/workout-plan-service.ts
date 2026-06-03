import { randomUUID } from 'node:crypto';
import type { GoalType, WorkoutPlan } from '../domain/types';
import { generateAiPlan, generateTraining, generateDiet, type AiPlanInput, type TrainingQuestionnaire } from '../lib/ai-client';
import { getDeepSeekKey } from '../lib/ai-config';
import { PRESET_FOODS } from '../foods/preset-foods';

interface MacroItem { name: string; grams: number; calories: number; protein: number; fat: number; carbs: number }

function enrichWithMacros(item: { name: string; grams: number; calories: number }): MacroItem {
  const result: MacroItem = { name: item.name, grams: item.grams, calories: item.calories, protein: 0, fat: 0, carbs: 0 }
  if (item.grams <= 0) return result

  // Try to match food in preset database
  const q = item.name.toLowerCase()
  const match = PRESET_FOODS.find(f => f.name.toLowerCase().includes(q) || q.includes(f.name.toLowerCase()))
  if (match) {
    const factor = item.grams / 100
    result.protein = Math.round(match.proteinPer100g * factor * 10) / 10
    result.fat = Math.round(match.fatPer100g * factor * 10) / 10
    result.carbs = Math.round(match.carbsPer100g * factor * 10) / 10
    return result
  }

  // Fallback: estimate from calories (rough split)
  const remaining = item.calories
  result.protein = Math.round(remaining * 0.25 / 4 * 10) / 10
  result.fat = Math.round(remaining * 0.25 / 9 * 10) / 10
  result.carbs = Math.round(remaining * 0.5 / 4 * 10) / 10
  return result
}

function calcTotalMacros(meals: Array<{ items: MacroItem[] }>): { protein: number; fat: number; carbs: number } {
  let protein = 0, fat = 0, carbs = 0
  for (const meal of meals) {
    for (const item of meal.items) {
      protein += item.protein
      fat += item.fat
      carbs += item.carbs
    }
  }
  return {
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
  }
}

export interface GenerateWorkoutPlanInput {
  goalType?: GoalType;
  frequencyPerWeek?: number;
}

export interface AiGeneratedPlan {
  plan: WorkoutPlan
  dietAdvice: {
    dailyCalories: number
    principles: string[]
    mealSuggestions: Array<{
      meal: string
      items: Array<{ name: string; grams: number; calories: number }>
    }>
  }
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
  async generateAiPlan(input: AiPlanInput): Promise<AiGeneratedPlan> {
    if (!getDeepSeekKey()) {
      return this.fallbackPlan(input)
    }

    let content = ''
    try {
      content = await generateAiPlan(input)
    } catch {
      return this.fallbackPlan(input)
    }

    if (!content || content.trim() === '') {
      return this.fallbackPlan(input)
    }

    // Strip markdown code blocks if present
    let json = content.trim()
    if (json.startsWith('```')) {
      json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    let parsed: any
    try {
      parsed = JSON.parse(json)
    } catch {
      // Retry once
      try {
        const retryContent = await generateAiPlan(input)
        let retryJson = retryContent.trim()
        if (retryJson.startsWith('```')) {
          retryJson = retryJson.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
        }
        parsed = JSON.parse(retryJson)
      } catch {
        return this.fallbackPlan(input)
      }
    }

    const schedule = Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule.map((d: any) => ({
      dayLabel: String(d.dayLabel || ''),
      focus: String(d.focus || ''),
      durationMinutes: Number(d.durationMinutes) || 45,
      exercises: Array.isArray(d.exercises) ? d.exercises.map(String) : [],
    })) : []

    const rawMeals = Array.isArray(parsed.dietAdvice?.mealSuggestions)
      ? parsed.dietAdvice.mealSuggestions.map((m: any) => ({
          meal: String(m.meal || ''),
          items: Array.isArray(m.items) ? m.items.map((i: any) => ({
            name: String(i.name || ''),
            grams: Number(i.grams) || 0,
            calories: Number(i.calories) || 0,
          })) : [],
        }))
      : []

    const mealSuggestions = rawMeals.map((meal: any) => ({
      ...meal,
      items: meal.items.map((item: any) => enrichWithMacros(item)),
    }))
    const totalMacros = calcTotalMacros(mealSuggestions)

    const dietAdvice = {
      dailyCalories: Number(parsed.dietAdvice?.dailyCalories) || 2000,
      macros: totalMacros,
      principles: Array.isArray(parsed.dietAdvice?.principles) ? parsed.dietAdvice.principles.map(String) : [],
      mealSuggestions,
    }

    const plan: WorkoutPlan = {
      id: randomUUID(),
      userId: 'system',
      createdAt: new Date().toISOString(),
      title: String(parsed.title || 'AI 定制计划'),
      goalType: input.goalType,
      frequencyPerWeek: Number(parsed.frequencyPerWeek) || 4,
      durationMinutes: Number(parsed.durationMinutes) || 45,
      planContent: {
        generatedBy: 'ai',
        weeklySchedule: schedule,
        dietAdvice,
      },
    }

    return { plan, dietAdvice }
  }

  async generateTrainingOnly(input: AiPlanInput, questionnaire?: TrainingQuestionnaire): Promise<AiGeneratedPlan> {
    if (!getDeepSeekKey()) return this.fallbackPlan(input)

    let content = ''
    try { content = await generateTraining(input, questionnaire) } catch { return this.fallbackPlan(input) }
    if (!content?.trim()) return this.fallbackPlan(input)

    let json = content.trim()
    if (json.startsWith('```')) json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')

    let parsed: any
    try { parsed = JSON.parse(json) } catch { return this.fallbackPlan(input) }

    const schedule = Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule.map((d: any) => ({
      dayLabel: String(d.dayLabel || ''), focus: String(d.focus || ''),
      durationMinutes: Number(d.durationMinutes) || 45,
      exercises: Array.isArray(d.exercises) ? d.exercises.map(String) : [],
    })) : []

    const plan: WorkoutPlan = {
      id: randomUUID(), userId: 'system', createdAt: new Date().toISOString(),
      title: String(parsed.title || 'AI 训练计划'),
      goalType: input.goalType,
      frequencyPerWeek: Number(parsed.frequencyPerWeek) || 4,
      durationMinutes: Number(parsed.durationMinutes) || 45,
      planContent: { generatedBy: 'ai', weeklySchedule: schedule },
    }
    return { plan, dietAdvice: { dailyCalories: 2000, principles: [], mealSuggestions: [] } }
  }

  async generateDietOnly(input: AiPlanInput, activityLevel?: string): Promise<AiGeneratedPlan> {
    if (!getDeepSeekKey()) return this.fallbackPlan(input)

    let content = ''
    try { content = await generateDiet(input, activityLevel) } catch { return this.fallbackPlan(input) }
    if (!content?.trim()) return this.fallbackPlan(input)

    let json = content.trim()
    if (json.startsWith('```')) json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')

    let parsed: any
    try { parsed = JSON.parse(json) } catch { return this.fallbackPlan(input) }

    const da = parsed.dietAdvice || {}
    const mealSuggestions = Array.isArray(da.mealSuggestions) ? da.mealSuggestions.map((m: any) => ({
      meal: String(m.meal || ''),
      items: Array.isArray(m.items) ? m.items.map((i: any) => ({
        name: String(i.name || ''), grams: Number(i.grams) || 0, calories: Number(i.calories) || 0,
      })) : [],
    })) : []

    // Enrich with macros from our food database
    const enrichedMeals = mealSuggestions.map((meal: any) => ({
      ...meal,
      items: meal.items.map((item: any) => enrichWithMacros(item)),
    }))
    const totalMacros = calcTotalMacros(enrichedMeals)

    const dietAdvice = {
      dailyCalories: Number(da.dailyCalories) || 2000,
      principles: Array.isArray(da.principles) ? da.principles.map(String) : [],
      macros: totalMacros,
      mealSuggestions: enrichedMeals,
    }

    const plan: WorkoutPlan = {
      id: randomUUID(), userId: 'system', createdAt: new Date().toISOString(),
      title: 'AI 饮食计划', goalType: input.goalType, frequencyPerWeek: 3, durationMinutes: 30,
      planContent: { generatedBy: 'ai', weeklySchedule: [], dietAdvice },
    }
    return { plan, dietAdvice }
  }

  private fallbackPlan(input: AiPlanInput): AiGeneratedPlan {
    const base = this.generatePlan({ goalType: input.goalType })
    return {
      plan: base,
      dietAdvice: {
        dailyCalories: 2000,
        principles: ['保持均衡饮食', '多摄入蛋白质和蔬菜'],
        mealSuggestions: [],
      },
    }
  }

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
