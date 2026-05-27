import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'health',
      password: process.env.DB_PASSWORD || 'health123',
      database: process.env.DB_NAME || 'health_app',
      waitForConnections: true,
      connectionLimit: 5,
    })
  }
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
