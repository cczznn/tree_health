import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getPool } from './connection'
import { PRESET_FOODS } from '../foods/preset-foods'
import { runSchema } from './schema'

export async function runSeed(): Promise<void> {
  const pool = getPool()
  await runSchema()

  // Seed admin user (admin / admin123)
  const adminHash = await bcrypt.hash('admin123', 10)
  await pool.execute(
    `INSERT INTO users (id, name, password_hash, goal_type) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin-user', 'admin', adminHash, 'maintain'],
  )

  // Seed preset foods
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM foods WHERE source_type = ?', ['preset'])
  const count = (rows as Array<{ cnt: number }>)[0]?.cnt ?? 0
  if (count === 0) {
    for (const food of PRESET_FOODS) {
      await pool.execute(
        `INSERT INTO foods (id, user_id, name, source_type, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `preset-${randomUUID().slice(0, 8)}`,
          null,
          food.name,
          food.sourceType,
          food.caloriesPer100g,
          food.proteinPer100g,
          food.fatPer100g,
          food.carbsPer100g,
          food.fiberPer100g,
          food.sugarPer100g,
          food.sodiumPer100g,
        ],
      )
    }
  }

  // Seed default workout plan
  const [planRows] = await pool.execute('SELECT COUNT(*) as cnt FROM workout_plans WHERE id = ?', ['wp-1'])
  const planCount = (planRows as Array<{ cnt: number }>)[0]?.cnt ?? 0
  if (planCount === 0) {
    await pool.execute(
      `INSERT INTO workout_plans (id, user_id, title, goal_type, frequency_per_week, duration_minutes, plan_content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      ['wp-1', 'system', '新手入门训练计划', 'maintain', 3, 30, JSON.stringify({
        summary: '每周 3 次全身训练，适合新手入门',
        notes: '训练前后做好热身与拉伸，量力而行',
        weeklySchedule: [
          { dayLabel: '周一', focus: '上肢 + 有氧', durationMinutes: 30, exercises: ['俯卧撑 3×12', '哑铃弯举 3×10', '慢跑 15 分钟'] },
          { dayLabel: '周三', focus: '下肢 + 核心', durationMinutes: 30, exercises: ['深蹲 3×15', '弓步走 3×12', '平板支撑 3×30 秒'] },
          { dayLabel: '周五', focus: '全身 + 有氧', durationMinutes: 30, exercises: ['波比跳 3×10', '开合跳 3×20', '轻松骑行 15 分钟'] },
        ],
      })],
    )
  }
}
