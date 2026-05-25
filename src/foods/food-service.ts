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
  fiberPer100g: number;
  sugarPer100g: number;
  sodiumPer100g: number;
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
      ...input,
    };

    validateFood(food);
    return this.repo.create(food);
  }
}
