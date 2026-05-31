const STORAGE_KEY = 'health_user'

export interface AuthUser {
  id: string
  name: string
  goalType: string
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getUserId(): string {
  return getStoredUser()?.id ?? 'demo-user'
}
