import { randomUUID } from 'crypto';
import type { Food, MealRecord, DailyMealSummary } from '../domain/types';
import { validateMealRecord } from '../domain/validation';
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository } from '../repositories';
import { NotFoundError, ValidationError } from '../domain/errors';

export interface CreateMealRecordInput {
  userId: string;
  foodId: string;
  mealType: MealRecord['mealType'];
  amount: number;
  unit: string;
  recordDate: string;
  note: string | null;
}

export interface UpdateMealRecordInput {
  userId?: string;
  foodId: string;
  mealType: MealRecord['mealType'];
  amount: number;
  unit: string;
  recordDate: string;
  note: string | null;
}

export interface MealRecordResult {
  record: MealRecord;
  summary: DailyMealSummary;
}

export class MealRecordService {
  constructor(
    private readonly foodRepo: FoodRepository,
    private readonly mealRecordRepo: MealRecordRepository,
    private readonly summaryRepo: DailyMealSummaryRepository,
  ) {}

  async createMealRecord(input: CreateMealRecordInput): Promise<MealRecordResult> {
    validateMealRecord(input);
    const food = await this.resolveFoodForUser(input.userId, input.foodId);
    const record = this.buildRecord(input, food);
    await this.mealRecordRepo.create(record);
    const summary = await this.incrementSummary(record);
    return { record, summary };
  }

  async getMealRecordsByDate(userId: string, date?: string): Promise<MealRecord[]> {
    if (!date) throw new ValidationError('日期不能为空');
    return this.mealRecordRepo.findByUserAndDate(userId, date);
  }

  async getSummaryByDate(userId: string, date: string): Promise<DailyMealSummary | null> {
    if (!date) throw new ValidationError('日期不能为空');
    return this.summaryRepo.findByUserAndDate(userId, date);
  }

  async updateMealRecord(recordId: string, input: UpdateMealRecordInput): Promise<MealRecordResult> {
    const existing = await this.mealRecordRepo.getById(recordId);
    if (input.userId && input.userId !== existing.userId) {
      throw new NotFoundError('MealRecord', recordId);
    }
    validateMealRecord({ ...input, userId: existing.userId });
    const food = await this.resolveFoodForUser(existing.userId, input.foodId);
    const updatedRecord = this.buildRecord({ ...input, userId: existing.userId }, food, recordId);
    await this.mealRecordRepo.update(recordId, updatedRecord);
    const summary = await this.rebuildSummariesAfterMutation(
      existing.userId,
      existing.recordDate,
      updatedRecord.recordDate,
    );
    return {
      record: updatedRecord,
      summary: summary.newSummary ?? this.emptySummary(existing.userId, updatedRecord.recordDate),
    };
  }

  async deleteMealRecord(recordId: string, userId?: string): Promise<MealRecordResult> {
    const existing = await this.mealRecordRepo.getById(recordId);
    if (userId && userId !== existing.userId) {
      throw new NotFoundError('MealRecord', recordId);
    }
    await this.mealRecordRepo.delete(recordId);
    const summary = await this.rebuildSummary(existing.userId, existing.recordDate);
    return { record: existing, summary: summary ?? this.emptySummary(existing.userId, existing.recordDate) };
  }

  private async resolveFoodForUser(userId: string, foodId: string): Promise<Food> {
    const food = await this.foodRepo.getById(foodId);
    if (food.sourceType === 'custom' && food.userId !== userId) {
      throw new NotFoundError('Food', foodId);
    }
    return food;
  }

  private buildRecord(input: CreateMealRecordInput | (UpdateMealRecordInput & { userId: string }), food: Food, id: string = randomUUID()): MealRecord {
    const factor = input.amount / 100;
    const safe = (value: number | null) => (value ?? 0) * factor;
    return {
      id,
      userId: input.userId,
      foodId: input.foodId,
      mealType: input.mealType,
      amount: input.amount,
      unit: input.unit,
      calories: Number((food.caloriesPer100g * factor).toFixed(2)),
      protein: Number((food.proteinPer100g * factor).toFixed(2)),
      fat: Number((food.fatPer100g * factor).toFixed(2)),
      carbs: Number((food.carbsPer100g * factor).toFixed(2)),
      fiber: Number(safe(food.fiberPer100g).toFixed(2)),
      sugar: Number(safe(food.sugarPer100g).toFixed(2)),
      sodium: Number(safe(food.sodiumPer100g).toFixed(2)),
      recordDate: input.recordDate,
      note: input.note,
    };
  }

