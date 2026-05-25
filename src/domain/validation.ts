import type { BodyMetric, Food, MealRecord } from './types';
import { ValidationError } from './errors';

export function validateFood(data: Omit<Food, 'id' | 'createdAt'>): void {
  if (!data.name || data.name.trim().length === 0) throw new ValidationError('食物名称不能为空');
  if (data.caloriesPer100g < 0) throw new ValidationError('热量不能为负数');
  if (data.proteinPer100g < 0) throw new ValidationError('蛋白质不能为负数');
  if (data.fatPer100g < 0) throw new ValidationError('脂肪不能为负数');
  if (data.carbsPer100g < 0) throw new ValidationError('碳水不能为负数');
  if (data.fiberPer100g < 0) throw new ValidationError('膳食纤维不能为负数');
  if (data.sugarPer100g < 0) throw new ValidationError('糖不能为负数');
  if (data.sodiumPer100g < 0) throw new ValidationError('钠不能为负数');
  if (data.sourceType === 'custom' && !data.userId) throw new ValidationError('自定义食物必须归属用户');
}

export function validateBodyMetric(data: Omit<BodyMetric, 'id'>): void {
  if (!data.userId) throw new ValidationError('用户ID不能为空');
  if (!data.metricDate) throw new ValidationError('记录日期不能为空');
  if (data.weight <= 0) throw new ValidationError('体重必须大于0');
  if (data.waist !== null && data.waist <= 0) throw new ValidationError('腰围必须大于0');
  if (data.hip !== null && data.hip <= 0) throw new ValidationError('臀围必须大于0');
  if (data.thigh !== null && data.thigh <= 0) throw new ValidationError('大腿围必须大于0');
}

export function validateMealRecord(
  data: {
    userId: string;
    foodId: string;
    mealType: MealRecord['mealType'];
    amount: number;
    unit: string;
    recordDate: string;
    note: string | null;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  },
): void {
  if (!data.userId) throw new ValidationError('用户ID不能为空');
  if (!data.foodId) throw new ValidationError('食物ID不能为空');
  if (!data.mealType) throw new ValidationError('餐次不能为空');
  if (data.amount <= 0) throw new ValidationError('份量必须大于0');
  if (!data.unit) throw new ValidationError('单位不能为空');
  if (!data.recordDate) throw new ValidationError('记录日期不能为空');
}
