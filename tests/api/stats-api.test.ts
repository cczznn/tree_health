import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createStatsRouter } from '../../src/api/stats';
import { createMealRecordsRouter } from '../../src/api/meal-records';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/meal-records', createMealRecordsRouter());
  app.use('/stats', createStatsRouter());
  return app;
}

describe('Stats API 集成测试', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('GET /stats/daily 应返回当天统计汇总', async () => {
    const foodRes = await request(app)
      .get('/meal-records/foods?query=鸡胸肉')
      .set('X-User-Id', 'user-1');
    const foodId = foodRes.body.data[0].id;

    await request(app)
      .post('/meal-records')
      .set('X-User-Id', 'user-1')
      .send({
        foodId,
        mealType: 'lunch',
        amount: 100,
        unit: 'g',
        recordDate: '2026-05-23',
        note: null,
      });

    const res = await request(app)
      .get('/stats/daily?date=2026-05-23&goalType=fat_loss')
      .set('X-User-Id', 'user-1');

    expect(res.status).toBe(200);
    expect(res.body.data.summary.summaryDate).toBe('2026-05-23');
    expect(res.body.data.goalComparison.goalType).toBe('fat_loss');
  });

  it('缺少日期应返回校验错误', async () => {
    const res = await request(app)
      .get('/stats/daily')
      .set('X-User-Id', 'user-1');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