  private async incrementSummary(record: MealRecord): Promise<DailyMealSummary> {
    const existing = await this.summaryRepo.findByUserAndDate(record.userId, record.recordDate);
    const now = new Date().toISOString();
    if (!existing) {
      const summary: DailyMealSummary = {
        id: randomUUID(),
        userId: record.userId,
        summaryDate: record.recordDate,
        mealCount: 1,
        totalCalories: record.calories,
        totalProtein: record.protein,
        totalFat: record.fat,
        totalCarbs: record.carbs,
        totalFiber: record.fiber,
        totalSugar: record.sugar,
        totalSodium: record.sodium,
        updatedAt: now,
      };
      await this.summaryRepo.create(summary);
      return summary;
    }

    const updated = {
      ...existing,
      mealCount: existing.mealCount + 1,
      totalCalories: Number((existing.totalCalories + record.calories).toFixed(2)),
      totalProtein: Number((existing.totalProtein + record.protein).toFixed(2)),
      totalFat: Number((existing.totalFat + record.fat).toFixed(2)),
      totalCarbs: Number((existing.totalCarbs + record.carbs).toFixed(2)),
      totalFiber: Number((existing.totalFiber + record.fiber).toFixed(2)),
      totalSugar: Number((existing.totalSugar + record.sugar).toFixed(2)),
      totalSodium: Number((existing.totalSodium + record.sodium).toFixed(2)),
      updatedAt: now,
    };
    await this.summaryRepo.update(existing.id, updated);
    return updated;
  }

  private async rebuildSummariesAfterMutation(
    userId: string,
    oldDate: string,
    newDate: string,
  ): Promise<{ oldSummary: DailyMealSummary | null; newSummary: DailyMealSummary | null }> {
    const oldSummary = await this.rebuildSummary(userId, oldDate);
    const newSummary = newDate === oldDate ? oldSummary : await this.rebuildSummary(userId, newDate);
    return { oldSummary, newSummary };
  }

  private async rebuildSummary(userId: string, date: string): Promise<DailyMealSummary | null> {
    const records = await this.mealRecordRepo.findByUserAndDate(userId, date);
    const now = new Date().toISOString();
    const totals = records.reduce(
      (acc, record) => ({
        mealCount: acc.mealCount + 1,
        totalCalories: acc.totalCalories + record.calories,
        totalProtein: acc.totalProtein + record.protein,
        totalFat: acc.totalFat + record.fat,
        totalCarbs: acc.totalCarbs + record.carbs,
        totalFiber: acc.totalFiber + record.fiber,
        totalSugar: acc.totalSugar + record.sugar,
        totalSodium: acc.totalSodium + record.sodium,
      }),
      {
        mealCount: 0,
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalSodium: 0,
      },
    );

    const existing = await this.summaryRepo.findByUserAndDate(userId, date);
    if (totals.mealCount === 0) {
      if (existing) await this.summaryRepo.delete(existing.id);
      return null;
    }

    const summary: DailyMealSummary = {
      id: existing?.id ?? randomUUID(),
      userId,
      summaryDate: date,
      mealCount: totals.mealCount,
      totalCalories: Number(totals.totalCalories.toFixed(2)),
      totalProtein: Number(totals.totalProtein.toFixed(2)),
      totalFat: Number(totals.totalFat.toFixed(2)),
      totalCarbs: Number(totals.totalCarbs.toFixed(2)),
      totalFiber: Number(totals.totalFiber.toFixed(2)),
      totalSugar: Number(totals.totalSugar.toFixed(2)),
      totalSodium: Number(totals.totalSodium.toFixed(2)),
      updatedAt: now,
    };

    if (existing) {
      await this.summaryRepo.update(existing.id, summary);
      return summary;
    }
    await this.summaryRepo.create(summary);
    return summary;
  }

  private emptySummary(userId: string, date: string): DailyMealSummary {
    return {
      id: randomUUID(),
      userId,
      summaryDate: date,
      mealCount: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}
