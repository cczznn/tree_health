import { Router, type Request, type Response } from 'express'
import { AppError, ValidationError } from '../domain/errors'
import { WorkoutCheckinService, type CreateWorkoutCheckinInput } from '../workout-checkins/workout-checkin-service'
import { getAppContext } from '../app-context'

export function createWorkoutCheckinsRouter(): Router {
  const router = Router()
  const { workoutPlanRepo, workoutCheckinRepo } = getAppContext()
  const service = new WorkoutCheckinService(workoutPlanRepo, workoutCheckinRepo)

  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } })
        return
      }
      const planId = getQueryValue(req.query.planId) || 'wp-1'
      const date = getQueryValue(req.query.date) || today()
      const data = await service.getCheckinsByPlanAndDate(userId, planId, date)
      res.json({ data })
    } catch (err) {
      handleError(err, res)
    }
  })

  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } })
        return
      }
      const input: CreateWorkoutCheckinInput = { date: today(), note: '', ...req.body, userId }
      const result = await service.createCheckin(input)
      res.status(201).json({ data: result })
    } catch (err) {
      handleError(err, res)
    }
  })

  return router
}

function getQueryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '')
  return typeof value === 'string' ? value : ''
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
