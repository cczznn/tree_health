import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { ValidationError, AppError } from '../domain/errors'
import type { GoalType } from '../domain/types'

export interface UserRow {
  id: string
  name: string
  password_hash: string
  goal_type: GoalType
  created_at: string
}

export interface IUserRepository {
  findByName(name: string): Promise<UserRow | null>
  create(user: UserRow): Promise<void>
}

export class AuthService {
  constructor(private readonly userRepo: IUserRepository) {}

  async register(name: string, password: string, goalType: GoalType = 'maintain') {
    if (!name || name.trim().length < 2) throw new ValidationError('用户名至少 2 个字符')
    if (!password || password.length < 4) throw new ValidationError('密码至少 4 位')

    const existing = await this.userRepo.findByName(name.trim())
    if (existing) throw new AppError('USER_EXISTS', 409, '用户名已存在')

    const passwordHash = await bcrypt.hash(password, 10)
    const user: UserRow = {
      id: randomUUID(),
      name: name.trim(),
      password_hash: passwordHash,
      goal_type: goalType,
      created_at: new Date().toISOString(),
    }

    await this.userRepo.create(user)
    return { id: user.id, name: user.name, goalType: user.goal_type }
  }

  async login(name: string, password: string) {
    if (!name || !password) throw new ValidationError('请输入用户名和密码')

    const user = await this.userRepo.findByName(name.trim())
    if (!user) throw new AppError('AUTH_FAILED', 401, '用户名或密码错误')

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new AppError('AUTH_FAILED', 401, '用户名或密码错误')

    return { id: user.id, name: user.name, goalType: user.goal_type }
  }
}
