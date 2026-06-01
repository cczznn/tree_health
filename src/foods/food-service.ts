import { randomUUID } from 'node:crypto';
import { FoodRepository } from '../repositories';
import type { Food } from '../domain/types';
import { validateFood } from '../domain/validation';
import { ConflictError, ValidationError } from '../domain/errors';

export const CUSTOM_FOOD_LIMIT = 50;

export interface CreateCustomFoodInputDTO {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g?: number | null;
  sugarPer100g?: number | null;
  sodiumPer100g?: number | null;
}

export type CreateCustomFoodInput = CreateCustomFoodInputDTO;

export class FoodService {
  constructor(private readonly repo: FoodRepository) {}

  async searchFoods(query: string, userId?: string): Promise<Food[]> {
    return this.repo.search(query, userId);
  }

  async getFoodById(id: string, userId?: string): Promise<Food> {
    const food = await this.repo.getById(id);
    if (food.sourceType === 'custom') {
      if (!userId || food.userId !== userId) {
        throw new ValidationError('无权查看该食物详情');
      }
    }
    return food;
  }

  async getCustomFoods(userId: string): Promise<Food[]> {
    return this.repo.findCustomByUser(userId);
  }

  async createCustomFood(input: CreateCustomFoodInput, userId: string): Promise<Food> {
    if (!userId) {
      throw new ValidationError('缺少用户ID');
    }

    const customCount = await this.repo.countCustomByUser(userId);
    if (customCount >= CUSTOM_FOOD_LIMIT) {
      throw new ConflictError('自定义食物数量已达上限');
    }

    const food: Food = {
      id: randomUUID(),
      userId,
      sourceType: 'custom',
      createdAt: new Date().toISOString(),
      name: input.name,
      caloriesPer100g: input.caloriesPer100g,
      proteinPer100g: input.proteinPer100g,
      fatPer100g: input.fatPer100g,
      carbsPer100g: input.carbsPer100g,
      fiberPer100g: input.fiberPer100g ?? null,
      sugarPer100g: input.sugarPer100g ?? null,
      sodiumPer100g: input.sodiumPer100g ?? null,
    };

    validateFood(food);
    return this.repo.create(food);
  }

  async updateCustomFood(id: string, input: CreateCustomFoodInput, userId: string): Promise<Food> {
    const existing = await this.repo.getById(id);
    if (existing.sourceType !== 'custom') throw new ValidationError('只能修改自定义食物');
    if (existing.userId !== userId) throw new ValidationError('无权修改该食物');

    const updated: Food = {
      ...existing,
      name: input.name,
      caloriesPer100g: input.caloriesPer100g,
      proteinPer100g: input.proteinPer100g,
      fatPer100g: input.fatPer100g,
      carbsPer100g: input.carbsPer100g,
      fiberPer100g: input.fiberPer100g ?? null,
      sugarPer100g: input.sugarPer100g ?? null,
      sodiumPer100g: input.sodiumPer100g ?? null,
    };
    validateFood(updated);
    return this.repo.update(id, updated);
  }

  async deleteCustomFood(id: string, userId: string): Promise<void> {
    const existing = await this.repo.getById(id);
    if (existing.sourceType !== 'custom') throw new ValidationError('只能删除自定义食物');
    if (existing.userId !== userId) throw new ValidationError('无权删除该食物');
    await this.repo.delete(id);
  }
}
