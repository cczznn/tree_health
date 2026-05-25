import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createFoodRouter } from '../../src/api/foods';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/foods', createFoodRouter());
  return app;
}

describe('Food API 集成测试', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /foods', () => {
    it('关键词能搜索到预置食物', async () => {
      const res = await request(app)
        .get('/foods?query=鸡胸肉')
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('鸡胸肉');
    });

    it('空关键词返回所有可见食物', async () => {
      const res = await request(app)
        .get('/foods')
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('搜索不到时返回空数组', async () => {
      const res = await request(app)
        .get('/foods?query=不存在的食物xyz')
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /foods/:id', () => {
    it('已存在的食物 ID 能返回详情', async () => {
      const searchRes = await request(app)
        .get('/foods?query=鸡胸肉')
        .set('X-User-Id', 'test-user');

      const foodId = searchRes.body.data[0].id;
      const res = await request(app)
        .get(`/foods/${foodId}`)
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('鸡胸肉');
    });

    it('查看自定义食物详情时要求 X-User-Id', async () => {
      const created = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user')
        .send({
          name: '我的特制沙拉',
          caloriesPer100g: 65,
          proteinPer100g: 4,
          fatPer100g: 1.5,
          carbsPer100g: 8,
          fiberPer100g: 2,
          sugarPer100g: 3,
          sodiumPer100g: 40,
        });

      const res = await request(app).get(`/foods/${created.body.data.id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('查看其他用户的自定义食物详情应被拒绝', async () => {
      const created = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user-1')
        .send({
          name: '我的特制沙拉',
          caloriesPer100g: 65,
          proteinPer100g: 4,
          fatPer100g: 1.5,
          carbsPer100g: 8,
          fiberPer100g: 2,
          sugarPer100g: 3,
          sodiumPer100g: 40,
        });

      const res = await request(app)
        .get(`/foods/${created.body.data.id}`)
        .set('X-User-Id', 'test-user-2');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('不存在的食物 ID 返回 404 / NOT_FOUND', async () => {
      const res = await request(app)
        .get('/foods/nonexistent')
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /foods', () => {
    const validBody = {
      name: '我的特制沙拉',
      caloriesPer100g: 65,
      proteinPer100g: 4,
      fatPer100g: 1.5,
      carbsPer100g: 8,
      fiberPer100g: 2,
      sugarPer100g: 3,
      sodiumPer100g: 40,
    };

    it('合法自定义食物可创建成功', async () => {
      const res = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('我的特制沙拉');
      expect(res.body.data.sourceType).toBe('custom');
      expect(res.body.data.userId).toBe('test-user');
    });

    it('创建后可出现在搜索结果中', async () => {
      await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user')
        .send(validBody);

      const res = await request(app)
        .get('/foods?query=沙拉')
        .set('X-User-Id', 'test-user');

      expect(res.status).toBe(200);
      expect(res.body.data.some((item: any) => item.name === '我的特制沙拉')).toBe(true);
    });

    it('缺少 X-User-Id 返回错误', async () => {
      const res = await request(app)
        .post('/foods')
        .send(validBody);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_USER_ID');
    });

    it('非法字段触发校验错误', async () => {
      const res = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user')
        .send({ ...validBody, caloriesPer100g: -10 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('配额限制', () => {
    const validBody = {
      name: '我的特制沙拉',
      caloriesPer100g: 65,
      proteinPer100g: 4,
      fatPer100g: 1.5,
      carbsPer100g: 8,
      fiberPer100g: 2,
      sugarPer100g: 3,
      sodiumPer100g: 40,
    };

    it('单用户最多创建 50 个自定义食物', async () => {
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/foods')
          .set('X-User-Id', 'test-user')
          .send({ ...validBody, name: `食物${i}` });
      }

      const res = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user')
        .send({ ...validBody, name: '超限食物' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('不同用户的配额彼此独立', async () => {
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/foods')
          .set('X-User-Id', 'test-user-1')
          .send({ ...validBody, name: `食物${i}` });
      }

      const res = await request(app)
        .post('/foods')
        .set('X-User-Id', 'test-user-2')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data.userId).toBe('test-user-2');
    });
  });

  describe('预置食物数据', () => {
    it('初始化后预置食物为 100 条', async () => {
      const res = await request(app)
        .get('/foods')
        .set('X-User-Id', 'test-user');

      const presetCount = res.body.data.filter((item: any) => item.sourceType === 'preset').length;
      expect(presetCount).toBe(100);
    });

    it('预置食物的 userId 必须为 null', async () => {
      const res = await request(app)
        .get('/foods')
        .set('X-User-Id', 'test-user');

      expect(res.body.data.filter((item: any) => item.sourceType === 'preset').every((item: any) => item.userId === null)).toBe(true);
    });
  });
});
