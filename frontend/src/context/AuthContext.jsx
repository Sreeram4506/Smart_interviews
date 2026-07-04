import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

const ROLE_ROUTES = {
  student: '/student/feedback',
  mess_owner: '/owner/overview',
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('messpulse_token')
    const saved = localStorage.getItem('messpulse_user')
    if (token && saved) {
      try {
        return JSON.parse(saved)
      } catch {
        localStorage.removeItem('messpulse_token')
        localStorage.removeItem('messpulse_user')
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      localStorage.setItem('messpulse_token', data.token)
      localStorage.setItem('messpulse_user', JSON.stringify(data.user))
      setAuth(data.user)
      return data.user
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, password, role, name) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/register', { username, password, role, name })
      localStorage.setItem('messpulse_token', data.token)
      localStorage.setItem('messpulse_user', JSON.stringify(data.user))
      setAuth(data.user)
      return data.user
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setAuth(null)
    setError(null)
    localStorage.removeItem('messpulse_token')
    localStorage.removeItem('messpulse_user')
  }, [])

  const value = {
    user: auth,
    role: auth?.role ?? null,
    isAuthenticated: !!auth,
    loading,
    error,
    clearError,
    login,
    register,
    logout,
    homeRoute: auth ? ROLE_ROUTES[auth.role] : '/login',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
