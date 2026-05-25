import { randomUUID } from 'node:crypto';
import { FoodRepository } from '../repositories';
import type { Food } from '../domain/types';
import { validateFood } from '../domain/validation';
import { ConflictError, ValidationError } from '../domain/errors';

export const CUSTOM_FOOD_LIMIT = 50;

export type CreateCustomFoodInput = Omit<Food, 'id' | 'createdAt' | 'userId' | 'sourceType'>;

export class FoodService {
  constructor(private readonly repo: FoodRepository) {}

  async searchFoods(query: string, userId?: string): Promise<Food[]> {
    return this.repo.search(query, userId);
  }

  async getFoodById(id: string): Promise<Food> {
    return this.repo.getById(id);
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