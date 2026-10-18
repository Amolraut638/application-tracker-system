import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../services/apiClient.js'

/**
 * AuthContext — provides:
 *   recruiter   : { id, name, email } | null
 *   isLoading   : boolean  (true while checking session on mount)
 *   login(email, password)   → throws on failure
 *   register(name, email, password) → throws on failure
 *   logout()
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [recruiter, setRecruiter] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // start loading until /me check completes

  // ── Check existing session on mount ───────────────────
  // validateStatus treats 401 as a resolved response (not an error) so the
  // browser doesn't log a red network error — a 401 just means "not logged in".
  useEffect(() => {
    apiClient
      .get('/auth/me', { validateStatus: (s) => s === 200 || s === 401 })
      .then((res) => setRecruiter(res.status === 200 ? res.data.recruiter : null))
      .catch(() => setRecruiter(null))
      .finally(() => setIsLoading(false))
  }, [])

  // ── Login ─────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password })
    setRecruiter(res.data.recruiter)
    return res.data.recruiter
  }, [])

  // ── Register ──────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const res = await apiClient.post('/auth/register', { name, email, password })
    setRecruiter(res.data.recruiter)
    return res.data.recruiter
  }, [])

  // ── Logout ────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Even if the API call fails, clear client state
    }
    setRecruiter(null)
  }, [])

  return (
    <AuthContext.Provider value={{ recruiter, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook — must be used inside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
