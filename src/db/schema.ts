import { getPool } from './connection'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  goal_type ENUM('fat_loss', 'muscle_gain', 'maintain') NOT NULL DEFAULT 'maintain',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS foods (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT NULL,
  name VARCHAR(200) NOT NULL,
  source_type ENUM('preset', 'custom') NOT NULL DEFAULT 'preset',
  calories_per_100g DECIMAL(8,2) NOT NULL,
  protein_per_100g DECIMAL(6,2) NOT NULL,
  fat_per_100g DECIMAL(6,2) NOT NULL,
  carbs_per_100g DECIMAL(6,2) NOT NULL,
  fiber_per_100g DECIMAL(6,2) DEFAULT NULL,
  sugar_per_100g DECIMAL(6,2) DEFAULT NULL,
  sodium_per_100g DECIMAL(8,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_foods_name (name),
  INDEX idx_foods_user (user_id)
);

CREATE TABLE IF NOT EXISTS meal_records (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  food_id VARCHAR(36) NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  amount DECIMAL(6,2) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT '份',
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(6,2) NOT NULL,
  fat DECIMAL(6,2) NOT NULL,
  carbs DECIMAL(6,2) NOT NULL,
  fiber DECIMAL(6,2) NOT NULL DEFAULT 0,
  sugar DECIMAL(6,2) NOT NULL DEFAULT 0,
  sodium DECIMAL(8,2) NOT NULL DEFAULT 0,
  record_date DATE NOT NULL,
  note TEXT DEFAULT NULL,
  INDEX idx_meal_records_user_date (user_id, record_date)
);

CREATE TABLE IF NOT EXISTS daily_meal_summaries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  summary_date DATE NOT NULL,
  meal_count INT NOT NULL DEFAULT 0,
  total_calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_fiber DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_sugar DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_sodium DECIMAL(8,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_summary_user_date (user_id, summary_date)
);

CREATE TABLE IF NOT EXISTS workout_plans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  goal_type ENUM('fat_loss', 'muscle_gain', 'maintain') NOT NULL,
  frequency_per_week INT NOT NULL DEFAULT 3,
  duration_minutes INT NOT NULL DEFAULT 30,
  plan_content JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_plans_user (user_id)
);

CREATE TABLE IF NOT EXISTS workout_checkins (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  checkin_date DATE NOT NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_checkins_user_date (user_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  metric_date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  waist DECIMAL(5,2) DEFAULT NULL,
  hip DECIMAL(5,2) DEFAULT NULL,
  thigh DECIMAL(5,2) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  INDEX idx_metrics_user_date (user_id, metric_date)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  rec_date DATE NOT NULL,
  type ENUM('diet', 'exercise', 'daily_summary') NOT NULL,
  content TEXT NOT NULL,
  source_data_summary JSON NOT NULL,
  INDEX idx_recs_user_date (user_id, rec_date)
);
`

export async function runSchema(): Promise<void> {
  const pool = getPool()
  const statements = SCHEMA_SQL.split(';').map((s) => s.trim()).filter((s) => s.length > 0)
  for (const sql of statements) {
    await pool.execute(sql)
  }
}
