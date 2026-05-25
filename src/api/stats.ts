import { Router, type Request, type Response } from 'express';
import { AppError, ValidationError } from '../domain/errors';
import { DailyStatsService } from '../stats/daily-stats-service';
import { getAppContext } from '../app-context';

export function createStatsRouter(): Router {
  const router = Router();
  const { mealRecordRepo, dailyMealSummaryRepo } = getAppContext();
  const service = new DailyStatsService(mealRecordRepo, dailyMealSummaryRepo);

  router.get('/daily', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } });
        return;
      }
      const date = getQueryValue(req.query.date);
      if (!date) throw new ValidationError('日期不能为空');
      const goalType = getGoalType(req.query.goalType);
      const data = await service.getDailyStats(userId, date, goalType);
      res.json({ data });
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

function getGoalType(value: unknown) {
  const raw = getQueryValue(value);
  if (raw === 'fat_loss' || raw === 'muscle_gain' || raw === 'maintain') return raw;
  return undefined;
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } });
}
