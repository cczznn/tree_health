import { Router, type Request, type Response } from 'express';
import { AppError, ValidationError } from '../domain/errors';
import { WorkoutPlanService } from '../workout-plans/workout-plan-service';
import { getAppContext } from '../app-context';

export function createWorkoutPlansRouter(): Router {
  const router = Router();
  const service = new WorkoutPlanService();

  router.get('/current', async (req: Request, res: Response) => {
    try {
      const ctx = getAppContext();

      // Try to return the most recent stored plan first
      try {
        const allPlans = await ctx.workoutPlanRepo.findAll()
        const stored = allPlans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        if (stored) {
          res.json({ data: stored })
          return
        }
      } catch { /* fall through to generate */ }

      // Fallback: generate a rule-based template
      const goalType = getGoalType(req.query.goalType);
      const frequencyPerWeek = getFrequencyPerWeek(req.query.frequencyPerWeek);
      const data = service.generatePlan({ goalType, frequencyPerWeek });
      res.json({ data });
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get('/diet-current', async (_req: Request, res: Response) => {
    try {
      const ctx = getAppContext()
      const all = await ctx.dietPlanRepo.findAll()
      const latest = all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
      res.json({ data: latest })
    } catch (err) {
      handleError(err, res)
    }
  })

  router.post('/generate-ai', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id' } });
        return;
      }

      const ctx = getAppContext();

      const user = await ctx.userRepo.findById(userId);
      if (!user) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
        return;
      }
      if (!user.age || !user.gender) {
        res.status(400).json({ error: { code: 'INSUFFICIENT_DATA', message: '请先在"我的"页面设置性别和年龄' } });
        return;
      }

      const metrics = await ctx.bodyMetricRepo.findByUser(userId);
      const latest = metrics.sort((a: any, b: any) => b.metricDate.localeCompare(a.metricDate))[0];
      if (!latest || !latest.weight || !latest.height) {
        res.status(400).json({ error: { code: 'INSUFFICIENT_DATA', message: '请先在"身体"页面录入体重和身高' } });
        return;
      }

      const input = {
        gender: user.gender as 'male' | 'female',
        age: user.age,
        weightKg: latest.weight,
        heightCm: latest.height,
        goalType: user.goal_type as any,
      };

      const genType = (req.body?.type as string) || 'both';

      let result: any;
      if (genType === 'training') {
        const q = req.body?.daysPerWeek ? {
          daysPerWeek: req.body.daysPerWeek,
          minutesPerSession: req.body.minutesPerSession,
          targetAreas: req.body.targetAreas || [],
          experience: req.body.experience || 'beginner',
          location: req.body.location || 'anywhere',
          equipment: req.body.equipment || [],
          intensity: req.body.intensity || 'medium',
        } : undefined
        result = await service.generateTrainingOnly(input, q);
        result.plan.userId = userId
        try { await ctx.workoutPlanRepo.create(result.plan) } catch (e: any) { console.error('DB write error (workout_plans):', e.message) }
      } else if (genType === 'diet') {
        result = await service.generateDietOnly(input);
        const dietPlan = {
          id: result.plan.id,
          userId,
          title: result.plan.title,
          goalType: input.goalType,
          content: result.dietAdvice,
          createdAt: result.plan.createdAt,
        };
        try { await ctx.dietPlanRepo.create(dietPlan) } catch (e: any) { console.error('DB write error (diet_plans):', e.message) }
      } else {
        result = await service.generateAiPlan(input);
        result.plan.userId = userId
        try { await ctx.workoutPlanRepo.create(result.plan) } catch (e: any) { console.error('DB write error (workout_plans):', e.message) }
        if (result.dietAdvice?.mealSuggestions?.length > 0) {
          const dietPlan = {
            id: result.plan.id + '-diet',
            userId,
            title: '饮食计划',
            goalType: input.goalType,
            content: result.dietAdvice,
            createdAt: result.plan.createdAt,
          };
          try { await ctx.dietPlanRepo.create(dietPlan) } catch (e: any) { console.error('DB write error (diet_plans):', e.message) }
        }
      }

      res.json({ data: result });
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
