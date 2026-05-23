import { describe, it, expect, beforeEach } from 'vitest';
import { FoodRepository } from '../../src/repositories';

describe('FoodRepository', () => {
  let repo: FoodRepository;

  beforeEach(() => {
    repo = new FoodRepository();
  });

  it('应初始化预置食物并能按关键词搜索', async () => {
    const results = await repo.search('鸡胸肉');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((food) => food.name.includes('鸡胸肉'))).toBe(true);
  });

  it('应只返回当前用户可见的自定义食物', async () => {
    await repo.create({
      id: 'custom-1',
      userId: 'user-1',
      name: '私密沙拉',
      sourceType: 'custom',
      caloriesPer100g: 50,
      proteinPer100g: 2,
      fatPer100g: 1,
      carbsPer100g: 6,
      fiberPer100g: 1,
      sugarPer100g: 2,
      sodiumPer100g: 10,
      createdAt: '2026-05-23T00:00:00.000Z',
    });

    const user1Results = await repo.search('私密', 'user-1');
    const user2Results = await repo.search('私密', 'user-2');

    expect(user1Results.length).toBe(1);
    expect(user2Results.length).toBe(0);
  });

  it('应能统计某用户自定义食物数量', async () => {
    await repo.create({
      id: 'custom-1',
      userId: 'user-1',
      name: '食物A',
      sourceType: 'custom',
      caloriesPer100g: 50,
      proteinPer100g: 2,
      fatPer100g: 1,
      carbsPer100g: 6,
      fiberPer100g: 1,
      sugarPer100g: 2,
      sodiumPer100g: 10,
      createdAt: '2026-05-23T00:00:00.000Z',
    });
    await repo.create({
      id: 'custom-2',
      userId: 'user-1',
      name: '食物B',
      sourceType: 'custom',
      caloriesPer100g: 60,
      proteinPer100g: 3,
      fatPer100g: 1,
      carbsPer100g: 7,
      fiberPer100g: 1,
      sugarPer100g: 2,
      sodiumPer100g: 10,
      createdAt: '2026-05-23T00:00:00.000Z',
    });

    expect(await repo.countCustomByUser('user-1')).toBe(2);
  });

  it('应内置 100 条预置食物', async () => {
    expect((await repo.search('')).filter((f) => f.sourceType === 'preset').length).toBe(100);
  });
});