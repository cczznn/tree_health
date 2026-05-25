import { describe, it, expect, beforeEach } from 'vitest';
import { FoodService, CUSTOM_FOOD_LIMIT } from '../../src/foods/food-service';
import { FoodRepository } from '../../src/repositories';
import { ValidationError, ConflictError, NotFoundError } from '../../src/domain/errors';

describe('FoodService', () => {
  let repo: FoodRepository;
  let service: FoodService;

  const validInput = {
    name: '我的特制酸奶',
    caloriesPer100g: 65,
    proteinPer100g: 4,
    fatPer100g: 1.5,
    carbsPer100g: 8,
    fiberPer100g: null,
    sugarPer100g: null,
    sodiumPer100g: null,
  };

  beforeEach(() => {
    repo = new FoodRepository();
    service = new FoodService(repo);
  });

  describe('搜索食物', () => {
    it('关键词能搜索到预置食物', async () => {
      const results = await service.searchFoods('鸡胸肉', 'user-1');
      expect(results.some((food) => food.name.includes('鸡胸肉'))).toBe(true);
    });

    it('空关键词返回所有可见食物', async () => {
      const results = await service.searchFoods('', 'user-1');
      expect(results.length).toBeGreaterThan(0);
    });

    it('搜索不到时返回空数组', async () => {
      const results = await service.searchFoods('不存在的食物xyz', 'user-1');
      expect(results).toEqual([]);
    });
  });

  describe('食物详情', () => {
    it('存在的食物 ID 能返回详情', async () => {
      const found = await service.searchFoods('鸡胸肉', 'user-1');
      const detail = await service.getFoodById(found[0].id);
      expect(detail.name).toBe('鸡胸肉');
    });

    it('不存在的食物 ID 返回 NotFoundError', async () => {
      await expect(service.getFoodById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('自定义食物', () => {
    it('合法自定义食物可创建成功', async () => {
      const food = await service.createCustomFood(validInput, 'user-1');
      expect(food.name).toBe('我的特制酸奶');
      expect(food.sourceType).toBe('custom');
      expect(food.userId).toBe('user-1');
    });

    it('创建后可出现在搜索结果中', async () => {
      await service.createCustomFood(validInput, 'user-1');
      const results = await service.searchFoods('酸奶', 'user-1');
      expect(results.some((food) => food.name === '我的特制酸奶')).toBe(true);
    });

    it('缺少 X-User-Id 返回错误', async () => {
      await expect(service.createCustomFood(validInput, '')).rejects.toThrow(ValidationError);
    });

    it('非法字段触发校验错误', async () => {
      await expect(
        service.createCustomFood({ ...validInput, caloriesPer100g: -10 }, 'user-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('配额限制', () => {
    it('单用户最多创建 50 个自定义食物', async () => {
      for (let i = 0; i < CUSTOM_FOOD_LIMIT; i++) {
        await service.createCustomFood({ ...validInput, name: `食物${i}` }, 'user-1');
      }

      await expect(
        service.createCustomFood({ ...validInput, name: '超限食物' }, 'user-1'),
      ).rejects.toThrow(ConflictError);
    });

    it('不同用户的配额彼此独立', async () => {
      for (let i = 0; i < CUSTOM_FOOD_LIMIT; i++) {
        await service.createCustomFood({ ...validInput, name: `食物${i}` }, 'user-1');
      }

      const food = await service.createCustomFood(validInput, 'user-2');
      expect(food.userId).toBe('user-2');
    });
  });

  describe('预置食物数据', () => {
    it('初始化后预置食物为 100 条', async () => {
      const results = await service.searchFoods('', 'user-1');
      expect(results.filter((food) => food.sourceType === 'preset')).toHaveLength(100);
    });

    it('预置食物的 userId 必须为 null', async () => {
      const results = await service.searchFoods('', 'user-1');
      expect(results.filter((food) => food.sourceType === 'preset').every((food) => food.userId === null)).toBe(true);
    });
  });
});