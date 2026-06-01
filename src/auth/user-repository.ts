import type { UserRow } from './auth-service'

export class InMemoryUserRepository {
  store = new Map<string, UserRow>()

  async findByName(name: string): Promise<UserRow | null> {
    for (const user of this.store.values()) {
      if (user.name === name) return user
    }
    return null
  }

  async create(user: UserRow): Promise<void> {
    this.store.set(user.id, { ...user })
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.store.get(id) ?? null
  }

  async update(id: string, user: UserRow): Promise<UserRow> {
    const existing = this.store.get(id)
    if (!existing) throw new Error(`User ${id} not found`)
    this.store.set(id, { ...user })
    return user
  }
}
