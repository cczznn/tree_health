import { describe, it, expect, beforeEach } from 'vitest';
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository } from '../../src/repositories';
import { FoodService } from '../../src/foods/food-service';
import { MealRecordService } from '../../src/meal-records/meal-record-service';

describe('MealRecordService', () => {
  let foodService: FoodService;
  let mealRecordService: MealRecordService;

  beforeEach(() => {
    const foodRepo = new FoodRepository();
    const mealRecordRepo = new MealRecordRepository();
    const dailySummaryRepo = new DailyMealSummaryRepository();
    foodService = new FoodService(foodRepo);
    mealRecordService = new MealRecordService(foodRepo, mealRecordRepo, dailySummaryRepo);
  });

  it('新增饮食记录后应创建记录并增量更新当天汇总', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];

    const result = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 200,
      unit: 'g',
      recordDate: '2026-05-23',
      note: '午餐',
    });

    expect(result.record.userId).toBe('user-1');
    expect(result.summary.summaryDate).toBe('2026-05-23');
    expect(result.summary.mealCount).toBe(1);
    expect(result.summary.totalCalories).toBeGreaterThan(0);
  });

  it('缺少必要字段时应抛出校验错误', async () => {
    await expect(
      mealRecordService.createMealRecord({
        userId: 'user-1',
        foodId: '',
        mealType: 'lunch',
        amount: 0,
        unit: 'g',
        recordDate: '',
        note: null,
      }),
    ).rejects.toThrowError();
  });

  it('按日期查询应返回当天饮食记录', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];

    await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    const records = await mealRecordService.getMealRecordsByDate('user-1', '2026-05-23');
    expect(records).toHaveLength(1);
    expect(records[0].recordDate).toBe('2026-05-23');
  });

  it('编辑记录后当天汇总应整天重算', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];
    const created = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    const updated = await mealRecordService.updateMealRecord(created.record.id, {
      amount: 200,
      mealType: 'dinner',
      unit: 'g',
      recordDate: '2026-05-23',
      note: '改成晚餐',
      foodId: food.id,
    });

    expect(updated.record.amount).toBe(200);
    expect(updated.summary.mealCount).toBe(1);
    expect(updated.summary.totalCalories).toBeGreaterThan(0);
  });

  it('编辑记录时修改日期后，旧日期和新日期汇总都应正确更新', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];
    const created = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    const updated = await mealRecordService.updateMealRecord(created.record.id, {
      foodId: food.id,
      mealType: 'dinner',
      amount: 150,
      unit: 'g',
      recordDate: '2026-05-24',
      note: '改到第二天',
    });

    expect(updated.record.recordDate).toBe('2026-05-24');
    expect(await mealRecordService.getSummaryByDate('user-1', '2026-05-23')).toBeNull();
    expect((await mealRecordService.getSummaryByDate('user-1', '2026-05-24'))?.mealCount).toBe(1);
  });

  it('删除记录后当天汇总应整天重算', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];
    const created = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    const result = await mealRecordService.deleteMealRecord(created.record.id);
    expect(result.summary.mealCount).toBe(0);
    expect(result.summary.totalCalories).toBe(0);
  });

  it('不属于当前用户的记录不能更新', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];
    const created = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    await expect(
      mealRecordService.updateMealRecord(created.record.id, {
        userId: 'user-2',
        foodId: food.id,
        mealType: 'dinner',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: null,
      } as any),
    ).rejects.toThrowError();
  });

  it('不属于当前用户的记录不能删除', async () => {
    const food = (await foodService.searchFoods('鸡胸肉', 'user-1'))[0];
    const created = await mealRecordService.createMealRecord({
      userId: 'user-1',
      foodId: food.id,
      mealType: 'lunch',
      amount: 100,
      unit: 'g',
      recordDate: '2026-05-23',
      note: null,
    });

    await expect(
      mealRecordService.deleteMealRecord(created.record.id, 'user-2'),
    ).rejects.toThrowError();
  });
});
