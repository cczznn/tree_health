import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { ValidationError, AppError } from '../domain/errors'
import type { GoalType } from '../domain/types'

export interface UserRow {
  id: string
  name: string
  password_hash: string
  goal_type: GoalType
  age: number | null
  gender: 'male' | 'female' | null
  weight: number | null
  height: number | null
  created_at: string
}

export interface IUserRepository {
  findByName(name: string): Promise<UserRow | null>
  findById(id: string): Promise<UserRow | null>
  create(user: UserRow): Promise<void>
  update(id: string, user: UserRow): Promise<UserRow>
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
      age: null,
      gender: null,
      weight: null,
      height: null,
      created_at: new Date().toISOString(),
    }

    await this.userRepo.create(user)
    return { id: user.id, name: user.name, goalType: user.goal_type, age: user.age, gender: user.gender, weight: user.weight, height: user.height }
  }

  async login(name: string, password: string) {
    if (!name || !password) throw new ValidationError('请输入用户名和密码')

    const user = await this.userRepo.findByName(name.trim())
    if (!user) throw new AppError('AUTH_FAILED', 401, '用户名或密码错误')

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new AppError('AUTH_FAILED', 401, '用户名或密码错误')

    return { id: user.id, name: user.name, goalType: user.goal_type, age: user.age, gender: user.gender, weight: user.weight, height: user.height }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new AppError('USER_NOT_FOUND', 404, '用户不存在')
    return { id: user.id, name: user.name, goalType: user.goal_type, age: user.age, gender: user.gender, weight: user.weight, height: user.height }
  }

  async updateGoalType(userId: string, goalType: GoalType) {
    const validTypes: GoalType[] = ['fat_loss', 'muscle_gain', 'maintain']
    if (!validTypes.includes(goalType)) throw new ValidationError('无效的目标类型')

    const user = await this.userRepo.findById(userId)
    if (!user) throw new AppError('USER_NOT_FOUND', 404, '用户不存在')

    const updated = { ...user, goal_type: goalType }
    await this.userRepo.update(userId, updated)
    return { id: updated.id, name: updated.name, goalType: updated.goal_type, age: updated.age, gender: updated.gender, weight: updated.weight, height: updated.height }
  }

  async updateProfile(userId: string, data: { age?: number | null; gender?: 'male' | 'female' | null; weight?: number | null; height?: number | null }): Promise<{ id: string; name: string; goalType: GoalType; age: number | null; gender: 'male' | 'female' | null; weight: number | null; height: number | null }> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new AppError('USER_NOT_FOUND', 404, '用户不存在')

    const updated = { ...user }
    if (data.age !== undefined) {
      if (data.age !== null && (data.age < 10 || data.age > 120)) throw new ValidationError('年龄需在 10-120 之间')
      updated.age = data.age
    }
    if (data.gender !== undefined) {
      if (data.gender !== null && !['male', 'female'].includes(data.gender)) throw new ValidationError('性别无效')
      updated.gender = data.gender
    }
    if (data.weight !== undefined) updated.weight = data.weight
    if (data.height !== undefined) updated.height = data.height
    await this.userRepo.update(userId, updated)
    return { id: updated.id, name: updated.name, goalType: updated.goal_type, age: updated.age, gender: updated.gender, weight: updated.weight, height: updated.height }
  }
}
