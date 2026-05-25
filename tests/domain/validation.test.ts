import { describe, it, expect } from 'vitest';
import { validateFood, validateBodyMetric, validateMealRecord } from '../../src/domain/validation';
import { ValidationError } from '../../src/domain/errors';

describe('domain validation', () => {
  describe('validateFood', () => {
    it('食物名称为空时应抛出 ValidationError', () => {
      expect(() =>
        validateFood({
          userId: null,
          name: '',
          sourceType: 'preset',
          caloriesPer100g: 10,
          proteinPer100g: 1,
          fatPer100g: 0,
          carbsPer100g: 2,
          fiberPer100g: 0,
          sugarPer100g: 0,
          sodiumPer100g: 1,
        }),
      ).toThrow(ValidationError);
    });

    it('自定义食物没有 userId 时应抛出 ValidationError', () => {
      expect(() =>
        validateFood({
          userId: null,
          name: '我的沙拉',
          sourceType: 'custom',
          caloriesPer100g: 20,
          proteinPer100g: 1,
          fatPer100g: 0,
          carbsPer100g: 3,
          fiberPer100g: 1,
          sugarPer100g: 1,
          sodiumPer100g: 2,
        }),
      ).toThrow(ValidationError);
    });

    it('热量为负数时应抛出 ValidationError', () => {
      expect(() =>
        validateFood({
          userId: null,
          name: '白米饭',
          sourceType: 'preset',
          caloriesPer100g: -1,
          proteinPer100g: 1,
          fatPer100g: 0,
          carbsPer100g: 2,
          fiberPer100g: 0,
          sugarPer100g: 0,
          sodiumPer100g: 1,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('validateBodyMetric', () => {
    it('体重为 0 时应抛出 ValidationError', () => {
      expect(() =>
        validateBodyMetric({
          userId: 'u1',
          metricDate: '2026-05-23',
          weight: 0,
          waist: null,
          hip: null,
          thigh: null,
          note: null,
        }),
      ).toThrow(ValidationError);
    });

    it('腰围为负数时应抛出 ValidationError', () => {
      expect(() =>
        validateBodyMetric({
          userId: 'u1',
          metricDate: '2026-05-23',
          weight: 60,
          waist: -1,
          hip: null,
          thigh: null,
          note: null,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('validateMealRecord', () => {
    it('缺少 userId 时应抛出 ValidationError', () => {
      expect(() =>
        validateMealRecord({
          userId: '',
          foodId: 'food-1',
          mealType: 'breakfast',
          amount: 100,
          unit: 'g',
          recordDate: '2026-05-23',
          note: null,
          calories: 100,
          protein: 2,
          fat: 1,
          carbs: 20,
          fiber: 1,
          sugar: 1,
          sodium: 2,
        }),
      ).toThrow(ValidationError);
    });

    it('份量为 0 时应抛出 ValidationError', () => {
      expect(() =>
        validateMealRecord({
          userId: 'u1',
          foodId: 'food-1',
          mealType: 'breakfast',
          amount: 0,
          unit: 'g',
          recordDate: '2026-05-23',
          note: null,
          calories: 100,
          protein: 2,
          fat: 1,
          carbs: 20,
          fiber: 1,
          sugar: 1,
          sodium: 2,
        }),
      ).toThrow(ValidationError);
    });

    it('缺少记录日期时应抛出 ValidationError', () => {
      expect(() =>
        validateMealRecord({
          userId: 'u1',
          foodId: 'food-1',
          mealType: 'breakfast',
          amount: 100,
          unit: 'g',
          recordDate: '',
          note: null,
          calories: 100,
          protein: 2,
          fat: 1,
          carbs: 20,
          fiber: 1,
          sugar: 1,
          sodium: 2,
        }),
      ).toThrow(ValidationError);
    });
  });
});