import { getPool } from '../db/connection'
import type { Food, MealRecord, DailyMealSummary, WorkoutPlan, WorkoutCheckin, BodyMetric } from '../domain/types'
import { NotFoundError } from '../domain/errors'

function toMysqlDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// --------------- Food ---------------
export class MysqlFoodRepository {
  async search(query: string, userId?: string): Promise<Food[]> {
    const pool = getPool()
    const keyword = `%${query.toLowerCase().trim()}%`
    const [rows] = await pool.execute(
      `SELECT * FROM foods WHERE (source_type = 'preset' OR (source_type = 'custom' AND user_id = ?)) AND LOWER(name) LIKE ?`,
      [userId ?? '', keyword],
    ) as any
    return rows.map(rowToFood)
  }

  async getById(id: string): Promise<Food> {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM foods WHERE id = ?', [id]) as any
    if (rows.length === 0) throw new NotFoundError('Food', id)
    return rowToFood(rows[0])
  }

  async create(food: Food): Promise<Food> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO foods (id, user_id, name, source_type, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [food.id, food.userId, food.name, food.sourceType, food.caloriesPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g, food.fiberPer100g, food.sugarPer100g, food.sodiumPer100g, toMysqlDatetime(food.createdAt)],
    )
    return food
  }

  async update(id: string, food: Food): Promise<Food> {
    const pool = getPool()
    await pool.execute(
      `UPDATE foods SET name=?, calories_per_100g=?, protein_per_100g=?, fat_per_100g=?, carbs_per_100g=?, fiber_per_100g=?, sugar_per_100g=?, sodium_per_100g=? WHERE id=?`,
      [food.name, food.caloriesPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g, food.fiberPer100g, food.sugarPer100g, food.sodiumPer100g, id],
    )
    return food
  }

  async delete(id: string): Promise<void> {
    const pool = getPool()
    await pool.execute('DELETE FROM foods WHERE id = ?', [id])
  }

  async countCustomByUser(userId: string): Promise<number> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM foods WHERE source_type = ? AND user_id = ?',
      ['custom', userId],
    ) as any
    return rows[0].cnt as number
  }

  async findCustomByUser(userId: string): Promise<Food[]> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM foods WHERE source_type = ? AND user_id = ?',
      ['custom', userId],
    ) as any
    return rows.map(rowToFood)
  }
}

function rowToFood(r: any): Food {
  return {
    id: r.id, userId: r.user_id, name: r.name, sourceType: r.source_type,
    caloriesPer100g: Number(r.calories_per_100g), proteinPer100g: Number(r.protein_per_100g),
    fatPer100g: Number(r.fat_per_100g), carbsPer100g: Number(r.carbs_per_100g),
    fiberPer100g: r.fiber_per_100g !== null ? Number(r.fiber_per_100g) : null,
    sugarPer100g: r.sugar_per_100g !== null ? Number(r.sugar_per_100g) : null,
    sodiumPer100g: r.sodium_per_100g !== null ? Number(r.sodium_per_100g) : null,
    createdAt: r.created_at,
  }
}

// --------------- MealRecord ---------------
export class MysqlMealRecordRepository {
  async findByUserAndDate(userId: string, date: string): Promise<MealRecord[]> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM meal_records WHERE user_id = ? AND record_date = ?',
      [userId, date],
    ) as any
    return rows.map(rowToMealRecord)
  }

  async getById(id: string): Promise<MealRecord> {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM meal_records WHERE id = ?', [id]) as any
    if (rows.length === 0) throw new NotFoundError('MealRecord', id)
    return rowToMealRecord(rows[0])
  }

  async create(record: MealRecord): Promise<MealRecord> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO meal_records (id, user_id, food_id, meal_type, amount, unit, calories, protein, fat, carbs, fiber, sugar, sodium, record_date, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.userId, record.foodId, record.mealType, record.amount, record.unit, record.calories, record.protein, record.fat, record.carbs, record.fiber, record.sugar, record.sodium, record.recordDate, record.note],
    )
    return record
  }

  async update(id: string, data: Partial<MealRecord>): Promise<MealRecord> {
    const pool = getPool()
    const existing = await this.getById(id)
    const updated = { ...existing, ...data, id }
    await pool.execute(
      `UPDATE meal_records SET food_id=?, meal_type=?, amount=?, unit=?, calories=?, protein=?, fat=?, carbs=?, fiber=?, sugar=?, sodium=?, record_date=?, note=? WHERE id=?`,
      [updated.foodId, updated.mealType, updated.amount, updated.unit, updated.calories, updated.protein, updated.fat, updated.carbs, updated.fiber, updated.sugar, updated.sodium, updated.recordDate, updated.note, id],
    )
    return updated
  }

  async delete(id: string): Promise<void> {
    const pool = getPool()
    await pool.execute('DELETE FROM meal_records WHERE id = ?', [id])
  }
}

