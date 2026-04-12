// Sistema de autenticacion simple para RYNO
// Almacena sesion en localStorage

export interface AuthUser {
  id: string
  username: string
  displayName: string
}

const AUTH_KEY = 'ryno_auth_user'

/**
 * Verifica si el usuario esta autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  const user = localStorage.getItem(AUTH_KEY)
  return user !== null
}

/**
 * Obtiene el usuario actual de localStorage
 */
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(AUTH_KEY)
  if (!user) return null
  try {
    return JSON.parse(user) as AuthUser
  } catch {
    return null
  }
}

/**
 * Guarda el usuario en localStorage despues de login exitoso
 */
export function setUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

/**
 * Realiza login contra la API
 */
export async function login(username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.success && data.user) {
      setUser(data.user)
      return { success: true, user: data.user }
    }

    return { success: false, error: data.error || 'Error de autenticacion' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Error de conexion' }
  }
}

/**
 * Cierra sesion eliminando datos de localStorage
 */
export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
}
