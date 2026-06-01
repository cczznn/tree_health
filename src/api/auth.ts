import { Router, type Request, type Response } from 'express'
import { AuthService, type UserRow } from '../auth/auth-service'
import type { GoalType } from '../domain/types'
import { AppError } from '../domain/errors'

export function createAuthRouter(userRepo: { findByName(name: string): Promise<UserRow | null>; findById(id: string): Promise<UserRow | null>; create(user: UserRow): Promise<void>; update(id: string, user: UserRow): Promise<UserRow> }) {
  const router = Router()
  const service = new AuthService(userRepo)

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { name, password, goalType } = req.body
      const user = await service.register(name, password, goalType ?? 'maintain')
      res.status(201).json({ data: user })
    } catch (err) {
      handleError(err, res)
    }
  })

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { name, password } = req.body
      const user = await service.login(name, password)
      res.json({ data: user })
    } catch (err) {
      handleError(err, res)
    }
  })

  router.put('/goal', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) {
        res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id 请求头' } })
        return
      }
      const { goalType } = req.body
      const user = await service.updateGoalType(userId, goalType)
      res.json({ data: user })
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
