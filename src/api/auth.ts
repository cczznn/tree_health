import { Router, type Request, type Response } from 'express'
import { AuthService, type UserRow } from '../auth/auth-service'
import type { GoalType } from '../domain/types'
import { AppError } from '../domain/errors'

export function createAuthRouter(userRepo: { findByName(name: string): Promise<UserRow | null>; create(user: UserRow): Promise<void> }) {
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

  return router
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } })
    return
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务内部错误' } })
}
