import fs from 'fs'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { beginNewAppContext, getAppContext } from './app-context'
import { createFoodRouter } from './api/foods'
import { createMealRecordsRouter } from './api/meal-records'
import { createStatsRouter } from './api/stats'
import { createWorkoutPlansRouter } from './api/workout-plans'
import { createWorkoutCheckinsRouter } from './api/workout-checkins'
import { createBodyMetricsRouter } from './api/body-metrics'
import { createRecommendationsRouter } from './api/recommendations'
import { createAuthRouter } from './api/auth'

const PORT = parseInt(process.env.PORT || '3000', 10) || 3000

async function main() {
  // Try MySQL if configured, skip silently if not available
  let mysqlUserRepo: any = undefined
  try {
    const { runSeed } = await import('./db/seed')
    const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    await Promise.race([runSeed(), timeout])
    const { MysqlUserRepository } = await import('./auth/mysql-user-repository')
    mysqlUserRepo = new MysqlUserRepository()
    console.log('Database initialized (MySQL)')
  } catch {
    console.warn('MySQL seed skipped — user data will use in-memory fallback')
  }

  beginNewAppContext(mysqlUserRepo)

  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
    next()
  })

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Calorie target
  app.get('/api/calorie-target', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string | undefined
      if (!userId) { res.status(400).json({ error: { code: 'MISSING_USER_ID', message: '缺少 X-User-Id' } }); return }

      const { calcDailyTarget } = await import('./lib/calorie-calc')
      const ctx = getAppContext()

      const user = await ctx.userRepo.findById(userId)
      if (!user) { res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } }); return }
      if (!user.age || !user.gender) {
        res.json({ data: { ready: false, message: '请先在"我的"页面设置性别和年龄' } })
        return
      }

      const metrics = await ctx.bodyMetricRepo.findByUser(userId)
      const latest = metrics.sort((a: any, b: any) => b.metricDate.localeCompare(a.metricDate))[0]
      if (!latest || !latest.weight || !latest.height) {
        res.json({ data: { ready: false, message: '请先在"身体"页面录入体重和身高' } })
        return
      }

      const result = calcDailyTarget({
        weightKg: latest.weight,
        heightCm: latest.height,
        age: user.age,
        gender: user.gender,
        goalType: user.goal_type as any,
      })
      res.json({ data: { ready: true, ...result } })
    } catch (err: any) {
      res.status(500).json({ error: { code: 'ERROR', message: err.message } })
    }
  })

  // Serve H5 frontend static files first
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const distPath = path.join(__dirname, '..', 'dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
  }

  // API routes — after static files, before SPA fallback
  app.use('/api/auth', createAuthRouter(getAppContext().userRepo))
  app.use('/api/foods', createFoodRouter())
  app.use('/api/meal-records', createMealRecordsRouter())
  app.use('/api/stats', createStatsRouter())
  app.use('/api/workout-plans', createWorkoutPlansRouter())
  app.use('/api/workout-checkins', createWorkoutCheckinsRouter())
  app.use('/api/body-metrics', createBodyMetricsRouter())
  app.use('/api/recommendations', createRecommendationsRouter())

  // SPA fallback — last, catches non-API non-static requests
  if (fs.existsSync(distPath)) {
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
  })
}

main()
