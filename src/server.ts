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

const PORT = parseInt(process.env.PORT || '3000', 10)

async function main() {
  // Try MySQL if configured, skip silently if not available
  try {
    const { runSeed } = await import('./db/seed')
    const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    await Promise.race([runSeed(), timeout])
    console.log('Database initialized (MySQL)')
  } catch {
    console.warn('Database init skipped (using in-memory storage)')
  }

  beginNewAppContext()

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
