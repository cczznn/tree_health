import { Router, type Request, type Response } from 'express';
import { FoodService, type CreateCustomFoodInput } from '../foods/food-service';
import { FoodRepository } from '../repositories';
import { AppError } from '../domain/errors';

export function createFoodRouter(): Router {
  const router = Router();
  const service = new FoodService(new FoodRepository());

  router.get('/', async (req: Request, res: Response) => {
    try {
      const query = (req.query.query as string) || '';
      const userId = req.headers['x-user-id'] as string | undefined;
      const results = await service.searchFoods(query, userId);
      res.json({ data: results, total: results.length });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const food = await service.getFoodById(req.params.id);
      res.json({ data: food });
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
      const input = req.body as CreateCustomFoodInput;
      const food = await service.createCustomFood(input, userId);
      res.status(201).json({ data: food });
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } });
}