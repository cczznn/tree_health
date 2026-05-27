import { Router, type Request, type Response } from 'express'
import { AppError, ValidationError } from '../domain/errors'
import { BodyMetricService, type CreateBodyMetricInput } from '../body-metrics/body-metric-service'
import { getAppContext } from '../app-context'

export function createBodyMetricsRouter(): Router {
  const router = Router()
  const { bodyMetricRepo } = getAppContext()
  const service = new BodyMetricService(bodyMetricRepo)

  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } })
        return
      }
      const startDate = getQueryValue(req.query.startDate) || '2020-01-01'
      const endDate = getQueryValue(req.query.endDate) || today()
      const data = await service.getMetricsInRange(userId, startDate, endDate)
      let trend = null
      try { trend = await service.getTrend(userId) } catch { /* no data */ }
      res.json({ data, trend })
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
      const input: CreateBodyMetricInput = { metricDate: today(), ...req.body, userId }
      const result = await service.createMetric(input)
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
