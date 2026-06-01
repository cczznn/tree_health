import { getPool } from '../db/connection'
import type { UserRow } from './auth-service'

function toMysqlDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export class MysqlUserRepository {
  async findByName(name: string): Promise<UserRow | null> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, password_hash, goal_type, created_at FROM users WHERE name = ?',
      [name],
    ) as any
    if (rows.length === 0) return null
    const r = rows[0]
    return { id: r.id, name: r.name, password_hash: r.password_hash, goal_type: r.goal_type, created_at: r.created_at }
  }

  async findById(id: string): Promise<UserRow | null> {
    const pool = getPool()
    const [rows] = await pool.execute(
      'SELECT id, name, password_hash, goal_type, created_at FROM users WHERE id = ?',
      [id],
    ) as any
    if (rows.length === 0) return null
    const r = rows[0]
    return { id: r.id, name: r.name, password_hash: r.password_hash, goal_type: r.goal_type, created_at: r.created_at }
  }

  async create(user: UserRow): Promise<void> {
    const pool = getPool()
    await pool.execute(
      'INSERT INTO users (id, name, password_hash, goal_type, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.name, user.password_hash, user.goal_type, toMysqlDatetime(user.created_at)],
    )
  }

  async update(id: string, user: UserRow): Promise<UserRow> {
    const pool = getPool()
    await pool.execute(
      'UPDATE users SET goal_type = ?, password_hash = ? WHERE id = ?',
      [user.goal_type, user.password_hash, id],
    )
    return user
  }
}
