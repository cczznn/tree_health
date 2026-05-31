import type { UserRow } from './auth-service'

export class InMemoryUserRepository {
  private store = new Map<string, UserRow>()

  async findByName(name: string): Promise<UserRow | null> {
    for (const user of this.store.values()) {
      if (user.name === name) return user
    }
    return null
  }

  async create(user: UserRow): Promise<void> {
    this.store.set(user.id, { ...user })
  }
}
