import { Router, type Request, type Response } from 'express'
import { AppError } from '../domain/errors'
import { RecommendationService, type GenerateDailyRecommendationInput } from '../recommendations/recommendation-service'

export function createRecommendationsRouter(): Router {
  const router = Router()
  const service = new RecommendationService()

  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } })
        return
      }
      const input: GenerateDailyRecommendationInput = { ...req.body, userId }
      const result = service.generateDailyRecommendation(input)
      res.status(201).json({ data: result })
    } catch (err) {
      handleError(err, res)
    }
  })

  return router
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } })
}
