import { randomUUID } from 'node:crypto'
import { getPool } from './connection'
import { PRESET_FOODS } from '../foods/preset-foods'
import { runSchema } from './schema'

export async function runSeed(): Promise<void> {
  const pool = getPool()
  await runSchema()

  // Create demo user if not exists
  await pool.execute(
    `INSERT IGNORE INTO users (id, name, goal_type) VALUES (?, ?, ?)`,
    ['demo-user', 'Demo User', 'maintain'],
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
}