function rowToMealRecord(r: any): MealRecord {
  return {
    id: r.id, userId: r.user_id, foodId: r.food_id, mealType: r.meal_type,
    amount: Number(r.amount), unit: r.unit,
    calories: Number(r.calories), protein: Number(r.protein), fat: Number(r.fat), carbs: Number(r.carbs),
    fiber: Number(r.fiber), sugar: Number(r.sugar), sodium: Number(r.sodium),
    recordDate: r.record_date instanceof Date ? r.record_date.toISOString().slice(0, 10) : String(r.record_date).slice(0, 10),
    note: r.note,
  }
}

// --------------- DailyMealSummary ---------------
export class MysqlDailyMealSummaryRepository {
  async findByUserAndDate(userId: string, date: string): Promise<DailyMealSummary | null> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM daily_meal_summaries WHERE user_id = ? AND summary_date = ?',
      [userId, date],
    ) as any
    if (rows.length === 0) return null
    return rowToSummary(rows[0])
  }

  async create(summary: DailyMealSummary): Promise<DailyMealSummary> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO daily_meal_summaries (id, user_id, summary_date, meal_count, total_calories, total_protein, total_fat, total_carbs, total_fiber, total_sugar, total_sodium)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE meal_count=VALUES(meal_count), total_calories=VALUES(total_calories), total_protein=VALUES(total_protein), total_fat=VALUES(total_fat), total_carbs=VALUES(total_carbs), total_fiber=VALUES(total_fiber), total_sugar=VALUES(total_sugar), total_sodium=VALUES(total_sodium)`,
      [summary.id, summary.userId, summary.summaryDate, summary.mealCount, summary.totalCalories, summary.totalProtein, summary.totalFat, summary.totalCarbs, summary.totalFiber, summary.totalSugar, summary.totalSodium],
    )
    return summary
  }

  async update(id: string, data: Partial<DailyMealSummary>): Promise<DailyMealSummary> {
    const pool = getPool()
    const existing = await this.getById(id)
    const updated = { ...existing, ...data, id }
    await pool.execute(
      `UPDATE daily_meal_summaries SET meal_count=?, total_calories=?, total_protein=?, total_fat=?, total_carbs=?, total_fiber=?, total_sugar=?, total_sodium=? WHERE id=?`,
      [updated.mealCount, updated.totalCalories, updated.totalProtein, updated.totalFat, updated.totalCarbs, updated.totalFiber, updated.totalSugar, updated.totalSodium, id],
    )
    return updated
  }

  async getById(id: string): Promise<DailyMealSummary> {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM daily_meal_summaries WHERE id = ?', [id]) as any
    if (rows.length === 0) throw new NotFoundError('DailyMealSummary', id)
    return rowToSummary(rows[0])
  }
}

function rowToSummary(r: any): DailyMealSummary {
  return {
    id: r.id, userId: r.user_id, summaryDate: String(r.summary_date).slice(0, 10),
    mealCount: Number(r.meal_count), totalCalories: Number(r.total_calories),
    totalProtein: Number(r.total_protein), totalFat: Number(r.total_fat),
    totalCarbs: Number(r.total_carbs), totalFiber: Number(r.total_fiber),
    totalSugar: Number(r.total_sugar), totalSodium: Number(r.total_sodium),
    updatedAt: r.updated_at || '',
  }
}

// --------------- WorkoutPlan ---------------
export class MysqlWorkoutPlanRepository {
  async getById(id: string): Promise<WorkoutPlan> {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM workout_plans WHERE id = ?', [id]) as any
    if (rows.length === 0) throw new NotFoundError('WorkoutPlan', id)
    return rowToPlan(rows[0])
  }

  async findAll(): Promise<WorkoutPlan[]> {
    const pool = getPool()
    const [rows] = await pool.execute('SELECT * FROM workout_plans') as any
    return rows.map(rowToPlan)
  }

  async create(plan: WorkoutPlan): Promise<WorkoutPlan> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO workout_plans (id, user_id, title, goal_type, frequency_per_week, duration_minutes, plan_content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [plan.id, plan.userId, plan.title, plan.goalType, plan.frequencyPerWeek, plan.durationMinutes, JSON.stringify(plan.planContent), toMysqlDatetime(plan.createdAt)],
    )
    return plan
  }
}

function rowToPlan(r: any): WorkoutPlan {
  return {
    id: r.id, userId: r.user_id, title: r.title, goalType: r.goal_type,
    frequencyPerWeek: Number(r.frequency_per_week), durationMinutes: Number(r.duration_minutes),
    planContent: typeof r.plan_content === 'string' ? JSON.parse(r.plan_content) : r.plan_content,
    createdAt: r.created_at,
  }
}

// --------------- WorkoutCheckin ---------------
export class MysqlWorkoutCheckinRepository {
  async findByUserPlanAndDate(userId: string, planId: string, date: string): Promise<WorkoutCheckin[]> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM workout_checkins WHERE user_id = ? AND plan_id = ? AND checkin_date = ?',
      [userId, planId, date],
    ) as any
    return rows.map(rowToCheckin)
  }

  async create(checkin: WorkoutCheckin): Promise<WorkoutCheckin> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO workout_checkins (id, user_id, plan_id, checkin_date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [checkin.id, checkin.userId, checkin.planId, checkin.date, checkin.note, toMysqlDatetime(checkin.createdAt)],
    )
    return checkin
  }

  async findAll(filter?: Partial<WorkoutCheckin>): Promise<WorkoutCheckin[]> {
    const pool = getPool()
    let sql = 'SELECT * FROM workout_checkins'
    const params: any[] = []
    if (filter?.userId) { sql += ' WHERE user_id = ?'; params.push(filter.userId) }
    const [rows] = await pool.execute(sql, params) as any
    return rows.map(rowToCheckin)
  }
}

function rowToCheckin(r: any): WorkoutCheckin {
  return {
    id: r.id, userId: r.user_id, planId: r.plan_id,
    date: String(r.checkin_date).slice(0, 10),
    status: 'completed' as const, note: r.note,
    createdAt: r.created_at,
  }
}

// --------------- BodyMetric ---------------
export class MysqlBodyMetricRepository {
  async findByUser(userId: string): Promise<BodyMetric[]> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY metric_date DESC',
      [userId],
    ) as any
    return rows.map(rowToMetric)
  }

  async findByUserAndDateRange(userId: string, startDate: string, endDate: string): Promise<BodyMetric[]> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT * FROM body_metrics WHERE user_id = ? AND metric_date >= ? AND metric_date <= ? ORDER BY metric_date',
      [userId, startDate, endDate],
    ) as any
    return rows.map(rowToMetric)
  }

  async create(metric: BodyMetric): Promise<BodyMetric> {
    const pool = getPool()
    await pool.execute(
      `INSERT INTO body_metrics (id, user_id, metric_date, weight, waist, hip, thigh, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [metric.id, metric.userId, metric.metricDate, metric.weight, metric.waist, metric.hip, metric.thigh, metric.note],
    )
    return metric
  }
}

function rowToMetric(r: any): BodyMetric {
  return {
    id: r.id, userId: r.user_id,
    metricDate: String(r.metric_date).slice(0, 10),
    weight: Number(r.weight), waist: r.waist !== null ? Number(r.waist) : null,
    hip: r.hip !== null ? Number(r.hip) : null, thigh: r.thigh !== null ? Number(r.thigh) : null,
    note: r.note,
  }
}
