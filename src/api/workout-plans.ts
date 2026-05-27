import { Router, type Request, type Response } from 'express';
import { AppError, ValidationError } from '../domain/errors';
import { WorkoutPlanService } from '../workout-plans/workout-plan-service';

export function createWorkoutPlansRouter(): Router {
  const router = Router();
  const service = new WorkoutPlanService();

  router.get('/current', async (req: Request, res: Response) => {
    try {
      const goalType = getGoalType(req.query.goalType);
      const frequencyPerWeek = getFrequencyPerWeek(req.query.frequencyPerWeek);
      const data = service.generatePlan({ goalType, frequencyPerWeek });
      res.json({ data });
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
}

function getGoalType(value: unknown) {
  const raw = getQueryValue(value);
  if (raw === 'fat_loss' || raw === 'muscle_gain' || raw === 'maintain') return raw;
  return undefined;
}

function getFrequencyPerWeek(value: unknown): number | undefined {
  const raw = Number(getQueryValue(value));
  return Number.isFinite(raw) ? raw : undefined;
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
