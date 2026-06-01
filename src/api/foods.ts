import { Router, type Request, type Response } from 'express';
import { FoodService, type CreateCustomFoodInputDTO } from '../foods/food-service';
import { AppError, ValidationError } from '../domain/errors';
import { getAppContext } from '../app-context';

export function createFoodRouter(): Router {
  const router = Router();
  const { foodRepo } = getAppContext();
  const service = new FoodService(foodRepo);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const query = getQueryValue(req.query.query as any);
      const userId = req.headers['x-user-id'] as string | undefined;
      const results = await service.searchFoods(query, userId);
      res.json({ data: results, total: results.length });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) throw new ValidationError('缺少 X-User-Id 请求头');
      const food = await service.getFoodById(String(req.params.id), userId);
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
      const input = req.body as CreateCustomFoodInputDTO;
      const food = await service.createCustomFood(input, userId);
      res.status(201).json({ data: food });
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
      const input = req.body as CreateCustomFoodInputDTO;
      const food = await service.updateCustomFood(String(req.params.id), input, userId);
      res.json({ data: food });
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
      await service.deleteCustomFood(String(req.params.id), userId);
      res.json({ data: null });
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
