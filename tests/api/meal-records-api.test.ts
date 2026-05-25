import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createMealRecordsRouter } from '../../src/api/meal-records';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/meal-records', createMealRecordsRouter());
  return app;
}

describe('Meal Records API 集成测试', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('POST /meal-records 能新增记录并返回日汇总', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user');

    const foodId = foodRes.body.data[0].id;

    const res = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.record.userId).toBe('test-user');
    expect(res.body.data.summary.summaryDate).toBe('2026-05-23');
  });

  it('GET /meal-records?date= 能返回当天记录和汇总', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user');

    const foodId = foodRes.body.data[0].id;

    await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .get('/meal-records?date=2026-05-23')
      .set('X-User-Id', 'test-user');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.summary.summaryDate).toBe('2026-05-23');
  });

  it('GET /meal-records 缺少日期参数应返回 400', async () => {
    const res = await request(app)
      .get('/meal-records')
      .set('X-User-Id', 'test-user');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /meal-records/:id 编辑后应返回重算后的汇总', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user');

    const foodId = foodRes.body.data[0].id;

    const createdRes = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .put(`/meal-records/${createdRes.body.data.record.id}`)
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'dinner',
        amount: 200,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '晚餐',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.record.amount).toBe(200);
    expect(res.body.data.summary.mealCount).toBe(1);
  });

  it('PUT /meal-records/:id 不允许修改其他用户的记录', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user-1');

    const foodId = foodRes.body.data[0].id;

    const createdRes = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user-1')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .put(`/meal-records/${createdRes.body.data.record.id}`)
      .set('X-User-Id', 'test-user-2')
      .send({
        foodId,
        mealType: 'dinner',
        amount: 200,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '晚餐',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PUT /meal-records/:id 修改日期后旧日期和新日期汇总都应正确', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user');

    const foodId = foodRes.body.data[0].id;

    const createdRes = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .put(`/meal-records/${createdRes.body.data.record.id}`)
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'dinner',
        amount: 200,
        unit: 'g',
        recordDate: '2026-05-24',
        note: '改到第二天',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.record.recordDate).toBe('2026-05-24');

    const oldDay = await request(app)
      .get('/meal-records?date=2026-05-23')
      .set('X-User-Id', 'test-user');
    const newDay = await request(app)
      .get('/meal-records?date=2026-05-24')
      .set('X-User-Id', 'test-user');

    expect(oldDay.body.summary).toBeNull();
    expect(newDay.body.summary.mealCount).toBe(1);
  });

  it('DELETE /meal-records/:id 删除后应返回重算后的汇总', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user');

    const foodId = foodRes.body.data[0].id;

    const createdRes = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .delete(`/meal-records/${createdRes.body.data.record.id}`)
      .set('X-User-Id', 'test-user');

    expect(res.status).toBe(200);
    expect(res.body.data.summary.mealCount).toBe(0);
  });

  it('DELETE /meal-records/:id 不允许删除其他用户的记录', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'test-user-1');

    const foodId = foodRes.body.data[0].id;

    const createdRes = await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'test-user-1')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: '午餐',
      });

    const res = await request(app)
      .delete(`/meal-records/${createdRes.body.data.record.id}`)
      .set('X-User-Id', 'test-user-2');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
