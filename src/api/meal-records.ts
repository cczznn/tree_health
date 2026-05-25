import { Router, type Request, type Response } from 'express';
import { AppError, ValidationError } from '../domain/errors';
import { FoodRepository, MealRecordRepository, DailyMealSummaryRepository } from '../repositories';
import { MealRecordService } from '../meal-records/meal-record-service';
import { FoodService } from '../foods/food-service';

export function createMealRecordsRouter(): Router {
  const router = Router();
  const foodRepo = new FoodRepository();
  const mealRecordRepo = new MealRecordRepository();
  const summaryRepo = new DailyMealSummaryRepository();
  const mealRecordService = new MealRecordService(foodRepo, mealRecordRepo, summaryRepo);
  const foodService = new FoodService(foodRepo);

  router.get('/foods', async (req: Request, res: Response) => {
    try {
      const query = getQueryValue(req.query.query as any);
      const userId = req.headers['x-user-id'] as string | undefined;
      const results = await foodService.searchFoods(query, userId);
      res.json({ data: results, total: results.length });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } });
        return;
      }
      const result = await mealRecordService.createMealRecord({ ...req.body, userId });
      res.status(201).json({ data: result });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } });
        return;
      }
      const date = getQueryValue(req.query.date as any);
      if (!date) throw new ValidationError('日期不能为空');
      const data = await mealRecordService.getMealRecordsByDate(userId, date);
      const summary = await mealRecordService.getSummaryByDate(userId, date);
      res.json({ data, summary });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } });
        return;
      }
      const result = await mealRecordService.updateMealRecord(String(req.params.id), { ...req.body, userId });
      res.json({ data: result });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } });
        return;
      }
      const result = await mealRecordService.deleteMealRecord(String(req.params.id), userId);
      res.json({ data: result });
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
}

function getQueryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return typeof value === 'string' ? value : '';
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } });
}
